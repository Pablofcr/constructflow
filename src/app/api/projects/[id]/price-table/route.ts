import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/price-table?type=MATERIAL&search=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      projectComposition: { projectId },
    };
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.projectCompositionItem.findMany({
      where,
      include: {
        projectComposition: {
          select: { code: true, description: true, category: true },
        },
      },
      orderBy: [{ type: 'asc' }, { description: 'asc' }],
      take: 200,
    });

    // Deduplicate by insumo code (same as old price-tables route)
    const uniqueItems = new Map<string, typeof items[0]>();
    for (const item of items) {
      if (!uniqueItems.has(item.code || item.description)) {
        uniqueItems.set(item.code || item.description, item);
      }
    }

    // Map to expected shape (composition → for UI compatibility)
    const result = Array.from(uniqueItems.values()).map((item) => ({
      id: item.id,
      code: item.code,
      description: item.description,
      unit: item.unit,
      type: item.type,
      unitPrice: item.unitPrice,
      coefficient: item.coefficient,
      totalPrice: item.totalPrice,
      composition: {
        code: item.projectComposition.code,
        description: item.projectComposition.description,
        category: item.projectComposition.category,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar tabela de preços do projeto:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
