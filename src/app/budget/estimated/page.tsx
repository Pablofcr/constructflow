'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Calculator } from 'lucide-react'
import { ScenarioMatrix } from '@/components/scenario-matrix'
import { useProject } from '@/contexts/project-context'

interface BudgetData {
  id: string
  projectId: string
  
  landValue: number
  iptuPercentage: number
  iptuValue: number
  itbiPercentage: number
  itbiValue: number
  condominiumValue: number
  condominiumTotalValue: number
  totalLandCost: number
  
  cubValue: number
  cucValue: number
  cubSource: string | null
  cubReferenceMonth: string | null
  cubType: string | null
  
  constructedArea: number
  areaDiscount: number
  equivalentArea: number
  constructionCost: number
  totalEstimatedCost: number
  projectDuration: number | null
  taxRegime: string | null
  
  adverseSaleValue: number | null
  adverseBrokerage: number | null
  adverseTaxes: number | null
  adverseNetProfit: number | null
  adverseProfitMargin: number | null
  adverseROE: number | null
  adverseMonthlyReturn: number | null
  adverseSaleDeadline: number | null
  
  expectedSaleValue: number | null
  expectedBrokerage: number | null
  expectedTaxes: number | null
  expectedNetProfit: number | null
  expectedProfitMargin: number | null
  expectedROE: number | null
  expectedMonthlyReturn: number | null
  expectedSaleDeadline: number | null
  
  idealSaleValue: number | null
  idealBrokerage: number | null
  idealTaxes: number | null
  idealNetProfit: number | null
  idealProfitMargin: number | null
  idealROE: number | null
  idealMonthlyReturn: number | null
  idealSaleDeadline: number | null
  
  scenarioAAMonthlyReturn: number | null
  scenarioAATotalMonths: number | null
  scenarioAEMonthlyReturn: number | null
  scenarioAETotalMonths: number | null
  scenarioAIMonthlyReturn: number | null
  scenarioAITotalMonths: number | null
  scenarioEAMonthlyReturn: number | null
  scenarioEATotalMonths: number | null
  scenarioEEMonthlyReturn: number | null
  scenarioEETotalMonths: number | null
  scenarioEIMonthlyReturn: number | null
  scenarioEITotalMonths: number | null
  scenarioIAMonthlyReturn: number | null
  scenarioIATotalMonths: number | null
  scenarioIEMonthlyReturn: number | null
  scenarioIETotalMonths: number | null
  scenarioIIMonthlyReturn: number | null
  scenarioIITotalMonths: number | null
}

interface Project {
  id: string
  codigo: string | null
  name: string | null
  padraoEmpreendimento: string
  enderecoEstado: string
}

// ✅ FUNÇÕES DE CÁLCULO IDÊNTICAS À API
function calculateAreaDiscount(cubType: string | null): number {
  if (!cubType) return 10
  if (cubType.includes('-A')) return 15  // Alto
  if (cubType.includes('-B') || cubType.includes('PIS')) return 8  // Popular
  return 10  // Normal
}

function getDefaultCubType(padrao: string | undefined): string {
  switch (padrao) {
    case 'POPULAR': return 'PIS'
    case 'MEDIO': case 'MEDIO_PADRAO': return 'R1-N'
    case 'ALTO': case 'ALTO_PADRAO': return 'R1-A'
    default: return 'R1-N'
  }
}

