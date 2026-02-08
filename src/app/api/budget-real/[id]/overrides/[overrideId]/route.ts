import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/budget-real/[id]/overrides/[overrideId]?type=composition|item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; overrideId: string }> }
) {
  try {
    const { overrideId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'composition';

    if (type === 'composition') {
      await prisma.projectCompositionOverride.delete({ where: { id: overrideId } });
    } else {
      await prisma.projectItemOverride.delete({ where: { id: overrideId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar override:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
