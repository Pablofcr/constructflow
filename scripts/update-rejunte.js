const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateComp(code, newCost, newItems) {
  const comp = await prisma.composition.findUnique({ where: { code } });
  if (!comp) { console.log(code, 'not found'); return; }
  await prisma.composition.update({ where: { code }, data: { unitCost: newCost } });
  await prisma.compositionItem.deleteMany({ where: { compositionId: comp.id } });
  for (const item of newItems) {
    await prisma.compositionItem.create({
      data: { id: crypto.randomUUID(), compositionId: comp.id, ...item, totalPrice: Math.round(item.coefficient * item.unitPrice * 10000) / 10000 },
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
  await updateComp('CF-08004', 8.90, [
    { type: 'MATERIAL', description: 'Rejunte cimentício', code: 'INS-00059', unit: 'kg', coefficient: 0.8, unitPrice: 5.80 },
    { type: 'MATERIAL', description: 'Esponja para rejunte', code: 'INS-00167', unit: 'un', coefficient: 0.1, unitPrice: 8.00 },
    { type: 'LABOR', description: 'Servente', code: 'INS-00001', unit: 'h', coefficient: 0.2, unitPrice: 18.55 },
  ]);

  await updateComp('CF-09005', 8.60, [
    { type: 'MATERIAL', description: 'Rejunte cimentício', code: 'INS-00059', unit: 'kg', coefficient: 0.7, unitPrice: 5.80 },
    { type: 'MATERIAL', description: 'Esponja para rejunte', code: 'INS-00167', unit: 'un', coefficient: 0.1, unitPrice: 8.00 },
    { type: 'LABOR', description: 'Servente', code: 'INS-00001', unit: 'h', coefficient: 0.2, unitPrice: 18.55 },
  ]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
