'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Info, Calendar } from 'lucide-react';
import { BudgetOptionCard } from './BudgetOptionCard';

interface BudgetOption {
  available: boolean;
  id?: string;
  name?: string;
  totalCost?: number;
  stageCount?: number;
  status?: string;
  updatedAt?: string;
}

interface BudgetOptions {
  estimated: BudgetOption;
  real: BudgetOption;
  ai: BudgetOption;
}

interface CreatePlanningDialogProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePlanningDialog({ open, projectId, onClose, onCreated }: CreatePlanningDialogProps) {
  const [options, setOptions] = useState<BudgetOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<'ESTIMATED' | 'REAL' | 'AI' | null>(null);
  const [name, setName] = useState('Planejamento da Obra');

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    setSelected(null);
    fetch(`/api/planning/budget-options?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setOptions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, projectId]);

  if (!open) return null;

  const getStageCount = (): number => {
    if (!options || !selected) return 0;
    if (selected === 'ESTIMATED') return 20;
    if (selected === 'REAL') return options.real.stageCount || 0;
    if (selected === 'AI') return options.ai.stageCount || 0;
    return 0;
  };

  const getSelectedBudgetId = () => {
    if (!options || !selected) return {};
    if (selected === 'REAL') return { budgetRealId: options.real.id };
    if (selected === 'AI') return { budgetAIId: options.ai.id };
    return {};
  };

  const handleCreate = async () => {
    if (!selected) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          budgetSourceType: selected,
          ...getSelectedBudgetId(),
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        setError('Erro ao criar planejamento. Tente novamente.');
      }
    } catch {
      setError('Erro de conexao. Verifique sua internet.');
    } finally {
      setCreating(false);
    }
  };

  // Determinar recomendado: real > ai > estimated
  const getRecommended = () => {
    if (options?.real.available) return 'REAL';
    if (options?.ai.available) return 'AI';
    if (options?.estimated.available) return 'ESTIMATED';
    return null;
  };

  const recommended = getRecommended();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Criar Planejamento</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Planejamento da Obra"
            />
          </div>

          {/* Tipo de orçamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vincular ao Orcamento
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : options ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <BudgetOptionCard
                  type="estimated"
                  available={options.estimated.available}
                  selected={selected === 'ESTIMATED'}
                  totalCost={options.estimated.totalCost}
                  label="Estimado"
                  sublabel="Analise de viabilidade"
                  recommended={recommended === 'ESTIMATED'}
                  onClick={() => setSelected('ESTIMATED')}
                />
                <BudgetOptionCard
                  type="real"
                  available={options.real.available}
                  selected={selected === 'REAL'}
                  totalCost={options.real.totalCost}
                  label="Completo"
                  sublabel={options.real.name || 'Orcamento detalhado'}
                  recommended={recommended === 'REAL'}
                  stageCount={options.real.stageCount}
                  onClick={() => setSelected('REAL')}
                />
                <BudgetOptionCard
                  type="ai"
                  available={options.ai.available}
                  selected={selected === 'AI'}
                  totalCost={options.ai.totalCost}
                  label="IA"
                  sublabel="Gerado por inteligencia artificial"
                  recommended={recommended === 'AI'}
                  stageCount={options.ai.stageCount}
                  onClick={() => setSelected('AI')}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">Erro ao carregar orcamentos</p>
            )}
          </div>

          {/* Info box */}
          {selected && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                As {getStageCount()} etapas do orcamento serao importadas automaticamente como
                etapas do planejamento.
              </p>
            </div>
          )}

          {/* Cronograma automático */}
          {selected && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Calendar className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                O cronograma sera gerado automaticamente com base nas datas de inicio e prazo final do projeto, com sobreposicoes realistas entre etapas.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!selected || creating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Planejamento
          </button>
        </div>
      </div>
    </div>
  );
}
