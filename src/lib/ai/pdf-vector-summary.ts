// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Formata dados vetoriais extraídos do PDF em texto para injetar no prompt
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { PdfVectorExtractionResult, PdfLine, PdfDimension, PdfTextItem, PageVectorData } from './pdf-vector-extract';

const MAX_LINES_PER_PAGE = 30;
const MAX_DIMS_PER_PAGE = 40;

export function formatVectorDataForPrompt(
  results: PdfVectorExtractionResult[]
): string {
  const vectorResults = results.filter((r) => r.isVectorPdf);
  if (vectorResults.length === 0) return '';

  const sections: string[] = ['=== DADOS VETORIAIS EXTRAIDOS DOS PDFs ==='];

  for (const result of vectorResults) {
    for (const page of result.pages) {
      if (!page.isVectorPdf) continue;
      sections.push(formatPage(result.fileName, page));
    }
  }

  return sections.join('\n\n');
}

function formatPage(fileName: string, page: PageVectorData): string {
  const parts: string[] = [];

  parts.push(
    `Arquivo: ${fileName} | Pagina ${page.pageNumber} (${Math.round(page.width)}x${Math.round(page.height)} pts)` +
    (page.detectedScale ? ` | Escala: ${page.detectedScale}` : '')
  );

  // Regions
  if (page.regions.length > 0) {
    parts.push('--- REGIOES DETECTADAS ---');
    for (const r of page.regions) {
      const yMinPct = toPctY(r.bounds.yMin, page.height);
      const yMaxPct = toPctY(r.bounds.yMax, page.height);
      const yLo = Math.min(yMinPct, yMaxPct);
      const yHi = Math.max(yMinPct, yMaxPct);
      parts.push(`  - "${r.label}" (y: ${yLo.toFixed(0)}%-${yHi.toFixed(0)}% da pagina)`);
    }
  }

  // Significant lines
  if (page.significantLines.length > 0) {
    parts.push(formatLines(page.significantLines, page.width, page.height));
  }

  // Dimension texts
  if (page.dimensionTexts.length > 0) {
    parts.push(formatDimensions(page.dimensionTexts, page.significantLines, page.width, page.height));
  }

  // Room/environment texts
  const roomTexts = findRoomTexts(page.allTextItems);
  if (roomTexts.length > 0) {
    parts.push('--- TEXTOS DE AMBIENTES ---');
    for (const t of roomTexts) {
      const px = toPctX(t.x, page.width);
      const py = toPctY(t.y, page.height);
      parts.push(`  "${t.text}" em (${px.toFixed(0)}%, ${py.toFixed(0)}%)`);
    }
  }

  return parts.join('\n');
}

// ── Formatar linhas ──────────────────────────────────────────────────────────

function formatLines(lines: PdfLine[], w: number, h: number): string {
  const top = lines.slice(0, MAX_LINES_PER_PAGE);
  const hLines = top.filter((l) => l.orientation === 'H');
  const vLines = top.filter((l) => l.orientation === 'V');

  const parts: string[] = [`--- LINHAS SIGNIFICATIVAS (top ${top.length} por comprimento) ---`];

  if (hLines.length > 0) {
    parts.push('Horizontais:');
    hLines.forEach((l, i) => {
      const y = toPctY(l.y1, h);
      const x1 = toPctX(l.x1, w);
      const x2 = toPctX(l.x2, w);
      const xLo = Math.min(x1, x2);
      const xHi = Math.max(x1, x2);
      parts.push(`  L${i}: y=${y.toFixed(0)}%, x: ${xLo.toFixed(0)}%-${xHi.toFixed(0)}% (${l.length.toFixed(0)}pts), espessura=${l.strokeWidth.toFixed(1)}pt`);
    });
  }

  if (vLines.length > 0) {
    parts.push('Verticais:');
    vLines.forEach((l, i) => {
      const x = toPctX(l.x1, w);
      const y1 = toPctY(l.y1, h);
      const y2 = toPctY(l.y2, h);
      const yLo = Math.min(y1, y2);
      const yHi = Math.max(y1, y2);
      parts.push(`  L${i}: x=${x.toFixed(0)}%, y: ${yLo.toFixed(0)}%-${yHi.toFixed(0)}% (${l.length.toFixed(0)}pts), espessura=${l.strokeWidth.toFixed(1)}pt`);
    });
  }

  return parts.join('\n');
}

// ── Formatar cotas ───────────────────────────────────────────────────────────

function formatDimensions(
  dims: PdfDimension[],
  lines: PdfLine[],
  w: number, h: number
): string {
  const parts: string[] = ['--- COTAS NUMERICAS ---'];
  const topDims = dims.slice(0, MAX_DIMS_PER_PAGE);

  for (const d of topDims) {
    const px = toPctX(d.x, w);
    const py = toPctY(d.y, h);
    const nearLine = findNearestLine(d, lines, w, h);
    const nearInfo = nearLine ? ` — proxima a linha ${nearLine}` : '';
    parts.push(`  "${d.text}" em (${px.toFixed(0)}%, ${py.toFixed(0)}%)${nearInfo}`);
  }

  return parts.join('\n');
}

function findNearestLine(
  dim: PdfDimension,
  lines: PdfLine[],
  w: number, h: number
): string | null {
  const dx = dim.x;
  const dy = dim.y;
  let bestDist = Infinity;
  let bestLabel = '';

  const hLines = lines.filter((l) => l.orientation === 'H');
  const vLines = lines.filter((l) => l.orientation === 'V');

  hLines.forEach((l, i) => {
    const dist = Math.abs(dy - l.y1);
    if (dist < bestDist && dist < h * 0.05) {
      bestDist = dist;
      bestLabel = `H${i}`;
    }
  });

  vLines.forEach((l, i) => {
    const dist = Math.abs(dx - l.x1);
    if (dist < bestDist && dist < w * 0.05) {
      bestDist = dist;
      bestLabel = `V${i}`;
    }
  });

  return bestLabel || null;
}

// ── Detectar textos de ambientes ─────────────────────────────────────────────

const ROOM_KEYWORDS = [
  'sala', 'quarto', 'cozinha', 'banheiro', 'wc', 'lavabo',
  'suite', 'suíte', 'varanda', 'garagem', 'area', 'área',
  'servico', 'serviço', 'lavanderia', 'hall', 'circulacao',
  'circulação', 'corredor', 'despensa', 'escritorio', 'escritório',
  'closet', 'sacada', 'terraço', 'terraco',
];

function findRoomTexts(textItems: PdfTextItem[]): PdfTextItem[] {
  return textItems.filter((item) => {
    const lower = item.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return ROOM_KEYWORDS.some((kw) => {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return lower.includes(kwNorm);
    });
  });
}

// ── Coordenadas: PDF Y bottom-up → percentual top-left ──────────────────────

function toPctX(pdfX: number, pageWidth: number): number {
  return (pdfX / pageWidth) * 100;
}

function toPctY(pdfY: number, pageHeight: number): number {
  return (1 - pdfY / pageHeight) * 100;
}
