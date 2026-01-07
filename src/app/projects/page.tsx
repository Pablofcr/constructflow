"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronRight,
  X,
  Menu
} from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
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

  const projetos = [
    {
      id: 1,
      codigo: "OBR-2024-001",
      nome: "Edifício Vila Madalena",
      descricao: "Construção de edifício residencial com 15 andares",
      status: "Em Andamento",
      progresso: 65,
      orçamento: 4500000,
      gastos: 2925000,
      inicio: "15/01/2024",
      prazoFinal: "15/04/2025",
      localizacao: "Vila Madalena, São Paulo - SP",
      equipe: 45,
      responsavel: "Eng. Carlos Silva"
    },
    {
      id: 2,
      codigo: "OBR-2024-002",
      nome: "Centro Comercial Brooklin",
      descricao: "Shopping center com área de lazer e estacionamento",
      status: "Planejamento",
      progresso: 15,
      orçamento: 8200000,
      gastos: 1230000,
      inicio: "10/03/2024",
      prazoFinal: "20/08/2025",
      localizacao: "Brooklin, São Paulo - SP",
      equipe: 12,
      responsavel: "Eng. Maria Santos"
    },
    {
      id: 3,
      codigo: "OBR-2023-045",
      nome: "Galpão Industrial Guarulhos",
      descricao: "Galpão logístico com sistema automatizado",
      status: "Concluído",
      progresso: 100,
      orçamento: 3200000,
      gastos: 3150000,
      inicio: "05/05/2023",
      prazoFinal: "30/11/2024",
      localizacao: "Guarulhos, São Paulo - SP",
      equipe: 28,
      responsavel: "Eng. Roberto Lima"
    },
    {
      id: 4,
      codigo: "OBR-2024-003",
      nome: "Condomínio Alphaville",
      descricao: "Condomínio residencial de alto padrão",
      status: "Em Pausa",
      progresso: 30,
      orçamento: 6500000,
      gastos: 1950000,
      inicio: "20/02/2024",
      prazoFinal: "10/06/2025",
      localizacao: "Alphaville, Barueri - SP",
      equipe: 8,
      responsavel: "Eng. Ana Costa"
    }
  ];

  const statusOptions = [
    { value: "todos", label: "Todos" },
    { value: "Em Andamento", label: "Em Andamento" },
    { value: "Planejamento", label: "Planejamento" },
    { value: "Em Pausa", label: "Em Pausa" },
    { value: "Concluído", label: "Concluído" }
  ];

  const filteredProjetos = projetos.filter(projeto => {
    const matchesSearch = 
      projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.localizacao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "todos" || projeto.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Andamento": return "text-green-700 bg-green-50 border-green-200";
      case "Planejamento": return "text-blue-700 bg-blue-50 border-blue-200";
      case "Em Pausa": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "Concluído": return "text-purple-700 bg-purple-50 border-purple-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR - Desktop - AJUSTADO PARA CABER TODOS OS ÍCONES */}
      <aside className="hidden lg:flex lg:flex-col lg:w-24 lg:h-screen lg:sticky lg:top-0 bg-white border-r border-gray-200 flex-shrink-0">
        {/* Área de Ícones - ESPAÇAMENTO REDUZIDO */}
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
                  className={`transition-all ${
                    activeModule === module.id ? "filter-none" : "grayscale opacity-50 group-hover:opacity-75"
                  }`}
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

        {/* Botão Home - Fixo no rodapé */}
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
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Dados da Obra</h1>
              <p className="text-xs text-gray-500">{filteredProjetos.length} projetos encontrados</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showFilters ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>

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

        {/* Lista de Projetos */}
        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
          {filteredProjetos.map((projeto) => {
            const percentualGasto = (projeto.gastos / projeto.orçamento) * 100;

            return (
              <div key={projeto.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-semibold text-gray-700">
                        {projeto.codigo}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(projeto.status)}`}>
                        {projeto.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{projeto.nome}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{projeto.descricao}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Progresso</span>
                    <span className="font-bold text-blue-600">{projeto.progresso}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${projeto.progresso}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                      <p className="text-xs text-gray-600">Orçamento</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">R$ {(projeto.orçamento / 1000000).toFixed(1)}M</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                      <p className="text-xs text-gray-600">Gastos</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">R$ {(projeto.gastos / 1000000).toFixed(1)}M</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-xs">{projeto.localizacao}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs">{projeto.equipe} colaboradores • {projeto.responsavel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs">Início: {projeto.inicio} • Prazo: {projeto.prazoFinal}</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all flex items-center justify-center gap-2 group">
                  Ver Detalhes
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}

          {filteredProjetos.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Nenhuma obra encontrada</h3>
              <p className="text-sm text-gray-500">Tente ajustar os filtros ou buscar por outros termos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
