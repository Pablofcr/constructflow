/**
 * Migration script: Initialize ProjectCompositions for existing projects
 * and link existing BudgetService records to their project compositions.
 *
 * Run with: npx tsx prisma/migrate-project-compositions.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATE_PRICE_FACTORS: Record<string, number> = {
  SP: 1.0,
  RJ: 1.05,
  MG: 0.92,
  BA: 0.88,
  CE: 0.85,
};

async function main() {
  // 1. Find all projects that have BudgetReal but no ProjectCompositions
  const budgets = await prisma.budgetReal.findMany({
    select: { projectId: true, state: true, project: { select: { enderecoEstado: true } } },
    distinct: ['projectId'],
  });

  console.log(`Found ${budgets.length} projects with budgets`);

  for (const budget of budgets) {
    const projectId = budget.projectId;
    const state = budget.state || budget.project.enderecoEstado || 'SP';

    // Check if already initialized
    const existing = await prisma.projectComposition.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (existing) {
      console.log(`  Project ${projectId}: already has ProjectCompositions, skipping init`);
    } else {
      console.log(`  Project ${projectId}: initializing compositions for state ${state}...`);
      const factor = STATE_PRICE_FACTORS[state] ?? 1.0;

      const compositions = await prisma.composition.findMany({
        include: {
          items: true,
          statePrices: { where: { state } },
        },
      });

      for (const comp of compositions) {
        const stateUnitCost = comp.statePrices[0]
          ? Number(comp.statePrices[0].unitCost)
          : Number(comp.unitCost) * factor;

        const projComp = await prisma.projectComposition.create({
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

        if (comp.items.length > 0) {
          await prisma.projectCompositionItem.createMany({
            data: comp.items.map((item) => {
              const adjustedPrice = Number(item.unitPrice) * factor;
              const totalPrice = Number(item.coefficient) * adjustedPrice;
              return {
                projectCompositionId: projComp.id,
                type: item.type,
                description: item.description,
                code: item.code,
                unit: item.unit,
                coefficient: item.coefficient,
                unitPrice: Math.round(adjustedPrice * 10000) / 10000,
                totalPrice: Math.round(totalPrice * 10000) / 10000,
              };
            }),
          });
        }
      }

      console.log(`    Created ${compositions.length} project compositions`);
    }

    // 2. Link existing BudgetService records to ProjectCompositions
    // Find services with compositionId but no projectCompositionId
    const services = await prisma.budgetService.findMany({
      where: {
        compositionId: { not: null },
        projectCompositionId: null,
        stage: { budgetReal: { projectId } },
      },
      include: {
        composition: { select: { code: true } },
      },
    });

    if (services.length === 0) {
      console.log(`  Project ${projectId}: no services to link`);
      continue;
    }

    console.log(`  Project ${projectId}: linking ${services.length} services...`);

    // Build a map of code -> projectCompositionId
    const projComps = await prisma.projectComposition.findMany({
      where: { projectId },
      select: { id: true, code: true },
    });
    const codeToId = new Map(projComps.map((c) => [c.code, c.id]));

    let linked = 0;
    for (const svc of services) {
      const code = svc.composition?.code;
      if (!code) continue;

      const projCompId = codeToId.get(code);
      if (!projCompId) {
        console.log(`    WARNING: No ProjectComposition found for code ${code}`);
        continue;
      }

      await prisma.budgetService.update({
        where: { id: svc.id },
        data: { projectCompositionId: projCompId },
      });
      linked++;
    }

    console.log(`    Linked ${linked}/${services.length} services`);
  }

  console.log('\nMigration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
