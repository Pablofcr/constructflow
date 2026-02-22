// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Extração de Dados Vetoriais do PDF (pdfjs-dist)
// Extrai linhas, textos e cotas diretamente dos operadores PDF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface PdfLine {
  x1: number; y1: number;
  x2: number; y2: number;
  length: number;
  orientation: 'H' | 'V' | 'D';
  strokeWidth: number;
}

export interface PdfTextItem {
  text: string;
  x: number; y: number;
  fontSize: number;
}

export interface PdfDimension {
  value: number;
  text: string;
  x: number; y: number;
  unit: 'm' | 'cm' | 'mm' | 'unknown';
}

export interface PageRegion {
  label: string;
  bounds: { xMin: number; yMin: number; xMax: number; yMax: number };
}

export interface PageVectorData {
  pageNumber: number;
  width: number; height: number;
  significantLines: PdfLine[];
  dimensionTexts: PdfDimension[];
  allTextItems: PdfTextItem[];
  detectedScale: string | null;
  regions: PageRegion[];
  isVectorPdf: boolean;
}

export interface PdfVectorExtractionResult {
  fileName: string;
  pages: PageVectorData[];
  isVectorPdf: boolean;
}

// ── Extração principal ───────────────────────────────────────────────────────

export async function extractPdfVectorData(
  buffer: Buffer,
  fileName: string
): Promise<PdfVectorExtractionResult> {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  const pages: PageVectorData[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const pageData = await extractPageVectorData(page, i);
    pages.push(pageData);
    page.cleanup();
  }

  doc.destroy();

  const hasVectors = pages.some((p) => p.isVectorPdf);

  return { fileName, pages, isVectorPdf: hasVectors };
}

// ── Por página ───────────────────────────────────────────────────────────────

async function extractPageVectorData(
  page: PDFPageProxy,
  pageNumber: number
): Promise<PageVectorData> {
  const viewport = page.getViewport({ scale: 1.0 });
  const { width, height } = viewport;

  // Extract operators (lines)
  const opList = await page.getOperatorList();
  const rawLines = extractLinesFromOperators(opList.fnArray, opList.argsArray);
  const significantLines = filterSignificantLines(rawLines, width, height);

  // Extract texts
  const textContent = await page.getTextContent();
  const allTextItems: PdfTextItem[] = [];
  for (const item of textContent.items) {
    if (!('str' in item) || !item.str?.trim()) continue;
    allTextItems.push({
      text: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
      fontSize: item.height || Math.abs(item.transform[3]),
    });
  }

  const dimensionTexts = extractDimensionTexts(allTextItems);
  const detectedScale = detectScale(allTextItems);
  const regions = detectPageRegions(allTextItems, width, height);
  const isVector = checkIsVectorPdf(significantLines, allTextItems);

  return {
    pageNumber, width, height,
    significantLines, dimensionTexts, allTextItems,
    detectedScale, regions, isVectorPdf: isVector,
  };
}

// ── Extração de linhas dos operadores PDF ────────────────────────────────────

