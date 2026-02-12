import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

type PageProps = {
  // Next.js (v15+/v16) can provide params as a Promise in some configurations
  params: Promise<{ id: string }>
}

export default async function OrcamentosPage({ params }: PageProps) {
  const { id } = await params

  if (!id) notFound()

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      codigo: true
    }
  })

  if (!project) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="mt-1 text-sm text-gray-600">
            {project.codigo} • {project.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Orçamento Estimado */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Orçamento Estimado</h2>
                <p className="text-sm text-gray-600">Cálculo rápido • Viabilidade</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Abra os detalhes do orçamento estimado aqui (já existente no projeto).
              </p>
            </div>
          </div>

          {/* Orçamento Real */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Orçamento Completo</h2>
                <p className="text-sm text-gray-600">Detalhado • Execução</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-gray-50 p-10 text-center">
              <div className="mb-3 h-12 w-12 rounded-full bg-white shadow-sm" />
              <p className="font-medium text-gray-700">Em Desenvolvimento</p>
              <p className="mt-1 max-w-sm text-sm text-gray-600">
                Orçamento detalhado com insumos, composições e quantitativos.
              </p>
              <button
                className="mt-6 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500"
                disabled
              >
                Em breve
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/projects"
            className="inline-flex items-center rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            ← Voltar para Projetos
          </a>
        </div>
      </div>
    </div>
  )
}
