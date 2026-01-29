import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes
  console.log('🗑️  Limpando dados antigos...')
  await prisma.project.deleteMany()
  
  console.log('✅ Dados limpos!')

  // Criar projetos com TODOS os novos campos
  console.log('🏗️  Criando projetos...')

  const projects = await prisma.project.createMany({
    data: [
      {
        codigo: 'OBR-2025-0001',
        name: 'Residencial Vila Madalena',
        description: 'Conjunto residencial de alto padrão com 24 unidades, área de lazer completa e acabamento premium.',
        status: 'EM_EXECUCAO',
        tipoObra: 'RESIDENCIAL',
        subtipoResidencial: 'MULTIFAMILIAR',
        
        // Endereço completo
        enderecoRua: 'Rua Harmonia',
        enderecoNumero: '456',
        enderecoComplemento: '',
        enderecoBairro: 'Vila Madalena',
        enderecoCidade: 'São Paulo',
        enderecoEstado: 'SP',
        enderecoCEP: '05435-000',
        
        // Coordenadas (Vila Madalena - SP)
        latitude: -23.5489,
        longitude: -46.6889,
        
        // Orçamento
        orcamentoEstimado: 4500000.00,
        orcamentoReal: 4750000.00,
        totalGasto: 2850000.00,
        
        // Datas
        dataInicioEstimada: new Date('2024-06-15'),
        dataInicioReal: new Date('2024-07-01'),
        prazoFinal: new Date('2025-12-31'),
        
        // Links (quando implementarmos os módulos)
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0002',
        name: 'Casa Jardim Europa',
        description: 'Residência unifamiliar de luxo, 4 suítes, piscina, churrasqueira e paisagismo.',
        status: 'EM_EXECUCAO',
        tipoObra: 'RESIDENCIAL',
        subtipoResidencial: 'UNIFAMILIAR',
        
        enderecoRua: 'Alameda Gabriel Monteiro da Silva',
        enderecoNumero: '1234',
        enderecoComplemento: '',
        enderecoBairro: 'Jardim Europa',
        enderecoCidade: 'São Paulo',
        enderecoEstado: 'SP',
        enderecoCEP: '01442-001',
        
        // Coordenadas (Jardim Europa - SP)
        latitude: -23.5732,
        longitude: -46.6753,
        
        orcamentoEstimado: 2800000.00,
        orcamentoReal: 3100000.00,
        totalGasto: 1950000.00,
        
        dataInicioEstimada: new Date('2024-08-01'),
        dataInicioReal: new Date('2024-08-15'),
        prazoFinal: new Date('2025-08-31'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0003',
        name: 'Edifício Comercial Berrini',
        description: 'Prédio comercial corporativo, 15 andares, heliporto e estacionamento com 200 vagas.',
        status: 'EM_EXECUCAO',
        tipoObra: 'COMERCIAL',
        subtipoResidencial: null,
        
        enderecoRua: 'Avenida Engenheiro Luís Carlos Berrini',
        enderecoNumero: '1500',
        enderecoComplemento: '',
        enderecoBairro: 'Cidade Monções',
        enderecoCidade: 'São Paulo',
        enderecoEstado: 'SP',
        enderecoCEP: '04571-010',
        
        // Coordenadas (Berrini - SP)
        latitude: -23.6159,
        longitude: -46.6978,
        
        orcamentoEstimado: 18500000.00,
        orcamentoReal: 19200000.00,
        totalGasto: 12400000.00,
        
        dataInicioEstimada: new Date('2024-03-01'),
        dataInicioReal: new Date('2024-03-15'),
        prazoFinal: new Date('2026-03-31'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0004',
        name: 'Shopping Outlet Guarulhos',
        description: 'Centro comercial de uso misto: lojas, restaurantes, cinema e área de entretenimento.',
        status: 'PLANEJAMENTO',
        tipoObra: 'MISTA',
        subtipoResidencial: null,
        
        enderecoRua: 'Rodovia Presidente Dutra',
        enderecoNumero: 'Km 225',
        enderecoComplemento: '',
        enderecoBairro: 'Bonsucesso',
        enderecoCidade: 'Guarulhos',
        enderecoEstado: 'SP',
        enderecoCEP: '07251-000',
        
        // Coordenadas (Guarulhos - SP)
        latitude: -23.4629,
        longitude: -46.5330,
        
        orcamentoEstimado: 35000000.00,
        orcamentoReal: null,
        totalGasto: 0.00,
        
        dataInicioEstimada: new Date('2025-04-01'),
        dataInicioReal: null,
        prazoFinal: new Date('2027-04-30'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0005',
        name: 'Residencial Morumbi Green',
        description: 'Condomínio horizontal com 48 casas geminadas, área verde e segurança 24h.',
        status: 'EM_EXECUCAO',
        tipoObra: 'RESIDENCIAL',
        subtipoResidencial: 'MULTIFAMILIAR',
        
        enderecoRua: 'Rua Doutor Alberto Seabra',
        enderecoNumero: '789',
        enderecoComplemento: '',
        enderecoBairro: 'Morumbi',
        enderecoCidade: 'São Paulo',
        enderecoEstado: 'SP',
        enderecoCEP: '05614-020',
        
        // Coordenadas (Morumbi - SP)
        latitude: -23.6236,
        longitude: -46.7022,
        
        orcamentoEstimado: 12000000.00,
        orcamentoReal: 13500000.00,
        totalGasto: 6750000.00,
        
        dataInicioEstimada: new Date('2024-05-01'),
        dataInicioReal: new Date('2024-05-15'),
        prazoFinal: new Date('2025-11-30'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0006',
        name: 'Reforma Corporativa Paulista',
        description: 'Modernização completa de escritório corporativo: layout, elétrica, ar condicionado e TI.',
        status: 'CONCLUIDO',
        tipoObra: 'COMERCIAL',
        subtipoResidencial: null,
        
        enderecoRua: 'Avenida Paulista',
        enderecoNumero: '1500',
        enderecoComplemento: 'Conj. 1201',
        enderecoBairro: 'Bela Vista',
        enderecoCidade: 'São Paulo',
        enderecoEstado: 'SP',
        enderecoCEP: '01310-100',
        
        // Coordenadas (Av. Paulista - SP)
        latitude: -23.5629,
        longitude: -46.6566,
        
        orcamentoEstimado: 850000.00,
        orcamentoReal: 920000.00,
        totalGasto: 920000.00,
        
        dataInicioEstimada: new Date('2024-01-15'),
        dataInicioReal: new Date('2024-01-20'),
        prazoFinal: new Date('2024-06-30'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0007',
        name: 'Condomínio Industrial Jundiaí',
        description: 'Galpões logísticos modulares, área total de 25.000m², preparado para e-commerce.',
        status: 'PLANEJAMENTO',
        tipoObra: 'COMERCIAL',
        subtipoResidencial: null,
        
        enderecoRua: 'Rodovia Anhanguera',
        enderecoNumero: 'Km 58',
        enderecoComplemento: '',
        enderecoBairro: 'Distrito Industrial',
        enderecoCidade: 'Jundiaí',
        enderecoEstado: 'SP',
        enderecoCEP: '13212-000',
        
        // Coordenadas (Jundiaí - SP)
        latitude: -23.1858,
        longitude: -46.8978,
        
        orcamentoEstimado: 45000000.00,
        orcamentoReal: null,
        totalGasto: 0.00,
        
        dataInicioEstimada: new Date('2025-06-01'),
        dataInicioReal: null,
        prazoFinal: new Date('2027-06-30'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0008',
        name: 'Residencial Pinheiros Premium',
        description: 'Torre residencial de 28 andares, 4 unidades por andar, padrão luxo.',
        status: 'EM_EXECUCAO',
        tipoObra: 'RESIDENCIAL',
        subtipoResidencial: 'MULTIFAMILIAR',
        
        enderecoRua: 'Rua dos Pinheiros',
        enderecoNumero: '888',
        enderecoComplemento: '',
        enderecoBairro: 'Pinheiros',
        enderecoCidade: 'São Paulo',
        enderecoEstado: 'SP',
        enderecoCEP: '05422-001',
        
        // Coordenadas (Pinheiros - SP)
        latitude: -23.5629,
        longitude: -46.6911,
        
        orcamentoEstimado: 32000000.00,
        orcamentoReal: 35000000.00,
        totalGasto: 18900000.00,
        
        dataInicioEstimada: new Date('2024-02-01'),
        dataInicioReal: new Date('2024-02-15'),
        prazoFinal: new Date('2026-02-28'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0009',
        name: 'Casa de Campo Atibaia',
        description: 'Residência de campo com arquitetura sustentável, energia solar e captação de água da chuva.',
        status: 'PAUSADO',
        tipoObra: 'RESIDENCIAL',
        subtipoResidencial: 'UNIFAMILIAR',
        
        enderecoRua: 'Estrada Municipal Pedro de Toledo',
        enderecoNumero: 'Km 12',
        enderecoComplemento: 'Lote 45',
        enderecoBairro: 'Jardim Jaraguá',
        enderecoCidade: 'Atibaia',
        enderecoEstado: 'SP',
        enderecoCEP: '12945-000',
        
        // Coordenadas (Atibaia - SP)
        latitude: -23.1169,
        longitude: -46.5508,
        
        orcamentoEstimado: 1800000.00,
        orcamentoReal: 1950000.00,
        totalGasto: 890000.00,
        
        dataInicioEstimada: new Date('2024-09-01'),
        dataInicioReal: new Date('2024-09-10'),
        prazoFinal: new Date('2025-09-30'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
      {
        codigo: 'OBR-2025-0010',
        name: 'Centro Médico Itaim Bibi',
        description: 'Clínica médica multiespecialidade: consultórios, salas cirúrgicas e equipamentos de ponta.',
        status: 'PLANEJAMENTO',
        tipoObra: 'COMERCIAL',
        subtipoResidencial: null,
        
        enderecoRua: 'Rua Joaquim Floriano',
        enderecoNumero: '466',
        enderecoComplemento: 'Torre B',
        enderecoBairro: 'Itaim Bibi',
        enderecoCidade: 'São Paulo',
        enderecoEstado: 'SP',
        enderecoCEP: '04534-002',
        
        // Coordenadas (Itaim Bibi - SP)
        latitude: -23.5870,
        longitude: -46.6814,
        
        orcamentoEstimado: 5500000.00,
        orcamentoReal: null,
        totalGasto: 0.00,
        
        dataInicioEstimada: new Date('2025-03-01'),
        dataInicioReal: null,
        prazoFinal: new Date('2026-03-31'),
        
        linkOrcamento: null,
        linkPlanejamento: null,
      },
    ],
  })

  console.log(`✅ Criados ${projects.count} projetos com sucesso!`)
  console.log('')
  console.log('📊 RESUMO DOS PROJETOS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🏗️  Em Execução: 5 projetos')
  console.log('📋 Planejamento: 4 projetos')
  console.log('✅ Concluído: 1 projeto')
  console.log('⏸️  Pausado: 1 projeto')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('🎯 TIPOS DE OBRA:')
  console.log('🏠 Residencial: 6 projetos')
  console.log('   └─ Unifamiliar: 2')
  console.log('   └─ Multifamiliar: 4')
  console.log('🏢 Comercial: 3 projetos')
  console.log('🏬 Mista: 1 projeto')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('💰 ORÇAMENTO TOTAL: R$ 156.150.000,00')
  console.log('💸 TOTAL GASTO: R$ 43.760.000,00')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
