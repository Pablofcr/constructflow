// ====================================================================
// ÍNDICES DE CONSUMO POR m² — Base do Orçamento Detalhado
// ====================================================================
// Metodologia inspirada em "Calculadora Obra Certa" com mapeamento
// para composições SINAPI/CF reais (preços por estado/projeto).
//
// 3 camadas de cálculo:
//   Layer A: Qty = index × areaConstruida (ou areaTerreno)
//   Layer B: Qty = f(room_type, width, length) — por cômodo
//   Layer C: Qty = constante por edificação
// ====================================================================

import { SINAPI_COMPOSITIONS } from './sinapi-data';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type FinishStandard = 'POPULAR' | 'BAIXO_PADRAO' | 'MEDIO_PADRAO' | 'ALTO_PADRAO';

export type IndexLayer = 'A' | 'B' | 'C';

export type RoomType = 'banheiro' | 'cozinha' | 'quarto' | 'sala' | 'servico' | 'outro';

/** Regra de cálculo por cômodo (Layer B) */
export interface RoomRule {
  applicableRoomTypes: RoomType[];
  method: 'count' | 'floor_area' | 'wall_area' | 'perimeter';
  multiplier: number;
  wasteFactor?: number; // ex: 1.10 = 10% de perda
}

/** Índice de consumo individual */
export interface ConsumptionIndex {
  id: string;               // S01-01, S04-01, etc.
  stageCode: string;         // 00-19
  description: string;
  layer: IndexLayer;
  compositionCode: string | null;
  compositionUnit: string;
  /** Layer A: índices por m² por padrão. Layer C: quantidade fixa por padrão. */
  indexPerM2?: Record<FinishStandard, number>;
  /** Layer A com base em areaTerreno em vez de areaConstruida */
  useTerrainArea?: boolean;
  /** Layer B: regra de cálculo por cômodo */
  roomRule?: RoomRule;
}

/** Input para o cálculo de quantitativos */
export interface ConsumptionInput {
  areaConstruida: number;
  areaTerreno: number;
  padrao: FinishStandard;
  rooms: Array<{
    name: string;
    type: RoomType;
    area: number;
    width?: number;
    length?: number;
  }>;
  numFloors?: number;
}

