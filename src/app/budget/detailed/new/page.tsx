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
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Layers,
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

const ROOM_TYPES = [
  { value: 'quarto', label: 'Quarto' },
  { value: 'suite', label: 'Suite' },
  { value: 'sala', label: 'Sala' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'banheiro', label: 'Banheiro' },
  { value: 'lavabo', label: 'Lavabo' },
  { value: 'area_gourmet', label: 'Area Gourmet' },
  { value: 'lavanderia', label: 'Lavanderia' },
  { value: 'corredor', label: 'Corredor' },
  { value: 'garagem', label: 'Garagem' },
  { value: 'varanda', label: 'Varanda' },
  { value: 'escritorio', label: 'Escritorio' },
  { value: 'despensa', label: 'Despensa' },
  { value: 'servico', label: 'Area de Servico' },
  { value: 'outro', label: 'Outro' },
]

interface RoomItem {
  id: string
  type: string
  label: string
  width: number
  length: number
}

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
  // Step 2
  rooms: RoomItem[]
  // Step 3
  padrao: 'POPULAR' | 'MEDIO_PADRAO' | 'ALTO_PADRAO'
  // Step 4
  fundacao: string
  forro: string
  piso: string
  fachada: string
  sistemaConstrutivo: string
  telhado: string
  esquadrias: string
  possuiSubsolo: boolean
  // Step 4 — Modo Profissional
  proTipoEstrutura: string
  proTipoLaje: string
  proTipoParedeExterna: string
  proTipoParedeInterna: string
  proTipoTelha: string
  proComplexidadeCobertura: string
  proLinhaEsquadria: string
  proMaterialEsquadria: string
}

interface ProjectData {
  id: string
  name: string
  tipoObra: string
  padraoEmpreendimento: string
  enderecoEstado: string
  enderecoCidade: string
}

const PADRAO_OPTIONS = [
  {
    value: 'POPULAR' as const,
    label: 'Popular',
    cubCode: 'PIS',
    description:
      'Acabamento economico com materiais simples. Portas internas semi-ocas, janelas de ferro, pisos ceramicos em areas molhadas, pintura basica.',
  },
  {
    value: 'MEDIO_PADRAO' as const,
    label: 'Normal',
    cubCode: 'R1-N',
    description:
      'Acabamento intermediario com materiais de qualidade. Portas em madeira, esquadrias em aluminio, porcelanato em areas sociais, pintura acrilica.',
  },
  {
    value: 'ALTO_PADRAO' as const,
    label: 'Alto Padrao',
    cubCode: 'R1-A',
    description:
      'Acabamento premium com materiais nobres. Portas macicas, esquadrias em PVC ou aluminio premium, porcelanato retificado, marmore em bancadas.',
  },
]

// CUB fallback table (SINDUSCON jan/2026) — used when DB has no data for a state
const CUB_FALLBACK: Record<string, { PIS: number; 'R1-N': number; 'R1-A': number }> = {
  CE: { PIS: 1628.59, 'R1-N': 2789.73, 'R1-A': 3305.51 },
  SP: { PIS: 1435.99, 'R1-N': 2538.83, 'R1-A': 3076.48 },
  RJ: { PIS: 1609.62, 'R1-N': 2845.00, 'R1-A': 3447.68 },
  MG: { PIS: 1504.33, 'R1-N': 2658.54, 'R1-A': 3221.59 },
  BA: { PIS: 1239.77, 'R1-N': 2191.00, 'R1-A': 2655.10 },
  RS: { PIS: 1641.20, 'R1-N': 2901.00, 'R1-A': 3515.50 },
  PR: { PIS: 1547.88, 'R1-N': 2736.00, 'R1-A': 3315.62 },
  SC: { PIS: 1813.66, 'R1-N': 3205.00, 'R1-A': 3884.10 },
  GO: { PIS: 1632.55, 'R1-N': 2885.00, 'R1-A': 3496.11 },
  PE: { PIS: 1262.46, 'R1-N': 2232.00, 'R1-A': 2704.78 },
  PA: { PIS: 1350.84, 'R1-N': 2387.00, 'R1-A': 2892.58 },
  DF: { PIS: 1352.89, 'R1-N': 2391.00, 'R1-A': 2897.42 },
  MT: { PIS: 1873.47, 'R1-N': 3311.00, 'R1-A': 4012.53 },
  ES: { PIS: 1680.34, 'R1-N': 2970.00, 'R1-A': 3599.05 },
  MA: { PIS: 1089.49, 'R1-N': 1925.00, 'R1-A': 2332.86 },
  RN: { PIS: 1198.36, 'R1-N': 2118.00, 'R1-A': 2566.64 },
  PI: { PIS: 1771.13, 'R1-N': 3130.00, 'R1-A': 3793.21 },
}

