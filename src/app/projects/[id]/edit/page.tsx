"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Search, CheckCircle2, AlertCircle } from 'lucide-react'

interface Project {
  id: string
  codigo: string
  name: string
  description: string | null
  status: string
  tipoObra: string
  subtipoResidencial: string | null
  padraoEmpreendimento: string
  enderecoRua: string
  enderecoNumero: string
  enderecoComplemento: string | null
  enderecoBairro: string
  enderecoCidade: string
  enderecoEstado: string
  enderecoCEP: string
  orcamentoEstimado: number
  dataInicioEstimada: string
  prazoFinal: string
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [cepStatus, setCepStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [cepMessage, setCepMessage] = useState('')
  const [duracaoMeses, setDuracaoMeses] = useState('')
  const [orcamentoCentavos, setOrcamentoCentavos] = useState(0)
  
  const [formData, setFormData] = useState({
    codigo: '',
    name: '',
    description: '',
    status: 'PLANEJAMENTO',
    tipoObra: 'RESIDENCIAL',
    subtipoResidencial: 'UNIFAMILIAR',
    padraoEmpreendimento: 'MEDIO_PADRAO',
    enderecoRua: '',
    enderecoNumero: '',
    enderecoComplemento: '',
    enderecoBairro: '',
    enderecoCidade: '',
    enderecoEstado: '',
    enderecoCEP: '',
    dataInicioEstimada: '',
    prazoFinal: '',
  })

  // Carregar projeto
  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [params.id])

