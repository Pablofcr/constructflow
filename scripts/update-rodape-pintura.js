const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateComp(code, newCost, newItems) {
  const comp = await prisma.composition.findUnique({ where: { code } });
  if (!comp) { console.log(code, 'not found - skipping update'); return; }
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
  // Atualizar rodapé poliestireno (remover cantoneira)
  await updateComp('CF-09007', 20.90, [
    { type: 'MATERIAL', description: 'Rodapé poliestireno Santa Luzia 7cm', code: 'INS-00177', unit: 'm', coefficient: 1.05, unitPrice: 12.50 },
    { type: 'MATERIAL', description: 'Adesivo de fixação para rodapé', code: 'INS-00178', unit: 'ml', coefficient: 30.0, unitPrice: 0.08 },
    { type: 'LABOR', description: 'Carpinteiro', code: 'INS-00009', unit: 'h', coefficient: 0.12, unitPrice: 23.80 },
    { type: 'LABOR', description: 'Servente', code: 'INS-00001', unit: 'h', coefficient: 0.06, unitPrice: 18.55 },
  ]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
