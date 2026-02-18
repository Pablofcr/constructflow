import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractVariables } from '@/lib/ai/extract-variables';

// POST /api/budget-ai/[id]/extract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetAI.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento IA não encontrado' }, { status: 404 });
    }

    if (budget.status === 'EXTRACTING') {
      return NextResponse.json(
        { error: 'Extração já está em andamento' },
        { status: 409 }
      );
    }

    if (budget.status !== 'PENDING' && budget.status !== 'FAILED') {
      return NextResponse.json(
        { error: `Status inválido para extração: ${budget.status}` },
        { status: 400 }
      );
    }

    // Fire and forget
    extractVariables(id).catch((err) => {
      console.error('Erro na extração async:', err);
    });

    return NextResponse.json({ message: 'Extração iniciada', budgetAIId: id });
  } catch (error) {
    console.error('Erro ao iniciar extração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export const maxDuration = 300;
