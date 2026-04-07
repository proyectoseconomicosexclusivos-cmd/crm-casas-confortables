import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// GET /api/alerts - Listar alertas
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get('severity');
  const type = searchParams.get('type');
  const isRead = searchParams.get('isRead');
  const isResolved = searchParams.get('isResolved');

  const where: Prisma.AlertWhereInput = {};

  // Filtro por destinatario
  if (isSuperAdmin(session.user.role)) {
    where.OR = [
      { isGlobal: true },
      { targetRoleId: session.user.role },
      { companyId: session.user.companyId },
    ];
  } else {
    where.OR = [
      { targetUserId: session.user.id },
      { targetRoleId: session.user.role },
      { isGlobal: true },
      { companyId: session.user.companyId },
    ];
  }

  if (severity) {
    where.severity = severity as any;
  }

  if (type) {
    where.type = type as any;
  }

  if (isRead !== null && isRead !== undefined) {
    where.isRead = isRead === 'true';
  }

  if (isResolved !== null && isResolved !== undefined) {
    where.isResolved = isResolved === 'true';
  }

  const [alerts, total] = await Promise.all([
    db.alert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.alert.count({ where }),
  ]);

  // Contar por severidad
  const counts = await db.alert.groupBy({
    by: ['severity'],
    where: { ...where, isRead: false },
    _count: { id: true },
  });

  return NextResponse.json({
    success: true,
    data: alerts,
    counts: counts.reduce((acc, c) => {
      acc[c.severity.toLowerCase()] = c._count.id;
      return acc;
    }, { info: 0, warning: 0, critical: 0 } as Record<string, number>),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// PUT /api/alerts/[id] - Marcar como leída/resuelta
export const PUT = withAuth(async (req: NextRequest, session: any, params: any) => {
  const body = await req.json();
  const { id } = params;
  const { isRead, isResolved, resolution } = body;

  const alert = await db.alert.findUnique({
    where: { id },
  });

  if (!alert) {
    return errorResponse('Alerta no encontrada', 404);
  }

  const updateData: any = {};

  if (isRead !== undefined) {
    updateData.isRead = isRead;
    if (isRead) updateData.readAt = new Date();
  }

  if (isResolved !== undefined) {
    updateData.isResolved = isResolved;
    if (isResolved) {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = session.user.id;
    }
  }

  const updated = await db.alert.update({
    where: { id },
    data: updateData,
  });

  return successResponse(updated, 'Alerta actualizada');
});

// POST /api/alerts - Crear alerta (solo sistema/admin)
export const POST = withRole(['SUPER_ADMIN', 'ADMIN'], async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    type,
    severity,
    title,
    message,
    referenceType,
    referenceId,
    targetUserId,
    targetRoleId,
    isGlobal,
  } = body;

  if (!type || !title || !message) {
    return errorResponse('Tipo, título y mensaje son requeridos');
  }

  const alert = await db.alert.create({
    data: {
      type: type as any,
      severity: severity || 'WARNING',
      title,
      message,
      referenceType,
      referenceId,
      targetUserId,
      targetRoleId,
      isGlobal: isGlobal || false,
      companyId: session.user.companyId,
    },
  });

  return successResponse(alert, 'Alerta creada');
});

// POST /api/alerts/check - Ejecutar verificación de alertas
export const CHECK_ALERTS = withRole(['SUPER_ADMIN', 'ADMIN'], async (req: NextRequest, session: any) => {
  const alerts: any[] = [];

  // 1. Leads fríos (sin contacto en X días)
  const coldLeads = await db.lead.findMany({
    where: {
      status: { notIn: ['CLOSED', 'LOST'] },
      OR: [
        { contactedAt: null, createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
        { contactedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
    take: 20,
  });

  for (const lead of coldLeads) {
    alerts.push({
      type: 'LEAD_COLD',
      severity: 'WARNING',
      title: 'Lead sin contacto',
      message: `El lead de ${lead.firstName} ${lead.lastName} lleva más de 7 días sin contacto`,
      referenceType: 'lead',
      referenceId: lead.id,
      targetUserId: lead.assignedToId,
    });
  }

  // 2. Leads calientes sin seguimiento
  const hotLeads = await db.lead.findMany({
    where: {
      status: { in: ['OFFER', 'NEGOTIATION'] },
      probability: { gte: 70 },
      updatedAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    },
    take: 20,
  });

  for (const lead of hotLeads) {
    alerts.push({
      type: 'LEAD_HOT',
      severity: 'CRITICAL',
      title: 'Lead caliente sin seguimiento',
      message: `El lead de ${lead.firstName} ${lead.lastName} (${lead.probability}% probabilidad) necesita seguimiento urgente`,
      referenceType: 'lead',
      referenceId: lead.id,
      targetUserId: lead.assignedToId,
    });
  }

  // 3. Obras retrasadas
  const delayedWorks = await db.work.findMany({
    where: {
      status: 'IN_PROGRESS',
      endDate: { lt: new Date() },
    },
    take: 20,
  });

  for (const work of delayedWorks) {
    alerts.push({
      type: 'WORK_DELAY',
      severity: 'WARNING',
      title: 'Obra retrasada',
      message: `La obra "${work.name}" debería haber terminado el ${work.endDate?.toLocaleDateString()}`,
      referenceType: 'work',
      referenceId: work.id,
      targetUserId: work.createdById,
    });
  }

  // 4. Tareas vencidas
  const overdueTasks = await db.task.findMany({
    where: {
      status: { in: ['pending', 'in_progress'] },
      dueDate: { lt: new Date() },
    },
    take: 20,
  });

  for (const task of overdueTasks) {
    alerts.push({
      type: 'TASK_OVERDUE',
      severity: 'INFO',
      title: 'Tarea vencida',
      message: `La tarea "${task.title}" está vencida`,
      referenceType: 'task',
      referenceId: task.id,
      targetUserId: task.assignedToId,
    });
  }

  // Crear alertas en la base de datos
  for (const alert of alerts) {
    // Verificar si ya existe una alerta similar reciente (últimas 24h)
    const existing = await db.alert.findFirst({
      where: {
        type: alert.type,
        referenceId: alert.referenceId,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await db.alert.create({
        data: {
          ...alert,
          companyId: session.user.companyId,
        },
      });
    }
  }

  return successResponse({
    checked: true,
    newAlerts: alerts.length,
    types: {
      coldLeads: coldLeads.length,
      hotLeads: hotLeads.length,
      delayedWorks: delayedWorks.length,
      overdueTasks: overdueTasks.length,
    },
  }, `Verificación completada: ${alerts.length} alertas generadas`);
});
