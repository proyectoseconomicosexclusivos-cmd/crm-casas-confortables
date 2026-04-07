import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams, getFilterParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { hasPermission, isSuperAdmin, isAdmin } from '@/lib/permissions';
import { UserRole } from '@/types';
import { Prisma } from '@prisma/client';

// GET /api/users - Listar usuarios
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filters = getFilterParams(req);
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') as UserRole | null;

  // Construir filtros según permisos
  const where: Prisma.UserWhereInput = {};

  // Super Admin ve todo, Admin ve su empresa, otros solo su equipo
  if (!isSuperAdmin(session.user.role)) {
    if (isAdmin(session.user.role)) {
      where.companyId = session.user.companyId;
    } else {
      // Solo pueden ver usuarios de su equipo o ellos mismos
      where.OR = [
        { teamId: session.user.teamId },
        { id: session.user.id },
      ];
    }
  }

  // Aplicar filtros
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
      { lastName: { contains: filters.search } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.officeId) {
    where.officeId = filters.officeId;
  }

  if (filters.teamId) {
    where.teamId = filters.teamId;
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        office: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true, lastName: true } },
        _count: {
          select: {
            assignedLeads: true,
            teamMembers: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  // Eliminar passwords de la respuesta
  const safeUsers = users.map(({ password: _, ...user }) => user);

  return NextResponse.json({
    success: true,
    data: safeUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/users - Crear usuario
export const POST = withRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'], async (req: NextRequest, session: any) => {
  const body = await req.json();
  const { email, password, name, lastName, phone, role, companyId, officeId, teamId, managerId } = body;

  // Validaciones
  if (!email || !password || !name) {
    return errorResponse('Email, contraseña y nombre son requeridos');
  }

  // Verificar si el email ya existe
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return errorResponse('El email ya está registrado');
  }

  // Validar que puede crear este rol
  if (role === 'SUPER_ADMIN' && !isSuperAdmin(session.user.role)) {
    return errorResponse('No tienes permiso para crear Super Admins', 403);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Crear usuario
  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      lastName,
      phone,
      role: role || 'COMMERCIAL',
      companyId: isSuperAdmin(session.user.role) ? companyId : session.user.companyId,
      officeId,
      teamId,
      managerId,
    },
    include: {
      company: { select: { id: true, name: true } },
      office: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  // Crear log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_user',
      entity: 'user',
      entityId: user.id,
      description: `Usuario ${user.name} creado`,
      newValue: JSON.stringify({ email, role }),
    },
  });

  // Eliminar password de la respuesta
  const { password: _, ...safeUser } = user;

  return successResponse(safeUser, 'Usuario creado exitosamente');
});
