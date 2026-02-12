import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase, BUCKET_NAME } from '@/lib/supabase';

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
};

// GET /api/projects/[id]/files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const files = await prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/projects/[id]/files
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'OTHER';

    if (!file) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    // Validate file type (PDF + images)
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: 'Formato não suportado. Use PDF, JPG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (50MB for PDF, 20MB for images)
    const maxSize = file.type === 'application/pdf' ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return NextResponse.json({ error: `Arquivo excede ${maxMB}MB` }, { status: 400 });
    }

    // Sanitize filename for Supabase Storage (no accents, spaces, or special chars)
    const safeName = file.name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-zA-Z0-9._-]/g, '_'); // replace special chars with underscore

    // Upload to Supabase Storage
    const storagePath = `${projectId}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Erro no upload Supabase:', uploadError);
      return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
    }

    // Create DB record
    const projectFile = await prisma.projectFile.create({
      data: {
        projectId,
        fileName: file.name,
        category: category as 'ARCHITECTURAL' | 'STRUCTURAL' | 'ELECTRICAL' | 'HYDRAULIC' | 'OTHER',
        storagePath,
        fileSize: file.size,
      },
    });

    return NextResponse.json(projectFile, { status: 201 });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