function extractLinesFromOperators(
  fnArray: Uint32Array | number[],
  argsArray: unknown[][]
): PdfLine[] {
  const lines: PdfLine[] = [];
  let strokeWidth = 1;

  // CTM stack for coordinate transforms
  const ctmStack: number[][] = [];
  let ctm = [1, 0, 0, 1, 0, 0]; // identity

  // Current path tracking
  let pathX = 0;
  let pathY = 0;

  function transformPoint(x: number, y: number): [number, number] {
    return [
      ctm[0] * x + ctm[2] * y + ctm[4],
      ctm[1] * x + ctm[3] * y + ctm[5],
    ];
  }

  function addLine(x1: number, y1: number, x2: number, y2: number) {
    const [tx1, ty1] = transformPoint(x1, y1);
    const [tx2, ty2] = transformPoint(x2, y2);
    const dx = tx2 - tx1;
    const dy = ty2 - ty1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.5) return; // skip micro segments

    const angle = Math.abs(Math.atan2(dy, dx));
    let orientation: 'H' | 'V' | 'D';
    if (angle < 0.1 || angle > Math.PI - 0.1) {
      orientation = 'H';
    } else if (Math.abs(angle - Math.PI / 2) < 0.1) {
      orientation = 'V';
    } else {
      orientation = 'D';
    }

    lines.push({
      x1: tx1, y1: ty1, x2: tx2, y2: ty2,
      length: len, orientation, strokeWidth,
    });
  }

  for (let i = 0; i < fnArray.length; i++) {
    const op = fnArray[i];
    const args = argsArray[i];

    switch (op) {
      case OPS.save:
        ctmStack.push([...ctm]);
        break;

      case OPS.restore:
        if (ctmStack.length > 0) ctm = ctmStack.pop()!;
        break;

      case OPS.transform: {
        const [a, b, c, d, e, f] = args as number[];
        const newCtm = [
          ctm[0] * a + ctm[2] * b,
          ctm[1] * a + ctm[3] * b,
          ctm[0] * c + ctm[2] * d,
          ctm[1] * c + ctm[3] * d,
          ctm[0] * e + ctm[2] * f + ctm[4],
          ctm[1] * e + ctm[3] * f + ctm[5],
        ];
        ctm = newCtm;
        break;
      }

      case OPS.setLineWidth:
        strokeWidth = (args as number[])[0] || 1;
        break;

      case OPS.moveTo:
        pathX = (args as number[])[0];
        pathY = (args as number[])[1];
        break;

      case OPS.lineTo: {
        const lx = (args as number[])[0];
        const ly = (args as number[])[1];
        addLine(pathX, pathY, lx, ly);
        pathX = lx;
        pathY = ly;
        break;
      }

      case OPS.rectangle: {
        const [rx, ry, rw, rh] = args as number[];
        addLine(rx, ry, rx + rw, ry);
        addLine(rx + rw, ry, rx + rw, ry + rh);
        addLine(rx + rw, ry + rh, rx, ry + rh);
        addLine(rx, ry + rh, rx, ry);
        break;
      }

      case OPS.constructPath: {
        // pdfjs v5 format: [ops[], data[], minMax[]]
        const pathOps = args[0] as number[];
        const pathData = args[1] as number[];
        let dataIdx = 0;

        for (const pathOp of pathOps) {
          if (pathOp === OPS.moveTo) {
            pathX = pathData[dataIdx++];
            pathY = pathData[dataIdx++];
          } else if (pathOp === OPS.lineTo) {
            const lx = pathData[dataIdx++];
            const ly = pathData[dataIdx++];
            addLine(pathX, pathY, lx, ly);
            pathX = lx;
            pathY = ly;
          } else if (pathOp === OPS.rectangle) {
            const rx = pathData[dataIdx++];
            const ry = pathData[dataIdx++];
            const rw = pathData[dataIdx++];
            const rh = pathData[dataIdx++];
            addLine(rx, ry, rx + rw, ry);
            addLine(rx + rw, ry, rx + rw, ry + rh);
            addLine(rx + rw, ry + rh, rx, ry + rh);
            addLine(rx, ry + rh, rx, ry);
            pathX = rx;
            pathY = ry;
          } else {
            // curveTo consumes 6 data points, closePath consumes 0
            if (pathOp === 15) dataIdx += 6; // OPS.curveTo
          }
        }
        break;
      }
    }
  }

  return lines;
}

// ── Filtrar linhas significativas ────────────────────────────────────────────

function filterSignificantLines(
  lines: PdfLine[],
  pageWidth: number,
  pageHeight: number
): PdfLine[] {
  const minDim = Math.min(pageWidth, pageHeight);
  const minLength = minDim * 0.01; // 1% of page
  const margin = minDim * 0.02;    // 2% margin

  let filtered = lines.filter((l) => {
    // Remove too short
    if (l.length < minLength) return false;
    // Remove thick lines (borders/frames)
    if (l.strokeWidth > 4) return false;
    // Remove diagonal lines (not walls)
    if (l.orientation === 'D') return false;
    // Remove lines in page margins
    const pts = [l.x1, l.y1, l.x2, l.y2];
    const inMargin = pts.some((v, idx) => {
      const dim = idx % 2 === 0 ? pageWidth : pageHeight;
      return v < margin || v > dim - margin;
    });
    if (inMargin) return false;
    return true;
  });

  // Remove hatch patterns (clusters of many short parallel lines)
  filtered = removeHatchPatterns(filtered);

  // Deduplicate overlapping lines
  filtered = deduplicateLines(filtered);

  // Sort by length descending
  filtered.sort((a, b) => b.length - a.length);

  return filtered;
}

function removeHatchPatterns(lines: PdfLine[]): PdfLine[] {
  // Group by orientation + approximate position
  const bucketSize = 2; // 2pt tolerance
  const hBuckets = new Map<number, PdfLine[]>();
  const vBuckets = new Map<number, PdfLine[]>();

  for (const line of lines) {
    if (line.orientation === 'H') {
      const bucket = Math.round(line.y1 / bucketSize);
      if (!hBuckets.has(bucket)) hBuckets.set(bucket, []);
      hBuckets.get(bucket)!.push(line);
    } else if (line.orientation === 'V') {
      const bucket = Math.round(line.x1 / bucketSize);
      if (!vBuckets.has(bucket)) vBuckets.set(bucket, []);
      vBuckets.get(bucket)!.push(line);
    }
  }

  // Lines that belong to hatch clusters (many parallel short lines at similar positions)
  const hatchLines = new Set<PdfLine>();

  for (const bucket of [hBuckets, vBuckets]) {
    for (const [, group] of bucket) {
      // If many short lines at same level, likely hatch
      if (group.length > 10) {
        const avgLen = group.reduce((s, l) => s + l.length, 0) / group.length;
        const maxLen = Math.max(...group.map((l) => l.length));
        // Hatch: many short lines of similar length
        if (maxLen < 50 && avgLen < 30) {
          for (const l of group) hatchLines.add(l);
        }
      }
    }
  }

  return lines.filter((l) => !hatchLines.has(l));
}

