// ====================================================================
// SEED: Composições SINAPI com preços por estado
// ====================================================================
// Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-sinapi.ts
// Idempotente: pode rodar várias vezes sem duplicar dados

import { PrismaClient } from '@prisma/client';
import { SINAPI_COMPOSITIONS, SUPPORTED_STATES, getStateCost } from '../src/lib/sinapi-data';

const prisma = new PrismaClient();

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

async function seedSinapi() {
  console.log('🔧 Iniciando seed SINAPI...');
  console.log(`📦 ${SINAPI_COMPOSITIONS.length} composições para processar`);
  console.log(`🗺️  Estados: ${SUPPORTED_STATES.join(', ')}`);

  let created = 0;
  let skipped = 0;

  for (const comp of SINAPI_COMPOSITIONS) {
    // Verificar se já existe
    const existing = await prisma.composition.findUnique({
      where: { code: comp.code },
    });

    if (existing) {
      skipped++;
      // Atualizar preços por estado mesmo se composição já existe
      for (const state of SUPPORTED_STATES) {
        const stateCost = comp.fixedPrice ? comp.baseCost : getStateCost(comp.baseCost, state);
        await prisma.sinapiStatePrice.upsert({
          where: {
            compositionId_state: {
              compositionId: existing.id,
              state,
            },
          },
          update: {
            unitCost: stateCost,
            referenceMonth: '2025/01',
          },
          create: {
            compositionId: existing.id,
            state,
            unitCost: stateCost,
            referenceMonth: '2025/01',
          },
        });
      }
      continue;
    }

    // Criar composição
    const compositionId = generateId();

    // Calcular custo total dos itens
    const totalItemsCost = comp.items.reduce(
      (sum, item) => sum + item.coefficient * item.unitPrice,
      0
    );

    await prisma.composition.create({
      data: {
        id: compositionId,
        code: comp.code,
        source: 'SINAPI',
        description: comp.description,
        unit: comp.unit,
        unitCost: comp.baseCost,
        category: comp.category,
        subcategory: comp.subcategory,
        sourceMonth: '2025/01',
      },
    });

    // Criar itens da composição
    for (const item of comp.items) {
      await prisma.compositionItem.create({
        data: {
          id: generateId(),
          compositionId,
          type: item.type,
          description: item.description,
          code: item.code,
          unit: item.unit,
          coefficient: item.coefficient,
          unitPrice: item.unitPrice,
          totalPrice: Math.round(item.coefficient * item.unitPrice * 10000) / 10000,
        },
      });
    }

    // Criar preços por estado
    for (const state of SUPPORTED_STATES) {
      const stateCost = comp.fixedPrice ? comp.baseCost : getStateCost(comp.baseCost, state);
      await prisma.sinapiStatePrice.create({
        data: {
          compositionId,
          state,
          unitCost: stateCost,
          referenceMonth: '2025/01',
        },
      });
    }

    created++;
  }

  console.log(`✅ Seed SINAPI concluído!`);
  console.log(`   📊 Criadas: ${created}`);
  console.log(`   ⏭️  Já existiam: ${skipped}`);
  console.log(`   🗺️  Preços por estado: ${(created + skipped) * SUPPORTED_STATES.length}`);
}

seedSinapi()
  .catch((e) => {
    console.error('❌ Erro no seed SINAPI:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
