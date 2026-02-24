import { NextRequest, NextResponse } from 'next/server';
import { generateSCurveData } from '@/lib/curva-s';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planningId: string }> }
) {
  try {
    const { planningId } = await params;
    const data = await generateSCurveData(planningId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao gerar curva S:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar curva S' },
      { status: 500 }
    );
  }
}
