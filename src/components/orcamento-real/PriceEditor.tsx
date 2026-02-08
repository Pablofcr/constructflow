'use client';

import { useState } from 'react';
import { Check, X, Pencil, RotateCcw } from 'lucide-react';

interface PriceEditorProps {
  currentPrice: number;
  sinapiPrice: number;
  onSave: (newPrice: number) => void;
  onReset?: () => void;
}

export function PriceEditor({ currentPrice, sinapiPrice, onSave, onReset }: PriceEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentPrice.toString());
  const isOverridden = Math.abs(currentPrice - sinapiPrice) > 0.01;

  const handleSave = () => {
    const numVal = parseFloat(value);
    if (!isNaN(numVal) && numVal >= 0) {
      onSave(numVal);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setValue(currentPrice.toString());
    setEditing(false);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">R$</span>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="w-24 px-1.5 py-0.5 border border-blue-400 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button onClick={handleSave} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleCancel} className="p-0.5 text-red-500 hover:bg-red-50 rounded">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-medium ${isOverridden ? 'text-orange-600' : 'text-gray-900'}`}>
        {fmt(currentPrice)}
      </span>
      <button
        onClick={() => { setValue(currentPrice.toString()); setEditing(true); }}
        className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
        title="Editar preço"
      >
        <Pencil className="h-3 w-3" />
      </button>
      {isOverridden && onReset && (
        <button
          onClick={onReset}
          className="p-0.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
          title={`Restaurar SINAPI: ${fmt(sinapiPrice)}`}
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
