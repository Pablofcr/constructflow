// ====================================================================
// SCRIPT DE TESTE: SEED DAS 18 ETAPAS
// ====================================================================
// Arquivo: scripts/test-seed-etapas.ts
// Uso: npx tsx scripts/test-seed-etapas.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ====================================================================
// ETAPAS PADRÃO (COPIADO DE seed-etapas.ts PARA TESTE STANDALONE)
// ====================================================================
interface DefaultStage {
  name: string;
  code: string;
  order: number;
  percentage: number;
  description?: string;
}

const DEFAULT_STAGES: DefaultStage[] = [
  {
    name: 'Serviços Preliminares',
    code: '01',
    order: 1,
    percentage: 2,
    description: 'Limpeza do terreno, locação da obra, canteiro, tapumes',
  },
  {
    name: 'Infraestrutura',
    code: '02',
    order: 2,
    percentage: 11,
    description: 'Escavação, fundações, baldrames',
  },
  {
    name: 'Supraestrutura',
    code: '03',
    order: 3,
    percentage: 16,
    description: 'Pilares, vigas, lajes, escadas',
  },
  {
    name: 'Alvenaria',
    code: '04',
    order: 4,
    percentage: 8,
    description: 'Elevação de paredes',
  },
  {
    name: 'Cobertura',
    code: '05',
    order: 5,
    percentage: 7,
    description: 'Estrutura, telhamento, calhas',
  },
  {
    name: 'Impermeabilização',
    code: '06',
    order: 6,
    percentage: 3,
    description: 'Impermeabilização de fundações, lajes, banheiros',
  },
  {
    name: 'Esquadrias',
    code: '07',
    order: 7,
    percentage: 6,
    description: 'Portas, janelas, batentes',
  },
  {
    name: 'Revestimentos',
    code: '08',
    order: 8,
    percentage: 10,
    description: 'Chapisco, emboço, reboco, azulejos',
  },
  {
    name: 'Pisos',
    code: '09',
    order: 9,
    percentage: 7,
    description: 'Contrapiso, cerâmica, porcelanato',
  },
  {
    name: 'Pintura',
    code: '10',
    order: 10,
    percentage: 5,
    description: 'Pintura interna e externa',
  },
  {
    name: 'Louças e Metais',
    code: '11',
    order: 11,
    percentage: 3,
    description: 'Bacias, lavatórios, torneiras, registros',
  },
  {
    name: 'Instalações Elétricas',
    code: '12',
    order: 12,
    percentage: 6,
    description: 'Eletrodutos, fios, quadros, tomadas',
  },
  {
    name: 'Instalações Hidrossanitárias',
    code: '13',
    order: 13,
    percentage: 5,
    description: 'Tubulações de água, esgoto, reservatórios',
  },
  {
    name: 'Instalações Especiais',
    code: '14',
    order: 14,
    percentage: 2,
    description: 'SPDA, gás, ar-condicionado, alarme',
  },
  {
    name: 'Vidros e Ferragens',
    code: '15',
    order: 15,
    percentage: 2,
    description: 'Vidros, fechaduras, dobradiças',
  },
  {
    name: 'Paisagismo',
    code: '16',
    order: 16,
    percentage: 1,
    description: 'Jardins, gramados, irrigação',
  },
  {
    name: 'Limpeza Final',
    code: '17',
    order: 17,
    percentage: 1,
    description: 'Limpeza geral, remoção de entulhos',
  },
  {
    name: 'Administração da Obra',
    code: '18',
    order: 18,
    percentage: 5,
    description: 'Engenheiro, mestre, equipamentos de segurança',
  },
];

