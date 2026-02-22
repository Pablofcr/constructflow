'use client';

import { differenceInDays, formatDateBR } from '@/lib/date-utils';

interface Stage {
  id: string;
  name: string;
  code: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  progressPercent: number | string;
}

interface GanttBarProps {
  stage: Stage;
  timelineStart: Date;
  dayWidth: number;
  onClick: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; progress: string }> = {
  PENDING: { bg: 'bg-gray-300', progress: 'bg-gray-500' },
  IN_PROGRESS: { bg: 'bg-blue-300', progress: 'bg-blue-600' },
  COMPLETED: { bg: 'bg-green-300', progress: 'bg-green-600' },
  BLOCKED: { bg: 'bg-red-300', progress: 'bg-red-500' },
};

export function GanttBar({ stage, timelineStart, dayWidth, onClick }: GanttBarProps) {
  const progress = Number(stage.progressPercent);

  if (!stage.startDate || !stage.endDate) {
    return (
      <div className="h-8 flex items-center">
        <button
          onClick={onClick}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
        >
          Definir datas
        </button>
      </div>
    );
  }

  const start = new Date(stage.startDate);
  const end = new Date(stage.endDate);
  const offsetDays = differenceInDays(start, timelineStart);
  const duration = differenceInDays(end, start) + 1;

  const left = Math.max(0, offsetDays * dayWidth);
  const width = Math.max(dayWidth, duration * dayWidth);

  const colors = STATUS_COLORS[stage.status] || STATUS_COLORS.PENDING;

  return (
    <div className="h-8 relative group" style={{ minWidth: '100%' }}>
      <div
        className={`absolute top-1 h-6 rounded cursor-pointer transition-shadow hover:shadow-md ${colors.bg}`}
        style={{ left, width }}
        onClick={onClick}
      >
        {/* Progress overlay */}
        <div
          className={`h-full rounded-l ${progress >= 100 ? 'rounded-r' : ''} ${colors.progress} opacity-80`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />

        {/* Label (if bar is wide enough) */}
        {width > 60 && (
          <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate pointer-events-none">
            {stage.name}
          </span>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute z-20 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap"
        style={{ left: left + width / 2, top: -36, transform: 'translateX(-50%)' }}>
        <p className="font-medium">{stage.name}</p>
        <p>{formatDateBR(stage.startDate)} — {formatDateBR(stage.endDate)}</p>
      </div>
    </div>
  );
}
