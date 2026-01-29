"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Project {
  id: string
  codigo: string
  name: string
}

interface ProjectContextType {
  activeProject: Project | null
  setActiveProject: (project: Project | null) => void
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar obra ativa do localStorage ao iniciar
  useEffect(() => {
    const stored = localStorage.getItem('constructflow-active-project')
    if (stored) {
      try {
        const project = JSON.parse(stored)
        setActiveProjectState(project)
      } catch (error) {
        console.error('Erro ao carregar projeto do localStorage:', error)
        localStorage.removeItem('constructflow-active-project')
      }
    }
    setIsLoading(false)
  }, [])

  // Salvar obra ativa no localStorage sempre que mudar
  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project)
    
    if (project) {
      localStorage.setItem('constructflow-active-project', JSON.stringify(project))
    } else {
      localStorage.removeItem('constructflow-active-project')
    }
  }

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
