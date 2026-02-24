import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runReplanning } from '@/lib/replanning-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planningId: string }> }
) {
  try {
    const { planningId } = await params;
    const body = await request.json();
    const { date, entries, notes, weather } = body as {
      date: string;
      entries: Array<{
        serviceId: string;
        executedAsPlanned: boolean;
        actualPercent?: number;
      }>;
      notes?: string;
      weather?: string;
    };

    if (!date || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'date e entries são obrigatórios' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date + 'T00:00:00.000Z');

    // Find or create the daily log
    let dailyLog = await prisma.dailyLog.findUnique({
      where: {
        planningId_date: { planningId, date: targetDate },
      },
      include: { entries: true },
    });

    if (!dailyLog) {
      return NextResponse.json(
        { error: 'DailyLog não encontrado para esta data. Abra o dia primeiro.' },
        { status: 404 }
      );
    }

    if (dailyLog.status === 'ATTESTED') {
      return NextResponse.json(
        { error: 'Este dia já foi atestado.' },
        { status: 400 }
      );
    }

    // Update each entry
    for (const entryInput of entries) {
      const existingEntry = dailyLog.entries.find(
        (e) => e.serviceId === entryInput.serviceId
      );

      if (!existingEntry) continue;

      const plannedPercent = Number(existingEntry.plannedPercent);
      let actualPercent: number;

      if (entryInput.executedAsPlanned) {
        actualPercent = plannedPercent;
      } else {
        actualPercent = entryInput.actualPercent ?? 0;
      }

      const deficitPercent = Math.max(plannedPercent - actualPercent, 0);

      await prisma.dailyLogEntry.update({
        where: { id: existingEntry.id },
        data: {
          executedAsPlanned: entryInput.executedAsPlanned,
          actualPercent,
          deficitPercent,
          notes: entryInput.executedAsPlanned ? null : (existingEntry.notes || null),
        },
      });
    }

    // Mark the daily log as ATTESTED
    await prisma.dailyLog.update({
      where: { id: dailyLog.id },
      data: {
        status: 'ATTESTED',
        notes: notes ?? dailyLog.notes,
        weather: weather ?? dailyLog.weather,
      },
    });

    // Run replanning engine
    await runReplanning(planningId);

    // Fetch updated data
    const updatedPlanning = await prisma.planning.findUnique({
      where: { id: planningId },
      select: {
        overallProgress: true,
        stages: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            progressPercent: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      overallProgress: Number(updatedPlanning?.overallProgress || 0),
      stages: (updatedPlanning?.stages || []).map((s) => ({
        id: s.id,
        name: s.name,
        progressPercent: Number(s.progressPercent),
      })),
    });
  } catch (error) {
    console.error('Erro ao atestar dia:', error);
    return NextResponse.json(
      { error: 'Erro ao atestar dia' },
      { status: 500 }
    );
  }
}
