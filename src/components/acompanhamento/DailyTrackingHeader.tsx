'use client';

import { Activity, CheckCircle2, Clock } from 'lucide-react';

interface DailyTrackingHeaderProps {
  planningName: string;
  planningStatus: string;
  overallProgress: number;
  hasBaseline: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Concluido', color: 'bg-blue-100 text-blue-700' },
};

export function DailyTrackingHeader({
  planningName,
  planningStatus,
  overallProgress,
  hasBaseline,
}: DailyTrackingHeaderProps) {
  const statusConfig = STATUS_LABELS[planningStatus] || STATUS_LABELS.ACTIVE;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{planningName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
              {hasBaseline ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Baseline congelado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Sem baseline
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Progresso Geral</span>
          <span className="font-bold text-gray-700">
            {overallProgress.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              overallProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