// Tabela CUB por estado e padrão (R$/m²)
// CE: SINDUSCON-CE jan/2026 (dados oficiais)
// Demais estados: estimativas baseadas em SINDUSCON-SP out/2025 + proporções regionais
const CUB_TABLE: Record<string, { PIS: number; 'R1-N': number; 'R1-A': number }> = {
  CE: { PIS: 1628.59, 'R1-N': 2789.73, 'R1-A': 3305.51 },  // SINDUSCON-CE jan/2026
  SP: { PIS: 1435.99, 'R1-N': 2538.83, 'R1-A': 3076.48 },
  RJ: { PIS: 1609.62, 'R1-N': 2845.00, 'R1-A': 3447.68 },
  MG: { PIS: 1504.33, 'R1-N': 2658.54, 'R1-A': 3221.59 },
  BA: { PIS: 1239.77, 'R1-N': 2191.00, 'R1-A': 2655.10 },
  RS: { PIS: 1641.20, 'R1-N': 2901.00, 'R1-A': 3515.50 },
  PR: { PIS: 1547.88, 'R1-N': 2736.00, 'R1-A': 3315.62 },
  SC: { PIS: 1813.66, 'R1-N': 3205.00, 'R1-A': 3884.10 },
  GO: { PIS: 1632.55, 'R1-N': 2885.00, 'R1-A': 3496.11 },
  PE: { PIS: 1262.46, 'R1-N': 2232.00, 'R1-A': 2704.78 },
  PA: { PIS: 1350.84, 'R1-N': 2387.00, 'R1-A': 2892.58 },
  DF: { PIS: 1352.89, 'R1-N': 2391.00, 'R1-A': 2897.42 },
  MT: { PIS: 1873.47, 'R1-N': 3311.00, 'R1-A': 4012.53 },
  ES: { PIS: 1680.34, 'R1-N': 2970.00, 'R1-A': 3599.05 },
  MA: { PIS: 1089.49, 'R1-N': 1925.00, 'R1-A': 2332.86 },
  RN: { PIS: 1198.36, 'R1-N': 2118.00, 'R1-A': 2566.64 },
  PI: { PIS: 1771.13, 'R1-N': 3130.00, 'R1-A': 3793.21 },
}

// Tabela completa CUB CE (SINDUSCON-CE jan/2026) - todos os tipos
// Para uso futuro em seleção detalhada de tipo de projeto
export const CUB_CE_FULL: Record<string, number> = {
  // Residenciais - Baixo
  'R1-B': 2311.84, 'PP-4-B': 2137.27, 'R8-B': 2032.54, 'PIS': 1628.59,
  // Residenciais - Normal
  'R1-N': 2789.73, 'PP-4-N': 2610.06, 'R8-N': 2276.70, 'R16-N': 2211.84,
  // Residenciais - Alto
  'R1-A': 3305.51, 'R8-A': 2701.07, 'R16-A': 2839.75,
  // Comerciais - Normal
  'CAL-8-N': 2542.70, 'CSL-8-N': 2246.70, 'CSL-16-N': 2987.67,
  // Comerciais - Alto
  'CAL-8-A': 2692.87, 'CSL-8-A': 2429.93, 'CSL-16-A': 3234.86,
  // Outros
  'RP1Q': 2556.64, 'GI': 1277.73,
}

