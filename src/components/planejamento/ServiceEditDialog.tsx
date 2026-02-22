'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toInputDate } from '@/lib/date-utils';

interface PlanningServiceData {
  id: string;
  stageId: string;
  description: string;
  code: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  status: string;
  progressPercent: number;
  notes: string | null;
}

interface ServiceEditDialogProps {
  open: boolean;
  service: PlanningServiceData | null;
  planningId: string;
  onClose: () => void;
  onSave: () => void;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluido' },
  { value: 'BLOCKED', label: 'Bloqueado' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ServiceEditDialog({ open, service, planningId, onClose, onSave }: ServiceEditDialogProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (service) {
      setStartDate(toInputDate(service.startDate));
      setEndDate(toInputDate(service.endDate));
      setStatus(service.status || 'PENDING');
      setProgress(Number(service.progressPercent) || 0);
      setNotes(service.notes || '');
    }
  }, [service]);

  if (!open || !service) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let durationDays: number | null = null;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }

      const res = await fetch(`/api/planning/${planningId}/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate || null,
          endDate: endDate || null,
          durationDays,
          status,
          progressPercent: Number(progress),
          notes: notes || null,
        }),
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        setError('Erro ao salvar servico. Tente novamente.');
      }
    } catch {
      setError('Erro de conexao. Verifique sua internet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900">Editar Servico</h2>
            <p className="text-sm text-gray-500 truncate">
              {service.code && <span className="font-mono mr-1">[{service.code}]</span>}
              {service.description}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0 ml-2">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info card */}
          <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Unidade</p>
              <p className="text-xs font-medium text-gray-700">{service.unit}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Quantidade</p>
              <p className="text-xs font-medium text-gray-700">
                {service.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Total</p>
              <p className="text-xs font-medium text-gray-700">{formatCurrency(service.totalPrice)}</p>
            </div>
          </div>

          {/* Peso */}
          <div className="bg-blue-50 rounded-lg px-3 py-2">
            <p className="text-xs text-blue-600">
              Peso na etapa: <span className="font-bold">{(service.weight * 100).toFixed(1)}%</span>
            </p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Progresso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Progresso: {progress}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Observacoes sobre este servico..."
            />
          </div>
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
