'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateBR } from '@/lib/date-utils';

interface DailyLogSummary {
  date: string;
  status: string;
}

interface DateNavigatorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  dailyLogs: DailyLogSummary[];
}

export function DateNavigator({
  currentDate,
  onDateChange,
  dailyLogs,
}: DateNavigatorProps) {
  const goToDay = (offset: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const today = new Date().toISOString().split('T')[0];
  const isToday = currentDate === today;

  // Determine day status for visual indicator
  const logForDate = dailyLogs.find((l) => {
    const logDate = new Date(l.date).toISOString().split('T')[0];
    return logDate === currentDate;
  });

  const dayStatus = logForDate?.status || 'NONE';

  const dayOfWeek = new Date(currentDate + 'T12:00:00').toLocaleDateString(
    'pt-BR',
    { weekday: 'long' }
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => goToDay(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                dayStatus === 'ATTESTED'
                  ? 'bg-green-500'
                  : dayStatus === 'OPEN'
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
              }`}
            />
            <span className="text-lg font-bold text-gray-900">
              {formatDateBR(currentDate)}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Hoje
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 capitalize">{dayOfWeek}</p>
          <p className="text-xs mt-1">
            {dayStatus === 'ATTESTED' && (
              <span className="text-green-600 font-medium">Atestado</span>
            )}
            {dayStatus === 'OPEN' && (
              <span className="text-yellow-600 font-medium">Aberto</span>
            )}
            {dayStatus === 'NONE' && (
              <span className="text-gray-400">Sem registro</span>
            )}
          </p>
        </div>

        <button
          onClick={() => goToDay(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <input
          type="date"
          value={currentDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        {!isToday && (
          <button
            onClick={() => onDateChange(today)}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
          >
            Ir para Hoje
          </button>
        )}
      </div>
    </div>
  );
}
