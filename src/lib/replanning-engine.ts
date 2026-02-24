import { prisma } from '@/lib/prisma';
import { addDays, getWorkingDaysInRange, todayUTC } from '@/lib/date-utils';

/**
 * Executes the replanning engine after a day is attested.
 * For each service with deficit:
 *   1. Compute totalExecuted from all DailyLogEntry
 *   2. remaining = 100 - totalExecuted
 *   3. If no working days left → extend service endDate
 *   4. Update service.progressPercent = totalExecuted
 *   5. Cascade: stage.progressPercent → planning.overallProgress
 */
export async function runReplanning(planningId: string) {
  // Get all services with their stages
  const planning = await prisma.planning.findUnique({
    where: { id: planningId },
    include: {
      stages: {
        include: {
          services: true,
        },
      },
    },
  });

  if (!planning) return;

  const today = todayUTC();
  const tomorrow = addDays(today, 1);

  for (const stage of planning.stages) {
    for (const service of stage.services) {
      // Sum all actual percent from daily log entries for this service
      const entries = await prisma.dailyLogEntry.findMany({
        where: { serviceId: service.id },
        select: { actualPercent: true },
      });

      const totalExecuted = entries.reduce(
        (sum, e) => sum + Number(e.actualPercent),
        0
      );

      // Update service progress
      await prisma.planningService.update({
        where: { id: service.id },
        data: {
          progressPercent: Math.min(Math.round(totalExecuted * 100) / 100, 100),
        },
      });

      // If service has deficit and no more working days, extend endDate
      if (service.endDate && totalExecuted < 100) {
        const remaining = 100 - totalExecuted;
        const workingDaysLeft = getWorkingDaysInRange(tomorrow, service.endDate);

        if (workingDaysLeft <= 0 && remaining > 0) {
          // Extend: add enough working days for the remaining at ~10% per day
          const daysNeeded = Math.max(1, Math.ceil(remaining / 10));
          let newEnd = new Date(service.endDate);
          let added = 0;
          while (added < daysNeeded) {
            newEnd = addDays(newEnd, 1);
            const day = newEnd.getUTCDay();
            if (day !== 0 && day !== 6) added++;
          }

          await prisma.planningService.update({
            where: { id: service.id },
            data: { endDate: newEnd },
          });

          // Extend stage endDate if needed
          if (stage.endDate && newEnd > stage.endDate) {
            await prisma.planningStage.update({
              where: { id: stage.id },
              data: { endDate: newEnd },
            });
          }

          // Extend planning endDate if needed
          if (planning.endDate && newEnd > planning.endDate) {
            await prisma.planning.update({
              where: { id: planningId },
              data: { endDate: newEnd },
            });
          }
        }
      }
    }

    // Recalculate stage progress
    const stageServices = await prisma.planningService.findMany({
      where: { stageId: stage.id },
      select: { weight: true, progressPercent: true },
    });

    const totalWeight = stageServices.reduce(
      (sum, s) => sum + Number(s.weight),
      0
    );

    let stageProgress = 0;
    if (totalWeight > 0) {
      stageProgress = stageServices.reduce(
        (sum, s) =>
          sum + (Number(s.progressPercent) * Number(s.weight)) / totalWeight,
        0
      );
    } else if (stageServices.length > 0) {
      stageProgress =
        stageServices.reduce((sum, s) => sum + Number(s.progressPercent), 0) /
        stageServices.length;
    }

    await prisma.planningStage.update({
      where: { id: stage.id },
      data: { progressPercent: Math.round(stageProgress * 100) / 100 },
    });
  }

  // Recalculate overall planning progress
  const allStages = await prisma.planningStage.findMany({
    where: { planningId },
    select: { budgetPercentage: true, progressPercent: true },
  });

  const totalPercentage = allStages.reduce(
    (sum, s) => sum + Number(s.budgetPercentage),
    0
  );

  let overallProgress = 0;
  if (totalPercentage > 0) {
    overallProgress = allStages.reduce(
      (sum, s) =>
        sum +
        (Number(s.progressPercent) * Number(s.budgetPercentage)) /
          totalPercentage,
      0
    );
  } else if (allStages.length > 0) {
    overallProgress =
      allStages.reduce((sum, s) => sum + Number(s.progressPercent), 0) /
      allStages.length;
  }

  await prisma.planning.update({
    where: { id: planningId },
    data: { overallProgress: Math.round(overallProgress * 100) / 100 },
  });
}

/**
 * Calculate the daily target for a service for a given date.
 * = (100 - totalExecutedSoFar) / workingDaysRemaining
 */
export async function calculateDailyTarget(
  serviceId: string,
  serviceEndDate: Date | null,
  targetDate: Date
): Promise<number> {
  // Sum all actual percent already executed
  const entries = await prisma.dailyLogEntry.findMany({
    where: {
      serviceId,
      dailyLog: { status: 'ATTESTED' },
    },
    select: { actualPercent: true },
  });

  const totalExecuted = entries.reduce(
    (sum, e) => sum + Number(e.actualPercent),
    0
  );

  if (totalExecuted >= 100) return 0;

  const remaining = 100 - totalExecuted;

  if (!serviceEndDate) {
    // No end date: default to spread over 20 working days
    return Math.round((remaining / 20) * 10000) / 10000;
  }

  const workingDaysLeft = getWorkingDaysInRange(targetDate, serviceEndDate);

  if (workingDaysLeft <= 0) {
    return remaining; // All remaining in one day
  }

  return Math.round((remaining / workingDaysLeft) * 10000) / 10000;
}
