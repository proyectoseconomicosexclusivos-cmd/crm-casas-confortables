import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin, isTeamLeader } from '@/lib/permissions';
import { WorkStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

// GET /api/works - Listar obras
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as WorkStatus | null;
  const createdById = searchParams.get('createdById');
  const search = searchParams.get('search');

  const where: Prisma.WorkWhereInput = {};

  // Filtro por empresa
  if (isSuperAdmin(session.user.role)) {
    // Super Admin ve todo
  } else if (isAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
  } else if (isTeamLeader(session.user.role)) {
    // Jefe de equipo ve obras de su equipo
    where.OR = [
      { createdById: session.user.id },
      { createdBy: { managerId: session.user.id } },
    ];
    where.companyId = session.user.companyId;
  } else {
    // Otros solo ven sus obras
    where.createdById = session.user.id;
  }

  if (status) {
    where.status = status;
  }

  if (createdById) {
    where.createdById = createdById;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { address: { contains: search } },
      { city: { contains: search } },
      { reference: { contains: search } },
    ];
  }

  const [works, total] = await Promise.all([
    db.work.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, lastName: true } },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            documents: true,
            tasks: true,
            updates: true,
          },
        },
      },
    }),
    db.work.count({ where }),
  ]);

  // Calcular estadisticas
  const stats = await db.work.groupBy({
    by: ['status'],
    where: where.companyId ? { companyId: where.companyId as string } : {},
    _count: { id: true },
  });

  return NextResponse.json({
    success: true,
    data: works,
    stats: stats.reduce((acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/works - Crear obra
export const POST = withRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL'], async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    leadId,
    name,
    description,
    reference,
    address,
    city,
    province,
    postalCode,
    budget,
    estimatedDays,
    startDate,
    notes,
  } = body;

  if (!leadId || !name || !address) {
    return errorResponse('Lead, nombre y direccion son requeridos');
  }

  // Verificar que el lead existe
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { work: true },
  });

  if (!lead) {
    return errorResponse('Lead no encontrado', 404);
  }

  if (lead.work) {
    return errorResponse('El lead ya tiene una obra asociada');
  }

  const companyId = isSuperAdmin(session.user.role) ? lead.companyId : session.user.companyId;

  const work = await db.work.create({
    data: {
      leadId,
      name,
      description,
      reference,
      address,
      city,
      province,
      postalCode,
      budget: budget ? parseFloat(budget) : null,
      estimatedDays,
      startDate: startDate ? new Date(startDate) : null,
      notes,
      companyId,
      createdById: session.user.id,
    },
    include: {
      lead: true,
      company: { select: { id: true, name: true } },
    },
  });

  // Actualizar estado del lead
  await db.lead.update({
    where: { id: leadId },
    data: { status: 'CLOSED' },
  });

  // Crear log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_work',
      entity: 'work',
      entityId: work.id,
      description: `Obra "${name}" creada`,
    },
  });

  return successResponse(work, 'Obra creada exitosamente');
});
