import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkingDaysInRange, todayUTC } from '@/lib/date-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planningId: string }> }
) {
  try {
    const { planningId } = await params;

    const planning = await prisma.planning.findUnique({
      where: { id: planningId },
      include: {
        baseline: {
          include: {
            stages: { include: { services: true } },
          },
        },
        stages: {
          orderBy: { order: 'asc' },
          include: { services: true },
        },
      },
    });

    if (!planning) {
      return NextResponse.json(
        { error: 'Planejamento não encontrado' },
        { status: 404 }
      );
    }

    const today = todayUTC();

    const deviations = planning.stages.map((stage) => {
      const actualProgress = Number(stage.progressPercent);

      // Calculate expected progress from baseline
      let expectedProgress = 0;

      if (planning.baseline) {
        const baselineStage = planning.baseline.stages.find(
          (bs) => bs.originalStageId === stage.id
        );

        if (baselineStage && baselineStage.startDate && baselineStage.endDate) {
          const stageStart = new Date(baselineStage.startDate);
          const stageEnd = new Date(baselineStage.endDate);

          if (today >= stageEnd) {
            expectedProgress = 100;
          } else if (today >= stageStart) {
            const totalWorkDays = getWorkingDaysInRange(stageStart, stageEnd);
            const elapsedWorkDays = getWorkingDaysInRange(stageStart, today);
            expectedProgress =
              totalWorkDays > 0
                ? (elapsedWorkDays / totalWorkDays) * 100
                : 0;
          }
        }
      }

      const deviation = actualProgress - expectedProgress;
      const absDeviation = Math.abs(deviation);

      let color: 'green' | 'yellow' | 'red';
      if (absDeviation <= 5) {
        color = 'green';
      } else if (absDeviation <= 15) {
        color = 'yellow';
      } else {
        color = 'red';
      }

      return {
        stageId: stage.id,
        stageName: stage.name,
        stageOrder: stage.order,
        expectedProgress: Math.round(expectedProgress * 100) / 100,
        actualProgress: Math.round(actualProgress * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        color,
        budgetPercentage: Number(stage.budgetPercentage),
      };
    });

    // Overall deviation
    const totalBudgetPct = deviations.reduce(
      (sum, d) => sum + d.budgetPercentage,
      0
    );

    let overallExpected = 0;
    let overallActual = 0;

    if (totalBudgetPct > 0) {
      for (const d of deviations) {
        const weight = d.budgetPercentage / totalBudgetPct;
        overallExpected += d.expectedProgress * weight;
        overallActual += d.actualProgress * weight;
      }
    }

    return NextResponse.json({
      overallExpected: Math.round(overallExpected * 100) / 100,
      overallActual: Math.round(overallActual * 100) / 100,
      overallDeviation: Math.round((overallActual - overallExpected) * 100) / 100,
      stages: deviations,
    });
  } catch (error) {
    console.error('Erro ao calcular desvios:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular desvios' },
      { status: 500 }
    );
  }
}
