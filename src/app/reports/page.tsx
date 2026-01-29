"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  Download,
  Eye,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Menu,
  BarChart3
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todos");
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

  const activeModule = "relatorios";

  const relatorios = [
    {
      id: 1,
      codigo: "REL-2024-001",
      titulo: "Relatório Financeiro - Dezembro 2024",
      tipo: "financeiro",
      projeto: "Edifício Vila Madalena",
      descricao: "Análise completa de gastos e orçamento do mês de dezembro",
      status: "finalizado",
      autor: "Carlos Silva",
      dataCriacao: "20/12/2024",
      dataAtualizacao: "21/12/2024",
      periodo: "Dez/2024",
      paginas: 15,
      formato: "PDF"
    },
    {
      id: 2,
      codigo: "REL-2024-002",
      titulo: "Relatório de Progresso Físico Q4",
      tipo: "progresso",
      projeto: "Edifício Vila Madalena",
      descricao: "Acompanhamento do progresso físico da obra no 4º trimestre",
      status: "finalizado",
      autor: "Carlos Silva",
      dataCriacao: "18/12/2024",
      dataAtualizacao: "19/12/2024",
      periodo: "Out-Dez/2024",
      paginas: 22,
      formato: "PDF"
    },
    {
      id: 3,
      codigo: "REL-2024-003",
      titulo: "Relatório Técnico - Estrutura",
      tipo: "tecnico",
      projeto: "Edifício Vila Madalena",
      descricao: "Relatório técnico sobre execução da estrutura de concreto",
      status: "rascunho",
      autor: "Carlos Silva",
      dataCriacao: "22/12/2024",
      dataAtualizacao: "23/12/2024",
      periodo: "Dez/2024",
      paginas: 8,
      formato: "DOCX"
    },
    {
      id: 4,
      codigo: "REL-2024-004",
      titulo: "Relatório de Segurança do Trabalho",
      tipo: "seguranca",
      projeto: "Centro Comercial Brooklin",
      descricao: "Avaliação de condições de segurança e acidentes registrados",
      status: "enviado",
      autor: "Maria Santos",
      dataCriacao: "15/12/2024",
      dataAtualizacao: "16/12/2024",
      periodo: "Nov/2024",
      paginas: 12,
      formato: "PDF"
    },
    {
      id: 5,
      codigo: "REL-2024-005",
      titulo: "Análise Financeira - Centro Comercial",
      tipo: "financeiro",
      projeto: "Centro Comercial Brooklin",
      descricao: "Relatório financeiro comparativo: planejado x executado",
      status: "finalizado",
      autor: "Maria Santos",
      dataCriacao: "10/12/2024",
      dataAtualizacao: "11/12/2024",
      periodo: "Jan-Nov/2024",
      paginas: 28,
      formato: "PDF"
    },
    {
      id: 6,
      codigo: "REL-2024-006",
      titulo: "Relatório de Progresso - Alphaville",
      tipo: "progresso",
      projeto: "Condomínio Alphaville",
      descricao: "Status do projeto e marcos alcançados",
      status: "rascunho",
      autor: "Ana Costa",
      dataCriacao: "19/12/2024",
      dataAtualizacao: "20/12/2024",
      periodo: "Dez/2024",
      paginas: 10,
      formato: "DOCX"
    }
  ];

  const typeOptions = [
    { value: "todos", label: "Todos os Tipos" },
    { value: "financeiro", label: "Financeiro" },
    { value: "progresso", label: "Progresso" },
    { value: "tecnico", label: "Técnico" },
    { value: "seguranca", label: "Segurança" }
  ];

  const filteredRelatorios = relatorios.filter(rel => {
    const matchesSearch = 
      rel.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.autor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "todos" || rel.tipo === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeConfig = (tipo: string) => {
    switch (tipo) {
      case "financeiro":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          icon: DollarSign,
          label: "Financeiro"
        };
      case "progresso":
        return {
          color: "text-blue-700 bg-blue-50 border-blue-200",
          icon: TrendingUp,
          label: "Progresso"
        };
      case "tecnico":
        return {
          color: "text-purple-700 bg-purple-50 border-purple-200",
          icon: BarChart3,
          label: "Técnico"
        };
      case "seguranca":
        return {
          color: "text-orange-700 bg-orange-50 border-orange-200",
          icon: AlertTriangle,
          label: "Segurança"
        };
      default:
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: FileText,
          label: "Outros"
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "rascunho":
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          label: "Rascunho"
        };
      case "finalizado":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          label: "Finalizado"
        };
      case "enviado":
        return {
          color: "text-blue-700 bg-blue-50 border-blue-200",
          label: "Enviado"
        };
      default:
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          label: "Desconhecido"
        };
    }
  };

  const stats = {
    total: relatorios.length,
    finalizados: relatorios.filter(r => r.status === "finalizado").length,
    rascunhos: relatorios.filter(r => r.status === "rascunho").length,
    enviados: relatorios.filter(r => r.status === "enviado").length
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
              <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
              <p className="text-xs text-gray-500">{filteredRelatorios.length} relatórios</p>
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
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Finalizados</p>
              <p className="text-xl font-bold text-green-900">{stats.finalizados}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600 mb-1">Rascunhos</p>
              <p className="text-xl font-bold text-yellow-900">{stats.rascunhos}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Enviados</p>
              <p className="text-xl font-bold text-blue-900">{stats.enviados}</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar relatórios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {typeOptions.map((option) => (
                <button key={option.value} onClick={() => setFilterType(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterType === option.value ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
          {filteredRelatorios.map((rel) => {
            const typeConfig = getTypeConfig(rel.tipo);
            const statusConfig = getStatusConfig(rel.status);
            const TypeIcon = typeConfig.icon;

            return (
              <div key={rel.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-semibold text-gray-700">
                        {rel.codigo}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{rel.titulo}</h3>
                    <p className="text-sm text-blue-600 font-medium mb-1">{rel.projeto}</p>
                    <p className="text-xs text-gray-600">{rel.descricao}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Período</p>
                    <p className="text-sm font-bold text-gray-900">{rel.periodo}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Páginas</p>
                    <p className="text-sm font-bold text-gray-900">{rel.paginas} pgs</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Formato</p>
                    <p className="text-sm font-bold text-gray-900">{rel.formato}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">Autor: {rel.autor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      Criado: {rel.dataCriacao} • Atualizado: {rel.dataAtualizacao}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </button>
                  <button className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg border border-gray-200 transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
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
