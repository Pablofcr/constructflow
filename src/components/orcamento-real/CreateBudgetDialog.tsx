'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CreateBudgetDialogProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onCreated: (budgetId: string) => void;
}

export function CreateBudgetDialog({ open, projectId, onClose, onCreated }: CreateBudgetDialogProps) {
  const [name, setName] = useState('Orcamento Real');
  const [bdiPercentage, setBdiPercentage] = useState('25');
  const [durationMonths, setDurationMonths] = useState('12');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/budget-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          bdiPercentage: parseFloat(bdiPercentage) || 25,
          durationMonths: parseInt(durationMonths) || 12,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onCreated(data.id);
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao criar orcamento');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao criar orcamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Criar Orcamento Real</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">BDI (%)</label>
              <input
                type="number"
                step="0.01"
                value={bdiPercentage}
                onChange={(e) => setBdiPercentage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Duracao (meses)</label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            O sistema ira criar automaticamente as 18 etapas padrao da obra e
            carregar os precos SINAPI do estado do projeto.
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar Orcamento
          </button>
        </div>
      </div>
    </div>
  );
}
