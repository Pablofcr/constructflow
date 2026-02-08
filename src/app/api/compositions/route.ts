import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/compositions?search=xxx&category=xx&state=CE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const state = searchParams.get('state') || 'SP';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const compositions = await prisma.composition.findMany({
      where,
      include: {
        items: true,
        statePrices: {
          where: { state },
        },
      },
      orderBy: [{ category: 'asc' }, { description: 'asc' }],
      take: 100,
    });

    // Mapear para incluir preço do estado no nível raiz
    const result = compositions.map((comp) => ({
      ...comp,
      stateUnitCost: comp.statePrices[0]?.unitCost ?? comp.unitCost,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar composições:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/compositions - Criar composição custom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, description, unit, unitCost, category, subcategory, items } = body;

    if (!code || !description || !unit || unitCost === undefined) {
      return NextResponse.json(
        { error: 'code, description, unit e unitCost são obrigatórios' },
        { status: 400 }
      );
    }

    const composition = await prisma.composition.create({
      data: {
        id: crypto.randomUUID(),
        code,
        source: 'CUSTOM',
        description,
        unit,
        unitCost,
        category: category || null,
        subcategory: subcategory || null,
        items: items
          ? {
              create: items.map((item: { type: string; description: string; code?: string; unit: string; coefficient: number; unitPrice: number }) => ({
                id: crypto.randomUUID(),
                type: item.type,
                description: item.description,
                code: item.code || null,
                unit: item.unit,
                coefficient: item.coefficient,
                unitPrice: item.unitPrice,
                totalPrice: Math.round(item.coefficient * item.unitPrice * 10000) / 10000,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json(composition, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar composição:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
