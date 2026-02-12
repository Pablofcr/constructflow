import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/budget-real/[id]/services?stageId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get('stageId');

    const where: Record<string, unknown> = {};
    if (stageId) {
      where.stageId = stageId;
    } else {
      where.stage = { budgetRealId: id };
    }

    const services = await prisma.budgetService.findMany({
      where,
      include: {
        composition: {
          include: { items: true },
        },
        projectComposition: {
          include: { items: true },
        },
        measurements: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/budget-real/[id]/services
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: budgetRealId } = await params;
    const body = await request.json();
    const { stageId, description, unit, quantity, unitPrice, compositionId, projectCompositionId, code, notes } = body;

    if (!stageId || !description || !unit || quantity === undefined || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'stageId, description, unit, quantity e unitPrice são obrigatórios' },
        { status: 400 }
      );
    }

    const totalPrice = Number(quantity) * Number(unitPrice);

    const service = await prisma.budgetService.create({
      data: {
        id: crypto.randomUUID(),
        stageId,
        description,
        code: code || null,
        unit,
        quantity,
        unitPrice,
        totalPrice: Math.round(totalPrice * 100) / 100,
        compositionId: compositionId || null,
        projectCompositionId: projectCompositionId || null,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        composition: { include: { items: true } },
        projectComposition: { include: { items: true } },
      },
    });

    // Recalcular total da etapa
    await recalculateStageTotal(stageId);
    // Recalcular total do orçamento
    await recalculateBudgetTotal(budgetRealId);

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
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
