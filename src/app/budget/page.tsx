"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  X,
  Menu
} from "lucide-react";
import Link from "next/link";

export default function BudgetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("todos");
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

  const activeModule = "orcamento";

  const orcamentos = [
    {
      id: 1,
      projeto: "Edifício Vila Madalena",
      categoria: "Materiais",
      planejado: 1800000,
      gasto: 1170000,
      status: "aprovado"
    },
    {
      id: 2,
      projeto: "Edifício Vila Madalena",
      categoria: "Mão de Obra",
      planejado: 1500000,
      gasto: 975000,
      status: "aprovado"
    },
    {
      id: 3,
      projeto: "Edifício Vila Madalena",
      categoria: "Equipamentos",
      planejado: 800000,
      gasto: 520000,
      status: "aprovado"
    },
    {
      id: 4,
      projeto: "Edifício Vila Madalena",
      categoria: "Serviços Terceirizados",
      planejado: 400000,
      gasto: 260000,
      status: "em_analise"
    },
    {
      id: 5,
      projeto: "Centro Comercial Brooklin",
      categoria: "Materiais",
      planejado: 3500000,
      gasto: 525000,
      status: "aprovado"
    },
    {
      id: 6,
      projeto: "Centro Comercial Brooklin",
      categoria: "Mão de Obra",
      planejado: 2800000,
      gasto: 420000,
      status: "aprovado"
    },
    {
      id: 7,
      projeto: "Condomínio Alphaville",
      categoria: "Materiais",
      planejado: 2200000,
      gasto: 660000,
      status: "aprovado"
    },
    {
      id: 8,
      projeto: "Condomínio Alphaville",
      categoria: "Mão de Obra",
      planejado: 1800000,
      gasto: 540000,
      status: "pendente"
    }
  ];

  const projectOptions = [
    { value: "todos", label: "Todos os Projetos" },
    { value: "Edifício Vila Madalena", label: "Edifício Vila Madalena" },
    { value: "Centro Comercial Brooklin", label: "Centro Comercial Brooklin" },
    { value: "Condomínio Alphaville", label: "Condomínio Alphaville" }
  ];

  const filteredOrcamentos = orcamentos.filter(orc => {
    const matchesSearch = 
      orc.projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orc.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = filterProject === "todos" || orc.projeto === filterProject;
    
    return matchesSearch && matchesProject;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado": return "text-green-700 bg-green-50 border-green-200";
      case "pendente": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "em_analise": return "text-blue-700 bg-blue-50 border-blue-200";
      case "rejeitado": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const stats = {
    totalPlanejado: orcamentos.reduce((sum, o) => sum + o.planejado, 0),
    totalGasto: orcamentos.reduce((sum, o) => sum + o.gasto, 0),
    economia: 0
  };
  stats.economia = stats.totalPlanejado - stats.totalGasto;
  const percentualGasto = (stats.totalGasto / stats.totalPlanejado) * 100;

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
              <h1 className="text-xl font-bold text-gray-900">Orçamento</h1>
              <p className="text-xs text-gray-500">Controle financeiro dos projetos</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showFilters ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">Planejado</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                R$ {(stats.totalPlanejado / 1000000).toFixed(1)}M
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <p className="text-xs text-orange-600 font-medium">Gasto</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                R$ {(stats.totalGasto / 1000000).toFixed(1)}M
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 rounded-full" style={{ width: `${percentualGasto}%` }} />
                </div>
                <span className="text-xs font-bold text-orange-600">{percentualGasto.toFixed(0)}%</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                <p className="text-xs text-green-600 font-medium">Economia</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                R$ {(stats.economia / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar por projeto ou categoria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {projectOptions.map((option) => (
                <button key={option.value} onClick={() => setFilterProject(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterProject === option.value ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
          {filteredOrcamentos.map((orc) => {
            const percentual = (orc.gasto / orc.planejado) * 100;
            const saldo = orc.planejado - orc.gasto;

            return (
              <div key={orc.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-900">{orc.projeto}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(orc.status)}`}>
                        {orc.status === "aprovado" ? "Aprovado" : orc.status === "pendente" ? "Pendente" : "Em Análise"}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 font-medium">{orc.categoria}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 mb-1">Planejado</p>
                    <p className="text-sm font-bold text-blue-900">
                      R$ {(orc.planejado / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs text-orange-600 mb-1">Gasto</p>
                    <p className="text-sm font-bold text-orange-900">
                      R$ {(orc.gasto / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-600 mb-1">Saldo</p>
                    <p className="text-sm font-bold text-green-900">
                      R$ {(saldo / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-600">Utilização</span>
                    <span className="font-bold text-gray-900">{percentual.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${percentual > 90 ? 'bg-red-500' : percentual > 75 ? 'bg-yellow-500' : 'bg-blue-600'}`}
                      style={{ width: `${percentual}%` }} />
                  </div>
                </div>

                <button className="w-full py-2.5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all">
                  Gerenciar Orçamento
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