interface CubValues {
  PIS: number
  'R1-N': number
  'R1-A': number
  referenceLabel: string
}

const PAVIMENTOS_MULTIPLIER: Record<number, number> = {
  1: 0,
  2: 22,
  3: 40,
  4: 55,
  5: 70,
}

const STRUCTURAL_FIELDS = [
  {
    key: 'fundacao',
    label: 'Tipo de Fundacao',
    options: [
      { value: 'SAPATA_CORRIDA', label: 'Sapata Corrida', pct: 0 },
      { value: 'RADIER', label: 'Radier', pct: 4 },
      { value: 'ESTACA', label: 'Estaca', pct: 12 },
    ],
  },
  {
    key: 'forro',
    label: 'Tipo de Forro',
    options: [
      { value: 'PVC', label: 'PVC', pct: 0 },
      { value: 'GESSO', label: 'Gesso', pct: 1.5 },
      { value: 'GESSO_ACARTONADO', label: 'Gesso Acartonado', pct: 2 },
      { value: 'MADEIRA', label: 'Madeira', pct: 3 },
    ],
  },
  {
    key: 'piso',
    label: 'Revestimento de Piso',
    options: [
      { value: 'CERAMICA', label: 'Ceramica', pct: 0 },
      { value: 'PORCELANATO_SIMPLES', label: 'Porcelanato Simples', pct: 2 },
      { value: 'PORCELANATO_POLIDO', label: 'Porcelanato Polido', pct: 3.5 },
      { value: 'VINILICO', label: 'Vinilico', pct: 1.5 },
      { value: 'PISO_LAMINADO', label: 'Piso Laminado', pct: 2.5 },
    ],
  },
  {
    key: 'fachada',
    label: 'Revestimento de Fachada',
    options: [
      { value: 'PINTURA_LATEX', label: 'Pintura Latex', pct: 0 },
      { value: 'TEXTURA', label: 'Textura', pct: 1 },
      { value: 'GRAFIATO', label: 'Grafiato', pct: 1.5 },
      { value: 'CERAMICA_FACHADA', label: 'Ceramica', pct: 3 },
      { value: 'PORCELANATO_FACHADA', label: 'Porcelanato', pct: 4 },
      { value: 'PEDRA_NATURAL', label: 'Pedra Natural', pct: 6 },
    ],
  },
  {
    key: 'sistemaConstrutivo',
    label: 'Sistema Construtivo',
    options: [
      { value: 'ALVENARIA_CONVENCIONAL', label: 'Alvenaria Convencional', pct: 0 },
      { value: 'BLOCOS_CONCRETO', label: 'Blocos de Concreto', pct: 2 },
      { value: 'STEEL_FRAME', label: 'Steel Frame', pct: 15 },
      { value: 'WOOD_FRAME', label: 'Wood Frame', pct: 18 },
    ],
  },
  {
    key: 'telhado',
    label: 'Tipo de Telhado',
    options: [
      { value: 'FIBROCIMENTO', label: 'Fibrocimento', pct: 0 },
      { value: 'CERAMICA_TELHADO', label: 'Ceramica', pct: 3 },
      { value: 'METALICO', label: 'Metalico', pct: 5 },
      { value: 'LAJE_IMPERMEABILIZADA', label: 'Laje Impermeabilizada', pct: 8 },
    ],
  },
  {
    key: 'esquadrias',
    label: 'Tipo de Esquadrias',
    options: [
      { value: 'ALUMINIO_PADRAO', label: 'Aluminio Padrao', pct: 0 },
      { value: 'ALUMINIO_PREMIUM', label: 'Aluminio Premium', pct: 1.5 },
      { value: 'PVC_ESQUADRIA', label: 'PVC', pct: 2 },
      { value: 'VIDRO_TEMPERADO', label: 'Vidro Temperado', pct: 3 },
      { value: 'MADEIRA_MACICA', label: 'Madeira Macica', pct: 4 },
    ],
  },
]

