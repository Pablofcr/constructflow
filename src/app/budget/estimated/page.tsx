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
  padraoEmpreendimento: 'POPULAR' | 'MEDIO' | 'ALTO'
}

// ✅ FUNÇÕES DE CÁLCULO IDÊNTICAS À API
function calculateAreaDiscount(cubType: string | null): number {
  if (!cubType) return 10
  if (cubType.includes('-A')) return 15  // Alto
  if (cubType.includes('-B') || cubType.includes('PIS')) return 8  // Popular
  return 10  // Normal
}

export default function BudgetEstimatedPage() {
  const router = useRouter()
  const { activeProject } = useProject()

  const projectId = activeProject?.id || ''

  const [project, setProject] = useState<Project | null>(null)
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ✅ ESTADOS EDITÁVEIS
  const [landValue, setLandValue] = useState(0)
  const [iptuPercent, setIptuPercent] = useState(0.5)
  const [condominium, setCondominium] = useState(0)
  const [itbiPercent, setItbiPercent] = useState(3)

  const [cubValue, setCubValue] = useState(0)
  const [cubType, setCubType] = useState<string>('R1-A')
  const [area, setArea] = useState(0)
  const [duration, setDuration] = useState(12)

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
      setLandValue(budget.landValue || 0)
      setIptuPercent(budget.iptuPercentage || 0.5)
      setCondominium(budget.condominiumValue || 0)
      setItbiPercent(budget.itbiPercentage || 3)
      setCubValue(budget.cubValue || 0)
      setCubType(budget.cubType || 'R1-A')
      setArea(budget.constructedArea || 0)
      setDuration(budget.projectDuration || 12)
    }
  }, [budget])

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
                  inputMode="numeric"
                  value={landValue ? landValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '').replace(',', '.')
                    const num = parseFloat(raw)
                    setLandValue(Number.isFinite(num) ? num : 0)
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="R$ 290.000,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IPTU (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={iptuPercent}
                    onChange={(e) => setIptuPercent(Number(e.target.value))}
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
                    inputMode="numeric"
                    value={condominium ? condominium.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, '').replace(',', '.')
                      const num = parseFloat(raw)
                      setCondominium(Number.isFinite(num) ? num : 0)
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="R$ 0,00"
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
                  type="number"
                  step="0.1"
                  value={itbiPercent}
                  onChange={(e) => setItbiPercent(Number(e.target.value))}
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
                  inputMode="numeric"
                  value={cubValue ? cubValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '').replace(',', '.')
                    const num = parseFloat(raw)
                    setCubValue(Number.isFinite(num) ? num : 0)
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="2.750,00"
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
                  type="number"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
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
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                />
              </div>
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

        {/* ✅ 3. ANÁLISE DE VIABILIDADE */}
        {budget && budget.adverseSaleValue ? (
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
              {/* ✅ MATRIZ */}
              {budget.scenarioAAMonthlyReturn !== null && (
                <ScenarioMatrix
                  adverse={{
                    value: 'Adverso',
                    roe: budget.adverseROE || 0,
                    saleValue: budget.adverseSaleValue || 0,
                    netProfit: budget.adverseNetProfit || 0,
                    profitMargin: budget.adverseProfitMargin || 0,
                  }}
                  expected={{
                    value: 'Esperado',
                    roe: budget.expectedROE || 0,
                    saleValue: budget.expectedSaleValue || 0,
                    netProfit: budget.expectedNetProfit || 0,
                    profitMargin: budget.expectedProfitMargin || 0,
                  }}
                  ideal={{
                    value: 'Ideal',
                    roe: budget.idealROE || 0,
                    saleValue: budget.idealSaleValue || 0,
                    netProfit: budget.idealNetProfit || 0,
                    profitMargin: budget.idealProfitMargin || 0,
                  }}
                  deadlines={{
                    adverse: budget.adverseSaleDeadline || 0,
                    expected: budget.expectedSaleDeadline || 0,
                    ideal: budget.idealSaleDeadline || 0,
                  }}
                  matrix={{
                    AA: {
                      monthlyReturn: budget.scenarioAAMonthlyReturn || 0,
                      totalMonths: budget.scenarioAATotalMonths || 0,
                    },
                    AE: {
                      monthlyReturn: budget.scenarioAEMonthlyReturn || 0,
                      totalMonths: budget.scenarioAETotalMonths || 0,
                    },
                    AI: {
                      monthlyReturn: budget.scenarioAIMonthlyReturn || 0,
                      totalMonths: budget.scenarioAITotalMonths || 0,
                    },
                    EA: {
                      monthlyReturn: budget.scenarioEAMonthlyReturn || 0,
                      totalMonths: budget.scenarioEATotalMonths || 0,
                    },
                    EE: {
                      monthlyReturn: budget.scenarioEEMonthlyReturn || 0,
                      totalMonths: budget.scenarioEETotalMonths || 0,
                    },
                    EI: {
                      monthlyReturn: budget.scenarioEIMonthlyReturn || 0,
                      totalMonths: budget.scenarioEITotalMonths || 0,
                    },
                    IA: {
                      monthlyReturn: budget.scenarioIAMonthlyReturn || 0,
                      totalMonths: budget.scenarioIATotalMonths || 0,
                    },
                    IE: {
                      monthlyReturn: budget.scenarioIEMonthlyReturn || 0,
                      totalMonths: budget.scenarioIETotalMonths || 0,
                    },
                    II: {
                      monthlyReturn: budget.scenarioIIMonthlyReturn || 0,
                      totalMonths: budget.scenarioIITotalMonths || 0,
                    },
                  }}
                  constructionDuration={duration}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              💡 Preencha os dados de Terreno e Construção acima e clique em "Salvar" para gerar a análise de viabilidade.
            </p>
          </div>
        )}

      </div>
      </div>
    </div>
  )
}
