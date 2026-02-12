import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      codigo: true,
      status: true,
      tipoObra: true,
      padraoEmpreendimento: true,
      enderecoCidade: true,
      enderecoEstado: true,
      orcamentoEstimado: true,
      orcamentoReal: true,
      totalGasto: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Auto-generate project code: OBR-YYYY-XXXX
    const year = new Date().getFullYear()
    const prefix = `OBR-${year}-`

    const lastProject = await prisma.project.findFirst({
      where: { codigo: { startsWith: prefix } },
      orderBy: { codigo: 'desc' },
      select: { codigo: true },
    })

    let nextNumber = 1
    if (lastProject) {
      const lastNum = parseInt(lastProject.codigo.replace(prefix, ''), 10)
      if (!isNaN(lastNum)) nextNumber = lastNum + 1
    }

    const codigo = `${prefix}${nextNumber.toString().padStart(4, '0')}`

    const project = await prisma.project.create({
      data: {
        codigo,
        name: body.name,
        description: body.description || null,
        status: body.status || 'PLANEJAMENTO',
        tipoObra: body.tipoObra,
        subtipoResidencial: body.subtipoResidencial || null,
        padraoEmpreendimento: body.padraoEmpreendimento || 'MEDIO_PADRAO',
        enderecoRua: body.enderecoRua,
        enderecoNumero: body.enderecoNumero,
        enderecoComplemento: body.enderecoComplemento || null,
        enderecoBairro: body.enderecoBairro,
        enderecoCidade: body.enderecoCidade,
        enderecoEstado: body.enderecoEstado,
        enderecoCEP: body.enderecoCEP,
        orcamentoEstimado: body.orcamentoEstimado || 0,
        totalGasto: body.totalGasto || 0,
        dataInicioEstimada: new Date(body.dataInicioEstimada),
        prazoFinal: new Date(body.prazoFinal),
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar projeto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar projeto', details: String(error) },
      { status: 500 }
    )
  }
}
