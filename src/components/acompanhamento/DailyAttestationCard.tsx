'use client';

import { Check, X } from 'lucide-react';

export interface AttestationEntry {
  id: string;
  serviceId: string;
  stageId: string;
  plannedPercent: number;
  executedAsPlanned: boolean;
  actualPercent: number;
  deficitPercent: number;
  notes: string | null;
  service: {
    id: string;
    description: string;
    code: string | null;
    unit: string;
    quantity: number;
    totalPrice: number;
    weight: number;
    progressPercent: number;
    startDate: string | null;
    endDate: string | null;
    stageName: string;
    stageOrder: number;
  };
}

interface DailyAttestationCardProps {
  entry: AttestationEntry;
  isAttested: boolean;
  onToggle: (serviceId: string, value: boolean) => void;
  onPercentChange: (serviceId: string, percent: number) => void;
  onNoteChange: (serviceId: string, note: string) => void;
  editValues: {
    executedAsPlanned: boolean | null;
    actualPercent: number;
    note: string;
  };
}

export function DailyAttestationCard({
  entry,
  isAttested,
  onToggle,
  onPercentChange,
  onNoteChange,
  editValues,
}: DailyAttestationCardProps) {
  const planned = entry.plannedPercent;
  const currentProgress = entry.service.progressPercent;
  const isDecided = editValues.executedAsPlanned !== null;

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all ${
        isAttested
          ? entry.deficitPercent > 0
            ? 'border-red-200 bg-red-50/50'
            : 'border-green-200 bg-green-50/50'
          : isDecided
            ? editValues.executedAsPlanned
              ? 'border-green-200'
              : 'border-yellow-200'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {entry.service.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            {entry.service.code && <span>{entry.service.code}</span>}
            <span>
              {entry.service.quantity} {entry.service.unit}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="text-sm font-bold text-blue-600">
            Meta: {planned.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">
            Acumulado: {currentProgress.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-400 rounded-full transition-all"
          style={{ width: `${Math.min(currentProgress, 100)}%` }}
        />
      </div>

      {!isAttested && (
        <div>
          {/* Yes/No buttons */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => onToggle(entry.serviceId, true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                editValues.executedAsPlanned === true
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-green-50 hover:border-green-200'
              }`}
            >
              <Check className="w-4 h-4" />
              Sim
            </button>
            <button
              onClick={() => onToggle(entry.serviceId, false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                editValues.executedAsPlanned === false
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:border-red-200'
              }`}
            >
              <X className="w-4 h-4" />
              Nao
            </button>
          </div>

          {/* Actual percent input when "No" */}
          {editValues.executedAsPlanned === false && (
            <div className="space-y-2 mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Percentual executado hoje
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={editValues.actualPercent}
                    onChange={(e) =>
                      onPercentChange(entry.serviceId, Number(e.target.value))
                    }
                    className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-sm text-gray-500">
                    de {planned.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observacao (opcional)
                </label>
                <input
                  type="text"
                  value={editValues.note}
                  onChange={(e) =>
                    onNoteChange(entry.serviceId, e.target.value)
                  }
                  placeholder="Motivo do deficit..."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show result if attested */}
      {isAttested && (
        <div className="flex items-center gap-2 text-xs">
          {entry.executedAsPlanned ? (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              Executado conforme ({entry.actualPercent.toFixed(1)}%)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <X className="w-3.5 h-3.5" />
              Executado {entry.actualPercent.toFixed(1)}% (deficit:{' '}
              {entry.deficitPercent.toFixed(1)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
