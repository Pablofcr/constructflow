import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/budget-real/[id]/recalculate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetReal.findUnique({
      where: { id },
      include: {
        stages: {
          include: {
            services: {
              include: {
                composition: {
                  include: { items: true },
                },
              },
            },
          },
        },
        itemOverrides: true,
        compositionOverrides: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    const overrideMap = new Map(
      budget.compositionOverrides.map((o) => [o.compositionId, Number(o.overriddenCost)])
    );
    const itemOverrideMap = new Map(
      budget.itemOverrides.map((o) => [o.compositionItemId, Number(o.overriddenPrice)])
    );

    // Recalcular cada etapa
    for (const stage of budget.stages) {
      let stageTotal = 0;

      for (const service of stage.services) {
        let newUnitPrice: number;

        if (service.compositionId) {
          // Verificar override de composição
          const compOverride = overrideMap.get(service.compositionId);

          if (compOverride !== undefined) {
            newUnitPrice = compOverride;
          } else if (service.composition) {
            // Recalcular a partir dos itens (respeitando overrides de itens)
            newUnitPrice = service.composition.items.reduce((sum, item) => {
              const price = itemOverrideMap.get(item.id) ?? Number(item.unitPrice);
              return sum + Number(item.coefficient) * price;
            }, 0);
          } else {
            newUnitPrice = Number(service.unitPrice);
          }
        } else {
          // Serviço manual (sem composição) - manter preço atual
          newUnitPrice = Number(service.unitPrice);
        }

        const newTotal = Math.round(Number(service.quantity) * newUnitPrice * 100) / 100;
        newUnitPrice = Math.round(newUnitPrice * 100) / 100;

        await prisma.budgetService.update({
          where: { id: service.id },
          data: {
            unitPrice: newUnitPrice,
            totalPrice: newTotal,
            updatedAt: new Date(),
          },
        });

        stageTotal += newTotal;
      }

      await prisma.budgetStage.update({
        where: { id: stage.id },
        data: { totalCost: Math.round(stageTotal * 100) / 100, updatedAt: new Date() },
      });
    }

    // Recalcular total do orçamento
    const updatedStages = await prisma.budgetStage.findMany({
      where: { budgetRealId: id },
      select: { totalCost: true },
    });

    const totalDirect = updatedStages.reduce((sum, s) => sum + Number(s.totalCost), 0);
    const bdi = Number(budget.bdiPercentage);
    const totalWithBDI = totalDirect * (1 + bdi / 100);

    const result = await prisma.budgetReal.update({
      where: { id },
      data: {
        totalDirectCost: Math.round(totalDirect * 100) / 100,
        totalWithBDI: Math.round(totalWithBDI * 100) / 100,
        updatedAt: new Date(),
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao recalcular orçamento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
