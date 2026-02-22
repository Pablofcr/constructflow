import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId');
  const stageCode = searchParams.get('stageCode');

  if (!stageId && !stageCode) {
    return NextResponse.json({ error: 'stageId or stageCode is required' }, { status: 400 });
  }

  try {
    const planning = await prisma.planning.findUnique({
      where: { id },
      select: {
        budgetSourceType: true,
        budgetRealId: true,
        budgetAIId: true,
      },
    });

    if (!planning) {
      return NextResponse.json({ error: 'Planning not found' }, { status: 404 });
    }

    // Find the PlanningStage
    let planningStage;
    if (stageId) {
      planningStage = await prisma.planningStage.findUnique({
        where: { id: stageId },
      });
    } else {
      planningStage = await prisma.planningStage.findFirst({
        where: { planningId: id, code: stageCode },
      });
    }

    if (!planningStage) {
      return NextResponse.json([]);
    }

    // Check if PlanningServices already exist for this stage
    const existingServices = await prisma.planningService.findMany({
      where: { stageId: planningStage.id },
      orderBy: { createdAt: 'asc' },
    });

    if (existingServices.length > 0) {
      return NextResponse.json(existingServices.map(serializeService));
    }

    // No PlanningServices yet — auto-populate from budget source
    if (planning.budgetSourceType === 'ESTIMATED') {
      return NextResponse.json([]);
    }

    let budgetServices: Array<{
      description: string;
      code: string | null;
      unit: string;
      quantity: any;
      unitPrice: any;
      totalPrice: any;
    }> = [];

    if (planning.budgetSourceType === 'REAL' && planning.budgetRealId) {
      const budgetStage = await prisma.budgetStage.findFirst({
        where: {
          budgetRealId: planning.budgetRealId,
          code: planningStage.code || undefined,
        },
        include: { services: { orderBy: { id: 'asc' } } },
      });
      if (budgetStage) {
        budgetServices = budgetStage.services;
      }
    } else if (planning.budgetSourceType === 'AI' && planning.budgetAIId) {
      const budgetStage = await prisma.budgetAIStage.findFirst({
        where: {
          budgetAIId: planning.budgetAIId,
          code: planningStage.code || undefined,
        },
        include: { services: { orderBy: { id: 'asc' } } },
      });
      if (budgetStage) {
        budgetServices = budgetStage.services;
      }
    }

    if (budgetServices.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate weights based on totalPrice
    const totalSum = budgetServices.reduce((sum, s) => sum + Number(s.totalPrice), 0);

    const created = await prisma.$transaction(
      budgetServices.map((s) => {
        const weight = totalSum > 0 ? Number(s.totalPrice) / totalSum : 0;
        return prisma.planningService.create({
          data: {
            stageId: planningStage!.id,
            description: s.description,
            code: s.code,
            unit: s.unit,
            quantity: Number(s.quantity),
            unitPrice: Number(s.unitPrice),
            totalPrice: Number(s.totalPrice),
            weight: Math.round(weight * 10000) / 10000,
          },
        });
      })
    );

    return NextResponse.json(created.map(serializeService));
  } catch (error) {
    console.error('Error fetching planning services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function serializeService(s: any) {
  return {
    id: s.id,
    stageId: s.stageId,
    description: s.description,
    code: s.code,
    unit: s.unit,
    quantity: Number(s.quantity),
    unitPrice: Number(s.unitPrice),
    totalPrice: Number(s.totalPrice),
    weight: Number(s.weight),
    startDate: s.startDate,
    endDate: s.endDate,
    durationDays: s.durationDays,
    status: s.status,
    progressPercent: Number(s.progressPercent),
    notes: s.notes,
  };
}
