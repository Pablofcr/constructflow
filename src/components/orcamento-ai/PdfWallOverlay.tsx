'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import type { ExtractedWall, FloorPlan } from '@/lib/ai/types';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const CLASSIFICATION_COLORS: Record<ExtractedWall['classification'], string> = {
  muro: '#6B7280',
  ext: '#3B82F6',
  int: '#A855F7',
  'ext/muro': '#14B8A6',
};

const CLASSIFICATION_LABELS: Record<ExtractedWall['classification'], string> = {
  muro: 'Muro',
  ext: 'Externa',
  int: 'Interna',
  'ext/muro': 'Ext/Muro',
};

interface PdfWallOverlayProps {
  projectId: string;
  floorPlans: FloorPlan[];
  walls: ExtractedWall[];
}

export function PdfWallOverlay({ projectId, floorPlans, walls }: PdfWallOverlayProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  const activePlan = floorPlans[activeTab];
  if (!activePlan) return null;

  // Filter walls that belong to this floor plan
  const planWalls = walls.filter(
    (w) => w.floorPlanIndex === activeTab && w.coordinates
  );

  const pdfUrl = activePlan.fileId
    ? `/api/projects/${projectId}/files/${activePlan.fileId}/download`
    : null;

  const onPageLoadSuccess = useCallback(
    (page: { width: number; height: number }) => {
      setPageWidth(page.width);
      setPageHeight(page.height);
    },
    []
  );

  const usedClassifications = [
    ...new Set(planWalls.map((w) => w.classification)),
  ];

  return (
    <div className="mb-4">
      {/* Tabs for multiple floor plans */}
      {floorPlans.length > 1 && (
        <div className="flex gap-1 mb-3">
          {floorPlans.map((fp, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg border border-b-0 transition-colors ${
                idx === activeTab
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {fp.label}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors"
          title={showOverlay ? 'Ocultar paredes' : 'Mostrar paredes'}
        >
          {showOverlay ? (
            <><EyeOff className="h-3.5 w-3.5" /> Ocultar Paredes</>
          ) : (
            <><Eye className="h-3.5 w-3.5" /> Mostrar Paredes</>
          )}
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            disabled={scale <= 0.5}
            className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            title="Diminuir zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.0, s + 0.25))}
            disabled={scale >= 2.0}
            className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* PDF + Overlay */}
      {pdfUrl ? (
        <div className="border border-gray-200 rounded-lg overflow-auto max-h-[700px] bg-gray-100">
          <div className="relative inline-block">
            <Document
              file={pdfUrl}
              loading={
                <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                  Carregando PDF...
                </div>
              }
              error={
                <div className="flex items-center justify-center py-20 text-sm text-red-400">
                  Erro ao carregar PDF
                </div>
              }
            >
              <Page
                pageNumber={activePlan.pageNumber}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
              />
            </Document>

            {/* SVG Overlay */}
            {showOverlay && pageWidth > 0 && pageHeight > 0 && (
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={pageWidth * scale}
                height={pageHeight * scale}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {planWalls.map((wall) => {
                  const coords = wall.coordinates!;
                  const color = CLASSIFICATION_COLORS[wall.classification];
                  const isMuro =
                    wall.classification === 'muro' ||
                    wall.classification === 'ext/muro';

                  return (
                    <g key={wall.id}>
                      <line
                        x1={coords.x1}
                        y1={coords.y1}
                        x2={coords.x2}
                        y2={coords.y2}
                        stroke={color}
                        strokeWidth={isMuro ? 0.8 : 0.5}
                        strokeLinecap="round"
                        strokeDasharray={
                          wall.classification === 'int' ? '1,0.5' : 'none'
                        }
                        vectorEffect="non-scaling-stroke"
                        style={{
                          strokeWidth: isMuro ? 3 : 2,
                        }}
                      />
                      {/* Label at midpoint */}
                      <g
                        transform={`translate(${(coords.x1 + coords.x2) / 2}, ${(coords.y1 + coords.y2) / 2})`}
                      >
                        <rect
                          x="-2.5"
                          y="-1.5"
                          width="5"
                          height="3"
                          rx="0.5"
                          fill="white"
                          fillOpacity="0.85"
                          stroke={color}
                          strokeWidth="0.15"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="1.8"
                          fontWeight="700"
                          fill={color}
                          fontFamily="monospace"
                        >
                          {wall.id}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400 bg-gray-50">
          Arquivo PDF nao encontrado para esta planta baixa
        </div>
      )}

      {/* Legend */}
      {showOverlay && usedClassifications.length > 0 && (
        <div className="flex items-center gap-4 mt-2 px-1">
          {usedClassifications.map((cls) => {
            const color = CLASSIFICATION_COLORS[cls];
            const isMuro = cls === 'muro' || cls === 'ext/muro';
            return (
              <div key={cls} className="flex items-center gap-1.5">
                <svg width="20" height="8">
                  <line
                    x1="0"
                    y1="4"
                    x2="20"
                    y2="4"
                    stroke={color}
                    strokeWidth={isMuro ? 3 : 2}
                    strokeLinecap="round"
                    strokeDasharray={cls === 'int' ? '4,2' : 'none'}
                  />
                </svg>
                <span className="text-xs text-gray-600">
                  {CLASSIFICATION_LABELS[cls]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
