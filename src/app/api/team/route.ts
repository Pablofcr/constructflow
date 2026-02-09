import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

// GET - Listar colaboradores (com filtro opcional por centro de custo ou alocações)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const costCenterId = searchParams.get('costCenterId')
    const costCenterIds = searchParams.get('costCenterIds') // Múltiplos centros separados por vírgula
    const useAllocations = searchParams.get('useAllocations') === 'true'
    const includeAllocations = searchParams.get('includeAllocations') === 'true'

    let collaborators

    if (useAllocations && (costCenterId || costCenterIds)) {
      // Buscar por alocações ativas
      const centerIdsArray = costCenterIds 
        ? costCenterIds.split(',')
        : costCenterId ? [costCenterId] : []

      // Buscar colaboradores que tem alocação ativa nos centros especificados
      const allocations = await prisma.collaboratorAllocation.findMany({
        where: {
          costCenterId: {
            in: centerIdsArray
          },
          isActive: true
        },
        include: {
          collaborator: true
        },
        distinct: ['collaboratorId']
      })

      // Extrair colaboradores únicos
      const uniqueCollaboratorIds = [...new Set(allocations.map(a => a.collaboratorId))]
      
      collaborators = await prisma.collaborator.findMany({
        where: {
          id: {
            in: uniqueCollaboratorIds
          }
        },
        include: includeAllocations ? {
          allocations: {
            where: {
              isActive: true
            }
          }
        } : undefined,
        orderBy: {
          name: 'asc'
        }
      })
    } else if (costCenterId) {
      // Buscar pelo centro de custo principal (legado)
      collaborators = await prisma.collaborator.findMany({
        where: { costCenterId },
        include: includeAllocations ? {
          allocations: {
            where: {
              isActive: true
            }
          }
        } : undefined,
        orderBy: {
          name: 'asc'
        }
      })
    } else {
      // Buscar todos
      collaborators = await prisma.collaborator.findMany({
        include: includeAllocations ? {
          allocations: {
            where: {
              isActive: true
            }
          }
        } : undefined,
        orderBy: {
          name: 'asc'
        }
      })
    }

    return NextResponse.json(collaborators)
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar colaboradores' },
      { status: 500 }
    )
  }
}

// POST - Criar novo colaborador
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos obrigatórios
    const requiredFields = [
      'name',
      'cpf',
      'birthDate',
      'role',
      'status',
      'hireDate',
      'salary',
      'phone',
      'email',
      'costCenterId',
      'costCenterType'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        )
      }
    }

    // Verificar se CPF já existe
    const existingCollaborator = await prisma.collaborator.findUnique({
      where: { cpf: body.cpf }
    })

    if (existingCollaborator) {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      )
    }

    // Criar colaborador
    const collaborator = await prisma.collaborator.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        name: body.name,
        cpf: body.cpf,
        birthDate: new Date(body.birthDate),
        role: body.role,
        specialty: body.specialty || '',
        status: body.status,
        hireDate: new Date(body.hireDate),
        salary: parseFloat(body.salary),
        phone: body.phone,
        email: body.email,
        costCenterId: body.costCenterId,
        costCenterType: body.costCenterType,
      }
    })

    return NextResponse.json(collaborator, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar colaborador:', error)
    return NextResponse.json(
      { error: 'Erro ao criar colaborador' },
      { status: 500 }
    )
  }
}
