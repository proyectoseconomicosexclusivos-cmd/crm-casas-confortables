import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single document analysis with results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { id } = await params;

    const analysis = await db.documentAnalysis.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Análisis no encontrado' },
        { status: 404 }
      );
    }

    // Parse extracted data if available
    let extractedData = null;
    if (analysis.extractedData) {
      try {
        extractedData = JSON.parse(analysis.extractedData);
      } catch {
        extractedData = analysis.extractedData;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        extractedData,
      },
    });
  } catch (error) {
    console.error('Error fetching document analysis:', error);
    return NextResponse.json(
      { error: 'Error al obtener análisis de documento' },
      { status: 500 }
    );
  }
}

// PUT - Update document analysis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { id } = await params;
    const data = await request.json();

    // Verify ownership
    const existing = await db.documentAnalysis.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Análisis no encontrado' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (data.extractedData !== undefined) {
      updateData.extractedData = typeof data.extractedData === 'string' 
        ? data.extractedData 
        : JSON.stringify(data.extractedData);
    }
    
    if (data.aiSummary !== undefined) {
      updateData.aiSummary = data.aiSummary;
    }
    
    if (data.aiRecommendations !== undefined) {
      updateData.aiRecommendations = data.aiRecommendations;
    }
    
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }

    const analysis = await db.documentAnalysis.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error updating document analysis:', error);
    return NextResponse.json(
      { error: 'Error al actualizar análisis de documento' },
      { status: 500 }
    );
  }
}

// DELETE - Delete document analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.documentAnalysis.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Análisis no encontrado' },
        { status: 404 }
      );
    }

    await db.documentAnalysis.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Análisis eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error deleting document analysis:', error);
    return NextResponse.json(
      { error: 'Error al eliminar análisis de documento' },
      { status: 500 }
    );
  }
}
