"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Filter, Check, Building, Building2 } from 'lucide-react'

interface CostCenter {
  id: string
  codigo: string
  name: string
  type: 'administrative' | 'project'
}

interface AdvancedFilterProps {
  onApplyFilter: (mode: 'current' | 'multiple' | 'all', selectedCenters?: string[]) => void
  currentCenter?: { id: string; name: string }
  onClose: () => void
}

export function AdvancedFilter({ onApplyFilter, currentCenter, onClose }: AdvancedFilterProps) {
  const [mode, setMode] = useState<'current' | 'multiple' | 'all'>('current')
  const [selectedCenters, setSelectedCenters] = useState<string[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const administrativeCenters: CostCenter[] = [
    { id: 'admin-sede', codigo: 'SEDE', name: 'Administrativo - Sede', type: 'administrative' },
    { id: 'admin-filial-01', codigo: 'FIL-01', name: 'Filial 01', type: 'administrative' },
    { id: 'admin-filial-02', codigo: 'FIL-02', name: 'Filial 02', type: 'administrative' },
  ]

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
    } finally {
      setLoading(false)
    }
  }

  const toggleCenter = (centerId: string) => {
    setSelectedCenters(prev =>
      prev.includes(centerId)
        ? prev.filter(id => id !== centerId)
        : [...prev, centerId]
    )
  }

  const handleApply = () => {
    if (mode === 'multiple' && selectedCenters.length === 0) {
      alert('Selecione pelo menos um centro de custo')
      return
    }
    onApplyFilter(mode, mode === 'multiple' ? selectedCenters : undefined)
    onClose()
  }

  const allCenters = [
    ...administrativeCenters.map(c => ({ ...c, type: 'administrative' as const })),
    ...projects.map(p => ({ 
      id: p.id, 
      codigo: p.codigo, 
      name: p.name, 
      type: 'project' as const 
    }))
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Filtros Avançados
              </h2>
              <p className="text-sm text-gray-500">
                Escolha como visualizar os colaboradores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Modo de Visualização */}
          <div className="mb-6">
            <Label className="text-base font-semibold mb-3 block">
              Modo de Visualização
            </Label>

            <div className="space-y-3">
              {/* Centro Atual */}
              <button
                onClick={() => setMode('current')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  mode === 'current'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${mode === 'current' ? 'text-blue-600' : 'text-gray-400'}`}>
                    {mode === 'current' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      📍 Centro Atual
                    </h3>
                    <p className="text-sm text-gray-600">
                      Mostra apenas colaboradores alocados em:{' '}
                      <span className="font-medium text-gray-900">
                        {currentCenter?.name || 'Nenhum selecionado'}
                      </span>
                    </p>
                  </div>
                </div>
              </button>

              {/* Múltiplos Centros */}
              <button
                onClick={() => setMode('multiple')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  mode === 'multiple'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${mode === 'multiple' ? 'text-blue-600' : 'text-gray-400'}`}>
                    {mode === 'multiple' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      🎯 Múltiplos Centros
                    </h3>
                    <p className="text-sm text-gray-600">
                      Selecione vários centros de custo para visualizar simultaneamente
                    </p>
                  </div>
                </div>
              </button>

              {/* Todos */}
              <button
                onClick={() => setMode('all')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  mode === 'all'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${mode === 'all' ? 'text-blue-600' : 'text-gray-400'}`}>
                    {mode === 'all' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      🌐 Todos os Colaboradores
                    </h3>
                    <p className="text-sm text-gray-600">
                      Visualiza todos os colaboradores cadastrados no sistema
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Seleção de Centros (apenas no modo múltiplo) */}
          {mode === 'multiple' && (
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Selecione os Centros de Custo
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({selectedCenters.length} selecionados)
                </span>
              </Label>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Carregando centros...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Administrativos */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Administrativos
                    </h4>
                    <div className="space-y-2">
                      {administrativeCenters.map((center) => (
                        <button
                          key={center.id}
                          onClick={() => toggleCenter(center.id)}
                          className={`w-full p-3 rounded-lg border transition-all text-left ${
                            selectedCenters.includes(center.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building className={`h-5 w-5 ${
                              selectedCenters.includes(center.id)
                                ? 'text-purple-600'
                                : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {center.codigo}
                              </p>
                              <p className="text-sm text-gray-600">
                                {center.name}
                              </p>
                            </div>
                            {selectedCenters.includes(center.id) && (
                              <Check className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Obras */}
                  {projects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Obras
                      </h4>
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => toggleCenter(project.id)}
                            className={`w-full p-3 rounded-lg border transition-all text-left ${
                              selectedCenters.includes(project.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className={`h-5 w-5 ${
                                selectedCenters.includes(project.id)
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`} />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {project.codigo}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {project.name}
                                </p>
                              </div>
                              {selectedCenters.includes(project.id) && (
                                <Check className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  )
}
