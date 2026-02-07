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