// ====================================================================
// FUNÇÃO PRINCIPAL
// ====================================================================
async function main() {
  console.log('🚀 TESTE: Criando Orçamento Real com 18 Etapas\n');

  // ---------------------------------------------------------------
  // 1. BUSCAR PROJETO EXISTENTE
  // ---------------------------------------------------------------
  console.log('📋 Buscando projeto existente...');
  
  const project = await prisma.project.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!project) {
    console.log('❌ Nenhum projeto encontrado!');
    console.log('💡 Crie um projeto primeiro pelo app.');
    return;
  }

  console.log(`✅ Projeto encontrado: "${project.name}" (${project.codigo})\n`);

  // ---------------------------------------------------------------
  // 2. CRIAR ORÇAMENTO REAL
  // ---------------------------------------------------------------
  console.log('💰 Criando Orçamento Real...');

  const totalDirectCost = 150000; // R$ 150.000,00
  const bdiPercentage = 25; // 25%
  const totalWithBDI = totalDirectCost * (1 + bdiPercentage / 100);

  const budgetReal = await prisma.budgetReal.create({
    data: {
      projectId: project.id,
      name: 'Orçamento Real - Teste Seed',
      description: 'Orçamento criado automaticamente para teste das 18 etapas',
      totalDirectCost,
      bdiPercentage,
      totalWithBDI,
      status: 'DRAFT',
      durationMonths: 12,
    },
  });

  console.log(`✅ Orçamento criado: ${budgetReal.id}`);
  console.log(`   Custo Direto: R$ ${totalDirectCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`   BDI: ${bdiPercentage}%`);
  console.log(`   Total com BDI: R$ ${totalWithBDI.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`);

  // ---------------------------------------------------------------
  // 3. CRIAR 18 ETAPAS
  // ---------------------------------------------------------------
  console.log('🏗️  Criando 18 etapas padrão...\n');

  const stages = [];

  for (const stage of DEFAULT_STAGES) {
    // Calcular custo da etapa proporcionalmente
    const stageCost = (totalDirectCost * stage.percentage) / 100;

    const created = await prisma.budgetStage.create({
      data: {
        budgetRealId: budgetReal.id,
        name: stage.name,
        code: stage.code,
        order: stage.order,
        description: stage.description,
        percentage: stage.percentage,
        totalCost: stageCost,
        status: 'PENDING',
        progressPercent: 0,
      },
    });

    stages.push(created);
  }

  console.log(`✅ ${stages.length} etapas criadas com sucesso!\n`);

  // ---------------------------------------------------------------
  // 4. MOSTRAR RESUMO
  // ---------------------------------------------------------------
  console.log('📊 RESUMO DAS ETAPAS:');
  console.log('═'.repeat(95));
  console.log(
    '   CÓD │ ETAPA'.padEnd(40) + '│   %   │ VALOR'.padEnd(20) + '│ STATUS'
  );
  console.log('═'.repeat(95));

  let totalPercent = 0;
  let totalCost = 0;

  for (const stage of stages) {
    const cost = Number(stage.totalCost);
    const percent = Number(stage.percentage);

    totalPercent += percent;
    totalCost += cost;

    const line = [
      `    ${stage.code}`,
      stage.name.padEnd(35),
      `${percent.toString().padStart(2)}%`,
      `R$ ${cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)}`,
      stage.status,
    ].join(' │ ');

    console.log(line);
  }

  console.log('═'.repeat(95));
  console.log(
    `  TOTAL │ ${' '.repeat(34)}│ ${totalPercent.toString().padStart(2)}%  │ R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)}`
  );
  console.log('═'.repeat(95));

  // ---------------------------------------------------------------
  // 5. VALIDAÇÕES
  // ---------------------------------------------------------------
  console.log('\n✅ VALIDAÇÕES:');

  const validations = [
    {
      name: 'Soma dos percentuais',
      expected: 100,
      actual: totalPercent,
      passed: totalPercent === 100,
    },
    {
      name: 'Soma dos custos',
      expected: totalDirectCost,
      actual: totalCost,
      passed: Math.abs(totalCost - totalDirectCost) < 0.01,
    },
    {
      name: 'Quantidade de etapas',
      expected: 18,
      actual: stages.length,
      passed: stages.length === 18,
    },
    {
      name: 'Etapas ordenadas',
      expected: 'Sequencial',
      actual: 'OK',
      passed: stages.every((s, i) => s.order === i + 1),
    },
  ];

  for (const v of validations) {
    const icon = v.passed ? '✅' : '❌';
    console.log(
      `${icon} ${v.name}: ${v.actual} ${v.passed ? '==' : '!='} ${v.expected}`
    );
  }

  const allPassed = validations.every((v) => v.passed);

  console.log('\n' + '─'.repeat(95));
  
  if (allPassed) {
    console.log('🎉 SUCESSO! Todas as validações passaram!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Abra o Prisma Studio: npx prisma studio');
    console.log('   2. Navegue até BudgetReal e BudgetStage');
    console.log('   3. Verifique os dados criados');
    console.log(`   4. ID do orçamento: ${budgetReal.id}`);
  } else {
    console.log('⚠️  Algumas validações falharam. Verifique os dados.');
  }

  console.log('─'.repeat(95) + '\n');
}

// ====================================================================
// EXECUTAR
// ====================================================================
main()
  .catch((error) => {
    console.error('❌ ERRO:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
