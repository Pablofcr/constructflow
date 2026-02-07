import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Verificando banco de dados...')

  // ⚠️ SEGURANÇA: Nunca apagar dados existentes!
  // Apenas insere dados de exemplo se o banco estiver VAZIO
  const existingProjects = await prisma.project.count()

  if (existingProjects > 0) {
    console.log(`✅ Banco já possui ${existingProjects} projeto(s). Nenhuma alteração feita.`)
    console.log('ℹ️  O seed só insere dados quando o banco está completamente vazio.')
    return
  }

  console.log('📋 Banco vazio. Inserindo dados de exemplo...')

  const projects = await prisma.project.createMany({
    data: [
      {
        codigo: 'OBR-2025-0001',
        name: 'Projeto Exemplo 1',
        description: 'Projeto de exemplo criado automaticamente pelo seed.',
        status: 'PLANEJAMENTO',
        tipoObra: 'RESIDENCIAL',
        subtipoResidencial: 'UNIFAMILIAR',
        enderecoRua: 'Rua Exemplo',
        enderecoNumero: '100',
        enderecoBairro: 'Centro',
        enderecoCidade: 'Fortaleza',
        enderecoEstado: 'CE',
        enderecoCEP: '60000-000',
        orcamentoEstimado: 500000.00,
        totalGasto: 0,
        dataInicioEstimada: new Date('2025-06-01'),
        prazoFinal: new Date('2026-06-01'),
      },
    ],
  })

  console.log(`✅ Criado ${projects.count} projeto(s) de exemplo.`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
