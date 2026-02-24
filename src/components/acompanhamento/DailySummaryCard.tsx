'use client';

import { ClipboardCheck, AlertTriangle, CheckCircle, ListChecks } from 'lucide-react';

interface DailySummaryCardProps {
  totalServices: number;
  attestedCount: number;
  deficitCount: number;
  dayProgress: number;
}

export function DailySummaryCard({
  totalServices,
  attestedCount,
  deficitCount,
  dayProgress,
}: DailySummaryCardProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-1.5 mb-1">
          <ListChecks className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-xs text-gray-500">Servicos</p>
        </div>
        <p className="text-xl font-bold text-gray-900">{totalServices}</p>
      </div>

      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
        <div className="flex items-center gap-1.5 mb-1">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <p className="text-xs text-green-600">Conforme</p>
        </div>
        <p className="text-xl font-bold text-green-900">{attestedCount}</p>
      </div>

      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <p className="text-xs text-red-600">Com Deficit</p>
        </div>
        <p className="text-xl font-bold text-red-900">{deficitCount}</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center gap-1.5 mb-1">
          <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-xs text-blue-600">Progresso</p>
        </div>
        <p className="text-xl font-bold text-blue-900">
          {dayProgress.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
