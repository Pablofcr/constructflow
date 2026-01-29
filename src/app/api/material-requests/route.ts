import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/material-requests - Listar solicitações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const urgencia = searchParams.get('urgencia') || '';
    const projectId = searchParams.get('projectId') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { material: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'todos') {
      where.status = status;
    }

    if (urgencia && urgencia !== 'todos') {
      where.urgencia = urgencia;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const materialRequests = await prisma.materialRequest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            nome: true,
            codigo: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dataSolicitacao: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: materialRequests,
    });
  } catch (error: any) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar solicitações',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/material-requests - Criar nova solicitação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = ['codigo', 'material', 'quantidade', 'unidade', 'dataEntregaPrevista', 'projectId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Campo obrigatório: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Verificar se código já existe
    const existingRequest = await prisma.materialRequest.findUnique({
      where: { codigo: body.codigo },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Código de solicitação já existe',
        },
        { status: 400 }
      );
    }

    const materialRequest = await prisma.materialRequest.create({
      data: {
        codigo: body.codigo,
        material: body.material,
        quantidade: body.quantidade,
        unidade: body.unidade,
        urgencia: body.urgencia || 'media',
        status: body.status || 'pendente',
        dataSolicitacao: body.dataSolicitacao ? new Date(body.dataSolicitacao) : new Date(),
        dataEntregaPrevista: new Date(body.dataEntregaPrevista),
        observacoes: body.observacoes || '',
        projectId: body.projectId,
        userId: body.userId || null,
      },
      include: {
        project: {
          select: {
            id: true,
            nome: true,
            codigo: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: materialRequest,
        message: 'Solicitação criada com sucesso',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar solicitação',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
