'use client';

import { useState } from 'react';
import { Loader2, Send, Cloud } from 'lucide-react';
import {
  DailyAttestationCard,
  type AttestationEntry,
} from './DailyAttestationCard';

interface DailyAttestationFormProps {
  entries: AttestationEntry[];
  isAttested: boolean;
  dailyLogNotes: string | null;
  dailyLogWeather: string | null;
  onAttest: (data: {
    entries: Array<{
      serviceId: string;
      executedAsPlanned: boolean;
      actualPercent?: number;
    }>;
    notes?: string;
    weather?: string;
  }) => Promise<void>;
}

interface EditState {
  executedAsPlanned: boolean | null;
  actualPercent: number;
  note: string;
}

const WEATHER_OPTIONS = [
  'Ensolarado',
  'Nublado',
  'Parcialmente Nublado',
  'Chuvoso',
  'Chuva Forte',
];

export function DailyAttestationForm({
  entries,
  isAttested,
  dailyLogNotes,
  dailyLogWeather,
  onAttest,
}: DailyAttestationFormProps) {
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const [notes, setNotes] = useState(dailyLogNotes || '');
  const [weather, setWeather] = useState(dailyLogWeather || '');
  const [submitting, setSubmitting] = useState(false);

  const getEditState = (serviceId: string): EditState =>
    editStates[serviceId] || {
      executedAsPlanned: null,
      actualPercent: 0,
      note: '',
    };

  const updateEditState = (serviceId: string, patch: Partial<EditState>) => {
    setEditStates((prev) => ({
      ...prev,
      [serviceId]: { ...getEditState(serviceId), ...patch },
    }));
  };

  const handleToggle = (serviceId: string, value: boolean) => {
    const entry = entries.find((e) => e.serviceId === serviceId);
    updateEditState(serviceId, {
      executedAsPlanned: value,
      actualPercent: value ? (entry?.plannedPercent || 0) : 0,
    });
  };

  const handlePercentChange = (serviceId: string, percent: number) => {
    updateEditState(serviceId, { actualPercent: percent });
  };

  const handleNoteChange = (serviceId: string, note: string) => {
    updateEditState(serviceId, { note });
  };

  const allDecided = entries.every(
    (e) => getEditState(e.serviceId).executedAsPlanned !== null
  );

  const handleSubmit = async () => {
    if (!allDecided || submitting) return;

    setSubmitting(true);
    try {
      await onAttest({
        entries: entries.map((e) => {
          const state = getEditState(e.serviceId);
          return {
            serviceId: e.serviceId,
            executedAsPlanned: state.executedAsPlanned!,
            actualPercent: state.executedAsPlanned
              ? undefined
              : state.actualPercent,
          };
        }),
        notes: notes || undefined,
        weather: weather || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Group entries by stage
  const groupedEntries: Record<
    string,
    { stageName: string; stageOrder: number; entries: AttestationEntry[] }
  > = {};

  for (const entry of entries) {
    const key = entry.stageId;
    if (!groupedEntries[key]) {
      groupedEntries[key] = {
        stageName: entry.service.stageName,
        stageOrder: entry.service.stageOrder,
        entries: [],
      };
    }
    groupedEntries[key].entries.push(entry);
  }

  const sortedGroups = Object.values(groupedEntries).sort(
    (a, b) => a.stageOrder - b.stageOrder
  );

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">
          Nenhum servico programado para esta data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* General fields */}
      {!isAttested && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                <Cloud className="w-3.5 h-3.5" />
                Clima
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Selecionar...</option>
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Observacoes gerais
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas do dia..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Attested general info */}
      {isAttested && (dailyLogWeather || dailyLogNotes) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {dailyLogWeather && (
              <span className="flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5" />
                {dailyLogWeather}
              </span>
            )}
            {dailyLogNotes && <span>{dailyLogNotes}</span>}
          </div>
        </div>
      )}

      {/* Entries grouped by stage */}
      {sortedGroups.map((group) => (
        <div key={group.stageName}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            {group.stageName}
          </h3>
          <div className="space-y-2">
            {group.entries.map((entry) => (
              <DailyAttestationCard
                key={entry.id}
                entry={entry}
                isAttested={isAttested}
                onToggle={handleToggle}
                onPercentChange={handlePercentChange}
                onNoteChange={handleNoteChange}
                editValues={getEditState(entry.serviceId)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Submit button */}
      {!isAttested && entries.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={!allDecided || submitting}
          className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Atestando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Atestar Dia ({entries.length} servicos)
            </>
          )}
        </button>
      )}
    </div>
  );
}
