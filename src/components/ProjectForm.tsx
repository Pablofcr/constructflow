import { useState, FormEvent } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface ProjectFormData {
  codigo: string;
  nome: string;
  descricao: string;
  status: string;
  progresso: number;
  orcamento: number;
  gastos: number;
  dataInicio: string;
  prazoFinal: string;
  localizacao: string;
  equipeTotal: number;
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  isEdit?: boolean;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({ initialData, isEdit = false, onSubmit, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    codigo: initialData?.codigo || "",
    nome: initialData?.nome || "",
    descricao: initialData?.descricao || "",
    status: initialData?.status || "Planejamento",
    progresso: initialData?.progresso || 0,
    orcamento: initialData?.orcamento || 0,
    gastos: initialData?.gastos || 0,
    dataInicio: initialData?.dataInicio ? new Date(initialData.dataInicio).toISOString().split('T')[0] : "",
    prazoFinal: initialData?.prazoFinal ? new Date(initialData.prazoFinal).toISOString().split('T')[0] : "",
    localizacao: initialData?.localizacao || "",
    equipeTotal: initialData?.equipeTotal || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro ao começar a digitar
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação adicional
    if (!formData.codigo.trim()) {
      setError("Código do projeto é obrigatório");
      setLoading(false);
      return;
    }

    if (!formData.nome.trim()) {
      setError("Nome do projeto é obrigatório");
      setLoading(false);
      return;
    }

    if (!formData.descricao.trim()) {
      setError("Descrição é obrigatória");
      setLoading(false);
      return;
    }

    if (!formData.dataInicio) {
      setError("Data de início é obrigatória");
      setLoading(false);
      return;
    }

    if (!formData.prazoFinal) {
      setError("Prazo final é obrigatório");
      setLoading(false);
      return;
    }

    if (!formData.localizacao.trim()) {
      setError("Localização é obrigatória");
      setLoading(false);
      return;
    }

    if (formData.orcamento <= 0) {
      setError("Orçamento deve ser maior que zero");
      setLoading(false);
      return;
    }

    try {
      console.log('Enviando dados:', formData); // DEBUG
      await onSubmit(formData);
    } catch (err: any) {
      console.error('Erro completo:', err); // DEBUG
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao salvar projeto';
      
      if (err.message) {
        if (err.message.includes('código')) {
          errorMessage = 'Este código já existe. Use outro código único.';
        } else if (err.message.includes('duplicat')) {
          errorMessage = 'Já existe um projeto com este código.';
        } else if (err.message.includes('required')) {
          errorMessage = 'Preencha todos os campos obrigatórios.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">Erro ao criar projeto</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Código e Nome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código do Projeto *
          </label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
            disabled={isEdit}
            placeholder="Ex: OBR-2025-001"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {isEdit && (
            <p className="text-xs text-gray-500 mt-1">O código não pode ser alterado</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Projeto *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            placeholder="Ex: Edifício Residencial"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição *
        </label>
        <textarea
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Descreva o projeto..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Status e Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Planejamento">Planejamento</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Em Pausa">Em Pausa</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Progresso (%) - valor: {formData.progresso}%
          </label>
          <input
            type="number"
            name="progresso"
            value={formData.progresso}
            onChange={handleChange}
            min="0"
            max="100"
            placeholder="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(Number(formData.progresso) || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Orçamento e Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orçamento (R$) *
          </label>
          <input
            type="number"
            name="orcamento"
            value={formData.orcamento}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="Ex: 5000000"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: 5000000 (sem pontos ou vírgulas)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gastos (R$)
          </label>
          <input
            type="number"
            name="gastos"
            value={formData.gastos}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {formData.orcamento > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {((Number(formData.gastos) / Number(formData.orcamento)) * 100).toFixed(1)}% do orçamento utilizado
            </p>
          )}
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início *
          </label>
          <input
            type="date"
            name="dataInicio"
            value={formData.dataInicio}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prazo Final *
          </label>
          <input
            type="date"
            name="prazoFinal"
            value={formData.prazoFinal}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Localização e Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização *
          </label>
          <input
            type="text"
            name="localizacao"
            value={formData.localizacao}
            onChange={handleChange}
            required
            placeholder="Ex: São Paulo - SP"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamanho da Equipe
          </label>
          <input
            type="number"
            name="equipeTotal"
            value={formData.equipeTotal}
            onChange={handleChange}
            min="0"
            placeholder="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isEdit ? "Salvar Alterações" : "Criar Projeto"}
        </button>
      </div>
    </form>
  );
}
