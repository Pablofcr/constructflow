import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/budget-real/[id]/services/[serviceId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { serviceId } = await params;

    const service = await prisma.budgetService.findUnique({
      where: { id: serviceId },
      include: {
        projectComposition: { include: { items: true } },
        measurements: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT /api/budget-real/[id]/services/[serviceId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: budgetRealId, serviceId } = await params;
    const body = await request.json();
    const { description, unit, quantity, unitPrice, notes, status } = body;

    const existing = await prisma.budgetService.findUnique({
      where: { id: serviceId },
      select: { stageId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    const qty = quantity !== undefined ? Number(quantity) : undefined;
    const price = unitPrice !== undefined ? Number(unitPrice) : undefined;

    let totalPrice: number | undefined;
    if (qty !== undefined || price !== undefined) {
      const currentService = await prisma.budgetService.findUnique({
        where: { id: serviceId },
        select: { quantity: true, unitPrice: true },
      });
      const finalQty = qty ?? Number(currentService!.quantity);
      const finalPrice = price ?? Number(currentService!.unitPrice);
      totalPrice = Math.round(finalQty * finalPrice * 100) / 100;
    }

    const updated = await prisma.budgetService.update({
      where: { id: serviceId },
      data: {
        ...(description !== undefined && { description }),
        ...(unit !== undefined && { unit }),
        ...(qty !== undefined && { quantity: qty }),
        ...(price !== undefined && { unitPrice: price }),
        ...(totalPrice !== undefined && { totalPrice }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      },
      include: {
        projectComposition: { include: { items: true } },
      },
    });

    // Recalcular totais
    await recalculateStageTotal(existing.stageId);
    await recalculateBudgetTotal(budgetRealId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/budget-real/[id]/services/[serviceId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: budgetRealId, serviceId } = await params;

    const service = await prisma.budgetService.findUnique({
      where: { id: serviceId },
      select: { stageId: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    await prisma.budgetService.delete({ where: { id: serviceId } });

    await recalculateStageTotal(service.stageId);
    await recalculateBudgetTotal(budgetRealId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

async function recalculateStageTotal(stageId: string) {
  const services = await prisma.budgetService.findMany({
    where: { stageId },
    select: { totalPrice: true },
  });
  const total = services.reduce((sum, s) => sum + Number(s.totalPrice), 0);
  await prisma.budgetStage.update({
    where: { id: stageId },
    data: { totalCost: Math.round(total * 100) / 100, updatedAt: new Date() },
  });
}

async function recalculateBudgetTotal(budgetRealId: string) {
  const stages = await prisma.budgetStage.findMany({
    where: { budgetRealId },
    select: { totalCost: true },
  });
  const totalDirect = stages.reduce((sum, s) => sum + Number(s.totalCost), 0);
  const budget = await prisma.budgetReal.findUnique({
    where: { id: budgetRealId },
    select: { bdiPercentage: true },
  });
  const bdi = budget ? Number(budget.bdiPercentage) : 25;
  const totalWithBDI = totalDirect * (1 + bdi / 100);
  await prisma.budgetReal.update({
    where: { id: budgetRealId },
    data: {
      totalDirectCost: Math.round(totalDirect * 100) / 100,
      totalWithBDI: Math.round(totalWithBDI * 100) / 100,
      updatedAt: new Date(),
    },
  });
}