  const fetchProject = async (id: string) => {
    try {
      setLoadingProject(true)
      const response = await fetch(`/api/projects/${id}`)
      
      if (!response.ok) throw new Error('Projeto não encontrado')
      
      const project: Project = await response.json()
      
      // Preencher formulário
      setFormData({
        codigo: project.codigo,
        name: project.name,
        description: project.description || '',
        status: project.status,
        tipoObra: project.tipoObra,
        subtipoResidencial: project.subtipoResidencial || 'UNIFAMILIAR',
        padraoEmpreendimento: project.padraoEmpreendimento,
        enderecoRua: project.enderecoRua,
        enderecoNumero: project.enderecoNumero,
        enderecoComplemento: project.enderecoComplemento || '',
        enderecoBairro: project.enderecoBairro,
        enderecoCidade: project.enderecoCidade,
        enderecoEstado: project.enderecoEstado,
        enderecoCEP: project.enderecoCEP,
        dataInicioEstimada: project.dataInicioEstimada.split('T')[0],
        prazoFinal: project.prazoFinal.split('T')[0],
      })
      
      // Converter orçamento para centavos
      const centavos = Math.round(project.orcamentoEstimado * 100)
      setOrcamentoCentavos(centavos)
      
      // Calcular duração em meses
      const inicio = new Date(project.dataInicioEstimada)
      const fim = new Date(project.prazoFinal)
      const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
      setDuracaoMeses(meses.toString())
      
    } catch (error) {
      console.error('Erro ao carregar projeto:', error)
      alert('Erro ao carregar projeto')
      router.push('/projects')
    } finally {
      setLoadingProject(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const buscarCEP = async () => {
    const cepLimpo = formData.enderecoCEP.replace(/\D/g, '')
    
    if (cepLimpo.length !== 8) {
      setCepStatus('error')
      setCepMessage('CEP deve ter 8 dígitos')
      return
    }
    
    try {
      setLoadingCEP(true)
      setCepStatus('idle')
      setCepMessage('Buscando...')
      
      const response = await fetch(`/api/cep?cep=${cepLimpo}`)
      
      if (!response.ok) {
        const error = await response.json()
        setCepStatus('error')
        setCepMessage(error.error || 'CEP não encontrado')
        return
      }
      
      const data = await response.json()
      
      if (data.logradouro) handleChange('enderecoRua', data.logradouro)
      if (data.bairro) handleChange('enderecoBairro', data.bairro)
      if (data.localidade) handleChange('enderecoCidade', data.localidade)
      if (data.uf) handleChange('enderecoEstado', data.uf)
      if (data.complemento) handleChange('enderecoComplemento', data.complemento)
      
      setCepStatus('success')
      setCepMessage(`Endereço encontrado (${data.fonte})!`)
      
      setTimeout(() => {
        setCepStatus('idle')
        setCepMessage('')
      }, 5000)
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      setCepStatus('error')
      setCepMessage('Erro ao buscar CEP. Tente novamente.')
    } finally {
      setLoadingCEP(false)
    }
  }

  const calcularDataFinal = (dataInicio: string, meses: string) => {
    if (!dataInicio || !meses) return ''
    const data = new Date(dataInicio)
    const numMeses = parseInt(meses)
    if (isNaN(numMeses) || numMeses <= 0) return ''
    data.setMonth(data.getMonth() + numMeses)
    return data.toISOString().split('T')[0]
  }

  const handleDuracaoChange = (meses: string) => {
    setDuracaoMeses(meses)
    if (formData.dataInicioEstimada && meses) {
      const novaDataFinal = calcularDataFinal(formData.dataInicioEstimada, meses)
      handleChange('prazoFinal', novaDataFinal)
    }
  }

  const handleDataInicioChange = (data: string) => {
    handleChange('dataInicioEstimada', data)
    if (duracaoMeses) {
      const novaDataFinal = calcularDataFinal(data, duracaoMeses)
      handleChange('prazoFinal', novaDataFinal)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const orcamentoEmReais = orcamentoCentavos / 100
      
      const data = {
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        tipoObra: formData.tipoObra,
        subtipoResidencial: formData.tipoObra === 'RESIDENCIAL' ? formData.subtipoResidencial : null,
        padraoEmpreendimento: formData.padraoEmpreendimento,
        enderecoRua: formData.enderecoRua,
        enderecoNumero: formData.enderecoNumero,
        enderecoComplemento: formData.enderecoComplemento || null,
        enderecoBairro: formData.enderecoBairro,
        enderecoCidade: formData.enderecoCidade,
        enderecoEstado: formData.enderecoEstado,
        enderecoCEP: formData.enderecoCEP,
        orcamentoEstimado: orcamentoEmReais,
        dataInicioEstimada: new Date(formData.dataInicioEstimada).toISOString(),
        prazoFinal: new Date(formData.prazoFinal).toISOString(),
      }
      
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Erro ao atualizar projeto')
      
      router.push(`/projects/${params.id}`)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar projeto. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatarMoeda = (centavos: number): string => {
    if (centavos === 0) return '0,00'
    const str = centavos.toString()
    const padded = str.padStart(3, '0')
    const reais = padded.slice(0, -2)
    const cents = padded.slice(-2)
    const reaisLimpo = reais.replace(/^0+/, '') || '0'
    const reaisFormatado = reaisLimpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${reaisFormatado},${cents}`
  }

  const handleOrcamentoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const apenasNumeros = input.replace(/\D/g, '')
    const numero = parseInt(apenasNumeros) || 0
    setOrcamentoCentavos(numero)
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value)
    handleChange('enderecoCEP', formatted)
    if (cepStatus !== 'idle') {
      setCepStatus('idle')
      setCepMessage('')
    }
  }

  const handleCEPKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      buscarCEP()
    }
  }

  if (loadingProject) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push(`/projects/${params.id}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Editar Projeto</h1>
        <p className="text-gray-500 mt-1">
          Código: <span className="font-medium text-gray-700">{formData.codigo}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Projeto *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Residencial Vila Madalena"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva o projeto..."
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANEJAMENTO">Planejamento</SelectItem>
                      <SelectItem value="EM_EXECUCAO">Em Execução</SelectItem>
                      <SelectItem value="PAUSADO">Pausado</SelectItem>
                      <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Obra *</label>
                  <Select value={formData.tipoObra} onValueChange={(value) => handleChange('tipoObra', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                      <SelectItem value="COMERCIAL">Comercial</SelectItem>
                      <SelectItem value="MISTA">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.tipoObra === 'RESIDENCIAL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtipo Residencial *
                    </label>
                    <Select value={formData.subtipoResidencial} onValueChange={(value) => handleChange('subtipoResidencial', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNIFAMILIAR">Unifamiliar (Casa)</SelectItem>
                        <SelectItem value="MULTIFAMILIAR">Multifamiliar (Prédio)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Padrão do Empreendimento *
                  </label>
                  <Select value={formData.padraoEmpreendimento} onValueChange={(value) => handleChange('padraoEmpreendimento', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POPULAR">Popular</SelectItem>
                      <SelectItem value="MEDIO_PADRAO">Médio Padrão</SelectItem>
                      <SelectItem value="ALTO_PADRAO">Alto Padrão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Localização */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Localização</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      required
                      value={formData.enderecoCEP}
                      onChange={(e) => handleCEPChange(e.target.value)}
                      onKeyPress={handleCEPKeyPress}
                      placeholder="00000-000"
                      maxLength={9}
                      className={
                        cepStatus === 'success' ? 'border-green-500' :
                        cepStatus === 'error' ? 'border-red-500' : ''
                      }
                    />
                    {cepStatus === 'success' && !loadingCEP && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                    )}
                    {cepStatus === 'error' && !loadingCEP && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={buscarCEP}
                    disabled={loadingCEP || formData.enderecoCEP.replace(/\D/g, '').length !== 8}
                    variant="outline"
                    className="min-w-[120px]"
                  >
                    {loadingCEP ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar CEP
                      </>
                    )}
                  </Button>
                </div>
                {cepMessage && (
                  <p className={`text-xs mt-1 ${
                    cepStatus === 'success' ? 'text-green-600' :
                    cepStatus === 'error' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {cepMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
                  <Input
                    required
                    value={formData.enderecoRua}
                    onChange={(e) => handleChange('enderecoRua', e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                  <Input
                    required
                    value={formData.enderecoNumero}
                    onChange={(e) => handleChange('enderecoNumero', e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <Input
                  value={formData.enderecoComplemento}
                  onChange={(e) => handleChange('enderecoComplemento', e.target.value)}
                  placeholder="Apto, Bloco, etc"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                  <Input
                    required
                    value={formData.enderecoBairro}
                    onChange={(e) => handleChange('enderecoBairro', e.target.value)}
                    placeholder="Nome do bairro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                  <Input
                    required
                    value={formData.enderecoCidade}
                    onChange={(e) => handleChange('enderecoCidade', e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <Input
                    required
                    value={formData.enderecoEstado}
                    onChange={(e) => handleChange('enderecoEstado', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Orçamento e Prazos */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Orçamento e Prazos</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orçamento Estimado *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 font-medium">
                    R$
                  </span>
                  <input
                    required
                    type="text"
                    value={formatarMoeda(orcamentoCentavos)}
                    onChange={handleOrcamentoInput}
                    placeholder="0,00"
                    className="w-full pl-11 pr-3 py-2 border border-gray-200 rounded-lg font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início Estimada *
                  </label>
                  <Input
                    required
                    type="date"
                    value={formData.dataInicioEstimada}
                    onChange={(e) => handleDataInicioChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração Estimada (meses) *
                  </label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={duracaoMeses}
                    onChange={(e) => handleDuracaoChange(e.target.value)}
                    placeholder="Ex: 12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prazo Final (calculado)
                  </label>
                  <Input
                    type="date"
                    value={formData.prazoFinal}
                    onChange={(e) => handleChange('prazoFinal', e.target.value)}
                    className="bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push(`/projects/${params.id}`)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <>Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
