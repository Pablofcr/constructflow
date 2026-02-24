'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { DeviationStageCard } from './DeviationStageCard';

interface DeviationDashboardProps {
  planningId: string;
}

interface DeviationData {
  overallExpected: number;
  overallActual: number;
  overallDeviation: number;
  stages: Array<{
    stageId: string;
    stageName: string;
    stageOrder: number;
    expectedProgress: number;
    actualProgress: number;
    deviation: number;
    color: 'green' | 'yellow' | 'red';
    budgetPercentage: number;
  }>;
}

export function DeviationDashboard({ planningId }: DeviationDashboardProps) {
  const [data, setData] = useState<DeviationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/daily-tracking/${planningId}/deviations`
        );
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [planningId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">
          Nao foi possivel carregar os indicadores de desvio.
        </p>
      </div>
    );
  }

  const overallColor =
    Math.abs(data.overallDeviation) <= 5
      ? 'green'
      : Math.abs(data.overallDeviation) <= 15
        ? 'yellow'
        : 'red';

  const colorConfig = {
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  };

  const config = colorConfig[overallColor];

  return (
    <div className="space-y-4">
      {/* Overall summary */}
      <div
        className={`rounded-xl border p-4 ${config.bg} ${config.border}`}
      >
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Resumo Geral de Desvio
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Esperado</p>
            <p className="text-lg font-bold text-gray-900">
              {data.overallExpected.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Atual</p>
            <p className={`text-lg font-bold ${config.text}`}>
              {data.overallActual.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Desvio</p>
            <p className={`text-lg font-bold ${config.text}`}>
              {data.overallDeviation > 0 ? '+' : ''}
              {data.overallDeviation.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Stage cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.stages
          .sort((a, b) => a.stageOrder - b.stageOrder)
          .map((stage) => (
            <DeviationStageCard
              key={stage.stageId}
              stageName={stage.stageName}
              expectedProgress={stage.expectedProgress}
              actualProgress={stage.actualProgress}
              deviation={stage.deviation}
              color={stage.color}
            />
          ))}
      </div>
    </div>
  );
}
