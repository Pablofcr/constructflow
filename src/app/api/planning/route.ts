import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';
import { computeStageDates, shouldUseExpertTemplate } from '@/lib/planning-schedule';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    const plannings = await prisma.planning.findMany({
      where: { projectId },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(plannings);
  } catch (error) {
    console.error('Erro ao buscar planejamentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, budgetSourceType, budgetRealId, budgetAIId } = body;

    if (!projectId || !budgetSourceType) {
      return NextResponse.json(
        { error: 'projectId e budgetSourceType são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar stages com base no tipo de orçamento
    type StageData = {
      name: string;
      code: string | null;
      order: number;
      budgetCost: number;
      budgetPercentage: number;
      description: string | null;
    };
    let stagesData: StageData[] = [];
    let totalBudget = 0;

    if (budgetSourceType === 'REAL' && budgetRealId) {
      // Copiar stages do orçamento real
      const budgetStages = await prisma.budgetStage.findMany({
        where: { budgetRealId },
        orderBy: { order: 'asc' },
      });

      stagesData = budgetStages.map((s) => ({
        name: s.name,
        code: s.code,
        order: s.order,
        budgetCost: Number(s.totalCost),
        budgetPercentage: Number(s.percentage),
        description: s.description,
      }));

      totalBudget = stagesData.reduce((sum, s) => sum + s.budgetCost, 0);
    } else if (budgetSourceType === 'ESTIMATED') {
      // Usar etapas padrão com custo proporcional do orçamento estimado
      const budgetEstimated = await prisma.budgetEstimated.findUnique({
        where: { projectId },
        select: { id: true, totalEstimatedCost: true },
      });

      const totalCost = budgetEstimated?.totalEstimatedCost || 0;

      stagesData = DEFAULT_STAGES.map((s) => ({
        name: s.name,
        code: s.code,
        order: s.order,
        budgetCost: (totalCost * s.percentage) / 100,
        budgetPercentage: s.percentage,
        description: s.description || null,
      }));

      totalBudget = totalCost;
    } else if (budgetSourceType === 'AI' && budgetAIId) {
      // Copiar stages do orçamento IA
      const aiStages = await prisma.budgetAIStage.findMany({
        where: { budgetAIId },
        orderBy: { order: 'asc' },
      });

      stagesData = aiStages.map((s) => ({
        name: s.name,
        code: s.code,
        order: s.order,
        budgetCost: Number(s.totalCost),
        budgetPercentage: Number(s.percentage),
        description: null,
      }));

      totalBudget = stagesData.reduce((sum, s) => sum + s.budgetCost, 0);
    }

    // Buscar datas do projeto para gerar cronograma automático
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { dataInicioEstimada: true, prazoFinal: true },
    });

    const projectStart = project?.dataInicioEstimada ? new Date(project.dataInicioEstimada) : null;
    const projectEnd = project?.prazoFinal ? new Date(project.prazoFinal) : null;

    // Calcular cronograma automático se datas do projeto existirem
    let scheduleDates: Map<number, { startDate: Date; endDate: Date; durationDays: number }> = new Map();
    let planningStartDate: Date | null = null;
    let planningEndDate: Date | null = null;
    let durationMonths: number | null = null;

    if (projectStart && projectEnd) {
      const useExpert = shouldUseExpertTemplate(
        budgetSourceType,
        stagesData.map((s) => ({ code: s.code, order: s.order }))
      );
      scheduleDates = computeStageDates(stagesData, projectStart, projectEnd, useExpert);
      planningStartDate = projectStart;
      planningEndDate = projectEnd;
      const totalDays = Math.round(
        (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      durationMonths = Math.round(totalDays / 30);
    }

    // Criar planning com stages
    const planning = await prisma.planning.create({
      data: {
        projectId,
        name: name || 'Planejamento da Obra',
        budgetSourceType,
        budgetRealId: budgetSourceType === 'REAL' ? budgetRealId : null,
        budgetEstimatedId:
          budgetSourceType === 'ESTIMATED'
            ? (
                await prisma.budgetEstimated.findUnique({
                  where: { projectId },
                  select: { id: true },
                })
              )?.id || null
            : null,
        budgetAIId: budgetSourceType === 'AI' ? budgetAIId : null,
        startDate: planningStartDate,
        endDate: planningEndDate,
        durationMonths,
        totalBudget,
        stages: {
          create: stagesData.map((s) => {
            const dates = scheduleDates.get(s.order);
            return {
              name: s.name,
              code: s.code,
              order: s.order,
              budgetCost: s.budgetCost,
              budgetPercentage: s.budgetPercentage,
              description: s.description,
              startDate: dates?.startDate || null,
              endDate: dates?.endDate || null,
              durationDays: dates?.durationDays || null,
            };
          }),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(planning, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar planejamento:', error);
    return NextResponse.json({ error: 'Erro ao criar planejamento' }, { status: 500 });
  }
}
