'use client';

import { PlanningStageCard } from './PlanningStageCard';

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
}

export function PlanningStageList({ stages, onEditStage }: PlanningStageListProps) {
  if (stages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Nenhuma etapa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <PlanningStageCard key={stage.id} stage={stage} onEdit={onEditStage} />
      ))}
    </div>
  );
}
