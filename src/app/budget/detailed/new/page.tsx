'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/project-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Home,
  Wrench,
  MapPin,
  FileText,
  Loader2,
  Compass,
  Ruler,
  Building2,
  ChevronRight,
} from 'lucide-react'

// Brazilian states
const ESTADOS_BR = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' },
  { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' },
  { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

const WIZARD_STEPS = [
  { number: 1, label: 'Localizacao' },
  { number: 2, label: 'Comodos' },
  { number: 3, label: 'Acabamento' },
  { number: 4, label: 'Estrutura' },
  { number: 5, label: 'Area Externa' },
  { number: 6, label: 'Ajuste Regional' },
]

interface WizardData {
  tipoObra: 'CASA_NOVA' | 'REFORMA'
  nomeProjeto: string
  estado: string
  cidade: string
  frenteTerreno: number | ''
  fundosTerreno: number | ''
  ladoDireitoTerreno: number | ''
  ladoEsquerdoTerreno: number | ''
  areaConstruida: number | ''
  numFloors: number
}

interface ProjectData {
  id: string
  name: string
  tipoObra: string
  enderecoEstado: string
  enderecoCidade: string
}

function TerrainDiagram({
  frente,
  fundos,
  ladoDireito,
  ladoEsquerdo,
}: {
  frente: number
  fundos: number
  ladoDireito: number
  ladoEsquerdo: number
}) {
  return (
    <div className="flex justify-center py-4">
      <svg
        viewBox="0 0 280 240"
        className="w-full max-w-[280px] h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Terrain rectangle */}
        <rect
          x="60"
          y="40"
          width="160"
          height="160"
          fill="#FFF7ED"
          stroke="#F97316"
          strokeWidth="2"
          rx="4"
        />

        {/* Diagonal pattern inside */}
        <defs>
          <pattern
            id="terrainPattern"
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
          >
            <path
              d="M 0 8 L 8 0"
              stroke="#FDBA74"
              strokeWidth="0.5"
              opacity="0.4"
            />
          </pattern>
        </defs>
        <rect
          x="60"
          y="40"
          width="160"
          height="160"
          fill="url(#terrainPattern)"
          rx="4"
        />

        {/* Frente - bottom */}
        <text
          x="140"
          y="220"
          textAnchor="middle"
          className="text-[11px] font-semibold"
          fill="#9A3412"
        >
          Frente: {frente > 0 ? `${frente}m` : '--'}
        </text>
        <line
          x1="80"
          y1="208"
          x2="200"
          y2="208"
          stroke="#EA580C"
          strokeWidth="1.5"
          markerStart="url(#arrowStart)"
          markerEnd="url(#arrowEnd)"
        />

        {/* Fundos - top */}
        <text
          x="140"
          y="28"
          textAnchor="middle"
          className="text-[11px] font-semibold"
          fill="#9A3412"
        >
          Fundos: {fundos > 0 ? `${fundos}m` : '--'}
        </text>
        <line
          x1="80"
          y1="34"
          x2="200"
          y2="34"
          stroke="#EA580C"
          strokeWidth="1.5"
          markerStart="url(#arrowStart)"
          markerEnd="url(#arrowEnd)"
        />

        {/* Lado Esquerdo - left */}
        <text
          x="30"
          y="120"
          textAnchor="middle"
          className="text-[10px] font-semibold"
          fill="#9A3412"
          transform="rotate(-90, 30, 120)"
        >
          L. Esq: {ladoEsquerdo > 0 ? `${ladoEsquerdo}m` : '--'}
        </text>
        <line
          x1="48"
          y1="60"
          x2="48"
          y2="180"
          stroke="#EA580C"
          strokeWidth="1.5"
          markerStart="url(#arrowStart)"
          markerEnd="url(#arrowEnd)"
        />

        {/* Lado Direito - right */}
        <text
          x="250"
          y="120"
          textAnchor="middle"
          className="text-[10px] font-semibold"
          fill="#9A3412"
          transform="rotate(90, 250, 120)"
        >
          L. Dir: {ladoDireito > 0 ? `${ladoDireito}m` : '--'}
        </text>
        <line
          x1="232"
          y1="60"
          x2="232"
          y2="180"
          stroke="#EA580C"
          strokeWidth="1.5"
          markerStart="url(#arrowStart)"
          markerEnd="url(#arrowEnd)"
        />

        {/* Compass indicator */}
        <circle cx="140" cy="120" r="16" fill="white" stroke="#D4D4D8" strokeWidth="1" />
        <text
          x="140"
          y="115"
          textAnchor="middle"
          className="text-[9px] font-bold"
          fill="#EA580C"
        >
          N
        </text>
        <polygon points="140,106 137,114 143,114" fill="#EA580C" />
        <text
          x="140"
          y="130"
          textAnchor="middle"
          className="text-[8px]"
          fill="#A1A1AA"
        >
          S
        </text>

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowStart"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto-start-reverse"
          >
            <path d="M 6 0 L 0 3 L 6 6" fill="none" stroke="#EA580C" strokeWidth="1" />
          </marker>
          <marker
            id="arrowEnd"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke="#EA580C" strokeWidth="1" />
          </marker>
        </defs>
      </svg>
    </div>
  )
}

function WizardContent() {
  const router = useRouter()
  const { activeProject } = useProject()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<WizardData>({
    tipoObra: 'CASA_NOVA',
    nomeProjeto: '',
    estado: '',
    cidade: '',
    frenteTerreno: '',
    fundosTerreno: '',
    ladoDireitoTerreno: '',
    ladoEsquerdoTerreno: '',
    areaConstruida: '',
    numFloors: 1,
  })

  const currentStep = 1

  // Fetch full project data and pre-fill
  useEffect(() => {
    if (!activeProject) {
      setLoading(false)
      return
    }

    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${activeProject.id}`)
        if (res.ok) {
          const project: ProjectData = await res.json()
          setData((prev) => ({
            ...prev,
            nomeProjeto: project.name || '',
            estado: project.enderecoEstado || '',
            cidade: project.enderecoCidade || '',
            tipoObra:
              project.tipoObra === 'COMERCIAL' ? 'CASA_NOVA' : 'CASA_NOVA',
          }))
        }
      } catch (err) {
        console.error('Erro ao carregar dados do projeto:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [activeProject])

  // Computed values
  const areaTerreno = useMemo(() => {
    const f = Number(data.frenteTerreno) || 0
    const fu = Number(data.fundosTerreno) || 0
    const ld = Number(data.ladoDireitoTerreno) || 0
    const le = Number(data.ladoEsquerdoTerreno) || 0
    if (f <= 0 && fu <= 0 && ld <= 0 && le <= 0) return 0
    return ((f + fu) / 2) * ((ld + le) / 2)
  }, [
    data.frenteTerreno,
    data.fundosTerreno,
    data.ladoDireitoTerreno,
    data.ladoEsquerdoTerreno,
  ])

  const areaImplantacao = useMemo(() => {
    const ac = Number(data.areaConstruida) || 0
    if (ac <= 0 || data.numFloors <= 0) return 0
    return ac / data.numFloors
  }, [data.areaConstruida, data.numFloors])

  const implantacaoExceedsTerreno =
    areaTerreno > 0 && areaImplantacao > 0 && areaImplantacao > areaTerreno

  const isStep1Valid = useMemo(() => {
    return (
      data.nomeProjeto.trim().length > 0 &&
      data.estado.length > 0 &&
      data.cidade.trim().length > 0 &&
      Number(data.areaConstruida) > 0 &&
      data.numFloors >= 1
    )
  }, [data.nomeProjeto, data.estado, data.cidade, data.areaConstruida, data.numFloors])

  const updateField = <K extends keyof WizardData>(
    field: K,
    value: WizardData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  if (!activeProject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecione um Projeto
              </h3>
              <p className="text-gray-500">
                Escolha um projeto no seletor acima para criar o orcamento
                detalhado
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando dados do projeto...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-20">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Header with back button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/budget')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Orcamento
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Ruler className="h-8 w-8 text-orange-600" />
              Novo Orcamento Detalhado
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {activeProject.name}
            </p>
          </div>

          {/* Step Indicator Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        step.number === currentStep
                          ? 'bg-orange-500 text-white'
                          : step.number < currentStep
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium hidden sm:block ${
                        step.number === currentStep
                          ? 'text-orange-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`hidden sm:block w-8 md:w-12 lg:w-16 h-0.5 mx-1 ${
                        step.number < currentStep
                          ? 'bg-orange-300'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section A — Tipo de Obra */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Tipo de Obra
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Selecione o tipo de construcao
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Casa Nova */}
              <button
                type="button"
                onClick={() => updateField('tipoObra', 'CASA_NOVA')}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                  data.tipoObra === 'CASA_NOVA'
                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    data.tipoObra === 'CASA_NOVA'
                      ? 'bg-orange-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <Home
                    className={`h-6 w-6 ${
                      data.tipoObra === 'CASA_NOVA'
                        ? 'text-orange-600'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      data.tipoObra === 'CASA_NOVA'
                        ? 'text-orange-900'
                        : 'text-gray-900'
                    }`}
                  >
                    Casa Nova
                  </p>
                  <p
                    className={`text-sm ${
                      data.tipoObra === 'CASA_NOVA'
                        ? 'text-orange-600'
                        : 'text-gray-500'
                    }`}
                  >
                    Construcao do zero
                  </p>
                </div>
              </button>

              {/* Reforma */}
              <button
                type="button"
                onClick={() => updateField('tipoObra', 'REFORMA')}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                  data.tipoObra === 'REFORMA'
                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    data.tipoObra === 'REFORMA'
                      ? 'bg-orange-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <Wrench
                    className={`h-6 w-6 ${
                      data.tipoObra === 'REFORMA'
                        ? 'text-orange-600'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      data.tipoObra === 'REFORMA'
                        ? 'text-orange-900'
                        : 'text-gray-900'
                    }`}
                  >
                    Reforma
                  </p>
                  <p
                    className={`text-sm ${
                      data.tipoObra === 'REFORMA'
                        ? 'text-orange-600'
                        : 'text-gray-500'
                    }`}
                  >
                    Alteracoes em imovel existente
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section B — Identificacao do Projeto */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <FileText className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Identificacao do Projeto
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 ml-8">
              De um nome para identificar este orcamento
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.nomeProjeto}
                onChange={(e) => updateField('nomeProjeto', e.target.value)}
                placeholder="Ex: Casa Residencial Vila Nova"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Este nome sera usado para identificar o projeto no relatorio
                final
              </p>
            </div>
          </div>

          {/* Section C + D — Localizacao + Dimensoes do Terreno */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <MapPin className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Localizacao do Projeto
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 ml-8">
              Defina onde sera construido e as dimensoes
            </p>

            {/* Estado + Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.estado}
                  onChange={(e) => updateField('estado', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow bg-white"
                >
                  <option value="">Selecione o estado</option>
                  {ESTADOS_BR.map((uf) => (
                    <option key={uf.value} value={uf.value}>
                      {uf.label} ({uf.value})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.cidade}
                  onChange={(e) => updateField('cidade', e.target.value)}
                  placeholder="Ex: Sao Paulo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                />
              </div>
            </div>

            {/* Divider — Dimensoes do Terreno */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-1">
                <Compass className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Dimensoes do Terreno
                </h3>
              </div>
              <p className="text-sm text-gray-500 mb-4 ml-8">
                Informe as medidas do terreno para calculo da area
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Terrain inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frente (m)
                    </label>
                    <input
                      type="number"
                      value={data.frenteTerreno}
                      onChange={(e) =>
                        updateField(
                          'frenteTerreno',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      min={0}
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fundos (m)
                    </label>
                    <input
                      type="number"
                      value={data.fundosTerreno}
                      onChange={(e) =>
                        updateField(
                          'fundosTerreno',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      min={0}
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lado Direito (m)
                    </label>
                    <input
                      type="number"
                      value={data.ladoDireitoTerreno}
                      onChange={(e) =>
                        updateField(
                          'ladoDireitoTerreno',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      min={0}
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lado Esquerdo (m)
                    </label>
                    <input
                      type="number"
                      value={data.ladoEsquerdoTerreno}
                      onChange={(e) =>
                        updateField(
                          'ladoEsquerdoTerreno',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      min={0}
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                    />
                  </div>
                </div>

                {/* Terrain diagram */}
                <TerrainDiagram
                  frente={Number(data.frenteTerreno) || 0}
                  fundos={Number(data.fundosTerreno) || 0}
                  ladoDireito={Number(data.ladoDireitoTerreno) || 0}
                  ladoEsquerdo={Number(data.ladoEsquerdoTerreno) || 0}
                />
              </div>

              {/* Area do Terreno computed */}
              {areaTerreno > 0 && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                  <Ruler className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">
                      Area do Terreno (estimada):{' '}
                      <span className="font-bold">
                        {areaTerreno.toFixed(2)} m²
                      </span>
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Area estimada a partir da media dos lados do terreno.
                      Indicada para estudos preliminares de viabilidade.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section E — Area e Pavimentos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <Building2 className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Area e Pavimentos
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 ml-8">
              Defina a area construida e o numero de pavimentos
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area a ser Construida (m²){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={data.areaConstruida}
                  onChange={(e) =>
                    updateField(
                      'areaConstruida',
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  placeholder="Ex: 120"
                  min={1}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero de Pavimentos{' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.numFloors}
                  onChange={(e) =>
                    updateField('numFloors', Number(e.target.value))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow bg-white"
                >
                  <option value={1}>1 Pavimento (Terreo)</option>
                  <option value={2}>2 Pavimentos</option>
                  <option value={3}>3 Pavimentos</option>
                  <option value={4}>4 Pavimentos</option>
                  <option value={5}>5 Pavimentos</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5">
                  Este campo serve apenas para validar se a area construida cabe
                  no terreno
                </p>
              </div>
            </div>

            {/* Area de Implantacao computed */}
            {areaImplantacao > 0 && (
              <div
                className={`mt-4 rounded-lg p-3 flex items-start gap-2 border ${
                  implantacaoExceedsTerreno
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <Building2
                  className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    implantacaoExceedsTerreno
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      implantacaoExceedsTerreno
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }`}
                  >
                    Area de Implantacao:{' '}
                    <span className="font-bold">
                      {areaImplantacao.toFixed(2)} m²
                    </span>
                    <span className="font-normal text-xs ml-1">
                      (projecao no solo)
                    </span>
                  </p>
                  {implantacaoExceedsTerreno && (
                    <p className="text-xs text-red-700 mt-0.5">
                      A area de implantacao excede a area do terreno estimada (
                      {areaTerreno.toFixed(2)} m²). Verifique as dimensoes.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Proxima Etapa button */}
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base font-semibold"
            disabled={!isStep1Valid}
            onClick={() => {
              toast({
                title: 'Proxima etapa em breve',
                description:
                  'As demais etapas do assistente serao implementadas em breve.',
              })
            }}
          >
            Proxima Etapa
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NewDetailedBudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 md:ml-20">
            <div className="max-w-4xl mx-auto p-4 md:p-6">
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Carregando...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  )
}
