'use client';

import { LayoutList, BarChart3, Settings, Trash2, Activity, Play, Pause } from 'lucide-react';
import { formatDateBR } from '@/lib/date-utils';
import Link from 'next/link';

interface Planning {
  id: string;
  name: string;
  status: string;
  budgetSourceType: string;
  totalBudget: number | string;
  overallProgress: number | string;
  startDate: string | null;
  endDate: string | null;
}

interface PlanningHeaderProps {
  planning: Planning;
  viewMode: 'list' | 'gantt';
  onViewModeChange: (mode: 'list' | 'gantt') => void;
  onOpenSettings: () => void;
  onQuickStatusChange: (newStatus: string) => void;
  onDeletePlanning: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Concluido', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  ESTIMATED: { label: 'Estimado', color: 'bg-blue-100 text-blue-700' },
  REAL: { label: 'Completo', color: 'bg-green-100 text-green-700' },
  AI: { label: 'IA', color: 'bg-purple-100 text-purple-700' },
};

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

// Quick action config based on current status
const QUICK_ACTIONS: Record<string, { label: string; icon: typeof Play; nextStatus: string; color: string } | null> = {
  DRAFT: { label: 'Ativar', icon: Play, nextStatus: 'ACTIVE', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  ACTIVE: { label: 'Pausar', icon: Pause, nextStatus: 'PAUSED', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  PAUSED: { label: 'Retomar', icon: Play, nextStatus: 'ACTIVE', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  COMPLETED: null,
  CANCELLED: null,
};

export function PlanningHeader({
  planning,
  viewMode,
  onViewModeChange,
  onOpenSettings,
  onQuickStatusChange,
  onDeletePlanning,
}: PlanningHeaderProps) {
  const progress = Number(planning.overallProgress);
  const statusConfig = STATUS_LABELS[planning.status] || STATUS_LABELS.DRAFT;
  const sourceConfig = SOURCE_LABELS[planning.budgetSourceType] || SOURCE_LABELS.ESTIMATED;
  const quickAction = QUICK_ACTIONS[planning.status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      {/* Top row: title + icon buttons */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{planning.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${sourceConfig.color}`}>
              {sourceConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs text-gray-500 flex-wrap">
            {planning.startDate && <span>Inicio: {formatDateBR(planning.startDate)}</span>}
            {planning.endDate && <span>Fim: {formatDateBR(planning.endDate)}</span>}
            <span className="font-medium text-gray-700">{formatCurrency(planning.totalBudget)}</span>
          </div>
        </div>

        {/* Icon buttons - always visible */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configuracoes"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onDeletePlanning}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir planejamento"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Action bar: quick actions + view toggle */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Quick status action */}
        {quickAction && (
          <button
            onClick={() => onQuickStatusChange(quickAction.nextStatus)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${quickAction.color}`}
            title={quickAction.label}
          >
            <quickAction.icon className="w-3.5 h-3.5" />
            {quickAction.label}
          </button>
        )}
        {/* Acompanhamento link (only when ACTIVE) */}
        {planning.status === 'ACTIVE' && (
          <Link
            href="/daily-log"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Acompanhamento</span>
            <span className="sm:hidden">Diario</span>
          </Link>
        )}
        {/* Spacer */}
        <div className="flex-1" />
        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Lista"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('gantt')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'gantt' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Gantt"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overall progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Progresso Geral</span>
          <span className="font-bold text-gray-700">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
