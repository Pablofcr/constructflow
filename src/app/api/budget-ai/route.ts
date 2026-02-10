import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';

// GET /api/budget-ai?projectId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    const budgets = await prisma.budgetAI.findMany({
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
    console.error('Erro ao buscar orçamentos IA:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/budget-ai
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    // Verify project exists and get state
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, enderecoEstado: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Check if project has files
    const fileCount = await prisma.projectFile.count({
      where: { projectId },
    });

    if (fileCount === 0) {
      return NextResponse.json(
        { error: 'O projeto precisa ter ao menos 1 PDF anexado' },
        { status: 400 }
      );
    }

    // Create BudgetAI with 20 empty stages
    const budgetAI = await prisma.budgetAI.create({
      data: {
        projectId,
        name: 'Orçamento por IA',
        status: 'PENDING',
        state: project.enderecoEstado || 'SP',
        stages: {
          create: DEFAULT_STAGES.map((stage) => ({
            name: stage.name,
            code: stage.code,
            order: stage.order,
            totalCost: 0,
            percentage: 0,
          })),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(budgetAI, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento IA:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
