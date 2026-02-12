"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Map,
  ArrowLeft,
  Loader2,
  Info,
} from 'lucide-react'

interface Project {
  id: string
  codigo: string
  name: string
  description: string | null
  status: string
  tipoObra: string
  subtipoResidencial: string | null
  padraoEmpreendimento: string

  enderecoRua: string
  enderecoNumero: string
  enderecoComplemento: string | null
  enderecoBairro: string
  enderecoCidade: string
  enderecoEstado: string
  enderecoCEP: string
  latitude: number | null
  longitude: number | null

  orcamentoEstimado: number
  orcamentoReal: number | null
  totalGasto: number

  dataInicioEstimada: string
  dataInicioReal: string | null
  prazoFinal: string

  createdAt: string
  updatedAt: string

  budgetEstimated?: {
    totalEstimatedCost: number
    constructedArea: number
    constructionCost: number
    totalLandCost: number
  } | null
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchProject(params?.id as string)
    }
  }, [params?.id])

  async function fetchProject(id: string) {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) throw new Error('Projeto não encontrado')
      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError('Erro ao carregar projeto')
      console.error('Erro ao buscar projeto:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    if (!confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?\n\nEsta ação não pode ser desfeita.`)) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir projeto')
      router.push('/projects')
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
      alert('Erro ao excluir projeto. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      PLANEJAMENTO: 'bg-blue-100 text-blue-800 border-blue-200',
      EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      EM_EXECUCAO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PAUSADO: 'bg-gray-100 text-gray-800 border-gray-200',
      PARALISADA: 'bg-red-100 text-red-800 border-red-200',
      CONCLUIDO: 'bg-green-100 text-green-800 border-green-200',
      CONCLUIDA: 'bg-green-100 text-green-800 border-green-200',
      CANCELADO: 'bg-red-100 text-red-800 border-red-200',
    }
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANEJAMENTO: 'Planejamento',
      EM_ANDAMENTO: 'Em Andamento',
      EM_EXECUCAO: 'Em Execução',
      PAUSADO: 'Pausado',
      PARALISADA: 'Paralisada',
      CONCLUIDO: 'Concluído',
      CONCLUIDA: 'Concluída',
      CANCELADO: 'Cancelado',
    }
    return labels[status] || status
  }

  const getTipoObraLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      RESIDENCIAL: 'Residencial',
      COMERCIAL: 'Comercial',
      MISTA: 'Mista',
    }
    return labels[tipo] || tipo
  }

  const getSubtipoLabel = (subtipo: string | null) => {
    if (!subtipo) return null
    const labels: Record<string, string> = {
      UNIFAMILIAR: 'Unifamiliar (Casa)',
      MULTIFAMILIAR: 'Multifamiliar (Prédio)',
    }
    return labels[subtipo] || subtipo
  }

  const getPadraoLabel = (padrao: string) => {
    const labels: Record<string, string> = {
      POPULAR: 'Popular',
      MEDIO: 'Médio Padrão',
      MEDIO_PADRAO: 'Médio Padrão',
      ALTO: 'Alto Padrão',
      ALTO_PADRAO: 'Alto Padrão',
    }
    return labels[padrao] || padrao
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando projeto...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20 flex items-center justify-center">
          <div className="bg-white rounded-xl border p-8 text-center max-w-md">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Projeto não encontrado'}
            </h3>
            <button
              onClick={() => router.push('/projects')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Voltar para Projetos
            </button>
          </div>
        </div>
      </div>
    )
  }

  const enderecoCompleto = [
    project.enderecoRua,
    project.enderecoNumero,
    project.enderecoComplemento ? `- ${project.enderecoComplemento}` : '',
    project.enderecoBairro,
    `${project.enderecoCidade} - ${project.enderecoEstado}`,
    `CEP ${project.enderecoCEP}`,
  ].filter(Boolean).join(', ')

  const orcamentoRef = project.orcamentoReal || project.orcamentoEstimado || 0
  const progress = orcamentoRef > 0 ? Math.min((project.totalGasto / orcamentoRef) * 100, 100) : 0

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 md:ml-20">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/projects')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <div className="border-l h-6" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{project.codigo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/projects/${project.id}/edit`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Descrição */}
          {project.description && (
            <div className="bg-white rounded-xl border p-4">
              <p className="text-gray-600 text-sm">{project.description}</p>
            </div>
          )}

          {/* Grid 2 colunas: Info Básicas + Localização */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-6 py-4 border-b bg-blue-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Informações Básicas
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tipo de Obra</p>
                    <p className="text-sm font-medium text-gray-900">{getTipoObraLabel(project.tipoObra)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Subtipo</p>
                    <p className="text-sm font-medium text-gray-900">{getSubtipoLabel(project.subtipoResidencial) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Padrão</p>
                    <p className="text-sm font-medium text-gray-900">{getPadraoLabel(project.padraoEmpreendimento)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-medium text-gray-900">{getStatusLabel(project.status)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-6 py-4 border-b bg-green-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Localização
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rua</p>
                      <p className="text-sm font-medium text-gray-900">{project.enderecoRua}, {project.enderecoNumero}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bairro</p>
                      <p className="text-sm font-medium text-gray-900">{project.enderecoBairro}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cidade / UF</p>
                      <p className="text-sm font-medium text-gray-900">{project.enderecoCidade} - {project.enderecoEstado}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">CEP</p>
                      <p className="text-sm font-medium text-gray-900">{project.enderecoCEP}</p>
                    </div>
                  </div>
                  {project.enderecoComplemento && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Complemento</p>
                      <p className="text-sm font-medium text-gray-900">{project.enderecoComplemento}</p>
                    </div>
                  )}
                  {project.latitude && project.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Map className="h-4 w-4" />
                      Ver no Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Orçamento */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 py-4 border-b bg-amber-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                Orçamento
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estimado</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(project.orcamentoEstimado)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Real</p>
                  <p className="text-lg font-bold text-gray-900">
                    {project.orcamentoReal ? formatCurrency(project.orcamentoReal) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gasto</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(project.totalGasto)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Saldo</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(orcamentoRef - project.totalGasto)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progresso financeiro</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid 2 colunas: Cronograma + Sistema */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cronograma */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-6 py-4 border-b bg-purple-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Cronograma
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Início Estimado</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(project.dataInicioEstimada)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Início Real</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(project.dataInicioReal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Prazo Final</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(project.prazoFinal)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info do Sistema */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-6 py-4 border-b bg-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  Informações do Sistema
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Código</p>
                    <p className="text-sm font-medium text-gray-900">{project.codigo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ID</p>
                    <p className="text-sm font-medium text-gray-900 truncate text-xs">{project.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Criado em</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(project.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Última atualização</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(project.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
