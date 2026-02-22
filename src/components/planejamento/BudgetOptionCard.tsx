'use client';

import { Check } from 'lucide-react';

interface BudgetOptionCardProps {
  type: 'estimated' | 'real' | 'ai';
  available: boolean;
  selected: boolean;
  totalCost?: number;
  label: string;
  sublabel?: string;
  recommended?: boolean;
  stageCount?: number;
  onClick: () => void;
}

const TYPE_COLORS = {
  estimated: { bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', hover: 'hover:bg-blue-50 hover:border-blue-200' },
  real: { bg: 'bg-green-50', border: 'border-green-200', ring: 'ring-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800', hover: 'hover:bg-green-50 hover:border-green-200' },
  ai: { bg: 'bg-purple-50', border: 'border-purple-200', ring: 'ring-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', hover: 'hover:bg-purple-50 hover:border-purple-200' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function BudgetOptionCard({
  type,
  available,
  selected,
  totalCost,
  label,
  sublabel,
  recommended,
  stageCount,
  onClick,
}: BudgetOptionCardProps) {
  const colors = TYPE_COLORS[type];

  if (!available) {
    return (
      <div className="relative rounded-xl border-2 border-gray-200 bg-gray-100 p-4 opacity-60 cursor-not-allowed">
        <h3 className="text-sm font-semibold text-gray-500">{label}</h3>
        {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
        <p className="text-xs text-gray-400 mt-3 font-medium">Indisponivel</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border-2 p-4 text-left transition-all w-full ${
        selected
          ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}`
          : `bg-white border-gray-200 ${colors.hover}`
      }`}
    >
      {recommended && (
        <span className="absolute -top-2 right-3 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
          Recomendado
        </span>
      )}
      {selected && (
        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${colors.badge} flex items-center justify-center`}>
          <Check className="w-3 h-3" />
        </div>
      )}
      <h3 className={`text-sm font-semibold ${selected ? colors.text : 'text-gray-900'}`}>
        {label}
      </h3>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
      {totalCost !== undefined && totalCost > 0 && (
        <p className={`text-base font-bold mt-2 ${colors.text}`}>{formatCurrency(totalCost)}</p>
      )}
      {stageCount !== undefined && stageCount > 0 && (
        <p className="text-xs text-gray-500 mt-1">{stageCount} etapas</p>
      )}
    </button>
  );
}
