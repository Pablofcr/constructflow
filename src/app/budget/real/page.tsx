'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useProject } from '@/contexts/project-context';
import { SummaryBanner } from '@/components/orcamento-real/SummaryBanner';
import { BDIConfigCard } from '@/components/orcamento-real/BDIConfigCard';
import { StageAccordion } from '@/components/orcamento-real/StageAccordion';
import { ServiceFormDialog } from '@/components/orcamento-real/ServiceFormDialog';
import { ArrowLeft, Loader2, Save, TableProperties } from 'lucide-react';
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
  itemOverrides: Array<{ id: string; compositionItemId: string; overriddenPrice: number }>;
  compositionOverrides: Array<{ id: string; compositionId: string; overriddenCost: number }>;
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
            services: s.services.map((svc: ServiceData) => ({
              ...svc,
              quantity: Number(svc.quantity),
              unitPrice: Number(svc.unitPrice),
              totalPrice: Number(svc.totalPrice),
              composition: svc.composition
                ? {
                    ...svc.composition,
                    items: svc.composition.items.map((i) => ({
                      ...i,
                      coefficient: Number(i.coefficient),
                      unitPrice: Number(i.unitPrice),
                      totalPrice: Number(i.totalPrice),
                    })),
                  }
                : null,
            })),
          })),
          itemOverrides: (data.itemOverrides || []).map((o: { id: string; compositionItemId: string; overriddenPrice: number }) => ({
            ...o,
            overriddenPrice: Number(o.overriddenPrice),
          })),
          compositionOverrides: (data.compositionOverrides || []).map((o: { id: string; compositionId: string; overriddenCost: number }) => ({
            ...o,
            overriddenCost: Number(o.overriddenCost),
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

  // Build itemOverrides map
  const itemOverridesMap: Record<string, number> = {};
  budget?.itemOverrides.forEach((o) => {
    itemOverridesMap[o.compositionItemId] = o.overriddenPrice;
  });

  const state = budget?.state || budget?.project?.enderecoEstado || 'SP';

  const handleBDISave = async (values: {
    bdiAdministration: number;
    bdiProfit: number;
    bdiTaxes: number;
    bdiRisk: number;
    bdiOthers: number;
    bdiPercentage: number;
  }) => {
    if (!budget) return;
    setSaving(true);
    try {
      await fetch(`/api/budget-real/${budget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      // Recalculate totals
      await fetch(`/api/budget-real/${budget.id}/recalculate`, { method: 'POST' });
      await fetchBudget();
    } catch (err) {
      console.error('Erro ao salvar BDI:', err);
    } finally {
      setSaving(false);
    }
  };

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

  const handleItemPriceChange = async (itemId: string, newPrice: number) => {
    if (!budget) return;
    try {
      await fetch(`/api/budget-real/${budget.id}/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'item', compositionItemId: itemId, price: newPrice }),
      });
      await fetchBudget();
    } catch (err) {
      console.error('Erro ao salvar override:', err);
    }
  };

  const handleItemPriceReset = async (itemId: string) => {
    if (!budget) return;
    const override = budget.itemOverrides.find((o) => o.compositionItemId === itemId);
    if (!override) return;
    try {
      await fetch(`/api/budget-real/${budget.id}/overrides/${override.id}?type=item`, {
        method: 'DELETE',
      });
      await fetchBudget();
    } catch (err) {
      console.error('Erro ao resetar override:', err);
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
                bdiPercentage={budget.bdiPercentage}
                totalWithBDI={budget.totalWithBDI}
                state={state}
              />

              {/* BDI Config */}
              <BDIConfigCard
                bdiAdministration={budget.bdiAdministration}
                bdiProfit={budget.bdiProfit}
                bdiTaxes={budget.bdiTaxes}
                bdiRisk={budget.bdiRisk}
                bdiOthers={budget.bdiOthers}
                bdiPercentage={budget.bdiPercentage}
                onSave={handleBDISave}
              />

              {/* 18 Stages Accordion */}
              <div className="space-y-2">
                {budget.stages.map((stage) => (
                  <StageAccordion
                    key={stage.id}
                    stage={stage}
                    itemOverrides={itemOverridesMap}
                    onAddService={handleAddService}
                    onEditService={handleEditService}
                    onDeleteService={handleDeleteService}
                    onItemPriceChange={handleItemPriceChange}
                    onItemPriceReset={handleItemPriceReset}
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
        onClose={() => setShowServiceForm(false)}
        onSave={handleSaveService}
        editingService={editingService ? {
          id: editingService.id,
          description: editingService.description,
          unit: editingService.unit,
          quantity: editingService.quantity,
          unitPrice: editingService.unitPrice,
          compositionId: editingService.compositionId,
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
