import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/budget-ai/[id]/status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetAI.findUnique({
      where: { id },
      select: {
        status: true,
        aiError: true,
        generatedAt: true,
        totalDirectCost: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
