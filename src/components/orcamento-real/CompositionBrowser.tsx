'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { CompositionDetail } from './CompositionDetail';

interface CompositionResult {
  id: string;
  code: string;
  description: string;
  unit: string;
  unitCost: number;
  stateUnitCost: number;
  category: string | null;
  subcategory: string | null;
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
}

interface CompositionBrowserProps {
  open: boolean;
  state: string;
  onClose: () => void;
  onSelect: (composition: CompositionResult) => void;
}

const CATEGORIES = [
  { value: '', label: 'Todas as etapas' },
  { value: '00', label: '00 - Terreno' },
  { value: '01', label: '01 - Preliminares' },
  { value: '02', label: '02 - Infraestrutura' },
  { value: '03', label: '03 - Supraestrutura' },
  { value: '04', label: '04 - Alvenaria' },
  { value: '05', label: '05 - Cobertura' },
  { value: '06', label: '06 - Impermeabilizacao' },
  { value: '07', label: '07 - Esquadrias' },
  { value: '08', label: '08 - Revestimentos' },
  { value: '09', label: '09 - Fôrros' },
  { value: '10', label: '10 - Pisos' },
  { value: '11', label: '11 - Pintura' },
  { value: '12', label: '12 - Loucas e Metais' },
  { value: '13', label: '13 - Eletrica' },
  { value: '14', label: '14 - Hidrossanitarias' },
  { value: '15', label: '15 - Inst. Especiais' },
  { value: '16', label: '16 - Vidros e Ferragens' },
  { value: '17', label: '17 - Paisagismo' },
  { value: '18', label: '18 - Limpeza Final' },
  { value: '19', label: '19 - Administracao' },
];

export function CompositionBrowser({ open, state, onClose, onSelect }: CompositionBrowserProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [compositions, setCompositions] = useState<CompositionResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchCompositions();
    }
  }, [open, search, category, state]);

  const fetchCompositions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      params.set('state', state);

      const res = await fetch(`/api/compositions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCompositions(data.map((c: CompositionResult) => ({
          ...c,
          unitCost: Number(c.unitCost),
          stateUnitCost: Number(c.stateUnitCost),
          items: c.items.map((i) => ({
            ...i,
            coefficient: Number(i.coefficient),
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          })),
        })));
      }
    } catch (err) {
      console.error('Erro ao buscar composicoes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!open) return null;

  const selected = compositions.find((c) => c.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Composicoes SINAPI</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 p-4 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar composicao..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
            {state}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          ) : compositions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Nenhuma composicao encontrada
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {compositions.map((comp) => (
                <div key={comp.id}>
                  <button
                    onClick={() => setSelectedId(selectedId === comp.id ? null : comp.id)}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedId === comp.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        <span className="text-gray-400 mr-2">{comp.code}</span>
                        {comp.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{comp.subcategory} | {comp.unit}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600 ml-4 flex-shrink-0">
                      {fmt(comp.stateUnitCost)}/{comp.unit}
                    </span>
                  </button>

                  {selectedId === comp.id && (
                    <div className="px-3 pb-3">
                      <CompositionDetail items={comp.items} readOnly />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => onSelect(comp)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Selecionar esta Composicao
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
