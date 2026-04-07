import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET /api/clients - Listar clientes (usuarios con rol CLIENT)
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const isActive = searchParams.get('isActive');

  const where: Prisma.UserWhereInput = {
    role: 'CLIENT',
  };

  // Filtro por empresa
  if (!isSuperAdmin(session.user.role)) {
    if (isAdmin(session.user.role)) {
      // Admin puede ver clientes de su empresa
      where.companyId = session.user.companyId;
    } else {
      // Otros solo ven clientes que ellos crearon o estan relacionados
      where.OR = [
        { companyId: session.user.companyId },
        { managerId: session.user.id },
      ];
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  if (isActive !== null && isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const [clients, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        company: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: {
            assignedLeads: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  // Obtener obras y presupuestos para cada cliente
  const clientsWithDetails = await Promise.all(
    clients.map(async (client) => {
      const leads = await db.lead.findMany({
        where: { clientId: client.id },
        select: { id: true, estimatedValue: true, status: true },
      });

      const works = await db.work.findMany({
        where: { lead: { clientId: client.id } },
        select: { id: true, name: true, status: true, budget: true, progress: true },
      });

      const totalPurchases = leads
        .filter((l) => l.status === 'CLOSED')
        .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

      return {
        ...client,
        leadsCount: leads.length,
        worksCount: works.length,
        totalPurchases,
        activeWorks: works.filter((w) => w.status === 'IN_PROGRESS').length,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: clientsWithDetails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/clients - Crear cliente
export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const { email, password, name, lastName, phone, companyId } = body;

  if (!email || !name) {
    return errorResponse('Email y nombre son requeridos');
  }

  // Verificar si el email ya existe
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return errorResponse('El email ya esta registrado');
  }

  // Hash password o generar uno por defecto
  const hashedPassword = await hashPassword(password || 'cliente123');

  const clientCompanyId = isSuperAdmin(session.user.role)
    ? companyId
    : session.user.companyId;

  const client = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      lastName,
      phone,
      role: 'CLIENT',
      companyId: clientCompanyId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      lastName: true,
      phone: true,
      isActive: true,
      createdAt: true,
      company: {
        select: { id: true, name: true },
      },
    },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_client',
      entity: 'user',
      entityId: client.id,
      description: `Cliente ${name} ${lastName || ''} creado`,
    },
  });

  return successResponse(client, 'Cliente creado exitosamente');
});
