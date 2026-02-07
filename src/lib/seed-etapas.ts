// ====================================================================
// SEED: 18 ETAPAS PADRÃO DA CONSTRUÇÃO CIVIL
// ====================================================================
// Arquivo: src/lib/seed-etapas.ts
// Uso: Criar automaticamente as etapas ao criar um BudgetReal

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ====================================================================
// INTERFACE
// ====================================================================
export interface DefaultStage {
  name: string;
  code: string;
  order: number;
  percentage: number;
  description?: string;
}

// ====================================================================
// 18 ETAPAS PADRÃO (TOTAL: 100%)
// ====================================================================
export const DEFAULT_STAGES: DefaultStage[] = [
  {
    name: 'Serviços Preliminares',
    code: '01',
    order: 1,
    percentage: 2,
    description: 'Limpeza do terreno, locação da obra, canteiro, tapumes, instalações provisórias',
  },
  {
    name: 'Infraestrutura',
    code: '02',
    order: 2,
    percentage: 11,
    description: 'Escavação, fundações (sapatas, blocos, estacas), baldrames',
  },
  {
    name: 'Supraestrutura',
    code: '03',
    order: 3,
    percentage: 16,
    description: 'Pilares, vigas, lajes, escadas, estrutura de concreto armado',
  },
  {
    name: 'Alvenaria',
    code: '04',
    order: 4,
    percentage: 8,
    description: 'Elevação de paredes em blocos cerâmicos ou de concreto',
  },
  {
    name: 'Cobertura',
    code: '05',
    order: 5,
    percentage: 7,
    description: 'Estrutura de madeira ou metálica, telhamento, rufos, calhas',
  },
  {
    name: 'Impermeabilização',
    code: '06',
    order: 6,
    percentage: 3,
    description: 'Impermeabilização de fundações, lajes, banheiros, reservatórios',
  },
  {
    name: 'Esquadrias',
    code: '07',
    order: 7,
    percentage: 6,
    description: 'Portas, janelas, batentes, marcos (madeira, alumínio, PVC)',
  },
  {
    name: 'Revestimentos',
    code: '08',
    order: 8,
    percentage: 10,
    description: 'Chapisco, emboço, reboco, azulejos, pastilhas',
  },
  {
    name: 'Pisos',
    code: '09',
    order: 9,
    percentage: 7,
    description: 'Contrapiso, cerâmica, porcelanato, pedras, rodapés',
  },
  {
    name: 'Pintura',
    code: '10',
    order: 10,
    percentage: 5,
    description: 'Pintura de paredes, tetos, esquadrias (interna e externa)',
  },
  {
    name: 'Louças e Metais',
    code: '11',
    order: 11,
    percentage: 3,
    description: 'Bacias, lavatórios, tanques, torneiras, registros, chuveiros',
  },
  {
    name: 'Instalações Elétricas',
    code: '12',
    order: 12,
    percentage: 6,
    description: 'Eletrodutos, fios, cabos, quadros, disjuntores, tomadas, interruptores, luminárias',
  },
  {
    name: 'Instalações Hidrossanitárias',
    code: '13',
    order: 13,
    percentage: 5,
    description: 'Tubulações de água fria/quente, esgoto, águas pluviais, reservatórios',
  },
  {
    name: 'Instalações Especiais',
    code: '14',
    order: 14,
    percentage: 2,
    description: 'SPDA (para-raios), gás, ar-condicionado, alarme, CFTV, automação',
  },
  {
    name: 'Vidros e Ferragens',
    code: '15',
    order: 15,
    percentage: 2,
    description: 'Vidros temperados, laminados, fechaduras, dobradiças, puxadores',
  },
  {
    name: 'Paisagismo',
    code: '16',
    order: 16,
    percentage: 1,
    description: 'Jardins, gramados, mudas, irrigação',
  },
  {
    name: 'Limpeza Final',
    code: '17',
    order: 17,
    percentage: 1,
    description: 'Limpeza geral da obra, remoção de entulhos, polimento de pisos',
  },
  {
    name: 'Administração da Obra',
    code: '18',
    order: 18,
    percentage: 5,
    description: 'Engenheiro, mestre de obras, almoxarife, vigia, equipamentos de segurança',
  },
];

// ====================================================================
// FUNÇÃO: CRIAR ETAPAS AUTOMATICAMENTE
// ====================================================================
/**
 * Cria as 18 etapas padrão para um orçamento real
 * @param budgetRealId - ID do orçamento real
 * @param totalDirectCost - Custo direto total (será distribuído proporcionalmente)
 * @returns Promise com as etapas criadas
 */
