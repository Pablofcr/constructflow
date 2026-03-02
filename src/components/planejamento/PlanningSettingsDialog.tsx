'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { toInputDate } from '@/lib/date-utils';

interface Planning {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budgetSourceType: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number | string;
  overallProgress: number | string;
}

interface PlanningSettingsDialogProps {
  open: boolean;
  planning: Planning | null;
  onClose: () => void;
  onSave: () => void;
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Rascunho', description: 'Planejamento em elaboracao, pode ser editado livremente.' },
  { value: 'ACTIVE', label: 'Ativo', description: 'Planejamento em execucao. Uma baseline sera criada ao ativar.' },
  { value: 'PAUSED', label: 'Pausado', description: 'Execucao temporariamente suspensa.' },
  { value: 'COMPLETED', label: 'Concluido', description: 'Obra finalizada, planejamento encerrado.' },
  { value: 'CANCELLED', label: 'Cancelado', description: 'Planejamento cancelado permanentemente.' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'border-gray-300 bg-gray-50',
  ACTIVE: 'border-green-300 bg-green-50',
  PAUSED: 'border-yellow-300 bg-yellow-50',
  COMPLETED: 'border-blue-300 bg-blue-50',
  CANCELLED: 'border-red-300 bg-red-50',
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};

export function PlanningSettingsDialog({ open, planning, onClose, onSave }: PlanningSettingsDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (planning) {
      setName(planning.name || '');
      setDescription(planning.description || '');
      setStatus(planning.status || 'DRAFT');
      setStartDate(toInputDate(planning.startDate));
      setEndDate(toInputDate(planning.endDate));
      setError('');
    }
  }, [planning]);

  if (!open || !planning) return null;

  const originalStatus = planning.status;
  const isStatusChange = status !== originalStatus;
  const isActivating = status === 'ACTIVE' && originalStatus === 'DRAFT';
  const isFinalizing = status === 'COMPLETED' || status === 'CANCELLED';

  const handleSave = async () => {
    if (!name.trim()) {
      setError('O nome do planejamento e obrigatorio.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/planning/${planning.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erro ao salvar configuracoes. Tente novamente.');
      }
    } catch {
      setError('Erro de conexao. Verifique sua internet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Configuracoes do Planejamento</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-5">
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

          {/* Descricao */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descricao ou observacoes gerais do planejamento..."
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                const colorClass = STATUS_COLORS[opt.value] || STATUS_COLORS.DRAFT;
                const dotClass = STATUS_DOT[opt.value] || STATUS_DOT.DRAFT;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`w-full text-left rounded-lg border-2 p-3 transition-all ${
                      isSelected
                        ? `${colorClass} ring-1 ring-offset-1 ring-blue-400`
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-[18px]">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warnings */}
          {isActivating && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <AlertTriangle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700">
                Ao ativar o planejamento, uma <strong>baseline</strong> sera criada como referencia.
                Isso permite comparar o planejado com o executado futuramente.
              </p>
            </div>
          )}

          {isFinalizing && isStatusChange && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                {status === 'COMPLETED'
                  ? 'Ao concluir o planejamento, ele sera marcado como finalizado. Voce ainda podera visualizar todos os dados.'
                  : 'Ao cancelar o planejamento, ele sera marcado como cancelado. Esta acao pode ser revertida alterando o status novamente.'}
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
