import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/price-tables/[itemId] - Atualizar preço global de um insumo (template only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { unitPrice } = body;

    if (unitPrice === undefined) {
      return NextResponse.json({ error: 'unitPrice é obrigatório' }, { status: 400 });
    }

    const newPrice = Number(unitPrice);

    // Buscar o item original para pegar o código
    const originalItem = await prisma.compositionItem.findUnique({
      where: { id: itemId },
      select: { code: true, compositionId: true },
    });

    if (!originalItem) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    // 1. Atualizar TODOS os CompositionItems com o mesmo código de insumo
    const allItemsWithCode = await prisma.compositionItem.findMany({
      where: { code: originalItem.code },
      select: { id: true, coefficient: true, compositionId: true },
    });

    const affectedCompositionIds = new Set<string>();

    for (const item of allItemsWithCode) {
      const newTotal = Math.round(Number(item.coefficient) * newPrice * 10000) / 10000;
      await prisma.compositionItem.update({
        where: { id: item.id },
        data: {
          unitPrice: newPrice,
          totalPrice: newTotal,
          updatedAt: new Date(),
        },
      });
      affectedCompositionIds.add(item.compositionId);
    }

    // 2. Recalcular unitCost de TODAS as composições globais afetadas
    for (const compId of affectedCompositionIds) {
      const compItems = await prisma.compositionItem.findMany({
        where: { compositionId: compId },
        select: { totalPrice: true },
      });
      const newUnitCost = compItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);

      await prisma.composition.update({
        where: { id: compId },
        data: { unitCost: Math.round(newUnitCost * 10000) / 10000, updatedAt: new Date() },
      });

      // Atualizar preços por estado
      const statePrices = await prisma.sinapiStatePrice.findMany({
        where: { compositionId: compId },
      });
      const factors: Record<string, number> = { SP: 1.0, RJ: 1.05, MG: 0.92, BA: 0.88, CE: 0.85 };
      for (const sp of statePrices) {
        const factor = factors[sp.state] || 1.0;
        await prisma.sinapiStatePrice.update({
          where: { id: sp.id },
          data: { unitCost: Math.round(newUnitCost * factor * 10000) / 10000 },
        });
      }
    }

    // Note: Budget services now use ProjectCompositions (per-project copies).
    // Global price changes do NOT cascade to existing projects.
    // Only new projects will pick up the updated global prices.

    // Retornar item atualizado
    const updatedItem = await prisma.compositionItem.findUnique({
      where: { id: itemId },
      include: { composition: { select: { code: true, description: true, unitCost: true } } },
    });

    return NextResponse.json({
      ...updatedItem,
      _cascade: {
        itemsUpdated: allItemsWithCode.length,
        compositionsRecalculated: affectedCompositionIds.size,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar preço:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET /api/price-tables/[itemId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const item = await prisma.compositionItem.findUnique({
      where: { id: itemId },
      include: {
        composition: { select: { code: true, description: true, unitCost: true, category: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Erro ao buscar item:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/price-tables/[itemId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    await prisma.compositionItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar item:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