const PRO_SECTIONS = [
  {
    title: 'Estrutura e Lajes',
    fields: [
      {
        key: 'proTipoEstrutura',
        label: 'Tipo de Estrutura',
        replaces: 'sistemaConstrutivo',
        options: [
          { value: 'CONVENCIONAL', label: 'Estrutura convencional', pct: 0 },
          { value: 'REFORCADA', label: 'Estrutura reforcada', pct: 5 },
          { value: 'LEVE', label: 'Estrutura leve', pct: -4 },
        ],
      },
      {
        key: 'proTipoLaje',
        label: 'Tipo de Laje',
        replaces: null as string | null,
        options: [
          { value: 'MACICA', label: 'Laje macica', pct: 3 },
          { value: 'NERVURADA', label: 'Laje nervurada', pct: 0 },
          { value: 'PRE_MOLDADA', label: 'Laje pre-moldada', pct: -6 },
          { value: 'STEEL_DECK', label: 'Steel deck', pct: 8 },
        ],
      },
    ],
  },
  {
    title: 'Vedacao e Paredes',
    fields: [
      {
        key: 'proTipoParedeExterna',
        label: 'Parede Externa',
        replaces: null as string | null,
        options: [
          { value: 'ALVENARIA_CONV', label: 'Alvenaria convencional', pct: 0 },
          { value: 'BLOCO_ESTRUTURAL', label: 'Bloco estrutural', pct: 2 },
          { value: 'PRE_FABRICADO', label: 'Pre-fabricado em blocos', pct: -3 },
          { value: 'ICF', label: 'ICF (formas isolantes)', pct: 10 },
        ],
      },
      {
        key: 'proTipoParedeInterna',
        label: 'Parede Interna',
        replaces: null as string | null,
        options: [
          { value: 'ALVENARIA_CONV', label: 'Alvenaria convencional', pct: 0 },
          { value: 'BLOCO_ESTRUTURAL', label: 'Bloco estrutural', pct: 1 },
          { value: 'DRYWALL', label: 'Drywall', pct: -2 },
        ],
      },
    ],
  },
  {
    title: 'Cobertura Detalhada',
    fields: [
      {
        key: 'proTipoTelha',
        label: 'Tipo de Telha',
        replaces: 'telhado',
        options: [
          { value: 'CERAMICA', label: 'Telha ceramica', pct: 3 },
          { value: 'FIBROCIMENTO', label: 'Telha fibrocimento', pct: -5 },
          { value: 'METALICA', label: 'Telha metalica', pct: 5 },
          { value: 'TERMOACUSTICA', label: 'Telha termoacustica', pct: 8 },
        ],
      },
      {
        key: 'proComplexidadeCobertura',
        label: 'Complexidade da Cobertura',
        replaces: null as string | null,
        options: [
          { value: 'SIMPLES', label: 'Cobertura simples', pct: 0 },
          { value: 'MEDIA', label: 'Cobertura media', pct: 3 },
          { value: 'COMPLEXA', label: 'Cobertura complexa', pct: 8 },
        ],
      },
    ],
  },
  {
    title: 'Esquadrias Avancadas',
    fields: [
      {
        key: 'proLinhaEsquadria',
        label: 'Linha da Esquadria',
        replaces: 'esquadrias',
        options: [
          { value: 'ECONOMICA', label: 'Linha economica', pct: -5 },
          { value: 'PADRAO', label: 'Linha padrao', pct: 0 },
          { value: 'PREMIUM', label: 'Linha premium', pct: 5 },
        ],
      },
      {
        key: 'proMaterialEsquadria',
        label: 'Material da Esquadria',
        replaces: null as string | null,
        options: [
          { value: 'ALUMINIO', label: 'Aluminio', pct: 0 },
          { value: 'PVC', label: 'PVC', pct: 2 },
          { value: 'MADEIRA', label: 'Madeira', pct: 4 },
          { value: 'MISTO', label: 'Misto', pct: 1 },
        ],
      },
    ],
  },
]

const PRO_SECTION_ICONS: Record<string, string> = {
  'Estrutura e Lajes': 'layers',
  'Vedacao e Paredes': 'building',
  'Cobertura Detalhada': 'home',
  'Esquadrias Avancadas': 'door',
}

const STORAGE_KEY = 'constructflow-wizard-detailed'

