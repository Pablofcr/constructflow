import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/price-tables/[itemId] - Atualizar preço global de um insumo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { unitPrice } = body;

    if (unitPrice === undefined) {
      return NextResponse.json({ error: 'unitPrice é obrigatório' }, { status: 400 });
    }

    const newPrice = Number(unitPrice);

    // Buscar o item original para pegar o código
    const originalItem = await prisma.compositionItem.findUnique({
      where: { id: itemId },
      select: { code: true, compositionId: true },
    });

    if (!originalItem) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    // 1. Atualizar TODOS os CompositionItems com o mesmo código de insumo
    const allItemsWithCode = await prisma.compositionItem.findMany({
      where: { code: originalItem.code },
      select: { id: true, coefficient: true, compositionId: true },
    });

    const affectedCompositionIds = new Set<string>();

    for (const item of allItemsWithCode) {
      const newTotal = Math.round(Number(item.coefficient) * newPrice * 10000) / 10000;
      await prisma.compositionItem.update({
        where: { id: item.id },
        data: {
          unitPrice: newPrice,
          totalPrice: newTotal,
          updatedAt: new Date(),
        },
      });
      affectedCompositionIds.add(item.compositionId);
    }

    // 2. Recalcular unitCost de TODAS as composições afetadas
    for (const compId of affectedCompositionIds) {
      const compItems = await prisma.compositionItem.findMany({
        where: { compositionId: compId },
        select: { totalPrice: true },
      });
      const newUnitCost = compItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);

      await prisma.composition.update({
        where: { id: compId },
        data: { unitCost: Math.round(newUnitCost * 10000) / 10000, updatedAt: new Date() },
      });

      // Atualizar preços por estado
      const statePrices = await prisma.sinapiStatePrice.findMany({
        where: { compositionId: compId },
      });
      const factors: Record<string, number> = { SP: 1.0, RJ: 1.05, MG: 0.92, BA: 0.88, CE: 0.85 };
      for (const sp of statePrices) {
        const factor = factors[sp.state] || 1.0;
        await prisma.sinapiStatePrice.update({
          where: { id: sp.id },
          data: { unitCost: Math.round(newUnitCost * factor * 10000) / 10000 },
        });
      }
    }

    // 3. Propagar para todos os BudgetServices que usam essas composições
    const affectedServices = await prisma.budgetService.findMany({
      where: { compositionId: { in: Array.from(affectedCompositionIds) } },
      include: {
        composition: { select: { unitCost: true } },
        stage: { select: { id: true, budgetRealId: true } },
      },
    });

    const affectedStageIds = new Set<string>();
    const affectedBudgetIds = new Set<string>();

    for (const service of affectedServices) {
      // Verificar se existe override de composição para este orçamento
      const compOverride = await prisma.projectCompositionOverride.findUnique({
        where: {
          budgetRealId_compositionId: {
            budgetRealId: service.stage.budgetRealId,
            compositionId: service.compositionId!,
          },
        },
      });

      // Se tem override, o preço é o override, não o da composição
      if (compOverride) continue;

      // Verificar se existem overrides de itens para esta composição neste orçamento
      const itemOverrides = await prisma.projectItemOverride.findMany({
        where: {
          budgetRealId: service.stage.budgetRealId,
          compositionItem: { compositionId: service.compositionId! },
        },
        include: { compositionItem: { select: { coefficient: true } } },
      });

      let newServiceUnitPrice: number;

      if (itemOverrides.length > 0) {
        // Recalcular composição com mix de preços originais + overrides
        const allItems = await prisma.compositionItem.findMany({
          where: { compositionId: service.compositionId! },
          select: { id: true, coefficient: true, unitPrice: true },
        });
        const overrideMap = new Map(itemOverrides.map(o => [o.compositionItemId, Number(o.overriddenPrice)]));
        newServiceUnitPrice = allItems.reduce((sum, item) => {
          const price = overrideMap.get(item.id) ?? Number(item.unitPrice);
          return sum + Number(item.coefficient) * price;
        }, 0);
      } else {
        // Usar o unitCost atualizado da composição
        newServiceUnitPrice = Number(service.composition!.unitCost);
      }

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

    // 4. Recalcular totais das etapas afetadas
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

    // 5. Recalcular totais dos orçamentos afetados
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

    // Retornar item atualizado com resumo da cascata
    const updatedItem = await prisma.compositionItem.findUnique({
      where: { id: itemId },
      include: { composition: { select: { code: true, description: true, unitCost: true } } },
    });

    return NextResponse.json({
      ...updatedItem,
      _cascade: {
        itemsUpdated: allItemsWithCode.length,
        compositionsRecalculated: affectedCompositionIds.size,
        servicesUpdated: affectedServices.length,
        stagesRecalculated: affectedStageIds.size,
        budgetsRecalculated: affectedBudgetIds.size,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar preço:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET /api/price-tables/[itemId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const item = await prisma.compositionItem.findUnique({
      where: { id: itemId },
      include: {
        composition: { select: { code: true, description: true, unitCost: true, category: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Erro ao buscar item:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/price-tables/[itemId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    await prisma.compositionItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar item:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
