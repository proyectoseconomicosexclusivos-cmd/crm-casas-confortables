import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single certification
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

    const certification = await db.certification.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!certification) {
      return NextResponse.json({ error: 'Certificacion no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: certification });
  } catch (error) {
    console.error('Error fetching certification:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificacion' },
      { status: 500 }
    );
  }
}

// PUT - Update certification
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

    const existingCert = await db.certification.findUnique({
      where: { id },
    });

    if (!existingCert) {
      return NextResponse.json({ error: 'Certificacion no encontrada' }, { status: 404 });
    }

    const updateData: any = {
      status: data.status || existingCert.status,
      notes: data.notes || null,
      invoiceNumber: data.invoiceNumber || null,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
      invoiceUrl: data.invoiceUrl || null,
      paymentMethod: data.paymentMethod || null,
    };

    // Handle approval
    if (data.status === 'APPROVED' && existingCert.status === 'DRAFT') {
      updateData.approvedById = user.id;
      updateData.approvedAt = new Date();
    }

    // Handle payment
    if (data.status === 'PAID') {
      updateData.paidAt = new Date();
    }

    const certification = await db.certification.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: certification });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { error: 'Error al actualizar certificacion' },
      { status: 500 }
    );
  }
}

// DELETE - Delete certification
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

    const certification = await db.certification.findUnique({
      where: { id },
    });

    if (!certification) {
      return NextResponse.json({ error: 'Certificacion no encontrada' }, { status: 404 });
    }

    if (certification.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar certificaciones en borrador' },
        { status: 400 }
      );
    }

    await db.certificationItem.deleteMany({
      where: { certificationId: id },
    });

    await db.certification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      { error: 'Error al eliminar certificacion' },
      { status: 500 }
    );
  }
}
