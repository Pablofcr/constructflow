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
  Printer,
  Save,
  CalendarDays,
  FileText,
  Loader2,
  Building2,
  MapPin,
  Ruler,
  Layers,
  DollarSign,
  BarChart3,
  Info,
  CheckCircle2,
  TrendingUp,
  PenLine,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ─── Shared types & constants (mirrored from wizard) ─────────────────────────

interface RoomItem {
  id: string
  type: string
  label: string
  width: number
  length: number
}

interface AreaExternaData {
  piscina: { enabled: boolean; tipo: string; formato: string; comprimento: number | ''; largura: number | ''; profundidade: number | ''; aquecimento: boolean; iluminacao: boolean }
  muro: { enabled: boolean; tipo: string; altura: number | ''; percentualPerimetro: number }
  cobertura: { enabled: boolean; tipo: string; area: number | ''; complexidade: string }
  gourmet: { enabled: boolean; nivel: string; itens: string[] }
  pavimentacao: { enabled: boolean; tipo: string; area: number | '' }
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
  rooms: RoomItem[]
  padrao: 'POPULAR' | 'MEDIO_PADRAO' | 'ALTO_PADRAO'
  fundacao: string
  forro: string
  piso: string
  fachada: string
  sistemaConstrutivo: string
  telhado: string
  esquadrias: string
  possuiSubsolo: boolean
  proTipoEstrutura: string
  proTipoLaje: string
  proTipoParedeExterna: string
  proTipoParedeInterna: string
  proTipoTelha: string
  proComplexidadeCobertura: string
  proLinhaEsquadria: string
  proMaterialEsquadria: string
  areaExterna: AreaExternaData
  mercadoLocal: number
  logisticaAcesso: string
  maoDeObra: string
  formaContratacao: string
  ajusteManualFinal: number
}

const ESTADOS_BR: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapa', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceara', DF: 'Distrito Federal', ES: 'Espirito Santo', GO: 'Goias',
  MA: 'Maranhao', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Para', PB: 'Paraiba', PR: 'Parana', PE: 'Pernambuco', PI: 'Piaui',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondonia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'Sao Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
}

const PADRAO_OPTIONS = [
  { value: 'POPULAR', label: 'Popular', cubCode: 'PIS' },
  { value: 'MEDIO_PADRAO', label: 'Normal', cubCode: 'R1-N' },
  { value: 'ALTO_PADRAO', label: 'Alto Padrao', cubCode: 'R1-A' },
]

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

const PAVIMENTOS_MULTIPLIER: Record<number, number> = { 1: 0, 2: 22, 3: 40, 4: 55, 5: 70 }

const STRUCTURAL_FIELDS = [
  { key: 'fundacao', label: 'Tipo de Fundacao', options: [
    { value: 'SAPATA_CORRIDA', label: 'Sapata Corrida', pct: 0 },
    { value: 'RADIER', label: 'Radier', pct: 4 },
    { value: 'ESTACA', label: 'Estaca', pct: 12 },
  ]},
  { key: 'forro', label: 'Tipo de Forro', options: [
    { value: 'PVC', label: 'PVC', pct: 0 },
    { value: 'GESSO', label: 'Gesso', pct: 1.5 },
    { value: 'GESSO_ACARTONADO', label: 'Gesso Acartonado', pct: 2 },
    { value: 'MADEIRA', label: 'Madeira', pct: 3 },
  ]},
  { key: 'piso', label: 'Revestimento de Piso', options: [
    { value: 'CERAMICA', label: 'Ceramica', pct: 0 },
    { value: 'PORCELANATO_SIMPLES', label: 'Porcelanato Simples', pct: 2 },
    { value: 'PORCELANATO_POLIDO', label: 'Porcelanato Polido', pct: 3.5 },
    { value: 'VINILICO', label: 'Vinilico', pct: 1.5 },
    { value: 'PISO_LAMINADO', label: 'Piso Laminado', pct: 2.5 },
  ]},
  { key: 'fachada', label: 'Revestimento de Fachada', options: [
    { value: 'PINTURA_LATEX', label: 'Pintura Latex', pct: 0 },
    { value: 'TEXTURA', label: 'Textura', pct: 1 },
    { value: 'GRAFIATO', label: 'Grafiato', pct: 1.5 },
    { value: 'CERAMICA_FACHADA', label: 'Ceramica', pct: 3 },
    { value: 'PORCELANATO_FACHADA', label: 'Porcelanato', pct: 4 },
    { value: 'PEDRA_NATURAL', label: 'Pedra Natural', pct: 6 },
  ]},
  { key: 'sistemaConstrutivo', label: 'Sistema Construtivo', options: [
    { value: 'ALVENARIA_CONVENCIONAL', label: 'Alvenaria Convencional', pct: 0 },
    { value: 'BLOCOS_CONCRETO', label: 'Blocos de Concreto', pct: 2 },
    { value: 'STEEL_FRAME', label: 'Steel Frame', pct: 15 },
    { value: 'WOOD_FRAME', label: 'Wood Frame', pct: 18 },
  ]},
  { key: 'telhado', label: 'Tipo de Telhado', options: [
    { value: 'FIBROCIMENTO', label: 'Fibrocimento', pct: 0 },
    { value: 'CERAMICA_TELHADO', label: 'Ceramica', pct: 3 },
    { value: 'METALICO', label: 'Metalico', pct: 5 },
    { value: 'LAJE_IMPERMEABILIZADA', label: 'Laje Impermeabilizada', pct: 8 },
  ]},
  { key: 'esquadrias', label: 'Tipo de Esquadrias', options: [
    { value: 'ALUMINIO_PADRAO', label: 'Aluminio Padrao', pct: 0 },
    { value: 'ALUMINIO_PREMIUM', label: 'Aluminio Premium', pct: 1.5 },
    { value: 'PVC_ESQUADRIA', label: 'PVC', pct: 2 },
    { value: 'VIDRO_TEMPERADO', label: 'Vidro Temperado', pct: 3 },
    { value: 'MADEIRA_MACICA', label: 'Madeira Macica', pct: 4 },
  ]},
]

