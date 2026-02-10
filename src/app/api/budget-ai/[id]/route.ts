import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/budget-ai/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetAI.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            codigo: true,
            name: true,
            enderecoEstado: true,
          },
        },
        stages: {
          orderBy: { order: 'asc' },
          include: {
            services: {
              include: {
                composition: {
                  include: {
                    items: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento IA não encontrado' }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Erro ao buscar orçamento IA:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/budget-ai/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.budgetAI.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar orçamento IA:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
