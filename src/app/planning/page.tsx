"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/contexts/project-context";
import { Sidebar } from "@/components/sidebar";
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  Loader2,
  Circle,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { CreatePlanningDialog } from "@/components/planejamento/CreatePlanningDialog";
import { StageEditDialog } from "@/components/planejamento/StageEditDialog";
import { ServiceEditDialog } from "@/components/planejamento/ServiceEditDialog";
import { PlanningHeader } from "@/components/planejamento/PlanningHeader";
import { PlanningStageList } from "@/components/planejamento/PlanningStageList";
import { GanttChart } from "@/components/planejamento/GanttChart";
import type { PlanningService } from "@/components/planejamento/PlanningStageCard";

interface PlanningStage {
  id: string;
  planningId: string;
  name: string;
  code: string | null;
  order: number;
  description: string | null;
  budgetCost: number | string;
  budgetPercentage: number | string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  status: string;
  progressPercent: number | string;
  responsibleId: string | null;
  responsibleName: string | null;
  notes: string | null;
}

interface Planning {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: string;
  budgetSourceType: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number | string;
  overallProgress: number | string;
  stages: PlanningStage[];
}

export default function PlanningPage() {
  const { activeProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editStage, setEditStage] = useState<PlanningStage | null>(null);
  const [editService, setEditService] = useState<PlanningService | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPlanning = useCallback(async () => {
    if (!activeProject) {
      setPlanning(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/planning?projectId=${activeProject.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPlanning(data[0]);
        } else {
          setPlanning(null);
        }
      }
    } catch {
      // silenciar
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchPlanning();
  }, [fetchPlanning]);

  const handleEditPlanning = async () => {
    if (!planning) return;
    const nextStatus =
      planning.status === "DRAFT"
        ? "ACTIVE"
        : planning.status === "ACTIVE"
          ? "PAUSED"
          : planning.status === "PAUSED"
            ? "ACTIVE"
            : planning.status;

    try {
      const res = await fetch(`/api/planning/${planning.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchPlanning();
      }
    } catch {
      // erro de rede
    }
  };

  const handleDeletePlanning = async () => {
    if (!planning) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/planning/${planning.id}`, { method: "DELETE" });
      if (res.ok) {
        setPlanning(null);
        setShowDeleteConfirm(false);
      }
    } catch {
      // erro de rede
    } finally {
      setDeleting(false);
    }
  };

  // Filtrar etapas
  const filteredStages = (planning?.stages || []).filter((stage) => {
    const matchesSearch =
      stage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stage.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stage.responsibleName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "todos" || stage.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Estatisticas
  const allStages = planning?.stages || [];
  const stats = {
    total: allStages.length,
    pending: allStages.filter((s) => s.status === "PENDING").length,
    inProgress: allStages.filter((s) => s.status === "IN_PROGRESS").length,
    completed: allStages.filter((s) => s.status === "COMPLETED").length,
  };

  const statusFilterOptions = [
    { value: "todos", label: "Todos" },
    { value: "PENDING", label: "Pendentes" },
    { value: "IN_PROGRESS", label: "Em Andamento" },
    { value: "COMPLETED", label: "Concluidas" },
    { value: "BLOCKED", label: "Bloqueadas" },
  ];

  // ======================================================================
  // Estado 1: Sem projeto selecionado
  // ======================================================================
  if (!activeProject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <CalendarClock className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Selecione um Projeto
              </h2>
              <p className="text-sm text-gray-500 max-w-md">
                Para acessar o planejamento, selecione um projeto no menu
                superior.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // Loading
  // ======================================================================
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // Estado 2: Projeto sem planning
  // ======================================================================
  if (!planning) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <CalendarClock className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Crie o Planejamento da Obra
              </h2>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                O planejamento importa as etapas do orcamento selecionado, permitindo
                acompanhar o cronograma, responsaveis e progresso de cada etapa.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Criar Planejamento
              </button>
            </div>
          </div>

          <CreatePlanningDialog
            open={showCreate}
            projectId={activeProject.id}
            onClose={() => setShowCreate(false)}
            onCreated={fetchPlanning}
          />
        </div>
      </div>
    );
  }

  // ======================================================================
  // Estado 3: Planning existe
  // ======================================================================
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-20">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Header */}
          <PlanningHeader
            planning={planning}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onEditPlanning={handleEditPlanning}
            onDeletePlanning={() => setShowDeleteConfirm(true)}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-center gap-1 mb-1">
                <Circle className="w-3 h-3 text-yellow-600" />
                <p className="text-xs text-yellow-600">Pendentes</p>
              </div>
              <p className="text-xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-1 mb-1">
                <PlayCircle className="w-3 h-3 text-blue-600" />
                <p className="text-xs text-blue-600">Em Andamento</p>
              </div>
              <p className="text-xl font-bold text-blue-900">{stats.inProgress}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <p className="text-xs text-green-600">Concluidas</p>
              </div>
              <p className="text-xl font-bold text-green-900">{stats.completed}</p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar etapas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
              {statusFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {viewMode === "list" ? (
            <PlanningStageList
              stages={filteredStages}
              onEditStage={(stage) => setEditStage(stage)}
              onEditService={(service) => setEditService(service)}
              planningId={planning.id}
            />
          ) : (
            <GanttChart
              stages={filteredStages}
              planningStartDate={planning.startDate}
              planningEndDate={planning.endDate}
              onEditStage={(stage) => setEditStage(stage)}
              onEditService={(service) => setEditService(service)}
              planningId={planning.id}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <StageEditDialog
        open={!!editStage}
        stage={editStage}
        projectId={activeProject.id}
        onClose={() => setEditStage(null)}
        onSave={fetchPlanning}
      />

      <ServiceEditDialog
        open={!!editService}
        service={editService}
        planningId={planning.id}
        onClose={() => setEditService(null)}
        onSave={fetchPlanning}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Excluir Planejamento</h3>
                <p className="text-sm text-gray-500">Esta acao nao pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Todas as etapas, datas e dados de progresso serao permanentemente removidos.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePlanning}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
