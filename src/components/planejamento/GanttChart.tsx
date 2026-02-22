'use client';

import { useState, useMemo, useCallback } from 'react';
import { GanttTimeline } from './GanttTimeline';
import { GanttBar } from './GanttBar';
import { differenceInDays, addDays, formatDateBR } from '@/lib/date-utils';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import type { PlanningService } from './PlanningStageCard';

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
  onEditService: (service: PlanningService) => void;
  planningId: string;
}

const STATUS_COLORS: Record<string, { bg: string; progress: string }> = {
  PENDING: { bg: 'bg-gray-200 border-gray-300', progress: 'bg-gray-400' },
  IN_PROGRESS: { bg: 'bg-blue-200 border-blue-300', progress: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-green-200 border-green-300', progress: 'bg-green-500' },
  BLOCKED: { bg: 'bg-red-200 border-red-300', progress: 'bg-red-400' },
};

export function GanttChart({
  stages,
  planningStartDate,
  planningEndDate,
  onEditStage,
  onEditService,
  planningId,
}: GanttChartProps) {
  const [zoom, setZoom] = useState<'months' | 'weeks'>('months');
  const dayWidth = zoom === 'months' ? 3 : 12;

  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [servicesCache, setServicesCache] = useState<Map<string, PlanningService[]>>(new Map());
  const [loadingStages, setLoadingStages] = useState<Set<string>>(new Set());

  const fetchServicesForStage = useCallback(async (stage: Stage) => {
    setLoadingStages((prev) => new Set(prev).add(stage.id));
    try {
      const res = await fetch(
        `/api/planning/${planningId}/services?stageId=${encodeURIComponent(stage.id)}&stageCode=${encodeURIComponent(stage.code || '')}`
      );
      const data = res.ok ? await res.json() : [];
      setServicesCache((prev) => new Map(prev).set(stage.id, data));
    } catch {
      setServicesCache((prev) => new Map(prev).set(stage.id, []));
    } finally {
      setLoadingStages((prev) => {
        const next = new Set(prev);
        next.delete(stage.id);
        return next;
      });
    }
  }, [planningId]);

  const toggleExpand = useCallback(async (stage: Stage) => {
    const stageId = stage.id;
    const isExpanded = expandedStages.has(stageId);

    if (isExpanded) {
      setExpandedStages((prev) => {
        const next = new Set(prev);
        next.delete(stageId);
        return next;
      });
      return;
    }

    if (!servicesCache.has(stageId)) {
      await fetchServicesForStage(stage);
    }

    setExpandedStages((prev) => new Set(prev).add(stageId));
  }, [expandedStages, servicesCache, fetchServicesForStage]);

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

    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: differenceInDays(end, start) + 1,
    };
  }, [stages, planningStartDate, planningEndDate]);

  const todayOffset = differenceInDays(new Date(), timelineStart);
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;

  const ROW_HEIGHT = 36;
  const SERVICE_ROW_HEIGHT = 28;
  const SIDEBAR_WIDTH = 220;

  const rows = useMemo(() => {
    const result: Array<
      | { type: 'stage'; stage: Stage }
      | { type: 'service'; service: PlanningService; stageId: string; index: number; parentStartDate: string | null; parentEndDate: string | null; serviceCount: number }
      | { type: 'loading'; stageId: string }
      | { type: 'empty'; stageId: string }
    > = [];

    for (const stage of stages) {
      result.push({ type: 'stage', stage });
      if (expandedStages.has(stage.id)) {
        if (loadingStages.has(stage.id)) {
          result.push({ type: 'loading', stageId: stage.id });
        } else {
          const stageServices = servicesCache.get(stage.id) || [];
          if (stageServices.length === 0) {
            result.push({ type: 'empty', stageId: stage.id });
          } else {
            stageServices.forEach((svc, idx) => {
              result.push({ type: 'service', service: svc, stageId: stage.id, index: idx, parentStartDate: stage.startDate, parentEndDate: stage.endDate, serviceCount: stageServices.length });
            });
          }
        }
      }
    }

    return result;
  }, [stages, expandedStages, servicesCache, loadingStages]);

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
          <div className="h-8 border-b border-gray-200 flex items-center px-3">
            <span className="text-xs font-medium text-gray-500">Etapa</span>
          </div>

          {rows.map((row, i) => {
            if (row.type === 'stage') {
              const isExpanded = expandedStages.has(row.stage.id);
              return (
                <div
                  key={row.stage.id}
                  className="border-b border-gray-100 flex items-center px-2 gap-1.5 cursor-pointer hover:bg-gray-50"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => toggleExpand(row.stage)}
                >
                  <span className="flex-shrink-0 text-gray-400">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                  {row.stage.code && (
                    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                      {row.stage.code}
                    </span>
                  )}
                  <span className="text-xs text-gray-700 truncate">{row.stage.name}</span>
                </div>
              );
            }
            if (row.type === 'service') {
              const svcColors = STATUS_COLORS[row.service.status] || STATUS_COLORS.PENDING;
              return (
                <div
                  key={`${row.stageId}-svc-${row.index}`}
                  className="border-b border-gray-50 flex items-center pl-8 pr-2 cursor-pointer hover:bg-blue-50/50"
                  style={{ height: SERVICE_ROW_HEIGHT }}
                  onClick={() => onEditService(row.service)}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${svcColors.progress}`} />
                  <span className="text-[11px] text-gray-400 truncate">
                    {row.service.code && (
                      <span className="font-mono mr-1">{row.service.code}</span>
                    )}
                    {row.service.description}
                  </span>
                </div>
              );
            }
            if (row.type === 'loading') {
              return (
                <div
                  key={`${row.stageId}-loading`}
                  className="border-b border-gray-50 flex items-center justify-center pl-8 pr-2"
                  style={{ height: SERVICE_ROW_HEIGHT }}
                >
                  <Loader2 className="w-3 h-3 animate-spin text-gray-300" />
                </div>
              );
            }
            return (
              <div
                key={`${row.stageId}-empty`}
                className="border-b border-gray-50 flex items-center pl-8 pr-2"
                style={{ height: SERVICE_ROW_HEIGHT }}
              >
                <span className="text-[11px] text-gray-300 italic">Sem servicos</span>
              </div>
            );
          })}
        </div>

        {/* Timeline area */}
        <div className="flex-1 relative overflow-x-auto">
          <GanttTimeline startDate={timelineStart} endDate={timelineEnd} dayWidth={dayWidth} />

          <div className="relative" style={{ width: totalDays * dayWidth }}>
            {rows.map((row, i) => {
              if (row.type === 'stage') {
                return (
                  <div
                    key={row.stage.id}
                    className="border-b border-gray-100"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <GanttBar
                      stage={row.stage}
                      timelineStart={timelineStart}
                      dayWidth={dayWidth}
                      onClick={() => onEditStage(row.stage)}
                    />
                  </div>
                );
              }
              if (row.type === 'service') {
                // Use service's own dates if set, otherwise slice parent dates
                const svc = row.service;
                const svcProgress = Number(svc.progressPercent);
                const colors = STATUS_COLORS[svc.status] || STATUS_COLORS.PENDING;

                let left = 0;
                let width = 0;
                let hasBar = false;

                if (svc.startDate && svc.endDate) {
                  const svcStart = new Date(svc.startDate);
                  const svcEnd = new Date(svc.endDate);
                  const offsetDays = differenceInDays(svcStart, timelineStart);
                  const duration = differenceInDays(svcEnd, svcStart) + 1;
                  left = Math.max(0, offsetDays * dayWidth);
                  width = Math.max(dayWidth, duration * dayWidth);
                  hasBar = true;
                } else if (row.parentStartDate && row.parentEndDate) {
                  const parentStart = new Date(row.parentStartDate);
                  const parentEnd = new Date(row.parentEndDate);
                  const parentDuration = differenceInDays(parentEnd, parentStart) + 1;
                  const sliceDays = parentDuration / row.serviceCount;
                  const svcStart = Math.round(row.index * sliceDays);
                  const svcDuration = Math.max(1, Math.round(sliceDays));
                  const offsetDays = differenceInDays(parentStart, timelineStart) + svcStart;
                  left = Math.max(0, offsetDays * dayWidth);
                  width = Math.max(dayWidth, svcDuration * dayWidth);
                  hasBar = true;
                }

                if (!hasBar) {
                  return (
                    <div
                      key={`timeline-svc-${row.stageId}-${row.index}`}
                      className="border-b border-gray-50"
                      style={{ height: SERVICE_ROW_HEIGHT }}
                    />
                  );
                }

                return (
                  <div
                    key={`timeline-svc-${row.stageId}-${row.index}`}
                    className="border-b border-gray-50 relative"
                    style={{ height: SERVICE_ROW_HEIGHT }}
                  >
                    <div
                      className={`absolute top-1.5 h-3.5 rounded-sm border cursor-pointer hover:shadow-sm transition-shadow ${colors.bg}`}
                      style={{ left, width }}
                      onClick={() => onEditService(svc)}
                    >
                      {/* Progress overlay */}
                      {svcProgress > 0 && (
                        <div
                          className={`h-full rounded-sm ${colors.progress} opacity-60`}
                          style={{ width: `${Math.min(svcProgress, 100)}%` }}
                        />
                      )}
                      {width > 50 && (
                        <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-medium text-gray-700 truncate pointer-events-none">
                          {svc.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`timeline-${row.type}-${i}`}
                  className="border-b border-gray-50"
                  style={{ height: SERVICE_ROW_HEIGHT }}
                />
              );
            })}

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
