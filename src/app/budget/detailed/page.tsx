'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useProject } from '@/contexts/project-context';
import { StageAccordion } from '@/components/orcamento-real/StageAccordion';
import { ArrowLeft, Loader2, Ruler, TableProperties, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface BudgetDetailedData {
  id: string;
  name: string;
  status: string;
  areaConstruida: number;
  areaTerreno: number;
  padrao: string;
  roomsData: Array<{ name: string; type: string; area: number }>;
  numFloors: number;
  state: string | null;
  totalDirectCost: number;
  itemCount: number | null;
  generatedAt: string | null;
  project: { id: string; codigo: string; name: string; enderecoEstado: string };
  budgetReal: {
    id: string;
    stages: StageData[];
  } | null;
}

interface StageData {
  id: string;
  name: string;
  code: string | null;
  order: number;
  totalCost: number;
  percentage: number;
  services: ServiceData[];
}

interface ServiceData {
  id: string;
  description: string;
  code: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  compositionId: string | null;
  composition: {
    id: string;
    code: string;
    description: string;
    items: Array<{
      id: string;
      type: 'MATERIAL' | 'LABOR' | 'EQUIPMENT';
      description: string;
      code: string | null;
      unit: string;
      coefficient: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  } | null;
  notes: string | null;
}

const PADRAO_LABELS: Record<string, string> = {
  'POPULAR': 'Popular',
  'BAIXO_PADRAO': 'Baixo Padrao',
  'MEDIO_PADRAO': 'Medio Padrao',
  'ALTO_PADRAO': 'Alto Padrao',
};

function DetailedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProject } = useProject();
  const [budget, setBudget] = useState<BudgetDetailedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const budgetId = searchParams?.get('budgetId') ?? null;

  const fetchBudget = useCallback(async () => {
    if (!budgetId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/budget-detailed/${budgetId}`);
      if (res.ok) {
        const data = await res.json();
        setBudget({
          ...data,
          areaConstruida: Number(data.areaConstruida),
          areaTerreno: Number(data.areaTerreno),
          totalDirectCost: Number(data.totalDirectCost),
          budgetReal: data.budgetReal
            ? {
                ...data.budgetReal,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                stages: data.budgetReal.stages.map((s: any) => ({
                  ...s,
                  totalCost: Number(s.totalCost),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  services: s.services.map((svc: any) => ({
                    id: svc.id,
                    description: svc.description,
                    code: svc.code,
                    unit: svc.unit,
                    quantity: Number(svc.quantity),
                    unitPrice: Number(svc.unitPrice),
                    totalPrice: Number(svc.totalPrice),
                    compositionId: svc.projectCompositionId || svc.compositionId || null,
                    composition: svc.projectComposition || svc.composition || null,
                    notes: svc.notes,
                  })),
                })),
              }
            : null,
        });
      }
    } catch (err) {
      console.error('Erro ao buscar orcamento detalhado:', err);
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleDelete = async () => {
    if (!budget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/budget-detailed/${budget.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/budget');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao apagar orcamento');
      }
    } catch {
      alert('Erro de conexao');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-5xl mx-auto p-6">
            <p className="text-gray-500 text-center py-12">Orcamento nao encontrado</p>
          </div>
        </div>
      </div>
    );
  }

  const stages = budget.budgetReal?.stages || [];
  const stagesWithServices = stages.filter((s) => s.services.length > 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-20">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/budget">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Ruler className="h-6 w-6 text-orange-600" />
                Orcamento Detalhado
              </h1>
              <p className="text-sm text-gray-500">{budget.project.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {budget.budgetReal && (
                <Link href={`/api/projects/${budget.project.id}/price-table`}>
                  <button className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium">
                    <TableProperties className="h-4 w-4" />
                    Tabela de Precos
                  </button>
                </Link>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Apagar</span>
              </button>
            </div>
          </div>

          {/* Summary Banner */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-orange-100">Custo Total</p>
                <p className="text-2xl font-bold">{formatCurrency(budget.totalDirectCost)}</p>
              </div>
              <div>
                <p className="text-sm text-orange-100">Area Construida</p>
                <p className="text-xl font-semibold">{budget.areaConstruida} m2</p>
              </div>
              <div>
                <p className="text-sm text-orange-100">Custo/m2</p>
                <p className="text-xl font-semibold">
                  {budget.areaConstruida > 0
                    ? formatCurrency(budget.totalDirectCost / budget.areaConstruida)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-orange-100">Padrao</p>
                <p className="text-xl font-semibold">{PADRAO_LABELS[budget.padrao] || budget.padrao}</p>
              </div>
            </div>
          </div>

          {/* Input Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dados de Entrada</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Area Terreno:</span>
                <span className="ml-1 font-medium">{budget.areaTerreno} m2</span>
              </div>
              <div>
                <span className="text-gray-500">Pavimentos:</span>
                <span className="ml-1 font-medium">{budget.numFloors}</span>
              </div>
              <div>
                <span className="text-gray-500">Estado:</span>
                <span className="ml-1 font-medium">{budget.state || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Itens:</span>
                <span className="ml-1 font-medium">{budget.itemCount || 0} servicos</span>
              </div>
            </div>

            {/* Rooms */}
            {budget.roomsData && budget.roomsData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase mb-2 block">Comodos</span>
                <div className="flex flex-wrap gap-2">
                  {budget.roomsData.map((room, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium"
                    >
                      {room.name} ({room.area}m2)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stages */}
          <div className="space-y-3">
            {stagesWithServices.map((stage) => (
              <StageAccordion
                key={stage.id}
                stage={stage}
                defaultExpanded={false}
              />
            ))}
          </div>

          {stagesWithServices.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Ruler className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum servico gerado</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Apagar Orcamento Detalhado</h3>
                <p className="text-sm text-gray-500">Esta acao nao pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Todas as etapas, servicos e composicoes serao permanentemente removidos.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetailedBudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 md:ml-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
          </div>
        </div>
      }
    >
      <DetailedPageContent />
    </Suspense>
  );
}
