import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar alocações de um colaborador
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collaboratorId = searchParams.get('collaboratorId')
    const costCenterId = searchParams.get('costCenterId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let where: any = {}

    if (collaboratorId) {
      where.collaboratorId = collaboratorId
    }

    if (costCenterId) {
      where.costCenterId = costCenterId
    }

    if (activeOnly) {
      where.isActive = true
    }

    const allocations = await prisma.collaboratorAllocation.findMany({
      where,
      include: {
        collaborator: true,
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json(allocations)
  } catch (error) {
    console.error('Erro ao buscar alocações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar alocações' },
      { status: 500 }
    )
  }
}

// POST - Criar nova alocação
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos obrigatórios
    const requiredFields = [
      'collaboratorId',
      'costCenterId',
      'costCenterType',
      'startDate',
      'allocationPercentage'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        )
      }
    }

    // Validar percentual
    if (body.allocationPercentage < 0 || body.allocationPercentage > 100) {
      return NextResponse.json(
        { error: 'Percentual de alocação deve estar entre 0 e 100' },
        { status: 400 }
      )
    }

    // Verificar se já existe alocação ativa para este colaborador neste centro
    const existingAllocation = await prisma.collaboratorAllocation.findFirst({
      where: {
        collaboratorId: body.collaboratorId,
        costCenterId: body.costCenterId,
        isActive: true,
      }
    })

    if (existingAllocation) {
      return NextResponse.json(
        { error: 'Colaborador já possui alocação ativa neste centro de custo' },
        { status: 400 }
      )
    }

    // Criar alocação
    const allocation = await prisma.collaboratorAllocation.create({
      data: {
        collaboratorId: body.collaboratorId,
        costCenterId: body.costCenterId,
        costCenterType: body.costCenterType,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        allocationPercentage: parseInt(body.allocationPercentage),
        isActive: body.isActive ?? true,
        notes: body.notes || null,
      },
      include: {
        collaborator: true,
      }
    })

    return NextResponse.json(allocation, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar alocação:', error)
    return NextResponse.json(
      { error: 'Erro ao criar alocação' },
      { status: 500 }
    )
  }
}

// DELETE - Remover/Encerrar alocação
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da alocação é obrigatório' },
        { status: 400 }
      )
    }

    // Encerrar alocação (marcar como inativa)
    const allocation = await prisma.collaboratorAllocation.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
      }
    })

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('Erro ao encerrar alocação:', error)
    return NextResponse.json(
      { error: 'Erro ao encerrar alocação' },
      { status: 500 }
    )
  }
}
