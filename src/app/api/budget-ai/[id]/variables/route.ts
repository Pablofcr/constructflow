import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeDerivedValues } from '@/lib/ai/types';
import type { ExtractedVariables } from '@/lib/ai/types';

// GET /api/budget-ai/[id]/variables
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetAI.findUnique({
      where: { id },
      select: { extractedVariables: true, status: true },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    if (!budget.extractedVariables) {
      return NextResponse.json({ error: 'Variáveis ainda não extraídas' }, { status: 404 });
    }

    return NextResponse.json(budget.extractedVariables);
  } catch (error) {
    console.error('Erro ao buscar variáveis:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT /api/budget-ai/[id]/variables
export async function PUT(
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
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    if (budget.status !== 'EXTRACTED') {
      return NextResponse.json(
        { error: `Status inválido para editar variáveis: ${budget.status}` },
        { status: 400 }
      );
    }

    const body: ExtractedVariables = await request.json();

    // Recompute derived values
    body.derived = computeDerivedValues(body);

    await prisma.budgetAI.update({
      where: { id },
      data: {
        extractedVariables: body as object,
      },
    });

    return NextResponse.json(body);
  } catch (error) {
    console.error('Erro ao salvar variáveis:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
