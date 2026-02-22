'use client';

import {
  Circle,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Pencil,
} from 'lucide-react';
import { formatDateBR } from '@/lib/date-utils';

interface Stage {
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

interface PlanningStageCardProps {
  stage: Stage;
  onEdit: (stage: Stage) => void;
}

const STATUS_CONFIG: Record<string, { icon: typeof Circle; label: string; color: string }> = {
  PENDING: { icon: Circle, label: 'Pendente', color: 'text-gray-500 bg-gray-50' },
  IN_PROGRESS: { icon: PlayCircle, label: 'Em Andamento', color: 'text-blue-600 bg-blue-50' },
  COMPLETED: { icon: CheckCircle, label: 'Concluida', color: 'text-green-600 bg-green-50' },
  BLOCKED: { icon: AlertCircle, label: 'Bloqueada', color: 'text-red-600 bg-red-50' },
};

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export function PlanningStageCard({ stage, onEdit }: PlanningStageCardProps) {
  const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = config.icon;
  const progress = Number(stage.progressPercent);

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
          <StatusIcon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {stage.code && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded">
                {stage.code}
              </span>
            )}
            <h3 className="text-sm font-semibold text-gray-900 truncate">{stage.name}</h3>
          </div>

          {stage.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">{stage.description}</p>
          )}

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Progresso</span>
              <span className="font-bold text-gray-700">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 flex-wrap">
            {(stage.startDate || stage.endDate) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDateBR(stage.startDate)} — {formatDateBR(stage.endDate)}
                </span>
              </div>
            )}
            {stage.responsibleName && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{stage.responsibleName}</span>
              </div>
            )}
            <span className="text-xs font-medium text-gray-700 ml-auto">
              {formatCurrency(stage.budgetCost)}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => onEdit(stage)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title="Editar etapa"
        >
          <Pencil className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
