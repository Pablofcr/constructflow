import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cep = searchParams.get('cep')

    if (!cep) {
      return NextResponse.json(
        { error: 'CEP não fornecido' },
        { status: 400 }
      )
    }

    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '')

    // Valida formato do CEP
    if (cleanCEP.length !== 8) {
      return NextResponse.json(
        { error: 'CEP inválido. Deve conter 8 dígitos.' },
        { status: 400 }
      )
    }

    // Busca CEP na API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao consultar CEP na API externa' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // ViaCEP retorna { erro: true } quando CEP não existe
    if (data.erro) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      )
    }

    // Retorna dados formatados
    return NextResponse.json({
      cep: data.cep,
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ibge: data.ibge || '',
      gia: data.gia || '',
      ddd: data.ddd || '',
      siafi: data.siafi || ''
    })

  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar CEP. Tente novamente.' },
      { status: 500 }
    )
  }
}
