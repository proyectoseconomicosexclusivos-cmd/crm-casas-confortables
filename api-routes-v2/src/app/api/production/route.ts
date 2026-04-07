import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// GET /api/production - Listar pedidos de produccion
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: Prisma.ProductionOrderWhereInput = {};

  // Filtro por empresa
  if (!isSuperAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
  }

  if (status) {
    where.status = status as any;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { name: { contains: search } },
      { clientName: { contains: search } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.productionOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { orderDate: 'desc' },
      include: {
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        photos: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
        shipments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            activities: true,
            photos: true,
            shipments: true,
          },
        },
      },
    }),
    db.productionOrder.count({ where }),
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
});

// POST /api/production - Crear pedido de produccion
export const POST = withRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'], async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    orderNumber,
    name,
    description,
    clientName,
    clientPhone,
    clientAddress,
    clientCity,
    priority,
    dueDate,
    quantity,
    unit,
    dimensions,
    weight,
    estimatedCost,
    notes,
    workId,
    leadId,
  } = body;

  if (!orderNumber || !name) {
    return errorResponse('Numero de pedido y nombre son requeridos');
  }

  const companyId = isSuperAdmin(session.user.role) ? body.companyId : session.user.companyId;

  if (!companyId) {
    return errorResponse('Empresa no especificada');
  }

  const order = await db.productionOrder.create({
    data: {
      orderNumber,
      name,
      description,
      clientName,
      clientPhone,
      clientAddress,
      clientCity,
      priority: priority ? parseInt(priority) : 3,
      dueDate: dueDate ? new Date(dueDate) : null,
      quantity: quantity ? parseInt(quantity) : 1,
      unit,
      dimensions,
      weight: weight ? parseFloat(weight) : null,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      notes,
      workId,
      leadId,
      companyId,
    },
    include: {
      activities: true,
      photos: true,
    },
  });

  // Crear entrada en timeline
  await db.productionTimeline.create({
    data: {
      productionOrderId: order.id,
      event: 'created',
      description: 'Pedido de produccion creado',
    },
  });

  return successResponse(order, 'Pedido de produccion creado exitosamente');
});
