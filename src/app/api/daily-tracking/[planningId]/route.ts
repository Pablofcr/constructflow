import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planningId: string }> }
) {
  try {
    const { planningId } = await params;

    const planning = await prisma.planning.findUnique({
      where: { id: planningId },
      include: {
        baseline: { select: { id: true, frozenAt: true } },
        stages: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            order: true,
            progressPercent: true,
            budgetPercentage: true,
          },
        },
        dailyLogs: {
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            id: true,
            date: true,
            status: true,
            notes: true,
            weather: true,
          },
        },
      },
    });

    if (!planning) {
      return NextResponse.json(
        { error: 'Planejamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: planning.id,
      name: planning.name,
      status: planning.status,
      startDate: planning.startDate,
      endDate: planning.endDate,
      overallProgress: Number(planning.overallProgress),
      totalBudget: Number(planning.totalBudget),
      hasBaseline: !!planning.baseline,
      baselineFrozenAt: planning.baseline?.frozenAt || null,
      stages: planning.stages.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        progressPercent: Number(s.progressPercent),
        budgetPercentage: Number(s.budgetPercentage),
      })),
      dailyLogs: planning.dailyLogs.map((dl) => ({
        id: dl.id,
        date: dl.date,
        status: dl.status,
        notes: dl.notes,
        weather: dl.weather,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar tracking overview:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
