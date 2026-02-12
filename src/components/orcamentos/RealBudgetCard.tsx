// ====================================================================
// COMPONENTE: Card de Orçamento Real
// ====================================================================
// Caminho: src/components/orcamentos/RealBudgetCard.tsx

'use client';

import { BudgetReal, BudgetStage } from '@prisma/client';

interface Props {
  budget:
    | (BudgetReal & {
        stages: BudgetStage[];
      })
    | null;
  projectId: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  EXECUTING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels = {
  DRAFT: 'Rascunho',
  IN_REVIEW: 'Em Revisão',
  APPROVED: 'Aprovado',
  EXECUTING: 'Em Execução',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export default function RealBudgetCard({ budget, projectId }: Props) {
  const formatCurrency = (value: number | bigint) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  };

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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Orçamento Completo
            </h2>
            <p className="text-sm text-gray-500">Não cadastrado</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            O orçamento real contém as 18 etapas detalhadas da obra com serviços
            e composições.
          </p>

          <button
            className="block w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
            onClick={() => alert('API de criação será implementada')}
          >
            Criar Orçamento Completo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {budget.name}
            </h2>
            <p className="text-xs text-gray-500">{budget.stages.length} etapas</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            statusColors[budget.status]
          }`}
        >
          {statusLabels[budget.status]}
        </span>
      </div>

      {/* Valor Principal */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatCurrency(Number(budget.totalWithBDI))}
        </div>
        <div className="text-sm text-gray-500">
          Total com BDI ({Number(budget.bdiPercentage)}%)
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Custo Direto</div>
          <div className="text-base font-semibold text-gray-900">
            {formatCurrency(Number(budget.totalDirectCost))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Duração</div>
          <div className="text-base font-semibold text-gray-900">
            {budget.durationMonths || '-'} meses
          </div>
        </div>
      </div>

      {/* Progresso Geral */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progresso Geral</span>
          <span className="font-medium text-gray-900">
            {calculateOverallProgress(budget.stages)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${calculateOverallProgress(budget.stages)}%` }}
          />
        </div>
      </div>

      {/* Etapas em Destaque */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-700 mb-3">
          Primeiras 3 Etapas:
        </div>

        {budget.stages.slice(0, 3).map((stage) => (
          <div
            key={stage.id}
            className="flex items-center justify-between text-sm py-2 hover:bg-white/50 rounded-lg px-2 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500 w-6">
                {stage.code}
              </span>
              <span className="text-gray-700 text-sm font-medium">
                {stage.name}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {Number(stage.percentage)}%
            </span>
          </div>
        ))}

        {budget.stages.length > 3 && (
          <a
            href={`/projetos/${projectId}/orcamento-real/${budget.id}`}
            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
          >
            Ver todas as {budget.stages.length} etapas →
          </a>
        )}
      </div>

      {/* Ações */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <a
          href={`/projetos/${projectId}/orcamento-real/${budget.id}`}
          className="block w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors text-center"
        >
          Ver Detalhes Completos
        </a>
      </div>
    </div>
  );
}

function calculateOverallProgress(stages: BudgetStage[]): number {
  if (stages.length === 0) return 0;

  const totalProgress = stages.reduce(
    (sum, stage) => sum + Number(stage.progressPercent),
    0
  );

  return Math.round(totalProgress / stages.length);
}
