'use client';

import { Clock, Cpu, FileText, Zap } from 'lucide-react';

interface AIMetadataBannerProps {
  totalDirectCost: number;
  state?: string;
  aiModel?: string | null;
  aiPromptTokens?: number | null;
  aiOutputTokens?: number | null;
  aiDurationMs?: number | null;
  generatedAt?: string | null;
  filesUsed?: Array<{ fileName: string; category: string }> | null;
}

export function AIMetadataBanner({
  totalDirectCost,
  state,
  aiModel,
  aiPromptTokens,
  aiOutputTokens,
  aiDurationMs,
  generatedAt,
  filesUsed,
}: AIMetadataBannerProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const secs = Math.round(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}m ${remSecs}s`;
  };

  const categoryLabels: Record<string, string> = {
    ARCHITECTURAL: 'Arquitetônico',
    STRUCTURAL: 'Estrutural',
    ELECTRICAL: 'Elétrico',
    HYDRAULIC: 'Hidráulico',
    OTHER: 'Outro',
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-purple-200 text-sm mb-1">Custo Total Estimado pela IA</p>
          <p className="text-2xl md:text-3xl font-bold">{fmt(totalDirectCost)}</p>
        </div>
        {state && (
          <p className="text-purple-200 text-sm">
            Referência SINAPI: {state}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-purple-500/40">
        {aiModel && (
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-300" />
            <div>
              <p className="text-xs text-purple-300">Modelo</p>
              <p className="text-sm font-medium">
                {aiModel.replace('claude-', '').replace('-20250514', '')}
              </p>
            </div>
          </div>
        )}

        {aiDurationMs && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-300" />
            <div>
              <p className="text-xs text-purple-300">Duração</p>
              <p className="text-sm font-medium">{formatDuration(aiDurationMs)}</p>
            </div>
          </div>
        )}

        {(aiPromptTokens || aiOutputTokens) && (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-300" />
            <div>
              <p className="text-xs text-purple-300">Tokens</p>
              <p className="text-sm font-medium">
                {((aiPromptTokens || 0) + (aiOutputTokens || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {generatedAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-300" />
            <div>
              <p className="text-xs text-purple-300">Gerado em</p>
              <p className="text-sm font-medium">
                {new Date(generatedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}
      </div>

      {filesUsed && filesUsed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-500/40">
          <p className="text-xs text-purple-300 mb-2 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            PDFs Analisados
          </p>
          <div className="flex flex-wrap gap-2">
            {filesUsed.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded bg-purple-500/30 text-xs"
              >
                {f.fileName}
                <span className="ml-1 text-purple-300">
                  ({categoryLabels[f.category] || f.category})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
