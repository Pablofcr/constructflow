'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Loader2, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoomInput {
  name: string;
  type: string;
  area: number;
  width?: number;
  length?: number;
}

interface GenerateDetailedDialogProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onGenerated: (budgetId: string) => void;
}

const ROOM_TYPES = [
  { value: 'quarto', label: 'Quarto' },
  { value: 'sala', label: 'Sala' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'banheiro', label: 'Banheiro' },
  { value: 'servico', label: 'Area de Servico' },
  { value: 'outro', label: 'Outro' },
];

const PADRAO_OPTIONS = [
  { value: 'POPULAR', label: 'Popular' },
  { value: 'BAIXO_PADRAO', label: 'Baixo Padrao' },
  { value: 'MEDIO_PADRAO', label: 'Medio Padrao' },
  { value: 'ALTO_PADRAO', label: 'Alto Padrao' },
];

const DEFAULT_ROOMS: RoomInput[] = [
  { name: 'Sala', type: 'sala', area: 15 },
  { name: 'Cozinha', type: 'cozinha', area: 8 },
  { name: 'Quarto 1', type: 'quarto', area: 10 },
  { name: 'Quarto 2', type: 'quarto', area: 9 },
  { name: 'Banheiro', type: 'banheiro', area: 4 },
  { name: 'Area de Servico', type: 'servico', area: 3 },
];

export function GenerateDetailedDialog({
  open,
  projectId,
  onClose,
  onGenerated,
}: GenerateDetailedDialogProps) {
  const [areaConstruida, setAreaConstruida] = useState(60);
  const [areaTerreno, setAreaTerreno] = useState(200);
  const [padrao, setPadrao] = useState('POPULAR');
  const [numFloors, setNumFloors] = useState(1);
  const [rooms, setRooms] = useState<RoomInput[]>(DEFAULT_ROOMS);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const addRoom = () => {
    setRooms([...rooms, { name: '', type: 'outro', area: 0 }]);
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, field: keyof RoomInput, value: string | number) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    setRooms(updated);
  };

  const handleGenerate = async () => {
    if (areaConstruida <= 0 || areaTerreno <= 0) {
      setError('Areas devem ser maiores que zero');
      return;
    }
    if (rooms.length === 0) {
      setError('Adicione pelo menos um comodo');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const res = await fetch('/api/budget-detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          areaConstruida,
          areaTerreno,
          padrao,
          rooms: rooms.map(r => ({
            name: r.name,
            type: r.type,
            area: Number(r.area),
            width: r.width ? Number(r.width) : undefined,
            length: r.length ? Number(r.length) : undefined,
          })),
          numFloors,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao gerar orcamento');
        return;
      }

      const data = await res.json();
      onGenerated(data.id);
    } catch (err) {
      console.error('Erro ao gerar orcamento detalhado:', err);
      setError('Erro de conexao. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Ruler className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Gerar Orcamento Detalhado</h2>
              <p className="text-sm text-gray-500">Indices de consumo por m2</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Areas + Padrao */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area Construida (m2)
              </label>
              <input
                type="number"
                value={areaConstruida}
                onChange={(e) => setAreaConstruida(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area do Terreno (m2)
              </label>
              <input
                type="number"
                value={areaTerreno}
                onChange={(e) => setAreaTerreno(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Padrao de Acabamento
              </label>
              <select
                value={padrao}
                onChange={(e) => setPadrao(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {PADRAO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pavimentos
              </label>
              <input
                type="number"
                value={numFloors}
                onChange={(e) => setNumFloors(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min={1}
                max={5}
              />
            </div>
          </div>

          {/* Rooms */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Comodos</label>
              <Button
                variant="outline"
                size="sm"
                onClick={addRoom}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {rooms.map((room, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                  <input
                    type="text"
                    value={room.name}
                    onChange={(e) => updateRoom(index, 'name', e.target.value)}
                    placeholder="Nome"
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm min-w-0"
                  />
                  <select
                    value={room.type}
                    onChange={(e) => updateRoom(index, 'type', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28"
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={room.area}
                    onChange={(e) => updateRoom(index, 'area', Number(e.target.value))}
                    placeholder="m2"
                    className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm text-right"
                    min={0}
                  />
                  <span className="text-xs text-gray-400">m2</span>
                  <button
                    onClick={() => removeRoom(index)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancelar
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Ruler className="h-4 w-4 mr-2" />
                Gerar Orcamento
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