function deduplicateLines(lines: PdfLine[]): PdfLine[] {
  const result: PdfLine[] = [];
  const tolerance = 3; // 3pt

  for (const line of lines) {
    const isDuplicate = result.some((existing) => {
      if (existing.orientation !== line.orientation) return false;
      if (line.orientation === 'H') {
        return (
          Math.abs(existing.y1 - line.y1) < tolerance &&
          Math.abs(existing.x1 - line.x1) < tolerance &&
          Math.abs(existing.x2 - line.x2) < tolerance
        );
      } else {
        return (
          Math.abs(existing.x1 - line.x1) < tolerance &&
          Math.abs(existing.y1 - line.y1) < tolerance &&
          Math.abs(existing.y2 - line.y2) < tolerance
        );
      }
    });
    if (!isDuplicate) result.push(line);
  }

  return result;
}

// ── Extrair cotas numéricas ──────────────────────────────────────────────────

function extractDimensionTexts(textItems: PdfTextItem[]): PdfDimension[] {
  const dimRegex = /^(\d{1,3})[.,](\d{1,2})$/;
  const dimensions: PdfDimension[] = [];

  for (const item of textItems) {
    const match = item.text.match(dimRegex);
    if (!match) continue;

    const intPart = match[1];
    const decPart = match[2];
    const value = parseFloat(`${intPart}.${decPart}`);

    // Skip unreasonable values for architectural dimensions
    if (value <= 0 || value > 200) continue;

    // Infer unit based on value range
    let unit: 'm' | 'cm' | 'mm' | 'unknown' = 'unknown';
    if (value >= 0.1 && value <= 50) unit = 'm';
    else if (value >= 10 && value <= 5000) unit = 'cm';

    dimensions.push({
      value, text: item.text,
      x: item.x, y: item.y, unit,
    });
  }

  return dimensions;
}

// ── Detectar escala ──────────────────────────────────────────────────────────

function detectScale(textItems: PdfTextItem[]): string | null {
  const scaleRegex = /(?:escala|esc\.?)\s*[:\-]?\s*1\s*[:/]\s*(\d+)/i;
  const shortRegex = /^1\s*[:/]\s*(\d+)$/;

  for (const item of textItems) {
    const m1 = item.text.match(scaleRegex);
    if (m1) return `1:${m1[1]}`;

    const m2 = item.text.match(shortRegex);
    if (m2) return `1:${m2[1]}`;
  }

  return null;
}

// ── Detectar regiões da página ───────────────────────────────────────────────

function detectPageRegions(
  textItems: PdfTextItem[],
  pageWidth: number,
  pageHeight: number
): PageRegion[] {
  const keywords: Record<string, string[]> = {
    'Planta Baixa': ['planta baixa', 'planta do pavimento', 'pav. terreo', 'pavimento terreo', 'planta humanizada'],
    'Planta de Coberta': ['planta de coberta', 'coberta', 'cobertura', 'planta de cobertura', 'planta coberta'],
    'Planta de Situação': ['situacao', 'situação', 'planta de situacao', 'planta de situação', 'localizacao'],
    'Implantação': ['implantacao', 'implantação', 'planta de implantacao'],
    'Corte': ['corte a', 'corte b', 'corte aa', 'corte bb', 'corte longitudinal', 'corte transversal'],
    'Fachada': ['fachada', 'elevacao', 'elevação'],
  };

  const regions: PageRegion[] = [];

  for (const [label, terms] of Object.entries(keywords)) {
    for (const item of textItems) {
      const textLower = item.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matches = terms.some((t) => {
        const termNorm = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return textLower.includes(termNorm);
      });

      if (matches) {
        // Estimate region around the label (extend 30% of page in each direction)
        const extend = 0.3;
        regions.push({
          label,
          bounds: {
            xMin: Math.max(0, item.x - pageWidth * extend),
            yMin: Math.max(0, item.y - pageHeight * extend),
            xMax: Math.min(pageWidth, item.x + pageWidth * extend),
            yMax: Math.min(pageHeight, item.y + pageHeight * extend),
          },
        });
        break; // One match per label type
      }
    }
  }

  return regions;
}

// ── Verificar se PDF é vetorial ──────────────────────────────────────────────

function checkIsVectorPdf(lines: PdfLine[], textItems: PdfTextItem[]): boolean {
  return lines.length >= 5 && textItems.length >= 3;
}
