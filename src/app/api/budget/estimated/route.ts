import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Função para calcular área de desconto baseado no padrão
// ✅ PADRONIZADO: Alto=15m², Médio=10m², Popular=8m²
function calculateAreaDiscount(standard: string): number {
  const standardUpper = standard.toUpperCase()
  if (standardUpper === 'ALTO' || standardUpper === 'LUXO') return 15  // Alto padrão
  if (standardUpper === 'BAIXO' || standardUpper === 'POPULAR') return 8  // Popular
  return 10  // NORMAL/MÉDIO: padrão
}

// ✅ PRAZOS DE VENDA CORRIGIDOS
function determineSaleDeadlines(
  cubType: string | null
): { adverse: number; expected: number; ideal: number } {
  // Determinar padrão baseado no CUB
  let standard = 'NORMAL'
  if (cubType) {
    if (cubType.includes('-A')) standard = 'ALTO'
    else if (cubType.includes('-B') || cubType.includes('PIS')) standard = 'BAIXO'
    else standard = 'NORMAL'
  }

  // ALTO PADRÃO
  if (standard === 'ALTO') {
    return {
      adverse: 12,   // +12 meses de venda após conclusão
      expected: 6,   // +6 meses de venda após conclusão
      ideal: 0       // vende durante a construção (na planta)
    }
  }
  
  // BAIXO PADRÃO
  if (standard === 'BAIXO' || standard === 'POPULAR') {
    return {
      adverse: 8,    // +8 meses de venda após conclusão
      expected: 3,   // +3 meses de venda após conclusão
      ideal: 0       // vende durante a construção (na planta)
    }
  }
  
  // NORMAL/MÉDIO (padrão)
  return {
    adverse: 10,     // +10 meses de venda após conclusão
    expected: 4,     // +4 meses de venda após conclusão
    ideal: 0         // vende durante a construção (na planta)
  }
}

function calculateViability(totalCost: number, saleMultiplier: number, projectDuration: number, taxRegime: string = 'PF') {
  const saleValue = totalCost * saleMultiplier
  const brokerage = saleValue * 0.05

  let taxes: number
  switch (taxRegime) {
    case 'PJ_PRESUMIDO':
      taxes = saleValue * 0.0593
      break
    case 'PJ_SIMPLES':
      taxes = saleValue * 0.1133
      break
    case 'PJ_RET':
      taxes = saleValue * 0.04
      break
    default: { // PF
      const capitalGain = saleValue - brokerage - totalCost
      taxes = capitalGain > 0 ? capitalGain * 0.15 : 0
      break
    }
  }

  const netProfit = saleValue - totalCost - brokerage - taxes
  const profitMargin = saleValue > 0 ? (netProfit / saleValue) * 100 : 0
  const roe = totalCost > 0 ? (netProfit / totalCost) * 100 : 0
  const monthlyReturn = projectDuration > 0 ? roe / projectDuration : 0
  return { saleValue, brokerage, taxes, netProfit, profitMargin, roe, monthlyReturn }
}

function calculateMonthlyReturnWithSale(roe: number, constructionDuration: number, saleDeadline: number): number {
  const totalMonths = constructionDuration + saleDeadline
  return totalMonths > 0 ? roe / totalMonths : 0
}

// ✅ converte valores monetários para número (detecta formato automaticamente)
function moneyToNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback

  let s = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace('R$', '')

  // Detectar formato:
  // Se tem vírgula E ponto: formato brasileiro "1.234,56" → ponto é separador de milhares
  // Se tem apenas vírgula: formato brasileiro "1234,56" → vírgula é decimal
  // Se tem apenas ponto: formato americano "1234.56" → ponto é decimal
  
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  
  if (hasComma && hasDot) {
    // Formato brasileiro: "1.234,56" → remover pontos, trocar vírgula por ponto
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    // Formato brasileiro: "1234,56" → trocar vírgula por ponto
    s = s.replace(',', '.')
  }
  // Se tem apenas ponto ou nenhum: já está no formato correto (americano)

  const n = parseFloat(s)
  return Number.isFinite(n) ? n : fallback
}

function toNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : fallback
}

function toInt(value: any, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isFinite(n) ? n : fallback
}

