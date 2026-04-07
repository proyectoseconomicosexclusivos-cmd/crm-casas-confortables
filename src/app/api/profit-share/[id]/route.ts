import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single profit share
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const profitShare = await db.profitShare.findUnique({
      where: { id },
    });

    if (!profitShare) {
      return NextResponse.json({ error: 'Reparto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profitShare });
  } catch (error) {
    console.error('Error fetching profit share:', error);
    return NextResponse.json(
      { error: 'Error al obtener reparto' },
      { status: 500 }
    );
  }
}

// PUT - Update profit share
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

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;
    const data = await request.json();

    const existingShare = await db.profitShare.findUnique({
      where: { id },
    });

    if (!existingShare) {
      return NextResponse.json({ error: 'Reparto no encontrado' }, { status: 404 });
    }

    const updateData: any = {
      status: data.status || existingShare.status,
      notes: data.notes || null,
    };

    // Handle approval
    if (data.status === 'APPROVED' && existingShare.status === 'PENDING') {
      updateData.approvedById = user.id;
      updateData.approvedAt = new Date();
    }

    // Handle payment
    if (data.status === 'PAID') {
      updateData.paidAt = new Date();
      updateData.paymentRef = data.paymentRef || null;
    }

    const profitShare = await db.profitShare.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: profitShare });
  } catch (error) {
    console.error('Error updating profit share:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reparto' },
      { status: 500 }
    );
  }
}

// DELETE - Delete profit share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const profitShare = await db.profitShare.findUnique({
      where: { id },
    });

    if (!profitShare) {
      return NextResponse.json({ error: 'Reparto no encontrado' }, { status: 404 });
    }

    if (profitShare.status === 'PAID') {
      return NextResponse.json(
        { error: 'No se pueden eliminar repartos ya pagados' },
        { status: 400 }
      );
    }

    await db.profitShare.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting profit share:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reparto' },
      { status: 500 }
    );
  }
}
