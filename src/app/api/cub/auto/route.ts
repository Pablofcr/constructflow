import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ========================================
// MAPEAMENTO: Tipo + Padrão → Código CUB
// ========================================

const CUB_MAPPING: Record<string, string> = {
  // RESIDENCIAL UNIFAMILIAR
  'RESIDENCIAL_UNIFAMILIAR_ALTO': 'R1-A',
  'RESIDENCIAL_UNIFAMILIAR_ALTO_PADRAO': 'R1-A',
  'RESIDENCIAL_UNIFAMILIAR_MEDIO': 'R1-N',
  'RESIDENCIAL_UNIFAMILIAR_MEDIO_PADRAO': 'R1-N',
  'RESIDENCIAL_UNIFAMILIAR_BAIXO_PADRAO': 'R1-B',
  'RESIDENCIAL_UNIFAMILIAR_POPULAR': 'PIS',
  'RESIDENCIAL_UNIFAMILIAR_LUXO': 'R1-A',

  // RESIDENCIAL MULTIFAMILIAR
  'RESIDENCIAL_MULTIFAMILIAR_ALTO': 'R8-A',
  'RESIDENCIAL_MULTIFAMILIAR_ALTO_PADRAO': 'R8-A',
  'RESIDENCIAL_MULTIFAMILIAR_MEDIO': 'R8-N',
  'RESIDENCIAL_MULTIFAMILIAR_MEDIO_PADRAO': 'R8-N',
  'RESIDENCIAL_MULTIFAMILIAR_BAIXO_PADRAO': 'R8-B',
  'RESIDENCIAL_MULTIFAMILIAR_POPULAR': 'PIS',
  'RESIDENCIAL_MULTIFAMILIAR_LUXO': 'R8-A',

  // RESIDENCIAL CONDOMÍNIO
  'RESIDENCIAL_CONDOMINIO_ALTO': 'R16-A',
  'RESIDENCIAL_CONDOMINIO_ALTO_PADRAO': 'R16-A',
  'RESIDENCIAL_CONDOMINIO_MEDIO': 'R16-N',
  'RESIDENCIAL_CONDOMINIO_MEDIO_PADRAO': 'R16-N',
  'RESIDENCIAL_CONDOMINIO_BAIXO_PADRAO': 'R8-B',
  'RESIDENCIAL_CONDOMINIO_POPULAR': 'PIS',
  'RESIDENCIAL_CONDOMINIO_LUXO': 'R16-A',

  // COMERCIAL SALA
  'COMERCIAL_SALA_ALTO': 'CSL-8-A',
  'COMERCIAL_SALA_ALTO_PADRAO': 'CSL-8-A',
  'COMERCIAL_SALA_MEDIO': 'CSL-8-N',
  'COMERCIAL_SALA_MEDIO_PADRAO': 'CSL-8-N',
  'COMERCIAL_SALA_BAIXO_PADRAO': 'CSL-8-N',
  'COMERCIAL_SALA_POPULAR': 'CSL-8-N',

  // COMERCIAL LOJA
  'COMERCIAL_LOJA_ALTO': 'CSL-16-A',
  'COMERCIAL_LOJA_ALTO_PADRAO': 'CSL-16-A',
  'COMERCIAL_LOJA_MEDIO': 'CSL-16-N',
  'COMERCIAL_LOJA_MEDIO_PADRAO': 'CSL-16-N',
  'COMERCIAL_LOJA_BAIXO_PADRAO': 'CSL-8-N',
  'COMERCIAL_LOJA_POPULAR': 'CSL-8-N',

  // INDUSTRIAL
  'INDUSTRIAL_GALPAO_ALTO': 'GI',
  'INDUSTRIAL_GALPAO_ALTO_PADRAO': 'GI',
  'INDUSTRIAL_GALPAO_MEDIO': 'GI',
  'INDUSTRIAL_GALPAO_MEDIO_PADRAO': 'GI',
  'INDUSTRIAL_GALPAO_BAIXO_PADRAO': 'GI',
  'INDUSTRIAL_GALPAO_POPULAR': 'GI',
}

// ========================================
// GET - BUSCAR CUB AUTOMÁTICO
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const estado = searchParams.get('estado')
    const tipoObra = searchParams.get('tipoObra')
    const subtipo = searchParams.get('subtipo')
    const padrao = searchParams.get('padrao')

    console.log('🔍 Buscando CUB para:', { estado, tipoObra, subtipo, padrao })

    // Validar parâmetros obrigatórios
    if (!estado) {
      return NextResponse.json(
        { error: 'Estado é obrigatório' },
        { status: 400 }
      )
    }

    if (!tipoObra || !padrao) {
      return NextResponse.json(
        { error: 'Tipo de obra e padrão são obrigatórios' },
        { status: 400 }
      )
    }

    // Montar chave de busca
    const key = `${tipoObra}_${subtipo || 'GERAL'}_${padrao}`.toUpperCase()
    const cubCode = CUB_MAPPING[key]

    console.log('🔑 Chave gerada:', key)
    console.log('📋 Código CUB mapeado:', cubCode)

    if (!cubCode) {
      // Tentar sem subtipo (fallback)
      const fallbackKey = `${tipoObra}_${padrao}`.toUpperCase()
      const fallbackCode = CUB_MAPPING[fallbackKey]
      
      if (!fallbackCode) {
        return NextResponse.json(
          { 
            error: 'Combinação de tipo e padrão não encontrada',
            key: key,
            availableKeys: Object.keys(CUB_MAPPING)
          },
          { status: 404 }
        )
      }
    }

    // ✅ NOME CORRETO: CubValues (com V maiúsculo)
    const cubValue = await prisma.cubValue.findFirst({
      where: {
        state: estado.toUpperCase(),
        cubCode: cubCode
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ]
    })

    if (!cubValue) {
      return NextResponse.json(
        { 
          error: 'CUB não encontrado para este estado e tipo',
          estado,
          cubCode
        },
        { status: 404 }
      )
    }

    console.log('✅ CUB encontrado:', cubValue)

    // Retornar dados do CUB
    return NextResponse.json({
      cubCode: cubValue.cubCode,
      cubValue: cubValue.totalValue,
      cucValue: cubValue.totalValue * 1.2, // CUC = CUB * 1.2
      referenceMonth: cubValue.referenceMonth,
      referenceYear: cubValue.referenceYear,
      state: cubValue.state,
      
      // Detalhamento (se disponível)
      materials: cubValue.materials,
      labor: cubValue.labor,
      equipment: cubValue.equipment,
      adminExpenses: cubValue.adminExpenses
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar CUB:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar CUB',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
