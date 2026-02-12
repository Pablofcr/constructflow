import { NextResponse } from 'next/server'
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
