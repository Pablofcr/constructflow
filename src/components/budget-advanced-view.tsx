"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, DollarSign, Home, Calculator, Calendar } from "lucide-react"

interface BudgetData {
  // Dados básicos
  id: string
  projectId: string
  
  // Terreno
  landValue: number
  iptuValue: number
  itbiValue: number
  condominiumValue: number
  totalLandCost: number
  
  // CUB/CUC
  cubValue: number
  cucValue: number
  cubSource: string
  cubReferenceMonth: string
  cubType: string
  
  // Construção
  constructedArea: number
  areaDiscount: number
  equivalentArea: number
  constructionCost: number
  totalEstimatedCost: number
  projectDuration: number
  
  // Cenário Adverso
  adverseSaleValue: number
  adverseBrokerage: number
  adverseTaxes: number
  adverseNetProfit: number
  adverseProfitMargin: number
  adverseROE: number
  adverseMonthlyReturn: number
  adverseSaleDeadline: number
  
  // Cenário Esperado
  expectedSaleValue: number
  expectedBrokerage: number
  expectedTaxes: number
  expectedNetProfit: number
  expectedProfitMargin: number
  expectedROE: number
  expectedMonthlyReturn: number
  expectedSaleDeadline: number
  
  // Cenário Ideal
  idealSaleValue: number
  idealBrokerage: number
  idealTaxes: number
  idealNetProfit: number
  idealProfitMargin: number
  idealROE: number
  idealMonthlyReturn: number
  idealSaleDeadline: number
  
  // Matriz 3x3
  scenario_AA_monthlyReturn: number
  scenario_AA_totalMonths: number
  scenario_AE_monthlyReturn: number
  scenario_AE_totalMonths: number
  scenario_AI_monthlyReturn: number
  scenario_AI_totalMonths: number
  scenario_EA_monthlyReturn: number
  scenario_EA_totalMonths: number
  scenario_EE_monthlyReturn: number
  scenario_EE_totalMonths: number
  scenario_EI_monthlyReturn: number
  scenario_EI_totalMonths: number
  scenario_IA_monthlyReturn: number
  scenario_IA_totalMonths: number
  scenario_IE_monthlyReturn: number
  scenario_IE_totalMonths: number
  scenario_II_monthlyReturn: number
  scenario_II_totalMonths: number
}

interface BudgetAdvancedViewProps {
  projectId: string
  projectName: string
}

export default function BudgetAdvancedView({ projectId, projectName }: BudgetAdvancedViewProps) {
  const router = useRouter()
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudget()
  }, [projectId])

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/budget/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setBudget(data)
      }
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Orçamento não encontrado</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{projectName}</h1>
              <p className="text-gray-500 mt-1">Análise Completa de Viabilidade</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Custo Total Estimado</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(budget.totalEstimatedCost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Terreno</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(budget.totalLandCost)}
                </p>
              </div>
              <Home className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Construção</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(budget.constructionCost)}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Área Construída</p>
                <p className="text-2xl font-bold text-gray-900">
                  {budget.constructedArea} m²
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Prazo Obra</p>
                <p className="text-2xl font-bold text-gray-900">
                  {budget.projectDuration} meses
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Detalhamento do Terreno */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">💰 Custos do Terreno</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Valor do Terreno</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.landValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">IPTU</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.iptuValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">ITBI</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.itbiValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Condomínio</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.condominiumValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CUB e Construção */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">🏗️ Dados da Construção</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">CUB ({budget.cubType})</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.cubValue)}
                </p>
                <p className="text-xs text-gray-400">{budget.cubReferenceMonth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">CUC</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.cucValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Área Real</p>
                <p className="text-lg font-semibold text-gray-900">
                  {budget.constructedArea} m²
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Desconto BDI</p>
                <p className="text-lg font-semibold text-gray-900">
                  {budget.areaDiscount}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Área Equivalente</p>
                <p className="text-lg font-semibold text-gray-900">
                  {budget.equivalentArea} m²
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Análise de Viabilidade - 3 Cenários */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">📊 Análise de Viabilidade</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Métrica</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-red-600 uppercase">Adverso</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-blue-600 uppercase">Esperado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-green-600 uppercase">Ideal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Valor de Venda</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">
                    {formatCurrency(budget.adverseSaleValue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-blue-600 font-semibold">
                    {formatCurrency(budget.expectedSaleValue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">
                    {formatCurrency(budget.idealSaleValue)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Corretagem</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {formatCurrency(budget.adverseBrokerage)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {formatCurrency(budget.expectedBrokerage)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {formatCurrency(budget.idealBrokerage)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Impostos</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {formatCurrency(budget.adverseTaxes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {formatCurrency(budget.expectedTaxes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {formatCurrency(budget.idealTaxes)}
                  </td>
                </tr>
                <tr className="bg-blue-50 hover:bg-blue-100">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">Lucro Líquido</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-bold">
                    {formatCurrency(budget.adverseNetProfit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-blue-600 font-bold">
                    {formatCurrency(budget.expectedNetProfit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-bold">
                    {formatCurrency(budget.idealNetProfit)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Margem de Lucro</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600">
                    {formatPercent(budget.adverseProfitMargin)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-blue-600">
                    {formatPercent(budget.expectedProfitMargin)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">
                    {formatPercent(budget.idealProfitMargin)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">ROE (Retorno)</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600">
                    {formatPercent(budget.adverseROE)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-blue-600">
                    {formatPercent(budget.expectedROE)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">
                    {formatPercent(budget.idealROE)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Retorno Mensal</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600">
                    {formatPercent(budget.adverseMonthlyReturn)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-blue-600">
                    {formatPercent(budget.expectedMonthlyReturn)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">
                    {formatPercent(budget.idealMonthlyReturn)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Prazo de Venda</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {budget.adverseSaleDeadline} meses
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {budget.expectedSaleDeadline} meses
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {budget.idealSaleDeadline} meses
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Matriz 3x3 de Cenários Combinados */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">🎯 Matriz de Cenários Combinados</h2>
            <p className="text-sm text-gray-500 mt-1">
              Retorno mensal considerando diferentes combinações de custo vs prazo de venda
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Custo / Venda →
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-red-600 uppercase">
                    Adverso
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-blue-600 uppercase">
                    Esperado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-green-600 uppercase">
                    Ideal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-red-50">
                  <td className="px-6 py-4 text-sm font-medium text-red-600">Adverso</td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercent(budget.scenario_AA_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.scenario_AA_totalMonths} meses
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercent(budget.scenario_AE_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.scenario_AE_totalMonths} meses
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercent(budget.scenario_AI_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.scenario_AI_totalMonths} meses
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">Esperado</td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercent(budget.scenario_EA_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.scenario_EA_totalMonths} meses
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-100">
                    <div className="text-sm font-bold text-blue-600">
                      {formatPercent(budget.scenario_EE_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {budget.scenario_EE_totalMonths} meses
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercent(budget.scenario_EI_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.scenario_EI_totalMonths} meses
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-green-50">
                  <td className="px-6 py-4 text-sm font-medium text-green-600">Ideal</td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercent(budget.scenario_IA_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.scenario_IA_totalMonths} meses
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercent(budget.scenario_IE_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.scenario_IE_totalMonths} meses
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center bg-green-100">
                    <div className="text-sm font-bold text-green-600">
                      {formatPercent(budget.scenario_II_monthlyReturn)}/mês
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      {budget.scenario_II_totalMonths} meses
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-600">
              💡 <strong>Como ler:</strong> Cada célula mostra o retorno mensal (%) e prazo total (meses) 
              considerando uma combinação de custo (linha) e prazo de venda (coluna).
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
