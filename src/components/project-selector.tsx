"use client"

import { useEffect, useState } from 'react'
import { useProject } from '@/contexts/project-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { Building2, Building } from 'lucide-react'

interface Project {
  id: string
  codigo: string
  name: string
  status: string
}

interface CostCenter {
  id: string
  codigo: string
  name: string
  type: 'administrative' | 'branch'
}

// Centros de Custo Administrativos
const administrativeCenters: CostCenter[] = [
  {
    id: 'admin-sede',
    codigo: 'SEDE',
    name: 'Administrativo - Sede',
    type: 'administrative'
  },
  {
    id: 'admin-filial-01',
    codigo: 'FIL-01',
    name: 'Filial 01',
    type: 'branch'
  },
  {
    id: 'admin-filial-02',
    codigo: 'FIL-02',
    name: 'Filial 02',
    type: 'branch'
  },
]

export function ProjectSelector() {
  const { activeProject, setActiveProject, isLoading } = useProject()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Buscar lista de projetos
  useEffect(() => {
    async function fetchProjects() {
      console.log('🔵 [DEBUG] Iniciando busca de projetos...')
      try {
        const response = await fetch('/api/projects')
        console.log('🔵 [DEBUG] Resposta da API:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🔵 [DEBUG] Dados recebidos:', data)
          console.log('🔵 [DEBUG] Quantidade de projetos:', data.length)
          
          setProjects(data)
          console.log('🔵 [DEBUG] Estado projects atualizado')
          
          // Se não tem obra ativa e tem projetos, selecionar o primeiro
          if (!activeProject && data.length > 0) {
            console.log('🔵 [DEBUG] Selecionando primeiro projeto:', data[0])
            setActiveProject({
              id: data[0].id,
              codigo: data[0].codigo,
              name: data[0].name,
            })
          }
        } else {
          console.error('❌ [DEBUG] Erro na resposta da API:', response.status)
        }
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao buscar projetos:', error)
      } finally {
        setLoadingProjects(false)
        console.log('🔵 [DEBUG] Loading finalizado')
      }
    }

    fetchProjects()
  }, [])

  // Debug: Monitorar mudanças no estado projects
  useEffect(() => {
    console.log('🟢 [DEBUG] Estado projects atualizado:', projects.length, 'projetos')
    console.log('🟢 [DEBUG] Projetos:', projects)
  }, [projects])

  const handleProjectChange = (selectedId: string) => {
    console.log('🟡 [DEBUG] Projeto selecionado:', selectedId)
    
    // Verificar se é um projeto ou centro administrativo
    const project = projects.find(p => p.id === selectedId)
    const adminCenter = administrativeCenters.find(c => c.id === selectedId)
    
    if (project) {
      console.log('🟡 [DEBUG] É um projeto:', project)
      setActiveProject({
        id: project.id,
        codigo: project.codigo,
        name: project.name,
      })
    } else if (adminCenter) {
      console.log('🟡 [DEBUG] É um centro administrativo:', adminCenter)
      setActiveProject({
        id: adminCenter.id,
        codigo: adminCenter.codigo,
        name: adminCenter.name,
      })
    }
  }

  if (isLoading || loadingProjects) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <Building2 className="h-4 w-4 text-gray-400" />
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  console.log('🔴 [DEBUG] Renderizando seletor. Projetos:', projects.length)

  return (
    <div className="w-full md:w-auto">
      <Select
        value={activeProject?.id || ''}
        onValueChange={handleProjectChange}
      >
        <SelectTrigger className="w-full md:w-[280px] bg-white border-gray-200 focus:ring-blue-500">
          <div className="flex items-center gap-2">
            {activeProject?.id.startsWith('admin-') ? (
              <Building className="h-4 w-4 text-purple-600" />
            ) : (
              <Building2 className="h-4 w-4 text-blue-600" />
            )}
            <SelectValue placeholder="Selecione uma obra" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {/* Centros Administrativos */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Centros Administrativos
          </div>
          {administrativeCenters.map((center) => (
            <SelectItem key={center.id} value={center.id}>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{center.codigo}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[220px]">
                    {center.name}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
          
          {/* Separador */}
          {projects.length > 0 && (
            <>
              <SelectSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Obras ({projects.length})
              </div>
            </>
          )}
          
          {/* Projetos/Obras */}
          {projects.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-gray-500">
              Nenhuma obra cadastrada
            </div>
          ) : (
            projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{project.codigo}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[220px]">
                      {project.name}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