/** Resultado do cálculo de um item */
export interface ComputedQuantity {
  indexId: string;
  stageCode: string;
  compositionCode: string | null;
  description: string;
  quantity: number;
  unit: string;
  layer: IndexLayer;
  calculationNote: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

const WET_ROOM_TYPES: RoomType[] = ['banheiro', 'cozinha', 'servico'];

/** Estima pé-direito padrão (m) */
function defaultCeilingHeight(padrao: FinishStandard): number {
  switch (padrao) {
    case 'POPULAR': return 2.60;
    case 'BAIXO_PADRAO': return 2.70;
    case 'MEDIO_PADRAO': return 2.80;
    case 'ALTO_PADRAO': return 3.00;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dados de Índices
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CONSUMPTION_INDICES: ConsumptionIndex[] = [
  // ══════════════════════════════════════════════════════════════
  // ETAPA 01 - SERVIÇOS PRELIMINARES
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S01-01',
    stageCode: '01',
    description: 'Limpeza mecanizada do terreno',
    layer: 'A',
    compositionCode: 'SINAPI-73847',
    compositionUnit: 'm²',
    useTerrainArea: true,
    indexPerM2: { POPULAR: 1.0, BAIXO_PADRAO: 1.0, MEDIO_PADRAO: 1.0, ALTO_PADRAO: 1.0 },
  },
  {
    id: 'S01-02',
    stageCode: '01',
    description: 'Placa de obra',
    layer: 'C',
    compositionCode: 'SINAPI-74077',
    compositionUnit: 'un',
    indexPerM2: { POPULAR: 1, BAIXO_PADRAO: 1, MEDIO_PADRAO: 1, ALTO_PADRAO: 1 },
  },
  {
    id: 'S01-03',
    stageCode: '01',
    description: 'Tapume de madeira',
    layer: 'A',
    compositionCode: 'SINAPI-73948',
    compositionUnit: 'm',
    indexPerM2: { POPULAR: 0.15, BAIXO_PADRAO: 0.15, MEDIO_PADRAO: 0.20, ALTO_PADRAO: 0.25 },
  },
  {
    id: 'S01-04',
    stageCode: '01',
    description: 'Locação da obra',
    layer: 'A',
    compositionCode: 'SINAPI-84275',
    compositionUnit: 'm',
    indexPerM2: { POPULAR: 0.50, BAIXO_PADRAO: 0.50, MEDIO_PADRAO: 0.55, ALTO_PADRAO: 0.60 },
  },
  {
    id: 'S01-05',
    stageCode: '01',
    description: 'Barracão de obra',
    layer: 'A',
    compositionCode: 'SINAPI-74209',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0.05, BAIXO_PADRAO: 0.05, MEDIO_PADRAO: 0.06, ALTO_PADRAO: 0.08 },
  },
  {
    id: 'S01-06',
    stageCode: '01',
    description: 'Instalação provisória elétrica',
    layer: 'C',
    compositionCode: 'SINAPI-74131',
    compositionUnit: 'un',
    indexPerM2: { POPULAR: 1, BAIXO_PADRAO: 1, MEDIO_PADRAO: 1, ALTO_PADRAO: 1 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 02 - INFRAESTRUTURA
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S02-01',
    stageCode: '02',
    description: 'Escavação manual de vala',
    layer: 'A',
    compositionCode: 'SINAPI-79479',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0.12, BAIXO_PADRAO: 0.12, MEDIO_PADRAO: 0.15, ALTO_PADRAO: 0.18 },
  },
  {
    id: 'S02-02',
    stageCode: '02',
    description: 'Alvenaria de pedra (fundação popular)',
    layer: 'A',
    compositionCode: 'CF-02003',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0.06, BAIXO_PADRAO: 0.06, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S02-03',
    stageCode: '02',
    description: 'Baldrame tijolo',
    layer: 'A',
    compositionCode: 'CF-02004',
    compositionUnit: 'm',
    indexPerM2: { POPULAR: 0.55, BAIXO_PADRAO: 0.55, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S02-04',
    stageCode: '02',
    description: 'Sapata de concreto armado',
    layer: 'A',
    compositionCode: 'SINAPI-94965',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0.03, ALTO_PADRAO: 0.05 },
  },
  {
    id: 'S02-05',
    stageCode: '02',
    description: 'Viga baldrame concreto',
    layer: 'A',
    compositionCode: 'SINAPI-94970',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0.04, ALTO_PADRAO: 0.05 },
  },
  {
    id: 'S02-06',
    stageCode: '02',
    description: 'Cinta de amarração',
    layer: 'A',
    compositionCode: 'SINAPI-93204',
    compositionUnit: 'm',
    indexPerM2: { POPULAR: 0.40, BAIXO_PADRAO: 0.40, MEDIO_PADRAO: 0.40, ALTO_PADRAO: 0.45 },
  },
  {
    id: 'S02-07',
    stageCode: '02',
    description: 'Reaterro compactado',
    layer: 'A',
    compositionCode: 'SINAPI-79480',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0.06, BAIXO_PADRAO: 0.06, MEDIO_PADRAO: 0.08, ALTO_PADRAO: 0.10 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 03 - SUPRAESTRUTURA
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S03-01',
    stageCode: '03',
    description: 'Laje treliçada EPS/H8',
    layer: 'A',
    compositionCode: 'CF-03002',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.0, BAIXO_PADRAO: 1.0, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S03-02',
    stageCode: '03',
    description: 'Tela soldada Q138',
    layer: 'A',
    compositionCode: 'CF-03003',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.0, BAIXO_PADRAO: 1.0, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S03-03',
    stageCode: '03',
    description: 'Concreto FCK20 para laje popular',
    layer: 'A',
    compositionCode: 'CF-03004',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0.06, BAIXO_PADRAO: 0.06, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S03-04',
    stageCode: '03',
    description: 'Aço CA-50 10mm para laje popular',
    layer: 'A',
    compositionCode: 'CF-03005',
    compositionUnit: 'm',
    indexPerM2: { POPULAR: 1.5, BAIXO_PADRAO: 1.5, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S03-05',
    stageCode: '03',
    description: 'Pilar concreto armado FCK25',
    layer: 'A',
    compositionCode: 'SINAPI-92775',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0.025, ALTO_PADRAO: 0 },
  },
  {
    id: 'S03-06',
    stageCode: '03',
    description: 'Pilar concreto armado FCK30',
    layer: 'A',
    compositionCode: 'SINAPI-92775-30',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0, ALTO_PADRAO: 0.035 },
  },
  {
    id: 'S03-07',
    stageCode: '03',
    description: 'Viga concreto armado FCK25',
    layer: 'A',
    compositionCode: 'SINAPI-92776',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0.05, ALTO_PADRAO: 0 },
  },
  {
    id: 'S03-08',
    stageCode: '03',
    description: 'Viga concreto armado FCK30',
    layer: 'A',
    compositionCode: 'SINAPI-92776-30',
    compositionUnit: 'm³',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0, ALTO_PADRAO: 0.06 },
  },
  {
    id: 'S03-09',
    stageCode: '03',
    description: 'Laje maciça concreto FCK25',
    layer: 'A',
    compositionCode: 'SINAPI-94964',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 1.0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S03-10',
    stageCode: '03',
    description: 'Laje maciça concreto FCK30',
    layer: 'A',
    compositionCode: 'SINAPI-94964-30',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0, ALTO_PADRAO: 1.0 },
  },
  {
    id: 'S03-11',
    stageCode: '03',
    description: 'Forma de madeira para estrutura',
    layer: 'A',
    compositionCode: 'SINAPI-92781',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0.95, ALTO_PADRAO: 1.10 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 04 - ALVENARIA
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S04-01',
    stageCode: '04',
    description: 'Alvenaria bloco cerâmico 9cm',
    layer: 'A',
    compositionCode: 'SINAPI-87522',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 2.5, BAIXO_PADRAO: 2.5, MEDIO_PADRAO: 2.0, ALTO_PADRAO: 1.8 },
  },
  {
    id: 'S04-02',
    stageCode: '04',
    description: 'Alvenaria bloco cerâmico 14cm',
    layer: 'A',
    compositionCode: 'SINAPI-87523',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0.8, ALTO_PADRAO: 1.0 },
  },
  {
    id: 'S04-03',
    stageCode: '04',
    description: 'Tela de amarração',
    layer: 'A',
    compositionCode: 'CF-04001',
    compositionUnit: 'm',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0.30, ALTO_PADRAO: 0.35 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 05 - COBERTURA
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S05-01',
    stageCode: '05',
    description: 'Estrutura de madeira para telhado',
    layer: 'A',
    compositionCode: 'SINAPI-94227',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.15, BAIXO_PADRAO: 1.15, MEDIO_PADRAO: 1.15, ALTO_PADRAO: 0 },
  },
  {
    id: 'S05-02',
    stageCode: '05',
    description: 'Telha fibrocimento',
    layer: 'A',
    compositionCode: 'SINAPI-94230',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.15, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S05-03',
    stageCode: '05',
    description: 'Telha cerâmica colonial',
    layer: 'A',
    compositionCode: 'SINAPI-94228',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 1.15, MEDIO_PADRAO: 1.15, ALTO_PADRAO: 0 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 08 - REVESTIMENTOS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S08-01',
    stageCode: '08',
    description: 'Chapisco interno',
    layer: 'A',
    compositionCode: 'SINAPI-87878',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 2.5, BAIXO_PADRAO: 2.5, MEDIO_PADRAO: 2.5, ALTO_PADRAO: 2.5 },
  },
  {
    id: 'S08-02',
    stageCode: '08',
    description: 'Emboço/massa única interna',
    layer: 'A',
    compositionCode: 'SINAPI-87879',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 2.5, BAIXO_PADRAO: 2.5, MEDIO_PADRAO: 2.5, ALTO_PADRAO: 0 },
  },
  {
    id: 'S08-03',
    stageCode: '08',
    description: 'Chapisco externo',
    layer: 'A',
    compositionCode: 'SINAPI-87878',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.5, BAIXO_PADRAO: 1.5, MEDIO_PADRAO: 1.5, ALTO_PADRAO: 1.5 },
  },
  {
    id: 'S08-04',
    stageCode: '08',
    description: 'Reboco externo',
    layer: 'A',
    compositionCode: 'SINAPI-87879',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.5, BAIXO_PADRAO: 1.5, MEDIO_PADRAO: 1.5, ALTO_PADRAO: 1.5 },
  },
  {
    id: 'S08-05',
    stageCode: '08',
    description: 'Cerâmica de parede (áreas molhadas)',
    layer: 'B',
    compositionCode: 'SINAPI-87882',
    compositionUnit: 'm²',
    roomRule: {
      applicableRoomTypes: ['banheiro', 'cozinha', 'servico'],
      method: 'wall_area',
      multiplier: 1.0,
      wasteFactor: 1.10,
    },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 09 - FÔRROS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S09-01',
    stageCode: '09',
    description: 'Reboco de teto',
    layer: 'A',
    compositionCode: 'CF-09001',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S09-02',
    stageCode: '09',
    description: 'Forro de gesso em placas',
    layer: 'A',
    compositionCode: 'SINAPI-96109',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 1.0, MEDIO_PADRAO: 1.0, ALTO_PADRAO: 0 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 10 - PISOS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S10-01',
    stageCode: '10',
    description: 'Contrapiso',
    layer: 'A',
    compositionCode: 'SINAPI-87261',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.0, BAIXO_PADRAO: 1.0, MEDIO_PADRAO: 1.0, ALTO_PADRAO: 1.0 },
  },
  {
    id: 'S10-02',
    stageCode: '10',
    description: 'Piso cerâmico 45×45cm',
    layer: 'A',
    compositionCode: 'SINAPI-87263',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.1, BAIXO_PADRAO: 1.1, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },
  {
    id: 'S10-03',
    stageCode: '10',
    description: 'Porcelanato 60×60cm',
    layer: 'A',
    compositionCode: 'SINAPI-87265',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 1.1, ALTO_PADRAO: 1.1 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 11 - PINTURA
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S11-01',
    stageCode: '11',
    description: 'Selador acrílico',
    layer: 'A',
    compositionCode: 'CF-11001',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 4.0, BAIXO_PADRAO: 4.0, MEDIO_PADRAO: 4.0, ALTO_PADRAO: 4.0 },
  },
  {
    id: 'S11-02',
    stageCode: '11',
    description: 'Pintura PVA látex interna',
    layer: 'A',
    compositionCode: 'SINAPI-88489',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 2.5, BAIXO_PADRAO: 2.5, MEDIO_PADRAO: 2.5, ALTO_PADRAO: 0 },
  },
  {
    id: 'S11-03',
    stageCode: '11',
    description: 'Pintura acrílica sobre massa',
    layer: 'A',
    compositionCode: 'SINAPI-88491',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 0, ALTO_PADRAO: 2.5 },
  },
  {
    id: 'S11-04',
    stageCode: '11',
    description: 'Textura acrílica externa',
    layer: 'A',
    compositionCode: 'CF-11003',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.5, BAIXO_PADRAO: 1.5, MEDIO_PADRAO: 0, ALTO_PADRAO: 0 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 12 - LOUÇAS E METAIS (Layer B — por cômodo)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S12-01',
    stageCode: '12',
    description: 'Bacia sanitária com caixa acoplada',
    layer: 'B',
    compositionCode: 'SINAPI-86941',
    compositionUnit: 'un',
    roomRule: {
      applicableRoomTypes: ['banheiro'],
      method: 'count',
      multiplier: 1,
    },
  },
  {
    id: 'S12-02',
    stageCode: '12',
    description: 'Lavatório com coluna',
    layer: 'B',
    compositionCode: 'SINAPI-86943',
    compositionUnit: 'un',
    roomRule: {
      applicableRoomTypes: ['banheiro'],
      method: 'count',
      multiplier: 1,
    },
  },
  {
    id: 'S12-03',
    stageCode: '12',
    description: 'Tanque de lavar roupa',
    layer: 'B',
    compositionCode: 'SINAPI-86945',
    compositionUnit: 'un',
    roomRule: {
      applicableRoomTypes: ['servico'],
      method: 'count',
      multiplier: 1,
    },
  },
  {
    id: 'S12-04',
    stageCode: '12',
    description: 'Chuveiro comum',
    layer: 'B',
    compositionCode: 'CF-12007',
    compositionUnit: 'un',
    roomRule: {
      applicableRoomTypes: ['banheiro'],
      method: 'count',
      multiplier: 1,
    },
  },
  {
    id: 'S12-05',
    stageCode: '12',
    description: 'Cuba simples inox (cozinha popular)',
    layer: 'B',
    compositionCode: 'CF-12016',
    compositionUnit: 'un',
    roomRule: {
      applicableRoomTypes: ['cozinha'],
      method: 'count',
      multiplier: 1,
    },
  },
  {
    id: 'S12-06',
    stageCode: '12',
    description: 'Torneira de mesa popular',
    layer: 'B',
    compositionCode: 'CF-12019',
    compositionUnit: 'un',
    roomRule: {
      applicableRoomTypes: ['cozinha'],
      method: 'count',
      multiplier: 1,
    },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 13 - INSTALAÇÕES ELÉTRICAS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S13-01',
    stageCode: '13',
    description: 'Ponto de tomada',
    layer: 'A',
    compositionCode: 'SINAPI-91926',
    compositionUnit: 'un',
    indexPerM2: { POPULAR: 0.60, BAIXO_PADRAO: 0.60, MEDIO_PADRAO: 0.75, ALTO_PADRAO: 0.90 },
  },
  {
    id: 'S13-02',
    stageCode: '13',
    description: 'Ponto de interruptor',
    layer: 'A',
    compositionCode: 'SINAPI-91928',
    compositionUnit: 'un',
    indexPerM2: { POPULAR: 0.25, BAIXO_PADRAO: 0.30, MEDIO_PADRAO: 0.40, ALTO_PADRAO: 0.50 },
  },
  {
    id: 'S13-03',
    stageCode: '13',
    description: 'Instalações elétricas completas/m²',
    layer: 'A',
    compositionCode: 'CF-13001',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 1.0, ALTO_PADRAO: 1.0 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 14 - INSTALAÇÕES HIDROSSANITÁRIAS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S14-01',
    stageCode: '14',
    description: 'Tubo PVC soldável 25mm',
    layer: 'A',
    compositionCode: 'SINAPI-89353',
    compositionUnit: 'm',
    indexPerM2: { POPULAR: 1.40, BAIXO_PADRAO: 1.40, MEDIO_PADRAO: 1.40, ALTO_PADRAO: 1.50 },
  },
  {
    id: 'S14-02',
    stageCode: '14',
    description: 'Instalações hidrossanitárias completas/m²',
    layer: 'A',
    compositionCode: 'CF-14001',
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 0, BAIXO_PADRAO: 0, MEDIO_PADRAO: 1.0, ALTO_PADRAO: 1.0 },
  },

  // ══════════════════════════════════════════════════════════════
  // ETAPA 18 - LIMPEZA FINAL
  // ══════════════════════════════════════════════════════════════
  {
    id: 'S18-01',
    stageCode: '18',
    description: 'Limpeza geral da obra',
    layer: 'A',
    compositionCode: null, // composição a ser criada (CF-18001) em fase futura
    compositionUnit: 'm²',
    indexPerM2: { POPULAR: 1.0, BAIXO_PADRAO: 1.0, MEDIO_PADRAO: 1.0, ALTO_PADRAO: 1.0 },
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Funções Exportadas
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Retorna todos os índices que possuem valor > 0 para o padrão informado.
 */
export function getIndicesForStandard(padrao: FinishStandard): ConsumptionIndex[] {
  return CONSUMPTION_INDICES.filter((idx) => {
    if (idx.layer === 'B') return true; // Layer B sempre presente
    return idx.indexPerM2 != null && idx.indexPerM2[padrao] > 0;
  });
}

/**
 * Calcula quantitativos a partir dos inputs.
 */
export function computeQuantities(input: ConsumptionInput): ComputedQuantity[] {
  const results: ComputedQuantity[] = [];
  const indices = getIndicesForStandard(input.padrao);

  for (const idx of indices) {
    const computed = computeSingleIndex(idx, input);
    if (computed && computed.quantity > 0) {
      results.push(computed);
    }
  }

  return results;
}

/**
 * Calcula quantitativos para uma etapa específica.
 */
export function computeQuantitiesForStage(
  input: ConsumptionInput,
  stageCode: string,
): ComputedQuantity[] {
  return computeQuantities(input).filter((q) => q.stageCode === stageCode);
}

/**
 * Valida que todos os compositionCode referenciados existem em SINAPI_COMPOSITIONS.
 * Retorna array de códigos ausentes (vazio = tudo OK).
 */
export function validateCompositionCodes(): string[] {
  const existingCodes = new Set(SINAPI_COMPOSITIONS.map((c) => c.code));
  const missing: string[] = [];

  for (const idx of CONSUMPTION_INDICES) {
    if (idx.compositionCode && !existingCodes.has(idx.compositionCode)) {
      missing.push(`${idx.id}: ${idx.compositionCode}`);
    }
  }

  return missing;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Lógica de Cálculo Interna
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function computeSingleIndex(
  idx: ConsumptionIndex,
  input: ConsumptionInput,
): ComputedQuantity | null {
  switch (idx.layer) {
    case 'A':
      return computeLayerA(idx, input);
    case 'B':
      return computeLayerB(idx, input);
    case 'C':
      return computeLayerC(idx, input);
    default:
      return null;
  }
}

/**
 * Layer A: Qty = index × area
 */
function computeLayerA(idx: ConsumptionIndex, input: ConsumptionInput): ComputedQuantity | null {
  if (!idx.indexPerM2) return null;
  const indexValue = idx.indexPerM2[input.padrao];
  if (indexValue === 0) return null;

  const baseArea = idx.useTerrainArea ? input.areaTerreno : input.areaConstruida;
  const quantity = round2(indexValue * baseArea);
  const areaLabel = idx.useTerrainArea ? 'areaTerreno' : 'areaConstruida';

  return {
    indexId: idx.id,
    stageCode: idx.stageCode,
    compositionCode: idx.compositionCode,
    description: idx.description,
    quantity,
    unit: idx.compositionUnit,
    layer: 'A',
    calculationNote: `${indexValue} × ${baseArea} ${areaLabel} = ${quantity} ${idx.compositionUnit}`,
  };
}

/**
 * Layer B: Qty = f(rooms)
 */
function computeLayerB(idx: ConsumptionIndex, input: ConsumptionInput): ComputedQuantity | null {
  if (!idx.roomRule) return null;
  const { roomRule } = idx;
  const applicableRooms = input.rooms.filter((r) =>
    roomRule.applicableRoomTypes.includes(r.type),
  );

  if (applicableRooms.length === 0) return null;

  let totalQty = 0;
  const notes: string[] = [];

  for (const room of applicableRooms) {
    let roomQty = 0;

    switch (roomRule.method) {
      case 'count':
        roomQty = roomRule.multiplier;
        notes.push(`${room.name}: ${roomRule.multiplier} un`);
        break;

      case 'floor_area':
        roomQty = room.area * roomRule.multiplier;
        notes.push(`${room.name}: ${room.area}m² × ${roomRule.multiplier}`);
        break;

      case 'wall_area': {
        // Estima perímetro do cômodo e multiplica pelo pé-direito
        const w = room.width || Math.sqrt(room.area);
        const l = room.length || (room.area / w);
        const perimeter = 2 * (w + l);
        const height = defaultCeilingHeight(input.padrao);
        roomQty = perimeter * height * roomRule.multiplier;
        notes.push(`${room.name}: P=${round2(perimeter)}m × h=${height}m × ${roomRule.multiplier}`);
        break;
      }

      case 'perimeter': {
        const pw = room.width || Math.sqrt(room.area);
        const pl = room.length || (room.area / pw);
        roomQty = 2 * (pw + pl) * roomRule.multiplier;
        notes.push(`${room.name}: P=${round2(2 * (pw + pl))}m × ${roomRule.multiplier}`);
        break;
      }
    }

    if (roomRule.wasteFactor) {
      roomQty *= roomRule.wasteFactor;
    }

    totalQty += roomQty;
  }

  const quantity = round2(totalQty);
  if (quantity === 0) return null;

  const wasteNote = roomRule.wasteFactor ? ` (${((roomRule.wasteFactor - 1) * 100).toFixed(0)}% perda)` : '';

  return {
    indexId: idx.id,
    stageCode: idx.stageCode,
    compositionCode: idx.compositionCode,
    description: idx.description,
    quantity,
    unit: idx.compositionUnit,
    layer: 'B',
    calculationNote: notes.join('; ') + wasteNote,
  };
}

/**
 * Layer C: Qty = constante fixa por edificação
 */
function computeLayerC(idx: ConsumptionIndex, input: ConsumptionInput): ComputedQuantity | null {
  if (!idx.indexPerM2) return null;
  const fixedQty = idx.indexPerM2[input.padrao];
  if (fixedQty === 0) return null;

  return {
    indexId: idx.id,
    stageCode: idx.stageCode,
    compositionCode: idx.compositionCode,
    description: idx.description,
    quantity: fixedQty,
    unit: idx.compositionUnit,
    layer: 'C',
    calculationNote: `Quantidade fixa: ${fixedQty} ${idx.compositionUnit} por edificação`,
  };
}
