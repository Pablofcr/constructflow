const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateComp(code, newCost, newItems) {
  const comp = await prisma.composition.findUnique({ where: { code } });
  if (!comp) { console.log(code, 'not found'); return; }

  await prisma.composition.update({ where: { code }, data: { unitCost: newCost } });
  await prisma.compositionItem.deleteMany({ where: { compositionId: comp.id } });

  for (const item of newItems) {
    await prisma.compositionItem.create({
      data: {
        id: crypto.randomUUID(),
        compositionId: comp.id,
        ...item,
        totalPrice: Math.round(item.coefficient * item.unitPrice * 10000) / 10000,
      },
    });
  }

  const factors = { SP: 1.0, RJ: 1.05, MG: 0.92, BA: 0.88, CE: 0.85 };
  for (const [state, factor] of Object.entries(factors)) {
    await prisma.sinapiStatePrice.upsert({
      where: { compositionId_state: { compositionId: comp.id, state } },
      update: { unitCost: Math.round(newCost * factor * 100) / 100 },
      create: { compositionId: comp.id, state, unitCost: Math.round(newCost * factor * 100) / 100, referenceMonth: '2025/01' },
    });
  }
  console.log(code, 'atualizada - R$', newCost);
}

async function main() {
  await updateComp('CF-08001', 3.80, [
    { type: 'MATERIAL', description: 'Cimento CP-II', code: 'INS-00011', unit: 'kg', coefficient: 0.8, unitPrice: 0.62 },
    { type: 'MATERIAL', description: 'Cal hidratada', code: 'INS-00027', unit: 'kg', coefficient: 0.5, unitPrice: 0.55 },
    { type: 'MATERIAL', description: 'Areia média', code: 'INS-00012', unit: 'm³', coefficient: 0.002, unitPrice: 95.00 },
    { type: 'LABOR', description: 'Pedreiro', code: 'INS-00005', unit: 'h', coefficient: 0.048, unitPrice: 23.10 },
    { type: 'LABOR', description: 'Servente', code: 'INS-00001', unit: 'h', coefficient: 0.024, unitPrice: 18.55 },
  ]);

  await updateComp('CF-08002', 4.90, [
    { type: 'MATERIAL', description: 'Cimento CP-II', code: 'INS-00011', unit: 'kg', coefficient: 1.0, unitPrice: 0.62 },
    { type: 'MATERIAL', description: 'Cal hidratada', code: 'INS-00027', unit: 'kg', coefficient: 0.6, unitPrice: 0.55 },
    { type: 'MATERIAL', description: 'Areia média', code: 'INS-00012', unit: 'm³', coefficient: 0.003, unitPrice: 95.00 },
    { type: 'LABOR', description: 'Pedreiro', code: 'INS-00005', unit: 'h', coefficient: 0.06, unitPrice: 23.10 },
    { type: 'LABOR', description: 'Servente', code: 'INS-00001', unit: 'h', coefficient: 0.036, unitPrice: 18.55 },
  ]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
