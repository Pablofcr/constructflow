"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  HardHat, 
  Layers, 
  Building, 
  Blocks, 
  Home, 
  Cpu, 
  Zap, 
  Droplets,
  Wind,
  Sparkles,
  Palette,
  FileText,
  Brush,
  DoorOpen,
  Gem,
  ShowerHead,
  Trees,
  Sparkle,
  TrendingUp
} from 'lucide-react'

interface ConstructionStage {
  name: string
  percentage: number
  icon: React.ElementType
  color: string
  bgColor: string
}

interface StageBreakdownProps {
  constructionCost: number
  standard: 'ALTO' | 'NORMAL' | 'BAIXO'
}

const highStandardStages: ConstructionStage[] = [
  { name: 'Serviços Preliminares', percentage: 3, icon: HardHat, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { name: 'Fundações', percentage: 10, icon: Layers, color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { name: 'Estrutura (Superestrutura)', percentage: 15, icon: Building, color: 'text-red-600', bgColor: 'bg-red-100' },
  { name: 'Alvenaria e Vedações', percentage: 9, icon: Blocks, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { name: 'Cobertura', percentage: 7, icon: Home, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { name: 'Infraestrutura de Automação', percentage: 5, icon: Cpu, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { name: 'Instalações Elétricas', percentage: 7, icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { name: 'Instalações Hidrossanitárias', percentage: 6, icon: Droplets, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  { name: 'Climatização', percentage: 5, icon: Wind, color: 'text-sky-600', bgColor: 'bg-sky-100' },
  { name: 'Revestimentos Internos', percentage: 12, icon: Sparkles, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { name: 'Revestimentos Externos', percentage: 5, icon: Palette, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  { name: 'Gesso', percentage: 3, icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { name: 'Pintura', percentage: 4, icon: Brush, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { name: 'Esquadrias', percentage: 6, icon: DoorOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { name: 'Marmoraria', percentage: 4, icon: Gem, color: 'text-violet-600', bgColor: 'bg-violet-100' },
  { name: 'Louças e Metais', percentage: 3, icon: ShowerHead, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { name: 'Paisagismo e Áreas Externas', percentage: 8, icon: Trees, color: 'text-green-600', bgColor: 'bg-green-100' },
  { name: 'Limpeza Técnica e Entrega', percentage: 1, icon: Sparkle, color: 'text-rose-600', bgColor: 'bg-rose-100' },
]

export function StageBreakdown({ constructionCost, standard }: StageBreakdownProps) {
  const [open, setOpen] = useState(false)

  // Ajustar percentuais para somar exatamente 100%
  const totalPercentage = highStandardStages.reduce((sum, stage) => sum + stage.percentage, 0)
  const adjustmentFactor = 100 / totalPercentage

  const adjustedStages = highStandardStages.map(stage => ({
    ...stage,
    percentage: stage.percentage * adjustmentFactor
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const calculateStageCost = (percentage: number) => {
    return (constructionCost * percentage) / 100
  }

  if (standard !== 'ALTO') {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="mt-2 w-full"
          disabled
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Detalhamento por Etapas
          <span className="text-xs text-gray-500 ml-2">(Disponível para Alto Padrão)</span>
        </Button>
      </>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="mt-2 w-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Ver Detalhamento por Etapas
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building className="h-6 w-6 text-blue-600" />
              Custo Detalhado por Etapas da Obra
            </DialogTitle>
            <DialogDescription>
              Distribuição do custo de construção de <strong>Alto Padrão</strong> por etapa da obra
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-140px)]">
            <div className="space-y-6 pr-4">
              {/* Resumo Total */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100 mb-1">Custo Total de Construção</p>
                    <p className="text-3xl font-bold">{formatCurrency(constructionCost)}</p>
                  </div>
                  <Building className="h-12 w-12 text-blue-300 opacity-50" />
                </div>
              </div>

              {/* Lista de Etapas */}
              <div className="space-y-3">
                {adjustedStages.map((stage, index) => {
                  const stageCost = calculateStageCost(stage.percentage)
                  const Icon = stage.icon

                  return (
                    <div
                      key={stage.name}
                      className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Ícone */}
                        <div className={`${stage.bgColor} p-3 rounded-lg flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${stage.color}`} />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {stage.name}
                            </h4>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900 text-sm">
                                {formatCurrency(stageCost)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {stage.percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* Barra de Progresso */}
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${stage.bgColor.replace('100', '500')} transition-all duration-1000 ease-out`}
                              style={{
                                width: `${stage.percentage}%`,
                                animation: 'slideIn 0.8s ease-out forwards',
                                animationDelay: `${index * 50}ms`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Resumo Final */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total das Etapas</p>
                    <p className="text-xs text-gray-500">
                      {adjustedStages.length} etapas mapeadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(constructionCost)}
                    </p>
                    <p className="text-xs text-gray-500">100.0%</p>
                  </div>
                </div>
              </div>

              {/* Nota */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> Os percentuais apresentados são estimativas baseadas em construções de alto padrão. 
                  Os valores reais podem variar conforme especificações do projeto, localização e fornecedores.
                </p>
              </div>

              {/* Botão Fechar */}
              <div className="flex justify-end pt-2">
                <Button 
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </ScrollArea>

          <style jsx>{`
            @keyframes slideIn {
              from {
                width: 0%;
              }
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </>
  )
}
