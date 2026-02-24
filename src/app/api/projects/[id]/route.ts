import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Context) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Parâmetro id ausente' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { budgetEstimated: true, budgetReal: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PUT(req: Request, { params }: Context) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Parâmetro id ausente' }, { status: 400 })
    }

    const body = await req.json()

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        tipoObra: body.tipoObra,
        subtipoResidencial: body.subtipoResidencial,
        padraoEmpreendimento: body.padraoEmpreendimento,
        enderecoRua: body.enderecoRua,
        enderecoNumero: body.enderecoNumero,
        enderecoComplemento: body.enderecoComplemento,
        enderecoBairro: body.enderecoBairro,
        enderecoCidade: body.enderecoCidade,
        enderecoEstado: body.enderecoEstado,
        enderecoCEP: body.enderecoCEP,
        orcamentoEstimado: body.orcamentoEstimado,
        dataInicioEstimada: body.dataInicioEstimada,
        prazoFinal: body.prazoFinal,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar projeto' },
      { status: 500 }
    )
  }
}
