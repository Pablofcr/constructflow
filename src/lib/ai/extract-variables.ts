import { prisma } from '@/lib/prisma';
import { anthropic } from './claude-client';
import { buildExtractionPrompt } from './extraction-prompt';
import { downloadFilesAsBase64 } from './file-utils';
import { computeDerivedValues } from './types';
import type { ExtractedVariables } from './types';

function validateExtractedVariables(vars: ExtractedVariables): string[] {
  const errors: string[] = [];

  if (!vars.areaConstruida || vars.areaConstruida <= 0) {
    errors.push('areaConstruida deve ser > 0');
  }
  if (!vars.areaTerreno || vars.areaTerreno <= 0) {
    errors.push('areaTerreno deve ser > 0');
  }
  if (!vars.walls || vars.walls.length === 0) {
    errors.push('Nenhuma parede extraída');
  }
  if (!vars.heights) {
    errors.push('Alturas não informadas');
  }

  // Validate wall sequence
  const hWalls = vars.walls.filter((w) => w.direction === 'H').sort((a, b) => {
    const aNum = parseInt(a.id.replace('H', ''));
    const bNum = parseInt(b.id.replace('H', ''));
    return aNum - bNum;
  });
  const vWalls = vars.walls.filter((w) => w.direction === 'V').sort((a, b) => {
    const aNum = parseInt(a.id.replace('V', ''));
    const bNum = parseInt(b.id.replace('V', ''));
    return aNum - bNum;
  });

  // Check H sequence
  for (let i = 0; i < hWalls.length; i++) {
    const expected = `H${i}`;
    if (hWalls[i].id !== expected) {
      errors.push(`Sequência H incorreta: esperado ${expected}, encontrado ${hWalls[i].id}`);
      break;
    }
  }

  // Check V sequence
  for (let i = 0; i < vWalls.length; i++) {
    const expected = `V${i}`;
    if (vWalls[i].id !== expected) {
      errors.push(`Sequência V incorreta: esperado ${expected}, encontrado ${vWalls[i].id}`);
      break;
    }
  }

  // Validate wall lengths
  for (const wall of vars.walls) {
    if (wall.length <= 0) {
      errors.push(`Parede ${wall.id} tem comprimento inválido: ${wall.length}`);
    }
  }

  return errors;
}

export async function extractVariables(budgetAIId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Update status to EXTRACTING
    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: { status: 'EXTRACTING' },
    });

    // Fetch budget AI with project data
    const budgetAI = await prisma.budgetAI.findUnique({
      where: { id: budgetAIId },
      include: {
        project: {
          include: {
            files: true,
            budgetEstimated: { select: { constructedArea: true } },
          },
        },
      },
    });

    if (!budgetAI) throw new Error('BudgetAI não encontrado');

    const project = budgetAI.project;
    const files = project.files;

    if (files.length === 0) {
      throw new Error('Nenhum arquivo anexado ao projeto');
    }

    const filesToUse = files.slice(0, 8);

    // Download files from Supabase
    const fileContents = await downloadFilesAsBase64(filesToUse);

    if (fileContents.length === 0) {
      throw new Error('Não foi possível baixar nenhum arquivo');
    }

    // Build extraction prompt
    const constructedArea = project.budgetEstimated?.constructedArea || undefined;
    const { systemPrompt, userPrompt } = buildExtractionPrompt(
      {
        name: project.name,
        tipoObra: project.tipoObra,
        padraoEmpreendimento: project.padraoEmpreendimento,
        enderecoEstado: project.enderecoEstado,
        enderecoCidade: project.enderecoCidade,
        constructedArea,
      },
      filesToUse.map((f) => ({
        fileName: f.fileName,
        category: f.category,
      }))
    );

    // Call Claude API with extended thinking (all budget dedicated to reading PDFs)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...fileContents,
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    });

    // Extract text response (skip thinking blocks)
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude não retornou texto na extração');
    }

    // Parse JSON
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let extractedVars: ExtractedVariables;
    try {
      extractedVars = JSON.parse(jsonStr);
    } catch {
      throw new Error(`JSON inválido na extração: ${jsonStr.substring(0, 200)}`);
    }

    // Validate
    const validationErrors = validateExtractedVariables(extractedVars);
    if (validationErrors.length > 0) {
      console.warn('Avisos de validação na extração:', validationErrors);
      // Don't fail, just add notes
      extractedVars.aiNotes = (extractedVars.aiNotes || '') +
        '\n\nAvisos de validação: ' + validationErrors.join('; ');
    }

    // Compute derived values
    extractedVars.derived = computeDerivedValues(extractedVars);

    const durationMs = Date.now() - startTime;

    // Save to database
    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: {
        status: 'EXTRACTED',
        extractedVariables: extractedVars as object,
        extractionDurationMs: durationMs,
        extractedAt: new Date(),
        aiError: null,
        aiModel: 'claude-sonnet-4-5-20250929',
        aiPromptTokens: response.usage?.input_tokens || null,
        aiOutputTokens: response.usage?.output_tokens || null,
        filesUsed: filesToUse.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          category: f.category,
        })),
      },
    });

    console.log(`✅ Extração concluída em ${durationMs}ms — ${extractedVars.walls.length} paredes, ${extractedVars.openings.length} aberturas, ${extractedVars.rooms.length} ambientes`);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    console.error('Erro na extração de variáveis:', error);

    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: {
        status: 'FAILED',
        aiError: `Erro na extração: ${errorMessage}`,
        aiDurationMs: durationMs,
      },
    });
  }
}
