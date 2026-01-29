"use client"

import { TrendingDown, TrendingUp, Target, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ScenarioData {
  value: string // Adverso/Esperado/Ideal
  roe: number
  saleValue: number
  netProfit: number
  profitMargin: number
}

interface DeadlineData {
  adverse: number
  expected: number
  ideal: number
}

interface MatrixData {
  AA: { monthlyReturn: number; totalMonths: number }
  AE: { monthlyReturn: number; totalMonths: number }
  AI: { monthlyReturn: number; totalMonths: number }
  EA: { monthlyReturn: number; totalMonths: number }
  EE: { monthlyReturn: number; totalMonths: number }
  EI: { monthlyReturn: number; totalMonths: number }
  IA: { monthlyReturn: number; totalMonths: number }
  IE: { monthlyReturn: number; totalMonths: number }
  II: { monthlyReturn: number; totalMonths: number }
}

interface ScenarioMatrixProps {
  adverse: ScenarioData
  expected: ScenarioData
  ideal: ScenarioData
  deadlines: DeadlineData
  matrix: MatrixData
  constructionDuration: number
}

export function ScenarioMatrix({
  adverse,
  expected,
  ideal,
  deadlines,
  matrix,
  constructionDuration
}: ScenarioMatrixProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%'
  }

  // Função para obter cor baseada no retorno mensal
  const getColorClass = (monthlyReturn: number) => {
    if (monthlyReturn >= 3) return 'bg-green-500 text-white'
    if (monthlyReturn >= 2) return 'bg-blue-500 text-white'
    if (monthlyReturn >= 1) return 'bg-yellow-500 text-white'
    return 'bg-orange-500 text-white'
  }

  const getCellContent = (data: { monthlyReturn: number; totalMonths: number }) => {
    return (
      <div className="text-center p-3">
        <p className="text-2xl font-bold mb-1">{formatPercent(data.monthlyReturn)}</p>
        <p className="text-xs opacity-90">{data.totalMonths} meses</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* CENÁRIOS BASE */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Cenários de Valor e Prazo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* ADVERSO */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h4 className="font-bold text-orange-900">Adverso</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-orange-600">Valor de Venda</p>
                <p className="font-bold text-orange-900">{formatCurrency(adverse.saleValue)}</p>
                <p className="text-xs text-orange-600">+40% sobre custo</p>
              </div>
              <div className="pt-2 border-t border-orange-200">
                <p className="text-xs text-orange-600">Prazo de Venda</p>
                <p className="font-bold text-orange-900">{deadlines.adverse} meses</p>
              </div>
              <div className="pt-2 border-t border-orange-200">
                <p className="text-xs text-orange-600">ROE</p>
                <p className="font-bold text-orange-900">{formatPercent(adverse.roe)}</p>
              </div>
            </div>
          </div>

          {/* ESPERADO */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-blue-600" />
              <h4 className="font-bold text-blue-900">Esperado</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-blue-600">Valor de Venda</p>
                <p className="font-bold text-blue-900">{formatCurrency(expected.saleValue)}</p>
                <p className="text-xs text-blue-600">+60% sobre custo</p>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600">Prazo de Venda</p>
                <p className="font-bold text-blue-900">{deadlines.expected} meses</p>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600">ROE</p>
                <p className="font-bold text-blue-900">{formatPercent(expected.roe)}</p>
              </div>
            </div>
          </div>

          {/* IDEAL */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-bold text-green-900">Ideal</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-green-600">Valor de Venda</p>
                <p className="font-bold text-green-900">{formatCurrency(ideal.saleValue)}</p>
                <p className="text-xs text-green-600">+80% sobre custo</p>
              </div>
              <div className="pt-2 border-t border-green-200">
                <p className="text-xs text-green-600">Prazo de Venda</p>
                <p className="font-bold text-green-900">{deadlines.ideal} meses</p>
              </div>
              <div className="pt-2 border-t border-green-200">
                <p className="text-xs text-green-600">ROE</p>
                <p className="font-bold text-green-900">{formatPercent(ideal.roe)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIZ 3x3 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🎯 Matriz de Cenários: Taxa de Retorno Mensal
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Construção: {constructionDuration} meses</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">
                    Cenário
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-orange-700 border-r border-gray-200">
                    <div>Prazo Adverso</div>
                    <div className="text-xs font-normal text-gray-600">{deadlines.adverse}m</div>
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-blue-700 border-r border-gray-200">
                    <div>Prazo Esperado</div>
                    <div className="text-xs font-normal text-gray-600">{deadlines.expected}m</div>
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-green-700">
                    <div>Prazo Ideal</div>
                    <div className="text-xs font-normal text-gray-600">{deadlines.ideal}m</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Linha 1: Adverso Valor */}
                <tr className="border-t border-gray-200">
                  <td className="p-4 border-r border-gray-200 bg-orange-50">
                    <div className="font-semibold text-orange-900">Valor Adverso</div>
                    <div className="text-xs text-orange-600">+40%</div>
                  </td>
                  <td className={`border-r border-gray-200 ${getColorClass(matrix.AA.monthlyReturn)}`}>
                    {getCellContent(matrix.AA)}
                  </td>
                  <td className={`border-r border-gray-200 ${getColorClass(matrix.AE.monthlyReturn)}`}>
                    {getCellContent(matrix.AE)}
                  </td>
                  <td className={getColorClass(matrix.AI.monthlyReturn)}>
                    {getCellContent(matrix.AI)}
                  </td>
                </tr>

                {/* Linha 2: Esperado Valor */}
                <tr className="border-t border-gray-200">
                  <td className="p-4 border-r border-gray-200 bg-blue-50">
                    <div className="font-semibold text-blue-900">Valor Esperado</div>
                    <div className="text-xs text-blue-600">+60%</div>
                  </td>
                  <td className={`border-r border-gray-200 ${getColorClass(matrix.EA.monthlyReturn)}`}>
                    {getCellContent(matrix.EA)}
                  </td>
                  <td className={`border-r border-gray-200 ${getColorClass(matrix.EE.monthlyReturn)}`}>
                    {getCellContent(matrix.EE)}
                  </td>
                  <td className={getColorClass(matrix.EI.monthlyReturn)}>
                    {getCellContent(matrix.EI)}
                  </td>
                </tr>

                {/* Linha 3: Ideal Valor */}
                <tr className="border-t border-gray-200">
                  <td className="p-4 border-r border-gray-200 bg-green-50">
                    <div className="font-semibold text-green-900">Valor Ideal</div>
                    <div className="text-xs text-green-600">+80%</div>
                  </td>
                  <td className={`border-r border-gray-200 ${getColorClass(matrix.IA.monthlyReturn)}`}>
                    {getCellContent(matrix.IA)}
                  </td>
                  <td className={`border-r border-gray-200 ${getColorClass(matrix.IE.monthlyReturn)}`}>
                    {getCellContent(matrix.IE)}
                  </td>
                  <td className={getColorClass(matrix.II.monthlyReturn)}>
                    {getCellContent(matrix.II)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">💡 Como ler a matriz:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Linha:</strong> Representa o cenário de VALOR DE VENDA</li>
            <li>• <strong>Coluna:</strong> Representa o cenário de PRAZO DE VENDA</li>
            <li>• <strong>Taxa Mensal:</strong> ROE ÷ (Duração Construção + Prazo Venda)</li>
            <li>• <strong>Cores:</strong> Verde (≥3%), Azul (≥2%), Amarelo (≥1%), Laranja (&lt;1%)</li>
          </ul>
        </div>
      </div>

      {/* DESTAQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-900">Pior Caso</h4>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatPercent(matrix.AA.monthlyReturn)}/mês</p>
          <p className="text-xs text-red-700 mt-1">Valor Adverso + Prazo Adverso</p>
          <p className="text-xs text-red-600 mt-1">{matrix.AA.totalMonths} meses totais</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Cenário Realista</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatPercent(matrix.EE.monthlyReturn)}/mês</p>
          <p className="text-xs text-blue-700 mt-1">Valor Esperado + Prazo Esperado</p>
          <p className="text-xs text-blue-600 mt-1">{matrix.EE.totalMonths} meses totais</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Melhor Caso</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatPercent(matrix.II.monthlyReturn)}/mês</p>
          <p className="text-xs text-green-700 mt-1">Valor Ideal + Prazo Ideal</p>
          <p className="text-xs text-green-600 mt-1">{matrix.II.totalMonths} meses totais</p>
        </div>
      </div>
    </div>
  )
}
