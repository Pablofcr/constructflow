'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Save,
  Sparkles,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type {
  ExtractedVariables,
  ExtractedWall,
  ExtractedOpening,
  ExtractedRoom,
  DerivedValues,
} from '@/lib/ai/types';
import { computeDerivedValues } from '@/lib/ai/types';

interface VariablesReviewProps {
  budgetAIId: string;
  onGenerateBudget: () => void;
  generating: boolean;
}

type WallClassification = ExtractedWall['classification'];
type OpeningType = ExtractedOpening['type'];
type OpeningLocation = ExtractedOpening['location'];
type RoomType = ExtractedRoom['type'];

const WALL_CLASSIFICATIONS: { value: WallClassification; label: string }[] = [
  { value: 'muro', label: 'Muro' },
  { value: 'ext', label: 'Externa' },
  { value: 'int', label: 'Interna' },
  { value: 'ext/muro', label: 'Ext/Muro' },
];

const OPENING_TYPES: { value: OpeningType; label: string }[] = [
  { value: 'porta', label: 'Porta' },
  { value: 'janela', label: 'Janela' },
  { value: 'portao', label: 'Portao' },
];

const OPENING_LOCATIONS: { value: OpeningLocation; label: string }[] = [
  { value: 'int', label: 'Interna' },
  { value: 'ext', label: 'Externa' },
  { value: 'muro', label: 'Muro' },
];

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'sala', label: 'Sala' },
  { value: 'quarto', label: 'Quarto' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'banheiro', label: 'Banheiro' },
  { value: 'servico', label: 'Servico' },
  { value: 'outro', label: 'Outro' },
];

