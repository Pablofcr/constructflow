'use client';

import { PriceEditor } from './PriceEditor';

interface CompositionItem {
  id: string;
  type: 'MATERIAL' | 'LABOR' | 'EQUIPMENT';
  description: string;
  code: string | null;
  unit: string;
  coefficient: number;
  unitPrice: number;
  totalPrice: number;
}

interface CompositionDetailProps {
  items: CompositionItem[];
  onItemPriceChange?: (itemId: string, newPrice: number) => void;
  onItemPriceReset?: (itemId: string) => void;
  itemOverrides?: Record<string, number>;
  readOnly?: boolean;
}

const typeLabels: Record<string, string> = {
  MATERIAL: 'Materiais',
  LABOR: 'Mao de Obra',
  EQUIPMENT: 'Equipamentos',
};

const typeColors: Record<string, string> = {
  MATERIAL: 'bg-emerald-50 text-emerald-700',
  LABOR: 'bg-blue-50 text-blue-700',
  EQUIPMENT: 'bg-amber-50 text-amber-700',
};

export function CompositionDetail({
  items,
  onItemPriceChange,
  onItemPriceReset,
  itemOverrides = {},
  readOnly = false,
}: CompositionDetailProps) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, CompositionItem[]>);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const totalCost = items.reduce((sum, item) => {
    const overriddenPrice = itemOverrides[item.id];
    const price = overriddenPrice !== undefined ? overriddenPrice : item.unitPrice;
    return sum + item.coefficient * price;
  }, 0);

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
      {(['MATERIAL', 'LABOR', 'EQUIPMENT'] as const).map((type) => {
        const typeItems = grouped[type];
        if (!typeItems?.length) return null;

        return (
          <div key={type}>
            <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${typeColors[type]}`}>
              {typeLabels[type]}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="text-left py-1 font-medium">Insumo</th>
                  <th className="text-center py-1 font-medium w-16">Unid.</th>
                  <th className="text-right py-1 font-medium w-16">Coef.</th>
                  <th className="text-right py-1 font-medium w-28">Preco Unit.</th>
                  <th className="text-right py-1 font-medium w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {typeItems.map((item) => {
                  const overriddenPrice = itemOverrides[item.id];
                  const currentPrice = overriddenPrice !== undefined ? overriddenPrice : item.unitPrice;
                  const itemTotal = item.coefficient * currentPrice;

                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-white/60">
                      <td className="py-1.5 text-gray-700">
                        <span className="text-gray-400 mr-1">{item.code}</span>
                        {item.description}
                      </td>
                      <td className="text-center text-gray-500">{item.unit}</td>
                      <td className="text-right text-gray-600">{item.coefficient.toFixed(4)}</td>
                      <td className="text-right">
                        {readOnly ? (
                          <span className="text-gray-900">{fmt(currentPrice)}</span>
                        ) : onItemPriceChange ? (
                          <PriceEditor
                            currentPrice={currentPrice}
                            sinapiPrice={item.unitPrice}
                            onSave={(newPrice) => onItemPriceChange(item.id, newPrice)}
                            onReset={
                              overriddenPrice !== undefined && onItemPriceReset
                                ? () => onItemPriceReset(item.id)
                                : undefined
                            }
                          />
                        ) : (
                          <span className="text-gray-900">{fmt(currentPrice)}</span>
                        )}
                      </td>
                      <td className="text-right font-medium text-gray-900">{fmt(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="flex justify-end pt-2 border-t border-gray-200">
        <span className="text-sm font-bold text-gray-900">
          Total Composicao: {fmt(totalCost)}
        </span>
      </div>
    </div>
  );
}
