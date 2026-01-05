"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Building2, 
  Users, 
  Menu,
  Bell,
  Search,
  FileText
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

  // Módulos principais com ícones 3D
  const mainModules = [
    { 
      iconPath: "/icons/building.png",
      label: "Dados da Obra", 
      href: "/projects",
      description: "Visualize e gerencie"
    },
    { 
      iconPath: "/icons/worker.png",
      label: "Colaboradores", 
      href: "/team",
      description: "Equipe e presença"
    },
    { 
      iconPath: "/icons/money.png",
      label: "Orçamento", 
      href: "/budget",
      description: "Controle financeiro"
    },
    { 
      iconPath: "/icons/planning.png",
      label: "Planejamento", 
      href: "/planning",
      description: "Cronograma"
    },
    { 
      iconPath: "/icons/diary.png",
      label: "Diário de Obra", 
      href: "/daily-log",
      description: "Registro diário"
    },
    { 
      iconPath: "/icons/package.png",
      label: "Solicitação de Material", 
      href: "/material-request",
      description: "Requisições"
    },
    { 
      iconPath: "/icons/truck.png",
      label: "Entrega de Material", 
      href: "/deliveries",
      description: "Acompanhamento"
    },
    { 
      iconPath: "/icons/chart.png",
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
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-500">Ativas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.obrasAtivas}</p>
          </div>

          <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-500">Equipe</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.colaboradores}</p>
          </div>

          <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-orange-600" />
              <span className="text-xs text-gray-500">Alertas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.alertas}</p>
          </div>
        </div>
      </div>

      {/* Main Modules Grid 2x2 - ÍCONES 3D GRANDES */}
      <div className="px-4 pb-24">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Módulos Principais</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {mainModules.map((module, index) => (
            <Link
              key={index}
              href={module.href}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-3">
                {/* Icon Container - SEM FUNDO, ÍCONE GRANDE */}
                <div className="w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Image
                    src={module.iconPath}
                    alt={module.label}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    priority
                  />
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
