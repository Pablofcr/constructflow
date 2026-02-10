'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectFileData {
  id: string;
  fileName: string;
  category: string;
  fileSize: number;
  uploadedAt: string;
}

interface GenerateAIBudgetDialogProps {
  open: boolean;
  projectId: string;
  existingFiles: ProjectFileData[];
  onClose: () => void;
  onFilesChanged: () => void;
  onGenerate: () => void;
  generating: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'ARCHITECTURAL', label: 'Arquitetonico' },
  { value: 'STRUCTURAL', label: 'Estrutural' },
  { value: 'ELECTRICAL', label: 'Eletrico' },
  { value: 'HYDRAULIC', label: 'Hidraulico' },
  { value: 'OTHER', label: 'Outro' },
];

export function GenerateAIBudgetDialog({
  open,
  projectId,
  existingFiles,
  onClose,
  onFilesChanged,
  onGenerate,
  generating,
}: GenerateAIBudgetDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ARCHITECTURAL');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryLabel = (cat: string) =>
    CATEGORY_OPTIONS.find((c) => c.value === cat)?.label || cat;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
          alert(`${file.name} não é um PDF`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', selectedCategory);

        const res = await fetch(`/api/projects/${projectId}/files`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          alert(`Erro ao enviar ${file.name}: ${err.error}`);
        }
      }
      onFilesChanged();
    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Remover este arquivo?')) return;
    try {
      await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
      });
      onFilesChanged();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Gerar Orcamento por IA</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                PDFs Anexados ({existingFiles.length})
              </h3>
              <div className="space-y-2">
                {existingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {categoryLabel(file.category)} - {formatSize(file.fileSize)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-700">Enviar PDF</h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                  <span className="text-sm text-gray-600">Enviando...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Arraste PDFs aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, max 50MB cada</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <Button
              onClick={onGenerate}
              disabled={existingFiles.length === 0 || generating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando Orcamento...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Orcamento por IA
                </>
              )}
            </Button>
            {existingFiles.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Envie pelo menos 1 PDF para gerar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