// ✅ Compat layer: devolve no JSON os campos que o front espera
function shapeBudgetResponse(budget: any) {
  const data = (budget?.data ?? {}) as any

  // tenta puxar matriz do data.matrix (se existir) – senão monta do próprio model
  const m = data?.matrix ?? null

  const scenario_AA_totalMonths = m?.AA?.totalMonths
  const scenario_AE_totalMonths = m?.AE?.totalMonths
  const scenario_AI_totalMonths = m?.AI?.totalMonths
  const scenario_EA_totalMonths = m?.EA?.totalMonths
  const scenario_EE_totalMonths = m?.EE?.totalMonths
  const scenario_EI_totalMonths = m?.EI?.totalMonths
  const scenario_IA_totalMonths = m?.IA?.totalMonths
  const scenario_IE_totalMonths = m?.IE?.totalMonths
  const scenario_II_totalMonths = m?.II?.totalMonths

  return {
    ...budget,

    // espalha tudo que está dentro de data (para o front "enxergar" landValue, totalEstimatedCost, etc)
    ...data,

    // garante os nomes que o front provavelmente usa
    landValue: data?.landValue ?? null,
    iptuPercentage: data?.iptuPercentage ?? null,
    condominiumValue: data?.condominiumValue ?? null,
    condominiumTotalValue: data?.condominiumTotalValue ?? null,
    itbiPercentage: data?.itbiPercentage ?? null,
    cubValue: data?.cubValue ?? null,
    cucValue: data?.cucValue ?? null,
    cubSource: data?.cubSource ?? null,
    cubReferenceMonth: data?.cubReferenceMonth ?? null,
    cubType: data?.cubType ?? null,
    constructedArea: data?.constructedArea ?? null,
    projectDuration: data?.projectDuration ?? null,
    areaDiscount: data?.areaDiscount ?? null,
    equivalentArea: data?.equivalentArea ?? null,
    taxRegime: budget?.taxRegime ?? data?.taxRegime ?? 'PF',

    iptuValue: data?.iptuValue ?? null,
    itbiValue: data?.itbiValue ?? null,
    totalLandCost: data?.totalLandCost ?? null,
    constructionCost: data?.constructionCost ?? null,
    totalEstimatedCost: data?.totalEstimatedCost ?? null,

    adverseSaleValue: data?.viability?.adverse?.saleValue ?? null,
    adverseBrokerage: data?.viability?.adverse?.brokerage ?? null,
    adverseTaxes: data?.viability?.adverse?.taxes ?? null,
    adverseNetProfit: data?.viability?.adverse?.netProfit ?? null,
    adverseProfitMargin: data?.viability?.adverse?.profitMargin ?? null,
    adverseROE: data?.viability?.adverse?.roe ?? null,
    adverseMonthlyReturn: data?.viability?.adverse?.monthlyReturn ?? null,
    adverseSaleDeadline: data?.saleDeadlines?.adverse ?? null,

    expectedSaleValue: data?.viability?.expected?.saleValue ?? null,
    expectedBrokerage: data?.viability?.expected?.brokerage ?? null,
    expectedTaxes: data?.viability?.expected?.taxes ?? null,
    expectedNetProfit: data?.viability?.expected?.netProfit ?? null,
    expectedProfitMargin: data?.viability?.expected?.profitMargin ?? null,
    expectedROE: data?.viability?.expected?.roe ?? null,
    expectedMonthlyReturn: data?.viability?.expected?.monthlyReturn ?? null,
    expectedSaleDeadline: data?.saleDeadlines?.expected ?? null,

    idealSaleValue: data?.viability?.ideal?.saleValue ?? null,
    idealBrokerage: data?.viability?.ideal?.brokerage ?? null,
    idealTaxes: data?.viability?.ideal?.taxes ?? null,
    idealNetProfit: data?.viability?.ideal?.netProfit ?? null,
    idealProfitMargin: data?.viability?.ideal?.profitMargin ?? null,
    idealROE: data?.viability?.ideal?.roe ?? null,
    idealMonthlyReturn: data?.viability?.ideal?.monthlyReturn ?? null,
    idealSaleDeadline: data?.saleDeadlines?.ideal ?? null,

    // Matriz (monthlyReturn) — vem do model (compatível com schema atual)
    scenarioAAMonthlyReturn: budget?.baixoBaixo ?? null,
    scenarioAEMonthlyReturn: budget?.baixoMedio ?? null,
    scenarioAIMonthlyReturn: budget?.baixoAlto ?? null,
    scenarioEAMonthlyReturn: budget?.medioBaixo ?? null,
    scenarioEEMonthlyReturn: budget?.medioMedio ?? null,
    scenarioEIMonthlyReturn: budget?.medioAlto ?? null,
    scenarioIAMonthlyReturn: budget?.altoBaixo ?? null,
    scenarioIEMonthlyReturn: budget?.altoMedio ?? null,
    scenarioIIMonthlyReturn: budget?.altoAlto ?? null,

    // Matriz (totalMonths) — vem do data.matrix
    scenarioAATotalMonths: scenario_AA_totalMonths ?? null,
    scenarioAETotalMonths: scenario_AE_totalMonths ?? null,
    scenarioAITotalMonths: scenario_AI_totalMonths ?? null,
    scenarioEATotalMonths: scenario_EA_totalMonths ?? null,
    scenarioEETotalMonths: scenario_EE_totalMonths ?? null,
    scenarioEITotalMonths: scenario_EI_totalMonths ?? null,
    scenarioIATotalMonths: scenario_IA_totalMonths ?? null,
    scenarioIETotalMonths: scenario_IE_totalMonths ?? null,
    scenarioIITotalMonths: scenario_II_totalMonths ?? null
  }
}

