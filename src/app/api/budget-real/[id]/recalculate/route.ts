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
                projectComposition: {
                  include: { items: true },
                },
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Recalculate each stage
    for (const stage of budget.stages) {
      let stageTotal = 0;

      for (const service of stage.services) {
        let newUnitPrice: number;

        if (service.projectCompositionId && service.projectComposition) {
          // Price comes directly from project composition items
          newUnitPrice = service.projectComposition.items.reduce((sum, item) => {
            return sum + Number(item.coefficient) * Number(item.unitPrice);
          }, 0);
        } else {
          // Manual service — keep current price
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

    // Recalculate budget total
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
