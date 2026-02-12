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
 * Uses batched inserts to avoid transaction timeouts on Supabase/PgBouncer.
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

  // Process in batches to avoid transaction timeouts
  const BATCH_SIZE = 10;

  for (let i = 0; i < compositions.length; i += BATCH_SIZE) {
    const batch = compositions.slice(i, i + BATCH_SIZE);

    for (const comp of batch) {
      // Calculate adjusted item prices first, then derive unitCost from sum
      const adjustedItems = comp.items.map((item) => {
        const adjustedPrice = Number(item.unitPrice) * factor;
        const totalPrice = Number(item.coefficient) * adjustedPrice;
        return {
          type: item.type,
          description: item.description,
          code: item.code,
          unit: item.unit,
          coefficient: item.coefficient,
          unitPrice: Math.round(adjustedPrice * 10000) / 10000,
          totalPrice: Math.round(totalPrice * 10000) / 10000,
        };
      });

      // unitCost = sum of adjusted item totals (single source of truth)
      const calculatedUnitCost = adjustedItems.length > 0
        ? adjustedItems.reduce((sum, i) => sum + i.totalPrice, 0)
        : Number(comp.unitCost) * factor;

      const projComp = await prisma.projectComposition.create({
        data: {
          projectId,
          sourceId: comp.id,
          code: comp.code,
          source: comp.source,
          description: comp.description,
          unit: comp.unit,
          unitCost: Math.round(calculatedUnitCost * 10000) / 10000,
          category: comp.category,
          subcategory: comp.subcategory,
        },
      });

      // Bulk-create items for this composition
      if (adjustedItems.length > 0) {
        await prisma.projectCompositionItem.createMany({
          data: adjustedItems.map((item) => ({
            projectCompositionId: projComp.id,
            ...item,
          })),
        });
      }
    }
  }
}
