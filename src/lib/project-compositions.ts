import { prisma } from '@/lib/prisma';

const STATE_PRICE_FACTORS: Record<string, number> = {
  SP: 1.0,
  RJ: 1.05,
  MG: 0.92,
  BA: 0.88,
  CE: 0.85,
};

/**
 * Initializes project-scoped compositions by copying all global compositions
 * to the project with state-adjusted prices. Idempotent — skips if already initialized.
 */
export async function initializeProjectCompositions(projectId: string, state: string) {
  // Check if already initialized
  const existing = await prisma.projectComposition.findFirst({
    where: { projectId },
    select: { id: true },
  });

  if (existing) return;

  const factor = STATE_PRICE_FACTORS[state] ?? 1.0;

  // Fetch all global compositions with items and state prices
  const compositions = await prisma.composition.findMany({
    include: {
      items: true,
      statePrices: {
        where: { state },
      },
    },
  });

  // Copy in a transaction
  await prisma.$transaction(async (tx) => {
    for (const comp of compositions) {
      // Use state price if available, otherwise apply factor to base price
      const stateUnitCost = comp.statePrices[0]
        ? Number(comp.statePrices[0].unitCost)
        : Number(comp.unitCost) * factor;

      const projComp = await tx.projectComposition.create({
        data: {
          projectId,
          sourceId: comp.id,
          code: comp.code,
          source: comp.source,
          description: comp.description,
          unit: comp.unit,
          unitCost: Math.round(stateUnitCost * 10000) / 10000,
          category: comp.category,
          subcategory: comp.subcategory,
        },
      });

      // Copy items with factor-adjusted prices
      for (const item of comp.items) {
        const adjustedPrice = Number(item.unitPrice) * factor;
        const totalPrice = Number(item.coefficient) * adjustedPrice;

        await tx.projectCompositionItem.create({
          data: {
            projectCompositionId: projComp.id,
            type: item.type,
            description: item.description,
            code: item.code,
            unit: item.unit,
            coefficient: item.coefficient,
            unitPrice: Math.round(adjustedPrice * 10000) / 10000,
            totalPrice: Math.round(totalPrice * 10000) / 10000,
          },
        });
      }
    }
  });
}
