import { prisma } from '@/lib/prisma';
import { supabase, BUCKET_NAME } from '@/lib/supabase';
import { anthropic } from './claude-client';
import { buildBudgetPrompt } from './budget-prompt';
import { SINAPI_COMPOSITIONS } from '@/lib/sinapi-data';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';
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
      throw new Error('Nenhum arquivo PDF anexado ao projeto');
    }

    // Limit: max 4 PDFs
    const filesToUse = files.slice(0, 4);

    // Download PDFs from Supabase Storage as base64
    const pdfContents: Anthropic.Messages.DocumentBlockParam[] = [];

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

      pdfContents.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      });
    }

    if (pdfContents.length === 0) {
      throw new Error('Não foi possível baixar nenhum PDF');
    }

    // Build prompt
    const prompt = buildBudgetPrompt(
      {
        name: project.name,
        tipoObra: project.tipoObra,
        padraoEmpreendimento: project.padraoEmpreendimento,
        enderecoEstado: project.enderecoEstado,
        enderecoCidade: project.enderecoCidade,
        constructedArea: project.budgetEstimated?.constructedArea || undefined,
      },
      filesToUse.map((f) => ({
        fileName: f.fileName,
        category: f.category,
      }))
    );

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: [
            ...pdfContents,
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    // Extract text response
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

    // Build composition lookup
    const compositionByCode: Record<string, string> = {};
    const compositionPrices: Record<string, number> = {};

    const dbCompositions = await prisma.composition.findMany({
      select: { id: true, code: true, unitCost: true },
    });

    for (const comp of dbCompositions) {
      compositionByCode[comp.code] = comp.id;
      compositionPrices[comp.code] = Number(comp.unitCost);
    }

    // Also map from static data
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
        const unitPrice = Number(svc.unitPrice) || (svc.code ? compositionPrices[svc.code] || 0 : 0);
        const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
        const compositionId = svc.code ? compositionByCode[svc.code] || null : null;

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
            aiConfidence: Math.min(1, Math.max(0, Number(svc.aiConfidence) || 0.5)),
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
        aiModel: 'claude-sonnet-4-20250514',
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
