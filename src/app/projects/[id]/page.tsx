"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Map,
  Home as HomeIcon,
  Menu,
  X
} from 'lucide-react'

interface Project {
  id: string
  codigo: string
  name: string
  description: string | null
  status: string
  tipoObra: string
  subtipoResidencial: string | null
  
  // Endereço
  enderecoRua: string
  enderecoNumero: string
  enderecoComplemento: string | null
  enderecoBairro: string
  enderecoCidade: string
  enderecoEstado: string
  enderecoCEP: string
  latitude: number | null
  longitude: number | null
  
  // Orçamento
  orcamentoEstimado: number
  orcamentoReal: number | null
  totalGasto: number
  
  // Datas
  dataInicioEstimada: string
  dataInicioReal: string | null
  prazoFinal: string
  
  createdAt: string
  updatedAt: string
}

interface MenuItem {
  id: string
  label: string
  icon: string
  active?: boolean
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems: MenuItem[] = [
    { id: 'visao-geral', label: 'Visão Geral', icon: '/icons/obra.png', active: true },
    { id: 'colaboradores', label: 'Colaboradores', icon: '/icons/worker.png' },
    { id: 'orcamento', label: 'Orçamento', icon: '/icons/orcamento.png' },
    { id: 'planejamento', label: 'Planejamento', icon: '/icons/planning.png' },
    { id: 'diario', label: 'Diário de Obra', icon: '/icons/diary.png' },
    { id: 'materiais', label: 'Materiais', icon: '/icons/package.png' },
    { id: 'entregas', label: 'Entregas', icon: '/icons/truck.png' },
    { id: 'relatorios', label: 'Relatórios', icon: '/icons/chart.png' },
  ]

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [params.id])

  async function fetchProject(id: string) {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/projects/${id}`)
      
      if (!response.ok) {
        throw new Error('Projeto não encontrado')
      }
      
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
    
    if (!confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir projeto')

      router.push('/projects')
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
      alert('Erro ao excluir projeto. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = () => {
    if (!project) return
    router.push(`/projects/${project.id}/edit`)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANEJAMENTO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      EM_EXECUCAO: 'bg-blue-100 text-blue-800 border-blue-200',
      PAUSADO: 'bg-gray-100 text-gray-800 border-gray-200',
      CONCLUIDO: 'bg-green-100 text-green-800 border-green-200',
      CANCELADO: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANEJAMENTO: 'Planejamento',
      EM_EXECUCAO: 'Em Execução',
      PAUSADO: 'Pausado',
      CONCLUIDO: 'Concluído',
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calculateProgress = (gasto: number, orcamento: number) => {
    return Math.min((gasto / orcamento) * 100, 100)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 border-r bg-white animate-pulse">
          <div className="p-4 space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Projeto não encontrado'}
          </h3>
          <Button onClick={() => router.push('/projects')} variant="outline">
            Voltar para Projetos
          </Button>
        </Card>
      </div>
    )
  }

  const enderecoCompleto = `${project.enderecoRua}, ${project.enderecoNumero}${
    project.enderecoComplemento ? ` - ${project.enderecoComplemento}` : ''
  }, ${project.enderecoBairro}, ${project.enderecoCidade} - ${project.enderecoEstado}, CEP ${project.enderecoCEP}`

  const progress = calculateProgress(project.totalGasto, project.orcamentoReal || project.orcamentoEstimado)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">ConstructFlow</h2>
              <p className="text-xs text-gray-500">Gestão de Obras</p>
            </div>
          </div>
          
          {/* Botão Dashboard */}
          <Button
            variant="outline"
            className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => router.push('/')}
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Módulos da Obra
          </p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className={`text-sm font-medium ${item.active ? 'text-blue-700' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Project Info no rodapé */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 mb-1">Projeto Atual</div>
          <div className="font-medium text-sm text-gray-900 truncate">{project.name}</div>
          <div className="text-xs text-gray-500">{project.codigo}</div>
        </div>
      </aside>

      {/* Sidebar - Mobile (Overlay) */}
      {sidebarOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col">
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">ConstructFlow</h2>
                  <p className="text-xs text-gray-500">Gestão de Obras</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 border-b">
              <Button
                variant="outline"
                className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => router.push('/')}
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>

            {/* Mobile Menu Items */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Módulos da Obra
              </p>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <span className={`text-sm font-medium ${item.active ? 'text-blue-700' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">Projeto Atual</div>
              <div className="font-medium text-sm text-gray-900 truncate">{project.name}</div>
              <div className="text-xs text-gray-500">{project.codigo}</div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-gray-900">Dados da Obra</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Header do Projeto */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium text-gray-500">
                    {project.codigo}
                  </span>
                  <Badge className={`${getStatusColor(project.status)} border`}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-gray-600">{project.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEdit}
                  className="hidden sm:flex"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informações Básicas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Obra</label>
                  <p className="text-gray-900 mt-1">{getTipoObraLabel(project.tipoObra)}</p>
                </div>
                {project.subtipoResidencial && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subtipo</label>
                    <p className="text-gray-900 mt-1">{getSubtipoLabel(project.subtipoResidencial)}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Localização */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização
              </h2>
              <div className="space-y-3">
                <p className="text-gray-900">{enderecoCompleto}</p>
                {project.latitude && project.longitude && (
                  <Button variant="outline" size="sm" className="w-full md:w-auto">
                    <Map className="h-4 w-4 mr-2" />
                    Ver no Google Maps
                  </Button>
                )}
              </div>
            </Card>

            {/* Orçamento */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Orçamento
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimado</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatCurrency(project.orcamentoEstimado)}
                    </p>
                  </div>
                  {project.orcamentoReal && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Real</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {formatCurrency(project.orcamentoReal)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Gasto até agora</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(project.totalGasto)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {progress.toFixed(1)}% do orçamento utilizado
                  </p>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Saldo Disponível</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency((project.orcamentoReal || project.orcamentoEstimado) - project.totalGasto)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cronograma */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Início Estimado</label>
                  <p className="text-gray-900 mt-1">{formatDate(project.dataInicioEstimada)}</p>
                </div>
                {project.dataInicioReal && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Início Real</label>
                    <p className="text-gray-900 mt-1">{formatDate(project.dataInicioReal)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Prazo Final</label>
                  <p className="text-gray-900 mt-1">{formatDate(project.prazoFinal)}</p>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Criado em</label>
                  <p className="text-gray-900">{formatDate(project.createdAt)}</p>
                </div>
                <div>
                  <label className="text-gray-500">Última atualização</label>
                  <p className="text-gray-900">{formatDate(project.updatedAt)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
