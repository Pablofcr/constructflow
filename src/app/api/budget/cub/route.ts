import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar valores de CUB
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') // CE, SP, RJ
    const projectType = searchParams.get('projectType') // RESIDENCIAL, COMERCIAL
    const subtype = searchParams.get('subtype') // UNIFAMILIAR, MULTIFAMILIAR
    const standard = searchParams.get('standard') // BAIXO, NORMAL, ALTO
    const year = searchParams.get('year') // 2025
    const month = searchParams.get('month') // 12

    // Construir where clause
    const where: any = {}

    if (state) where.state = state
    if (projectType) where.projectType = projectType
    if (subtype) where.subtype = subtype
    if (standard) where.standard = standard
    if (year) where.referenceYear = parseInt(year)
    if (month) where.referenceMonth = parseInt(month)

    const cubValues = await prisma.cubValue.findMany({
      where,
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ]
    })

    return NextResponse.json(cubValues)
  } catch (error) {
    console.error('Erro ao buscar valores de CUB:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar valores de CUB' },
      { status: 500 }
    )
  }
}
