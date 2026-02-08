const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comp = await prisma.composition.findUnique({ where: { code: 'SINAPI-88489' } });
  if (!comp) { console.log('Not found'); return; }

  await prisma.composition.update({ where: { code: 'SINAPI-88489' }, data: { description: 'Pintura PVA látex 2 demãos, sobre parede já preparada', unitCost: 12.00 } });
  await prisma.compositionItem.deleteMany({ where: { compositionId: comp.id } });

  const items = [
    { type: 'MATERIAL', description: 'Tinta PVA látex', code: 'INS-00067', unit: 'l', coefficient: 0.25, unitPrice: 18.00 },
    { type: 'LABOR', description: 'Pintor', code: 'INS-00070', unit: 'h', coefficient: 0.3, unitPrice: 23.00 },
    { type: 'LABOR', description: 'Servente', code: 'INS-00001', unit: 'h', coefficient: 0.1, unitPrice: 18.55 },
  ];

  for (const item of items) {
    await prisma.compositionItem.create({
      data: { id: crypto.randomUUID(), compositionId: comp.id, ...item, totalPrice: Math.round(item.coefficient * item.unitPrice * 10000) / 10000 },
    });
  }

  const factors = { SP: 1.0, RJ: 1.05, MG: 0.92, BA: 0.88, CE: 0.85 };
  for (const [state, factor] of Object.entries(factors)) {
    await prisma.sinapiStatePrice.upsert({
      where: { compositionId_state: { compositionId: comp.id, state } },
      update: { unitCost: Math.round(12.00 * factor * 100) / 100 },
      create: { compositionId: comp.id, state, unitCost: Math.round(12.00 * factor * 100) / 100, referenceMonth: '2025/01' },
    });
  }

  console.log('SINAPI-88489 atualizada - Pintura PVA látex 2 demãos (sem massa/lixa) - R$ 12.00');
}

main().catch(console.error).finally(() => prisma.$disconnect());
