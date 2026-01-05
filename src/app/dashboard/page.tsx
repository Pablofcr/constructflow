"use client";

import { useState } from "react";
import { 
  Building2, 
  Users, 
  Package, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  Hammer
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dados realísticos
  const stats = {
    totalProjetos: 12,
    projetosAtivos: 8,
    orçamentoTotal: 15800000,
    gastosAtuais: 9450000,
    colaboradores: 156,
    materiaisBaixos: 3
  };

  const projetosDestaque = [
    {
      id: 1,
      nome: "Edifício Vila Madalena",
      progresso: 65,
      status: "Em Andamento",
      orçamento: 4500000,
      gastos: 2925000,
      equipe: 45,
      prazo: "15/04/2025",
      prioridade: "alta"
    },
    {
      id: 2,
      nome: "Centro Comercial Brooklin",
      progresso: 15,
      status: "Planejamento",
      orçamento: 8200000,
      gastos: 1230000,
      equipe: 12,
      prazo: "20/08/2025",
      prioridade: "média"
    },
    {
      id: 3,
      nome: "Condomínio Alphaville",
      progresso: 30,
      status: "Em Pausa",
      orçamento: 6500000,
      gastos: 1950000,
      equipe: 8,
      prazo: "10/06/2025",
      prioridade: "baixa"
    }
  ];

  const menuItems = [
    { icon: Building2, label: "Obras", href: "/projects", color: "from-blue-500 to-blue-600" },
    { icon: Users, label: "Equipe", href: "/team", color: "from-orange-500 to-orange-600" },
    { icon: Package, label: "Materiais", href: "/materials", color: "from-green-500 to-green-600" },
    { icon: FileText, label: "Relatórios", href: "/reports", color: "from-purple-500 to-purple-600" },
    { icon: TrendingUp, label: "Orçamento", href: "/budget", color: "from-yellow-500 to-yellow-600" },
    { icon: Calendar, label: "Agenda", href: "/schedule", color: "from-pink-500 to-pink-600" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Andamento": return "bg-gradient-to-r from-green-500 to-emerald-500";
      case "Planejamento": return "bg-gradient-to-r from-blue-500 to-cyan-500";
      case "Em Pausa": return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "Concluído": return "bg-gradient-to-r from-purple-500 to-pink-500";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta": return "bg-gradient-to-r from-red-500 to-rose-500";
      case "média": return "bg-gradient-to-r from-yellow-500 to-amber-500";
      case "baixa": return "bg-gradient-to-r from-blue-500 to-indigo-500";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-black/5">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  ConstructFlow
                </h1>
                <p className="text-xs text-gray-500">Gestão Profissional</p>
              </div>
            </div>
            <button className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards Premium */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Projetos Ativos */}
          <div className="bg-white rounded-2xl p-4 shadow-lg shadow-blue-500/10 border border-blue-100/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.projetosAtivos}</p>
                <p className="text-xs text-gray-500">Obras Ativas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: `${(stats.projetosAtivos / stats.totalProjetos) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-600 font-medium">{stats.totalProjetos}</span>
            </div>
          </div>

          {/* Orçamento */}
          <div className="bg-white rounded-2xl p-4 shadow-lg shadow-orange-500/10 border border-orange-100/50 hover:shadow-xl hover:shadow-orange-500/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {(stats.gastosAtuais / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500">de {(stats.orçamentoTotal / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" style={{ width: `${(stats.gastosAtuais / stats.orçamentoTotal) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-600 font-medium">60%</span>
            </div>
          </div>

          {/* Equipe */}
          <div className="bg-white rounded-2xl p-4 shadow-lg shadow-green-500/10 border border-green-100/50 hover:shadow-xl hover:shadow-green-500/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.colaboradores}</p>
                <p className="text-xs text-gray-500">Colaboradores</p>
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-2xl p-4 shadow-lg shadow-yellow-500/10 border border-yellow-100/50 hover:shadow-xl hover:shadow-yellow-500/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.materiaisBaixos}</p>
                <p className="text-xs text-gray-500">Alertas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid Premium */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-orange-500 rounded-full" />
            Módulos
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all border border-gray-100/50 hover:border-blue-200/50 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-700 text-center group-hover:text-blue-600 transition-colors">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Projetos em Destaque */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-orange-500 rounded-full" />
              Obras em Destaque
            </h2>
            <Link href="/projects" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Ver todas →
            </Link>
          </div>

          <div className="space-y-4">
            {projetosDestaque.map((projeto) => (
              <div
                key={projeto.id}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all border border-gray-100/50 hover:border-blue-200/50 group"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getPrioridadeColor(projeto.prioridade)} shadow-md`}>
                        {projeto.prioridade.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(projeto.status)} shadow-md`}>
                        {projeto.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {projeto.nome}
                    </h3>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                    {projeto.progresso}%
                  </div>
                </div>

                {/* Barra de Progresso Premium */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Progresso da Obra</span>
                    <span className="font-bold text-blue-600">{projeto.progresso}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-orange-500 rounded-full shadow-md transition-all duration-500"
                      style={{ width: `${projeto.progresso}%` }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/30">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-medium">Orçamento</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      R$ {(projeto.orçamento / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 border border-orange-200/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <p className="text-xs text-gray-600 font-medium">Gastos</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      R$ {(projeto.gastos / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600 font-medium">{projeto.equipe} pessoas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600 font-medium">{projeto.prazo}</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                    Detalhes →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Premium */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl shadow-black/10 z-50">
        <div className="flex items-center justify-around px-2 py-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeTab === "dashboard"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-semibold">Dashboard</span>
          </button>
          <Link
            href="/projects"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs font-semibold">Obras</span>
          </Link>
          <button className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <Users className="w-5 h-5" />
            <span className="text-xs font-semibold">Equipe</span>
          </button>
          <button className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <Package className="w-5 h-5" />
            <span className="text-xs font-semibold">Materiais</span>
          </button>
        </div>
      </nav>

      {/* Spacer para bottom nav */}
      <div className="h-20" />
    </div>
  );
}
