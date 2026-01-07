"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  X,
  Menu,
  UserCircle
} from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("todos");
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

  const activeModule = "colaboradores";

  const colaboradores = [
    {
      id: 1,
      nome: "Carlos Silva",
      especialidade: "Engenheiro Civil",
      tipo: "engenheiro",
      telefone: "(11) 98765-4321",
      email: "carlos.silva@constructflow.com",
      projeto: "Edifício Vila Madalena",
      status: "ativo",
      dataContratacao: "15/03/2020",
      salario: 12000
    },
    {
      id: 2,
      nome: "Maria Santos",
      especialidade: "Engenheira Civil",
      tipo: "engenheiro",
      telefone: "(11) 98765-4322",
      email: "maria.santos@constructflow.com",
      projeto: "Centro Comercial Brooklin",
      status: "ativo",
      dataContratacao: "20/06/2019",
      salario: 13000
    },
    {
      id: 3,
      nome: "João Pereira",
      especialidade: "Pedreiro",
      tipo: "pedreiro",
      telefone: "(11) 98765-4323",
      email: "joao.pereira@constructflow.com",
      projeto: "Edifício Vila Madalena",
      status: "ativo",
      dataContratacao: "10/01/2021",
      salario: 4500
    },
    {
      id: 4,
      nome: "Ana Costa",
      especialidade: "Arquiteta",
      tipo: "arquiteto",
      telefone: "(11) 98765-4324",
      email: "ana.costa@constructflow.com",
      projeto: "Condomínio Alphaville",
      status: "ativo",
      dataContratacao: "15/08/2020",
      salario: 10000
    },
    {
      id: 5,
      nome: "Roberto Lima",
      especialidade: "Eletricista",
      tipo: "eletricista",
      telefone: "(11) 98765-4325",
      email: "roberto.lima@constructflow.com",
      projeto: "Galpão Industrial",
      status: "ferias",
      dataContratacao: "20/04/2018",
      salario: 5500
    },
    {
      id: 6,
      nome: "Paulo Oliveira",
      especialidade: "Encanador",
      tipo: "encanador",
      telefone: "(11) 98765-4326",
      email: "paulo.oliveira@constructflow.com",
      projeto: "Centro Comercial Brooklin",
      status: "ativo",
      dataContratacao: "05/11/2021",
      salario: 5000
    }
  ];

  const specialtyOptions = [
    { value: "todos", label: "Todos" },
    { value: "engenheiro", label: "Engenheiros" },
    { value: "pedreiro", label: "Pedreiros" },
    { value: "arquiteto", label: "Arquitetos" },
    { value: "eletricista", label: "Eletricistas" },
    { value: "encanador", label: "Encanadores" }
  ];

  const filteredColaboradores = colaboradores.filter(colab => {
    const matchesSearch = 
      colab.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colab.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colab.projeto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = filterSpecialty === "todos" || colab.tipo === filterSpecialty;
    
    return matchesSearch && matchesSpecialty;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "text-green-700 bg-green-50 border-green-200";
      case "ferias": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "afastado": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const stats = {
    total: colaboradores.length,
    ativos: colaboradores.filter(c => c.status === "ativo").length,
    ferias: colaboradores.filter(c => c.status === "ferias").length
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
              <h1 className="text-xl font-bold text-gray-900">Colaboradores</h1>
              <p className="text-xs text-gray-500">{filteredColaboradores.length} colaboradores encontrados</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showFilters ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
            <div className="min-w-[120px] bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="min-w-[120px] bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Ativos</p>
              <p className="text-2xl font-bold text-green-900">{stats.ativos}</p>
            </div>
            <div className="min-w-[120px] bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600 mb-1">Férias</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.ferias}</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar colaboradores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {specialtyOptions.map((option) => (
                <button key={option.value} onClick={() => setFilterSpecialty(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterSpecialty === option.value ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
          {filteredColaboradores.map((colab) => (
            <div key={colab.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-10 h-10 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900">{colab.nome}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(colab.status)}`}>
                      {colab.status === "ativo" ? "Ativo" : colab.status === "ferias" ? "Férias" : "Afastado"}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 font-medium mb-1">{colab.especialidade}</p>
                  <p className="text-xs text-gray-500">Projeto: {colab.projeto}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-xs">{colab.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-xs">{colab.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs">Desde {colab.dataContratacao}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-xs">R$ {colab.salario.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <button className="w-full py-2.5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-600 transition-all">
                Ver Detalhes
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
