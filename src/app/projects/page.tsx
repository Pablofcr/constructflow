"use client";

import { useState } from "react";
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ArrowLeft,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause
} from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

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
      responsavel: "Eng. Carlos Silva",
      prioridade: "alta",
      destaque: true
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
      responsavel: "Eng. Maria Santos",
      prioridade: "média",
      destaque: false
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
      responsavel: "Eng. Roberto Lima",
      prioridade: "baixa",
      destaque: false
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
      responsavel: "Eng. Ana Costa",
      prioridade: "baixa",
      destaque: false
    }
  ];

  const statusOptions = [
    { value: "todos", label: "Todos os Status", icon: Building2 },
    { value: "Em Andamento", label: "Em Andamento", icon: Clock },
    { value: "Planejamento", label: "Planejamento", icon: Calendar },
    { value: "Em Pausa", label: "Em Pausa", icon: Pause },
    { value: "Concluído", label: "Concluído", icon: CheckCircle2 }
  ];

  const filteredProjetos = projetos.filter(projeto => {
    const matchesSearch = 
      projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.localizacao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "todos" || projeto.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Em Andamento": return Clock;
      case "Planejamento": return Calendar;
      case "Em Pausa": return Pause;
      case "Concluído": return CheckCircle2;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Andamento": return "from-green-500 to-emerald-500";
      case "Planejamento": return "from-blue-500 to-cyan-500";
      case "Em Pausa": return "from-yellow-500 to-orange-500";
      case "Concluído": return "from-purple-500 to-pink-500";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta": return "from-red-500 to-rose-500";
      case "média": return "from-yellow-500 to-amber-500";
      case "baixa": return "from-blue-500 to-indigo-500";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const stats = {
    total: projetos.length,
    emAndamento: projetos.filter(p => p.status === "Em Andamento").length,
    concluidos: projetos.filter(p => p.status === "Concluído").length,
    orçamentoTotal: projetos.reduce((sum, p) => sum + p.orçamento, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 pb-24">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center hover:shadow-md transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Obras
              </h1>
              <p className="text-xs text-gray-500">{filteredProjetos.length} projetos encontrados</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                showFilters
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:shadow-md"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar Premium */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar obras, código, localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200/50 rounded-2xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4 animate-in slide-in-from-top">
            <p className="text-xs font-semibold text-gray-600 mb-3">Filtrar por Status:</p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilterStatus(option.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                      filterStatus === option.value
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Stats Overview Premium */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-100/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.emAndamento}</p>
                <p className="text-xs text-gray-500">Ativas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg border border-green-100/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.concluidos}</p>
                <p className="text-xs text-gray-500">Concluídas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List Premium */}
        <div className="space-y-4">
          {filteredProjetos.map((projeto) => {
            const StatusIcon = getStatusIcon(projeto.status);
            const percentualGasto = (projeto.gastos / projeto.orçamento) * 100;

            return (
              <div
                key={projeto.id}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all border border-gray-100/50 hover:border-blue-200/50 group relative overflow-hidden"
              >
                {/* Destaque Badge */}
                {projeto.destaque && (
                  <div className="absolute top-0 right-0 w-16 h-16">
                    <div className="absolute transform rotate-45 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold py-1 right-[-35px] top-[15px] w-[120px] text-center shadow-lg">
                      <Star className="w-3 h-3 inline-block" />
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg text-xs font-mono font-bold text-gray-700">
                        {projeto.codigo}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getPrioridadeColor(projeto.prioridade)} shadow-md`}>
                        {projeto.prioridade.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {projeto.nome}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {projeto.descricao}
                    </p>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all flex-shrink-0">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{projeto.progresso}%</div>
                      <div className="text-xs text-white/80">Concluído</div>
                    </div>
                  </div>
                </div>

                {/* Status Badge Premium */}
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm bg-gradient-to-r ${getStatusColor(projeto.status)} shadow-lg`}>
                    <StatusIcon className="w-4 h-4" />
                    {projeto.status}
                  </div>
                </div>

                {/* Progress Bar Premium */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Progresso Geral</span>
                    <span className="font-bold text-blue-600">{projeto.progresso}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-orange-500 rounded-full shadow-md relative overflow-hidden"
                      style={{ width: `${projeto.progresso}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Info Grid Premium */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Orçamento */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/30">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-medium">Orçamento</p>
                    </div>
                    <p className="text-base font-bold text-gray-900">
                      R$ {(projeto.orçamento / 1000000).toFixed(1)}M
                    </p>
                    <div className="mt-2 h-1.5 bg-blue-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        style={{ width: `${Math.min(percentualGasto, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {percentualGasto.toFixed(0)}% utilizado
                    </p>
                  </div>

                  {/* Gastos */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 border border-orange-200/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <p className="text-xs text-gray-600 font-medium">Gastos</p>
                    </div>
                    <p className="text-base font-bold text-gray-900">
                      R$ {(projeto.gastos / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Economia: R$ {((projeto.orçamento - projeto.gastos) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Location & Team Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{projeto.localizacao}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{projeto.equipe} colaboradores</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{projeto.responsavel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Início: {projeto.inicio}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">Prazo: {projeto.prazoFinal}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all group-hover:scale-[1.02]">
                  Ver Detalhes Completos →
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProjetos.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma obra encontrada</h3>
            <p className="text-sm text-gray-500">Tente ajustar os filtros ou buscar por outros termos</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-110 transition-all z-40">
        <span className="text-2xl font-bold">+</span>
      </button>
    </div>
  );
}