// GET - Buscar orçamento estimado de um projeto
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 })
    }

    const budget = await prisma.budgetEstimated.findUnique({
      where: { projectId },
      include: { project: true }
    })

    if (!budget) {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(shapeBudgetResponse(budget))
  } catch (error: any) {
    console.error('Erro ao buscar orçamento:', error)
    return NextResponse.json({ error: 'Erro ao buscar orçamento' }, { status: 500 })
  }
}

// POST - Criar ou atualizar orçamento estimado
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      projectId,
      landValue,
      iptuPercentage,
      condominiumValue,
      itbiPercentage,
      cubValue,
      cubSource,
      cubReferenceMonth,
      cubType,
      constructedArea,
      projectDuration,
      taxRegime: rawTaxRegime,
      notes
    } = body ?? {}

    const taxRegime = ['PF', 'PJ_PRESUMIDO', 'PJ_SIMPLES', 'PJ_RET'].includes(rawTaxRegime) ? rawTaxRegime : 'PF'

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CÁLCULOS - CUSTOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const landVal = moneyToNumber(landValue, 0)
    // ✅ SEMPRE dividir por 100 porque o campo é percentual
    const iptuPerc = moneyToNumber(iptuPercentage, 0.5) / 100
    const itbiPerc = moneyToNumber(itbiPercentage, 3) / 100
    const condVal = moneyToNumber(condominiumValue, 0)
    const duration = toInt(projectDuration, 12)

    const iptuVal = landVal * iptuPerc
    const itbiVal = landVal * itbiPerc
    
    // ✅ CORREÇÃO: Condomínio é MENSAL, deve multiplicar pela duração da obra
    const condominiumTotal = condVal * duration
    const totalLand = landVal + iptuVal + condominiumTotal + itbiVal

    const cubVal = moneyToNumber(cubValue, 0)
    const cucVal = cubVal * 1.2
    const constArea = moneyToNumber(constructedArea, 0)

    // ✅ CORRIGIDO: Determinar padrão APENAS do cubType
    let standard = 'NORMAL'
    if (cubType) {
      if (String(cubType).includes('-A')) standard = 'ALTO'
      else if (String(cubType).includes('-B') || String(cubType).includes('PIS')) standard = 'BAIXO'
      else standard = 'NORMAL'
    }

    const areaDisc = calculateAreaDiscount(standard)
    const equivArea = Math.max(0, constArea - areaDisc)
    const constCost = cucVal * equivArea
    const totalEstimated = totalLand + constCost

    const saleDeadlines = determineSaleDeadlines(cubType ?? null)

    const adverse = calculateViability(totalEstimated, 1.40, duration, taxRegime)
    const expected = calculateViability(totalEstimated, 1.60, duration, taxRegime)
    const ideal = calculateViability(totalEstimated, 1.80, duration, taxRegime)

    const scenario_AA = { monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.adverse), totalMonths: duration + saleDeadlines.adverse }
    const scenario_AE = { monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.expected), totalMonths: duration + saleDeadlines.expected }
    const scenario_AI = { monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.ideal), totalMonths: duration + saleDeadlines.ideal }

    const scenario_EA = { monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.adverse), totalMonths: duration + saleDeadlines.adverse }
    const scenario_EE = { monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.expected), totalMonths: duration + saleDeadlines.expected }
    const scenario_EI = { monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.ideal), totalMonths: duration + saleDeadlines.ideal }

    const scenario_IA = { monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.adverse), totalMonths: duration + saleDeadlines.adverse }
    const scenario_IE = { monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.expected), totalMonths: duration + saleDeadlines.expected }
    const scenario_II = { monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.ideal), totalMonths: duration + saleDeadlines.ideal }

    // payload completo dentro do Json
    const payloadToStore = {
      projectId,
      landValue: landVal,
      iptuPercentage: moneyToNumber(iptuPercentage, 0.5),  // Salva valor original (0,5)
      iptuValue: iptuVal,
      condominiumValue: condVal,  // valor mensal
      condominiumTotalValue: condominiumTotal,  // ✅ valor total (mensal × duração)
      itbiPercentage: moneyToNumber(itbiPercentage, 3),  // Salva valor original (3)
      itbiValue: itbiVal,
      totalLandCost: totalLand,

      cubValue: cubVal,
      cucValue: cucVal,
      cubSource: cubSource ?? 'manual',
      cubReferenceMonth: cubReferenceMonth ?? null,
      cubType: cubType ?? null,

      constructedArea: constArea,
      areaDiscount: areaDisc,
      equivalentArea: equivArea,
      constructionCost: constCost,

      projectDuration: duration,
      totalEstimatedCost: totalEstimated,
      standard,
      taxRegime,

      saleDeadlines,

      viability: { adverse, expected, ideal },

      matrix: {
        AA: scenario_AA,
        AE: scenario_AE,
        AI: scenario_AI,
        EA: scenario_EA,
        EE: scenario_EE,
        EI: scenario_EI,
        IA: scenario_IA,
        IE: scenario_IE,
        II: scenario_II
      },

      notes: notes ?? null
    }

    const budget = await prisma.budgetEstimated.upsert({
      where: { projectId },
      update: {
        // Campos obrigatórios do schema
        landValue: landVal,
        iptuPercentage: iptuPerc,
        iptuValue: iptuVal,
        condominiumValue: condVal,
        itbiPercentage: itbiPerc,
        itbiValue: itbiVal,
        totalLandCost: totalLand,
        cubValue: cubVal,
        cucValue: cucVal,
        cubSource: cubSource ?? 'manual',
        cubReferenceMonth: cubReferenceMonth ?? null,
        cubType: cubType ?? null,
        constructedArea: constArea,
        areaDiscount: areaDisc,
        equivalentArea: equivArea,
        constructionCost: constCost,
        totalEstimatedCost: totalEstimated,
        projectDuration: duration,
        
        // matriz 3x3 (schema atual)
        baixoBaixo: scenario_AA.monthlyReturn,
        baixoMedio: scenario_AE.monthlyReturn,
        baixoAlto: scenario_AI.monthlyReturn,
        medioBaixo: scenario_EA.monthlyReturn,
        medioMedio: scenario_EE.monthlyReturn,
        medioAlto: scenario_EI.monthlyReturn,
        altoBaixo: scenario_IA.monthlyReturn,
        altoMedio: scenario_IE.monthlyReturn,
        altoAlto: scenario_II.monthlyReturn,

        cenarioSelecionado: body?.cenarioSelecionado ?? null,
        valorSelecionado: body?.valorSelecionado ? toNumber(body.valorSelecionado, 0) : null,
        taxRegime,

        data: payloadToStore,
        updatedAt: new Date()
      },
      create: {
        projectId,

        // Campos obrigatórios do schema
        landValue: landVal,
        iptuPercentage: iptuPerc,
        iptuValue: iptuVal,
        condominiumValue: condVal,
        itbiPercentage: itbiPerc,
        itbiValue: itbiVal,
        totalLandCost: totalLand,
        cubValue: cubVal,
        cucValue: cucVal,
        cubSource: cubSource ?? 'manual',
        cubReferenceMonth: cubReferenceMonth ?? null,
        cubType: cubType ?? null,
        constructedArea: constArea,
        areaDiscount: areaDisc,
        equivalentArea: equivArea,
        constructionCost: constCost,
        totalEstimatedCost: totalEstimated,
        projectDuration: duration,

        baixoBaixo: scenario_AA.monthlyReturn,
        baixoMedio: scenario_AE.monthlyReturn,
        baixoAlto: scenario_AI.monthlyReturn,
        medioBaixo: scenario_EA.monthlyReturn,
        medioMedio: scenario_EE.monthlyReturn,
        medioAlto: scenario_EI.monthlyReturn,
        altoBaixo: scenario_IA.monthlyReturn,
        altoMedio: scenario_IE.monthlyReturn,
        altoAlto: scenario_II.monthlyReturn,

        cenarioSelecionado: body?.cenarioSelecionado ?? null,
        valorSelecionado: body?.valorSelecionado ? toNumber(body.valorSelecionado, 0) : null,
        taxRegime,

        data: payloadToStore
      },
      include: { project: true }
    })

    await prisma.project.update({
      where: { id: projectId },
      data: { orcamentoEstimado: totalEstimated }
    })

    return NextResponse.json(shapeBudgetResponse(budget), { status: 201 })
  } catch (error: any) {
    console.error('Erro ao salvar orçamento:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar orçamento', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Deletar orçamento estimado
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 })
    }

    await prisma.budgetEstimated.delete({ where: { projectId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar orçamento:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar orçamento', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
