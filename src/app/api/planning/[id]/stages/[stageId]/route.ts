import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    const body = await request.json();

    const {
      startDate,
      endDate,
      durationDays,
      status,
      progressPercent,
      responsibleId,
      responsibleName,
      notes,
    } = body;

    // Atualizar a etapa
    const stage = await prisma.planningStage.update({
      where: { id: stageId },
      data: {
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(durationDays !== undefined && { durationDays }),
        ...(status !== undefined && { status }),
        ...(progressPercent !== undefined && { progressPercent }),
        ...(responsibleId !== undefined && { responsibleId }),
        ...(responsibleName !== undefined && { responsibleName }),
        ...(notes !== undefined && { notes }),
      },
    });

    // Recalcular progresso geral do planning (média ponderada por budgetPercentage)
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
      data: {
        overallProgress: Math.round(overallProgress * 100) / 100,
      },
    });

    return NextResponse.json(stage);
  } catch (error) {
    console.error('Erro ao atualizar etapa:', error);
    return NextResponse.json({ error: 'Erro ao atualizar etapa' }, { status: 500 });
  }
}
