import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse, getPaginationParams, getFilterParams, paginatedResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { hasPermission, canViewAllLeads, isSuperAdmin, isAdmin, isTeamLeader } from '@/lib/permissions';
import { LeadStatus, LeadType, LeadSource } from '@/types';
import { Prisma } from '@prisma/client';

// GET /api/leads - Listar leads
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filters = getFilterParams(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as LeadStatus | null;
  const type = searchParams.get('type') as LeadType | null;
  const source = searchParams.get('source') as LeadSource | null;

  // Construir filtros segun permisos
  const where: Prisma.LeadWhereInput = {};

  // Filtro por empresa/oficina/equipo segun rol
  if (isSuperAdmin(session.user.role)) {
    // Ve todo
  } else if (isAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
  } else if (isTeamLeader(session.user.role)) {
    where.OR = [
      { teamId: session.user.teamId },
      { assignedToId: session.user.id },
    ];
  } else {
    // Comercial solo ve sus leads
    where.assignedToId = session.user.id;
  }

  // Aplicar filtros de busqueda
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search } },
      { lastName: { contains: filters.search } },
      { email: { contains: filters.search } },
      { phone: { contains: filters.search } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (source) {
    where.source = source;
  }

  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters.officeId) {
    where.officeId = filters.officeId;
  }

  if (filters.teamId) {
    where.teamId = filters.teamId;
  }

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.dateFrom) {
    where.createdAt = { gte: filters.dateFrom };
  }

  if (filters.dateTo) {
    where.createdAt = { 
      ...where.createdAt as any,
      lte: filters.dateTo 
    };
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        office: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, lastName: true } },
        createdBy: { select: { id: true, name: true, lastName: true } },
        _count: {
          select: {
            comments: true,
            activities: true,
            documents: true,
            budgets: true,
          },
        },
      },
    }),
    db.lead.count({ where }),
  ]);

  return paginatedResponse(leads, total, page, limit);
});

// POST /api/leads - Crear lead
export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    firstName,
    lastName,
    email,
    phone,
    alternativePhone,
    address,
    city,
    province,
    postalCode,
    type,
    source,
    estimatedValue,
    probability,
    priority,
    description,
    requirements,
    budgetMin,
    budgetMax,
    preferredStartDate,
    deadline,
    officeId,
    teamId,
    assignedToId,
  } = body;

  // Validaciones
  if (!firstName || !lastName || !phone) {
    return errorResponse('Nombre, apellidos y telefono son requeridos');
  }

  // Determinar empresa
  const companyId = isSuperAdmin(session.user.role) 
    ? body.companyId 
    : session.user.companyId;

  if (!companyId) {
    return errorResponse('Empresa no especificada');
  }

  // Crear lead
  const lead = await db.lead.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      alternativePhone,
      address,
      city,
      province,
      postalCode,
      type: type || 'NEW_BUILD',
      source: source || 'WEB',
      status: 'NEW',
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
      probability: probability ? parseInt(probability) : 50,
      priority: priority ? parseInt(priority) : 3,
      description,
      requirements,
      budgetMin: budgetMin ? parseFloat(budgetMin) : null,
      budgetMax: budgetMax ? parseFloat(budgetMax) : null,
      preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
      deadline: deadline ? new Date(deadline) : null,
      companyId,
      officeId,
      teamId,
      assignedToId: assignedToId || session.user.id,
      createdById: session.user.id,
    },
    include: {
      company: { select: { id: true, name: true } },
      office: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, lastName: true } },
    },
  });

  // Crear actividad inicial
  await db.leadActivity.create({
    data: {
      leadId: lead.id,
      userId: session.user.id,
      action: 'created',
      description: 'Lead creado',
    },
  });

  // Crear notificacion si esta asignado a alguien mas
  if (assignedToId && assignedToId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: assignedToId,
        type: 'LEAD_ASSIGNED',
        title: 'Nuevo lead asignado',
        message: `Se te ha asignado el lead de ${firstName} ${lastName}`,
        referenceType: 'lead',
        referenceId: lead.id,
      },
    });
  }

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_lead',
      entity: 'lead',
      entityId: lead.id,
      description: `Lead creado: ${firstName} ${lastName}`,
    },
  });

  return successResponse(lead, 'Lead creado exitosamente');
});
