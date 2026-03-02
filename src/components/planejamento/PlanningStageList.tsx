'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { PlanningStageCard, type PlanningService } from './PlanningStageCard';
import { SortableStageCard } from './SortableStageCard';

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

interface PlanningStageListProps {
  stages: Stage[];
  onEditStage: (stage: Stage) => void;
  onEditService: (service: PlanningService) => void;
  planningId: string;
  isDndEnabled?: boolean;
  onReorder?: (stageIds: string[]) => void;
}

export function PlanningStageList({
  stages,
  onEditStage,
  onEditService,
  planningId,
  isDndEnabled = false,
  onReorder,
}: PlanningStageListProps) {
  const [localStages, setLocalStages] = useState<Stage[]>(stages);

  // Sync local state when stages prop changes
  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localStages.findIndex((s) => s.id === active.id);
    const newIndex = localStages.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(localStages, oldIndex, newIndex);
    setLocalStages(reordered);
    onReorder?.(reordered.map((s) => s.id));
  };

  if (localStages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Nenhuma etapa encontrada</p>
      </div>
    );
  }

  if (!isDndEnabled) {
    return (
      <div className="space-y-3">
        {localStages.map((stage) => (
          <PlanningStageCard
            key={stage.id}
            stage={stage}
            onEdit={onEditStage}
            onEditService={onEditService}
            planningId={planningId}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localStages.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {localStages.map((stage) => (
            <SortableStageCard
              key={stage.id}
              stage={stage}
              onEdit={onEditStage}
              onEditService={onEditService}
              planningId={planningId}
              isDndEnabled={isDndEnabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
