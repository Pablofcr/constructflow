'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useProject } from '@/contexts/project-context';
import { SummaryBanner } from '@/components/orcamento-real/SummaryBanner';
import { StageAccordion } from '@/components/orcamento-real/StageAccordion';
import { ServiceFormDialog } from '@/components/orcamento-real/ServiceFormDialog';
import { ArrowLeft, Loader2, TableProperties } from 'lucide-react';
import Link from 'next/link';

interface BudgetRealData {
  id: string;
  name: string;
  state: string | null;
  status: string;
  totalDirectCost: number;
  bdiPercentage: number;
  totalWithBDI: number;
  bdiAdministration: number;
  bdiProfit: number;
  bdiTaxes: number;
  bdiRisk: number;
  bdiOthers: number;
  project: { id: string; codigo: string; name: string; enderecoEstado: string };
  stages: StageData[];
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
  projectCompositionId: string | null;
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
}

function BudgetRealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProject } = useProject();
  const budgetId = searchParams?.get('budgetId') ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState<BudgetRealData | null>(null);

  // Service form dialog state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string>('');
  const [editingService, setEditingService] = useState<ServiceData | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!budgetId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/budget-real/${budgetId}`);
      if (res.ok) {
        const data = await res.json();
        setBudget({
          ...data,
          totalDirectCost: Number(data.totalDirectCost),
          bdiPercentage: Number(data.bdiPercentage),
          totalWithBDI: Number(data.totalWithBDI),
          bdiAdministration: Number(data.bdiAdministration || 5),
          bdiProfit: Number(data.bdiProfit || 8),
          bdiTaxes: Number(data.bdiTaxes || 8.65),
          bdiRisk: Number(data.bdiRisk || 1.5),
          bdiOthers: Number(data.bdiOthers || 1.85),
          stages: data.stages.map((s: StageData) => ({
            ...s,
            totalCost: Number(s.totalCost),
            percentage: Number(s.percentage),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            services: s.services.map((svc: any) => {
              // Map projectComposition to composition for UI compatibility
              const comp = svc.projectComposition || svc.composition;
              return {
                ...svc,
                quantity: Number(svc.quantity),
                unitPrice: Number(svc.unitPrice),
                totalPrice: Number(svc.totalPrice),
                projectCompositionId: svc.projectCompositionId || null,
                compositionId: svc.compositionId || null,
                composition: comp
                  ? {
                      id: comp.id,
                      code: comp.code,
                      description: comp.description,
                      items: (comp.items || []).map((i: { id: string; type: string; description: string; code: string | null; unit: string; coefficient: number; unitPrice: number; totalPrice: number }) => ({
                        ...i,
                        coefficient: Number(i.coefficient),
                        unitPrice: Number(i.unitPrice),
                        totalPrice: Number(i.totalPrice),
                      })),
                    }
                  : null,
              };
            }),
          })),
        });
      }
    } catch (err) {
      console.error('Erro ao buscar orcamento:', err);
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const state = budget?.state || budget?.project?.enderecoEstado || 'SP';

  const handleAddService = (stageId: string) => {
    setActiveStageId(stageId);
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (serviceId: string) => {
    if (!budget) return;
    for (const stage of budget.stages) {
      const svc = stage.services.find((s) => s.id === serviceId);
      if (svc) {
        setActiveStageId(stage.id);
        setEditingService(svc);
        setShowServiceForm(true);
        return;
      }
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!budget || !confirm('Remover este servico?')) return;
    try {
      await fetch(`/api/budget-real/${budget.id}/services/${serviceId}`, {
        method: 'DELETE',
      });
      await fetchBudget();
    } catch (err) {
      console.error('Erro ao deletar servico:', err);
    }
  };

  const handleSaveService = async (data: {
    stageId: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    compositionId: string | null;
    projectCompositionId: string | null;
    code: string | null;
  }) => {
    if (!budget) return;
    try {
      if (editingService) {
        await fetch(`/api/budget-real/${budget.id}/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch(`/api/budget-real/${budget.id}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      setShowServiceForm(false);
      await fetchBudget();
    } catch (err) {
      console.error('Erro ao salvar servico:', err);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20 flex items-center justify-center">
          <p className="text-gray-500">Selecione um projeto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-20">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/budget" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Orcamento Real
                </h1>
                <p className="text-sm text-gray-500">{activeProject.codigo} - {activeProject.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {budget && (
                <Link
                  href={`/budget/real/prices?budgetId=${budget.id}&state=${state}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  <TableProperties className="h-4 w-4" />
                  Tabela de Precos
                </Link>
              )}
              {saving && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : !budget ? (
            <div className="text-center py-20 text-gray-500">
              Orcamento nao encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <SummaryBanner
                totalDirectCost={budget.totalDirectCost}
                state={state}
              />

              {/* 18 Stages Accordion */}
              <div className="space-y-2">
                {budget.stages.map((stage) => (
                  <StageAccordion
                    key={stage.id}
                    stage={stage}
                    onAddService={handleAddService}
                    onEditService={handleEditService}
                    onDeleteService={handleDeleteService}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Form Dialog */}
      <ServiceFormDialog
        open={showServiceForm}
        stageId={activeStageId}
        state={state}
        projectId={activeProject.id}
        onClose={() => setShowServiceForm(false)}
        onSave={handleSaveService}
        editingService={editingService ? {
          id: editingService.id,
          description: editingService.description,
          unit: editingService.unit,
          quantity: editingService.quantity,
          unitPrice: editingService.unitPrice,
          compositionId: editingService.compositionId,
          projectCompositionId: editingService.projectCompositionId,
          code: editingService.code,
        } : null}
      />
    </div>
  );
}

export default function BudgetRealPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <BudgetRealContent />
    </Suspense>
  );
}
