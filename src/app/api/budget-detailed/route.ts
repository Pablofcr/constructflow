import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';
import { initializeProjectCompositions } from '@/lib/project-compositions';
import { computeQuantities, ConsumptionInput, FinishStandard } from '@/lib/consumption-indices';

// GET /api/budget-detailed?projectId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    const budgets = await prisma.budgetDetailed.findMany({
      where: { projectId },
      include: {
        budgetReal: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: {
                services: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Erro ao buscar orçamentos detalhados:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/budget-detailed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, areaConstruida, areaTerreno, padrao, rooms, numFloors } = body;

    if (!projectId || !areaConstruida || !areaTerreno || !padrao || !rooms) {
      return NextResponse.json({ error: 'Campos obrigatórios: projectId, areaConstruida, areaTerreno, padrao, rooms' }, { status: 400 });
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { enderecoEstado: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    const state = project.enderecoEstado || 'SP';

    // Initialize project compositions
    await initializeProjectCompositions(projectId, state);

    // Compute quantities from consumption indices
    const input: ConsumptionInput = {
      areaConstruida: Number(areaConstruida),
      areaTerreno: Number(areaTerreno),
      padrao: padrao as FinishStandard,
      rooms,
      numFloors: numFloors || 1,
    };

    const quantities = computeQuantities(input);

    // Create BudgetReal with 20 stages
    const budgetRealId = crypto.randomUUID();

    await prisma.budgetReal.create({
      data: {
        id: budgetRealId,
        projectId,
        name: 'Orçamento Detalhado',
        state,
        bdiPercentage: 0,
        bdiAdministration: 0,
        bdiProfit: 0,
        bdiTaxes: 0,
        bdiRisk: 0,
        bdiOthers: 0,
        status: 'DRAFT',
      },
    });

    // Create 20 stages
    const stageMap: Record<string, string> = {};
    for (const stage of DEFAULT_STAGES) {
      const stageId = crypto.randomUUID();
      stageMap[stage.code] = stageId;
      await prisma.budgetStage.create({
        data: {
          id: stageId,
          budgetRealId,
          name: stage.name,
          code: stage.code,
          order: stage.order,
          description: stage.description,
          percentage: stage.percentage,
          totalCost: 0,
          status: 'PENDING',
          progressPercent: 0,
        },
      });
    }

    // Create services from computed quantities
    let totalDirectCost = 0;
    let itemCount = 0;
    const stageTotals: Record<string, number> = {};

    for (const qty of quantities) {
      if (!qty.compositionCode) continue;

      const stageId = stageMap[qty.stageCode];
      if (!stageId) continue;

      // Find project composition by code
      const projComp = await prisma.projectComposition.findFirst({
        where: { projectId, code: qty.compositionCode },
        select: { id: true, unitCost: true, code: true },
      });

      const unitPrice = projComp ? Number(projComp.unitCost) : 0;
      const totalPrice = Math.round(qty.quantity * unitPrice * 100) / 100;

      await prisma.budgetService.create({
        data: {
          id: crypto.randomUUID(),
          stageId,
          description: qty.description,
          code: qty.compositionCode,
          unit: qty.unit,
          quantity: qty.quantity,
          unitPrice,
          totalPrice,
          projectCompositionId: projComp?.id || null,
          notes: qty.calculationNote,
          status: 'PENDING',
        },
      });

      totalDirectCost += totalPrice;
      stageTotals[qty.stageCode] = (stageTotals[qty.stageCode] || 0) + totalPrice;
      itemCount++;
    }

    // Update stage totals
    for (const [code, total] of Object.entries(stageTotals)) {
      const stageId = stageMap[code];
      if (stageId) {
        await prisma.budgetStage.update({
          where: { id: stageId },
          data: { totalCost: total },
        });
      }
    }

    // Update BudgetReal total
    await prisma.budgetReal.update({
      where: { id: budgetRealId },
      data: { totalDirectCost },
    });

    // Create BudgetDetailed record
    const budgetDetailed = await prisma.budgetDetailed.create({
      data: {
        projectId,
        areaConstruida,
        areaTerreno,
        padrao,
        roomsData: rooms,
        numFloors: numFloors || 1,
        budgetRealId,
        state,
        totalDirectCost,
        generatedAt: new Date(),
        itemCount,
        status: 'GENERATED',
      },
    });

    // Return with full data
    const result = await prisma.budgetDetailed.findUnique({
      where: { id: budgetDetailed.id },
      include: {
        budgetReal: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: {
                services: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento detalhado:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
