import { prisma } from '@/lib/prisma';

/**
 * Creates a frozen baseline snapshot of the current planning state.
 * Called when planning transitions from DRAFT to ACTIVE.
 */
export async function createBaseline(planningId: string) {
  // Check if baseline already exists
  const existing = await prisma.planningBaseline.findUnique({
    where: { planningId },
  });

  if (existing) return existing;

  // Fetch planning with all stages and services
  const planning = await prisma.planning.findUnique({
    where: { id: planningId },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: {
          services: true,
        },
      },
    },
  });

  if (!planning) throw new Error('Planning not found');

  // Create baseline with nested stages and services
  const baseline = await prisma.planningBaseline.create({
    data: {
      planningId,
      startDate: planning.startDate,
      endDate: planning.endDate,
      totalBudget: planning.totalBudget,
      stages: {
        create: planning.stages.map((stage) => ({
          originalStageId: stage.id,
          name: stage.name,
          code: stage.code,
          order: stage.order,
          budgetCost: stage.budgetCost,
          budgetPercentage: stage.budgetPercentage,
          startDate: stage.startDate,
          endDate: stage.endDate,
          durationDays: stage.durationDays,
          services: {
            create: stage.services.map((svc) => ({
              originalServiceId: svc.id,
              description: svc.description,
              code: svc.code,
              unit: svc.unit,
              quantity: svc.quantity,
              unitPrice: svc.unitPrice,
              totalPrice: svc.totalPrice,
              weight: svc.weight,
              startDate: svc.startDate,
              endDate: svc.endDate,
              durationDays: svc.durationDays,
            })),
          },
        })),
      },
    },
    include: {
      stages: {
        include: { services: true },
      },
    },
  });

  return baseline;
}