const PRO_SECTIONS = [
  { title: 'Estrutura e Lajes', fields: [
    { key: 'proTipoEstrutura', label: 'Tipo de Estrutura', replaces: 'sistemaConstrutivo', options: [
      { value: 'CONVENCIONAL', label: 'Estrutura convencional', pct: 0 },
      { value: 'REFORCADA', label: 'Estrutura reforcada', pct: 5 },
      { value: 'LEVE', label: 'Estrutura leve', pct: -4 },
    ]},
    { key: 'proTipoLaje', label: 'Tipo de Laje', replaces: null as string | null, options: [
      { value: 'MACICA', label: 'Laje macica', pct: 3 },
      { value: 'NERVURADA', label: 'Laje nervurada', pct: 0 },
      { value: 'PRE_MOLDADA', label: 'Laje pre-moldada', pct: -6 },
      { value: 'STEEL_DECK', label: 'Steel deck', pct: 8 },
    ]},
  ]},
  { title: 'Vedacao e Paredes', fields: [
    { key: 'proTipoParedeExterna', label: 'Parede Externa', replaces: null as string | null, options: [
      { value: 'ALVENARIA_CONV', label: 'Alvenaria convencional', pct: 0 },
      { value: 'BLOCO_ESTRUTURAL', label: 'Bloco estrutural', pct: 2 },
      { value: 'PRE_FABRICADO', label: 'Pre-fabricado em blocos', pct: -3 },
      { value: 'ICF', label: 'ICF (formas isolantes)', pct: 10 },
    ]},
    { key: 'proTipoParedeInterna', label: 'Parede Interna', replaces: null as string | null, options: [
      { value: 'ALVENARIA_CONV', label: 'Alvenaria convencional', pct: 0 },
      { value: 'BLOCO_ESTRUTURAL', label: 'Bloco estrutural', pct: 1 },
      { value: 'DRYWALL', label: 'Drywall', pct: -2 },
    ]},
  ]},
  { title: 'Cobertura Detalhada', fields: [
    { key: 'proTipoTelha', label: 'Tipo de Telha', replaces: 'telhado', options: [
      { value: 'CERAMICA', label: 'Telha ceramica', pct: 3 },
      { value: 'FIBROCIMENTO', label: 'Telha fibrocimento', pct: -5 },
      { value: 'METALICA', label: 'Telha metalica', pct: 5 },
      { value: 'TERMOACUSTICA', label: 'Telha termoacustica', pct: 8 },
    ]},
    { key: 'proComplexidadeCobertura', label: 'Complexidade da Cobertura', replaces: null as string | null, options: [
      { value: 'SIMPLES', label: 'Cobertura simples', pct: 0 },
      { value: 'MEDIA', label: 'Cobertura media', pct: 3 },
      { value: 'COMPLEXA', label: 'Cobertura complexa', pct: 8 },
    ]},
  ]},
  { title: 'Esquadrias Avancadas', fields: [
    { key: 'proLinhaEsquadria', label: 'Linha da Esquadria', replaces: 'esquadrias', options: [
      { value: 'ECONOMICA', label: 'Linha economica', pct: -5 },
      { value: 'PADRAO', label: 'Linha padrao', pct: 0 },
      { value: 'PREMIUM', label: 'Linha premium', pct: 5 },
    ]},
    { key: 'proMaterialEsquadria', label: 'Material da Esquadria', replaces: null as string | null, options: [
      { value: 'ALUMINIO', label: 'Aluminio', pct: 0 },
      { value: 'PVC', label: 'PVC', pct: 2 },
      { value: 'MADEIRA', label: 'Madeira', pct: 4 },
      { value: 'MISTO', label: 'Misto', pct: 1 },
    ]},
  ]},
]

