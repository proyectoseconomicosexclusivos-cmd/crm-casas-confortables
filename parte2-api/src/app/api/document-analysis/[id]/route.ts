import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single document analysis
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });

    const { id } = await params;
    const analysis = await db.documentAnalysis.findFirst({ where: { id, companyId: user.companyId } });
    if (!analysis) return NextResponse.json({ error: 'Analisis no encontrado' }, { status: 404 });

    let extractedData = null;
    if (analysis.extractedData) {
      try { extractedData = JSON.parse(analysis.extractedData); } catch { extractedData = analysis.extractedData; }
    }

    return NextResponse.json({ success: true, data: { ...analysis, extractedData } });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener analisis' }, { status: 500 });
  }
}

// PUT - Update document analysis
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });

    const { id } = await params;
    const data = await request.json();

    const existing = await db.documentAnalysis.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Analisis no encontrado' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (data.extractedData !== undefined) updateData.extractedData = typeof data.extractedData === 'string' ? data.extractedData : JSON.stringify(data.extractedData);
    if (data.aiSummary !== undefined) updateData.aiSummary = data.aiSummary;
    if (data.status !== undefined) updateData.status = data.status;

    const analysis = await db.documentAnalysis.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Delete document analysis
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });

    const { id } = await params;
    const existing = await db.documentAnalysis.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Analisis no encontrado' }, { status: 404 });

    await db.documentAnalysis.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Eliminado correctamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
