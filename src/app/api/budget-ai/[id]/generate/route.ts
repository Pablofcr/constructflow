import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAIBudget } from '@/lib/ai/generate-budget';

// POST /api/budget-ai/[id]/generate
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

    if (budget.status === 'GENERATING') {
      return NextResponse.json(
        { error: 'Geração já está em andamento' },
        { status: 409 }
      );
    }

    // Fire and forget - don't await
    generateAIBudget(id).catch((err) => {
      console.error('Erro na geração async:', err);
    });

    return NextResponse.json({ message: 'Geração iniciada', budgetAIId: id });
  } catch (error) {
    console.error('Erro ao iniciar geração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Increase timeout for this route
export const maxDuration = 300; // 5 minutes
