import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase, BUCKET_NAME } from '@/lib/supabase';

// DELETE /api/projects/[id]/files/[fileId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { fileId } = await params;

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    // Remove from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([file.storagePath]);

    if (deleteError) {
      console.error('Erro ao remover do Supabase:', deleteError);
    }

    // Remove DB record
    await prisma.projectFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