function mapPadraoFromProject(padrao: string): 'POPULAR' | 'MEDIO_PADRAO' | 'ALTO_PADRAO' {
  switch (padrao) {
    case 'POPULAR':
    case 'BAIXO_PADRAO':
      return 'POPULAR'
    case 'MEDIO_PADRAO':
    case 'MEDIO':
      return 'MEDIO_PADRAO'
    case 'ALTO_PADRAO':
    case 'ALTO':
      return 'ALTO_PADRAO'
    default:
      return 'POPULAR'
  }
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
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch { /* ignore */ }
      }
    }
    return {
      tipoObra: 'CASA_NOVA' as const,
      nomeProjeto: '',
      estado: '',
      cidade: '',
      frenteTerreno: '' as const,
      fundosTerreno: '' as const,
      ladoDireitoTerreno: '' as const,
      ladoEsquerdoTerreno: '' as const,
      areaConstruida: '' as const,
      numFloors: 1,
      rooms: [],
      padrao: 'POPULAR' as const,
      fundacao: 'SAPATA_CORRIDA',
      forro: 'PVC',
      piso: 'CERAMICA',
      fachada: 'PINTURA_LATEX',
      sistemaConstrutivo: 'ALVENARIA_CONVENCIONAL',
      telhado: 'FIBROCIMENTO',
      esquadrias: 'ALUMINIO_PADRAO',
      possuiSubsolo: false,
      proTipoEstrutura: '',
      proTipoLaje: '',
      proTipoParedeExterna: '',
      proTipoParedeInterna: '',
      proTipoTelha: '',
      proComplexidadeCobertura: '',
      proLinhaEsquadria: '',
      proMaterialEsquadria: '',
    }
  })

  // Persist wizard data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // CUB values per state
  const [cubValues, setCubValues] = useState<CubValues | null>(null)
  const [cubLoading, setCubLoading] = useState(false)

  // Room form state
  const [newRoomType, setNewRoomType] = useState('')
  const [newRoomWidth, setNewRoomWidth] = useState<number | ''>('')
  const [newRoomLength, setNewRoomLength] = useState<number | ''>('')

  // Fetch full project data and pre-fill (only if no saved data)
  useEffect(() => {
    if (!activeProject) {
      setLoading(false)
      return
    }

    const hasSaved = !!localStorage.getItem(STORAGE_KEY)

    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${activeProject.id}`)
        if (res.ok) {
          const project: ProjectData = await res.json()
          if (!hasSaved) {
            setData((prev) => ({
              ...prev,
              nomeProjeto: project.name || '',
              estado: project.enderecoEstado || '',
              cidade: project.enderecoCidade || '',
              tipoObra:
                project.tipoObra === 'COMERCIAL' ? 'CASA_NOVA' : 'CASA_NOVA',
              padrao: mapPadraoFromProject(project.padraoEmpreendimento || ''),
            }))
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do projeto:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [activeProject])

  // Fetch CUB values when state changes
  useEffect(() => {
    if (!data.estado) {
      setCubValues(null)
      return
    }

    const fetchCub = async () => {
      setCubLoading(true)
      try {
        const res = await fetch(
          `/api/budget/cub?state=${data.estado}`
        )
        if (res.ok) {
          const records = await res.json()
          if (Array.isArray(records) && records.length > 0) {
            const pis = records.find((r: { cubCode: string }) => r.cubCode === 'PIS')
            const r1n = records.find((r: { cubCode: string }) => r.cubCode === 'R1-N')
            const r1a = records.find((r: { cubCode: string }) => r.cubCode === 'R1-A')
            if (pis && r1n && r1a) {
              // Check if DB data is recent enough vs fallback table
              const dbDateNum = pis.referenceYear * 12 + pis.referenceMonth
              const fallbackDateNum = 2026 * 12 + 1 // Jan/2026
              const hasFallback = !!CUB_FALLBACK[data.estado]
              if (dbDateNum >= fallbackDateNum || !hasFallback) {
                setCubValues({
                  PIS: pis.totalValue,
                  'R1-N': r1n.totalValue,
                  'R1-A': r1a.totalValue,
                  referenceLabel: `${String(pis.referenceMonth).padStart(2, '0')}/${pis.referenceYear}`,
                })
                setCubLoading(false)
                return
              }
              // DB data is older than fallback — fall through
            }
          }
        }
      } catch {
        // fallback below
      }

      // Fallback to hardcoded table
      const fb = CUB_FALLBACK[data.estado]
      if (fb) {
        setCubValues({
          PIS: fb.PIS,
          'R1-N': fb['R1-N'],
          'R1-A': fb['R1-A'],
          referenceLabel: '01/2026',
        })
      } else {
        setCubValues(null)
      }
      setCubLoading(false)
    }

    fetchCub()
  }, [data.estado])

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

  // Room management
  const addRoom = () => {
    if (!newRoomType || !newRoomWidth || !newRoomLength) return
    const roomType = ROOM_TYPES.find((r) => r.value === newRoomType)
    if (!roomType) return
    const newRoom: RoomItem = {
      id: crypto.randomUUID(),
      type: newRoomType,
      label: roomType.label,
      width: Number(newRoomWidth),
      length: Number(newRoomLength),
    }
    setData((prev) => ({ ...prev, rooms: [...prev.rooms, newRoom] }))
    setNewRoomType('')
    setNewRoomWidth('')
    setNewRoomLength('')
  }

  const removeRoom = (id: string) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== id),
    }))
  }

  const totalRoomsArea = useMemo(() => {
    return data.rooms.reduce((sum, r) => sum + r.width * r.length, 0)
  }, [data.rooms])

  const isStep2Valid = data.rooms.length > 0

  const canAddRoom =
    newRoomType !== '' &&
    Number(newRoomWidth) > 0 &&
    Number(newRoomLength) > 0

  // Step 3 computed
  const selectedPadrao = PADRAO_OPTIONS.find((p) => p.value === data.padrao) || PADRAO_OPTIONS[0]
  const cubPerM2 = cubValues
    ? cubValues[selectedPadrao.cubCode as keyof typeof cubValues] as number
    : 0
  const areaConstruidaNum = Number(data.areaConstruida) || 0
  const areaRef = totalRoomsArea > 0 ? totalRoomsArea : areaConstruidaNum
  const valorBaseEstimado = cubPerM2 * areaRef

  // Step 4 — multiplier (additive model matching Obra Certa)
  const [modoProfissionalOpen, setModoProfissionalOpen] = useState(false)

  interface MultiplierItem {
    label: string
    pct: number
    source: 'essential' | 'profissional'
  }

  const { multiplicadorTotal, acrescimoPercentual, multiplierItems } = useMemo(() => {
    const items: MultiplierItem[] = []

    // Determine which essential fields are replaced by professional mode
    const replacedKeys = new Set<string>()
    for (const section of PRO_SECTIONS) {
      for (const field of section.fields) {
        if (field.replaces && data[field.key as keyof WizardData]) {
          replacedKeys.add(field.replaces)
        }
      }
    }

    let totalPct = 0

    // Pavimentos
    const pavPct = PAVIMENTOS_MULTIPLIER[data.numFloors] || 0
    if (pavPct !== 0) {
      items.push({
        label: `Pavimentos (${data.numFloors} pav. +${pavPct}%)`,
        pct: pavPct,
        source: 'essential',
      })
      totalPct += pavPct
    }

    // Essential fields (skip replaced ones)
    for (const field of STRUCTURAL_FIELDS) {
      if (replacedKeys.has(field.key)) continue
      const selectedValue = data[field.key as keyof WizardData] as string
      const option = field.options.find((o) => o.value === selectedValue)
      if (option && option.pct !== 0) {
        items.push({
          label: `${field.label} (${option.label} (+${option.pct}%))`,
          pct: option.pct,
          source: 'essential',
        })
        totalPct += option.pct
      }
    }

    // Professional fields
    for (const section of PRO_SECTIONS) {
      for (const field of section.fields) {
        const val = data[field.key as keyof WizardData] as string
        if (!val) continue
        const option = field.options.find((o) => o.value === val)
        if (option) {
          items.push({
            label: `${field.label} (${option.label})`,
            pct: option.pct,
            source: 'profissional',
          })
          totalPct += option.pct
        }
      }
    }

    // Subsolo
    if (data.possuiSubsolo) {
      totalPct += 25
      items.push({ label: 'Subsolo (+25%)', pct: 25, source: 'essential' })
    }

    return {
      multiplicadorTotal: 1 + totalPct / 100,
      acrescimoPercentual: totalPct,
      multiplierItems: items,
    }
  }, [
    data.numFloors,
    data.fundacao,
    data.forro,
    data.piso,
    data.fachada,
    data.sistemaConstrutivo,
    data.telhado,
    data.esquadrias,
    data.possuiSubsolo,
    data.proTipoEstrutura,
    data.proTipoLaje,
    data.proTipoParedeExterna,
    data.proTipoParedeInterna,
    data.proTipoTelha,
    data.proComplexidadeCobertura,
    data.proLinhaEsquadria,
    data.proMaterialEsquadria,
  ])

  const valorEstimado = valorBaseEstimado * multiplicadorTotal

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
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {step.number < currentStep ? '✓' : step.number}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium hidden sm:block ${
                        step.number <= currentStep
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
                          ? 'bg-orange-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ============================================ */}
          {/* STEP 1 — Localizacao                        */}
          {/* ============================================ */}
          {currentStep === 1 && (
            <>
              {/* Section A — Tipo de Obra */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Tipo de Obra
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Selecione o tipo de construcao
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <TerrainDiagram
                      frente={Number(data.frenteTerreno) || 0}
                      fundos={Number(data.fundosTerreno) || 0}
                      ladoDireito={Number(data.ladoDireitoTerreno) || 0}
                      ladoEsquerdo={Number(data.ladoEsquerdoTerreno) || 0}
                    />
                  </div>

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

              {/* Step 1 — Proxima Etapa */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base font-semibold"
                disabled={!isStep1Valid}
                onClick={() => setCurrentStep(2)}
              >
                Proxima Etapa
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </>
          )}

          {/* ============================================ */}
          {/* STEP 2 — Comodos                             */}
          {/* ============================================ */}
          {currentStep === 2 && (
            <>
              {/* Header card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Home className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Comodos do Projeto
                    </h2>
                    <p className="text-sm text-gray-500">
                      Adicione os ambientes da construcao
                    </p>
                  </div>
                </div>
              </div>

              {/* Add room form */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Adicionar Comodo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Comodo
                    </label>
                    <select
                      value={newRoomType}
                      onChange={(e) => setNewRoomType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow bg-white"
                    >
                      <option value="">Selecione</option>
                      {ROOM_TYPES.map((rt) => (
                        <option key={rt.value} value={rt.value}>
                          {rt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largura (m)
                    </label>
                    <input
                      type="number"
                      value={newRoomWidth}
                      onChange={(e) =>
                        setNewRoomWidth(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comprimento (m)
                    </label>
                    <input
                      type="number"
                      value={newRoomLength}
                      onChange={(e) =>
                        setNewRoomLength(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                    />
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 h-[42px]"
                    disabled={!canAddRoom}
                    onClick={addRoom}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Comodo
                  </Button>
                </div>
              </div>

              {/* Room list */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Comodos Adicionados
                </h3>

                {data.rooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Home className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                      Nenhum comodo adicionado. Use o formulario acima para
                      adicionar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-medium text-gray-900">
                            {room.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {room.width.toFixed(2).replace('.', ',')} ×{' '}
                            {room.length.toFixed(2).replace('.', ',')} m
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-orange-600">
                            {(room.width * room.length)
                              .toFixed(2)
                              .replace('.', ',')}{' '}
                            m²
                          </span>
                          <button
                            onClick={() => removeRoom(room.id)}
                            className="text-red-400 hover:text-red-600 p-1 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {data.rooms.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Area dos Comodos:
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {totalRoomsArea.toFixed(2).replace('.', ',')} m²
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Area Planejada (Etapa 1):
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {Number(data.areaConstruida || 0)
                          .toFixed(2)
                          .replace('.', ',')}{' '}
                        m²
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 — Navigation buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-12 text-base font-semibold"
                  onClick={() => setCurrentStep(1)}
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Voltar
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 h-12 text-base font-semibold"
                  disabled={!isStep2Valid}
                  onClick={() => setCurrentStep(3)}
                >
                  Proxima Etapa
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* STEP 3 — Acabamento                          */}
          {/* ============================================ */}
          {currentStep === 3 && (
            <>
              {/* Padrao de Acabamento */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Ruler className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Padrao de Acabamento
                    </h2>
                    <p className="text-sm text-gray-500">
                      Escolha o nivel de qualidade dos materiais
                    </p>
                  </div>
                </div>

                {/* Gradient bar */}
                <div className="mt-5 mb-4 h-2.5 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400" />

                {/* Three selection buttons */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {PADRAO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField('padrao', opt.value)}
                      className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        data.padrao === opt.value
                          ? opt.value === 'POPULAR'
                            ? 'bg-green-500 text-white shadow-md'
                            : opt.value === 'MEDIO_PADRAO'
                              ? 'bg-yellow-500 text-white shadow-md'
                              : 'bg-red-400 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* CUB value per m² */}
                {cubLoading ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center mb-4">
                    <Loader2 className="h-5 w-5 text-orange-600 animate-spin mx-auto mb-1" />
                    <p className="text-sm text-gray-500">Buscando CUB...</p>
                  </div>
                ) : cubPerM2 > 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center mb-4">
                    <p className="text-sm text-gray-500 mb-1">
                      CUB {selectedPadrao.cubCode} — {data.estado}
                      {cubValues?.referenceLabel && (
                        <span className="ml-1 text-gray-400">
                          (ref. {cubValues.referenceLabel})
                        </span>
                      )}
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(cubPerM2)}
                      /m²
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-4">
                    <p className="text-sm text-yellow-700">
                      CUB nao disponivel para o estado {data.estado || 'selecionado'}.
                      Selecione um estado na Etapa 1.
                    </p>
                  </div>
                )}

                {/* Info: Sobre o CUB */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5 text-lg">ℹ</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        Sobre o CUB
                      </p>
                      <p className="text-sm text-blue-600 mt-0.5">
                        Valores baseados no Custo Unitario Basico (CUB) do
                        estado selecionado, atualizados mensalmente pelo
                        SINDUSCON. Codigo {selectedPadrao.cubCode}:{' '}
                        {selectedPadrao.cubCode === 'PIS'
                          ? 'Projeto de Interesse Social'
                          : selectedPadrao.cubCode === 'R1-N'
                            ? 'Residencia Unifamiliar Normal'
                            : 'Residencia Unifamiliar Alto Padrao'}
                        .
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info: Sobre o acabamento selecionado */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Ruler className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-orange-700">
                        Sobre o Acabamento {selectedPadrao.label}
                      </p>
                      <p className="text-sm text-orange-600 mt-0.5">
                        {selectedPadrao.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo do Projeto */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Resumo do Projeto
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500">Estado / Cidade</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {data.estado} / {data.cidade}
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <Ruler className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500">Area a Construir</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {(totalRoomsArea > 0 ? totalRoomsArea : areaConstruidaNum)
                        .toFixed(2)
                        .replace('.', ',')}{' '}
                      m²
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                      <Home className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="text-xs text-gray-500">CUB/m²</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(cubPerM2)}
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Valor Base Estimado
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(valorBaseEstimado)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 — Navigation buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-12 text-base font-semibold"
                  onClick={() => setCurrentStep(2)}
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Voltar
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 h-12 text-base font-semibold"
                  onClick={() => setCurrentStep(4)}
                >
                  Proxima Etapa
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* STEP 4 — Estrutura                           */}
          {/* ============================================ */}
          {currentStep === 4 && (
            <>
              {/* Header card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Wrench className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Caracteristicas Estruturais
                    </h2>
                    <p className="text-sm text-gray-500">
                      Defina os materiais e sistemas da construcao
                    </p>
                  </div>
                </div>
              </div>

              {/* Estrutura Essencial */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Estrutura Essencial
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Numero de Pavimentos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numero de Pavimentos
                    </label>
                    <select
                      value={data.numFloors}
                      onChange={(e) =>
                        updateField('numFloors', Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow bg-white"
                    >
                      <option value={1}>Terreo (base)</option>
                      <option value={2}>2 Pavimentos (+22%)</option>
                      <option value={3}>3 Pavimentos (+40%)</option>
                      <option value={4}>4 Pavimentos (+55%)</option>
                      <option value={5}>5 Pavimentos (+70%)</option>
                    </select>
                  </div>

                  {/* Dynamic structural fields */}
                  {STRUCTURAL_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <select
                        value={
                          data[field.key as keyof WizardData] as string
                        }
                        onChange={(e) =>
                          updateField(
                            field.key as keyof WizardData,
                            e.target.value as never
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow bg-white"
                      >
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}{' '}
                            {opt.pct === 0
                              ? '(base)'
                              : `(+${opt.pct}%)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subsolo */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <span className="text-base font-semibold text-gray-900">
                      Subsolo
                    </span>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Possui subsolo?
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={data.possuiSubsolo}
                      onClick={() =>
                        updateField('possuiSubsolo', !data.possuiSubsolo)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        data.possuiSubsolo ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          data.possuiSubsolo
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Modo Profissional */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <button
                  type="button"
                  onClick={() =>
                    setModoProfissionalOpen(!modoProfissionalOpen)
                  }
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <span className="text-base font-semibold text-gray-900">
                      Modo Profissional
                    </span>
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                      Opcional
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      modoProfissionalOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {modoProfissionalOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">
                      Personalize detalhes avancados da construcao para um
                      orcamento mais preciso.
                    </p>

                    {/* Warning about field replacement */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-700">
                          Os campos de{' '}
                          <strong>Sistema Construtivo</strong>,{' '}
                          <strong>Telhado</strong> e/ou{' '}
                          <strong>Esquadrias</strong> da secao essencial
                          serao substituidos pelos valores do Modo
                          Profissional no calculo.
                        </p>
                      </div>
                    </div>

                    {/* Professional mode sections */}
                    {PRO_SECTIONS.map((section) => (
                      <div key={section.title} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          {PRO_SECTION_ICONS[section.title] === 'layers' && (
                            <Layers className="h-4 w-4 text-orange-600" />
                          )}
                          {PRO_SECTION_ICONS[section.title] === 'building' && (
                            <Building2 className="h-4 w-4 text-orange-600" />
                          )}
                          {PRO_SECTION_ICONS[section.title] === 'home' && (
                            <Home className="h-4 w-4 text-orange-600" />
                          )}
                          {PRO_SECTION_ICONS[section.title] === 'door' && (
                            <FileText className="h-4 w-4 text-orange-600" />
                          )}
                          <h4 className="text-sm font-semibold text-gray-900">
                            {section.title}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {section.fields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                              </label>
                              <select
                                value={
                                  (data[
                                    field.key as keyof WizardData
                                  ] as string) || ''
                                }
                                onChange={(e) =>
                                  updateField(
                                    field.key as keyof WizardData,
                                    e.target.value as never
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow bg-white"
                              >
                                <option value="">
                                  Selecione (opcional)
                                </option>
                                {field.options.map((opt) => (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumo dos Multiplicadores */}
              {multiplierItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Resumo dos Multiplicadores
                  </h3>
                  <div className="space-y-2">
                    {multiplierItems
                      .filter((item) => item.source === 'essential')
                      .map((item, i) => (
                        <div
                          key={`e-${i}`}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                            {item.label}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              item.pct >= 0
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          >
                            {item.pct >= 0 ? '+' : ''}
                            {item.pct.toFixed(1).replace('.', ',')}%
                          </span>
                        </div>
                      ))}

                    {multiplierItems.some(
                      (item) => item.source === 'profissional'
                    ) && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                          Modo Profissional
                        </p>
                        {multiplierItems
                          .filter(
                            (item) => item.source === 'profissional'
                          )
                          .map((item, i) => (
                            <div
                              key={`p-${i}`}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                {item.label}
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  item.pct >= 0
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {item.pct >= 0 ? '+' : ''}
                                {item.pct.toFixed(1).replace('.', ',')}%
                              </span>
                            </div>
                          ))}
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        Acrescimo estrutural estimado
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          acrescimoPercentual >= 0
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}
                      >
                        {acrescimoPercentual >= 0 ? '+' : ''}
                        {acrescimoPercentual
                          .toFixed(1)
                          .replace('.', ',')}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        Multiplicador aplicado
                      </span>
                      <span className="text-xs text-gray-500">
                        x{multiplicadorTotal.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Calculo em Tempo Real */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  Calculo em Tempo Real
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      Multiplicador Total:
                    </span>
                    <div className="flex-1 mx-2">
                      <div className="h-1.5 bg-gray-200 rounded-full">
                        <div
                          className="h-1.5 bg-orange-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              ((multiplicadorTotal - 1) / 1.5) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-orange-600 flex-shrink-0">
                      x{multiplicadorTotal.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Acrescimo sobre valor base:
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      +{acrescimoPercentual.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-900">
                      Valor Estimado:
                    </span>
                    <span className="text-lg font-bold text-orange-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(valorEstimado)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumo do Projeto */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Resumo do Projeto
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="text-xs text-gray-500">Estado / Cidade</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {data.estado} / {data.cidade}
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <Ruler className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500">Area a Construir</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {areaRef.toFixed(2).replace('.', ',')} m²
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                      <Home className="h-4 w-4 text-yellow-600" />
                    </div>
                    <p className="text-xs text-gray-500">CUB/m²</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(cubPerM2)}
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mb-2">
                      <Building2 className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Valor Base Estimado
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(valorEstimado)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 — Navigation buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-12 text-base font-semibold"
                  onClick={() => setCurrentStep(3)}
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Voltar
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 h-12 text-base font-semibold"
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
            </>
          )}
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
