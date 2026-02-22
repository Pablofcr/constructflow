import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    // Buscar orçamento estimado
    const budgetEstimated = await prisma.budgetEstimated.findUnique({
      where: { projectId },
      select: { id: true, totalEstimatedCost: true, updatedAt: true },
    });

    // Buscar primeiro orçamento real
    const budgetReal = await prisma.budgetReal.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        totalWithBDI: true,
        totalDirectCost: true,
        status: true,
        updatedAt: true,
        _count: { select: { stages: true } },
      },
    });

    // Buscar primeiro orçamento IA com status GENERATED ou APPROVED
    const budgetAI = await prisma.budgetAI.findFirst({
      where: {
        projectId,
        status: { in: ['GENERATED', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        totalDirectCost: true,
        status: true,
        updatedAt: true,
        _count: { select: { stages: true } },
      },
    });

    return NextResponse.json({
      estimated: budgetEstimated
        ? {
            available: true,
            id: budgetEstimated.id,
            totalCost: budgetEstimated.totalEstimatedCost,
            updatedAt: budgetEstimated.updatedAt,
          }
        : { available: false },
      real: budgetReal
        ? {
            available: true,
            id: budgetReal.id,
            name: budgetReal.name,
            totalCost: Number(budgetReal.totalWithBDI ?? budgetReal.totalDirectCost),
            stageCount: budgetReal._count.stages,
            status: budgetReal.status,
            updatedAt: budgetReal.updatedAt,
          }
        : { available: false },
      ai: budgetAI
        ? {
            available: true,
            id: budgetAI.id,
            name: budgetAI.name,
            totalCost: Number(budgetAI.totalDirectCost),
            stageCount: budgetAI._count.stages,
            status: budgetAI.status,
            updatedAt: budgetAI.updatedAt,
          }
        : { available: false },
    });
  } catch (error) {
    console.error('Erro ao buscar opções de orçamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
