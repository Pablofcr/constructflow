import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    console.log('🔍 Buscando orçamento para projeto:', projectId)

    const budget = await prisma.budgetEstimated.findUnique({
      where: {
        projectId: projectId
      }
    })

    if (!budget) {
      console.log('❌ Orçamento não encontrado')
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Orçamento encontrado')

    return NextResponse.json(budget)
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar orçamento:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar orçamento',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
