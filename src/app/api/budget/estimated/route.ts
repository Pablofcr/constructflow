import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Função para calcular área de desconto baseado no padrão
function calculateAreaDiscount(standard: string): number {
  const standardUpper = standard.toUpperCase()
  if (standardUpper === 'ALTO') return 22.5
  if (standardUpper === 'BAIXO' || standardUpper === 'POPULAR') return 10
  return 15
}

// Função para determinar o padrão baseado no tipo de obra
function determineStandard(tipoObra: string, subtipoResidencial?: string | null): string {
  if (tipoObra === 'RESIDENCIAL') {
    if (subtipoResidencial === 'MULTIFAMILIAR') return 'NORMAL'
    return 'NORMAL'
  }
  if (tipoObra === 'COMERCIAL') return 'NORMAL'
  return 'NORMAL'
}

// Função para determinar prazos de venda baseado no padrão e tipo de construção
function determineSaleDeadlines(
  tipoObra: string,
  subtipoResidencial: string | null,
  cubType: string | null
): { adverse: number; expected: number; ideal: number } {
  // Determinar padrão
  let standard = 'NORMAL'
  if (cubType) {
    if (cubType.includes('-A')) standard = 'ALTO'
    else if (cubType.includes('-B') || cubType.includes('PIS')) standard = 'BAIXO'
    else standard = 'NORMAL'
  }

  // RESIDENCIAL UNIFAMILIAR (dados da tabela)
  if (tipoObra === 'RESIDENCIAL' && subtipoResidencial === 'UNIFAMILIAR') {
    if (standard === 'ALTO') {
      return {
        adverse: 24,    // 24 meses
        expected: 13,   // 12-14 meses (média: 13)
        ideal: 10       // até 10 meses
      }
    } else if (standard === 'BAIXO' || standard === 'POPULAR') {
      return {
        adverse: 12,    // 12 meses
        expected: 7,    // 6-8 meses (média: 7)
        ideal: 4        // até 4 meses
      }
    } else {
      // NORMAL/MÉDIO
      return {
        adverse: 18,    // 18 meses
        expected: 11,   // 10-12 meses (média: 11)
        ideal: 7        // até 7 meses
      }
    }
  }

  // OUTROS TIPOS (valores conservadores padrão)
  // Até termos dados específicos, usamos valores razoáveis
  if (standard === 'ALTO') {
    return { adverse: 24, expected: 15, ideal: 12 }
  } else if (standard === 'BAIXO') {
    return { adverse: 15, expected: 9, ideal: 6 }
  } else {
    return { adverse: 18, expected: 12, ideal: 9 }
  }
}

// Função para calcular análise de viabilidade para um cenário
function calculateViability(
  totalCost: number,
  saleMultiplier: number,
  projectDuration: number
) {
  const saleValue = totalCost * saleMultiplier
  const brokerage = saleValue * 0.05
  const capitalGain = saleValue - brokerage - totalCost
  const taxes = capitalGain * 0.15
  const netProfit = saleValue - totalCost - brokerage - taxes
  const profitMargin = (netProfit / saleValue) * 100
  const roe = (netProfit / totalCost) * 100
  const monthlyReturn = projectDuration > 0 ? roe / projectDuration : 0

  return { saleValue, brokerage, taxes, netProfit, profitMargin, roe, monthlyReturn }
}

// Função para calcular retorno mensal considerando prazo de venda
function calculateMonthlyReturnWithSale(
  roe: number,
  constructionDuration: number,
  saleDeadline: number
): number {
  const totalMonths = constructionDuration + saleDeadline
  return totalMonths > 0 ? roe / totalMonths : 0
}

