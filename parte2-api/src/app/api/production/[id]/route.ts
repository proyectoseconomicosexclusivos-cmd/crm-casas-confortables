import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';

// GET /api/production/[id] - Obtener pedido específico
export const GET = withAuth(async (req: NextRequest, session: any, params: any) => {
  const order = await db.productionOrder.findUnique({
    where: { id: params.id },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      materials: true,
      shipments: {
        orderBy: { createdAt: 'desc' },
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
      photos: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    return errorResponse('Pedido no encontrado', 404);
  }

  return successResponse(order);
});

// PUT /api/production/[id] - Actualizar pedido
export const PUT = withAuth(async (req: NextRequest, session: any, params: any) => {
  const body = await req.json();
  const { id } = params;

  const existingOrder = await db.productionOrder.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    return errorResponse('Pedido no encontrado', 404);
  }

  // Preparar datos de actualización
  const updateData: any = {};

  const updatableFields = [
    'name', 'description', 'clientName', 'clientPhone', 'clientAddress',
    'clientCity', 'priority', 'dueDate', 'quantity', 'unit', 'dimensions',
    'weight', 'estimatedCost', 'actualCost', 'notes', 'internalNotes'
  ];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Manejar cambio de estado
  if (body.status && body.status !== existingOrder.status) {
    updateData.status = body.status;

    // Actualizar fechas según estado
    if (body.status === 'IN_PROGRESS' && !existingOrder.startDate) {
      updateData.startDate = new Date();
    }
    if (body.status === 'READY' && !existingOrder.completedDate) {
      updateData.completedDate = new Date();
    }
    if (body.status === 'SHIPPED' && !existingOrder.shippedDate) {
      updateData.shippedDate = new Date();
    }
    if (body.status === 'DELIVERED' && !existingOrder.deliveredDate) {
      updateData.deliveredDate = new Date();
    }

    // Crear entrada en timeline
    await db.productionTimeline.create({
      data: {
        productionOrderId: id,
        userId: session.user.id,
        event: 'status_change',
        description: `Estado cambiado de ${existingOrder.status} a ${body.status}`,
        oldValue: existingOrder.status,
        newValue: body.status,
      },
    });
  }

  // Manejar cambio de fase
  if (body.currentPhase && body.currentPhase !== existingOrder.currentPhase) {
    updateData.currentPhase = body.currentPhase;

    await db.productionTimeline.create({
      data: {
        productionOrderId: id,
        userId: session.user.id,
        event: 'phase_change',
        description: `Fase cambiada a ${body.currentPhase}`,
        oldValue: existingOrder.currentPhase,
        newValue: body.currentPhase,
      },
    });
  }

  // Manejar cambio de progreso
  if (body.progress !== undefined && body.progress !== existingOrder.progress) {
    updateData.progress = body.progress;
  }

  const order = await db.productionOrder.update({
    where: { id },
    data: updateData,
  });

  return successResponse(order, 'Pedido actualizado exitosamente');
});

// POST /api/production/[id]/activity - Registrar actividad
export const POST_ACTIVITY = withAuth(async (req: NextRequest, session: any, params: any) => {
  const body = await req.json();
  const { id } = params;

  const { phase, activity, description, startTime, endTime, quantity } = body;

  if (!phase || !activity) {
    return errorResponse('Fase y actividad son requeridos');
  }

  const productionActivity = await db.productionActivity.create({
    data: {
      productionOrderId: id,
      userId: session.user.id,
      phase,
      activity,
      description,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      durationMinutes: startTime && endTime 
        ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
        : null,
      quantity: quantity ? parseInt(quantity) : null,
    },
  });

  // Crear entrada en timeline
  await db.productionTimeline.create({
    data: {
      productionOrderId: id,
      userId: session.user.id,
      event: 'activity',
      description: `Actividad registrada: ${activity} (${phase})`,
      metadata: JSON.stringify({ activityId: productionActivity.id }),
    },
  });

  return successResponse(productionActivity, 'Actividad registrada');
});
