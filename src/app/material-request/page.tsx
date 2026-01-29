"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  Package,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Menu,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export default function MaterialRequestPage() {
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

  const activeModule = "solicitacao";

  const solicitacoes = [
    {
      id: 1,
      codigo: "SOL-2024-001",
      projeto: "Edifício Vila Madalena",
      material: "Concreto Usinado",
      quantidade: "20m³",
      unidade: "m³",
      urgencia: "alta",
      status: "aprovado",
      solicitante: "Carlos Silva",
      dataSolicitacao: "15/12/2024",
      dataEntregaPrevista: "20/12/2024",
      observacoes: "Necessário para concretagem da laje do 9º andar"
    },
    {
      id: 2,
      codigo: "SOL-2024-002",
      projeto: "Edifício Vila Madalena",
      material: "Tijolos Cerâmicos",
      quantidade: "10000",
      unidade: "un",
      urgencia: "media",
      status: "em_transito",
      solicitante: "João Pereira",
      dataSolicitacao: "16/12/2024",
      dataEntregaPrevista: "22/12/2024",
      observacoes: "Para alvenaria do 5º ao 7º andar"
    },
    {
      id: 3,
      codigo: "SOL-2024-003",
      projeto: "Centro Comercial Brooklin",
      material: "Fiação Elétrica 2.5mm",
      quantidade: "500",
      unidade: "m",
      urgencia: "alta",
      status: "pendente",
      solicitante: "Roberto Lima",
      dataSolicitacao: "18/12/2024",
      dataEntregaPrevista: "23/12/2024",
      observacoes: "Urgente para instalação elétrica"
    },
    {
      id: 4,
      codigo: "SOL-2024-004",
      projeto: "Centro Comercial Brooklin",
      material: "Tubos PVC 100mm",
      quantidade: "200",
      unidade: "m",
      urgencia: "baixa",
      status: "aprovado",
      solicitante: "Paulo Oliveira",
      dataSolicitacao: "17/12/2024",
      dataEntregaPrevista: "25/12/2024",
      observacoes: "Para sistema de esgoto"
    },
    {
      id: 5,
      codigo: "SOL-2024-005",
      projeto: "Condomínio Alphaville",
      material: "Mudas de Árvores",
      quantidade: "30",
      unidade: "un",
      urgencia: "media",
      status: "entregue",
      solicitante: "Ana Costa",
      dataSolicitacao: "10/12/2024",
      dataEntregaPrevista: "18/12/2024",
      observacoes: "Entregue conforme planejado"
    },
    {
      id: 6,
      codigo: "SOL-2024-006",
      projeto: "Edifício Vila Madalena",
      material: "Aço CA-50 12mm",
      quantidade: "2000",
      unidade: "kg",
      urgencia: "alta",
      status: "rejeitado",
      solicitante: "Carlos Silva",
      dataSolicitacao: "19/12/2024",
      dataEntregaPrevista: "-",
      observacoes: "Orçamento excedido - aguardando aprovação"
    }
  ];

  const statusOptions = [
    { value: "todos", label: "Todos" },
    { value: "pendente", label: "Pendentes" },
    { value: "aprovado", label: "Aprovados" },
    { value: "em_transito", label: "Em Trânsito" },
    { value: "entregue", label: "Entregues" },
    { value: "rejeitado", label: "Rejeitados" }
  ];

  const filteredSolicitacoes = solicitacoes.filter(sol => {
    const matchesSearch = 
      sol.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "todos" || sol.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pendente":
        return {
          color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          icon: Clock,
          label: "Pendente"
        };
      case "aprovado":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          icon: CheckCircle,
          label: "Aprovado"
        };
      case "em_transito":
        return {
          color: "text-blue-700 bg-blue-50 border-blue-200",
          icon: TrendingUp,
          label: "Em Trânsito"
        };
      case "entregue":
        return {
          color: "text-purple-700 bg-purple-50 border-purple-200",
          icon: Package,
          label: "Entregue"
        };
      case "rejeitado":
        return {
          color: "text-red-700 bg-red-50 border-red-200",
          icon: AlertCircle,
          label: "Rejeitado"
        };
      default:
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: Package,
          label: "Desconhecido"
        };
    }
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "alta": return "text-red-700 bg-red-50 border-red-200";
      case "media": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "baixa": return "text-blue-700 bg-blue-50 border-blue-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const stats = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.status === "pendente").length,
    aprovados: solicitacoes.filter(s => s.status === "aprovado").length,
    entregues: solicitacoes.filter(s => s.status === "entregue").length
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
              <h1 className="text-xl font-bold text-gray-900">Solicitação de Material</h1>
              <p className="text-xs text-gray-500">{filteredSolicitacoes.length} solicitações</p>
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
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Aprovados</p>
              <p className="text-xl font-bold text-green-900">{stats.aprovados}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">Entregues</p>
              <p className="text-xl font-bold text-purple-900">{stats.entregues}</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar solicitações..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
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
          {filteredSolicitacoes.map((sol) => {
            const statusConfig = getStatusConfig(sol.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={sol.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.color}`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-semibold text-gray-700">
                        {sol.codigo}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgenciaColor(sol.urgencia)}`}>
                        {sol.urgencia === "alta" ? "Alta" : sol.urgencia === "media" ? "Média" : "Baixa"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{sol.material}</h3>
                    <p className="text-sm text-blue-600 font-medium">{sol.projeto}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Quantidade</p>
                    <p className="text-sm font-bold text-gray-900">{sol.quantidade} {sol.unidade}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Entrega Prevista</p>
                    <p className="text-sm font-bold text-gray-900">{sol.dataEntregaPrevista}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">Solicitante: {sol.solicitante}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">Solicitado em: {sol.dataSolicitacao}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                    <p className="text-xs text-blue-700">{sol.observacoes}</p>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all">
                  Ver Detalhes
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
