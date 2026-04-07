import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single merch order
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

    const order = await db.merchOrder.findUnique({
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
    console.error('Error fetching merch order:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    );
  }
}

// PUT - Update merch order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const existingOrder = await db.merchOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const updateData: any = {
      status: data.status || existingOrder.status,
      trackingNumber: data.trackingNumber || null,
      carrier: data.carrier || null,
      shipDate: data.shipDate ? new Date(data.shipDate) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      notes: data.notes || null,
    };

    const order = await db.merchOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating merch order:', error);
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    );
  }
}

// DELETE - Delete merch order
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

    const order = await db.merchOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar pedidos en borrador' },
        { status: 400 }
      );
    }

    await db.merchOrderItem.deleteMany({
      where: { orderId: id },
    });

    await db.merchOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merch order:', error);
    return NextResponse.json(
      { error: 'Error al eliminar pedido' },
      { status: 500 }
    );
  }
}
