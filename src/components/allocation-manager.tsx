"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Plus, Trash2, Building, Building2, Loader2 } from 'lucide-react'

interface Allocation {
  id: string
  costCenterId: string
  costCenterType: string
  startDate: string
  endDate: string | null
  allocationPercentage: number
  isActive: boolean
  notes: string | null
}

interface AllocationManagerProps {
  collaboratorId: string
  collaboratorName: string
  onClose: () => void
  onUpdate: () => void
}

export function AllocationManager({ 
  collaboratorId, 
  collaboratorName,
  onClose,
  onUpdate 
}: AllocationManagerProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    costCenterId: '',
    costCenterType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    allocationPercentage: '100',
    notes: '',
  })

  const administrativeCenters = [
    { id: 'admin-sede', codigo: 'SEDE', name: 'Administrativo - Sede' },
    { id: 'admin-filial-01', codigo: 'FIL-01', name: 'Filial 01' },
    { id: 'admin-filial-02', codigo: 'FIL-02', name: 'Filial 02' },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar alocações do colaborador
      const allocRes = await fetch(`/api/allocations?collaboratorId=${collaboratorId}`)
      if (allocRes.ok) {
        const allocData = await allocRes.json()
        setAllocations(allocData)
      }

      // Buscar projetos disponíveis
      const projRes = await fetch('/api/projects')
      if (projRes.ok) {
        const projData = await projRes.json()
        setProjects(projData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        collaboratorId,
        costCenterId: formData.costCenterId,
        costCenterType: formData.costCenterType,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        allocationPercentage: parseInt(formData.allocationPercentage),
        notes: formData.notes || null,
      }

      const response = await fetch('/api/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar alocação')
      }

      // Resetar formulário
      setFormData({
        costCenterId: '',
        costCenterType: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        allocationPercentage: '100',
        notes: '',
      })

      setShowForm(false)
      fetchData()
      onUpdate()
    } catch (error) {
      console.error('Erro:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar alocação')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (allocationId: string) => {
    if (!confirm('Deseja realmente encerrar esta alocação?')) return

    try {
      const response = await fetch(`/api/allocations?id=${allocationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao encerrar alocação')
      }

      fetchData()
      onUpdate()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao encerrar alocação')
    }
  }

  const handleCenterChange = (value: string) => {
    // Determinar se é obra ou administrativo
    const isAdmin = value.startsWith('admin-')
    setFormData(prev => ({
      ...prev,
      costCenterId: value,
      costCenterType: isAdmin ? 'administrative' : 'project'
    }))
  }

  const getCenterName = (costCenterId: string, costCenterType: string) => {
    if (costCenterType === 'administrative') {
      const center = administrativeCenters.find(c => c.id === costCenterId)
      return center ? center.name : costCenterId
    } else {
      const project = projects.find(p => p.id === costCenterId)
      return project ? `${project.codigo} - ${project.name}` : costCenterId
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const activeAllocations = allocations.filter(a => a.isActive)
  const inactiveAllocations = allocations.filter(a => !a.isActive)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Gerenciar Alocações
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {collaboratorName}
            </p>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Botão Adicionar */}
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="mb-6 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Alocação
                </Button>
              )}

              {/* Formulário */}
              {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Nova Alocação
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="center">Centro de Custo *</Label>
                      <Select
                        value={formData.costCenterId}
                        onValueChange={handleCenterChange}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o centro" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                            Administrativo
                          </div>
                          {administrativeCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-purple-600" />
                                <span>{center.name}</span>
                              </div>
                            </SelectItem>
                          ))}

                          {projects.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase mt-2">
                                Obras
                              </div>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span>{project.codigo} - {project.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="startDate">Data de Início *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="percentage">Percentual de Alocação *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.allocationPercentage}
                          onChange={(e) => setFormData(prev => ({ ...prev, allocationPercentage: e.target.value }))}
                          required
                          className="flex-1"
                        />
                        <span className="text-gray-500 font-medium">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Exemplo: 50% significa metade do tempo dedicado a este centro
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Input
                        id="notes"
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ex: Responsável por gerenciamento de equipe"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Alocação
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Alocações Ativas */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Alocações Ativas ({activeAllocations.length})
                </h3>

                {activeAllocations.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Nenhuma alocação ativa</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAllocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {allocation.costCenterType === 'administrative' ? (
                                <Building className="h-5 w-5 text-purple-600" />
                              ) : (
                                <Building2 className="h-5 w-5 text-blue-600" />
                              )}
                              <h4 className="font-semibold text-gray-900">
                                {getCenterName(allocation.costCenterId, allocation.costCenterType)}
                              </h4>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                              <div>
                                <span className="font-medium">Início:</span>{' '}
                                {formatDate(allocation.startDate)}
                              </div>
                              <div>
                                <span className="font-medium">Alocação:</span>{' '}
                                {allocation.allocationPercentage}%
                              </div>
                            </div>

                            {allocation.notes && (
                              <p className="text-sm text-gray-500 mt-2">
                                {allocation.notes}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDelete(allocation.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Encerrar alocação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico */}
              {inactiveAllocations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Histórico ({inactiveAllocations.length})
                  </h3>

                  <div className="space-y-3">
                    {inactiveAllocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {allocation.costCenterType === 'administrative' ? (
                            <Building className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Building2 className="h-5 w-5 text-gray-400" />
                          )}
                          <h4 className="font-semibold text-gray-700">
                            {getCenterName(allocation.costCenterId, allocation.costCenterType)}
                          </h4>
                          <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            Encerrada
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Início:</span>{' '}
                            {formatDate(allocation.startDate)}
                          </div>
                          <div>
                            <span className="font-medium">Fim:</span>{' '}
                            {allocation.endDate ? formatDate(allocation.endDate) : '-'}
                          </div>
                          <div>
                            <span className="font-medium">Alocação:</span>{' '}
                            {allocation.allocationPercentage}%
                          </div>
                        </div>

                        {allocation.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            {allocation.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
