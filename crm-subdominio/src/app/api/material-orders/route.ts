import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// Generate order number
async function generateOrderNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.materialOrder.count({
    where: {
      companyId,
      orderNumber: { contains: `MO-${year}` },
    },
  });
  return `MO-${year}-${String(count + 1).padStart(5, '0')}`;
}

// GET - List material orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const workId = searchParams.get('workId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.companyId,
    };

    // Subcontractors can only see their own orders
    if (user.role === 'SUBCONTRACTOR') {
      const profile = await db.subcontractorProfile.findUnique({
        where: { userId: user.id },
      });
      if (profile) {
        where.subcontractorId = profile.id;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { supplierName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (workId) {
      where.workId = workId;
    }

    const [orders, total] = await Promise.all([
      db.materialOrder.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.materialOrder.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching material orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedidos de materiales' },
      { status: 500 }
    );
  }
}

// POST - Create new material order
export async function POST(request: NextRequest) {
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

    const data = await request.json();
    const orderNumber = await generateOrderNumber(user.companyId);

    // Calculate totals
    let subtotal = 0;
    const items = data.items || [];
    
    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      subtotal += itemTotal;
    }

    const tax = subtotal * 0.21;
    const total = subtotal + tax - (data.discount || 0);

    const order = await db.materialOrder.create({
      data: {
        companyId: user.companyId,
        orderNumber,
        type: data.type || 'INTERNAL',
        requestedById: user.id,
        subcontractorId: data.subcontractorId || null,
        workId: data.workId || null,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || null,
        supplierContact: data.supplierContact || null,
        supplierPhone: data.supplierPhone || null,
        supplierEmail: data.supplierEmail || null,
        deliveryAddress: data.deliveryAddress || null,
        deliveryCity: data.deliveryCity || null,
        deliveryPostalCode: data.deliveryPostalCode || null,
        deliveryNotes: data.deliveryNotes || null,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        status: 'DRAFT',
        subtotal,
        tax,
        total,
        discount: data.discount || 0,
        notes: data.notes || null,
        internalNotes: data.internalNotes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            productName: item.productName,
            productSku: item.productSku || null,
            productUnit: item.productUnit || 'unidad',
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            taxRate: item.taxRate || 21,
            discount: item.discount || 0,
            total: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating material order:', error);
    return NextResponse.json(
      { error: 'Error al crear pedido de materiales' },
      { status: 500 }
    );
  }
}
