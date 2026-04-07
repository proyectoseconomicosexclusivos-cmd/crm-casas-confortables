import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// Generate order number
async function generateOrderNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.merchOrder.count({
    where: {
      companyId,
      orderNumber: { contains: `MERCH-${year}` },
    },
  });
  return `MERCH-${year}-${String(count + 1).padStart(5, '0')}`;
}

// GET - List merch orders
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const clientId = searchParams.get('clientId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.companyId,
    };

    // Clients can only see their own orders
    if (user.role === 'REAL_ESTATE' || user.role === 'FRANCHISE') {
      where.clientId = user.id;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { clientName: { contains: search } },
        { trackingNumber: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [orders, total] = await Promise.all([
      db.merchOrder.findMany({
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
      db.merchOrder.count({ where }),
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
    console.error('Error fetching merch orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedidos de merch' },
      { status: 500 }
    );
  }
}

// POST - Create new merch order
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
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
    }

    const tax = subtotal * 0.21;
    const shipping = data.shipping || 0;
    const total = subtotal + tax + shipping;

    const order = await db.merchOrder.create({
      data: {
        companyId: user.companyId,
        orderNumber,
        clientId: data.clientId || user.id,
        clientType: data.clientType || user.role,
        clientName: data.clientName || `${user.name} ${user.lastName || ''}`.trim(),
        clientEmail: data.clientEmail || user.email,
        clientPhone: data.clientPhone || user.phone,
        clientCompany: data.clientCompany || null,
        shippingAddress: data.shippingAddress || null,
        shippingCity: data.shippingCity || null,
        shippingPostalCode: data.shippingPostalCode || null,
        shippingProvince: data.shippingProvince || null,
        status: 'DRAFT',
        subtotal,
        tax,
        shipping,
        total,
        notes: data.notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            productName: item.productName,
            productSku: item.productSku || null,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            taxRate: item.taxRate || 21,
            total: item.quantity * item.unitPrice,
            customization: item.customization || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating merch order:', error);
    return NextResponse.json(
      { error: 'Error al crear pedido de merch' },
      { status: 500 }
    );
  }
}
