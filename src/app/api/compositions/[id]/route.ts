import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/compositions/[id]?state=CE
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'SP';

    const composition = await prisma.composition.findUnique({
      where: { id },
      include: {
        items: { orderBy: { type: 'asc' } },
        statePrices: { where: { state } },
      },
    });

    if (!composition) {
      return NextResponse.json({ error: 'Composição não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      ...composition,
      stateUnitCost: composition.statePrices[0]?.unitCost ?? composition.unitCost,
    });
  } catch (error) {
    console.error('Erro ao buscar composição:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