// GET - Buscar orçamento estimado de um projeto
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    const budget = await prisma.budgetEstimated.findUnique({
      where: { projectId },
      include: {
        project: true
      }
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar orçamento' },
      { status: 500 }
    )
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
      notes
    } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CÁLCULOS - CUSTOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const landVal = parseFloat(landValue) || 0
    const iptuPerc = parseFloat(iptuPercentage) || 0.005
    const itbiPerc = parseFloat(itbiPercentage) || 0.03
    const condVal = parseFloat(condominiumValue) || 0

    const iptuVal = landVal * iptuPerc
    const itbiVal = landVal * itbiPerc
    const totalLand = landVal + iptuVal + condVal + itbiVal

    const cubVal = parseFloat(cubValue) || 0
    const cucVal = cubVal * 1.2
    const constArea = parseFloat(constructedArea) || 0

    let standard = 'NORMAL'
    if (cubType) {
      if (cubType.includes('-A')) standard = 'ALTO'
      else if (cubType.includes('-B') || cubType.includes('PIS')) standard = 'BAIXO'
      else standard = 'NORMAL'
    } else {
      standard = determineStandard(project.tipoObra, project.subtipoResidencial)
    }

    const areaDisc = calculateAreaDiscount(standard)
    const equivArea = Math.max(0, constArea - areaDisc)
    const constCost = cucVal * equivArea
    const totalEstimated = totalLand + constCost
    const duration = parseInt(projectDuration) || 12

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DETERMINAR PRAZOS DE VENDA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const saleDeadlines = determineSaleDeadlines(
      project.tipoObra,
      project.subtipoResidencial,
      cubType
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ANÁLISE DE VIABILIDADE - 3 CENÁRIOS BASE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const adverse = calculateViability(totalEstimated, 1.40, duration)
    const expected = calculateViability(totalEstimated, 1.60, duration)
    const ideal = calculateViability(totalEstimated, 1.80, duration)

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MATRIZ DE CENÁRIOS (9 combinações)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Adverso Valor (ROE baseado em +40%)
    const scenario_AA = {
      monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.adverse),
      totalMonths: duration + saleDeadlines.adverse
    }
    const scenario_AE = {
      monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.expected),
      totalMonths: duration + saleDeadlines.expected
    }
    const scenario_AI = {
      monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.ideal),
      totalMonths: duration + saleDeadlines.ideal
    }

    // Esperado Valor (ROE baseado em +60%)
    const scenario_EA = {
      monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.adverse),
      totalMonths: duration + saleDeadlines.adverse
    }
    const scenario_EE = {
      monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.expected),
      totalMonths: duration + saleDeadlines.expected
    }
    const scenario_EI = {
      monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.ideal),
      totalMonths: duration + saleDeadlines.ideal
    }

    // Ideal Valor (ROE baseado em +80%)
    const scenario_IA = {
      monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.adverse),
      totalMonths: duration + saleDeadlines.adverse
    }
    const scenario_IE = {
      monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.expected),
      totalMonths: duration + saleDeadlines.expected
    }
    const scenario_II = {
      monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.ideal),
      totalMonths: duration + saleDeadlines.ideal
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SALVAR NO BANCO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const budget = await prisma.budgetEstimated.upsert({
      where: { projectId },
      update: {
        // Terreno
        landValue: landVal,
        iptuPercentage: iptuPerc,
        iptuValue: iptuVal,
        condominiumValue: condVal,
        itbiPercentage: itbiPerc,
        itbiValue: itbiVal,
        totalLandCost: totalLand,

        // Construção
        cubValue: cubVal,
        cucValue: cucVal,
        cubSource: cubSource || 'manual',
        cubReferenceMonth: cubReferenceMonth || null,
        cubType: cubType || null,
        constructedArea: constArea,
        areaDiscount: areaDisc,
        equivalentArea: equivArea,
        constructionCost: constCost,

        // Duração
        projectDuration: duration,

        // Total
        totalEstimatedCost: totalEstimated,

        // Prazos de venda
        adverseSaleDeadline: saleDeadlines.adverse,
        expectedSaleDeadline: saleDeadlines.expected,
        idealSaleDeadline: saleDeadlines.ideal,

        // Viabilidade - Adverso
        adverseSaleValue: adverse.saleValue,
        adverseBrokerage: adverse.brokerage,
        adverseTaxes: adverse.taxes,
        adverseNetProfit: adverse.netProfit,
        adverseProfitMargin: adverse.profitMargin,
        adverseROE: adverse.roe,
        adverseMonthlyReturn: adverse.monthlyReturn,

        // Viabilidade - Esperado
        expectedSaleValue: expected.saleValue,
        expectedBrokerage: expected.brokerage,
        expectedTaxes: expected.taxes,
        expectedNetProfit: expected.netProfit,
        expectedProfitMargin: expected.profitMargin,
        expectedROE: expected.roe,
        expectedMonthlyReturn: expected.monthlyReturn,

        // Viabilidade - Ideal
        idealSaleValue: ideal.saleValue,
        idealBrokerage: ideal.brokerage,
        idealTaxes: ideal.taxes,
        idealNetProfit: ideal.netProfit,
        idealProfitMargin: ideal.profitMargin,
        idealROE: ideal.roe,
        idealMonthlyReturn: ideal.monthlyReturn,

        // Matriz de cenários
        scenario_AA_monthlyReturn: scenario_AA.monthlyReturn,
        scenario_AA_totalMonths: scenario_AA.totalMonths,
        scenario_AE_monthlyReturn: scenario_AE.monthlyReturn,
        scenario_AE_totalMonths: scenario_AE.totalMonths,
        scenario_AI_monthlyReturn: scenario_AI.monthlyReturn,
        scenario_AI_totalMonths: scenario_AI.totalMonths,

        scenario_EA_monthlyReturn: scenario_EA.monthlyReturn,
        scenario_EA_totalMonths: scenario_EA.totalMonths,
        scenario_EE_monthlyReturn: scenario_EE.monthlyReturn,
        scenario_EE_totalMonths: scenario_EE.totalMonths,
        scenario_EI_monthlyReturn: scenario_EI.monthlyReturn,
        scenario_EI_totalMonths: scenario_EI.totalMonths,

        scenario_IA_monthlyReturn: scenario_IA.monthlyReturn,
        scenario_IA_totalMonths: scenario_IA.totalMonths,
        scenario_IE_monthlyReturn: scenario_IE.monthlyReturn,
        scenario_IE_totalMonths: scenario_IE.totalMonths,
        scenario_II_monthlyReturn: scenario_II.monthlyReturn,
        scenario_II_totalMonths: scenario_II.totalMonths,

        notes: notes || null,
        updatedAt: new Date()
      },
      create: {
        projectId,
        
        // (mesmos campos do update)
        landValue: landVal,
        iptuPercentage: iptuPerc,
        iptuValue: iptuVal,
        condominiumValue: condVal,
        itbiPercentage: itbiPerc,
        itbiValue: itbiVal,
        totalLandCost: totalLand,

        cubValue: cubVal,
        cucValue: cucVal,
        cubSource: cubSource || 'manual',
        cubReferenceMonth: cubReferenceMonth || null,
        cubType: cubType || null,
        constructedArea: constArea,
        areaDiscount: areaDisc,
        equivalentArea: equivArea,
        constructionCost: constCost,

        projectDuration: duration,
        totalEstimatedCost: totalEstimated,

        adverseSaleDeadline: saleDeadlines.adverse,
        expectedSaleDeadline: saleDeadlines.expected,
        idealSaleDeadline: saleDeadlines.ideal,

        adverseSaleValue: adverse.saleValue,
        adverseBrokerage: adverse.brokerage,
        adverseTaxes: adverse.taxes,
        adverseNetProfit: adverse.netProfit,
        adverseProfitMargin: adverse.profitMargin,
        adverseROE: adverse.roe,
        adverseMonthlyReturn: adverse.monthlyReturn,

        expectedSaleValue: expected.saleValue,
        expectedBrokerage: expected.brokerage,
        expectedTaxes: expected.taxes,
        expectedNetProfit: expected.netProfit,
        expectedProfitMargin: expected.profitMargin,
        expectedROE: expected.roe,
        expectedMonthlyReturn: expected.monthlyReturn,

        idealSaleValue: ideal.saleValue,
        idealBrokerage: ideal.brokerage,
        idealTaxes: ideal.taxes,
        idealNetProfit: ideal.netProfit,
        idealProfitMargin: ideal.profitMargin,
        idealROE: ideal.roe,
        idealMonthlyReturn: ideal.monthlyReturn,

        scenario_AA_monthlyReturn: scenario_AA.monthlyReturn,
        scenario_AA_totalMonths: scenario_AA.totalMonths,
        scenario_AE_monthlyReturn: scenario_AE.monthlyReturn,
        scenario_AE_totalMonths: scenario_AE.totalMonths,
        scenario_AI_monthlyReturn: scenario_AI.monthlyReturn,
        scenario_AI_totalMonths: scenario_AI.totalMonths,

        scenario_EA_monthlyReturn: scenario_EA.monthlyReturn,
        scenario_EA_totalMonths: scenario_EA.totalMonths,
        scenario_EE_monthlyReturn: scenario_EE.monthlyReturn,
        scenario_EE_totalMonths: scenario_EE.totalMonths,
        scenario_EI_monthlyReturn: scenario_EI.monthlyReturn,
        scenario_EI_totalMonths: scenario_EI.totalMonths,

        scenario_IA_monthlyReturn: scenario_IA.monthlyReturn,
        scenario_IA_totalMonths: scenario_IA.totalMonths,
        scenario_IE_monthlyReturn: scenario_IE.monthlyReturn,
        scenario_IE_totalMonths: scenario_IE.totalMonths,
        scenario_II_monthlyReturn: scenario_II.monthlyReturn,
        scenario_II_totalMonths: scenario_II.totalMonths,

        notes: notes || null
      },
      include: {
        project: true
      }
    })

    await prisma.project.update({
      where: { id: projectId },
      data: {
        orcamentoEstimado: totalEstimated
      }
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar orçamento' },
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
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    await prisma.budgetEstimated.delete({
      where: { projectId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar orçamento' },
      { status: 500 }
    )
  }
}
