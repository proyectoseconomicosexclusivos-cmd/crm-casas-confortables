import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin, isTeamLeader } from '@/lib/permissions';
import { LeadStatus } from '@/types';

// GET /api/leads/[id] - Obtener un lead especifico
export const GET = withAuth(async (req: NextRequest, session: any, params: any) => {
  const lead = await db.lead.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      office: true,
      team: true,
      assignedTo: { select: { id: true, name: true, lastName: true, email: true, phone: true } },
      createdBy: { select: { id: true, name: true, lastName: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, lastName: true, avatar: true } },
        },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, name: true, lastName: true } },
        },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      budgets: {
        orderBy: { createdAt: 'desc' },
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, lastName: true } },
        },
      },
      work: {
        include: {
          subcontractors: true,
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          incidents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!lead) {
    return errorResponse('Lead no encontrado', 404);
  }

  return successResponse(lead);
});

// PUT /api/leads/[id] - Actualizar lead
export const PUT = withAuth(async (req: NextRequest, session: any, params: any) => {
  const body = await req.json();
  const { id } = params;

  // Obtener lead actual
  const currentLead = await db.lead.findUnique({
    where: { id },
  });

  if (!currentLead) {
    return errorResponse('Lead no encontrado', 404);
  }

  // Verificar permisos
  const canEdit = 
    isSuperAdmin(session.user.role) ||
    (isAdmin(session.user.role) && currentLead.companyId === session.user.companyId) ||
    (isTeamLeader(session.user.role) && currentLead.teamId === session.user.teamId) ||
    currentLead.assignedToId === session.user.id;

  if (!canEdit) {
    return errorResponse('No tienes permiso para editar este lead', 403);
  }

  // Preparar datos de actualizacion
  const updateData: any = {};

  // Campos actualizables
  const updatableFields = [
    'firstName', 'lastName', 'email', 'phone', 'alternativePhone',
    'address', 'city', 'province', 'postalCode', 'zone',
    'type', 'source', 'estimatedValue', 'probability', 'priority',
    'description', 'requirements', 'budgetMin', 'budgetMax',
    'preferredStartDate', 'deadline', 'officeId', 'teamId', 'assignedToId'
  ];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Manejar cambio de estado
  if (body.status && body.status !== currentLead.status) {
    updateData.status = body.status;

    // Registrar fecha de contacto si es el primer contacto
    if (body.status !== 'NEW' && !currentLead.contactedAt) {
      updateData.contactedAt = new Date();
    }

    // Registrar fecha de cierre
    if (body.status === 'CLOSED' || body.status === 'LOST') {
      updateData.closedAt = new Date();
    }

    // Crear actividad de cambio de estado
    await db.leadActivity.create({
      data: {
        leadId: id,
        userId: session.user.id,
        action: 'status_change',
        description: `Estado cambiado de ${currentLead.status} a ${body.status}`,
        oldValue: currentLead.status,
        newValue: body.status,
      },
    });
  }

  // Actualizar lead
  const lead = await db.lead.update({
    where: { id },
    data: updateData,
    include: {
      company: { select: { id: true, name: true } },
      office: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, lastName: true } },
    },
  });

  // Crear actividad de actualizacion
  await db.leadActivity.create({
    data: {
      leadId: id,
      userId: session.user.id,
      action: 'updated',
      description: 'Lead actualizado',
      metadata: JSON.stringify(updateData),
    },
  });

  // Crear notificacion si se reasigno
  if (body.assignedToId && body.assignedToId !== currentLead.assignedToId && body.assignedToId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: body.assignedToId,
        type: 'LEAD_ASSIGNED',
        title: 'Lead reasignado',
        message: `Se te ha asignado el lead de ${lead.firstName} ${lead.lastName}`,
        referenceType: 'lead',
        referenceId: lead.id,
      },
    });
  }

  return successResponse(lead, 'Lead actualizado exitosamente');
});

// DELETE /api/leads/[id] - Eliminar lead
export const DELETE = withAuth(async (req: NextRequest, session: any, params: any) => {
  const { id } = params;

  // Solo Admin y Super Admin pueden eliminar
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    return errorResponse('No tienes permiso para eliminar leads', 403);
  }

  const lead = await db.lead.findUnique({
    where: { id },
  });

  if (!lead) {
    return errorResponse('Lead no encontrado', 404);
  }

  // Verificar que pertenece a la empresa del admin
  if (isAdmin(session.user.role) && lead.companyId !== session.user.companyId) {
    return errorResponse('No tienes permiso para eliminar este lead', 403);
  }

  // Eliminar lead (las relaciones se eliminan en cascada)
  await db.lead.delete({
    where: { id },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_lead',
      entity: 'lead',
      entityId: id,
      description: `Lead eliminado: ${lead.firstName} ${lead.lastName}`,
    },
  });

  return successResponse(null, 'Lead eliminado exitosamente');
});
