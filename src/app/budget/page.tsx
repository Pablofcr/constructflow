"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/project-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp, FileText, ArrowRight, Plus, Building2, Loader2, Sparkles, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { CreateBudgetDialog } from '@/components/orcamento-real/CreateBudgetDialog'
import { GenerateAIBudgetDialog } from '@/components/orcamento-ai/GenerateAIBudgetDialog'

interface BudgetEstimated {
  totalEstimatedCost: number
  totalLandCost: number
  constructionCost: number
  cubValue: number
  cubReferenceMonth: string | null
  updatedAt: string
  data?: {
    totalEstimatedCost?: number
    totalLandCost?: number
    constructionCost?: number
    cubValue?: number
  }
}

interface ProjectFileData {
  id: string
  fileName: string
  category: string
  fileSize: number
  uploadedAt: string
}

interface BudgetAIData {
  id: string
  name: string
  status: string
  totalDirectCost: number
  generatedAt: string | null
  stages: Array<{ id: string; code: string | null; totalCost: number }>
}

export default function BudgetPage() {
  const router = useRouter()
  const { activeProject } = useProject()
  const [loading, setLoading] = useState(true)
  const [budgetEstimated, setBudgetEstimated] = useState<BudgetEstimated | null>(null)
  const [budgetReal, setBudgetReal] = useState<{ id: string; name: string; totalDirectCost: number; status: string; stages: { id: string; code: string | null; totalCost: number }[] } | null>(null)
  const [budgetAI, setBudgetAI] = useState<BudgetAIData | null>(null)
  const [projectFiles, setProjectFiles] = useState<ProjectFileData[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deletingAI, setDeletingAI] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchBudgetData = useCallback(async () => {
    if (!activeProject) return

    try {
      setLoading(true)

      // Buscar orçamento estimado
      const response = await fetch(`/api/budget/estimated?projectId=${activeProject.id}`)
      if (response.ok) {
        const data = await response.json()
        setBudgetEstimated(data)
      } else {
        setBudgetEstimated(null)
      }

      // Buscar orçamento real
      const realRes = await fetch(`/api/budget-real?projectId=${activeProject.id}`)
      if (realRes.ok) {
        const realData = await realRes.json()
        if (realData.length > 0) {
          const br = realData[0]
          setBudgetReal({
            id: br.id,
            name: br.name,
            totalDirectCost: Number(br.totalDirectCost),
            status: br.status,
            stages: br.stages.map((s: { id: string; code: string | null; totalCost: number }) => ({
              id: s.id,
              code: s.code,
              totalCost: Number(s.totalCost),
            })),
          })
        } else {
          setBudgetReal(null)
        }
      }

      // Buscar orçamento IA
      const aiRes = await fetch(`/api/budget-ai?projectId=${activeProject.id}`)
      if (aiRes.ok) {
        const aiData = await aiRes.json()
        if (aiData.length > 0) {
          const ai = aiData[0]
          setBudgetAI({
            id: ai.id,
            name: ai.name,
            status: ai.status,
            totalDirectCost: Number(ai.totalDirectCost),
            generatedAt: ai.generatedAt,
            stages: ai.stages.map((s: { id: string; code: string | null; totalCost: number }) => ({
              id: s.id,
              code: s.code,
              totalCost: Number(s.totalCost),
            })),
          })

          // Start polling if GENERATING or EXTRACTING
          if (ai.status === 'GENERATING' || ai.status === 'PENDING' || ai.status === 'EXTRACTING') {
            setGenerating(true)
            startPolling(ai.id)
          }
        } else {
          setBudgetAI(null)
        }
      }

      // Buscar arquivos do projeto
      const filesRes = await fetch(`/api/projects/${activeProject.id}/files`)
      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setProjectFiles(filesData)
      }
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error)
    } finally {
      setLoading(false)
    }
  }, [activeProject])

  useEffect(() => {
    if (activeProject) {
      fetchBudgetData()
    } else {
      setLoading(false)
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [activeProject, fetchBudgetData])

  const startPolling = (budgetAIId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/budget-ai/${budgetAIId}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'GENERATED' || data.status === 'FAILED' || data.status === 'EXTRACTED') {
            setGenerating(false)
            if (pollingRef.current) clearInterval(pollingRef.current)
            fetchBudgetData()
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 3000)
  }

  const handleGenerateAI = async () => {
    if (!activeProject) return

    try {
      setGenerating(true)

      // Create budget AI
      const createRes = await fetch('/api/budget-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProject.id }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        alert(err.error || 'Erro ao criar orcamento IA')
        setGenerating(false)
        return
      }

      const budgetAIData = await createRes.json()
      setBudgetAI({
        id: budgetAIData.id,
        name: budgetAIData.name,
        status: 'EXTRACTING',
        totalDirectCost: 0,
        generatedAt: null,
        stages: budgetAIData.stages.map((s: { id: string; code: string | null; totalCost: number }) => ({
          id: s.id,
          code: s.code,
          totalCost: 0,
        })),
      })

      setShowAIDialog(false)

      // Trigger extraction (Phase 1)
      await fetch(`/api/budget-ai/${budgetAIData.id}/extract`, {
        method: 'POST',
      })

      // Start polling
      startPolling(budgetAIData.id)
    } catch (err) {
      console.error('Erro ao gerar orcamento IA:', err)
      setGenerating(false)
    }
  }

  const fetchProjectFiles = async () => {
    if (!activeProject) return
    const res = await fetch(`/api/projects/${activeProject.id}/files`)
    if (res.ok) {
      setProjectFiles(await res.json())
    }
  }

  const handleDeleteAI = async () => {
    if (!budgetAI) return
    if (!confirm('Tem certeza que deseja apagar o orcamento por IA? Voce podera gerar um novo depois.')) return

    try {
      setDeletingAI(true)
      const res = await fetch(`/api/budget-ai/${budgetAI.id}`, { method: 'DELETE' })
      if (res.ok) {
        setBudgetAI(null)
      } else {
        alert('Erro ao apagar orcamento IA')
      }
    } catch (err) {
      console.error('Erro ao apagar orcamento IA:', err)
      alert('Erro ao apagar orcamento IA')
    } finally {
      setDeletingAI(false)
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

  const getValue = (budget: BudgetEstimated, fieldName: string): number => {
    let result = 0

    if (budget.data) {
      if (fieldName === 'totalEstimatedCost' && budget.data.totalEstimatedCost != null) {
        result = budget.data.totalEstimatedCost
      }
      else if (fieldName === 'totalLandCost' && budget.data.totalLandCost != null) {
        result = budget.data.totalLandCost
      }
      else if (fieldName === 'constructionCost' && budget.data.constructionCost != null) {
        result = budget.data.constructionCost
      }
      else if (fieldName === 'cubValue' && budget.data.cubValue != null) {
        result = budget.data.cubValue
      }
      else {
        const value = budget[fieldName as keyof BudgetEstimated]
        result = typeof value === 'number' ? value : 0
      }
    } else {
      const value = budget[fieldName as keyof BudgetEstimated]
      result = typeof value === 'number' ? value : 0
    }

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
        <div className="max-w-7xl mx-auto p-4 md:p-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orcamento Completo</h2>
                      <p className="text-sm text-green-100">Detalhado - SINAPI</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {budgetReal ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(budgetReal.totalDirectCost)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Terreno</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetReal.stages
                                .filter((s) => s.code === '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Construção</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetReal.stages
                                .filter((s) => s.code !== '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Etapas</p>
                        <p className="text-sm text-gray-700">{budgetReal.stages.length} etapas</p>
                      </div>

                      <Link href={`/budget/real?budgetId=${budgetReal.id}`}>
                        <Button className="w-full bg-green-600 hover:bg-green-700">
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
                        Nenhum Orcamento Completo
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Crie um orcamento detalhado com composicoes SINAPI
                      </p>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Orcamento Completo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* ORÇAMENTO POR IA */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orcamento por IA</h2>
                      <p className="text-sm text-purple-100">Leitura de PDFs - Claude</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {generating ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {budgetAI?.status === 'GENERATING' ? 'Gerando Orcamento...' : 'Extraindo Variaveis...'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {budgetAI?.status === 'GENERATING'
                          ? 'A IA esta gerando o orcamento com as variaveis confirmadas.'
                          : 'A IA esta lendo as medidas dos PDFs. Isso pode levar alguns minutos.'}
                      </p>
                    </div>
                  ) : budgetAI && budgetAI.status === 'EXTRACTED' ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-purple-500" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Variaveis Extraidas
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Revise as medidas antes de gerar o orcamento
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Link href={`/budget/ai?budgetId=${budgetAI.id}`}>
                          <Button className="bg-purple-600 hover:bg-purple-700">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Revisar Variaveis
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={handleDeleteAI}
                          disabled={deletingAI}
                        >
                          {deletingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : budgetAI && budgetAI.status === 'GENERATED' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatCurrency(budgetAI.totalDirectCost)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Terreno</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetAI.stages
                                .filter((s) => s.code === '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Construção</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetAI.stages
                                .filter((s) => s.code !== '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                      </div>

                      {budgetAI.generatedAt && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Gerado em</p>
                          <p className="text-sm text-gray-700">
                            {formatDate(budgetAI.generatedAt)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link href={`/budget/ai?budgetId=${budgetAI.id}`} className="flex-1">
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            Ver Detalhes
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={handleDeleteAI}
                          disabled={deletingAI}
                        >
                          {deletingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : budgetAI && budgetAI.status === 'FAILED' ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">!</span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Erro na Geracao
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Ocorreu um erro ao gerar o orcamento. Tente novamente.
                      </p>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setShowAIDialog(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-purple-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Orcamento por IA
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Envie os PDFs dos projetos e a IA gera o orcamento automaticamente
                      </p>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setShowAIDialog(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Orcamento por IA
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Diferenca entre os 3 Orcamentos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">Orcamento Estimado:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Calculo rapido usando CUB</li>
                  <li>Analise de viabilidade</li>
                  <li>Estimativa de custos globais</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Orcamento Completo:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Detalhamento completo</li>
                  <li>Insumos e composicoes</li>
                  <li>Controle preciso de custos</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Orcamento por IA:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Leitura automatica de PDFs</li>
                  <li>Geracao inteligente via Claude</li>
                  <li>Mapeamento SINAPI automatico</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeProject && (
        <>
          <CreateBudgetDialog
            open={showCreateDialog}
            projectId={activeProject.id}
            onClose={() => setShowCreateDialog(false)}
            onCreated={(budgetId) => {
              setShowCreateDialog(false)
              router.push(`/budget/real?budgetId=${budgetId}`)
            }}
          />

          <GenerateAIBudgetDialog
            open={showAIDialog}
            projectId={activeProject.id}
            existingFiles={projectFiles}
            onClose={() => setShowAIDialog(false)}
            onFilesChanged={fetchProjectFiles}
            onGenerate={handleGenerateAI}
            generating={generating}
          />
        </>
      )}
    </div>
  )
}
