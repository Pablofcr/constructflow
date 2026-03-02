import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/budget-detailed/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetDetailed.findUnique({
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
        budgetReal: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: {
                services: {
                  include: {
                    projectComposition: {
                      include: {
                        items: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento detalhado não encontrado' }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Erro ao buscar orçamento detalhado:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/budget-detailed/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetDetailed.findUnique({
      where: { id },
      select: { budgetRealId: true },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento detalhado não encontrado' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete BudgetDetailed first (FK: budgetRealId -> BudgetReal)
      await tx.budgetDetailed.delete({ where: { id } });

      // Delete linked BudgetReal (cascade deletes stages + services)
      if (budget.budgetRealId) {
        await tx.budgetReal.delete({ where: { id: budget.budgetRealId } });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Erro ao deletar orçamento detalhado:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Erro ao apagar orcamento detalhado', details: message }, { status: 500 });
  }
}
