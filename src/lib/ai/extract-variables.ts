import { prisma } from '@/lib/prisma';
import { anthropic } from './claude-client';
import { buildExtractionPrompt } from './extraction-prompt';
import { downloadFilesRaw, buffersToContentBlocks } from './file-utils';
import { extractPdfVectorData } from './pdf-vector-extract';
import { formatVectorDataForPrompt } from './pdf-vector-summary';
import type { PdfVectorExtractionResult } from './pdf-vector-extract';
import { computeDerivedValues } from './types';
import type { ExtractedVariables, FloorPlan } from './types';

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

    // Download raw files from Supabase (buffers)
    const downloads = await downloadFilesRaw(filesToUse);

    if (downloads.length === 0) {
      throw new Error('Não foi possível baixar nenhum arquivo');
    }

    // Convert to Claude content blocks
    const fileContents = buffersToContentBlocks(downloads);

    // Extract vector data from PDFs (fallback silencioso se falhar)
    let vectorSummary: string | null = null;
    let vectorDataUsed = false;
    try {
      const vectorResults: PdfVectorExtractionResult[] = [];
      for (const dl of downloads) {
        if (dl.mediaType === 'application/pdf') {
          const result = await extractPdfVectorData(dl.buffer, dl.fileName);
          vectorResults.push(result);
        }
      }

      const vectorCount = vectorResults.filter((r) => r.isVectorPdf).length;
      if (vectorCount > 0) {
        vectorSummary = formatVectorDataForPrompt(vectorResults);
        vectorDataUsed = true;
        console.log(`📐 Dados vetoriais extraidos de ${vectorCount} PDF(s)`);
      } else {
        console.log('📐 Nenhum PDF vetorial detectado — usando apenas visão');
      }
    } catch (vectorError) {
      console.warn('⚠️ Erro na extração vetorial (fallback para visão pura):', vectorError);
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
      })),
      vectorSummary
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

    // Post-process floorPlans: resolve fileId from fileName
    if (extractedVars.floorPlans && extractedVars.floorPlans.length > 0) {
      for (const fp of extractedVars.floorPlans) {
        const matchedFile = files.find(
          (f) => f.fileName.toLowerCase() === fp.fileName.toLowerCase()
        );
        if (matchedFile) {
          fp.fileId = matchedFile.id;
        } else {
          console.warn(`FloorPlan fileName "${fp.fileName}" não encontrado nos arquivos do projeto`);
        }
      }

      // Soft validations for wall coordinates
      for (const wall of extractedVars.walls) {
        if (wall.floorPlanIndex != null) {
          if (wall.floorPlanIndex >= extractedVars.floorPlans.length) {
            console.warn(`Parede ${wall.id}: floorPlanIndex ${wall.floorPlanIndex} excede floorPlans.length ${extractedVars.floorPlans.length}`);
          }
          if (!wall.coordinates) {
            console.warn(`Parede ${wall.id}: tem floorPlanIndex mas sem coordinates`);
          }
        }
      }
    } else {
      console.warn('IA não retornou floorPlans (plantas baixas identificadas)');
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
    extractedVars.vectorDataUsed = vectorDataUsed;

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