// ✅ FUNÇÕES DE VIABILIDADE (idênticas à API) para cálculo instantâneo no frontend
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
    default: {
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

function determineSaleDeadlines(cubType: string | null): { adverse: number; expected: number; ideal: number } {
  let standard = 'NORMAL'
  if (cubType) {
    if (cubType.includes('-A')) standard = 'ALTO'
    else if (cubType.includes('-B') || cubType.includes('PIS')) standard = 'BAIXO'
  }
  if (standard === 'ALTO') return { adverse: 12, expected: 6, ideal: 0 }
  if (standard === 'BAIXO') return { adverse: 8, expected: 3, ideal: 0 }
  return { adverse: 10, expected: 4, ideal: 0 }
}

function calculateMonthlyReturnWithSale(roe: number, constructionDuration: number, saleDeadline: number): number {
  const totalMonths = constructionDuration + saleDeadline
  return totalMonths > 0 ? roe / totalMonths : 0
}

function getDefaultCubValue(padrao: string | undefined, estado: string | undefined): number {
  const uf = estado?.toUpperCase() || 'SP'
  const cubType = getDefaultCubType(padrao)
  const stateData = CUB_TABLE[uf] || CUB_TABLE['SP']
  return stateData[cubType as keyof typeof stateData] || stateData['R1-N']
}

export default function BudgetEstimatedPage() {
  const router = useRouter()
  const { activeProject } = useProject()

  const projectId = activeProject?.id || ''

  const [project, setProject] = useState<Project | null>(null)
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ✅ ESTADOS EDITÁVEIS (strings para preservar digitação do usuário)
  const [landValueStr, setLandValueStr] = useState('')
  const [iptuPercentStr, setIptuPercentStr] = useState('0.5')
  const [condominiumStr, setCondominiumStr] = useState('')
  const [itbiPercentStr, setItbiPercentStr] = useState('3')
  const [cubValueStr, setCubValueStr] = useState('')
  const [cubType, setCubType] = useState<string>('R1-N')
  const [areaStr, setAreaStr] = useState('')
  const [durationStr, setDurationStr] = useState('12')
  const [taxRegime, setTaxRegime] = useState('PF')

  // Parse numérico para cálculos
  const parseNum = (str: string) => parseFloat(str.replace(',', '.')) || 0
  const landValue = parseNum(landValueStr)
  const iptuPercent = parseNum(iptuPercentStr)
  const condominium = parseNum(condominiumStr)
  const itbiPercent = parseNum(itbiPercentStr)
  const cubValue = parseNum(cubValueStr)
  const area = parseNum(areaStr)
  const duration = parseNum(durationStr) || 12

  useEffect(() => {
    if (projectId) {
      loadProjectAndBudget()
    } else {
      setProject(null)
      setBudget(null)
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (budget) {
      setLandValueStr(budget.landValue ? String(budget.landValue) : '')
      setIptuPercentStr(String(budget.iptuPercentage ?? 0.5))
      setCondominiumStr(budget.condominiumValue ? String(budget.condominiumValue) : '')
      setItbiPercentStr(String(budget.itbiPercentage ?? 3))
      setCubValueStr(budget.cubValue ? String(budget.cubValue) : String(getDefaultCubValue(project?.padraoEmpreendimento, project?.enderecoEstado)))
      setCubType(budget.cubType || getDefaultCubType(project?.padraoEmpreendimento))
      setAreaStr(budget.constructedArea ? String(budget.constructedArea) : '')
      setDurationStr(String(budget.projectDuration || 12))
      setTaxRegime(budget.taxRegime || 'PF')
    } else if (project) {
      // Preenche automaticamente com base no padrão e estado da obra
      setCubType(getDefaultCubType(project.padraoEmpreendimento))
      setCubValueStr(String(getDefaultCubValue(project.padraoEmpreendimento, project.enderecoEstado)))
    }
  }, [budget, project])

  const loadProjectAndBudget = async () => {
    try {
      setLoading(true)

      const projectRes = await fetch(`/api/projects/${projectId}`)
      if (!projectRes.ok) {
        setProject(null)
        setBudget(null)
        return
      }

      const projectData = await projectRes.json()
      setProject(projectData)

      const budgetRes = await fetch(`/api/budget/estimated?projectId=${projectId}`)
      if (budgetRes.ok) {
        const budgetData = await budgetRes.json()
        setBudget(budgetData)
      } else {
        setBudget(null)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setProject(null)
      setBudget(null)
    } finally {
      setLoading(false)
    }
  }

  // ✅ CÁLCULOS AUTOMÁTICOS - CORRIGIDOS
  // SEMPRE dividir por 100 porque o campo é percentual (0,5 = 0,5%)
  const iptuPerc = iptuPercent / 100
  const itbiPerc = itbiPercent / 100
  
  const iptuValue = landValue * iptuPerc
  const itbiValue = landValue * itbiPerc
  const condominiumTotal = condominium * duration
  const totalLandCost = landValue + iptuValue + itbiValue + condominiumTotal
  
  const cucValue = cubValue * 1.2
  const areaDiscount = calculateAreaDiscount(cubType)
  const equivalentArea = Math.max(0, area - areaDiscount)
  const constructionCost = cucValue * equivalentArea
  
  const totalEstimatedCost = totalLandCost + constructionCost

  // ✅ VIABILIDADE CALCULADA LOCALMENTE (reage instantaneamente a qualquer mudança)
  const saleDeadlines = determineSaleDeadlines(cubType)

  const adverse = calculateViability(totalEstimatedCost, 1.40, duration, taxRegime)
  const expected = calculateViability(totalEstimatedCost, 1.60, duration, taxRegime)
  const ideal = calculateViability(totalEstimatedCost, 1.80, duration, taxRegime)

  const localMatrix = {
    AA: { monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.adverse), totalMonths: duration + saleDeadlines.adverse },
    AE: { monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.expected), totalMonths: duration + saleDeadlines.expected },
    AI: { monthlyReturn: calculateMonthlyReturnWithSale(adverse.roe, duration, saleDeadlines.ideal), totalMonths: duration + saleDeadlines.ideal },
    EA: { monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.adverse), totalMonths: duration + saleDeadlines.adverse },
    EE: { monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.expected), totalMonths: duration + saleDeadlines.expected },
    EI: { monthlyReturn: calculateMonthlyReturnWithSale(expected.roe, duration, saleDeadlines.ideal), totalMonths: duration + saleDeadlines.ideal },
    IA: { monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.adverse), totalMonths: duration + saleDeadlines.adverse },
    IE: { monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.expected), totalMonths: duration + saleDeadlines.expected },
    II: { monthlyReturn: calculateMonthlyReturnWithSale(ideal.roe, duration, saleDeadlines.ideal), totalMonths: duration + saleDeadlines.ideal },
  }

  const handleSave = async () => {
    if (!projectId) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/budget/estimated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          landValue,
          iptuPercentage: iptuPercent,
          itbiPercentage: itbiPercent,
          condominiumValue: condominium,
          cubValue,
          cubType,
          constructedArea: area,
          projectDuration: duration,
          taxRegime,
        })
      })
      
      if (response.ok) {
        alert('Orçamento salvo com sucesso!')
        loadProjectAndBudget()
      } else {
        const error = await response.json()
        console.error('Erro API:', error)
        alert(`Erro ao salvar: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar orçamento')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0,00%'
    return `${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    )
  }

  if (!projectId || !project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border p-8 text-center">
            <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {!projectId ? 'Selecione um Projeto' : 'Projeto não encontrado'}
            </h3>
            <p className="text-gray-500 mb-4">
              Use o seletor no topo da tela para escolher uma obra
            </p>
            <button
              onClick={() => router.push('/budget')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="inline-block mr-2 h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col -m-4 md:-m-6 bg-gray-50" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header - fixo no topo, não se move ao rolar */}
      <div className="bg-white border-b shadow-sm flex-shrink-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/budget')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <div className="border-l h-6" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Orçamento Estimado
                </h1>
                <p className="text-sm text-gray-500">
                  {project.codigo} • {project.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo rolável */}
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ✅ 1. FORMULÁRIOS EDITÁVEIS NO TOPO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CUSTOS DO TERRENO */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 py-4 border-b bg-green-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">🏠</span>
                Custos do Terreno
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Terreno *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={landValueStr}
                  onChange={(e) => setLandValueStr(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="290000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(landValue)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IPTU (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={iptuPercentStr}
                    onChange={(e) => setIptuPercentStr(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(iptuValue)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condomínio (mensal)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={condominiumStr}
                    onChange={(e) => setCondominiumStr(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {formatCurrency(condominiumTotal)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ITBI + Escritura (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={itbiPercentStr}
                  onChange={(e) => setItbiPercentStr(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(itbiValue)}
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOS DA CONSTRUÇÃO */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 py-4 border-b bg-blue-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">🏗️</span>
                Custos da Construção
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CUB (R$/m²) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cubValueStr}
                  onChange={(e) => setCubValueStr(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="2750"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    CUC: {formatCurrency(cucValue)}/m²
                  </p>
                  <select
                    value={cubType}
                    onChange={(e) => setCubType(e.target.value)}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="R1-A">Alto Padrão (R1-A)</option>
                    <option value="R1-N">Médio Padrão (R1-N)</option>
                    <option value="PIS">Popular (PIS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área (m²) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={areaStr}
                  onChange={(e) => setAreaStr(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="57"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Equiv.: {equivalentArea.toFixed(2)}m² (desconto: {areaDiscount}m²)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Duração da Obra (meses) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={durationStr}
                  onChange={(e) => setDurationStr(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                />
              </div>
            </div>
          </div>
        </div>

        {/* REGIME TRIBUTÁRIO */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b bg-amber-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">📋</span>
              Regime Tributário
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Selecione o regime para cálculo de impostos na análise de viabilidade
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  taxRegime === 'PF'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxRegime"
                  value="PF"
                  checked={taxRegime === 'PF'}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="mt-1 accent-amber-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">Pessoa Física</p>
                  <p className="text-sm text-gray-500">15% sobre ganho de capital</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  taxRegime === 'PJ_PRESUMIDO'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxRegime"
                  value="PJ_PRESUMIDO"
                  checked={taxRegime === 'PJ_PRESUMIDO'}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="mt-1 accent-amber-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">PJ - Lucro Presumido</p>
                  <p className="text-sm text-gray-500">~5,93% da receita bruta</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  taxRegime === 'PJ_SIMPLES'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxRegime"
                  value="PJ_SIMPLES"
                  checked={taxRegime === 'PJ_SIMPLES'}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="mt-1 accent-amber-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">PJ - Simples Nacional</p>
                  <p className="text-sm text-gray-500">~11,33% da receita bruta (Anexo IV)</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  taxRegime === 'PJ_RET'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxRegime"
                  value="PJ_RET"
                  checked={taxRegime === 'PJ_RET'}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="mt-1 accent-amber-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">PJ - RET</p>
                  <p className="text-sm text-gray-500">4% da receita bruta (Patrimônio de Afetação)</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ✅ 2. BANNER AZUL */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">💰</span>
            Custo Total do Empreendimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <p className="text-sm text-blue-100 mb-2">Terreno</p>
              <p className="text-3xl font-bold">
                {formatCurrency(totalLandCost)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <p className="text-sm text-blue-100 mb-2">Construção</p>
              <p className="text-3xl font-bold">
                {formatCurrency(constructionCost)}
              </p>
              <p className="text-xs text-blue-100 mt-2">
                CUC × Área Equivalente
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-6 backdrop-blur-sm border-2 border-white/30">
              <p className="text-sm text-blue-100 mb-2">Total</p>
              <p className="text-4xl font-bold">
                {formatCurrency(totalEstimatedCost)}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ 3. ANÁLISE DE VIABILIDADE (calculada localmente em tempo real) */}
        {totalEstimatedCost > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Análise de Viabilidade
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Projeção de retornos considerando diferentes cenários de valor e prazo
              </p>
            </div>

            <div className="p-6">
              <ScenarioMatrix
                adverse={{
                  value: 'Adverso',
                  roe: adverse.roe,
                  saleValue: adverse.saleValue,
                  netProfit: adverse.netProfit,
                  profitMargin: adverse.profitMargin,
                }}
                expected={{
                  value: 'Esperado',
                  roe: expected.roe,
                  saleValue: expected.saleValue,
                  netProfit: expected.netProfit,
                  profitMargin: expected.profitMargin,
                }}
                ideal={{
                  value: 'Ideal',
                  roe: ideal.roe,
                  saleValue: ideal.saleValue,
                  netProfit: ideal.netProfit,
                  profitMargin: ideal.profitMargin,
                }}
                deadlines={{
                  adverse: saleDeadlines.adverse,
                  expected: saleDeadlines.expected,
                  ideal: saleDeadlines.ideal,
                }}
                matrix={localMatrix}
                constructionDuration={duration}
              />
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              💡 Preencha os dados de Terreno e Construção acima para visualizar a análise de viabilidade.
            </p>
          </div>
        )}

      </div>
      </div>
    </div>
  )
}
