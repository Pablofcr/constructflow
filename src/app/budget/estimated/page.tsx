"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/project-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Calculator, Loader2, Home, Building2, DollarSign, Clock, Target, Info } from 'lucide-react'
import Link from 'next/link'
import { ScenarioMatrix } from '@/components/scenario-matrix'
import { StageBreakdown } from '@/components/stage-breakdown'

interface Project {
  id: string
  codigo: string
  name: string
  tipoObra: string
  subtipoResidencial: string | null
  enderecoEstado: string
}

interface CubValue {
  id: string
  cubCode: string
  totalValue: number
  referenceYear: number
  referenceMonth: number
  standard: string
  subtype: string
}

export default function BudgetEstimatedPage() {
  const router = useRouter()
  const { activeProject } = useProject()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [availableCubs, setAvailableCubs] = useState<CubValue[]>([])
  const [selectedCubId, setSelectedCubId] = useState<string>('')
  const [detectedStandard, setDetectedStandard] = useState<string>('NORMAL')

  const [formData, setFormData] = useState({
    landValue: '',
    iptuPercentage: '0.5',
    condominiumValue: '0',
    itbiPercentage: '3',
    cubValue: '',
    cubSource: 'manual',
    cubReferenceMonth: '',
    cubType: '',
    constructedArea: '',
    projectDuration: '12',
    notes: ''
  })

  const [calculatedValues, setCalculatedValues] = useState({
    iptuValue: 0,
    itbiValue: 0,
    totalLandCost: 0,
    cucValue: 0,
    areaDiscount: 0,
    equivalentArea: 0,
    constructionCost: 0,
    totalEstimatedCost: 0,
    adverse: {
      saleValue: 0,
      brokerage: 0,
      taxes: 0,
      netProfit: 0,
      profitMargin: 0,
      roe: 0,
      monthlyReturn: 0
    },
    expected: {
      saleValue: 0,
      brokerage: 0,
      taxes: 0,
      netProfit: 0,
      profitMargin: 0,
      roe: 0,
      monthlyReturn: 0
    },
    ideal: {
      saleValue: 0,
      brokerage: 0,
      taxes: 0,
      netProfit: 0,
      profitMargin: 0,
      roe: 0,
      monthlyReturn: 0
    },
    deadlines: {
      adverse: 0,
      expected: 0,
      ideal: 0
    },
    matrix: {
      AA: { monthlyReturn: 0, totalMonths: 0 },
      AE: { monthlyReturn: 0, totalMonths: 0 },
      AI: { monthlyReturn: 0, totalMonths: 0 },
      EA: { monthlyReturn: 0, totalMonths: 0 },
      EE: { monthlyReturn: 0, totalMonths: 0 },
      EI: { monthlyReturn: 0, totalMonths: 0 },
      IA: { monthlyReturn: 0, totalMonths: 0 },
      IE: { monthlyReturn: 0, totalMonths: 0 },
      II: { monthlyReturn: 0, totalMonths: 0 }
    }
  })

  useEffect(() => {
    if (activeProject) {
      fetchProjectData()
    }
  }, [activeProject])

  useEffect(() => {
    if (project) {
      fetchAvailableCubs()
    }
  }, [project])

  useEffect(() => {
    calculateValues()
  }, [formData, project])

  const fetchProjectData = async () => {
    if (!activeProject) return

    try {
      setLoading(true)
      
      const projRes = await fetch(`/api/projects/${activeProject.id}`)
      if (projRes.ok) {
        const projData = await projRes.json()
        setProject(projData)
      }

      const budgetRes = await fetch(`/api/budget/estimated?projectId=${activeProject.id}`)
      if (budgetRes.ok) {
        const budgetData = await budgetRes.json()
        
        setFormData({
          landValue: budgetData.landValue.toString(),
          iptuPercentage: (budgetData.iptuPercentage * 100).toString(),
          condominiumValue: budgetData.condominiumValue.toString(),
          itbiPercentage: (budgetData.itbiPercentage * 100).toString(),
          cubValue: budgetData.cubValue.toString(),
          cubSource: budgetData.cubSource || 'manual',
          cubReferenceMonth: budgetData.cubReferenceMonth || '',
          cubType: budgetData.cubType || '',
          constructedArea: budgetData.constructedArea.toString(),
          projectDuration: budgetData.projectDuration.toString(),
          notes: budgetData.notes || ''
        })
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCubs = async () => {
    if (!project) return

    try {
      let subtype = ''
      if (project.tipoObra === 'RESIDENCIAL') {
        subtype = project.subtipoResidencial || 'UNIFAMILIAR'
      } else if (project.tipoObra === 'COMERCIAL') {
        subtype = 'SALA'
      }

      const url = `/api/budget/cub?state=${project.enderecoEstado}&projectType=${project.tipoObra}&subtype=${subtype}`
      
      const response = await fetch(url)
      if (response.ok) {
        const cubs = await response.json()
        setAvailableCubs(cubs)
      }
    } catch (error) {
      console.error('Erro ao buscar CUBs:', error)
    }
  }

  const handleCubSelection = (cubId: string) => {
    setSelectedCubId(cubId)
    const selectedCub = availableCubs.find(c => c.id === cubId)
    
    if (selectedCub) {
      // Determinar duração padrão sugerida baseada no padrão
      let suggestedDuration = '12'
      const cubCode = selectedCub.cubCode.toUpperCase()
      if (cubCode.includes('-A')) suggestedDuration = '10'
      else if (cubCode.includes('-B') || cubCode.includes('PIS')) suggestedDuration = '4'
      else if (cubCode.includes('-N')) suggestedDuration = '7'
      
      setFormData(prev => ({
        ...prev,
        cubValue: selectedCub.totalValue.toString(),
        cubSource: 'auto',
        cubReferenceMonth: `${selectedCub.referenceYear}-${selectedCub.referenceMonth.toString().padStart(2, '0')}`,
        cubType: selectedCub.cubCode,
        projectDuration: prev.projectDuration || suggestedDuration // Sugere apenas se vazio
      }))
    }
  }

  const determineStandard = (cubType: string | null): string => {
    if (!cubType) return 'NORMAL'
    
    const typeUpper = cubType.toUpperCase()
    
    // Verificar pelo código do CUB
    if (typeUpper.includes('-A')) return 'ALTO'
    if (typeUpper.includes('-B') || typeUpper.includes('PIS')) return 'BAIXO'
    if (typeUpper.includes('-N')) return 'NORMAL'
    
    return 'NORMAL'
  }

  const determineSaleDeadlines = (cubType: string | null) => {
    const standard = determineStandard(cubType)
    setDetectedStandard(standard)
    
    // Para Residencial Unifamiliar - APENAS PRAZOS DE VENDA FIXOS
    if (project?.tipoObra === 'RESIDENCIAL' && project?.subtipoResidencial === 'UNIFAMILIAR') {
      if (standard === 'ALTO') {
        return {
          defaultConstructionMonths: 10,  // Sugestão padrão
          adverseSaleMonths: 12,
          expectedSaleMonths: 6,
          idealSaleMonths: 0
        }
      } else if (standard === 'BAIXO' || standard === 'POPULAR') {
        return {
          defaultConstructionMonths: 4,   // Sugestão padrão
          adverseSaleMonths: 6,
          expectedSaleMonths: 3,
          idealSaleMonths: 0
        }
      } else {
        // NORMAL
        return {
          defaultConstructionMonths: 7,   // Sugestão padrão
          adverseSaleMonths: 7,
          expectedSaleMonths: 4,
          idealSaleMonths: 0
        }
      }
    }

    // Outros tipos (valores padrão)
    if (standard === 'ALTO') {
      return {
        defaultConstructionMonths: 10,
        adverseSaleMonths: 12,
        expectedSaleMonths: 6,
        idealSaleMonths: 0
      }
    } else if (standard === 'BAIXO') {
      return {
        defaultConstructionMonths: 4,
        adverseSaleMonths: 6,
        expectedSaleMonths: 3,
        idealSaleMonths: 0
      }
    } else {
      return {
        defaultConstructionMonths: 7,
        adverseSaleMonths: 7,
        expectedSaleMonths: 4,
        idealSaleMonths: 0
      }
    }
  }

  const calculateViability = (totalCost: number, multiplier: number, duration: number) => {
    const saleValue = totalCost * multiplier
    const brokerage = saleValue * 0.05
    const capitalGain = saleValue - brokerage - totalCost
    const taxes = capitalGain * 0.15
    const netProfit = saleValue - totalCost - brokerage - taxes
    const profitMargin = (netProfit / saleValue) * 100
    const roe = (netProfit / totalCost) * 100
    const monthlyReturn = duration > 0 ? roe / duration : 0

    return { saleValue, brokerage, taxes, netProfit, profitMargin, roe, monthlyReturn }
  }

  const calculateValues = () => {
    const landVal = parseFloat(formData.landValue) || 0
    const iptuPerc = parseFloat(formData.iptuPercentage) / 100 || 0.005
    const itbiPerc = parseFloat(formData.itbiPercentage) / 100 || 0.03
    const condVal = parseFloat(formData.condominiumValue) || 0
    const cubVal = parseFloat(formData.cubValue) || 0
    const constArea = parseFloat(formData.constructedArea) || 0
    const duration = parseInt(formData.projectDuration) || 12

    const iptuVal = landVal * iptuPerc
    const itbiVal = landVal * itbiPerc
    const totalLand = landVal + iptuVal + condVal + itbiVal

    const cucVal = cubVal * 1.2
    
    const standard = determineStandard(formData.cubType)
    let areaDisc = 15
    if (standard === 'ALTO') areaDisc = 22.5
    else if (standard === 'BAIXO') areaDisc = 10
    
    const equivArea = Math.max(0, constArea - areaDisc)
    const constCost = cucVal * equivArea
    const totalEst = totalLand + constCost

    // Calcular viabilidade para os 3 cenários
    const adverse = calculateViability(totalEst, 1.40, duration)
    const expected = calculateViability(totalEst, 1.60, duration)
    const ideal = calculateViability(totalEst, 1.80, duration)

    // Determinar prazos de venda FIXOS da tabela
    const deadlines = determineSaleDeadlines(formData.cubType)

    // Calcular prazos TOTAIS = Duração informada + Prazo de venda fixo
    const userDuration = parseInt(formData.projectDuration) || deadlines.defaultConstructionMonths
    
    const adverseTotalMonths = userDuration + deadlines.adverseSaleMonths
    const expectedTotalMonths = userDuration + deadlines.expectedSaleMonths
    const idealTotalMonths = userDuration + deadlines.idealSaleMonths

    // Calcular matriz usando prazos totais calculados
    const matrix = {
      AA: {
        monthlyReturn: adverseTotalMonths > 0 
          ? adverse.roe / adverseTotalMonths 
          : 0,
        totalMonths: adverseTotalMonths
      },
      AE: {
        monthlyReturn: expectedTotalMonths > 0 
          ? adverse.roe / expectedTotalMonths 
          : 0,
        totalMonths: expectedTotalMonths
      },
      AI: {
        monthlyReturn: idealTotalMonths > 0 
          ? adverse.roe / idealTotalMonths 
          : 0,
        totalMonths: idealTotalMonths
      },
      EA: {
        monthlyReturn: adverseTotalMonths > 0 
          ? expected.roe / adverseTotalMonths 
          : 0,
        totalMonths: adverseTotalMonths
      },
      EE: {
        monthlyReturn: expectedTotalMonths > 0 
          ? expected.roe / expectedTotalMonths 
          : 0,
        totalMonths: expectedTotalMonths
      },
      EI: {
        monthlyReturn: idealTotalMonths > 0 
          ? expected.roe / idealTotalMonths 
          : 0,
        totalMonths: idealTotalMonths
      },
      IA: {
        monthlyReturn: adverseTotalMonths > 0 
          ? ideal.roe / adverseTotalMonths 
          : 0,
        totalMonths: adverseTotalMonths
      },
      IE: {
        monthlyReturn: expectedTotalMonths > 0 
          ? ideal.roe / expectedTotalMonths 
          : 0,
        totalMonths: expectedTotalMonths
      },
      II: {
        monthlyReturn: idealTotalMonths > 0 
          ? ideal.roe / idealTotalMonths 
          : 0,
        totalMonths: idealTotalMonths
      }
    }

    setCalculatedValues({
      iptuValue: iptuVal,
      itbiValue: itbiVal,
      totalLandCost: totalLand,
      cucValue: cucVal,
      areaDiscount: areaDisc,
      equivalentArea: equivArea,
      constructionCost: constCost,
      totalEstimatedCost: totalEst,
      adverse,
      expected,
      ideal,
      deadlines: {
        adverse: deadlines.adverseSaleMonths,
        expected: deadlines.expectedSaleMonths,
        ideal: deadlines.idealSaleMonths
      },
      matrix
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!activeProject) {
      alert('Nenhum projeto selecionado')
      return
    }

    setSaving(true)

    try {
      const payload = {
        projectId: activeProject.id,
        landValue: formData.landValue,
        iptuPercentage: parseFloat(formData.iptuPercentage) / 100,
        condominiumValue: formData.condominiumValue,
        itbiPercentage: parseFloat(formData.itbiPercentage) / 100,
        cubValue: formData.cubValue,
        cubSource: formData.cubSource,
        cubReferenceMonth: formData.cubReferenceMonth || null,
        cubType: formData.cubType || null,
        constructedArea: formData.constructedArea,
        projectDuration: formData.projectDuration,
        notes: formData.notes
      }

      const response = await fetch('/api/budget/estimated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar orçamento')
      }

      alert('Orçamento estimado salvo com sucesso!')
      router.push('/budget')
    } catch (error) {
      console.error('Erro:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar orçamento')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const getStandardBadgeColor = (standard: string) => {
    if (standard === 'ALTO') return 'bg-purple-100 text-purple-800 border-purple-300'
    if (standard === 'BAIXO') return 'bg-gray-100 text-gray-800 border-gray-300'
    return 'bg-blue-100 text-blue-800 border-blue-300'
  }

  const getStandardLabel = (standard: string) => {
    if (standard === 'ALTO') return 'Alto Padrão'
    if (standard === 'BAIXO') return 'Baixo Padrão / Popular'
    return 'Padrão Normal'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!activeProject || !project) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecione um Projeto
              </h3>
              <p className="text-gray-500">
                Escolha um projeto no seletor acima
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
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <Link href="/budget">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-8 w-8 text-blue-600" />
              Orçamento Estimado
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {project.codigo} - {project.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* DADOS BÁSICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TERRENO */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Custos do Terreno
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="landValue">Valor do Terreno *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <Input
                        id="landValue"
                        type="number"
                        step="0.01"
                        value={formData.landValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, landValue: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="iptuPercentage">IPTU (%)</Label>
                      <Input
                        id="iptuPercentage"
                        type="number"
                        step="0.1"
                        value={formData.iptuPercentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, iptuPercentage: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(calculatedValues.iptuValue)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="condominiumValue">Condomínio</Label>
                      <Input
                        id="condominiumValue"
                        type="number"
                        step="0.01"
                        value={formData.condominiumValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, condominiumValue: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="itbiPercentage">ITBI + Escritura (%)</Label>
                    <Input
                      id="itbiPercentage"
                      type="number"
                      step="0.1"
                      value={formData.itbiPercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, itbiPercentage: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(calculatedValues.itbiValue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONSTRUÇÃO */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Custos da Construção
                </h2>
                
                <div className="space-y-4">
                  {availableCubs.length > 0 && (
                    <div>
                      <Label>Selecionar CUB</Label>
                      <Select value={selectedCubId} onValueChange={handleCubSelection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCubs.map((cub) => (
                            <SelectItem key={cub.id} value={cub.id}>
                              {cub.cubCode} - {formatCurrency(cub.totalValue)}/m²
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="cubValue">CUB (R$/m²) *</Label>
                    <Input
                      id="cubValue"
                      type="number"
                      step="0.01"
                      value={formData.cubValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, cubValue: e.target.value, cubSource: 'manual' }))}
                      required
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        CUC: {formatCurrency(calculatedValues.cucValue)}/m²
                      </p>
                      {formData.cubType && (
                        <span className={`text-xs px-2 py-1 rounded border ${getStandardBadgeColor(detectedStandard)}`}>
                          {getStandardLabel(detectedStandard)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="constructedArea">Área (m²) *</Label>
                    <Input
                      id="constructedArea"
                      type="number"
                      step="0.01"
                      value={formData.constructedArea}
                      onChange={(e) => setFormData(prev => ({ ...prev, constructedArea: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Equiv.: {calculatedValues.equivalentArea.toFixed(2)}m² (desconto: {calculatedValues.areaDiscount}m²)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="projectDuration">Duração da Obra (meses) *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="projectDuration"
                        type="number"
                        min="1"
                        value={formData.projectDuration}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectDuration: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INDICADOR DE PRAZOS */}
            {formData.cubType && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">Prazos de Viabilidade</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-blue-700 font-medium">Padrão:</p>
                        <p className="text-blue-900 font-semibold">{getStandardLabel(detectedStandard)}</p>
                        <p className="text-xs text-blue-600 mt-1">CUB: {formData.cubType}</p>
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium">Duração Obra:</p>
                        <p className="text-blue-900 font-semibold">{formData.projectDuration || '0'} meses</p>
                        <p className="text-xs text-blue-600 mt-1">Informado pelo usuário</p>
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium">Cenário Adverso:</p>
                        <p className="text-blue-900 font-semibold">+{calculatedValues.deadlines.adverse}m venda</p>
                        <p className="text-xs text-blue-600 mt-1">Total: {
                          (parseInt(formData.projectDuration) || 0) + calculatedValues.deadlines.adverse
                        }m</p>
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium">Cenário Esperado:</p>
                        <p className="text-blue-900 font-semibold">+{calculatedValues.deadlines.expected}m venda</p>
                        <p className="text-xs text-blue-600 mt-1">Total: {
                          (parseInt(formData.projectDuration) || 0) + calculatedValues.deadlines.expected
                        }m</p>
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium">Cenário Ideal:</p>
                        <p className="text-blue-900 font-semibold">+{calculatedValues.deadlines.ideal}m venda</p>
                        <p className="text-xs text-blue-600 mt-1">Total: {
                          (parseInt(formData.projectDuration) || 0) + calculatedValues.deadlines.ideal
                        }m</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-3 italic">
                      ℹ️ Total de meses = Duração da obra (editável) + Prazo de venda (fixo da tabela)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RESUMO DE CUSTOS */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Custo Total do Empreendimento
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-blue-100 mb-1">Terreno</p>
                  <p className="text-xl font-bold">{formatCurrency(calculatedValues.totalLandCost)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-blue-100 mb-1">Construção</p>
                  <p className="text-xl font-bold">{formatCurrency(calculatedValues.constructionCost)}</p>
                  <StageBreakdown 
                    constructionCost={calculatedValues.constructionCost}
                    standard={detectedStandard as 'ALTO' | 'NORMAL' | 'BAIXO'}
                  />
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-blue-100 mb-1">Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculatedValues.totalEstimatedCost)}</p>
                </div>
              </div>
            </div>

            {/* ANÁLISE DE VIABILIDADE COM MATRIZ */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                Análise de Viabilidade
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Projeção de retornos considerando diferentes cenários de valor e prazo
              </p>

              <ScenarioMatrix
                adverse={{
                  value: 'Adverso',
                  roe: calculatedValues.adverse.roe,
                  saleValue: calculatedValues.adverse.saleValue,
                  netProfit: calculatedValues.adverse.netProfit,
                  profitMargin: calculatedValues.adverse.profitMargin
                }}
                expected={{
                  value: 'Esperado',
                  roe: calculatedValues.expected.roe,
                  saleValue: calculatedValues.expected.saleValue,
                  netProfit: calculatedValues.expected.netProfit,
                  profitMargin: calculatedValues.expected.profitMargin
                }}
                ideal={{
                  value: 'Ideal',
                  roe: calculatedValues.ideal.roe,
                  saleValue: calculatedValues.ideal.saleValue,
                  netProfit: calculatedValues.ideal.netProfit,
                  profitMargin: calculatedValues.ideal.profitMargin
                }}
                deadlines={{
                  adverse: calculatedValues.deadlines.adverse,
                  expected: calculatedValues.deadlines.expected,
                  ideal: calculatedValues.deadlines.ideal
                }}
                matrix={calculatedValues.matrix}
                constructionDuration={parseInt(formData.projectDuration) || 12}
              />
            </div>

            {/* Observações e Botão Salvar */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: Valores baseados em..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Link href="/budget">
                  <Button type="button" variant="outline" disabled={saving}>
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Orçamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
