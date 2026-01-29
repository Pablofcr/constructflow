import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // IMPORTANTE: await params primeiro! (Next.js 15+)
    const { id } = await params
    
    const project = await prisma.project.findUnique({
      where: {
        id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Erro ao buscar projeto:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar projeto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // IMPORTANTE: await params primeiro! (Next.js 15+)
    const { id } = await params
    const body = await request.json()
    
    const project = await prisma.project.update({
      where: {
        id,
      },
      data: body,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // IMPORTANTE: await params primeiro! (Next.js 15+)
    const { id } = await params
    
    await prisma.project.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar projeto:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar projeto' },
      { status: 500 }
    )
  }
}
