'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { CompositionDetail } from './CompositionDetail';

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

interface ServiceRowProps {
  service: {
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
      items: CompositionItem[];
    } | null;
  };
  onEdit: (serviceId: string) => void;
  onDelete: (serviceId: string) => void;
}

export function ServiceRow({
  service,
  onEdit,
  onDelete,
}: ServiceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasComposition = !!service.composition;

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div
        className={`flex items-center gap-2 py-2.5 px-3 ${hasComposition ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasComposition && setExpanded(!expanded)}
      >
        {hasComposition ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 truncate">{service.description}</p>
          {service.code && (
            <p className="text-xs text-gray-400">{service.code}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm flex-shrink-0">
          <span className="text-gray-500 w-16 text-right">
            {Number(service.quantity).toFixed(2)}
          </span>
          <span className="text-gray-400 w-8 text-center">{service.unit}</span>
          <span className="text-gray-600 w-24 text-right">{fmt(Number(service.unitPrice))}</span>
          <span className="font-semibold text-gray-900 w-28 text-right">
            {fmt(Number(service.totalPrice))}
          </span>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(service.id); }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(service.id); }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {expanded && service.composition && (
        <div className="px-3 pb-3 pl-9">
          <CompositionDetail
            items={service.composition.items.map((i) => ({
              ...i,
              coefficient: Number(i.coefficient),
              unitPrice: Number(i.unitPrice),
              totalPrice: Number(i.totalPrice),
            }))}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
