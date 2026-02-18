'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useProject } from '@/contexts/project-context';
import { AIMetadataBanner } from '@/components/orcamento-ai/AIMetadataBanner';
import { ConfidenceBadge } from '@/components/orcamento-ai/ConfidenceBadge';
import { ArrowLeft, Loader2, Sparkles, TableProperties, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { VariablesReview } from '@/components/orcamento-ai/VariablesReview';

interface BudgetAIData {
  id: string;
  name: string;
  state: string | null;
  status: string;
  totalDirectCost: number;
  manuallyEdited: boolean;
  aiModel: string | null;
  aiPromptTokens: number | null;
  aiOutputTokens: number | null;
  aiDurationMs: number | null;
  generatedAt: string | null;
  filesUsed: Array<{ fileName: string; category: string }> | null;
  project: { id: string; codigo: string; name: string; enderecoEstado: string };
  stages: AIStageData[];
}

interface AIStageData {
  id: string;
  name: string;
  code: string | null;
  order: number;
  totalCost: number;
  percentage: number;
  services: AIServiceData[];
}

interface AIServiceData {
  id: string;
  description: string;
  code: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  compositionId: string | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
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

function BudgetAIContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeProject } = useProject();
  const budgetId = searchParams?.get('budgetId') ?? null;

  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<BudgetAIData | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [generatingBudget, setGeneratingBudget] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!budgetId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/budget-ai/${budgetId}`);
      if (res.ok) {
        const data = await res.json();
        setBudget({
          ...data,
          totalDirectCost: Number(data.totalDirectCost),
          stages: data.stages.map((s: AIStageData) => ({
            ...s,
            totalCost: Number(s.totalCost),
            percentage: Number(s.percentage),
            services: s.services.map((svc: AIServiceData) => ({
              ...svc,
              quantity: Number(svc.quantity),
              unitPrice: Number(svc.unitPrice),
              totalPrice: Number(svc.totalPrice),
              aiConfidence: svc.aiConfidence ? Number(svc.aiConfidence) : null,
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
        });
      }
    } catch (err) {
      console.error('Erro ao buscar orcamento IA:', err);
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  // Start polling for status changes (EXTRACTING or GENERATING)
  const startPolling = useCallback((id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/budget-ai/${id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'EXTRACTED' || data.status === 'GENERATED' || data.status === 'FAILED') {
            setGeneratingBudget(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
            fetchBudget();
          }
        }
      } catch {
        // ignore
      }
    }, 3000);
  }, [fetchBudget]);

  useEffect(() => {
    fetchBudget();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchBudget]);

  // Auto-start polling when budget is in a transitional status
  useEffect(() => {
    if (budget && budgetId && (budget.status === 'EXTRACTING' || budget.status === 'GENERATING')) {
      startPolling(budgetId);
    }
  }, [budget?.status, budgetId, startPolling]);

  // Handle "Generate Budget" from variables review
  const handleGenerateFromVariables = async () => {
    if (!budgetId) return;
    try {
      setGeneratingBudget(true);
      const res = await fetch(`/api/budget-ai/${budgetId}/generate`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erro ao gerar orcamento');
        setGeneratingBudget(false);
        return;
      }
      startPolling(budgetId);
    } catch (err) {
      console.error('Erro ao gerar orcamento:', err);
      setGeneratingBudget(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!budgetId) return;
    if (!confirm('Tem certeza que deseja apagar o orcamento por IA? Voce podera gerar um novo depois.')) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/budget-ai/${budgetId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/budget');
      } else {
        alert('Erro ao apagar orcamento IA');
      }
    } catch (err) {
      console.error('Erro ao apagar orcamento IA:', err);
      alert('Erro ao apagar orcamento IA');
    } finally {
      setDeleting(false);
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
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  Orcamento por IA
                </h1>
                <p className="text-sm text-gray-500">{activeProject.codigo} - {activeProject.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {budget && (
                <>
                  <Link
                    href={`/budget/real/prices?state=${budget.state || budget.project?.enderecoEstado || 'SP'}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    <TableProperties className="h-4 w-4" />
                    Tabela de Precos
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Apagar
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
          ) : !budget ? (
            <div className="text-center py-20 text-gray-500">
              Orcamento nao encontrado
            </div>
          ) : budget.status === 'EXTRACTING' || (budget.status === 'GENERATING' && generatingBudget) ? (
            <div className="text-center py-20">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {budget.status === 'EXTRACTING' ? 'Extraindo Variaveis...' : 'Gerando Orcamento...'}
              </h3>
              <p className="text-sm text-gray-500">
                {budget.status === 'EXTRACTING'
                  ? 'A IA esta lendo as medidas dos PDFs. Isso pode levar alguns minutos.'
                  : 'A IA esta gerando o orcamento com as variaveis confirmadas.'}
              </p>
            </div>
          ) : budget.status === 'EXTRACTED' ? (
            <VariablesReview
              budgetAIId={budget.id}
              onGenerateBudget={handleGenerateFromVariables}
              generating={generatingBudget}
            />
          ) : (
            <div className="space-y-4">
              {/* Manually Edited Banner */}
              {budget.manuallyEdited && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Precos ajustados manualmente via tabela de precos do projeto.
                  </p>
                </div>
              )}

              {/* AI Metadata Banner */}
              <AIMetadataBanner
                totalDirectCost={budget.totalDirectCost}
                state={budget.state || undefined}
                aiModel={budget.aiModel}
                aiPromptTokens={budget.aiPromptTokens}
                aiOutputTokens={budget.aiOutputTokens}
                aiDurationMs={budget.aiDurationMs}
                generatedAt={budget.generatedAt}
                filesUsed={budget.filesUsed}
              />

              {/* Stage Accordions */}
              <div className="space-y-2">
                {budget.stages.map((stage) => {
                  const isExpanded = expandedStages.has(stage.id);
                  const serviceCount = stage.services.length;

                  return (
                    <div key={stage.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      {/* Stage Header */}
                      <button
                        onClick={() => toggleStage(stage.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            &#9654;
                          </span>
                          <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            {stage.code}
                          </span>
                          <span className="font-semibold text-gray-800">{stage.name}</span>
                          <span className="text-xs text-gray-400">
                            ({serviceCount} {serviceCount === 1 ? 'servico' : 'servicos'})
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400">{Number(stage.percentage).toFixed(0)}%</span>
                          <span className="text-sm font-bold text-gray-900">{fmt(Number(stage.totalCost))}</span>
                        </div>
                      </button>

                      {/* Stage Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-200">
                          {serviceCount === 0 ? (
                            <div className="text-center py-6 text-sm text-gray-400">
                              Nenhum servico identificado pela IA nesta etapa
                            </div>
                          ) : (
                            <div>
                              {/* Header */}
                              <div className="flex items-center gap-2 py-2 px-3 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50/50">
                                <div className="flex-1">Descricao</div>
                                <div className="w-16 text-right">Qtd.</div>
                                <div className="w-8 text-center">Un.</div>
                                <div className="w-24 text-right">P. Unit.</div>
                                <div className="w-28 text-right">Total</div>
                                <div className="w-16 text-center">Conf.</div>
                              </div>

                              {/* Service Rows */}
                              {stage.services.map((svc) => (
                                <AIServiceRow key={svc.id} service={svc} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIServiceRow({ service }: { service: AIServiceData }) {
  const [showReasoning, setShowReasoning] = useState(false);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2 py-2 px-3 text-sm hover:bg-gray-50">
        <div className="flex-1">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="text-left hover:text-purple-600 transition-colors"
          >
            <span className="font-medium">{service.description}</span>
            {service.code && (
              <span className="ml-2 text-xs text-gray-400 font-mono">{service.code}</span>
            )}
          </button>
        </div>
        <div className="w-16 text-right text-gray-600">
          {Number(service.quantity).toFixed(2)}
        </div>
        <div className="w-8 text-center text-gray-500 text-xs">
          {service.unit}
        </div>
        <div className="w-24 text-right text-gray-600">
          {fmt(Number(service.unitPrice))}
        </div>
        <div className="w-28 text-right font-semibold text-gray-900">
          {fmt(Number(service.totalPrice))}
        </div>
        <div className="w-16 text-center">
          {service.aiConfidence != null && (
            <ConfidenceBadge confidence={Number(service.aiConfidence)} />
          )}
        </div>
      </div>

      {/* AI Reasoning expandable */}
      {showReasoning && service.aiReasoning && (
        <div className="px-6 py-2 bg-purple-50 text-sm text-purple-800 border-t border-purple-100">
          <span className="font-medium">Raciocinio IA: </span>
          {service.aiReasoning}
        </div>
      )}
    </div>
  );
}

export default function BudgetAIPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      }
    >
      <BudgetAIContent />
    </Suspense>
  );
}