export async function createDefaultStages(
  budgetRealId: string,
  totalDirectCost: number = 0
) {
  const stages = [];

  for (const stage of DEFAULT_STAGES) {
    // Calcular custo da etapa proporcionalmente
    const stageCost = (totalDirectCost * stage.percentage) / 100;

    const created = await prisma.budgetStage.create({
      data: {
        budgetRealId,
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

  return stages;
}

// ====================================================================
// FUNÇÃO: OBTER SERVIÇOS COMUNS POR ETAPA (OPCIONAL - PARA FUTURO)
// ====================================================================
export const COMMON_SERVICES_BY_STAGE: Record<string, string[]> = {
  '01': [
    'Limpeza do terreno',
    'Locação da obra',
    'Tapume de madeira',
    'Placa de obra',
    'Barracão para depósito',
    'Instalações sanitárias provisórias',
  ],
  '02': [
    'Escavação manual',
    'Sapata de concreto',
    'Bloco de fundação',
    'Baldrame de concreto',
    'Impermeabilização de fundação',
  ],
  '03': [
    'Pilar de concreto armado',
    'Viga de concreto armado',
    'Laje maciça',
    'Laje pré-moldada',
    'Escada de concreto',
  ],
  '04': [
    'Alvenaria de blocos cerâmicos 9cm',
    'Alvenaria de blocos cerâmicos 14cm',
    'Verga e contraverga',
    'Encunhamento de alvenaria',
  ],
  '05': [
    'Estrutura de madeira para telhado',
    'Telha cerâmica',
    'Telha de fibrocimento',
    'Cumeeira',
    'Rufo metálico',
    'Calha de PVC',
  ],
  '06': [
    'Impermeabilização de fundação',
    'Impermeabilização de laje',
    'Impermeabilização de banheiro',
    'Manta asfáltica',
  ],
  '07': [
    'Porta de madeira',
    'Janela de alumínio',
    'Janela de PVC',
    'Batente de madeira',
    'Marco de alumínio',
  ],
  '08': [
    'Chapisco',
    'Emboço interno',
    'Reboco',
    'Azulejo de parede',
    'Revestimento cerâmico',
  ],
  '09': [
    'Contrapiso',
    'Cerâmica para piso',
    'Porcelanato',
    'Rodapé de cerâmica',
    'Soleira de granito',
  ],
  '10': [
    'Pintura com PVA',
    'Pintura acrílica',
    'Pintura texturizada',
    'Massa corrida',
  ],
  '11': [
    'Bacia sanitária',
    'Lavatório',
    'Tanque de lavar roupa',
    'Torneira de parede',
    'Registro de pressão',
    'Chuveiro elétrico',
  ],
  '12': [
    'Eletroduto PVC',
    'Fio de cobre',
    'Quadro de distribuição',
    'Disjuntor',
    'Tomada',
    'Interruptor',
    'Luminária',
  ],
  '13': [
    'Tubo PVC água fria',
    'Tubo PVC esgoto',
    'Conexões PVC',
    'Caixa d\'água',
    'Registro de gaveta',
  ],
  '14': [
    'SPDA (para-raios)',
    'Tubulação de gás',
    'Split de ar-condicionado',
    'Central de alarme',
  ],
  '15': [
    'Vidro temperado',
    'Fechadura externa',
    'Fechadura interna',
    'Dobradiça',
    'Puxador',
  ],
  '16': ['Grama', 'Mudas de plantas', 'Terra vegetal', 'Sistema de irrigação'],
  '17': ['Limpeza geral', 'Remoção de entulho', 'Polimento de piso'],
  '18': [
    'Engenheiro civil',
    'Mestre de obras',
    'Almoxarife',
    'Vigia',
    'EPI (equipamentos de segurança)',
  ],
};

// ====================================================================
// UNIDADES DE MEDIDA COMUNS
// ====================================================================
export const COMMON_UNITS = [
  'm³', // metro cúbico
  'm²', // metro quadrado
  'm', // metro linear
  'un', // unidade
  'kg', // quilograma
  'h', // hora
  'conj', // conjunto
  'peça', // peça
  'l', // litro
  't', // tonelada
  'vb', // verba
  'sc', // saco
  'pç', // peça
  'cx', // caixa
];

// ====================================================================
// EXPORTAR TUDO
// ====================================================================
export default {
  DEFAULT_STAGES,
  createDefaultStages,
  COMMON_SERVICES_BY_STAGE,
  COMMON_UNITS,
};
