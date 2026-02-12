'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, RotateCcw } from 'lucide-react';
import { PriceEditor } from './PriceEditor';

interface PriceItem {
  id: string;
  code: string | null;
  description: string;
  unit: string;
  type: string;
  unitPrice: number;
  coefficient: number;
  totalPrice: number;
  composition: {
    code: string;
    description: string;
    category: string | null;
  };
}

interface PriceTableProps {
  state: string;
  projectId: string;
}

const TYPE_TABS = [
  { value: '', label: 'Todos' },
  { value: 'MATERIAL', label: 'Materiais' },
  { value: 'LABOR', label: 'Mao de Obra' },
  { value: 'EQUIPMENT', label: 'Equipamentos' },
];

export function PriceTable({ state, projectId }: PriceTableProps) {
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PriceItem[]>([]);

  useEffect(() => {
    fetchItems();
  }, [type, search, state, projectId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (search) params.set('search', search);

      const res = await fetch(`/api/projects/${projectId}/price-table?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(
          data.map((i: PriceItem) => ({
            ...i,
            unitPrice: Number(i.unitPrice),
            coefficient: Number(i.coefficient),
            totalPrice: Number(i.totalPrice),
          }))
        );
      }
    } catch (err) {
      console.error('Erro ao buscar precos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (itemId: string, newPrice: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/compositions/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitPrice: newPrice }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, unitPrice: newPrice } : item
          )
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar preco:', err);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const typeColors: Record<string, string> = {
    MATERIAL: 'bg-emerald-100 text-emerald-700',
    LABOR: 'bg-blue-100 text-blue-700',
    EQUIPMENT: 'bg-amber-100 text-amber-700',
  };

  const typeLabels: Record<string, string> = {
    MATERIAL: 'Material',
    LABOR: 'M. Obra',
    EQUIPMENT: 'Equip.',
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setType(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar insumo por nome ou codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Codigo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Descricao</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 w-16">Tipo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 w-16">Unid.</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 w-32">Preco Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 text-gray-400 font-mono text-xs">{item.code}</td>
                  <td className="py-2.5 px-4 text-gray-800">{item.description}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${typeColors[item.type] || ''}`}>
                      {typeLabels[item.type] || item.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center text-gray-500">{item.unit}</td>
                  <td className="py-2.5 px-4 text-right">
                    <PriceEditor
                      currentPrice={item.unitPrice}
                      sinapiPrice={item.unitPrice}
                      onSave={(newPrice) => handlePriceUpdate(item.id, newPrice)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Nenhum insumo encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
