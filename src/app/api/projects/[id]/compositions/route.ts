import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/compositions?search=xxx&category=xx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: Record<string, unknown> = { projectId };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const compositions = await prisma.projectComposition.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: [{ category: 'asc' }, { description: 'asc' }],
      take: 100,
    });

    // Return same shape as the old /api/compositions endpoint
    const result = compositions.map((comp) => ({
      ...comp,
      unitCost: comp.unitCost,
      stateUnitCost: comp.unitCost, // already state-adjusted
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar composições do projeto:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
