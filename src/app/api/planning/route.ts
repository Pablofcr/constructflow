import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';

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
    const { projectId, name, budgetSourceType, budgetRealId, budgetAIId, startDate, endDate } = body;

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

    // Criar planning com stages em transação
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
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalBudget,
        stages: {
          create: stagesData.map((s) => ({
            name: s.name,
            code: s.code,
            order: s.order,
            budgetCost: s.budgetCost,
            budgetPercentage: s.budgetPercentage,
            description: s.description,
          })),
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
