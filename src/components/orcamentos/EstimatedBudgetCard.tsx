// ====================================================================
// COMPONENTE: Card de Orçamento Estimado
// ====================================================================
// Caminho: src/components/orcamentos/EstimatedBudgetCard.tsx
// COMPATÍVEL COM O SCHEMA REAL DO USUÁRIO

'use client';

import { BudgetEstimated } from '@prisma/client';

interface Props {
  budget: BudgetEstimated | null;
  projectId: string;
}

export default function EstimatedBudgetCard({ budget, projectId }: Props) {
  if (!budget) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Orçamento Estimado
            </h2>
            <p className="text-sm text-gray-500">Não cadastrado</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            O orçamento estimado é calculado com base no CUB/CUC e análise de viabilidade do projeto.
          </p>

          <a
            href={`/projetos/${projectId}/orcamento-estimado/novo`}
            className="block w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors text-center"
          >
            Criar Orçamento Estimado
          </a>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Orçamento Estimado
            </h2>
            <p className="text-xs text-gray-500">
              {budget.cubSource || 'Baseado no CUB'}
            </p>
          </div>
        </div>

        <a
          href={`/projetos/${projectId}/orcamento-estimado`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Ver detalhes →
        </a>
      </div>

      {/* Valor Principal */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatCurrency(budget.totalEstimatedCost)}
        </div>
        <div className="text-sm text-gray-500">Custo Total Estimado</div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Área Construída</div>
          <div className="text-base font-semibold text-gray-900">
            {budget.constructedArea.toFixed(2)} m²
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">CUB/m²</div>
          <div className="text-base font-semibold text-gray-900">
            {formatCurrency(budget.cubValue)}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Custo do Terreno</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(budget.totalLandCost)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Custo da Construção</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(budget.constructionCost)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-900 font-medium">Total Estimado</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(budget.totalEstimatedCost)}
          </span>
        </div>
      </div>

      {/* Cenário Selecionado */}
      {budget.cenarioSelecionado && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Cenário Selecionado</div>
              <div className="text-sm font-medium text-gray-900">
                {budget.cenarioSelecionado}
              </div>
            </div>
            {budget.valorSelecionado && (
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Valor</div>
                <div className="text-sm font-semibold text-blue-600">
                  {formatCurrency(budget.valorSelecionado)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Observações */}
      {budget.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Observações</div>
          <p className="text-sm text-gray-700 line-clamp-2">
            {budget.notes}
          </p>
        </div>
      )}
    </div>
  );
}
