'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { PlanningStageCard, type PlanningService } from './PlanningStageCard';

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

interface SortableStageCardProps {
  stage: Stage;
  onEdit: (stage: Stage) => void;
  onEditService: (service: PlanningService) => void;
  planningId: string;
  isDndEnabled: boolean;
}

export function SortableStageCard({
  stage,
  onEdit,
  onEditService,
  planningId,
  isDndEnabled,
}: SortableStageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: !isDndEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-stretch">
        {isDndEnabled && (
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            className="flex items-center px-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            aria-label="Arrastar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <PlanningStageCard
            stage={stage}
            onEdit={onEdit}
            onEditService={onEditService}
            planningId={planningId}
          />
        </div>
      </div>
    </div>
  );
}
