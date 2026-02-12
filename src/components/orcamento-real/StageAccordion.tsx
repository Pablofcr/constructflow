'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ServiceTable } from './ServiceTable';

interface StageAccordionProps {
  stage: {
    id: string;
    name: string;
    code: string | null;
    order: number;
    totalCost: number;
    percentage: number;
    services: Array<{
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
    }>;
  };
  onAddService?: (stageId: string) => void;
  onEditService?: (serviceId: string) => void;
  onDeleteService?: (serviceId: string) => void;
  defaultExpanded?: boolean;
  readOnly?: boolean;
}

export function StageAccordion({
  stage,
  onAddService,
  onEditService,
  onDeleteService,
  defaultExpanded = false,
  readOnly = false,
}: StageAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const serviceCount = stage.services.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Stage Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
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
      {expanded && (
        <div className="border-t border-gray-200">
          <ServiceTable
            services={stage.services}
            onEditService={onEditService || (() => {})}
            onDeleteService={onDeleteService || (() => {})}
          />

          {!readOnly && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => onAddService?.(stage.id)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar Servico
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
