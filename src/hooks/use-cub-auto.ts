import { useEffect, useState } from 'react'

interface CubData {
  cubCode: string
  cubValue: number
  cucValue: number
  referenceMonth: number
  referenceYear: number
  state: string
  materials?: number
  labor?: number
  equipment?: number
  adminExpenses?: number
}

interface UseCubAutoProps {
  estado?: string
  tipoObra?: string
  subtipo?: string
  padrao?: string
}

export function useCubAuto({ estado, tipoObra, subtipo, padrao }: UseCubAutoProps) {
  const [cubData, setCubData] = useState<CubData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Resetar se faltar algum campo obrigatório
    if (!estado || !tipoObra || !padrao) {
      setCubData(null)
      setError(null)
      return
    }

    // Buscar CUB automaticamente
    async function fetchCub() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          estado: estado!,
          tipoObra: tipoObra!,
          padrao: padrao!,
          ...(subtipo && { subtipo })
        })

        const response = await fetch(`/api/cub/auto?${params}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar CUB')
        }

        const data = await response.json()
        setCubData(data)

        console.log('✅ CUB carregado automaticamente:', data)

      } catch (err: any) {
        console.error('❌ Erro ao buscar CUB:', err)
        setError(err.message)
        setCubData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCub()

  }, [estado, tipoObra, subtipo, padrao])

  return {
    cubData,
    loading,
    error,
    
    // Valores formatados
    cubValue: cubData?.cubValue || 0,
    cucValue: cubData?.cucValue || 0,
    cubCode: cubData?.cubCode || '',
    referenceMonthYear: cubData 
      ? `${String(cubData.referenceMonth).padStart(2, '0')}/${cubData.referenceYear}`
      : ''
  }
}
