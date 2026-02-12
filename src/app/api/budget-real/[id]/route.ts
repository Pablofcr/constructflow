import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/budget-real/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const budget = await prisma.budgetReal.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, codigo: true, name: true, enderecoEstado: true },
        },
        stages: {
          orderBy: { order: 'asc' },
          include: {
            services: {
              include: {
                projectComposition: {
                  include: { items: true },
                },
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Erro ao buscar orçamento real:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT /api/budget-real/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name, description, status, state,
      bdiPercentage, bdiAdministration, bdiProfit, bdiTaxes, bdiRisk, bdiOthers,
      startDate, endDate, durationMonths, notes,
    } = body;

    const updated = await prisma.budgetReal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(state !== undefined && { state }),
        ...(bdiPercentage !== undefined && { bdiPercentage }),
        ...(bdiAdministration !== undefined && { bdiAdministration }),
        ...(bdiProfit !== undefined && { bdiProfit }),
        ...(bdiTaxes !== undefined && { bdiTaxes }),
        ...(bdiRisk !== undefined && { bdiRisk }),
        ...(bdiOthers !== undefined && { bdiOthers }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(durationMonths !== undefined && { durationMonths }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar orçamento real:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/budget-real/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.budgetReal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar orçamento real:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
