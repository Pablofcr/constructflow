import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/price-tables?state=CE&type=MATERIAL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'SP';
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.compositionItem.findMany({
      where,
      include: {
        composition: {
          select: { code: true, description: true, category: true },
        },
      },
      orderBy: [{ type: 'asc' }, { description: 'asc' }],
      take: 200,
    });

    // Agrupar por código de insumo (código único), pegando o primeiro de cada
    const uniqueItems = new Map<string, typeof items[0]>();
    for (const item of items) {
      if (!uniqueItems.has(item.code || item.description)) {
        uniqueItems.set(item.code || item.description, item);
      }
    }

    return NextResponse.json(Array.from(uniqueItems.values()));
  } catch (error) {
    console.error('Erro ao buscar tabela de preços:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
