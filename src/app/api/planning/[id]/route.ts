import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const planning = await prisma.planning.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    if (!planning) {
      return NextResponse.json({ error: 'Planejamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(planning);
  } catch (error) {
    console.error('Erro ao buscar planejamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, description, status, startDate, endDate, notes } = body;

    const planning = await prisma.planning.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(planning);
  } catch (error) {
    console.error('Erro ao atualizar planejamento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar planejamento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.planning.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir planejamento:', error);
    return NextResponse.json({ error: 'Erro ao excluir planejamento' }, { status: 500 });
  }
}
