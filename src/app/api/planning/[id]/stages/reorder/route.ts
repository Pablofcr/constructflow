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
    await prisma.$transaction(async (tx) => {
      // Phase 1: set all orders to negative values (guaranteed unique)
      for (let i = 0; i < stageIds.length; i++) {
        await tx.planningStage.update({
          where: { id: stageIds[i] },
          data: { order: -(i + 1) },
        });
      }

      // Phase 2: set to final positive values
      for (let i = 0; i < stageIds.length; i++) {
        await tx.planningStage.update({
          where: { id: stageIds[i] },
          data: { order: i + 1 },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao reordenar etapas:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar etapas' },
      { status: 500 }
    );
  }
}
