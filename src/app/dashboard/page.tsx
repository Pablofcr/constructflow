"use client";

import { useState } from "react";
import { 
  Building2, 
  Users, 
  Package, 
  FileText, 
  TrendingUp, 
  Calendar,
  ClipboardList,
  Truck,
  Menu,
  Bell,
  Search
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");

  // Estatísticas do usuário
  const stats = {
    obrasAtivas: 8,
    colaboradores: 156,
    alertas: 3
  };

  // Módulos principais com ícones coloridos e bonitos
  const mainModules = [
    { 
      icon: "🏗️",
      iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
      label: "Dados da Obra", 
      href: "/projects",
      description: "Visualize e gerencie"
    },
    { 
      icon: "👷",
      iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
      label: "Colaboradores", 
      href: "/team",
      description: "Equipe e presença"
    },
    { 
      icon: "💰",
      iconBg: "bg-gradient-to-br from-green-400 to-green-600",
      label: "Orçamento", 
      href: "/budget",
      description: "Controle financeiro"
    },
    { 
      icon: "📋",
      iconBg: "bg-gradient-to-br from-purple-400 to-purple-600",
      label: "Planejamento", 
      href: "/planning",
      description: "Cronograma"
    },
    { 
      icon: "📝",
      iconBg: "bg-gradient-to-br from-indigo-400 to-indigo-600",
      label: "Diário de Obra", 
      href: "/daily-log",
      description: "Registro diário"
    },
    { 
      icon: "📦",
      iconBg: "bg-gradient-to-br from-pink-400 to-pink-600",
      label: "Solicitação de Material", 
      href: "/material-request",
      description: "Requisições"
    },
    { 
      icon: "🚚",
      iconBg: "bg-gradient-to-br from-cyan-400 to-cyan-600",
      label: "Entrega de Material", 
      href: "/deliveries",
      description: "Acompanhamento"
    },
    { 
      icon: "📊",
      iconBg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
      label: "Relatórios", 
      href: "/reports",
      description: "Análises"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Clean */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ConstructFlow</h1>
                <p className="text-xs text-gray-500">Gestão de Obras</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {stats.alertas > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar obras, colaboradores, materiais..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Stats Cards - Horizontal */}
      <div className="px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-lg shadow-md">
                🏗️
              </div>
              <span className="text-xs text-gray-500">Ativas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.obrasAtivas}</p>
          </div>

          <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-lg shadow-md">
                👷
              </div>
              <span className="text-xs text-gray-500">Equipe</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.colaboradores}</p>
          </div>

          <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center text-lg shadow-md">
                ⚠️
              </div>
              <span className="text-xs text-gray-500">Alertas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.alertas}</p>
          </div>
        </div>
      </div>

      {/* Main Modules Grid 2x2 - ÍCONES COLORIDOS E BONITOS */}
      <div className="px-4 pb-24">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Módulos Principais</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {mainModules.map((module, index) => (
            <Link
              key={index}
              href={module.href}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-3">
                {/* Icon Container - COLORIDO E BONITO */}
                <div className={`w-20 h-20 ${module.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all`}>
                  <span className="text-4xl filter drop-shadow-md">{module.icon}</span>
                </div>
                
                {/* Text */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">
                    {module.label}
                  </h3>
                  <p className="text-xs text-gray-500 leading-tight">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Navigation - Clean */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
              activeTab === "home"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-medium">Início</span>
          </button>

          <Link
            href="/projects"
            className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs font-medium">Obras</span>
          </Link>

          <button className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">Equipe</span>
          </button>

          <button className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
