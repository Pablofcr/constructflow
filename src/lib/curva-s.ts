import { prisma } from '@/lib/prisma';
import {
  eachDayOfInterval,
  getWorkingDaysInRange,
  formatDateISO,
  todayUTC,
} from '@/lib/date-utils';

export interface SCurveData {
  dates: string[];
  baseline: number[];
  replanned: number[];
  executed: (number | null)[];
}

/**
 * Generates S-Curve data with three lines:
 * - Baseline (blue): linear accumulated progress from frozen baseline
 * - Executed (green): actual accumulated progress from daily logs
 * - Replanned (yellow): executed until today, then projected forward
 */
export async function generateSCurveData(
  planningId: string
): Promise<SCurveData> {
  const planning = await prisma.planning.findUnique({
    where: { id: planningId },
    include: {
      baseline: {
        include: {
          stages: { include: { services: true } },
        },
      },
      stages: {
        include: { services: true },
      },
      dailyLogs: {
        where: { status: 'ATTESTED' },
        include: { entries: true },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!planning || !planning.startDate || !planning.endDate) {
    return { dates: [], baseline: [], replanned: [], executed: [] };
  }

  const start = new Date(planning.startDate);
  const end = new Date(planning.endDate);
  const today = todayUTC();

  const allDays = eachDayOfInterval(start, end);
  const dates = allDays.map((d) => formatDateISO(d));

  // ========================================================================
  // BASELINE LINE: linear progress based on frozen baseline
  // ========================================================================
  const baseline: number[] = [];

  if (planning.baseline) {
    const baselineServices = planning.baseline.stages.flatMap((s) =>
      s.services.map((svc) => ({
        ...svc,
        stageBudgetPercentage: Number(s.budgetPercentage),
      }))
    );

    const totalBudgetPct = planning.baseline.stages.reduce(
      (sum, s) => sum + Number(s.budgetPercentage),
      0
    );

    for (const day of allDays) {
      let dayProgress = 0;

      for (const svc of baselineServices) {
        if (!svc.startDate || !svc.endDate) continue;

        const svcStart = new Date(svc.startDate);
        const svcEnd = new Date(svc.endDate);

        if (day < svcStart) continue;

        const totalWorkDays = getWorkingDaysInRange(svcStart, svcEnd);
        if (totalWorkDays <= 0) continue;

        let elapsedWork = 0;
        if (day >= svcEnd) {
          elapsedWork = totalWorkDays;
        } else {
          elapsedWork = getWorkingDaysInRange(svcStart, day);
        }

        const svcProgress = Math.min((elapsedWork / totalWorkDays) * 100, 100);
        const weight = Number(svc.weight) || 1 / (baselineServices.length || 1);
        const stageWeight =
          totalBudgetPct > 0
            ? svc.stageBudgetPercentage / totalBudgetPct
            : 1 / (planning.baseline!.stages.length || 1);

        dayProgress += (svcProgress * weight * stageWeight);
      }

      baseline.push(Math.round(dayProgress * 100) / 100);
    }
  } else {
    // No baseline: fill with zeros
    for (let i = 0; i < allDays.length; i++) baseline.push(0);
  }

  // ========================================================================
  // EXECUTED LINE: accumulated actual progress from attested daily logs
  // ========================================================================
  const executed: (number | null)[] = [];

  // Build a map of date -> total weighted executed progress
  // Weight each service's actualPercent by its contribution to overall progress
  const currentServices = planning.stages.flatMap((s) =>
    s.services.map((svc) => ({
      id: svc.id,
      weight: Number(svc.weight),
      stageBudgetPercentage: Number(s.budgetPercentage),
    }))
  );

  const totalBudgetPctCurrent = planning.stages.reduce(
    (sum, s) => sum + Number(s.budgetPercentage),
    0
  );

  // Map serviceId → accumulated actual percent by date
  const serviceAccumulated: Record<string, number> = {};

  // Sort daily logs by date
  const sortedLogs = [...planning.dailyLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Build date → entries map
  const dateEntriesMap: Record<string, typeof planning.dailyLogs[0]['entries']> = {};
  for (const log of sortedLogs) {
    const dateKey = formatDateISO(new Date(log.date));
    dateEntriesMap[dateKey] = log.entries;
  }

  let lastExecutedValue: number | null = null;

  for (const day of allDays) {
    const dateKey = formatDateISO(day);
    const entries = dateEntriesMap[dateKey];

    if (entries) {
      // Update accumulated values
      for (const entry of entries) {
        if (!serviceAccumulated[entry.serviceId]) {
          serviceAccumulated[entry.serviceId] = 0;
        }
        serviceAccumulated[entry.serviceId] += Number(entry.actualPercent);
      }
    }

    if (day <= today) {
      // Calculate weighted overall progress from accumulated
      let totalProgress = 0;
      for (const svc of currentServices) {
        const accum = serviceAccumulated[svc.id] || 0;
        const stageWeight =
          totalBudgetPctCurrent > 0
            ? svc.stageBudgetPercentage / totalBudgetPctCurrent
            : 1 / (planning.stages.length || 1);
        const svcWeight = svc.weight || 1 / (currentServices.length || 1);
        totalProgress += (accum * svcWeight * stageWeight);
      }

      lastExecutedValue = Math.round(totalProgress * 100) / 100;
      executed.push(lastExecutedValue);
    } else {
      executed.push(null);
    }
  }

  // ========================================================================
  // REPLANNED LINE: executed up to today, then projected forward
  // ========================================================================
  const replanned: number[] = [];

  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];

    if (day <= today && executed[i] !== null) {
      replanned.push(executed[i]!);
    } else if (day > today) {
      // Project forward: linear interpolation from last executed to 100% at end
      if (lastExecutedValue === null) lastExecutedValue = 0;

      const daysFromToday = allDays.filter(
        (d) => d > today && d <= end
      ).length;
      const dayIndex = allDays.filter(
        (d) => d > today && d <= day
      ).length;

      if (daysFromToday > 0) {
        const projected =
          lastExecutedValue +
          ((100 - lastExecutedValue) * dayIndex) / daysFromToday;
        replanned.push(Math.round(projected * 100) / 100);
      } else {
        replanned.push(lastExecutedValue);
      }
    } else {
      replanned.push(0);
    }
  }

  return { dates, baseline, replanned, executed };
}
