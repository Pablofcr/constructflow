// ====================================================================
// PLANNING SCHEDULE - Auto-geração de cronograma com sobreposições
// ====================================================================
// Template expert de engenheiro de planejamento sênior.
// Cada etapa tem início e fim como % do prazo total, permitindo
// sobreposições realistas entre atividades paralelas.

import { addDays, differenceInDays } from './date-utils';

// ====================================================================
// TEMPLATE EXPERT: % do prazo total (início e fim)
// ====================================================================
interface ScheduleTemplate {
  code: string;
  startPct: number;
  endPct: number;
}

const EXPERT_TEMPLATE: ScheduleTemplate[] = [
  { code: '00', startPct: 0,  endPct: 3 },
  { code: '01', startPct: 1,  endPct: 8 },
  { code: '02', startPct: 6,  endPct: 22 },
  { code: '03', startPct: 18, endPct: 42 },
  { code: '04', startPct: 35, endPct: 52 },
  { code: '05', startPct: 45, endPct: 55 },
  { code: '06', startPct: 48, endPct: 58 },
  { code: '07', startPct: 52, endPct: 65 },
  { code: '08', startPct: 55, endPct: 75 },
  { code: '09', startPct: 65, endPct: 76 },
  { code: '10', startPct: 68, endPct: 80 },
  { code: '11', startPct: 75, endPct: 90 },
  { code: '12', startPct: 78, endPct: 88 },
  { code: '13', startPct: 33, endPct: 82 },
  { code: '14', startPct: 33, endPct: 80 },
  { code: '15', startPct: 50, endPct: 82 },
  { code: '16', startPct: 78, endPct: 90 },
  { code: '17', startPct: 88, endPct: 96 },
  { code: '18', startPct: 93, endPct: 99 },
  { code: '19', startPct: 0,  endPct: 100 },
];

const templateMap = new Map(EXPERT_TEMPLATE.map((t) => [t.code, t]));

// ====================================================================
// FUNÇÕES EXPORTADAS
// ====================================================================

export interface StageDates {
  startDate: Date;
  endDate: Date;
  durationDays: number;
}

interface StageInput {
  code: string | null;
  order: number;
}

/**
 * Determina se o template expert deve ser usado.
 * - ESTIMATED: sempre usa (etapas são as 20 padrão)
 * - REAL/AI: usa se ≥80% dos códigos batem com o template
 */
export function shouldUseExpertTemplate(
  budgetSourceType: string,
  stages: StageInput[]
): boolean {
  if (budgetSourceType === 'ESTIMATED') return true;

  const matchCount = stages.filter((s) => s.code && templateMap.has(s.code)).length;
  return stages.length > 0 && matchCount / stages.length >= 0.8;
}

/**
 * Calcula datas de início/fim para cada etapa do planejamento.
 * Retorna um Map<order, StageDates>.
 */
export function computeStageDates(
  stages: StageInput[],
  projectStart: Date,
  projectEnd: Date,
  useExpertTemplate: boolean
): Map<number, StageDates> {
  const totalDays = differenceInDays(projectEnd, projectStart);
  const result = new Map<number, StageDates>();

  if (totalDays <= 0) return result;

  if (useExpertTemplate) {
    for (const stage of stages) {
      const tmpl = stage.code ? templateMap.get(stage.code) : null;
      if (tmpl) {
        const startDay = Math.round((tmpl.startPct / 100) * totalDays);
        const endDay = Math.round((tmpl.endPct / 100) * totalDays);
        const duration = Math.max(1, endDay - startDay);
        result.set(stage.order, {
          startDate: addDays(projectStart, startDay),
          endDate: addDays(projectStart, startDay + duration),
          durationDays: duration,
        });
      } else {
        // Etapa sem código no template: distribuição proporcional pelo order
        const sliceSize = totalDays / stages.length;
        const startDay = Math.round(stage.order * sliceSize);
        const duration = Math.max(1, Math.round(sliceSize));
        result.set(stage.order, {
          startDate: addDays(projectStart, startDay),
          endDate: addDays(projectStart, startDay + duration),
          durationDays: duration,
        });
      }
    }
  } else {
    // Fallback: distribuição sequencial proporcional
    const sliceSize = totalDays / stages.length;
    for (const stage of stages) {
      const startDay = Math.round(stage.order * sliceSize);
      const duration = Math.max(1, Math.round(sliceSize));
      result.set(stage.order, {
        startDate: addDays(projectStart, startDay),
        endDate: addDays(projectStart, startDay + duration),
        durationDays: duration,
      });
    }
  }

  return result;
}
