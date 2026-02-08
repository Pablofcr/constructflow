// ====================================================================
// SCRIPT: LIMPAR DADOS DE TESTE
// ====================================================================
// Arquivo: scripts/cleanup-budget-real.ts
// Uso: npx tsx scripts/cleanup-budget-real.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  LIMPANDO dados de teste do Orçamento Real...\n');

  // Deletar todos os BudgetStage (as etapas)
  const deletedStages = await prisma.budgetStage.deleteMany({});
  console.log(`✅ ${deletedStages.count} etapas deletadas`);

  // Deletar todos os BudgetReal
  const deletedBudgets = await prisma.budgetReal.deleteMany({});
  console.log(`✅ ${deletedBudgets.count} orçamentos deletados`);

  console.log('\n✅ Limpeza concluída! Agora você pode rodar o seed novamente.\n');
}

main()
  .catch((error) => {
    console.error('❌ ERRO:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
