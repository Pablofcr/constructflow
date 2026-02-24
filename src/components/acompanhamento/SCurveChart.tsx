'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface SCurveChartProps {
  planningId: string;
}

interface SCurveData {
  dates: string[];
  baseline: number[];
  replanned: number[];
  executed: (number | null)[];
}

export function SCurveChart({ planningId }: SCurveChartProps) {
  const [data, setData] = useState<SCurveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/daily-tracking/${planningId}/curva-s`
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

  if (!data || data.dates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">
          Dados insuficientes para gerar a Curva S. Certifique-se de que o
          planejamento possui datas e baseline.
        </p>
      </div>
    );
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Sample data for chart (show every Nth point to avoid overcrowding)
  const totalPoints = data.dates.length;
  const maxPoints = 60;
  const step = Math.max(1, Math.floor(totalPoints / maxPoints));

  const chartData = data.dates
    .map((date, i) => ({
      date,
      dateLabel: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      baseline: data.baseline[i],
      replanejado: data.replanned[i],
      executado: data.executed[i],
    }))
    .filter((_, i) => i % step === 0 || i === totalPoints - 1);

  // Find today's index for the reference line
  const todayLabel = chartData.find((d) => d.date === today)?.dateLabel;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-4">
        Curva S - Progresso Acumulado
      </h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any, name?: string) => {
                if (value === null || value === undefined) return ['—', name || ''];
                const num = typeof value === 'string' ? parseFloat(value) : Number(value);
                return [`${num.toFixed(1)}%`, name || ''];
              }) as never}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="line"
            />
            {todayLabel && (
              <ReferenceLine
                x={todayLabel}
                stroke="#6b7280"
                strokeDasharray="4 4"
                label={{
                  value: 'Hoje',
                  position: 'top',
                  style: { fontSize: 10, fill: '#6b7280' },
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="replanejado"
              name="Replanejado"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="executado"
              name="Executado"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-500 inline-block" style={{ borderTop: '2px dashed #3b82f6' }} />
          Baseline (planejado original)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-yellow-500 inline-block" />
          Replanejado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-green-500 inline-block" />
          Executado
        </span>
      </div>
    </div>
  );
}
