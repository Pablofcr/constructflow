import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmProps {
  title: string;
  message: string;
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirm({ title, message, itemName, onConfirm, onCancel }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar');
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      {/* Ícone de Alerta */}
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>

      {/* Título */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

      {/* Mensagem */}
      <p className="text-gray-600 mb-4">{message}</p>

      {/* Item a ser deletado */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-800 font-semibold">{itemName}</p>
      </div>

      {/* Alerta */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
        <p className="text-yellow-800 text-sm">
          ⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados relacionados também serão removidos.
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? "Deletando..." : "Sim, Deletar"}
        </button>
      </div>
    </div>
  );
}
