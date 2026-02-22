'use client';

import { eachMonthOfInterval, formatMonthYear, differenceInDays } from '@/lib/date-utils';

interface GanttTimelineProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
}

export function GanttTimeline({ startDate, endDate, dayWidth }: GanttTimelineProps) {
  const months = eachMonthOfInterval(startDate, endDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  return (
    <div className="relative" style={{ width: totalDays * dayWidth, minWidth: '100%' }}>
      {/* Month labels */}
      <div className="flex h-8 border-b border-gray-200">
        {months.map((month, i) => {
          const monthStart = i === 0 ? startDate : month;
          const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
          const monthEnd =
            nextMonth > endDate ? endDate : new Date(nextMonth.getTime() - 86400000);
          const days = differenceInDays(monthEnd, monthStart) + 1;
          const offsetDays = differenceInDays(monthStart, startDate);

          return (
            <div
              key={i}
              className="absolute flex items-center justify-center text-xs font-medium text-gray-600 border-r border-gray-200"
              style={{
                left: offsetDays * dayWidth,
                width: days * dayWidth,
                height: 32,
              }}
            >
              {days * dayWidth > 40 ? formatMonthYear(month) : ''}
            </div>
          );
        })}
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 top-8 pointer-events-none">
        {months.map((month, i) => {
          if (i === 0) return null;
          const offsetDays = differenceInDays(month, startDate);
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-gray-100"
              style={{ left: offsetDays * dayWidth }}
            />
          );
        })}
      </div>
    </div>
  );
}
