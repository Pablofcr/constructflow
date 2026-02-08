'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { CompositionBrowser } from './CompositionBrowser';

interface ServiceFormDialogProps {
  open: boolean;
  stageId: string;
  state: string;
  onClose: () => void;
  onSave: (data: {
    stageId: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    compositionId: string | null;
    code: string | null;
  }) => void;
  editingService?: {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    compositionId: string | null;
    code: string | null;
  } | null;
}

export function ServiceFormDialog({
  open,
  stageId,
  state,
  onClose,
  onSave,
  editingService,
}: ServiceFormDialogProps) {
  const [mode, setMode] = useState<'sinapi' | 'manual'>(editingService?.compositionId ? 'sinapi' : 'manual');
  const [showBrowser, setShowBrowser] = useState(false);
  const [description, setDescription] = useState(editingService?.description || '');
  const [unit, setUnit] = useState(editingService?.unit || 'm²');
  const [quantity, setQuantity] = useState(editingService?.quantity?.toString() || '');
  const [unitPrice, setUnitPrice] = useState(editingService?.unitPrice?.toString() || '');
  const [compositionId, setCompositionId] = useState<string | null>(editingService?.compositionId || null);
  const [code, setCode] = useState<string | null>(editingService?.code || null);

  if (!open) return null;

  const total = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSubmit = () => {
    if (!description || !unit || !quantity || !unitPrice) return;
    onSave({
      stageId,
      description,
      unit,
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      compositionId,
      code,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              {editingService ? 'Editar Servico' : 'Adicionar Servico'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Selector */}
          {!editingService && (
            <div className="flex p-4 gap-2 border-b border-gray-100">
              <button
                onClick={() => setMode('sinapi')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'sinapi'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                SINAPI
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Manual
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-4">
            {mode === 'sinapi' && !editingService && (
              <button
                onClick={() => setShowBrowser(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Search className="h-4 w-4" />
                {compositionId ? 'Trocar Composicao SINAPI' : 'Buscar Composicao SINAPI'}
              </button>
            )}

            {compositionId && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <span className="text-blue-600 font-medium">{code}</span>
                <span className="text-gray-600 ml-2">{description}</span>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600 block mb-1">Descricao</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descricao do servico"
                readOnly={mode === 'sinapi' && !!compositionId}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Quantidade</label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Unidade</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={mode === 'sinapi' && !!compositionId}
                >
                  {['m²', 'm³', 'm', 'un', 'kg', 'h', 'l', 'conj', 'vb', 'mês'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Preco Unit. (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">{fmt(total)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!description || !quantity || !unitPrice}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {editingService ? 'Salvar Alteracoes' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>

      <CompositionBrowser
        open={showBrowser}
        state={state}
        onClose={() => setShowBrowser(false)}
        onSelect={(comp) => {
          setCompositionId(comp.id);
          setCode(comp.code);
          setDescription(comp.description);
          setUnit(comp.unit);
          setUnitPrice(comp.stateUnitCost.toString());
          setShowBrowser(false);
        }}
      />
    </>
  );
}
