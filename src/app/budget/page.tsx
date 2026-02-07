"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/project-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp, FileText, ArrowRight, Plus, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface BudgetEstimated {
  totalEstimatedCost: number
  totalLandCost: number
  constructionCost: number
  cubValue: number
  cubReferenceMonth: string | null
  updatedAt: string
  // Valores recalculados mais recentes (podem ser diferentes dos campos antigos)
  data?: {
    totalEstimatedCost?: number
    totalLandCost?: number
    constructionCost?: number
    cubValue?: number
  }
}

export default function BudgetPage() {
  const router = useRouter()
  const { activeProject } = useProject()
  const [loading, setLoading] = useState(true)
  const [budgetEstimated, setBudgetEstimated] = useState<BudgetEstimated | null>(null)

  useEffect(() => {
    if (activeProject) {
      fetchBudgetData()
    } else {
      setLoading(false)
    }
  }, [activeProject])

  const fetchBudgetData = async () => {
    if (!activeProject) return

    try {
      setLoading(true)
      
      // Buscar orçamento estimado
      const response = await fetch(`/api/budget/estimated?projectId=${activeProject.id}`)
      if (response.ok) {
        const data = await response.json()
        
        // 🔍 DEBUG: Ver o que está vindo da API
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 DADOS DA API (Resumo):')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('totalEstimatedCost (direto):', data.totalEstimatedCost)
        console.log('totalEstimatedCost (data):', data.data?.totalEstimatedCost)
        console.log('constructionCost (direto):', data.constructionCost)
        console.log('constructionCost (data):', data.data?.constructionCost)
        console.log('totalLandCost (direto):', data.totalLandCost)
        console.log('totalLandCost (data):', data.data?.totalLandCost)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('Objeto data completo:', data.data)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        setBudgetEstimated(data)
      } else {
        setBudgetEstimated(null)
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
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Função SIMPLIFICADA para pegar o valor correto (prioriza data recalculado)
  const getValue = (budget: BudgetEstimated, fieldName: string): number => {
    let result = 0
    let source = 'direto'
    
    // Verificar se tem o campo no data e se não é null/undefined
    if (budget.data) {
      // Verificações específicas por campo
      if (fieldName === 'totalEstimatedCost' && budget.data.totalEstimatedCost != null) {
        result = budget.data.totalEstimatedCost
        source = 'data'
      }
      else if (fieldName === 'totalLandCost' && budget.data.totalLandCost != null) {
        result = budget.data.totalLandCost
        source = 'data'
      }
      else if (fieldName === 'constructionCost' && budget.data.constructionCost != null) {
        result = budget.data.constructionCost
        source = 'data'
      }
      else if (fieldName === 'cubValue' && budget.data.cubValue != null) {
        result = budget.data.cubValue
        source = 'data'
      }
      else {
        // Se não achou no data, pega do campo direto
        const value = budget[fieldName as keyof BudgetEstimated]
        result = typeof value === 'number' ? value : 0
      }
    } else {
      // Se não tem data, pega do campo direto
      const value = budget[fieldName as keyof BudgetEstimated]
      result = typeof value === 'number' ? value : 0
    }
    
    console.log(`getValue('${fieldName}'): ${result} (fonte: ${source})`)
    return result
  }

  if (!activeProject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecione um Projeto
              </h3>
              <p className="text-gray-500">
                Escolha um projeto no seletor acima para acessar o módulo de orçamento
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 md:ml-20">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-8 w-8 text-blue-600" />
              Orçamento
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {activeProject.name}
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando orçamentos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ORÇAMENTO ESTIMADO */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orçamento Estimado</h2>
                      <p className="text-sm text-blue-100">Cálculo Rápido - Viabilidade</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {budgetEstimated ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Total Estimado</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {formatCurrency(getValue(budgetEstimated, 'totalEstimatedCost'))}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Terreno</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(getValue(budgetEstimated, 'totalLandCost'))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Construção</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(getValue(budgetEstimated, 'constructionCost'))}
                          </p>
                        </div>
                      </div>

                      {getValue(budgetEstimated, 'cubValue') > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">CUB Utilizado</p>
                          <p className="text-sm font-medium text-gray-700">
                            {formatCurrency(getValue(budgetEstimated, 'cubValue'))}/m²
                            {budgetEstimated.cubReferenceMonth && (
                              <span className="text-gray-500 ml-2">
                                ({budgetEstimated.cubReferenceMonth})
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Última Atualização</p>
                        <p className="text-sm text-gray-700">
                          {formatDate(budgetEstimated.updatedAt)}
                        </p>
                      </div>

                      <Link href={activeProject ? `/budget/estimated?projectId=${activeProject.id}` : "/budget/estimated"}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Ver Detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Nenhum Orçamento Estimado
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Crie um orçamento estimado para análise rápida de viabilidade
                      </p>
                      <Link href={activeProject ? `/budget/estimated?projectId=${activeProject.id}` : "/budget/estimated"}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Orçamento Estimado
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* ORÇAMENTO REAL */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-50">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orçamento Real</h2>
                      <p className="text-sm text-green-100">Detalhado - Execução</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      Em Desenvolvimento
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Orçamento detalhado com insumos, composições e quantitativos
                    </p>
                    <Button disabled className="bg-gray-300 cursor-not-allowed">
                      Em Breve
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 Diferença entre Estimado e Real
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">📊 Orçamento Estimado:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Cálculo rápido usando CUB</li>
                  <li>Análise de viabilidade</li>
                  <li>Estimativa de custos globais</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">📑 Orçamento Real:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Detalhamento completo</li>
                  <li>Insumos e composições</li>
                  <li>Controle preciso de custos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
