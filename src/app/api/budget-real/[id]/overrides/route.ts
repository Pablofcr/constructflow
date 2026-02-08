import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/budget-real/[id]/overrides
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [compositionOverrides, itemOverrides] = await Promise.all([
      prisma.projectCompositionOverride.findMany({
        where: { budgetRealId: id },
        include: { composition: { select: { code: true, description: true } } },
      }),
      prisma.projectItemOverride.findMany({
        where: { budgetRealId: id },
        include: { compositionItem: { select: { code: true, description: true, type: true } } },
      }),
    ]);

    return NextResponse.json({ compositionOverrides, itemOverrides });
  } catch (error) {
    console.error('Erro ao buscar overrides:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/budget-real/[id]/overrides
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: budgetRealId } = await params;
    const body = await request.json();
    const { type, compositionId, compositionItemId, price } = body;

    if (type === 'composition' && compositionId && price !== undefined) {
      const override = await prisma.projectCompositionOverride.upsert({
        where: {
          budgetRealId_compositionId: { budgetRealId, compositionId },
        },
        update: { overriddenCost: price, updatedAt: new Date() },
        create: { budgetRealId, compositionId, overriddenCost: price },
      });
      return NextResponse.json(override, { status: 201 });
    }

    if (type === 'item' && compositionItemId && price !== undefined) {
      const override = await prisma.projectItemOverride.upsert({
        where: {
          budgetRealId_compositionItemId: { budgetRealId, compositionItemId },
        },
        update: { overriddenPrice: price, updatedAt: new Date() },
        create: { budgetRealId, compositionItemId, overriddenPrice: price },
      });
      return NextResponse.json(override, { status: 201 });
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao criar override:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
