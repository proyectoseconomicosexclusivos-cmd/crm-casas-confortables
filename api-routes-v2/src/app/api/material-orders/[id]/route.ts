import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single material order
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

    const order = await db.materialOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching material order:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    );
  }
}

// PUT - Update material order
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

    const existingOrder = await db.materialOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Handle status changes
    let updateData: any = {
      supplierName: data.supplierName || existingOrder.supplierName,
      supplierContact: data.supplierContact || null,
      supplierPhone: data.supplierPhone || null,
      supplierEmail: data.supplierEmail || null,
      deliveryAddress: data.deliveryAddress || null,
      deliveryCity: data.deliveryCity || null,
      deliveryPostalCode: data.deliveryPostalCode || null,
      deliveryNotes: data.deliveryNotes || null,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      notes: data.notes || null,
      internalNotes: data.internalNotes || null,
    };

    // Approval
    if (data.status === 'APPROVED' && existingOrder.status === 'PENDING') {
      updateData.status = 'APPROVED';
      updateData.approvedById = user.id;
      updateData.approvedAt = new Date();
      updateData.approvalNotes = data.approvalNotes || null;
    } else if (data.status) {
      updateData.status = data.status;
    }

    const order = await db.materialOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating material order:', error);
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    );
  }
}

// DELETE - Delete material order
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

    const order = await db.materialOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Only allow deleting draft orders
    if (order.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar pedidos en borrador' },
        { status: 400 }
      );
    }

    await db.materialOrderItem.deleteMany({
      where: { orderId: id },
    });

    await db.materialOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting material order:', error);
    return NextResponse.json(
      { error: 'Error al eliminar pedido' },
      { status: 500 }
    );
  }
}
