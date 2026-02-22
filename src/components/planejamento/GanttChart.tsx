'use client';

import { useState, useMemo } from 'react';
import { GanttTimeline } from './GanttTimeline';
import { GanttBar } from './GanttBar';
import { differenceInDays, addDays } from '@/lib/date-utils';

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

interface GanttChartProps {
  stages: Stage[];
  planningStartDate?: string | null;
  planningEndDate?: string | null;
  onEditStage: (stage: Stage) => void;
}

export function GanttChart({
  stages,
  planningStartDate,
  planningEndDate,
  onEditStage,
}: GanttChartProps) {
  const [zoom, setZoom] = useState<'months' | 'weeks'>('months');
  const dayWidth = zoom === 'months' ? 3 : 12;

  // Calcular limites do timeline
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    const dates: Date[] = [];

    if (planningStartDate) dates.push(new Date(planningStartDate));
    if (planningEndDate) dates.push(new Date(planningEndDate));

    stages.forEach((s) => {
      if (s.startDate) dates.push(new Date(s.startDate));
      if (s.endDate) dates.push(new Date(s.endDate));
    });

    if (dates.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = addDays(start, 365);
      return { timelineStart: start, timelineEnd: end, totalDays: 365 };
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Adicionar margem de 1 mes
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: differenceInDays(end, start) + 1,
    };
  }, [stages, planningStartDate, planningEndDate]);

  // Linha de hoje
  const todayOffset = differenceInDays(new Date(), timelineStart);
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;

  const ROW_HEIGHT = 36;
  const SIDEBAR_WIDTH = 220;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-500">{stages.length} etapas</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom('months')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              zoom === 'months' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            Meses
          </button>
          <button
            onClick={() => setZoom('weeks')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              zoom === 'weeks' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            Semanas
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto">
        {/* Sidebar: stage names */}
        <div
          className="flex-shrink-0 border-r border-gray-200 bg-white sticky left-0 z-10"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* Header spacer */}
          <div className="h-8 border-b border-gray-200 flex items-center px-3">
            <span className="text-xs font-medium text-gray-500">Etapa</span>
          </div>

          {stages.map((stage) => (
            <div
              key={stage.id}
              className="border-b border-gray-100 flex items-center px-3 gap-2 cursor-pointer hover:bg-gray-50"
              style={{ height: ROW_HEIGHT }}
              onClick={() => onEditStage(stage)}
            >
              {stage.code && (
                <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                  {stage.code}
                </span>
              )}
              <span className="text-xs text-gray-700 truncate">{stage.name}</span>
            </div>
          ))}
        </div>

        {/* Timeline area */}
        <div className="flex-1 relative overflow-x-auto">
          <GanttTimeline startDate={timelineStart} endDate={timelineEnd} dayWidth={dayWidth} />

          <div className="relative" style={{ width: totalDays * dayWidth }}>
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="border-b border-gray-100"
                style={{ height: ROW_HEIGHT }}
              >
                <GanttBar
                  stage={stage}
                  timelineStart={timelineStart}
                  dayWidth={dayWidth}
                  onClick={() => onEditStage(stage)}
                />
              </div>
            ))}

            {/* Today line */}
            {showTodayLine && (
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{ left: todayOffset * dayWidth }}
              >
                <div className="w-0 h-full border-l-2 border-dashed border-red-500" />
                <div className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded whitespace-nowrap">
                  Hoje
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
