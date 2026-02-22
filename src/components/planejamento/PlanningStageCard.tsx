'use client';

import { useState } from 'react';
import {
  Circle,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Pencil,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { formatDateBR } from '@/lib/date-utils';

interface Stage {
  id: string;
  planningId: string;
  name: string;
  code: string | null;
  order: number;
  description: string | null;
  budgetCost: number | string;
  budgetPercentage: number | string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  status: string;
  progressPercent: number | string;
  responsibleId: string | null;
  responsibleName: string | null;
  notes: string | null;
}

export interface PlanningService {
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

interface PlanningStageCardProps {
  stage: Stage;
  onEdit: (stage: Stage) => void;
  onEditService: (service: PlanningService) => void;
  planningId: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Circle; label: string; color: string }> = {
  PENDING: { icon: Circle, label: 'Pendente', color: 'text-gray-500 bg-gray-50' },
  IN_PROGRESS: { icon: PlayCircle, label: 'Em Andamento', color: 'text-blue-600 bg-blue-50' },
  COMPLETED: { icon: CheckCircle, label: 'Concluida', color: 'text-green-600 bg-green-50' },
  BLOCKED: { icon: AlertCircle, label: 'Bloqueada', color: 'text-red-600 bg-red-50' },
};

const SVC_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-200',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  BLOCKED: 'bg-red-500',
};

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export function PlanningStageCard({ stage, onEdit, onEditService, planningId }: PlanningStageCardProps) {
  const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = config.icon;
  const progress = Number(stage.progressPercent);

  const [expanded, setExpanded] = useState(false);
  const [services, setServices] = useState<PlanningService[] | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const res = await fetch(
        `/api/planning/${planningId}/services?stageId=${encodeURIComponent(stage.id)}&stageCode=${encodeURIComponent(stage.code || '')}`
      );
      if (res.ok) {
        setServices(await res.json());
      } else {
        setServices([]);
      }
    } catch {
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleToggle = async () => {
    if (!expanded && services === null) {
      await fetchServices();
    }
    setExpanded(!expanded);
  };

  const handleServiceClick = (svc: PlanningService) => {
    onEditService(svc);
  };

  // Allow parent to trigger a refresh after service save
  const refreshServices = () => {
    fetchServices();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={handleToggle}
      >
        {/* Expand icon */}
        <div className="flex-shrink-0 mt-2.5 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {/* Status icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
          <StatusIcon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {stage.code && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded">
                {stage.code}
              </span>
            )}
            <h3 className="text-sm font-semibold text-gray-900 truncate">{stage.name}</h3>
          </div>

          {stage.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">{stage.description}</p>
          )}

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Progresso</span>
              <span className="font-bold text-gray-700">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 flex-wrap">
            {(stage.startDate || stage.endDate) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDateBR(stage.startDate)} — {formatDateBR(stage.endDate)}
                </span>
              </div>
            )}
            {stage.responsibleName && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{stage.responsibleName}</span>
              </div>
            )}
            <span className="text-xs font-medium text-gray-700 ml-auto">
              {formatCurrency(stage.budgetCost)}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(stage);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title="Editar etapa"
        >
          <Pencil className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Expanded services */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {loadingServices ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : services && services.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 pr-3 font-medium">Servico</th>
                    <th className="pb-2 px-3 font-medium text-center">Un.</th>
                    <th className="pb-2 px-3 font-medium text-right">Qtd.</th>
                    <th className="pb-2 px-3 font-medium text-right">Total</th>
                    <th className="pb-2 px-3 font-medium text-center">Status</th>
                    <th className="pb-2 pl-3 font-medium text-right">Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc) => {
                    const svcProgress = Number(svc.progressPercent);
                    return (
                      <tr
                        key={svc.id}
                        className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-blue-50/50 transition-colors"
                        onClick={() => handleServiceClick(svc)}
                      >
                        <td className="py-2 pr-3 text-gray-700">
                          {svc.code && (
                            <span className="text-[10px] font-mono text-gray-400 mr-1.5">
                              {svc.code}
                            </span>
                          )}
                          {svc.description}
                        </td>
                        <td className="py-2 px-3 text-gray-500 text-center">{svc.unit}</td>
                        <td className="py-2 px-3 text-gray-700 text-right">
                          {svc.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                        </td>
                        <td className="py-2 px-3 text-gray-900 font-medium text-right">
                          {formatCurrency(svc.totalPrice)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${SVC_STATUS_COLORS[svc.status] || SVC_STATUS_COLORS.PENDING}`} />
                        </td>
                        <td className="py-2 pl-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${svcProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(svcProgress, 100)}%` }}
                              />
                            </div>
                            <span className="text-gray-600 font-medium w-8 text-right">{svcProgress}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">
              Sem servicos detalhados para esta etapa
            </p>
          )}
        </div>
      )}
    </div>
  );
}
