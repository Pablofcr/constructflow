'use client';

interface SummaryBannerProps {
  totalDirectCost: number;
  state?: string;
}

export function SummaryBanner({ totalDirectCost, state }: SummaryBannerProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-sm mb-1">Custo Total do Orçamento</p>
          <p className="text-2xl md:text-3xl font-bold">{fmt(totalDirectCost)}</p>
        </div>
        {state && (
          <p className="text-blue-200 text-sm">
            Referência SINAPI: {state}
          </p>
        )}
      </div>
    </div>
  );
}
