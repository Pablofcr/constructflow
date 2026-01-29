"use client"

import { useEffect, useState } from 'react'
import { useProject } from '@/contexts/project-context'
import { Sidebar } from '@/components/sidebar'
import { AllocationManager } from '@/components/allocation-manager'
import { AdvancedFilter } from '@/components/advanced-filter'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Users, UserCheck, Calendar, Building, Building2, Loader2, MapPin, Filter, X } from 'lucide-react'
import Link from 'next/link'

interface Allocation {
  id: string
  costCenterId: string
  costCenterType: string
  isActive: boolean
}

interface Collaborator {
  id: string
  name: string
  cpf: string
  role: string
  specialty: string
  status: string
  phone: string
  email: string
  costCenterId: string
  costCenterType: string
  allocations?: Allocation[]
}

type FilterMode = 'current' | 'multiple' | 'all'

export default function TeamPage() {
  const { activeProject } = useProject()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [filteredCollaborators, setFilteredCollaborators] = useState<Collaborator[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedCollaborator, setSelectedCollaborator] = useState<{ id: string; name: string } | null>(null)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [filterMode, setFilterMode] = useState<FilterMode>('current')
  const [selectedCenters, setSelectedCenters] = useState<string[]>([])

  const administrativeCenters = [
    { id: 'admin-sede', codigo: 'SEDE', name: 'Administrativo - Sede' },
    { id: 'admin-filial-01', codigo: 'FIL-01', name: 'Filial 01' },
    { id: 'admin-filial-02', codigo: 'FIL-02', name: 'Filial 02' },
  ]

  // Buscar projetos
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
    }
  }

  // Buscar colaboradores baseado no modo de filtro
  useEffect(() => {
    fetchCollaborators()
  }, [filterMode, selectedCenters, activeProject])

  const fetchCollaborators = async () => {
    setLoading(true)
    try {
      let url = '/api/team?includeAllocations=true'

      if (filterMode === 'current' && activeProject) {
        // Modo atual: busca por alocações no centro ativo
        url += `&useAllocations=true&costCenterId=${activeProject.id}`
      } else if (filterMode === 'multiple' && selectedCenters.length > 0) {
        // Modo múltiplo: busca por alocações nos centros selecionados
        url += `&useAllocations=true&costCenterIds=${selectedCenters.join(',')}`
      }
      // Modo 'all': busca todos (sem filtro de centro)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data)
        setFilteredCollaborators(data)
      }
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar colaboradores por busca e cargo
  useEffect(() => {
    let filtered = collaborators

    if (searchTerm) {
      filtered = filtered.filter(collab =>
        collab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collab.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(collab => collab.role === filterRole)
    }

    setFilteredCollaborators(filtered)
  }, [searchTerm, filterRole, collaborators])

  // Calcular estatísticas
  const totalCollaborators = filteredCollaborators.length
  const activeCollaborators = filteredCollaborators.filter(c => c.status === 'active').length
  const onVacation = filteredCollaborators.filter(c => c.status === 'vacation').length

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
      vacation: { label: 'Férias', color: 'bg-blue-100 text-blue-700' },
      away: { label: 'Afastado', color: 'bg-gray-100 text-gray-700' },
    }
    const { label, color } = statusMap[status] || statusMap.active
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    )
  }

  // Obter nome do centro de custo
  const getCenterName = (costCenterId: string, costCenterType: string) => {
    if (costCenterType === 'administrative') {
      const center = administrativeCenters.find(c => c.id === costCenterId)
      return center ? center.codigo : costCenterId
    } else {
      const project = projects.find(p => p.id === costCenterId)
      return project ? project.codigo : costCenterId
    }
  }

  const handleManageAllocations = (collaborator: Collaborator) => {
    setSelectedCollaborator({
      id: collaborator.id,
      name: collaborator.name
    })
  }

  const handleCloseAllocationManager = () => {
    setSelectedCollaborator(null)
    fetchCollaborators()
  }

  const handleApplyFilter = (mode: FilterMode, centers?: string[]) => {
    setFilterMode(mode)
    if (centers) {
      setSelectedCenters(centers)
    }
  }

  const getFilterModeLabel = () => {
    if (filterMode === 'all') {
      return '🌐 Todos os Colaboradores'
    } else if (filterMode === 'multiple') {
      return `🎯 ${selectedCenters.length} Centros Selecionados`
    } else if (activeProject) {
      return `📍 ${activeProject.name}`
    }
    return '📍 Centro Atual'
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 md:ml-20">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                Colaboradores
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">
                  Visualizando:
                </span>
                <button
                  onClick={() => setShowAdvancedFilter(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {getFilterModeLabel()}
                  </span>
                  <Filter className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>
            <Link href="/team/new">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo Colaborador
              </Button>
            </Link>
          </div>

          {/* Alert de modo ativo */}
          {filterMode !== 'current' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {filterMode === 'all' ? (
                    <>🌐 Visualizando TODOS os colaboradores do sistema</>
                  ) : (
                    <>🎯 Visualizando colaboradores de {selectedCenters.length} centros selecionados</>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setFilterMode('current')
                  setSelectedCenters([])
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCollaborators}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{activeCollaborators}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Férias</p>
                  <p className="text-2xl font-bold text-gray-900">{onVacation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome ou cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                  <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                  <SelectItem value="Mestre de Obras">Mestre de Obras</SelectItem>
                  <SelectItem value="Pedreiro">Pedreiro</SelectItem>
                  <SelectItem value="Eletricista">Eletricista</SelectItem>
                  <SelectItem value="Encanador">Encanador</SelectItem>
                  <SelectItem value="Gerente de Projetos">Gerente de Projetos</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Colaboradores */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando colaboradores...</p>
            </div>
          ) : filteredCollaborators.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum colaborador encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                {collaborators.length === 0 
                  ? 'Nenhum colaborador cadastrado ainda' 
                  : 'Nenhum colaborador corresponde aos filtros aplicados'}
              </p>
              {collaborators.length === 0 && filterMode === 'current' && (
                <Link href="/team/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Colaborador
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {collaborator.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{collaborator.role}</p>
                      {collaborator.specialty && (
                        <p className="text-xs text-gray-500">{collaborator.specialty}</p>
                      )}
                    </div>
                    {getStatusBadge(collaborator.status)}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📞</span>
                      <span>{collaborator.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">✉️</span>
                      <span className="truncate">{collaborator.email}</span>
                    </div>
                  </div>

                  {/* Badges de Alocações */}
                  {collaborator.allocations && collaborator.allocations.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-semibold text-gray-700">
                          Alocações Ativas:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {collaborator.allocations.map((allocation) => (
                          <span
                            key={allocation.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              allocation.costCenterType === 'administrative'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {allocation.costCenterType === 'administrative' ? (
                              <Building className="h-3 w-3" />
                            ) : (
                              <Building2 className="h-3 w-3" />
                            )}
                            {getCenterName(allocation.costCenterId, allocation.costCenterType)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botão Gerenciar Alocações */}
                  <Button
                    onClick={() => handleManageAllocations(collaborator)}
                    variant="outline"
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Gerenciar Alocações
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gerenciamento de Alocações */}
      {selectedCollaborator && (
        <AllocationManager
          collaboratorId={selectedCollaborator.id}
          collaboratorName={selectedCollaborator.name}
          onClose={handleCloseAllocationManager}
          onUpdate={handleCloseAllocationManager}
        />
      )}

      {/* Modal de Filtros Avançados */}
      {showAdvancedFilter && (
        <AdvancedFilter
          onApplyFilter={handleApplyFilter}
          currentCenter={activeProject}
          onClose={() => setShowAdvancedFilter(false)}
        />
      )}
    </div>
  )
}
