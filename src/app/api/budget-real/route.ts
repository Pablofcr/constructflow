import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';
import { initializeProjectCompositions } from '@/lib/project-compositions';

// GET /api/budget-real?projectId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    const budgets = await prisma.budgetReal.findMany({
      where: { projectId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            services: {
              include: { composition: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Erro ao buscar orçamentos reais:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/budget-real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, bdiPercentage, startDate, endDate, durationMonths } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    // Buscar o estado do projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { enderecoEstado: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    const budgetId = crypto.randomUUID();

    // Criar orçamento real
    const budget = await prisma.budgetReal.create({
      data: {
        id: budgetId,
        projectId,
        name: name || 'Orçamento Real',
        state: project.enderecoEstado || 'SP',
        bdiPercentage: bdiPercentage || 25,
        bdiAdministration: 5,
        bdiProfit: 8,
        bdiTaxes: 8.65,
        bdiRisk: 1.5,
        bdiOthers: 1.85,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        durationMonths: durationMonths || null,
        status: 'DRAFT',
      },
    });

    // Criar etapas padrão (00-19)
    for (const stage of DEFAULT_STAGES) {
      await prisma.budgetStage.create({
        data: {
          id: crypto.randomUUID(),
          budgetRealId: budgetId,
          name: stage.name,
          code: stage.code,
          order: stage.order,
          description: stage.description,
          percentage: stage.percentage,
          totalCost: 0,
          status: 'PENDING',
          progressPercent: 0,
        },
      });
    }

    // Inicializar composições do projeto (copia globais com preços do estado)
    const budgetState = project.enderecoEstado || 'SP';
    await initializeProjectCompositions(projectId, budgetState);

    // Retornar com stages
    const result = await prisma.budgetReal.findUnique({
      where: { id: budgetId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento real:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
