// ====================================================================
// COMPONENTE: Comparação de Orçamentos
// ====================================================================
// Caminho: src/components/orcamentos/BudgetComparison.tsx
// COMPATÍVEL COM O SCHEMA REAL DO USUÁRIO

'use client';

interface Props {
  estimatedTotal: number;
  realTotal: number;
}

export default function BudgetComparison({ estimatedTotal, realTotal }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const variance = realTotal - estimatedTotal;
  const variancePercent = (variance / estimatedTotal) * 100;
  const isOverBudget = variance > 0;
  const isUnderBudget = variance < 0;
  const isOnBudget = Math.abs(variancePercent) < 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Comparação de Orçamentos
          </h2>
          <p className="text-xs text-gray-500">Estimado vs Completo</p>
        </div>
      </div>

      {/* Visual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Estimado */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2">Estimado (CUB)</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(estimatedTotal)}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gray-400 h-2 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Variação */}
        <div className="text-center flex flex-col items-center justify-center">
          <div className="text-xs text-gray-500 mb-2">Diferença</div>

          {isOnBudget ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  Dentro do orçamento
                </div>
                <div className="text-xs text-gray-500">
                  &lt; 1% de variação
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`text-2xl font-bold mb-1 ${
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isOverBudget ? '+' : ''}
                {variancePercent.toFixed(1)}%
              </div>
              <div
                className={`text-sm font-medium ${
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isOverBudget ? '+' : ''}
                {formatCurrency(Math.abs(variance))}
              </div>
            </div>
          )}
        </div>

        {/* Real */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2">Completo (Detalhado)</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(realTotal)}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                isOverBudget
                  ? 'bg-red-500'
                  : isUnderBudget
                  ? 'bg-green-500'
                  : 'bg-blue-600'
              }`}
              style={{
                width: `${Math.min((realTotal / estimatedTotal) * 100, 150)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <svg
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              isOverBudget
                ? 'text-red-500'
                : isUnderBudget
                ? 'text-green-500'
                : 'text-blue-500'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              {isOverBudget && (
                <>
                  O orçamento completo está{' '}
                  <strong>{variancePercent.toFixed(1)}% acima</strong> do
                  estimado. Isso pode indicar custos adicionais não previstos ou
                  ajustes de escopo.
                </>
              )}
              {isUnderBudget && (
                <>
                  O orçamento completo está{' '}
                  <strong>
                    {Math.abs(variancePercent).toFixed(1)}% abaixo
                  </strong>{' '}
                  do estimado. Isso indica economia ou possível revisão de
                  quantitativos.
                </>
              )}
              {isOnBudget && (
                <>
                  O orçamento completo está{' '}
                  <strong>dentro da margem esperada</strong> (±1%). O
                  planejamento foi preciso.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Breakdown Detalhado */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500 mb-1">Orçamento Estimado</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(estimatedTotal)}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Orçamento Completo</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(realTotal)}
            </div>
          </div>

          <div className="col-span-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Variação Absoluta</div>
            <div
              className={`text-lg font-bold ${
                isOverBudget
                  ? 'text-red-600'
                  : isUnderBudget
                  ? 'text-green-600'
                  : 'text-blue-600'
              }`}
            >
              {isOverBudget ? '+' : ''}
              {formatCurrency(variance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
