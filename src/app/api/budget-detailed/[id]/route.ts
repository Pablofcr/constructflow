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

    // Delete BudgetDetailed first (FK constraint)
    await prisma.budgetDetailed.delete({ where: { id } });

    // Delete linked BudgetReal (cascade deletes stages + services)
    if (budget.budgetRealId) {
      await prisma.budgetReal.delete({ where: { id: budget.budgetRealId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar orçamento detalhado:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