export function VariablesReview({
  budgetAIId,
  onGenerateBudget,
  generating,
}: VariablesReviewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vars, setVars] = useState<ExtractedVariables | null>(null);
  const [derived, setDerived] = useState<DerivedValues | null>(null);

  const fetchVariables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/budget-ai/${budgetAIId}/variables`);
      if (res.ok) {
        const data: ExtractedVariables = await res.json();
        setVars(data);
        setDerived(computeDerivedValues(data));
      }
    } catch (err) {
      console.error('Erro ao buscar variaveis:', err);
    } finally {
      setLoading(false);
    }
  }, [budgetAIId]);

  useEffect(() => {
    fetchVariables();
  }, [fetchVariables]);

  // Recompute derived whenever vars change
  useEffect(() => {
    if (vars) {
      setDerived(computeDerivedValues(vars));
    }
  }, [vars]);

  const handleSave = async () => {
    if (!vars) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/budget-ai/${budgetAIId}/variables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vars),
      });
      if (res.ok) {
        const updated = await res.json();
        setVars(updated);
        setDerived(computeDerivedValues(updated));
      } else {
        alert('Erro ao salvar variaveis');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof ExtractedVariables>(
    field: K,
    value: ExtractedVariables[K]
  ) => {
    if (!vars) return;
    setVars({ ...vars, [field]: value });
  };

  const updateHeight = (key: keyof ExtractedVariables['heights'], value: number) => {
    if (!vars) return;
    setVars({ ...vars, heights: { ...vars.heights, [key]: value } });
  };

  const updateWall = (index: number, updates: Partial<ExtractedWall>) => {
    if (!vars) return;
    const newWalls = [...vars.walls];
    newWalls[index] = { ...newWalls[index], ...updates };
    setVars({ ...vars, walls: newWalls });
  };

  const addWall = (direction: 'H' | 'V') => {
    if (!vars) return;
    const existing = vars.walls.filter((w) => w.direction === direction);
    const nextNum = existing.length;
    const newWall: ExtractedWall = {
      id: `${direction}${nextNum}`,
      direction,
      length: 0,
      classification: 'int',
      description: '',
    };
    setVars({ ...vars, walls: [...vars.walls, newWall] });
  };

  const removeWall = (index: number) => {
    if (!vars) return;
    const wall = vars.walls[index];
    const newWalls = vars.walls.filter((_, i) => i !== index);
    // Renumber walls of same direction
    let hCount = 0;
    let vCount = 0;
    for (const w of newWalls) {
      if (w.direction === 'H') {
        w.id = `H${hCount}`;
        hCount++;
      } else {
        w.id = `V${vCount}`;
        vCount++;
      }
    }
    setVars({ ...vars, walls: newWalls });
  };

  const updateOpening = (index: number, updates: Partial<ExtractedOpening>) => {
    if (!vars) return;
    const newOpenings = [...vars.openings];
    newOpenings[index] = { ...newOpenings[index], ...updates };
    setVars({ ...vars, openings: newOpenings });
  };

  const addOpening = () => {
    if (!vars) return;
    const newOpening: ExtractedOpening = {
      type: 'porta',
      width: 0.80,
      height: 2.10,
      quantity: 1,
      location: 'int',
      description: '',
    };
    setVars({ ...vars, openings: [...vars.openings, newOpening] });
  };

  const removeOpening = (index: number) => {
    if (!vars) return;
    setVars({ ...vars, openings: vars.openings.filter((_, i) => i !== index) });
  };

  const updateRoom = (index: number, updates: Partial<ExtractedRoom>) => {
    if (!vars) return;
    const newRooms = [...vars.rooms];
    newRooms[index] = { ...newRooms[index], ...updates };
    setVars({ ...vars, rooms: newRooms });
  };

  const addRoom = () => {
    if (!vars) return;
    const newRoom: ExtractedRoom = { name: '', area: 0, type: 'outro' };
    setVars({ ...vars, rooms: [...vars.rooms, newRoom] });
  };

  const removeRoom = (index: number) => {
    if (!vars) return;
    setVars({ ...vars, rooms: vars.rooms.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!vars || !derived) {
    return (
      <div className="text-center py-20 text-gray-500">
        Variaveis nao encontradas
      </div>
    );
  }

  const hWalls = vars.walls.filter((w) => w.direction === 'H');
  const vWalls = vars.walls.filter((w) => w.direction === 'V');

  // Validations
  const validations = {
    paredesVsArea: derived.aParedesTotal >= vars.areaConstruida * 3.5,
    chapiscoInt: derived.aParedesInternas >= vars.areaConstruida * 2,
    chapiscoExt: derived.aParedesExternas + derived.aParedesMuros >= vars.areaConstruida * 1.5,
    hasWalls: vars.walls.length >= 4,
    hasOpenings: vars.openings.length > 0,
  };

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-purple-900">
            Revisao de Variaveis Extraidas pela IA
          </p>
          <p className="text-xs text-purple-700 mt-0.5">
            Confira e corrija os valores abaixo antes de gerar o orcamento.
          </p>
        </div>
      </div>

      {/* AI Notes */}
      {vars.aiNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-800 mb-1">Notas da IA:</p>
          <p className="text-xs text-blue-700 whitespace-pre-wrap">{vars.aiNotes}</p>
        </div>
      )}

      {/* Areas */}
      <Section title="Areas">
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Area Construida (m²)"
            value={vars.areaConstruida}
            onChange={(v) => updateField('areaConstruida', v)}
          />
          <NumberInput
            label="Area Terreno (m²)"
            value={vars.areaTerreno}
            onChange={(v) => updateField('areaTerreno', v)}
          />
        </div>
      </Section>

      {/* Heights */}
      <Section title="Alturas">
        <div className="grid grid-cols-3 gap-4">
          <NumberInput
            label="H_interno (m)"
            value={vars.heights.hInterno}
            onChange={(v) => updateHeight('hInterno', v)}
            step={0.01}
          />
          <NumberInput
            label="H_externo (m)"
            value={vars.heights.hExterno}
            onChange={(v) => updateHeight('hExterno', v)}
            step={0.01}
          />
          <NumberInput
            label="H_muro (m)"
            value={vars.heights.hMuro}
            onChange={(v) => updateHeight('hMuro', v)}
            step={0.01}
          />
        </div>
      </Section>

      {/* Walls */}
      <Section title="Paredes (Metodo H/V)">
        {/* Wall Diagram */}
        <WallDiagram walls={vars.walls} />

        {/* Horizontal walls */}
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Horizontais (frente → fundos)
        </p>
        <div className="space-y-2 mb-4">
          {hWalls.map((wall) => {
            const globalIdx = vars.walls.indexOf(wall);
            return (
              <WallRow
                key={wall.id}
                wall={wall}
                onChange={(updates) => updateWall(globalIdx, updates)}
                onRemove={() => removeWall(globalIdx)}
              />
            );
          })}
          <button
            onClick={() => addWall('H')}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            <Plus className="h-3 w-3" /> Parede H
          </button>
        </div>

        {/* Vertical walls */}
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Verticais (esquerda → direita)
        </p>
        <div className="space-y-2 mb-4">
          {vWalls.map((wall) => {
            const globalIdx = vars.walls.indexOf(wall);
            return (
              <WallRow
                key={wall.id}
                wall={wall}
                onChange={(updates) => updateWall(globalIdx, updates)}
                onRemove={() => removeWall(globalIdx)}
              />
            );
          })}
          <button
            onClick={() => addWall('V')}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            <Plus className="h-3 w-3" /> Parede V
          </button>
        </div>

        {/* Perimeter summary */}
        <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 text-xs">
          <div>
            <span className="text-gray-500">P_horiz = </span>
            <span className="font-bold">{derived.pHorizontal.toFixed(2)}m</span>
          </div>
          <div>
            <span className="text-gray-500">P_vert = </span>
            <span className="font-bold">{derived.pVertical.toFixed(2)}m</span>
          </div>
          <div>
            <span className="text-gray-500">P_total = </span>
            <span className="font-bold">{derived.pTotal.toFixed(2)}m</span>
          </div>
          <div>
            <span className="text-gray-500">P_ext = </span>
            <span className="font-bold">{derived.pExterno.toFixed(2)}m</span>
          </div>
          <div>
            <span className="text-gray-500">P_int = </span>
            <span className="font-bold">{derived.pInterno.toFixed(2)}m</span>
          </div>
          <div>
            <span className="text-gray-500">P_muro = </span>
            <span className="font-bold">{derived.pMuro.toFixed(2)}m</span>
          </div>
        </div>
      </Section>

      {/* Openings */}
      <Section title="Aberturas">
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[80px_60px_60px_50px_70px_1fr_32px] gap-2 text-xs font-medium text-gray-500 px-1">
            <span>Tipo</span>
            <span>Larg.(m)</span>
            <span>Alt.(m)</span>
            <span>Qtd</span>
            <span>Local</span>
            <span>Descricao</span>
            <span></span>
          </div>
          {vars.openings.map((opening, idx) => (
            <OpeningRow
              key={idx}
              opening={opening}
              onChange={(updates) => updateOpening(idx, updates)}
              onRemove={() => removeOpening(idx)}
            />
          ))}
          <button
            onClick={addOpening}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            <Plus className="h-3 w-3" /> Abertura
          </button>
        </div>
      </Section>

      {/* Rooms */}
      <Section title="Ambientes">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 text-xs font-medium text-gray-500 px-1">
            <span>Nome</span>
            <span>Area (m²)</span>
            <span>Tipo</span>
            <span></span>
          </div>
          {vars.rooms.map((room, idx) => (
            <RoomRow
              key={idx}
              room={room}
              onChange={(updates) => updateRoom(idx, updates)}
              onRemove={() => removeRoom(idx)}
            />
          ))}
          <button
            onClick={addRoom}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            <Plus className="h-3 w-3" /> Ambiente
          </button>
        </div>
      </Section>

      {/* Derived Values */}
      <Section title="Valores Derivados (auto-calculados)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <DerivedItem label="A_par_int" value={`${derived.aParedesInternas.toFixed(2)}m²`} />
          <DerivedItem label="A_par_ext" value={`${derived.aParedesExternas.toFixed(2)}m²`} />
          <DerivedItem label="A_par_muro" value={`${derived.aParedesMuros.toFixed(2)}m²`} />
          <DerivedItem label="A_par_total" value={`${derived.aParedesTotal.toFixed(2)}m²`} />
          <DerivedItem label="V_escav" value={`${derived.vEscavacao.toFixed(2)}m³`} />
          <DerivedItem label="A_cobert" value={`${derived.aCobertura.toFixed(2)}m²`} />
          <DerivedItem label="A_vaos_total" value={`${derived.aVaosTotal.toFixed(2)}m²`} />
        </div>

        {/* Validations */}
        <div className="mt-3 space-y-1">
          <ValidationItem
            ok={validations.paredesVsArea}
            label={`A_paredes_total (${derived.aParedesTotal.toFixed(0)}m²) >= 3.5x A_construida (${(vars.areaConstruida * 3.5).toFixed(0)}m²)`}
          />
          <ValidationItem
            ok={validations.chapiscoInt}
            label={`Chapisco int (${derived.aParedesInternas.toFixed(0)}m²) >= A_construida x 2 (${(vars.areaConstruida * 2).toFixed(0)}m²)`}
          />
          <ValidationItem
            ok={validations.chapiscoExt}
            label={`Chapisco ext (${(derived.aParedesExternas + derived.aParedesMuros).toFixed(0)}m²) >= A_construida x 1.5 (${(vars.areaConstruida * 1.5).toFixed(0)}m²)`}
          />
        </div>
      </Section>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
        <Button
          onClick={async () => {
            await handleSave();
            onGenerateBudget();
          }}
          disabled={generating || saving}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Orcamento...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Orcamento com Variaveis Confirmadas
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

function WallDiagram({ walls }: { walls: ExtractedWall[] }) {
  const hWalls = walls.filter((w) => w.direction === 'H');
  const vWalls = walls.filter((w) => w.direction === 'V');

  if (hWalls.length === 0 && vWalls.length === 0) return null;

  const padding = 60;
  const labelSpace = 16;
  const arrowSpace = 28;
  const legendHeight = 24;
  const drawWidth = 400;
  const drawHeight = 300;
  const svgWidth = drawWidth + padding * 2;
  const svgHeight = drawHeight + padding * 2 + arrowSpace + legendHeight;

  // Max lengths for proportional sizing
  const maxH = Math.max(...hWalls.map((w) => w.length), 1);
  const maxV = Math.max(...vWalls.map((w) => w.length), 1);

  // H walls: distributed vertically with uniform spacing
  const hSpacing = hWalls.length > 1 ? drawHeight / (hWalls.length - 1) : 0;
  // V walls: distributed horizontally with uniform spacing
  const vSpacing = vWalls.length > 1 ? drawWidth / (vWalls.length - 1) : 0;

  // Each H wall is a horizontal line, length proportional to wall.length/maxH
  const hLines = hWalls.map((wall, i) => {
    const y = padding + arrowSpace + (hWalls.length === 1 ? drawHeight / 2 : i * hSpacing);
    const lineWidth = (wall.length / maxH) * drawWidth * 0.85;
    const x1 = padding + (drawWidth - lineWidth) / 2;
    const x2 = x1 + lineWidth;
    return { wall, y, x1, x2 };
  });

  // Each V wall is a vertical line, length proportional to wall.length/maxV
  const vLines = vWalls.map((wall, i) => {
    const x = padding + (vWalls.length === 1 ? drawWidth / 2 : i * vSpacing);
    const lineHeight = (wall.length / maxV) * drawHeight * 0.85;
    const y1 = padding + arrowSpace + (drawHeight - lineHeight) / 2;
    const y2 = y1 + lineHeight;
    return { wall, x, y1, y2 };
  });

  // Legend items - only classifications present in walls
  const usedClassifications = [...new Set(walls.map((w) => w.classification))];

  return (
    <div className="mb-4">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full max-w-[520px] mx-auto"
        style={{ height: 'auto' }}
      >
        {/* Background */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} rx="8" fill="#FAFAFA" stroke="#E5E7EB" strokeWidth="1" />

        {/* FRENTE arrow at top */}
        <g>
          <defs>
            <marker id="arrowLeft" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
              <polygon points="6,0 0,2 6,4" fill="#9CA3AF" />
            </marker>
            <marker id="arrowRight" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0,0 6,2 0,4" fill="#9CA3AF" />
            </marker>
          </defs>
          <line
            x1={padding + 60}
            y1={padding - 4}
            x2={padding + drawWidth - 60}
            y2={padding - 4}
            stroke="#9CA3AF"
            strokeWidth="1"
            markerStart="url(#arrowLeft)"
            markerEnd="url(#arrowRight)"
          />
          <text
            x={padding + drawWidth / 2}
            y={padding - 8}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#6B7280"
          >
            FRENTE
          </text>
        </g>

        {/* H walls (horizontal lines) */}
        {hLines.map(({ wall, y, x1, x2 }) => {
          const color = CLASSIFICATION_COLORS[wall.classification];
          const isMuro = wall.classification === 'muro' || wall.classification === 'ext/muro';
          return (
            <g key={wall.id}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={color}
                strokeWidth={isMuro ? 4 : 2.5}
                strokeLinecap="round"
                strokeDasharray={wall.classification === 'int' ? '6,3' : 'none'}
              />
              {/* ID label on the left */}
              <text
                x={x1 - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fontWeight="700"
                fill={color}
              >
                {wall.id}
              </text>
              {/* Length label centered */}
              <text
                x={(x1 + x2) / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="8"
                fill="#374151"
              >
                {wall.length.toFixed(2)}m
              </text>
            </g>
          );
        })}

        {/* V walls (vertical lines) */}
        {vLines.map(({ wall, x, y1, y2 }) => {
          const color = CLASSIFICATION_COLORS[wall.classification];
          const isMuro = wall.classification === 'muro' || wall.classification === 'ext/muro';
          return (
            <g key={wall.id}>
              <line
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke={color}
                strokeWidth={isMuro ? 4 : 2.5}
                strokeLinecap="round"
                strokeDasharray={wall.classification === 'int' ? '6,3' : 'none'}
              />
              {/* ID label on top */}
              <text
                x={x}
                y={y1 - 6}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={color}
              >
                {wall.id}
              </text>
              {/* Length label to the right, rotated */}
              <text
                x={x + 8}
                y={(y1 + y2) / 2}
                textAnchor="middle"
                fontSize="8"
                fill="#374151"
                transform={`rotate(90, ${x + 8}, ${(y1 + y2) / 2})`}
              >
                {wall.length.toFixed(2)}m
              </text>
            </g>
          );
        })}

        {/* FUNDOS label at bottom */}
        <text
          x={padding + drawWidth / 2}
          y={padding + arrowSpace + drawHeight + 18}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#9CA3AF"
        >
          FUNDOS
        </text>

        {/* Legend */}
        {usedClassifications.map((cls, i) => {
          const legendX = padding + i * 100;
          const legendY = svgHeight - legendHeight + 4;
          const color = CLASSIFICATION_COLORS[cls];
          return (
            <g key={cls}>
              <line
                x1={legendX}
                y1={legendY}
                x2={legendX + 20}
                y2={legendY}
                stroke={color}
                strokeWidth={cls === 'muro' || cls === 'ext/muro' ? 3 : 2}
                strokeLinecap="round"
                strokeDasharray={cls === 'int' ? '4,2' : 'none'}
              />
              <text
                x={legendX + 25}
                y={legendY + 3.5}
                fontSize="9"
                fill="#6B7280"
              >
                {CLASSIFICATION_LABELS[cls]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none"
      />
    </div>
  );
}

function WallRow({
  wall,
  onChange,
  onRemove,
}: {
  wall: ExtractedWall;
  onChange: (updates: Partial<ExtractedWall>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[50px_70px_90px_1fr_32px] gap-2 items-center">
      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded text-center">
        {wall.id}
      </span>
      <input
        type="number"
        step={0.01}
        value={wall.length}
        onChange={(e) => onChange({ length: parseFloat(e.target.value) || 0 })}
        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
        placeholder="m"
      />
      <select
        value={wall.classification}
        onChange={(e) => onChange({ classification: e.target.value as WallClassification })}
        className="border border-gray-300 rounded px-1 py-1 text-xs"
      >
        {WALL_CLASSIFICATIONS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={wall.description}
        onChange={(e) => onChange({ description: e.target.value })}
        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
        placeholder="Descricao"
      />
      <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function OpeningRow({
  opening,
  onChange,
  onRemove,
}: {
  opening: ExtractedOpening;
  onChange: (updates: Partial<ExtractedOpening>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[80px_60px_60px_50px_70px_1fr_32px] gap-2 items-center">
      <select
        value={opening.type}
        onChange={(e) => onChange({ type: e.target.value as OpeningType })}
        className="border border-gray-300 rounded px-1 py-1 text-xs"
      >
        {OPENING_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <input
        type="number"
        step={0.01}
        value={opening.width}
        onChange={(e) => onChange({ width: parseFloat(e.target.value) || 0 })}
        className="border border-gray-300 rounded px-1 py-1 text-xs w-full"
      />
      <input
        type="number"
        step={0.01}
        value={opening.height}
        onChange={(e) => onChange({ height: parseFloat(e.target.value) || 0 })}
        className="border border-gray-300 rounded px-1 py-1 text-xs w-full"
      />
      <input
        type="number"
        step={1}
        value={opening.quantity}
        onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 0 })}
        className="border border-gray-300 rounded px-1 py-1 text-xs w-full"
      />
      <select
        value={opening.location}
        onChange={(e) => onChange({ location: e.target.value as OpeningLocation })}
        className="border border-gray-300 rounded px-1 py-1 text-xs"
      >
        {OPENING_LOCATIONS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={opening.description}
        onChange={(e) => onChange({ description: e.target.value })}
        className="border border-gray-300 rounded px-1 py-1 text-xs w-full"
        placeholder="Descricao"
      />
      <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function RoomRow({
  room,
  onChange,
  onRemove,
}: {
  room: ExtractedRoom;
  onChange: (updates: Partial<ExtractedRoom>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
      <input
        type="text"
        value={room.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
        placeholder="Nome"
      />
      <input
        type="number"
        step={0.01}
        value={room.area}
        onChange={(e) => onChange({ area: parseFloat(e.target.value) || 0 })}
        className="border border-gray-300 rounded px-1 py-1 text-xs w-full"
      />
      <select
        value={room.type}
        onChange={(e) => onChange({ type: e.target.value as RoomType })}
        className="border border-gray-300 rounded px-1 py-1 text-xs"
      >
        {ROOM_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function DerivedItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded px-3 py-2">
      <span className="text-gray-500">{label} = </span>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );
}

function ValidationItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-green-700' : 'text-amber-700'}`}>
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
      )}
      {label}
    </div>
  );
}
