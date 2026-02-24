'use client';

interface DeviationStageCardProps {
  stageName: string;
  expectedProgress: number;
  actualProgress: number;
  deviation: number;
  color: 'green' | 'yellow' | 'red';
}

const COLOR_MAP = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    bar: 'bg-green-500',
    text: 'text-green-700',
    label: 'Em dia',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    bar: 'bg-yellow-500',
    text: 'text-yellow-700',
    label: 'Atencao',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
    text: 'text-red-700',
    label: 'Critico',
  },
};

export function DeviationStageCard({
  stageName,
  expectedProgress,
  actualProgress,
  deviation,
  color,
}: DeviationStageCardProps) {
  const config = COLOR_MAP[color];

  return (
    <div className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
          {stageName}
        </h4>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.text} ${config.bg}`}
        >
          {config.label}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Esperado</span>
            <span className="font-medium text-gray-700">
              {expectedProgress.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full"
              style={{ width: `${Math.min(expectedProgress, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Atual</span>
            <span className={`font-medium ${config.text}`}>
              {actualProgress.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${config.bar}`}
              style={{ width: `${Math.min(actualProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-right">
        <span className={`font-bold ${config.text}`}>
          {deviation > 0 ? '+' : ''}
          {deviation.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
