'use client';

import { ServiceRow } from './ServiceRow';

interface ServiceTableProps {
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
  itemOverrides?: Record<string, number>;
  onEditService: (serviceId: string) => void;
  onDeleteService: (serviceId: string) => void;
  onItemPriceChange?: (itemId: string, newPrice: number) => void;
  onItemPriceReset?: (itemId: string) => void;
}

export function ServiceTable({
  services,
  itemOverrides = {},
  onEditService,
  onDeleteService,
  onItemPriceChange,
  onItemPriceReset,
}: ServiceTableProps) {
  if (!services.length) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        Nenhum servico adicionado nesta etapa
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 py-2 px-3 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50/50">
        <div className="w-4" />
        <div className="flex-1">Descricao</div>
        <div className="w-16 text-right">Qtd.</div>
        <div className="w-8 text-center">Un.</div>
        <div className="w-24 text-right">P. Unit.</div>
        <div className="w-28 text-right">Total</div>
        <div className="w-16" />
      </div>

      {/* Rows */}
      {services.map((service) => (
        <ServiceRow
          key={service.id}
          service={service}
          itemOverrides={itemOverrides}
          onEdit={onEditService}
          onDelete={onDeleteService}
          onItemPriceChange={onItemPriceChange}
          onItemPriceReset={onItemPriceReset}
        />
      ))}
    </div>
  );
}
