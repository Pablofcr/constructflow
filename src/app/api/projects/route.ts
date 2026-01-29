import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        budgetEstimated: true,
        teamMembers: true
      }
    })
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Erro ao buscar projetos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar projetos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📥 Dados recebidos:', body)
    
    // Gerar código único do projeto
    const year = new Date().getFullYear()
    const lastProject = await prisma.project.findFirst({
      where: {
        codigo: {
          startsWith: `OBR-${year}-`
        }
      },
      orderBy: {
        codigo: 'desc'
      }
    })
    
    let nextNumber = 1
    if (lastProject) {
      const lastNumber = parseInt(lastProject.codigo.split('-')[2])
      nextNumber = lastNumber + 1
    }
    
    const codigo = `OBR-${year}-${nextNumber.toString().padStart(4, '0')}`
    
    console.log('🔖 Código gerado:', codigo)
    
    // Preparar dados para criação - REMOVER campos que não existem no schema
    const projectData: any = {
      name: body.name,
      description: body.description,
      codigo,
      status: body.status,
      tipoObra: body.tipoObra,
      enderecoRua: body.enderecoRua,
      enderecoNumero: body.enderecoNumero,
      enderecoComplemento: body.enderecoComplemento,
      enderecoBairro: body.enderecoBairro,
      enderecoCidade: body.enderecoCidade,
      enderecoEstado: body.enderecoEstado,
      enderecoCEP: body.enderecoCEP,
      dataInicioEstimada: new Date(body.dataInicioEstimada),
      prazoFinal: new Date(body.prazoFinal),
      orcamentoEstimado: body.orcamentoEstimado || 0,
      totalGasto: body.totalGasto || 0,
    }
    
    // Adicionar campos opcionais apenas se existirem
    if (body.subtipoResidencial) {
      projectData.subtipoResidencial = body.subtipoResidencial
    }
    
    if (body.padraoEmpreendimento) {
      projectData.padraoEmpreendimento = body.padraoEmpreendimento
    }
    
    if (body.latitude) {
      projectData.latitude = parseFloat(body.latitude)
    }
    
    if (body.longitude) {
      projectData.longitude = parseFloat(body.longitude)
    }
    
    if (body.dataInicioReal) {
      projectData.dataInicioReal = new Date(body.dataInicioReal)
    }
    
    if (body.orcamentoReal) {
      projectData.orcamentoReal = parseFloat(body.orcamentoReal)
    }
    
    console.log('💾 Dados preparados para salvar:', projectData)
    
    // Criar projeto
    const project = await prisma.project.create({
      data: projectData,
      include: {
        budgetEstimated: true,
        teamMembers: true
      }
    })
    
    console.log('✅ Projeto criado com sucesso:', project.id)
    
    return NextResponse.json(project, { status: 201 })
    
  } catch (error: any) {
    console.error('❌ Erro ao criar projeto:', error)
    console.error('Detalhes:', error.message)
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar projeto',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do projeto não fornecido' },
        { status: 400 }
      )
    }
    
    console.log('📝 Atualizando projeto:', id)
    
    // Preparar dados para atualização
    const updateData: any = {}
    
    // Campos básicos
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.tipoObra !== undefined) updateData.tipoObra = data.tipoObra
    if (data.subtipoResidencial !== undefined) updateData.subtipoResidencial = data.subtipoResidencial
    if (data.padraoEmpreendimento !== undefined) updateData.padraoEmpreendimento = data.padraoEmpreendimento
    
    // Endereço
    if (data.enderecoRua !== undefined) updateData.enderecoRua = data.enderecoRua
    if (data.enderecoNumero !== undefined) updateData.enderecoNumero = data.enderecoNumero
    if (data.enderecoComplemento !== undefined) updateData.enderecoComplemento = data.enderecoComplemento
    if (data.enderecoBairro !== undefined) updateData.enderecoBairro = data.enderecoBairro
    if (data.enderecoCidade !== undefined) updateData.enderecoCidade = data.enderecoCidade
    if (data.enderecoEstado !== undefined) updateData.enderecoEstado = data.enderecoEstado
    if (data.enderecoCEP !== undefined) updateData.enderecoCEP = data.enderecoCEP
    if (data.latitude !== undefined) updateData.latitude = parseFloat(data.latitude)
    if (data.longitude !== undefined) updateData.longitude = parseFloat(data.longitude)
    
    // Datas
    if (data.dataInicioEstimada !== undefined) updateData.dataInicioEstimada = new Date(data.dataInicioEstimada)
    if (data.dataInicioReal !== undefined) updateData.dataInicioReal = new Date(data.dataInicioReal)
    if (data.prazoFinal !== undefined) updateData.prazoFinal = new Date(data.prazoFinal)
    
    // Financeiro
    if (data.orcamentoEstimado !== undefined) updateData.orcamentoEstimado = parseFloat(data.orcamentoEstimado)
    if (data.orcamentoReal !== undefined) updateData.orcamentoReal = parseFloat(data.orcamentoReal)
    if (data.totalGasto !== undefined) updateData.totalGasto = parseFloat(data.totalGasto)
    
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        budgetEstimated: true,
        teamMembers: true
      }
    })
    
    console.log('✅ Projeto atualizado com sucesso')
    
    return NextResponse.json(project)
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar projeto:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar projeto',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do projeto não fornecido' },
        { status: 400 }
      )
    }
    
    console.log('🗑️ Deletando projeto:', id)
    
    await prisma.project.delete({
      where: { id }
    })
    
    console.log('✅ Projeto deletado com sucesso')
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('❌ Erro ao deletar projeto:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao deletar projeto',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
