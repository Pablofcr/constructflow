'use client';

interface SummaryBannerProps {
  totalDirectCost: number;
  bdiPercentage: number;
  totalWithBDI: number;
  state?: string;
}

export function SummaryBanner({ totalDirectCost, bdiPercentage, totalWithBDI, state }: SummaryBannerProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-blue-200 text-sm mb-1">Custo Direto</p>
          <p className="text-2xl md:text-3xl font-bold">{fmt(totalDirectCost)}</p>
        </div>
        <div className="text-center">
          <p className="text-blue-200 text-sm mb-1">BDI</p>
          <p className="text-2xl md:text-3xl font-bold">{bdiPercentage.toFixed(2)}%</p>
        </div>
        <div className="text-right">
          <p className="text-blue-200 text-sm mb-1">Total com BDI</p>
          <p className="text-2xl md:text-3xl font-bold">{fmt(totalWithBDI)}</p>
        </div>
      </div>
      {state && (
        <p className="text-blue-200 text-xs mt-3 text-right">
          Referência SINAPI: {state}
        </p>
      )}
    </div>
  );
}
