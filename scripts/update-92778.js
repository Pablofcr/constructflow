const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update the composition description and cost
  const comp = await prisma.composition.findUnique({ where: { code: 'SINAPI-92778' } });
  if (!comp) { console.log('Composition not found'); return; }

  await prisma.composition.update({
    where: { code: 'SINAPI-92778' },
    data: {
      description: 'Laje pré-moldada com tavela cerâmica, tijolo H8, concreto FCK=30MPa, e=12cm',
      unitCost: 115.00,
    },
  });

  // Delete old items and recreate
  await prisma.compositionItem.deleteMany({ where: { compositionId: comp.id } });

  const items = [
    { type: 'MATERIAL', description: 'Vigota pré-moldada', code: 'INS-00022', unit: 'm', coefficient: 2.5, unitPrice: 8.50 },
    { type: 'MATERIAL', description: 'Tavela cerâmica', code: 'INS-00023', unit: 'un', coefficient: 8.0, unitPrice: 2.80 },
    { type: 'MATERIAL', description: 'Tijolo cerâmico H8 (lajota)', code: 'INS-00173', unit: 'un', coefficient: 5.0, unitPrice: 1.65 },
    { type: 'MATERIAL', description: 'Concreto usinado FCK 30MPa', code: 'INS-00145', unit: 'm³', coefficient: 0.04, unitPrice: 510.00 },
    { type: 'MATERIAL', description: 'Aço CA-50 10mm', code: 'INS-00017', unit: 'kg', coefficient: 2.8, unitPrice: 6.20 },
    { type: 'LABOR', description: 'Pedreiro', code: 'INS-00005', unit: 'h', coefficient: 0.55, unitPrice: 23.10 },
    { type: 'LABOR', description: 'Servente', code: 'INS-00001', unit: 'h', coefficient: 0.9, unitPrice: 18.55 },
  ];

  for (const item of items) {
    await prisma.compositionItem.create({
      data: {
        id: crypto.randomUUID(),
        compositionId: comp.id,
        ...item,
        totalPrice: Math.round(item.coefficient * item.unitPrice * 10000) / 10000,
      },
    });
  }

  // Update state prices
  const states = ['CE', 'SP', 'RJ', 'MG', 'BA'];
  const factors = { SP: 1.0, RJ: 1.05, MG: 0.92, BA: 0.88, CE: 0.85 };
  for (const state of states) {
    await prisma.sinapiStatePrice.upsert({
      where: { compositionId_state: { compositionId: comp.id, state } },
      update: { unitCost: Math.round(115.00 * factors[state] * 100) / 100 },
      create: { compositionId: comp.id, state, unitCost: Math.round(115.00 * factors[state] * 100) / 100, referenceMonth: '2025/01' },
    });
  }

  console.log('SINAPI-92778 atualizada: Laje pré-moldada com tavela cerâmica, tijolo H8, FCK=30MPa');
}

main().catch(console.error).finally(() => prisma.$disconnect());
