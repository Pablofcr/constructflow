"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  Calendar,
  Cloud,
  Thermometer,
  Users,
  Package,
  AlertTriangle,
  X,
  Menu,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function DailyLogPage() {
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

  const activeModule = "diario";

  const registros = [
    {
      id: 1,
      projeto: "Edifício Vila Madalena",
      data: "27/12/2024",
      clima: "Ensolarado",
      temperatura: 28,
      presentes: 42,
      ausentes: 3,
      atividades: "Concretagem da laje do 8º andar. Instalação de formas do 9º andar.",
      materiais: "Consumo: 15m³ de concreto, 200kg de aço.",
      incidentes: "Nenhum incidente reportado.",
      observacoes: "Bom andamento dos trabalhos. Prazo mantido.",
      autor: "Carlos Silva"
    },
    {
      id: 2,
      projeto: "Edifício Vila Madalena",
      data: "28/12/2024",
      clima: "Nublado",
      temperatura: 25,
      presentes: 45,
      ausentes: 0,
      atividades: "Finalização da concretagem. Início da alvenaria do 5º andar.",
      materiais: "Consumo: 8m³ de concreto, 5000 tijolos.",
      incidentes: "Pequeno atraso na entrega de tijolos (2 horas).",
      observacoes: "Equipe completa. Produtividade alta.",
      autor: "Carlos Silva"
    },
    {
      id: 3,
      projeto: "Centro Comercial Brooklin",
      data: "26/12/2024",
      clima: "Chuvoso",
      temperatura: 22,
      presentes: 8,
      ausentes: 4,
      atividades: "Trabalhos suspensos devido à chuva forte. Proteção de materiais.",
      materiais: "Nenhum consumo registrado.",
      incidentes: "Chuva impediu continuidade dos trabalhos.",
      observacoes: "Equipe reduzida trabalhou na proteção de materiais e equipamentos.",
      autor: "Maria Santos"
    },
    {
      id: 4,
      projeto: "Centro Comercial Brooklin",
      data: "27/12/2024",
      clima: "Parcialmente nublado",
      temperatura: 24,
      presentes: 12,
      ausentes: 0,
      atividades: "Retomada dos trabalhos. Finalização do projeto elétrico.",
      materiais: "Instalação de 200m de fiação, 50 caixas de passagem.",
      incidentes: "Nenhum incidente reportado.",
      observacoes: "Recuperando tempo perdido pela chuva.",
      autor: "Maria Santos"
    },
    {
      id: 5,
      projeto: "Condomínio Alphaville",
      data: "28/12/2024",
      clima: "Ensolarado",
      temperatura: 30,
      presentes: 8,
      ausentes: 0,
      atividades: "Plantio de árvores na área do paisagismo. Instalação de sistema de irrigação.",
      materiais: "20 mudas de árvores, 100m de tubulação para irrigação.",
      incidentes: "Nenhum incidente reportado.",
      observacoes: "Projeto de paisagismo avançando conforme planejado.",
      autor: "Ana Costa"
    }
  ];

  const projectOptions = [
    { value: "todos", label: "Todos os Projetos" },
    { value: "Edifício Vila Madalena", label: "Edifício Vila Madalena" },
    { value: "Centro Comercial Brooklin", label: "Centro Comercial Brooklin" },
    { value: "Condomínio Alphaville", label: "Condomínio Alphaville" }
  ];

  const filteredRegistros = registros.filter(reg => {
    const matchesSearch = 
      reg.projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.atividades.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.autor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = filterProject === "todos" || reg.projeto === filterProject;
    
    return matchesSearch && matchesProject;
  });

  const getClimaIcon = (clima: string) => {
    if (clima.includes("Ensolarado")) return "☀️";
    if (clima.includes("Nublado")) return "☁️";
    if (clima.includes("Chuvoso")) return "🌧️";
    if (clima.includes("Parcialmente")) return "⛅";
    return "🌤️";
  };

  const stats = {
    total: registros.length,
    hoje: registros.filter(r => r.data === "28/12/2024").length,
    semIncidentes: registros.filter(r => r.incidentes.includes("Nenhum")).length
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-24 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col items-center py-6 space-y-4">
          {menuModules.map((module) => (
            <Link key={module.id} href={module.href} className="group relative" title={module.label}>
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                activeModule === module.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}>
                <Image src={module.iconPath} alt={module.label} width={48} height={48}
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
        <div className="p-4 border-t border-gray-200">
          <Link href="/dashboard" className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center hover:shadow-lg transition-all mx-auto">
            <span className="text-2xl">🏠</span>
          </Link>
        </div>
      </aside>

      {/* SIDEBAR - Mobile */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-xl">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Diário de Obra</h1>
              <p className="text-xs text-gray-500">{filteredRegistros.length} registros encontrados</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showFilters ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Total</p>
              <p className="text-xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Hoje</p>
              <p className="text-xl font-bold text-green-900">{stats.hoje}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">Sem Incidentes</p>
              <p className="text-xl font-bold text-purple-900">{stats.semIncidentes}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar registros..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          {/* Filters */}
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

        {/* Lista de Registros */}
        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
          {filteredRegistros.map((reg) => {
            const temIncidente = !reg.incidentes.includes("Nenhum");

            return (
              <div key={reg.id} className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all ${
                temIncidente ? "border-yellow-200" : "border-gray-200 hover:border-blue-200"
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getClimaIcon(reg.clima)}</span>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{reg.projeto}</h3>
                        <p className="text-xs text-gray-500">{reg.data} • {reg.autor}</p>
                      </div>
                    </div>
                  </div>
                  {temIncidente && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-700">Incidente</span>
                    </div>
                  )}
                </div>

                {/* Clima e Presença */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Cloud className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{reg.clima}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{reg.temperatura}°C</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-600">{reg.presentes} presentes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-600">{reg.ausentes} ausentes</span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-1">Atividades:</p>
                    <p className="text-xs text-gray-600">{reg.atividades}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-1">Materiais:</p>
                    <p className="text-xs text-gray-600">{reg.materiais}</p>
                  </div>
                  {temIncidente && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">Incidentes:</p>
                      <p className="text-xs text-yellow-700">{reg.incidentes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-1">Observações:</p>
                    <p className="text-xs text-gray-600">{reg.observacoes}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button className="w-full py-2.5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ver Relatório Completo
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
