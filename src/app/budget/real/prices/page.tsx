'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useProject } from '@/contexts/project-context';
import { PriceTable } from '@/components/orcamento-real/PriceTable';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

function PriceTableContent() {
  const searchParams = useSearchParams();
  const { activeProject } = useProject();
  const budgetId = searchParams?.get('budgetId') ?? null;
  const state = searchParams?.get('state') || 'SP';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-20">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={budgetId ? `/budget/real?budgetId=${budgetId}` : '/budget'}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Tabela de Precos SINAPI
                </h1>
                <p className="text-sm text-gray-500">
                  {activeProject?.name || 'Projeto'} - Estado: {state}
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
              {state}
            </div>
          </div>

          <PriceTable state={state} projectId={activeProject?.id || ''} />
        </div>
      </div>
    </div>
  );
}

export default function PriceTablePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <PriceTableContent />
    </Suspense>
  );
}
