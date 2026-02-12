import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/projects/[id]/compositions/items/[itemId]
// Updates a project composition item's price and cascades within the project only
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: projectId, itemId } = await params;
    const body = await request.json();
    const { unitPrice } = body;

    if (unitPrice === undefined) {
      return NextResponse.json({ error: 'unitPrice é obrigatório' }, { status: 400 });
    }

    const newPrice = Number(unitPrice);

    // Fetch the item to get its code
    const originalItem = await prisma.projectCompositionItem.findUnique({
      where: { id: itemId },
      include: {
        projectComposition: { select: { projectId: true } },
      },
    });

    if (!originalItem) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    // Verify item belongs to the correct project
    if (originalItem.projectComposition.projectId !== projectId) {
      return NextResponse.json({ error: 'Item não pertence a este projeto' }, { status: 403 });
    }

    // 1. Update ALL ProjectCompositionItems with the same code within this project
    const allItemsWithCode = await prisma.projectCompositionItem.findMany({
      where: {
        code: originalItem.code,
        projectComposition: { projectId },
      },
      select: { id: true, coefficient: true, projectCompositionId: true },
    });

    const affectedCompositionIds = new Set<string>();

    for (const item of allItemsWithCode) {
      const newTotal = Math.round(Number(item.coefficient) * newPrice * 10000) / 10000;
      await prisma.projectCompositionItem.update({
        where: { id: item.id },
        data: {
          unitPrice: newPrice,
          totalPrice: newTotal,
          updatedAt: new Date(),
        },
      });
      affectedCompositionIds.add(item.projectCompositionId);
    }

    // 2. Recalculate unitCost of affected ProjectCompositions
    for (const compId of affectedCompositionIds) {
      const compItems = await prisma.projectCompositionItem.findMany({
        where: { projectCompositionId: compId },
        select: { totalPrice: true },
      });
      const newUnitCost = compItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);

      await prisma.projectComposition.update({
        where: { id: compId },
        data: { unitCost: Math.round(newUnitCost * 10000) / 10000, updatedAt: new Date() },
      });
    }

    // 3. Propagate to BudgetServices that use these project compositions
    const affectedServices = await prisma.budgetService.findMany({
      where: { projectCompositionId: { in: Array.from(affectedCompositionIds) } },
      include: {
        projectComposition: { select: { unitCost: true } },
        stage: { select: { id: true, budgetRealId: true } },
      },
    });

    const affectedStageIds = new Set<string>();
    const affectedBudgetIds = new Set<string>();

    for (const service of affectedServices) {
      const newServiceUnitPrice = Number(service.projectComposition!.unitCost);
      const newTotal = Math.round(Number(service.quantity) * newServiceUnitPrice * 100) / 100;

      await prisma.budgetService.update({
        where: { id: service.id },
        data: {
          unitPrice: Math.round(newServiceUnitPrice * 100) / 100,
          totalPrice: newTotal,
          updatedAt: new Date(),
        },
      });

      affectedStageIds.add(service.stage.id);
      affectedBudgetIds.add(service.stage.budgetRealId);
    }

    // 4. Recalculate stage totals
    for (const stageId of affectedStageIds) {
      const stageServices = await prisma.budgetService.findMany({
        where: { stageId },
        select: { totalPrice: true },
      });
      const stageTotal = stageServices.reduce((sum, s) => sum + Number(s.totalPrice), 0);
      await prisma.budgetStage.update({
        where: { id: stageId },
        data: { totalCost: Math.round(stageTotal * 100) / 100, updatedAt: new Date() },
      });
    }

    // 5. Recalculate budget totals
    for (const budgetId of affectedBudgetIds) {
      const stages = await prisma.budgetStage.findMany({
        where: { budgetRealId: budgetId },
        select: { totalCost: true },
      });
      const totalDirect = stages.reduce((sum, s) => sum + Number(s.totalCost), 0);
      const budget = await prisma.budgetReal.findUnique({
        where: { id: budgetId },
        select: { bdiPercentage: true },
      });
      const bdi = budget ? Number(budget.bdiPercentage) : 25;
      const totalWithBDI = totalDirect * (1 + bdi / 100);

      await prisma.budgetReal.update({
        where: { id: budgetId },
        data: {
          totalDirectCost: Math.round(totalDirect * 100) / 100,
          totalWithBDI: Math.round(totalWithBDI * 100) / 100,
          updatedAt: new Date(),
        },
      });
    }

    // 6. Propagate to BudgetAIServices that use these project compositions
    const affectedAIServices = await prisma.budgetAIService.findMany({
      where: { projectCompositionId: { in: Array.from(affectedCompositionIds) } },
      include: {
        projectComposition: { select: { unitCost: true } },
        stage: { select: { id: true, budgetAIId: true } },
      },
    });

    const affectedAIStageIds = new Set<string>();
    const affectedAIBudgetIds = new Set<string>();

    for (const aiService of affectedAIServices) {
      const newAIServiceUnitPrice = Number(aiService.projectComposition!.unitCost);
      const newAITotal = Math.round(Number(aiService.quantity) * newAIServiceUnitPrice * 100) / 100;

      await prisma.budgetAIService.update({
        where: { id: aiService.id },
        data: {
          unitPrice: Math.round(newAIServiceUnitPrice * 100) / 100,
          totalPrice: newAITotal,
          updatedAt: new Date(),
        },
      });

      affectedAIStageIds.add(aiService.stage.id);
      affectedAIBudgetIds.add(aiService.stage.budgetAIId);
    }

    // 7. Recalculate BudgetAIStage totals
    for (const aiStageId of affectedAIStageIds) {
      const aiStageServices = await prisma.budgetAIService.findMany({
        where: { stageId: aiStageId },
        select: { totalPrice: true },
      });
      const aiStageTotal = aiStageServices.reduce((sum, s) => sum + Number(s.totalPrice), 0);

      // Get grand total for percentage
      const aiStage = await prisma.budgetAIStage.findUnique({
        where: { id: aiStageId },
        select: { budgetAIId: true },
      });
      if (aiStage) {
        await prisma.budgetAIStage.update({
          where: { id: aiStageId },
          data: {
            totalCost: Math.round(aiStageTotal * 100) / 100,
            updatedAt: new Date(),
          },
        });
      }
    }

    // 8. Recalculate BudgetAI totals + set manuallyEdited
    for (const aiBudgetId of affectedAIBudgetIds) {
      const aiStages = await prisma.budgetAIStage.findMany({
        where: { budgetAIId: aiBudgetId },
        select: { totalCost: true },
      });
      const aiTotalDirect = aiStages.reduce((sum, s) => sum + Number(s.totalCost), 0);

      await prisma.budgetAI.update({
        where: { id: aiBudgetId },
        data: {
          totalDirectCost: Math.round(aiTotalDirect * 100) / 100,
          manuallyEdited: true,
          updatedAt: new Date(),
        },
      });

      // Recalculate stage percentages
      for (const aiStageId of affectedAIStageIds) {
        const stage = await prisma.budgetAIStage.findUnique({
          where: { id: aiStageId },
          select: { totalCost: true, budgetAIId: true },
        });
        if (stage && stage.budgetAIId === aiBudgetId) {
          const pct = aiTotalDirect > 0 ? (Number(stage.totalCost) / aiTotalDirect) * 100 : 0;
          await prisma.budgetAIStage.update({
            where: { id: aiStageId },
            data: { percentage: Math.round(pct * 100) / 100 },
          });
        }
      }
    }

    // Return updated item with cascade summary
    const updatedItem = await prisma.projectCompositionItem.findUnique({
      where: { id: itemId },
    });

    return NextResponse.json({
      ...updatedItem,
      _cascade: {
        itemsUpdated: allItemsWithCode.length,
        compositionsRecalculated: affectedCompositionIds.size,
        servicesUpdated: affectedServices.length,
        stagesRecalculated: affectedStageIds.size,
        budgetsRecalculated: affectedBudgetIds.size,
        aiServicesUpdated: affectedAIServices.length,
        aiStagesRecalculated: affectedAIStageIds.size,
        aiBudgetsRecalculated: affectedAIBudgetIds.size,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar preço do projeto:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
