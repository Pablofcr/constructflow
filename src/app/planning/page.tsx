"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  X,
  Menu,
  CheckCircle,
  Circle,
  PlayCircle
} from "lucide-react";
import Link from "next/link";

export default function PlanningPage() {
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

  const activeModule = "planejamento";

  const tarefas = [
    {
      id: 1,
      nome: "Fundação",
      projeto: "Edifício Vila Madalena",
      descricao: "Escavação e fundação do edifício",
      status: "concluido",
      progresso: 100,
      dataInicio: "15/01/2024",
      dataFim: "15/03/2024",
      responsavel: "Carlos Silva",
      prioridade: "alta"
    },
    {
      id: 2,
      nome: "Estrutura - Pilares e Vigas",
      projeto: "Edifício Vila Madalena",
      descricao: "Execução de pilares e vigas até o 8º andar",
      status: "em_andamento",
      progresso: 65,
      dataInicio: "20/03/2024",
      dataFim: "30/12/2024",
      responsavel: "Carlos Silva",
      prioridade: "alta"
    },
    {
      id: 3,
      nome: "Alvenaria",
      projeto: "Edifício Vila Madalena",
      descricao: "Levantamento de paredes internas",
      status: "pendente",
      progresso: 0,
      dataInicio: "10/01/2025",
      dataFim: "10/03/2025",
      responsavel: "João Pereira",
      prioridade: "media"
    },
    {
      id: 4,
      nome: "Projeto Arquitetônico",
      projeto: "Centro Comercial Brooklin",
      descricao: "Desenvolvimento do projeto arquitetônico completo",
      status: "em_andamento",
      progresso: 80,
      dataInicio: "01/02/2024",
      dataFim: "31/12/2024",
      responsavel: "Ana Costa",
      prioridade: "alta"
    },
    {
      id: 5,
      nome: "Instalações Elétricas",
      projeto: "Centro Comercial Brooklin",
      descricao: "Projeto e execução de instalações elétricas",
      status: "pendente",
      progresso: 0,
      dataInicio: "15/01/2025",
      dataFim: "15/04/2025",
      responsavel: "Roberto Lima",
      prioridade: "alta"
    },
    {
      id: 6,
      nome: "Paisagismo",
      projeto: "Condomínio Alphaville",
      descricao: "Projeto e execução do paisagismo",
      status: "em_andamento",
      progresso: 30,
      dataInicio: "01/12/2024",
      dataFim: "28/02/2025",
      responsavel: "Ana Costa",
      prioridade: "baixa"
    }
  ];

  const statusOptions = [
    { value: "todos", label: "Todos" },
    { value: "pendente", label: "Pendentes" },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "concluido", label: "Concluídos" }
  ];

  const filteredTarefas = tarefas.filter(tarefa => {
    const matchesSearch = 
      tarefa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "todos" || tarefa.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "concluido":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          icon: CheckCircle,
          label: "Concluído"
        };
      case "em_andamento":
        return {
          color: "text-blue-700 bg-blue-50 border-blue-200",
          icon: PlayCircle,
          label: "Em Andamento"
        };
      case "pendente":
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: Circle,
          label: "Pendente"
        };
      default:
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: Circle,
          label: "Desconhecido"
        };
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta": return "text-red-700 bg-red-50 border-red-200";
      case "media": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "baixa": return "text-blue-700 bg-blue-50 border-blue-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const stats = {
    total: tarefas.length,
    pendentes: tarefas.filter(t => t.status === "pendente").length,
    emAndamento: tarefas.filter(t => t.status === "em_andamento").length,
    concluidas: tarefas.filter(t => t.status === "concluido").length
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
              <h1 className="text-xl font-bold text-gray-900">Planejamento</h1>
              <p className="text-xs text-gray-500">{filteredTarefas.length} tarefas</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showFilters ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600 mb-1">Pendentes</p>
              <p className="text-xl font-bold text-yellow-900">{stats.pendentes}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Em Andamento</p>
              <p className="text-xl font-bold text-blue-900">{stats.emAndamento}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Concluídas</p>
              <p className="text-xl font-bold text-green-900">{stats.concluidas}</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar tarefas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
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
          {filteredTarefas.map((tarefa) => {
            const statusConfig = getStatusConfig(tarefa.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={tarefa.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.color}`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-900">{tarefa.nome}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPrioridadeColor(tarefa.prioridade)}`}>
                        {tarefa.prioridade === "alta" ? "Alta" : tarefa.prioridade === "media" ? "Média" : "Baixa"}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 font-medium mb-1">{tarefa.projeto}</p>
                    <p className="text-xs text-gray-600">{tarefa.descricao}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-bold text-gray-900">{tarefa.progresso}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${tarefa.status === "concluido" ? "bg-green-600" : "bg-blue-600"}`}
                      style={{ width: `${tarefa.progresso}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Início</p>
                      <p className="text-xs font-medium text-gray-700">{tarefa.dataInicio}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Prazo</p>
                      <p className="text-xs font-medium text-gray-700">{tarefa.dataFim}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{tarefa.responsavel}</span>
                  </div>
                  <button className="px-4 py-2 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-xs rounded-lg border border-gray-200 hover:border-blue-600 transition-all">
                    Detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
