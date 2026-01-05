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
  ArrowLeft,
  ChevronRight
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Obras</h1>
              <p className="text-xs text-gray-500">{filteredProjetos.length} projetos</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                showFilters
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterStatus === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Projects List */}
      <div className="px-4 py-4 space-y-4">
        {filteredProjetos.map((projeto) => {
          const percentualGasto = (projeto.gastos / projeto.orçamento) * 100;

          return (
            <div
              key={projeto.id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              {/* Header */}
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
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {projeto.nome}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {projeto.descricao}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span className="font-medium">Progresso</span>
                  <span className="font-bold text-blue-600">{projeto.progresso}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${projeto.progresso}%` }}
                  />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-xs text-gray-600">Orçamento</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    R$ {(projeto.orçamento / 1000000).toFixed(1)}M
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-xs text-gray-600">Gastos</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    R$ {(projeto.gastos / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>

              {/* Footer Info */}
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

              {/* Action Button */}
              <button className="w-full py-3 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all flex items-center justify-center gap-2 group">
                Ver Detalhes
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProjetos.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">Nenhuma obra encontrada</h3>
          <p className="text-sm text-gray-500">Tente ajustar os filtros ou buscar por outros termos</p>
        </div>
      )}
    </div>
  );
}
