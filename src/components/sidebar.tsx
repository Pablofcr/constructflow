"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from 'lucide-react';

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

interface SidebarProps {
  activeModule?: string;
}

export function Sidebar({ activeModule: propActiveModule }: SidebarProps = {}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determinar módulo ativo baseado na URL ou prop
  const getActiveModule = () => {
    if (propActiveModule) return propActiveModule;
    
    // Mapear pathname para módulo
    if (pathname?.startsWith('/projects')) return 'obras';
    if (pathname?.startsWith('/team')) return 'colaboradores';
    if (pathname?.startsWith('/budget')) return 'orcamento';
    if (pathname?.startsWith('/planning')) return 'planejamento';
    if (pathname?.startsWith('/daily-log')) return 'diario';
    if (pathname?.startsWith('/material-request')) return 'solicitacao';
    if (pathname?.startsWith('/deliveries')) return 'entrega';
    if (pathname?.startsWith('/reports')) return 'relatorios';
    
    return '';
  };

  const activeModule = getActiveModule();

  return (
    <>
      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-24 lg:h-screen lg:sticky lg:top-0 bg-white border-r border-gray-200 flex-shrink-0">
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
                  className={`transition-all ${activeModule === module.id ? "filter-none" : "grayscale opacity-50 group-hover:opacity-75"}`} 
                />
              </div>
              {activeModule === module.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          ))}
        </div>
        <Link href="/" className="p-4 border-t border-gray-200">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mx-auto">
            <span className="text-2xl">🏠</span>
          </div>
        </Link>
      </aside>

      {/* BOTÃO MENU MOBILE */}
      <button 
        onClick={() => setSidebarOpen(true)} 
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* SIDEBAR - Mobile (Overlay) */}
      {sidebarOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 h-screen w-64 bg-white z-50 shadow-2xl border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {menuModules.map((module) => (
                <Link 
                  key={module.id} 
                  href={module.href} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeModule === module.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 flex-shrink-0">
                    <Image 
                      src={module.iconPath} 
                      alt={module.label} 
                      width={32} 
                      height={32}
                      className={`transition-all ${activeModule === module.id ? "filter-none" : "grayscale opacity-50"}`} 
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    activeModule === module.id ? "text-blue-600" : "text-gray-700"
                  }`}>
                    {module.label}
                  </span>
                  {activeModule === module.id && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50" onClick={() => setSidebarOpen(false)}>
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
    </>
  );
}