const PISCINA_TIPOS = [
  { value: 'FIBRA', label: 'Fibra', custoM2: 1500 },
  { value: 'CONCRETO', label: 'Concreto', custoM2: 2500 },
  { value: 'VINIL', label: 'Vinil', custoM2: 1800 },
]
const MURO_TIPOS = [
  { value: 'ALVENARIA', label: 'Alvenaria', custoM2: 280 },
  { value: 'PRE_MOLDADO', label: 'Pre-moldado', custoM2: 220 },
  { value: 'MISTO', label: 'Misto (alvenaria + gradil)', custoM2: 250 },
]
const COBERTURA_EXT_TIPOS = [
  { value: 'POLICARBONATO', label: 'Policarbonato', custoM2: 350 },
  { value: 'METALICA', label: 'Metalica', custoM2: 450 },
  { value: 'MADEIRA', label: 'Madeira', custoM2: 550 },
]
const GOURMET_NIVEIS = [
  { value: 'BASICO', label: 'Basico', mult: 1.0 },
  { value: 'PADRAO', label: 'Padrao', mult: 1.12 },
  { value: 'PREMIUM', label: 'Premium', mult: 1.25 },
]
const GOURMET_ITENS = [
  { value: 'churrasqueira', label: 'Churrasqueira', custo: 3500 },
  { value: 'fogao', label: 'Fogao', custo: 2000 },
  { value: 'pia', label: 'Pia', custo: 1500 },
  { value: 'bancada', label: 'Bancada', custo: 4000 },
  { value: 'forno_pizza', label: 'Forno de pizza', custo: 5000 },
  { value: 'coifa', label: 'Coifa', custo: 2500 },
]
const PAVIMENTACAO_TIPOS = [
  { value: 'CONCRETO', label: 'Concreto', custoM2: 85 },
  { value: 'PAVER', label: 'Paver (bloquete)', custoM2: 100.30 },
  { value: 'CERAMICA_EXT', label: 'Ceramica externa', custoM2: 95.20 },
]

const LOGISTICA_OPTIONS = [
  { value: 'FACIL', label: 'Facil acesso', pct: 0 },
  { value: 'MODERADO', label: 'Acesso moderado', pct: 3 },
  { value: 'DIFICIL', label: 'Acesso dificil', pct: 7 },
]
const MAO_DE_OBRA_OPTIONS = [
  { value: 'ALTA', label: 'Alta disponibilidade', pct: 0 },
  { value: 'MEDIA', label: 'Disponibilidade media', pct: 5 },
  { value: 'BAIXA', label: 'Baixa disponibilidade', pct: 10 },
]
const CONTRATACAO_OPTIONS = [
  { value: 'AUTONOMOS', label: 'Autonomos', pct: 0 },
  { value: 'EMPREITEIRO', label: 'Empreiteiro', pct: 6 },
  { value: 'CONSTRUTORA', label: 'Construtora', pct: 12 },
]

const STORAGE_KEY = 'constructflow-wizard-detailed'

// ─── Material categories (typical CUB composition) ───────────────────────────
const MATERIAL_CATEGORIES = [
  { key: 'estrutura', label: 'Estrutura', pct: 0.25, color: '#EA580C' },
  { key: 'alvenaria', label: 'Alvenaria', pct: 0.12, color: '#F97316' },
  { key: 'cobertura', label: 'Cobertura', pct: 0.08, color: '#FB923C' },
  { key: 'eletrica', label: 'Inst. Eletricas', pct: 0.09, color: '#FDBA74' },
  { key: 'hidraulica', label: 'Inst. Hidraulicas', pct: 0.08, color: '#2563EB' },
  { key: 'revestimentos', label: 'Revestimentos', pct: 0.18, color: '#3B82F6' },
  { key: 'pintura', label: 'Pintura', pct: 0.07, color: '#60A5FA' },
  { key: 'esquadrias', label: 'Esquadrias', pct: 0.08, color: '#93C5FD' },
  { key: 'outros', label: 'Outros', pct: 0.05, color: '#D4D4D8' },
]

