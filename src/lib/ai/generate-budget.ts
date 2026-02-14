import { prisma } from '@/lib/prisma';
import { supabase, BUCKET_NAME } from '@/lib/supabase';
import { anthropic } from './claude-client';
import { buildBudgetPrompt } from './budget-prompt';
import { SINAPI_COMPOSITIONS } from '@/lib/sinapi-data';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';
import { initializeProjectCompositions } from '@/lib/project-compositions';
import type Anthropic from '@anthropic-ai/sdk';

interface AIServiceResult {
  description: string;
  code: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  aiConfidence: number;
  aiReasoning: string;
}

interface AIStageResult {
  code: string;
  services: AIServiceResult[];
}

interface AIBudgetResult {
  stages: AIStageResult[];
}

interface ValidationWarning {
  type: 'EMPTY_STAGE' | 'LOW_QUANTITY' | 'FORBIDDEN_COMPOSITION' | 'MISSING_COMPOSITION' | 'COST_RANGE';
  message: string;
  stageCode?: string;
}

function validateAIBudget(
  result: AIBudgetResult,
  padraoEmpreendimento: string,
  constructedArea?: number
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const isPopular = padraoEmpreendimento === 'POPULAR';

  // Build sets of codes used
  const allCodes = new Set<string>();
  const stageServices: Record<string, AIServiceResult[]> = {};
  let totalCost = 0;

  for (const stage of result.stages) {
    stageServices[stage.code] = stage.services || [];
    for (const svc of stage.services || []) {
      if (svc.code) allCodes.add(svc.code);
      totalCost += (Number(svc.quantity) || 0) * (Number(svc.unitPrice) || 0);
    }
  }

  // Check mandatory stages are not empty
  const mandatoryStages = ['02', '04', '05', '08', '10', '11'];
  if (isPopular) {
    mandatoryStages.push('03', '09');
  }

  for (const code of mandatoryStages) {
    const services = stageServices[code] || [];
    if (services.length === 0) {
      const stageName = DEFAULT_STAGES.find(s => s.code === code)?.name || code;
      warnings.push({
        type: 'EMPTY_STAGE',
        message: `Etapa ${code} (${stageName}) está vazia — deveria ter serviços`,
        stageCode: code,
      });
    }
  }

  // Check revestimento quantities vs constructed area
  if (constructedArea) {
    const chapiscoCodes = ['SINAPI-87878', 'SINAPI-87879'];
    for (const stage of result.stages) {
      if (stage.code !== '08') continue;
      for (const svc of stage.services || []) {
        if (svc.code && chapiscoCodes.includes(svc.code)) {
          if (Number(svc.quantity) < constructedArea) {
            warnings.push({
              type: 'LOW_QUANTITY',
              message: `${svc.description} (${svc.code}): quantidade ${svc.quantity}m² é menor que área construída ${constructedArea}m² — deveria ser área de paredes (perímetro × pé-direito)`,
              stageCode: '08',
            });
          }
        }
      }
    }
  }

  // Popular-specific checks
  if (isPopular) {
    // Forbidden compositions for popular
    const forbidden = ['SINAPI-94970', 'SINAPI-88491'];
    for (const code of forbidden) {
      if (allCodes.has(code)) {
        warnings.push({
          type: 'FORBIDDEN_COMPOSITION',
          message: `Composição ${code} NÃO deve ser usada em padrão POPULAR`,
        });
      }
    }

    // Required compositions for popular
    const required = ['CF-02003', 'CF-02004', 'CF-03002', 'CF-09001'];
    for (const code of required) {
      if (!allCodes.has(code)) {
        warnings.push({
          type: 'MISSING_COMPOSITION',
          message: `Composição obrigatória ${code} não foi incluída no orçamento POPULAR`,
        });
      }
    }
  }

  // Cost per m² sanity check (excluding terreno stage 00)
  if (constructedArea && totalCost > 0) {
    const costPerM2 = totalCost / constructedArea;
    const minCost = isPopular ? 1200 : 1500;
    const maxCost = isPopular ? 3000 : 5000;

    if (costPerM2 < minCost || costPerM2 > maxCost) {
      warnings.push({
        type: 'COST_RANGE',
        message: `Custo/m² = R$${costPerM2.toFixed(0)} — fora da faixa esperada (R$${minCost}-${maxCost}/m²) para padrão ${padraoEmpreendimento}`,
      });
    }
  }

  return warnings;
}

function parseAiConfidence(raw: unknown): number {
  let confidence = Number(raw);
  if (isNaN(confidence) || confidence <= 0) {
    confidence = 0.5;
  } else if (confidence > 1) {
    // AI might return 85 instead of 0.85
    confidence = confidence / 100;
  }
  return Math.min(1, Math.max(0, confidence));
}

