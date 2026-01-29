"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Edit, Trash2, Menu, X } from 'lucide-react';

interface Project {
  id: string;
  codigo: string;
  name: string;
  status: string;
  tipoObra: string;
  enderecoCidade: string;
  enderecoEstado: string;
  orcamentoEstimado: number;
  totalGasto: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuModules = [
    { id: "obras", iconPath: "/icons/obra.png", label: "Dados da Obra", href: "/projects" },
    { id: "colaboradores", iconPath: "/icons/worker.png", label: "Colaboradores", href: "/team" },
    { id: "orcamento", iconPath: "/icons/orcamento.png", label: "Orçamento", href: "/budget" },
    { id: "planejamento", iconPath: "/icons/planning.png", label: "Planejamento", href: "/planning" },
    { id: "diario", iconPath: "/icons/diary.png", label: "Diário de Obra", href: "/daily-log" },
    { id: "solicitacao", iconPath: "/icons/package.png", label: "Solicitação", href: "/material-request" },
    { id: "entrega", iconPath: "/icons/truck.png", label: "Entrega", href: "/deliveries" },
    { id: "relatorios", iconPath: "/icons/chart.png", label: "Relatórios", href: "/reports" }
  ];

  const activeModule = "obras";

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        setFilteredProjects(data);
      }
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.enderecoCidade.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "TODOS") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleDelete = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Tem certeza que deseja excluir o projeto "${projectName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir projeto');

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto. Tente novamente.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PLANEJAMENTO: 'text-blue-700 bg-blue-50 border-blue-200',
      EM_EXECUCAO: 'text-green-700 bg-green-50 border-green-200',
      PAUSADO: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      CONCLUIDO: 'text-gray-700 bg-gray-50 border-gray-200',
      CANCELADO: 'text-red-700 bg-red-50 border-red-200',
    };

    const labels = {
      PLANEJAMENTO: 'Planejamento',
      EM_EXECUCAO: 'Em Execução',
      PAUSADO: 'Pausado',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const stats = {
    total: projects.length,
    emExecucao: projects.filter(p => p.status === 'EM_EXECUCAO').length,
    planejamento: projects.filter(p => p.status === 'PLANEJAMENTO').length,
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="hidden lg:block lg:w-24 bg-white border-r border-gray-200 animate-pulse">
          <div className="p-4 space-y-2">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-24 lg:h-screen lg:sticky lg:top-0 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-2">
          {menuModules.map((module) => (
            <Link key={module.id} href={module.href} className="group relative" title={module.label}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                activeModule === module.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}>
                <Image 
                  src={module.iconPath} 
                  alt={module.label} 
                  width={44} 
                  height={44}
                  className={`transition-all ${activeModule === module.id ? "filter-none" : "grayscale opacity-50 group-hover:opacity-75"}`} 
                />
              </div>
              {activeModule === module.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {module.label}
              </div>
            </Link>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 flex-shrink-0">
          <Link href="/" className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center hover:shadow-lg transition-all mx-auto">
            <span className="text-xl">🏠</span>
          </Link>
        </div>
      </aside>

      {/* SIDEBAR - Mobile */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {menuModules.map((module) => (
                <Link 
                  key={module.id} 
                  href={module.href} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeModule === module.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`} 
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <Image 
                      src={module.iconPath} 
                      alt={module.label} 
                      width={40} 
                      height={40}
                      className={activeModule === module.id ? "filter-none" : "grayscale opacity-50"} 
                    />
                  </div>
                  <span className={`text-sm font-medium ${activeModule === module.id ? "text-blue-600" : "text-gray-700"}`}>
                    {module.label}
                  </span>
                  {activeModule === module.id && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50" onClick={() => setSidebarOpen(false)}>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏠</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Início</span>
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Dados da Obra</h1>
              <p className="text-xs text-gray-500">{filteredProjects.length} projetos encontrados</p>
            </div>
            <button
              onClick={() => router.push('/projects/new')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Projeto
            </button>
          </div>

          <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
            <div className="min-w-[120px] bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="min-w-[120px] bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Em Execução</p>
              <p className="text-2xl font-bold text-green-900">{stats.emExecucao}</p>
            </div>
            <div className="min-w-[120px] bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600 mb-1">Planejamento</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.planejamento}</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, código ou cidade..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: "TODOS", label: "Todos" },
              { value: "PLANEJAMENTO", label: "Planejamento" },
              { value: "EM_EXECUCAO", label: "Em Execução" },
              { value: "PAUSADO", label: "Pausado" },
              { value: "CONCLUIDO", label: "Concluído" },
              { value: "CANCELADO", label: "Cancelado" }
            ].map((option) => (
              <button 
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === option.value ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {searchTerm || statusFilter !== 'TODOS'
                      ? 'Nenhum projeto encontrado'
                      : 'Nenhum projeto cadastrado'}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {searchTerm || statusFilter !== 'TODOS'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando seu primeiro projeto'}
                  </p>
                  {!searchTerm && statusFilter === 'TODOS' && (
                    <button
                      onClick={() => router.push('/projects/new')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Projeto
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div 
                key={project.id} 
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">{project.codigo}</p>
                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                      {project.name}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Localização</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {project.enderecoCidade}/{project.enderecoEstado}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tipo</p>
                    <p className="text-sm text-gray-900 font-medium">{project.tipoObra}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Orçamento</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {formatCurrency(project.orcamentoEstimado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Gasto</p>
                    <p className="text-sm text-blue-600 font-medium">
                      {formatCurrency(project.totalGasto)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </button>
                  
                  <button
                    onClick={() => router.push(`/projects/${project.id}/edit`)}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  
                  <button
                    onClick={(e) => handleDelete(project.id, project.name, e)}
                    className="py-2.5 px-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-semibold text-sm rounded-lg border border-red-200 hover:border-red-600 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
