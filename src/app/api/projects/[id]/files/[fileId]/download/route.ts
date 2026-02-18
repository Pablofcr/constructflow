import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase, BUCKET_NAME } from '@/lib/supabase';

// GET /api/projects/[id]/files/[fileId]/download
// Proxy PDF from Supabase Storage to the browser
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params;

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    // Validate file belongs to this project
    if (file.projectId !== projectId) {
      return NextResponse.json({ error: 'Arquivo não pertence ao projeto' }, { status: 403 });
    }

    // Download from Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(file.storagePath);

    if (error || !data) {
      console.error('Erro ao baixar do Supabase:', error);
      return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 500 });
    }

    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${file.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erro no download do arquivo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