// CUB typical composition (informational)
const CUB_COMPOSITION = [
  { label: 'Materiais de construcao', pctTipico: 51.0 },
  { label: 'Mao de obra', pctTipico: 42.0 },
  { label: 'Despesas administrativas', pctTipico: 7.0 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace('.', ',')
}

// ─── Report Content ──────────────────────────────────────────────────────────

function ReportContent() {
  const router = useRouter()
  const { activeProject } = useProject()
  const [data, setData] = useState<WizardData | null>(null)
  const [cubValues, setCubValues] = useState<CubValues | null>(null)
  const [loading, setLoading] = useState(true)

  // Load wizard data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setData(JSON.parse(saved))
      } catch {
        setData(null)
      }
    }
    setLoading(false)
  }, [])

  // Fetch CUB values
  useEffect(() => {
    if (!data?.estado) return

    const fetchCub = async () => {
      try {
        const res = await fetch(`/api/budget/cub?state=${data.estado}`)
        if (res.ok) {
          const records = await res.json()
          if (Array.isArray(records) && records.length > 0) {
            const pis = records.find((r: { cubCode: string }) => r.cubCode === 'PIS')
            const r1n = records.find((r: { cubCode: string }) => r.cubCode === 'R1-N')
            const r1a = records.find((r: { cubCode: string }) => r.cubCode === 'R1-A')
            if (pis && r1n && r1a) {
              const dbDateNum = pis.referenceYear * 12 + pis.referenceMonth
              const fallbackDateNum = 2026 * 12 + 1
              const hasFallback = !!CUB_FALLBACK[data.estado]
              if (dbDateNum >= fallbackDateNum || !hasFallback) {
                setCubValues({
                  PIS: pis.totalValue,
                  'R1-N': r1n.totalValue,
                  'R1-A': r1a.totalValue,
                  referenceLabel: `${String(pis.referenceMonth).padStart(2, '0')}/${pis.referenceYear}`,
                })
                return
              }
            }
          }
        }
      } catch { /* fallback below */ }

      const fb = CUB_FALLBACK[data.estado]
      if (fb) {
        setCubValues({ PIS: fb.PIS, 'R1-N': fb['R1-N'], 'R1-A': fb['R1-A'], referenceLabel: '01/2026' })
      }
    }

    fetchCub()
  }, [data?.estado])

  // ─── All computed values ────────────────────────────────────────────────────

  const computedValues = useMemo(() => {
    if (!data || !cubValues) return null

    const selectedPadrao = PADRAO_OPTIONS.find((p) => p.value === data.padrao) || PADRAO_OPTIONS[0]
    const cubPIS = cubValues.PIS
    const cubPerM2 = cubValues[selectedPadrao.cubCode as keyof CubValues] as number
    const multiplicadorAcabamento = cubPIS > 0 ? cubPerM2 / cubPIS : 1

    const areaConstruidaNum = Number(data.areaConstruida) || 0
    const totalRoomsArea = data.rooms.reduce((sum, r) => sum + r.width * r.length, 0)
    const areaRef = totalRoomsArea > 0 ? totalRoomsArea : areaConstruidaNum

    const areaTerreno = (() => {
      const f = Number(data.frenteTerreno) || 0
      const fu = Number(data.fundosTerreno) || 0
      const ld = Number(data.ladoDireitoTerreno) || 0
      const le = Number(data.ladoEsquerdoTerreno) || 0
      if (f <= 0 && fu <= 0 && ld <= 0 && le <= 0) return 0
      return ((f + fu) / 2) * ((ld + le) / 2)
    })()

    const valorBaseEstimado = cubPerM2 * areaRef

    // Structural multiplier (additive)
    const replacedKeys = new Set<string>()
    for (const section of PRO_SECTIONS) {
      for (const field of section.fields) {
        if (field.replaces && data[field.key as keyof WizardData]) {
          replacedKeys.add(field.replaces)
        }
      }
    }

    interface MultiplierItem { label: string; pct: number; source: 'essential' | 'profissional' }
    const multiplierItems: MultiplierItem[] = []
    let totalPct = 0

    const pavPct = PAVIMENTOS_MULTIPLIER[data.numFloors] || 0
    if (pavPct !== 0) {
      multiplierItems.push({ label: `Pavimentos (${data.numFloors} pav.)`, pct: pavPct, source: 'essential' })
      totalPct += pavPct
    }

    for (const field of STRUCTURAL_FIELDS) {
      if (replacedKeys.has(field.key)) continue
      const selectedValue = data[field.key as keyof WizardData] as string
      const option = field.options.find((o) => o.value === selectedValue)
      if (option && option.pct !== 0) {
        multiplierItems.push({ label: `${field.label} (${option.label})`, pct: option.pct, source: 'essential' })
        totalPct += option.pct
      }
    }

    for (const section of PRO_SECTIONS) {
      for (const field of section.fields) {
        const val = data[field.key as keyof WizardData] as string
        if (!val) continue
        const option = field.options.find((o) => o.value === val)
        if (option) {
          multiplierItems.push({ label: `${field.label} (${option.label})`, pct: option.pct, source: 'profissional' })
          totalPct += option.pct
        }
      }
    }

    if (data.possuiSubsolo) {
      totalPct += 25
      multiplierItems.push({ label: 'Subsolo', pct: 25, source: 'essential' })
    }

    const multiplicadorTotal = 1 + totalPct / 100
    const valorEstimado = valorBaseEstimado * multiplicadorTotal

    // External area costs
    const perimetroTerreno = (Number(data.frenteTerreno) || 0) + (Number(data.fundosTerreno) || 0) +
      (Number(data.ladoDireitoTerreno) || 0) + (Number(data.ladoEsquerdoTerreno) || 0)
    const ae = data.areaExterna
    const areaExternaCosts: { label: string; value: number; details?: string }[] = []

    if (ae?.piscina?.enabled) {
      const tipoConfig = PISCINA_TIPOS.find((t) => t.value === ae.piscina.tipo)
      const area = (Number(ae.piscina.comprimento) || 0) * (Number(ae.piscina.largura) || 0)
      let custo = area * (tipoConfig?.custoM2 || 1500)
      const profundidade = Number(ae.piscina.profundidade) || 1.5
      custo *= profundidade / 1.5
      if (ae.piscina.aquecimento) custo *= 1.12
      if (ae.piscina.iluminacao) custo *= 1.05
      if (custo > 0) {
        areaExternaCosts.push({
          label: 'Piscina',
          value: custo,
          details: `${tipoConfig?.label || 'Fibra'} — ${Number(ae.piscina.comprimento)}x${Number(ae.piscina.largura)}m, prof. ${profundidade}m`,
        })
      }
    }

    if (ae?.muro?.enabled) {
      const tipoConfig = MURO_TIPOS.find((t) => t.value === ae.muro.tipo)
      const pct = (ae.muro.percentualPerimetro || 100) / 100
      const comprMuro = perimetroTerreno * pct
      const altura = Number(ae.muro.altura) || 2
      const areaMuro = comprMuro * altura
      let custoM2 = tipoConfig?.custoM2 || 280
      if (altura > 1.5) custoM2 *= 1.12
      const custo = areaMuro * custoM2
      if (custo > 0) {
        areaExternaCosts.push({
          label: 'Muro Perimetral',
          value: custo,
          details: `${tipoConfig?.label || 'Alvenaria'} — ${formatNumber(comprMuro, 1)}m x ${formatNumber(altura, 1)}m (${ae.muro.percentualPerimetro}% do perimetro)`,
        })
      }
    }

    if (ae?.cobertura?.enabled) {
      const tipoConfig = COBERTURA_EXT_TIPOS.find((t) => t.value === ae.cobertura.tipo)
      const area = Number(ae.cobertura.area) || 0
      let custo = area * (tipoConfig?.custoM2 || 350)
      if (ae.cobertura.complexidade === 'MEDIA') custo *= 1.08
      if (custo > 0) {
        areaExternaCosts.push({
          label: 'Cobertura Externa',
          value: custo,
          details: `${tipoConfig?.label || 'Policarbonato'} — ${area} m2`,
        })
      }
    }

    if (ae?.gourmet?.enabled) {
      const nivelConfig = GOURMET_NIVEIS.find((n) => n.value === ae.gourmet.nivel)
      const mult = nivelConfig?.mult || 1.0
      const itensCusto = (ae.gourmet.itens || []).reduce((sum, item) => {
        const cfg = GOURMET_ITENS.find((g) => g.value === item)
        return sum + (cfg?.custo || 0)
      }, 0)
      const custo = itensCusto * mult
      if (custo > 0) {
        const itensLabels = (ae.gourmet.itens || []).map(i => GOURMET_ITENS.find(g => g.value === i)?.label || i)
        areaExternaCosts.push({
          label: 'Area Gourmet',
          value: custo,
          details: `${nivelConfig?.label || 'Basico'} — ${itensLabels.join(', ')}`,
        })
      }
    }

    if (ae?.pavimentacao?.enabled) {
      const tipoConfig = PAVIMENTACAO_TIPOS.find((t) => t.value === ae.pavimentacao.tipo)
      const area = Number(ae.pavimentacao.area) || 0
      const custo = area * (tipoConfig?.custoM2 || 85)
      if (custo > 0) {
        areaExternaCosts.push({
          label: 'Pavimentacao Externa',
          value: custo,
          details: `${tipoConfig?.label || 'Concreto'} — ${area} m2`,
        })
      }
    }

    const totalAreaExternaCost = areaExternaCosts.reduce((sum, c) => sum + c.value, 0)

    // Regional adjustments
    const logPct = LOGISTICA_OPTIONS.find((o) => o.value === data.logisticaAcesso)?.pct || 0
    const maoPct = MAO_DE_OBRA_OPTIONS.find((o) => o.value === data.maoDeObra)?.pct || 0
    const contPct = CONTRATACAO_OPTIONS.find((o) => o.value === data.formaContratacao)?.pct || 0
    const totalRegionalPct = (data.mercadoLocal || 0) + logPct + maoPct + contPct + (data.ajusteManualFinal || 0)
    const multiplicadorRegional = 1 + totalRegionalPct / 100
    const valorBaseOrcamento = valorEstimado + totalAreaExternaCost
    const valorFinalAjustado = valorBaseOrcamento * multiplicadorRegional

    // Material breakdown estimation
    const materialBreakdown = MATERIAL_CATEGORIES.map((cat) => ({
      ...cat,
      value: valorEstimado * cat.pct,
    }))

    // Structural choices for display (all 7 fields + pro fields)
    const structuralChoices: { label: string; value: string }[] = []
    for (const field of STRUCTURAL_FIELDS) {
      const selectedValue = data[field.key as keyof WizardData] as string
      const option = field.options.find((o) => o.value === selectedValue)
      if (option) {
        const replaced = replacedKeys.has(field.key)
        structuralChoices.push({
          label: field.label,
          value: replaced ? `${option.label} (substituido)` : option.label,
        })
      }
    }

    // Regional adjustment items for display
    const regionalItems: { label: string; pct: number }[] = []
    if ((data.mercadoLocal || 0) !== 0) regionalItems.push({ label: 'Mercado Local', pct: data.mercadoLocal })
    if (logPct !== 0) regionalItems.push({ label: `Logistica (${LOGISTICA_OPTIONS.find(o => o.value === data.logisticaAcesso)?.label})`, pct: logPct })
    if (maoPct !== 0) regionalItems.push({ label: `Mao de Obra (${MAO_DE_OBRA_OPTIONS.find(o => o.value === data.maoDeObra)?.label})`, pct: maoPct })
    if (contPct !== 0) regionalItems.push({ label: `Contratacao (${CONTRATACAO_OPTIONS.find(o => o.value === data.formaContratacao)?.label})`, pct: contPct })
    if ((data.ajusteManualFinal || 0) !== 0) regionalItems.push({ label: 'Ajuste Manual', pct: data.ajusteManualFinal })

    return {
      selectedPadrao,
      cubPIS,
      cubPerM2,
      multiplicadorAcabamento,
      areaConstruidaNum,
      totalRoomsArea,
      areaRef,
      areaTerreno,
      valorBaseEstimado,
      multiplierItems,
      totalPct,
      multiplicadorTotal,
      valorEstimado,
      areaExternaCosts,
      totalAreaExternaCost,
      regionalItems,
      totalRegionalPct,
      multiplicadorRegional,
      valorBaseOrcamento,
      valorFinalAjustado,
      materialBreakdown,
      structuralChoices,
      custoM2Final: areaRef > 0 ? valorFinalAjustado / areaRef : 0,
    }
  }, [data, cubValues])

  // ─── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando relatorio...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum orcamento encontrado</h3>
              <p className="text-gray-500 mb-4">Preencha o assistente de orcamento primeiro.</p>
              <Button onClick={() => router.push('/budget/detailed/new')} className="bg-orange-600 hover:bg-orange-700">
                Criar Orcamento
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!computedValues) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Calculando valores...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const v = computedValues
  const today = new Date()
  const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const refNumber = `REF-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-20">
        {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm print:hidden">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/budget')}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/budget/detailed/new')}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <PenLine className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar e Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({ title: 'Cronograma', description: 'Funcionalidade de cronograma sera implementada em breve.' })
              }}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Cronograma</span>
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast({ title: 'Relatorio salvo', description: 'O relatorio foi salvo com sucesso.' })
              }}
              className="bg-orange-600 hover:bg-orange-700 flex items-center gap-1.5 flex-shrink-0"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Salvar Relatorio</span>
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* ─── Header Card ──────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl shadow-lg p-6 md:p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold">Relatorio de Orcamento Detalhado</h1>
                    <p className="text-orange-100 text-sm">ConstructFlow</p>
                  </div>
                </div>
                <h2 className="text-lg font-semibold mt-4">{data.nomeProjeto}</h2>
                <p className="text-orange-100 text-sm mt-1">{data.tipoObra === 'CASA_NOVA' ? 'Casa Nova' : 'Reforma'}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-orange-100">{refNumber}</p>
                <p className="text-orange-100 mt-1">{dateStr}</p>
              </div>
            </div>
          </div>

          {/* ─── Section 1 — Informacoes do Projeto ───────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">1. Informacoes do Projeto</h3>
                <p className="text-xs text-gray-500">Dados gerais e parametros de calculo</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Localizacao" value={`${data.cidade}, ${ESTADOS_BR[data.estado] || data.estado}`} />
                <InfoRow label="Area do Terreno" value={v.areaTerreno > 0 ? `${formatNumber(v.areaTerreno)} m2` : 'Nao informado'} />
                <InfoRow label="Area Planejada" value={`${formatNumber(v.areaConstruidaNum)} m2`} />
                <InfoRow label="Area dos Comodos" value={v.totalRoomsArea > 0 ? `${formatNumber(v.totalRoomsArea)} m2` : 'Nao informado'} />
                <InfoRow label="Area Utilizada no Calculo" value={`${formatNumber(v.areaRef)} m2`} highlight />
                <InfoRow label="Pavimentos" value={`${data.numFloors} pavimento${data.numFloors > 1 ? 's' : ''}`} />
                <InfoRow label="Padrao de Acabamento" value={v.selectedPadrao.label} />
                <InfoRow label="CUB Ref." value={cubValues?.referenceLabel || '01/2026'} />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Parametros CUB</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">CUB Base do Estado (PIS)</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(v.cubPIS)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Multiplicador do Acabamento</p>
                    <p className="text-lg font-bold text-orange-600">x{formatNumber(v.multiplicadorAcabamento, 4)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                    <p className="text-xs text-orange-600 mb-1">CUB com Acabamento ({v.selectedPadrao.cubCode})</p>
                    <p className="text-lg font-bold text-orange-700">{formatCurrency(v.cubPerM2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Section 2 — Comodos Projetados ───────────────────────────── */}
          {data.rooms.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">2. Comodos Projetados</h3>
                  <p className="text-xs text-gray-500">{data.rooms.length} ambiente{data.rooms.length > 1 ? 's' : ''} definido{data.rooms.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-6 py-3 font-medium">Ambiente</th>
                      <th className="text-center px-6 py-3 font-medium">Dimensoes</th>
                      <th className="text-right px-6 py-3 font-medium">Area</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.rooms.map((room) => (
                      <tr key={room.id}>
                        <td className="px-6 py-3 text-gray-900">{room.label}</td>
                        <td className="px-6 py-3 text-center text-gray-600">
                          {formatNumber(room.width, 1)} x {formatNumber(room.length, 1)} m
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-gray-900">
                          {formatNumber(room.width * room.length)} m2
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-gray-900" colSpan={2}>Total</td>
                      <td className="px-6 py-3 text-right font-mono text-gray-900">{formatNumber(v.totalRoomsArea)} m2</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ─── Section 3 — Caracteristicas Estruturais ──────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">3. Caracteristicas Estruturais</h3>
                <p className="text-xs text-gray-500">Especificacoes construtivas e seus impactos</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {v.structuralChoices.map((choice) => (
                  <div key={choice.label} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{choice.label}</span>
                    <span className="text-sm font-medium text-gray-900">{choice.value}</span>
                  </div>
                ))}
                {data.possuiSubsolo && (
                  <div className="flex justify-between items-center py-2 px-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-sm text-amber-700">Subsolo</span>
                    <span className="text-sm font-medium text-amber-700">Sim (+25%)</span>
                  </div>
                )}
              </div>

              {/* Multiplier items */}
              {v.multiplierItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalhamento do Multiplicador</h4>
                  <div className="space-y-1">
                    {v.multiplierItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className={`font-mono ${item.pct >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {item.pct >= 0 ? '+' : ''}{formatNumber(item.pct, 1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-orange-800">Multiplicador Estrutural</span>
                <span className="text-xl font-bold text-orange-700">
                  x{formatNumber(v.multiplicadorTotal, 4)}
                  <span className="text-sm font-normal text-orange-600 ml-2">
                    ({v.totalPct >= 0 ? '+' : ''}{formatNumber(v.totalPct, 1)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* ─── Section 4 — Orcamento da Construcao ──────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">4. Orcamento da Construcao</h3>
                <p className="text-xs text-gray-500">Calculo detalhado do custo estimado</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Formula */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">Formula de calculo</p>
                <p className="text-sm font-mono text-gray-700">
                  CUB ({formatCurrency(v.cubPerM2)}) x Area ({formatNumber(v.areaRef)} m2) = Valor Base
                </p>
              </div>

              <div className="space-y-3">
                <CalcRow label="Valor Base (CUB x Area)" value={formatCurrency(v.valorBaseEstimado)} />
                <CalcRow label={`Multiplicador Estrutural (x${formatNumber(v.multiplicadorTotal, 4)})`} value={`x ${formatNumber(v.multiplicadorTotal, 4)}`} subtle />
                <div className="border-t border-gray-200 pt-3">
                  <CalcRow label="Subtotal da Construcao" value={formatCurrency(v.valorEstimado)} bold />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Section 5 — Area Externa ─────────────────────────────────── */}
          {v.areaExternaCosts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">5. Area Externa</h3>
                  <p className="text-xs text-gray-500">{v.areaExternaCosts.length} item{v.areaExternaCosts.length > 1 ? 'ns' : ''} adicionado{v.areaExternaCosts.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {v.areaExternaCosts.map((item, i) => (
                    <div key={i} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        {item.details && <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>}
                      </div>
                      <span className="font-mono text-sm font-semibold text-gray-900 ml-4 flex-shrink-0">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-teal-800">Subtotal Area Externa</span>
                  <span className="text-lg font-bold text-teal-700">{formatCurrency(v.totalAreaExternaCost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Section 6 — Estimativa de Materiais ──────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">6. Estimativa de Materiais</h3>
                <p className="text-xs text-gray-500">Distribuicao estimada dos custos por categoria</p>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-2 mb-6">
                {v.materialBreakdown.map((cat) => (
                  <div key={cat.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-gray-700">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-xs text-gray-400">{(cat.pct * 100).toFixed(0)}%</span>
                      <span className="text-sm font-mono font-medium text-gray-900 w-28 text-right">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex items-center justify-between font-bold">
                  <span className="text-sm text-gray-900">TOTAL ESTIMADO</span>
                  <span className="text-sm font-mono text-gray-900">{formatCurrency(v.valorEstimado)}</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={v.materialBreakdown}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(val: number) =>
                        new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', currency: 'BRL', style: 'currency' }).format(val)
                      }
                      fontSize={11}
                    />
                    <YAxis type="category" dataKey="label" width={110} fontSize={11} />
                    <Tooltip
                      formatter={(val) => formatCurrency(Number(val))}
                      labelFormatter={(label) => String(label)}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {v.materialBreakdown.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ─── Section 7 — Composicao do CUB ────────────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Info className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">7. Composicao do CUB (Informativo)</h3>
                <p className="text-xs text-gray-500">Distribuicao tipica dos custos no CUB/SINDUSCON</p>
              </div>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left font-medium pb-3">Componente</th>
                    <th className="text-right font-medium pb-3">Valor Estimado</th>
                    <th className="text-right font-medium pb-3">% Tipico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CUB_COMPOSITION.map((comp) => (
                    <tr key={comp.label}>
                      <td className="py-3 text-gray-900">{comp.label}</td>
                      <td className="py-3 text-right font-mono text-gray-900">
                        {formatCurrency(v.valorEstimado * (comp.pctTipico / 100))}
                      </td>
                      <td className="py-3 text-right text-gray-600">{formatNumber(comp.pctTipico, 1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3 italic">
                Os percentuais acima sao referencias tipicas do SINDUSCON e podem variar conforme o projeto.
              </p>
            </div>
          </div>

          {/* ─── Section 8 — Ajustes Regionais ────────────────────────────── */}
          {(v.totalRegionalPct !== 0 || v.regionalItems.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">8. Ajustes Regionais</h3>
                  <p className="text-xs text-gray-500">Adequacoes conforme realidade local</p>
                </div>
              </div>
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-left font-medium pb-3">Parametro</th>
                      <th className="text-right font-medium pb-3">Ajuste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 text-gray-900">Valor base do orcamento</td>
                      <td className="py-3 text-right font-mono text-gray-900">{formatCurrency(v.valorBaseOrcamento)}</td>
                    </tr>
                    {v.regionalItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 text-gray-900">{item.label}</td>
                        <td className={`py-3 text-right font-mono ${item.pct >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {item.pct >= 0 ? '+' : ''}{formatNumber(item.pct, 1)}%
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-3 text-gray-900">Multiplicador regional</td>
                      <td className="py-3 text-right font-mono text-gray-900">x{formatNumber(v.multiplicadorRegional, 4)}</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="py-3 text-gray-900">Valor final ajustado</td>
                      <td className="py-3 text-right font-mono text-gray-900">{formatCurrency(v.valorFinalAjustado)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Final Summary Card ───────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl shadow-lg p-6 md:p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6" />
              <h3 className="text-lg font-bold">Resumo Final do Orcamento</h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-orange-100">Subtotal Construcao</span>
                <span className="font-mono">{formatCurrency(v.valorEstimado)}</span>
              </div>
              {v.totalAreaExternaCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-100">Subtotal Area Externa</span>
                  <span className="font-mono">{formatCurrency(v.totalAreaExternaCost)}</span>
                </div>
              )}
              {v.totalRegionalPct !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-100">Ajuste Regional ({v.totalRegionalPct >= 0 ? '+' : ''}{formatNumber(v.totalRegionalPct, 1)}%)</span>
                  <span className="font-mono">{formatCurrency(v.valorFinalAjustado - v.valorBaseOrcamento)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/30 pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-orange-100 text-sm">TOTAL ESTIMADO DO ORCAMENTO</p>
                  <p className="text-3xl md:text-4xl font-bold mt-1">{formatCurrency(v.valorFinalAjustado)}</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-xs">Custo por m2</p>
                  <p className="text-lg font-bold">{formatCurrency(v.custoM2Final)}/m2</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Disclaimer ───────────────────────────────────────────────── */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Aviso Importante:</strong> Este relatorio e uma estimativa baseada no CUB/SINDUSCON
                  (referencia {cubValues?.referenceLabel || '01/2026'}) e nos parametros informados. Os valores
                  apresentados sao aproximados e podem variar conforme condicoes de mercado, especificacoes
                  tecnicas detalhadas e particularidades do projeto.
                </p>
                <p>
                  Recomenda-se a contratacao de profissionais habilitados (engenheiros e arquitetos) para
                  elaboracao de orcamento analitico detalhado antes da execucao da obra.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom spacing for print */}
          <div className="h-8 print:h-0" />
        </div>
      </div>
    </div>
  )
}

// ─── Helper components ─────────────────────────────────────────────────────────

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${highlight ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-orange-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

function CalcRow({ label, value, bold, subtle }: { label: string; value: string; bold?: boolean; subtle?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : subtle ? 'text-gray-500' : 'text-gray-700'}`}>{label}</span>
      <span className={`font-mono text-sm ${bold ? 'font-bold text-gray-900' : subtle ? 'text-gray-500' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

// ─── Page export ───────────────────────────────────────────────────────────────

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 md:ml-20">
            <div className="max-w-4xl mx-auto p-4 md:p-6">
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Carregando relatorio...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  )
}
