'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BDIConfigCardProps {
  bdiAdministration: number;
  bdiProfit: number;
  bdiTaxes: number;
  bdiRisk: number;
  bdiOthers: number;
  bdiPercentage: number;
  onSave: (values: {
    bdiAdministration: number;
    bdiProfit: number;
    bdiTaxes: number;
    bdiRisk: number;
    bdiOthers: number;
    bdiPercentage: number;
  }) => void;
}

export function BDIConfigCard({
  bdiAdministration,
  bdiProfit,
  bdiTaxes,
  bdiRisk,
  bdiOthers,
  bdiPercentage,
  onSave,
}: BDIConfigCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [admin, setAdmin] = useState(bdiAdministration);
  const [profit, setProfit] = useState(bdiProfit);
  const [taxes, setTaxes] = useState(bdiTaxes);
  const [risk, setRisk] = useState(bdiRisk);
  const [others, setOthers] = useState(bdiOthers);

  const totalBDI = admin + profit + taxes + risk + others;

  const handleSave = () => {
    onSave({
      bdiAdministration: admin,
      bdiProfit: profit,
      bdiTaxes: taxes,
      bdiRisk: risk,
      bdiOthers: others,
      bdiPercentage: totalBDI,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Configurar BDI</span>
          <span className="text-sm text-blue-600 font-bold">{bdiPercentage.toFixed(2)}%</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Administração', value: admin, setter: setAdmin },
              { label: 'Lucro', value: profit, setter: setProfit },
              { label: 'Impostos', value: taxes, setter: setTaxes },
              { label: 'Risco', value: risk, setter: setRisk },
              { label: 'Outros', value: others, setter: setOthers },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs text-gray-500 block mb-1">{field.label} (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(e) => field.setter(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total BDI: <strong className="text-blue-600">{totalBDI.toFixed(2)}%</strong>
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar BDI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
