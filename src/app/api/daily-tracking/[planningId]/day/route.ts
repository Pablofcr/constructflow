import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDailyTarget } from '@/lib/replanning-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planningId: string }> }
) {
  try {
    const { planningId } = await params;
    const dateStr = request.nextUrl.searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Parâmetro date é obrigatório (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateStr + 'T00:00:00.000Z');

    // Check if DailyLog already exists for this date
    const existingLog = await prisma.dailyLog.findUnique({
      where: {
        planningId_date: { planningId, date: targetDate },
      },
      include: {
        entries: {
          include: {
            service: {
              select: {
                id: true,
                description: true,
                code: true,
                unit: true,
                quantity: true,
                totalPrice: true,
                weight: true,
                startDate: true,
                endDate: true,
                progressPercent: true,
                stageId: true,
                stage: {
                  select: { id: true, name: true, order: true },
                },
              },
            },
          },
        },
      },
    });

    if (existingLog) {
      return NextResponse.json({
        id: existingLog.id,
        date: existingLog.date,
        status: existingLog.status,
        notes: existingLog.notes,
        weather: existingLog.weather,
        entries: existingLog.entries.map((e) => ({
          id: e.id,
          serviceId: e.serviceId,
          stageId: e.stageId,
          plannedPercent: Number(e.plannedPercent),
          executedAsPlanned: e.executedAsPlanned,
          actualPercent: Number(e.actualPercent),
          deficitPercent: Number(e.deficitPercent),
          notes: e.notes,
          service: {
            id: e.service.id,
            description: e.service.description,
            code: e.service.code,
            unit: e.service.unit,
            quantity: Number(e.service.quantity),
            totalPrice: Number(e.service.totalPrice),
            weight: Number(e.service.weight),
            progressPercent: Number(e.service.progressPercent),
            startDate: e.service.startDate,
            endDate: e.service.endDate,
            stageName: e.service.stage.name,
            stageOrder: e.service.stage.order,
          },
        })),
      });
    }

    // DailyLog doesn't exist yet — find active services for this date and create it
    const planning = await prisma.planning.findUnique({
      where: { id: planningId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            services: true,
          },
        },
      },
    });

    if (!planning) {
      return NextResponse.json(
        { error: 'Planejamento não encontrado' },
        { status: 404 }
      );
    }

    // Collect services active on this date (service with dates spanning targetDate, and not 100%)
    const activeServices: Array<{
      serviceId: string;
      stageId: string;
      plannedPercent: number;
    }> = [];

    for (const stage of planning.stages) {
      for (const svc of stage.services) {
        // Skip services already at 100%
        if (Number(svc.progressPercent) >= 100) continue;

        // Skip services without dates
        if (!svc.startDate || !svc.endDate) continue;

        const svcStart = new Date(svc.startDate);
        const svcEnd = new Date(svc.endDate);

        // Check if targetDate falls within service range
        if (targetDate >= svcStart && targetDate <= svcEnd) {
          const dailyTarget = await calculateDailyTarget(
            svc.id,
            svc.endDate,
            targetDate
          );

          activeServices.push({
            serviceId: svc.id,
            stageId: stage.id,
            plannedPercent: dailyTarget,
          });
        }
      }
    }

    // Create the DailyLog with entries
    const newLog = await prisma.dailyLog.create({
      data: {
        planningId,
        date: targetDate,
        entries: {
          create: activeServices.map((s) => ({
            serviceId: s.serviceId,
            stageId: s.stageId,
            plannedPercent: s.plannedPercent,
          })),
        },
      },
      include: {
        entries: {
          include: {
            service: {
              select: {
                id: true,
                description: true,
                code: true,
                unit: true,
                quantity: true,
                totalPrice: true,
                weight: true,
                startDate: true,
                endDate: true,
                progressPercent: true,
                stageId: true,
                stage: {
                  select: { id: true, name: true, order: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: newLog.id,
      date: newLog.date,
      status: newLog.status,
      notes: newLog.notes,
      weather: newLog.weather,
      entries: newLog.entries.map((e) => ({
        id: e.id,
        serviceId: e.serviceId,
        stageId: e.stageId,
        plannedPercent: Number(e.plannedPercent),
        executedAsPlanned: e.executedAsPlanned,
        actualPercent: Number(e.actualPercent),
        deficitPercent: Number(e.deficitPercent),
        notes: e.notes,
        service: {
          id: e.service.id,
          description: e.service.description,
          code: e.service.code,
          unit: e.service.unit,
          quantity: Number(e.service.quantity),
          totalPrice: Number(e.service.totalPrice),
          weight: Number(e.service.weight),
          progressPercent: Number(e.service.progressPercent),
          startDate: e.service.startDate,
          endDate: e.service.endDate,
          stageName: e.service.stage.name,
          stageOrder: e.service.stage.order,
        },
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar dia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
