import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id, serviceId } = await params;
    const body = await request.json();

    const { startDate, endDate, durationDays, status, progressPercent, notes } = body;

    // Update the PlanningService
    const service = await prisma.planningService.update({
      where: { id: serviceId },
      data: {
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(durationDays !== undefined && { durationDays }),
        ...(status !== undefined && { status }),
        ...(progressPercent !== undefined && { progressPercent }),
        ...(notes !== undefined && { notes }),
      },
    });

    // Recalculate stage progress: weighted average of service progress
    const stageServices = await prisma.planningService.findMany({
      where: { stageId: service.stageId },
      select: { weight: true, progressPercent: true },
    });

    const totalWeight = stageServices.reduce((sum, s) => sum + Number(s.weight), 0);

    let stageProgress = 0;
    if (totalWeight > 0) {
      stageProgress = stageServices.reduce(
        (sum, s) => sum + (Number(s.progressPercent) * Number(s.weight)) / totalWeight,
        0
      );
    }

    const updatedStage = await prisma.planningStage.update({
      where: { id: service.stageId },
      data: { progressPercent: Math.round(stageProgress * 100) / 100 },
    });

    // Recalculate overall planning progress
    const allStages = await prisma.planningStage.findMany({
      where: { planningId: id },
      select: { budgetPercentage: true, progressPercent: true },
    });

    const totalPercentage = allStages.reduce(
      (sum, s) => sum + Number(s.budgetPercentage),
      0
    );

    let overallProgress = 0;
    if (totalPercentage > 0) {
      overallProgress = allStages.reduce(
        (sum, s) =>
          sum + (Number(s.progressPercent) * Number(s.budgetPercentage)) / totalPercentage,
        0
      );
    }

    await prisma.planning.update({
      where: { id },
      data: { overallProgress: Math.round(overallProgress * 100) / 100 },
    });

    return NextResponse.json({
      service: {
        id: service.id,
        stageId: service.stageId,
        description: service.description,
        code: service.code,
        unit: service.unit,
        quantity: Number(service.quantity),
        unitPrice: Number(service.unitPrice),
        totalPrice: Number(service.totalPrice),
        weight: Number(service.weight),
        startDate: service.startDate,
        endDate: service.endDate,
        durationDays: service.durationDays,
        status: service.status,
        progressPercent: Number(service.progressPercent),
        notes: service.notes,
      },
      stageProgress: Number(updatedStage.progressPercent),
      overallProgress: Math.round(overallProgress * 100) / 100,
    });
  } catch (error) {
    console.error('Erro ao atualizar servico:', error);
    return NextResponse.json({ error: 'Erro ao atualizar servico' }, { status: 500 });
  }
}