export async function generateAIBudget(budgetAIId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Update status to GENERATING
    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: { status: 'GENERATING' },
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
        stages: { orderBy: { order: 'asc' } },
      },
    });

    if (!budgetAI) throw new Error('BudgetAI não encontrado');

    const project = budgetAI.project;
    const files = project.files;

    if (files.length === 0) {
      throw new Error('Nenhum arquivo anexado ao projeto');
    }

    // Limit: max 8 files
    const filesToUse = files.slice(0, 8);

    // Detect file type from storage path extension
    const getMediaType = (path: string): string => {
      const ext = path.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'webp': return 'image/webp';
        default: return 'application/pdf';
      }
    };

    // Download files from Supabase Storage as base64
    const fileContents: Anthropic.Messages.ContentBlockParam[] = [];

    for (const file of filesToUse) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(file.storagePath);

      if (error || !data) {
        console.error(`Erro ao baixar ${file.fileName}:`, error);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mediaType = getMediaType(file.storagePath);

      if (mediaType === 'application/pdf') {
        fileContents.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        });
      } else {
        fileContents.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
            data: base64,
          },
        });
      }
    }

    if (fileContents.length === 0) {
      throw new Error('Não foi possível baixar nenhum arquivo');
    }

    // Build prompt (now returns { systemPrompt, userPrompt })
    const constructedArea = project.budgetEstimated?.constructedArea || undefined;
    const { systemPrompt, userPrompt } = buildBudgetPrompt(
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

    // Call Claude API with extended thinking
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
      throw new Error('Claude não retornou texto');
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let result: AIBudgetResult;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      throw new Error(`JSON inválido retornado pela IA: ${jsonStr.substring(0, 200)}`);
    }

    if (!result.stages || !Array.isArray(result.stages)) {
      throw new Error('Resposta da IA não contém stages');
    }

    // Post-generation validation (log warnings, don't block)
    const validationWarnings = validateAIBudget(
      result,
      project.padraoEmpreendimento,
      constructedArea
    );
    if (validationWarnings.length > 0) {
      console.warn('=== VALIDAÇÃO DO ORÇAMENTO IA ===');
      for (const w of validationWarnings) {
        console.warn(`[${w.type}]${w.stageCode ? ` Etapa ${w.stageCode}:` : ''} ${w.message}`);
      }
      console.warn(`Total: ${validationWarnings.length} warning(s)`);
      console.warn('=================================');
    }

    // Ensure project compositions are initialized (idempotent)
    const projectState = project.enderecoEstado || 'SP';
    await initializeProjectCompositions(project.id, projectState);

    // Build composition lookup from ProjectComposition (project-scoped prices)
    const compositionByCode: Record<string, string> = {};
    const projectCompositionByCode: Record<string, string> = {};
    const compositionPrices: Record<string, number> = {};

    const projectCompositions = await prisma.projectComposition.findMany({
      where: { projectId: project.id },
      select: { id: true, code: true, unitCost: true, sourceId: true },
    });

    for (const comp of projectCompositions) {
      projectCompositionByCode[comp.code] = comp.id;
      compositionPrices[comp.code] = Number(comp.unitCost);
      if (comp.sourceId) {
        compositionByCode[comp.code] = comp.sourceId;
      }
    }

    // Fallback: also map from global compositions for codes not in project
    const dbCompositions = await prisma.composition.findMany({
      select: { id: true, code: true, unitCost: true },
    });

    for (const comp of dbCompositions) {
      if (!compositionByCode[comp.code]) {
        compositionByCode[comp.code] = comp.id;
      }
      if (!compositionPrices[comp.code]) {
        compositionPrices[comp.code] = Number(comp.unitCost);
      }
    }

    // Also map from static data as last fallback
    for (const comp of SINAPI_COMPOSITIONS) {
      if (!compositionPrices[comp.code]) {
        compositionPrices[comp.code] = comp.baseCost;
      }
    }

    // Build stage lookup (budgetAI stages already created)
    const stageByCode: Record<string, string> = {};
    for (const stage of budgetAI.stages) {
      if (stage.code) stageByCode[stage.code] = stage.id;
    }

    let grandTotal = 0;

    // Process each stage from AI response
    for (const aiStage of result.stages) {
      const stageId = stageByCode[aiStage.code];
      if (!stageId) continue;
      if (!aiStage.services || aiStage.services.length === 0) continue;

      let stageTotal = 0;

      for (const svc of aiStage.services) {
        const quantity = Math.max(0, Number(svc.quantity) || 0);
        // Project composition price takes priority over AI-estimated price
        const unitPrice = (svc.code && compositionPrices[svc.code]) ? compositionPrices[svc.code] : (Number(svc.unitPrice) || 0);
        const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
        const compositionId = svc.code ? compositionByCode[svc.code] || null : null;
        const projectCompId = svc.code ? projectCompositionByCode[svc.code] || null : null;

        await prisma.budgetAIService.create({
          data: {
            stageId,
            description: svc.description,
            code: svc.code || null,
            unit: svc.unit,
            quantity,
            unitPrice,
            totalPrice,
            compositionId,
            projectCompositionId: projectCompId,
            aiConfidence: parseAiConfidence(svc.aiConfidence),
            aiReasoning: svc.aiReasoning || null,
          },
        });

        stageTotal += totalPrice;
      }

      grandTotal += stageTotal;
    }

    // Update stage totals and percentages
    for (const aiStage of result.stages) {
      const stageId = stageByCode[aiStage.code];
      if (!stageId) continue;

      // Recalculate from DB
      const services = await prisma.budgetAIService.findMany({
        where: { stageId },
        select: { totalPrice: true },
      });

      const stageTotal = services.reduce((sum, s) => sum + Number(s.totalPrice), 0);
      const percentage = grandTotal > 0 ? (stageTotal / grandTotal) * 100 : 0;

      await prisma.budgetAIStage.update({
        where: { id: stageId },
        data: {
          totalCost: stageTotal,
          percentage: Math.round(percentage * 100) / 100,
        },
      });
    }

    const durationMs = Date.now() - startTime;

    // Update budget AI with results
    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: {
        status: 'GENERATED',
        totalDirectCost: grandTotal,
        aiModel: 'claude-sonnet-4-5-20250929',
        aiPromptTokens: response.usage?.input_tokens || null,
        aiOutputTokens: response.usage?.output_tokens || null,
        aiDurationMs: durationMs,
        generatedAt: new Date(),
        filesUsed: filesToUse.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          category: f.category,
        })),
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    console.error('Erro na geração do orçamento IA:', error);

    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: {
        status: 'FAILED',
        aiError: errorMessage,
        aiDurationMs: durationMs,
      },
    });
  }
}
