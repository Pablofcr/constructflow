import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const body = await request.json();
    const { stageIds } = body as { stageIds: string[] };

    if (!Array.isArray(stageIds) || stageIds.length === 0) {
      return NextResponse.json(
        { error: 'stageIds deve ser um array nao vazio' },
        { status: 400 }
      );
    }

    // Validate UUID format for all IDs (defense in depth for raw SQL)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!stageIds.every((id) => uuidRegex.test(id)) || !uuidRegex.test(planningId)) {
      return NextResponse.json(
        { error: 'IDs invalidos' },
        { status: 400 }
      );
    }

    // Validate all IDs belong to this planning
    const existingStages = await prisma.planningStage.findMany({
      where: { planningId },
      select: { id: true },
    });

    const existingIds = new Set(existingStages.map((s) => s.id));

    if (stageIds.length !== existingIds.size) {
      return NextResponse.json(
        { error: 'stageIds deve conter todas as etapas do planejamento' },
        { status: 400 }
      );
    }

    for (const sid of stageIds) {
      if (!existingIds.has(sid)) {
        return NextResponse.json(
          { error: `Etapa ${sid} nao pertence a este planejamento` },
          { status: 400 }
        );
      }
    }

    // Two-phase transaction to avoid @@unique([planningId, order]) violations
    // Use raw SQL with CASE for bulk update in a single query per phase
    await prisma.$transaction(async (tx) => {
      // Phase 1: set all orders to negative values (guaranteed unique)
      const negCases = stageIds
        .map((id, i) => `WHEN id = '${id}' THEN ${-(i + 1)}`)
        .join(' ');
      await tx.$executeRawUnsafe(
        `UPDATE planning_stages SET "order" = CASE ${negCases} END WHERE "planningId" = '${planningId}'`
      );

      // Phase 2: set to final 0-based values
      const posCases = stageIds
        .map((id, i) => `WHEN id = '${id}' THEN ${i}`)
        .join(' ');
      await tx.$executeRawUnsafe(
        `UPDATE planning_stages SET "order" = CASE ${posCases} END WHERE "planningId" = '${planningId}'`
      );
    }, { timeout: 15000 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao reordenar etapas:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar etapas' },
      { status: 500 }
    );
  }
}
