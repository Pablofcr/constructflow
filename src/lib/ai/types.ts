// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tipos para Extração de Variáveis (Fase 1 do Orçamento IA)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface WallCoordinate {
  x1: number; y1: number;  // ponto inicial (% da página, 0-100)
  x2: number; y2: number;  // ponto final (% da página, 0-100)
}

export interface FloorPlan {
  fileId: string;       // ProjectFile.id (preenchido pós-parse)
  fileName: string;     // nome exato do arquivo
  pageNumber: number;   // 1-indexed
  label: string;        // "Terreo", "1o Pavimento"
}

export interface ExtractedWall {
  id: string;           // "H0", "H1", "V0"...
  direction: 'H' | 'V';
  length: number;
  classification: 'muro' | 'ext' | 'int' | 'ext/muro';
  description: string;
  floorPlanIndex?: number;      // índice no array floorPlans[]
  coordinates?: WallCoordinate; // posição percentual na página do PDF
}

export interface ExtractedOpening {
  type: 'porta' | 'janela' | 'portao';
  width: number;
  height: number;
  quantity: number;
  location: 'int' | 'ext' | 'muro';
  description: string;
}

export interface ExtractedRoom {
  name: string;
  area: number;
  type: 'banheiro' | 'cozinha' | 'quarto' | 'sala' | 'servico' | 'outro';
}

export interface DerivedValues {
  pHorizontal: number;
  pVertical: number;
  pTotal: number;
  pExterno: number;
  pInterno: number;
  pMuro: number;
  aVaosPortasInt: number;
  aVaosPortasExt: number;
  aVaosJanelas: number;
  aVaosPortoes: number;
  aVaosTotal: number;
  aParedesInternas: number;
  aParedesExternas: number;
  aParedesMuros: number;
  aParedesTotal: number;
  aCobertura: number;
  vEscavacao: number;
}

export interface ExtractedVariables {
  areaConstruida: number;
  areaTerreno: number;
  walls: ExtractedWall[];
  heights: {
    hInterno: number;
    hExterno: number;
    hMuro: number;
  };
  openings: ExtractedOpening[];
  rooms: ExtractedRoom[];
  floorPlans?: FloorPlan[];
  derived?: DerivedValues;
  aiNotes?: string;
}

export function computeDerivedValues(vars: ExtractedVariables): DerivedValues {
  const { walls, heights, openings, areaConstruida } = vars;

  // Perímetros por direção
  const pHorizontal = walls
    .filter((w) => w.direction === 'H')
    .reduce((sum, w) => sum + w.length, 0);
  const pVertical = walls
    .filter((w) => w.direction === 'V')
    .reduce((sum, w) => sum + w.length, 0);
  const pTotal = pHorizontal + pVertical;

  // Perímetros por classificação
  const pExterno = walls
    .filter((w) => w.classification === 'ext' || w.classification === 'ext/muro')
    .reduce((sum, w) => sum + w.length, 0);
  const pInterno = walls
    .filter((w) => w.classification === 'int')
    .reduce((sum, w) => sum + w.length, 0);
  const pMuro = walls
    .filter((w) => w.classification === 'muro' || w.classification === 'ext/muro')
    .reduce((sum, w) => sum + w.length, 0);

  // Vãos
  const aVaosPortasInt = openings
    .filter((o) => o.type === 'porta' && o.location === 'int')
    .reduce((sum, o) => sum + o.width * o.height * o.quantity, 0);
  const aVaosPortasExt = openings
    .filter((o) => o.type === 'porta' && o.location === 'ext')
    .reduce((sum, o) => sum + o.width * o.height * o.quantity, 0);
  const aVaosJanelas = openings
    .filter((o) => o.type === 'janela')
    .reduce((sum, o) => sum + o.width * o.height * o.quantity, 0);
  const aVaosPortoes = openings
    .filter((o) => o.type === 'portao')
    .reduce((sum, o) => sum + o.width * o.height * o.quantity, 0);
  const aVaosTotal = aVaosPortasInt + aVaosPortasExt + aVaosJanelas + aVaosPortoes;

  // Áreas de paredes
  const aParedesInternas = Math.max(0, pInterno * heights.hInterno - aVaosPortasInt);
  const aParedesExternas = Math.max(0, pExterno * heights.hExterno - aVaosPortasExt - aVaosJanelas);
  const aParedesMuros = Math.max(0, pMuro * heights.hMuro - aVaosPortoes);
  const aParedesTotal = aParedesInternas + aParedesExternas + aParedesMuros;

  // Cobertura e escavação
  const aCobertura = areaConstruida * 1.15;
  const vEscavacao = pTotal * 0.40 * 0.50;

  return {
    pHorizontal: round2(pHorizontal),
    pVertical: round2(pVertical),
    pTotal: round2(pTotal),
    pExterno: round2(pExterno),
    pInterno: round2(pInterno),
    pMuro: round2(pMuro),
    aVaosPortasInt: round2(aVaosPortasInt),
    aVaosPortasExt: round2(aVaosPortasExt),
    aVaosJanelas: round2(aVaosJanelas),
    aVaosPortoes: round2(aVaosPortoes),
    aVaosTotal: round2(aVaosTotal),
    aParedesInternas: round2(aParedesInternas),
    aParedesExternas: round2(aParedesExternas),
    aParedesMuros: round2(aParedesMuros),
    aParedesTotal: round2(aParedesTotal),
    aCobertura: round2(aCobertura),
    vEscavacao: round2(vEscavacao),
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
