"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/project-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp, FileText, ArrowRight, Plus, Building2, Loader2, Sparkles, Trash2, Ruler, MapPin, PenLine } from 'lucide-react'
import Link from 'next/link'
import { CreateBudgetDialog } from '@/components/orcamento-real/CreateBudgetDialog'
import { GenerateAIBudgetDialog } from '@/components/orcamento-ai/GenerateAIBudgetDialog'

interface BudgetEstimated {
  totalEstimatedCost: number
  totalLandCost: number
  constructionCost: number
  cubValue: number
  cubReferenceMonth: string | null
  updatedAt: string
  data?: {
    totalEstimatedCost?: number
    totalLandCost?: number
    constructionCost?: number
    cubValue?: number
  }
}

interface ProjectFileData {
  id: string
  fileName: string
  category: string
  fileSize: number
  uploadedAt: string
}

interface BudgetAIData {
  id: string
  name: string
  status: string
  totalDirectCost: number
  generatedAt: string | null
  stages: Array<{ id: string; code: string | null; totalCost: number }>
}

interface BudgetDetailedData {
  id: string
  totalDirectCost: number
  itemCount: number | null
  areaConstruida: number
  padrao: string
  generatedAt: string | null
}

export default function BudgetPage() {
  const router = useRouter()
  const { activeProject } = useProject()
  const [loading, setLoading] = useState(true)
  const [budgetEstimated, setBudgetEstimated] = useState<BudgetEstimated | null>(null)
  const [budgetReal, setBudgetReal] = useState<{ id: string; name: string; totalDirectCost: number; status: string; stages: { id: string; code: string | null; totalCost: number }[] } | null>(null)
  const [budgetAI, setBudgetAI] = useState<BudgetAIData | null>(null)
  const [projectFiles, setProjectFiles] = useState<ProjectFileData[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [budgetDetailed, setBudgetDetailed] = useState<BudgetDetailedData | null>(null)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deletingAI, setDeletingAI] = useState(false)
  const [deletingDetailed, setDeletingDetailed] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Wizard data from localStorage
  const [wizardSummary, setWizardSummary] = useState<{
    valorFinal: number
    areaRef: number
    custoM2: number
    padrao: string
    localizacao: string
  } | null>(null)

  const fetchBudgetData = useCallback(async () => {
    if (!activeProject) return

    try {
      setLoading(true)

      // Buscar orçamento estimado
      const response = await fetch(`/api/budget/estimated?projectId=${activeProject.id}`)
      if (response.ok) {
        const data = await response.json()
        setBudgetEstimated(data)
      } else {
        setBudgetEstimated(null)
      }

      // Buscar orçamento real
      const realRes = await fetch(`/api/budget-real?projectId=${activeProject.id}`)
      if (realRes.ok) {
        const realData = await realRes.json()
        if (realData.length > 0) {
          const br = realData[0]
          setBudgetReal({
            id: br.id,
            name: br.name,
            totalDirectCost: Number(br.totalDirectCost),
            status: br.status,
            stages: br.stages.map((s: { id: string; code: string | null; totalCost: number }) => ({
              id: s.id,
              code: s.code,
              totalCost: Number(s.totalCost),
            })),
          })
        } else {
          setBudgetReal(null)
        }
      }

      // Buscar orçamento IA
      const aiRes = await fetch(`/api/budget-ai?projectId=${activeProject.id}`)
      if (aiRes.ok) {
        const aiData = await aiRes.json()
        if (aiData.length > 0) {
          const ai = aiData[0]
          setBudgetAI({
            id: ai.id,
            name: ai.name,
            status: ai.status,
            totalDirectCost: Number(ai.totalDirectCost),
            generatedAt: ai.generatedAt,
            stages: ai.stages.map((s: { id: string; code: string | null; totalCost: number }) => ({
              id: s.id,
              code: s.code,
              totalCost: Number(s.totalCost),
            })),
          })

          // Start polling if GENERATING or EXTRACTING
          if (ai.status === 'GENERATING' || ai.status === 'PENDING' || ai.status === 'EXTRACTING') {
            setGenerating(true)
            startPolling(ai.id)
          }
        } else {
          setBudgetAI(null)
        }
      }

      // Buscar orçamento detalhado
      const detailedRes = await fetch(`/api/budget-detailed?projectId=${activeProject.id}`)
      if (detailedRes.ok) {
        const detailedData = await detailedRes.json()
        if (detailedData.length > 0) {
          const d = detailedData[0]
          setBudgetDetailed({
            id: d.id,
            totalDirectCost: Number(d.totalDirectCost),
            itemCount: d.itemCount,
            areaConstruida: Number(d.areaConstruida),
            padrao: d.padrao,
            generatedAt: d.generatedAt,
          })
        } else {
          setBudgetDetailed(null)
        }
      }

      // Buscar arquivos do projeto
      const filesRes = await fetch(`/api/projects/${activeProject.id}/files`)
      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setProjectFiles(filesData)
      }
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error)
    } finally {
      setLoading(false)
    }
  }, [activeProject])

  useEffect(() => {
    if (activeProject) {
      fetchBudgetData()
    } else {
      setLoading(false)
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [activeProject, fetchBudgetData])

  // Load wizard summary from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('constructflow-wizard-detailed')
      if (!saved) { setWizardSummary(null); return }
      const wd = JSON.parse(saved)
      // Must have minimum required data to show
      if (!wd.estado || !wd.areaConstruida || !wd.padrao) { setWizardSummary(null); return }

      const PADRAO_MAP: Record<string, { label: string; cubCode: string }> = {
        POPULAR: { label: 'Popular', cubCode: 'PIS' },
        MEDIO_PADRAO: { label: 'Normal', cubCode: 'R1-N' },
        ALTO_PADRAO: { label: 'Alto Padrao', cubCode: 'R1-A' },
      }
      const CUB_FB: Record<string, Record<string, number>> = {
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

      const padraoInfo = PADRAO_MAP[wd.padrao] || PADRAO_MAP.POPULAR
      const fb = CUB_FB[wd.estado]
      if (!fb) { setWizardSummary(null); return }
      const cubPerM2 = fb[padraoInfo.cubCode] || 0
      if (!cubPerM2) { setWizardSummary(null); return }

      const totalRoomsArea = (wd.rooms || []).reduce((s: number, r: { width: number; length: number }) => s + r.width * r.length, 0)
      const areaConstruidaNum = Number(wd.areaConstruida) || 0
      const areaRef = totalRoomsArea > 0 ? totalRoomsArea : areaConstruidaNum
      const valorBase = cubPerM2 * areaRef

      // Structural multiplier (simplified — same additive logic)
      const STRUCT_OPTS: Record<string, Record<string, number>> = {
        fundacao: { SAPATA_CORRIDA: 0, RADIER: 4, ESTACA: 12 },
        forro: { PVC: 0, GESSO: 1.5, GESSO_ACARTONADO: 2, MADEIRA: 3 },
        piso: { CERAMICA: 0, PORCELANATO_SIMPLES: 2, PORCELANATO_POLIDO: 3.5, VINILICO: 1.5, PISO_LAMINADO: 2.5 },
        fachada: { PINTURA_LATEX: 0, TEXTURA: 1, GRAFIATO: 1.5, CERAMICA_FACHADA: 3, PORCELANATO_FACHADA: 4, PEDRA_NATURAL: 6 },
        sistemaConstrutivo: { ALVENARIA_CONVENCIONAL: 0, BLOCOS_CONCRETO: 2, STEEL_FRAME: 15, WOOD_FRAME: 18 },
        telhado: { FIBROCIMENTO: 0, CERAMICA_TELHADO: 3, METALICO: 5, LAJE_IMPERMEABILIZADA: 8 },
        esquadrias: { ALUMINIO_PADRAO: 0, ALUMINIO_PREMIUM: 1.5, PVC_ESQUADRIA: 2, VIDRO_TEMPERADO: 3, MADEIRA_MACICA: 4 },
      }
      const PRO_REPLACE: Record<string, string> = {
        proTipoEstrutura: 'sistemaConstrutivo', proTipoTelha: 'telhado', proLinhaEsquadria: 'esquadrias',
      }
      const PRO_OPTS: Record<string, Record<string, number>> = {
        proTipoEstrutura: { CONVENCIONAL: 0, REFORCADA: 5, LEVE: -4 },
        proTipoLaje: { MACICA: 3, NERVURADA: 0, PRE_MOLDADA: -6, STEEL_DECK: 8 },
        proTipoParedeExterna: { ALVENARIA_CONV: 0, BLOCO_ESTRUTURAL: 2, PRE_FABRICADO: -3, ICF: 10 },
        proTipoParedeInterna: { ALVENARIA_CONV: 0, BLOCO_ESTRUTURAL: 1, DRYWALL: -2 },
        proTipoTelha: { CERAMICA: 3, FIBROCIMENTO: -5, METALICA: 5, TERMOACUSTICA: 8 },
        proComplexidadeCobertura: { SIMPLES: 0, MEDIA: 3, COMPLEXA: 8 },
        proLinhaEsquadria: { ECONOMICA: -5, PADRAO: 0, PREMIUM: 5 },
        proMaterialEsquadria: { ALUMINIO: 0, PVC: 2, MADEIRA: 4, MISTO: 1 },
      }

      const replacedKeys = new Set<string>()
      for (const [proKey, essKey] of Object.entries(PRO_REPLACE)) {
        if (wd[proKey]) replacedKeys.add(essKey)
      }

      const PAV_MULT: Record<number, number> = { 1: 0, 2: 22, 3: 40, 4: 55, 5: 70 }
      let totalPct = PAV_MULT[wd.numFloors] || 0
      for (const [key, opts] of Object.entries(STRUCT_OPTS)) {
        if (replacedKeys.has(key)) continue
        totalPct += opts[wd[key]] || 0
      }
      for (const [key, opts] of Object.entries(PRO_OPTS)) {
        if (wd[key]) totalPct += opts[wd[key]] || 0
      }
      if (wd.possuiSubsolo) totalPct += 25

      const multTotal = 1 + totalPct / 100
      const valorEstimado = valorBase * multTotal

      // External area costs (simplified)
      let totalExtCost = 0
      const ae = wd.areaExterna
      if (ae) {
        const perim = (Number(wd.frenteTerreno) || 0) + (Number(wd.fundosTerreno) || 0) +
          (Number(wd.ladoDireitoTerreno) || 0) + (Number(wd.ladoEsquerdoTerreno) || 0)
        if (ae.piscina?.enabled) {
          const piscinaC: Record<string, number> = { FIBRA: 1500, CONCRETO: 2500, VINIL: 1800 }
          const area = (Number(ae.piscina.comprimento) || 0) * (Number(ae.piscina.largura) || 0)
          let c = area * (piscinaC[ae.piscina.tipo] || 1500) * ((Number(ae.piscina.profundidade) || 1.5) / 1.5)
          if (ae.piscina.aquecimento) c *= 1.12
          if (ae.piscina.iluminacao) c *= 1.05
          totalExtCost += c
        }
        if (ae.muro?.enabled) {
          const muroC: Record<string, number> = { ALVENARIA: 280, PRE_MOLDADO: 220, MISTO: 250 }
          const alt = Number(ae.muro.altura) || 2
          let cm2 = muroC[ae.muro.tipo] || 280
          if (alt > 1.5) cm2 *= 1.12
          totalExtCost += perim * ((ae.muro.percentualPerimetro || 100) / 100) * alt * cm2
        }
        if (ae.cobertura?.enabled) {
          const cobC: Record<string, number> = { POLICARBONATO: 350, METALICA: 450, MADEIRA: 550 }
          let c = (Number(ae.cobertura.area) || 0) * (cobC[ae.cobertura.tipo] || 350)
          if (ae.cobertura.complexidade === 'MEDIA') c *= 1.08
          totalExtCost += c
        }
        if (ae.gourmet?.enabled) {
          const gNivelM: Record<string, number> = { BASICO: 1, PADRAO: 1.12, PREMIUM: 1.25 }
          const gItemC: Record<string, number> = { churrasqueira: 3500, fogao: 2000, pia: 1500, bancada: 4000, forno_pizza: 5000, coifa: 2500 }
          const itensC = (ae.gourmet.itens || []).reduce((s: number, i: string) => s + (gItemC[i] || 0), 0)
          totalExtCost += itensC * (gNivelM[ae.gourmet.nivel] || 1)
        }
        if (ae.pavimentacao?.enabled) {
          const pavC: Record<string, number> = { CONCRETO: 85, PAVER: 100.30, CERAMICA_EXT: 95.20 }
          totalExtCost += (Number(ae.pavimentacao.area) || 0) * (pavC[ae.pavimentacao.tipo] || 85)
        }
      }

      // Regional adjustments
      const logP: Record<string, number> = { FACIL: 0, MODERADO: 3, DIFICIL: 7 }
      const maoP: Record<string, number> = { ALTA: 0, MEDIA: 5, BAIXA: 10 }
      const conP: Record<string, number> = { AUTONOMOS: 0, EMPREITEIRO: 6, CONSTRUTORA: 12 }
      const regPct = (wd.mercadoLocal || 0) + (logP[wd.logisticaAcesso] || 0) +
        (maoP[wd.maoDeObra] || 0) + (conP[wd.formaContratacao] || 0) + (wd.ajusteManualFinal || 0)
      const valorFinal = (valorEstimado + totalExtCost) * (1 + regPct / 100)

      const ESTADOS: Record<string, string> = {
        AC: 'AC', AL: 'AL', AP: 'AP', AM: 'AM', BA: 'BA', CE: 'CE', DF: 'DF', ES: 'ES',
        GO: 'GO', MA: 'MA', MT: 'MT', MS: 'MS', MG: 'MG', PA: 'PA', PB: 'PB', PR: 'PR',
        PE: 'PE', PI: 'PI', RJ: 'RJ', RN: 'RN', RS: 'RS', RO: 'RO', RR: 'RR', SC: 'SC',
        SP: 'SP', SE: 'SE', TO: 'TO',
      }
      const loc = wd.cidade ? `${wd.cidade}, ${ESTADOS[wd.estado] || wd.estado}` : ESTADOS[wd.estado] || wd.estado

      setWizardSummary({
        valorFinal,
        areaRef,
        custoM2: areaRef > 0 ? valorFinal / areaRef : 0,
        padrao: padraoInfo.label,
        localizacao: loc,
      })
    } catch {
      setWizardSummary(null)
    }
  }, [])

  const startPolling = (budgetAIId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/budget-ai/${budgetAIId}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'GENERATED' || data.status === 'FAILED' || data.status === 'EXTRACTED') {
            setGenerating(false)
            if (pollingRef.current) clearInterval(pollingRef.current)
            fetchBudgetData()
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 3000)
  }

  const handleGenerateAI = async () => {
    if (!activeProject) return

    try {
      setGenerating(true)

      // Create budget AI
      const createRes = await fetch('/api/budget-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProject.id }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        alert(err.error || 'Erro ao criar orcamento IA')
        setGenerating(false)
        return
      }

      const budgetAIData = await createRes.json()
      setBudgetAI({
        id: budgetAIData.id,
        name: budgetAIData.name,
        status: 'EXTRACTING',
        totalDirectCost: 0,
        generatedAt: null,
        stages: budgetAIData.stages.map((s: { id: string; code: string | null; totalCost: number }) => ({
          id: s.id,
          code: s.code,
          totalCost: 0,
        })),
      })

      setShowAIDialog(false)

      // Trigger extraction (Phase 1)
      await fetch(`/api/budget-ai/${budgetAIData.id}/extract`, {
        method: 'POST',
      })

      // Start polling
      startPolling(budgetAIData.id)
    } catch (err) {
      console.error('Erro ao gerar orcamento IA:', err)
      setGenerating(false)
    }
  }

  const fetchProjectFiles = async () => {
    if (!activeProject) return
    const res = await fetch(`/api/projects/${activeProject.id}/files`)
    if (res.ok) {
      setProjectFiles(await res.json())
    }
  }

  const handleDeleteAI = async () => {
    if (!budgetAI) return
    if (!confirm('Tem certeza que deseja apagar o orcamento por IA? Voce podera gerar um novo depois.')) return

    try {
      setDeletingAI(true)
      const res = await fetch(`/api/budget-ai/${budgetAI.id}`, { method: 'DELETE' })
      if (res.ok) {
        setBudgetAI(null)
      } else {
        alert('Erro ao apagar orcamento IA')
      }
    } catch (err) {
      console.error('Erro ao apagar orcamento IA:', err)
      alert('Erro ao apagar orcamento IA')
    } finally {
      setDeletingAI(false)
    }
  }

  const handleDeleteDetailed = async () => {
    if (!budgetDetailed) return
    if (!confirm('Tem certeza que deseja apagar o orcamento detalhado? Voce podera gerar um novo depois.')) return

    try {
      setDeletingDetailed(true)
      const res = await fetch(`/api/budget-detailed/${budgetDetailed.id}`, { method: 'DELETE' })
      if (res.ok) {
        setBudgetDetailed(null)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.details || data.error || 'Erro ao apagar orcamento detalhado')
      }
    } catch (err) {
      console.error('Erro ao apagar orcamento detalhado:', err)
      alert('Erro ao apagar orcamento detalhado')
    } finally {
      setDeletingDetailed(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getValue = (budget: BudgetEstimated, fieldName: string): number => {
    let result = 0

    if (budget.data) {
      if (fieldName === 'totalEstimatedCost' && budget.data.totalEstimatedCost != null) {
        result = budget.data.totalEstimatedCost
      }
      else if (fieldName === 'totalLandCost' && budget.data.totalLandCost != null) {
        result = budget.data.totalLandCost
      }
      else if (fieldName === 'constructionCost' && budget.data.constructionCost != null) {
        result = budget.data.constructionCost
      }
      else if (fieldName === 'cubValue' && budget.data.cubValue != null) {
        result = budget.data.cubValue
      }
      else {
        const value = budget[fieldName as keyof BudgetEstimated]
        result = typeof value === 'number' ? value : 0
      }
    } else {
      const value = budget[fieldName as keyof BudgetEstimated]
      result = typeof value === 'number' ? value : 0
    }

    return result
  }

  if (!activeProject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecione um Projeto
              </h3>
              <p className="text-gray-500">
                Escolha um projeto no seletor acima para acessar o módulo de orçamento
              </p>
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
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-8 w-8 text-blue-600" />
              Orçamento
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {activeProject.name}
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando orçamentos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ORÇAMENTO ESTIMADO */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orçamento Estimado</h2>
                      <p className="text-sm text-blue-100">Cálculo Rápido - Viabilidade</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {budgetEstimated ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Total Estimado</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {formatCurrency(getValue(budgetEstimated, 'totalEstimatedCost'))}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Terreno</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(getValue(budgetEstimated, 'totalLandCost'))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Construção</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(getValue(budgetEstimated, 'constructionCost'))}
                          </p>
                        </div>
                      </div>

                      {getValue(budgetEstimated, 'cubValue') > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">CUB Utilizado</p>
                          <p className="text-sm font-medium text-gray-700">
                            {formatCurrency(getValue(budgetEstimated, 'cubValue'))}/m²
                            {budgetEstimated.cubReferenceMonth && (
                              <span className="text-gray-500 ml-2">
                                ({budgetEstimated.cubReferenceMonth})
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Última Atualização</p>
                        <p className="text-sm text-gray-700">
                          {formatDate(budgetEstimated.updatedAt)}
                        </p>
                      </div>

                      <Link href={activeProject ? `/budget/estimated?projectId=${activeProject.id}` : "/budget/estimated"}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Ver Detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Nenhum Orçamento Estimado
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Crie um orçamento estimado para análise rápida de viabilidade
                      </p>
                      <Link href={activeProject ? `/budget/estimated?projectId=${activeProject.id}` : "/budget/estimated"}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Orçamento Estimado
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* ORÇAMENTO REAL */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orcamento Completo</h2>
                      <p className="text-sm text-green-100">Detalhado - SINAPI</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {budgetReal ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(budgetReal.totalDirectCost)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Terreno</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetReal.stages
                                .filter((s) => s.code === '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Construção</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetReal.stages
                                .filter((s) => s.code !== '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Etapas</p>
                        <p className="text-sm text-gray-700">{budgetReal.stages.length} etapas</p>
                      </div>

                      <Link href={`/budget/real?budgetId=${budgetReal.id}`}>
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          Ver Detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Nenhum Orcamento Completo
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Crie um orcamento detalhado com composicoes SINAPI
                      </p>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Orcamento Completo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* ORÇAMENTO POR IA */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orcamento por IA</h2>
                      <p className="text-sm text-purple-100">Leitura de PDFs - Claude</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {generating ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {budgetAI?.status === 'GENERATING' ? 'Gerando Orcamento...' : 'Extraindo Variaveis...'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {budgetAI?.status === 'GENERATING'
                          ? 'A IA esta gerando o orcamento com as variaveis confirmadas.'
                          : 'A IA esta lendo as medidas dos PDFs. Isso pode levar alguns minutos.'}
                      </p>
                    </div>
                  ) : budgetAI && budgetAI.status === 'EXTRACTED' ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-purple-500" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Variaveis Extraidas
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Revise as medidas antes de gerar o orcamento
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Link href={`/budget/ai?budgetId=${budgetAI.id}`}>
                          <Button className="bg-purple-600 hover:bg-purple-700">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Revisar Variaveis
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={handleDeleteAI}
                          disabled={deletingAI}
                        >
                          {deletingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : budgetAI && budgetAI.status === 'GENERATED' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatCurrency(budgetAI.totalDirectCost)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Terreno</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetAI.stages
                                .filter((s) => s.code === '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Construção</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              budgetAI.stages
                                .filter((s) => s.code !== '00')
                                .reduce((sum, s) => sum + s.totalCost, 0)
                            )}
                          </p>
                        </div>
                      </div>

                      {budgetAI.generatedAt && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Gerado em</p>
                          <p className="text-sm text-gray-700">
                            {formatDate(budgetAI.generatedAt)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link href={`/budget/ai?budgetId=${budgetAI.id}`} className="flex-1">
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            Ver Detalhes
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={handleDeleteAI}
                          disabled={deletingAI}
                        >
                          {deletingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : budgetAI && budgetAI.status === 'FAILED' ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">!</span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Erro na Geracao
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Ocorreu um erro ao gerar o orcamento. Tente novamente.
                      </p>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setShowAIDialog(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-purple-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Orcamento por IA
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Envie os PDFs dos projetos e a IA gera o orcamento automaticamente
                      </p>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setShowAIDialog(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Orcamento por IA
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* ORÇAMENTO DETALHADO */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Ruler className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Orcamento Detalhado</h2>
                      <p className="text-sm text-orange-100">Indices por m2 - Automatico</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {budgetDetailed ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {formatCurrency(budgetDetailed.totalDirectCost)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Area Construida</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {budgetDetailed.areaConstruida} m2
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Custo/m2</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {budgetDetailed.areaConstruida > 0
                              ? formatCurrency(budgetDetailed.totalDirectCost / budgetDetailed.areaConstruida)
                              : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Itens Gerados</p>
                        <p className="text-sm text-gray-700">{budgetDetailed.itemCount || 0} servicos</p>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/budget/detailed?budgetId=${budgetDetailed.id}`} className="flex-1">
                          <Button className="w-full bg-orange-600 hover:bg-orange-700">
                            Ver Detalhes
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={handleDeleteDetailed}
                          disabled={deletingDetailed}
                        >
                          {deletingDetailed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : wizardSummary ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valor Estimado</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {formatCurrency(wizardSummary.valorFinal)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Area</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {wizardSummary.areaRef.toFixed(0)} m2
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Custo/m2</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(wizardSummary.custoM2)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {wizardSummary.localizacao} — {wizardSummary.padrao}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                          onClick={() => router.push('/budget/detailed/report')}
                        >
                          Ver Detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                          onClick={() => router.push('/budget/detailed/new')}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ruler className="h-8 w-8 text-orange-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Orcamento Detalhado
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Gere automaticamente com indices de consumo por m2
                      </p>
                      <Button
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => router.push('/budget/detailed/new')}
                      >
                        <Ruler className="h-4 w-4 mr-2" />
                        Gerar Orcamento Detalhado
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Diferenca entre os 4 Orcamentos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">Orcamento Estimado:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Calculo rapido usando CUB</li>
                  <li>Analise de viabilidade</li>
                  <li>Estimativa de custos globais</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Orcamento Completo:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Detalhamento completo</li>
                  <li>Insumos e composicoes</li>
                  <li>Controle preciso de custos</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Orcamento por IA:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Leitura automatica de PDFs</li>
                  <li>Geracao inteligente via Claude</li>
                  <li>Mapeamento SINAPI automatico</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Orcamento Detalhado:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Indices de consumo por m2</li>
                  <li>Calculo automatico de quantitativos</li>
                  <li>Precos SINAPI por estado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeProject && (
        <>
          <CreateBudgetDialog
            open={showCreateDialog}
            projectId={activeProject.id}
            onClose={() => setShowCreateDialog(false)}
            onCreated={(budgetId) => {
              setShowCreateDialog(false)
              router.push(`/budget/real?budgetId=${budgetId}`)
            }}
          />

          <GenerateAIBudgetDialog
            open={showAIDialog}
            projectId={activeProject.id}
            existingFiles={projectFiles}
            onClose={() => setShowAIDialog(false)}
            onFilesChanged={fetchProjectFiles}
            onGenerate={handleGenerateAI}
            generating={generating}
          />

        </>
      )}
    </div>
  )
}
