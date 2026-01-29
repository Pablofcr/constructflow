"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  Building2,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  X,
  Menu,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  status: string;
  progresso: number;
  orcamento: number;
  gastos: number;
  dataInicio: string;
  prazoFinal: string;
  localizacao: string;
  equipeTotal: number;
  user?: {
    name: string;
    email: string;
  };
  _count?: {
    teamMembers: number;
    budgets: number;
    tasks: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
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

  // Buscar projetos da API
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar projetos');
      }

      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data);
      } else {
        throw new Error(data.error || 'Erro ao buscar projetos');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message || 'Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "todos", label: "Todos" },
    { value: "Em Andamento", label: "Em Andamento" },
    { value: "Planejamento", label: "Planejamento" },
    { value: "Concluído", label: "Concluído" },
    { value: "Em Pausa", label: "Em Pausa" }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.localizacao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "todos" || project.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Em Andamento":
        return {
          color: "text-blue-700 bg-blue-50 border-blue-200",
          icon: TrendingUp,
          label: "Em Andamento"
        };
      case "Planejamento":
        return {
          color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          icon: Clock,
          label: "Planejamento"
        };
      case "Concluído":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          icon: CheckCircle,
          label: "Concluído"
        };
      case "Em Pausa":
        return {
          color: "text-red-700 bg-red-50 border-red-200",
          icon: Pause,
          label: "Em Pausa"
        };
      default:
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: AlertCircle,
          label: status
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const stats = {
    total: projects.length,
    emAndamento: projects.filter(p => p.status === "Em Andamento").length,
    planejamento: projects.filter(p => p.status === "Planejamento").length,
    concluidos: projects.filter(p => p.status === "Concluído").length
  };

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
                <Image src={module.iconPath} alt={module.label} width={44} height={44}
                  className={`transition-all ${activeModule === module.id ? "filter-none" : "grayscale opacity-50 group-hover:opacity-75"}`} />
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
          <Link href="/dashboard" className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center hover:shadow-lg transition-all mx-auto">
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
                <Link key={module.id} href={module.href} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  activeModule === module.id ? "bg-blue-50" : "hover:bg-gray-50"
                }`} onClick={() => setSidebarOpen(false)}>
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <Image src={module.iconPath} alt={module.label} width={40} height={40}
                      className={activeModule === module.id ? "filter-none" : "grayscale opacity-50"} />
                  </div>
                  <span className={`text-sm font-medium ${activeModule === module.id ? "text-blue-600" : "text-gray-700"}`}>
                    {module.label}
                  </span>
                  {activeModule === module.id && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50" onClick={() => setSidebarOpen(false)}>
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
              <p className="text-xs text-gray-500">
                {loading ? 'Carregando...' : `${filteredProjects.length} projetos`}
              </p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showFilters ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {!loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">Em Andamento</p>
                <p className="text-xl font-bold text-blue-900">{stats.emAndamento}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-yellow-600 mb-1">Planejamento</p>
                <p className="text-xl font-bold text-yellow-900">{stats.planejamento}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-600 mb-1">Concluídos</p>
                <p className="text-xl font-bold text-green-900">{stats.concluidos}</p>
              </div>
            </div>
          )}

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar obras..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {statusOptions.map((option) => (
                <button key={option.value} onClick={() => setFilterStatus(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterStatus === option.value ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
          {/* LOADING */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Carregando projetos...</p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <p className="text-red-800 font-semibold mb-2">Erro ao carregar projetos</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button onClick={fetchProjects} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                Tentar Novamente
              </button>
            </div>
          )}

          {/* PROJECTS */}
          {!loading && !error && filteredProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            const StatusIcon = statusConfig.icon;
            const progressPercentage = (project.gastos / project.orcamento) * 100;

            return (
              <div key={project.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.color}`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-semibold text-gray-700">
                        {project.codigo}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{project.nome}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.descricao}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-bold text-gray-900">{project.progresso}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${
                      project.progresso >= 75 ? 'bg-green-500' : 
                      project.progresso >= 50 ? 'bg-blue-500' : 
                      project.progresso >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${project.progresso}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Orçamento</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(project.orcamento)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Gastos</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(project.gastos)}</p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div className={`h-1 rounded-full ${
                        progressPercentage > 90 ? 'bg-red-500' : 
                        progressPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} style={{ width: `${Math.min(progressPercentage, 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{project.localizacao}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {formatDate(project.dataInicio)} até {formatDate(project.prazoFinal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">Equipe: {project.equipeTotal} colaboradores</span>
                  </div>
                  {project.user && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">Responsável:</span> {project.user.name}
                      </p>
                    </div>
                  )}
                </div>

                <button className="w-full py-2.5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all">
                  Ver Detalhes
                </button>
              </div>
            );
          })}

          {/* EMPTY STATE */}
          {!loading && !error && filteredProjects.length === 0 && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-2">Nenhum projeto encontrado</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || filterStatus !== "todos" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Comece criando seu primeiro projeto"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
