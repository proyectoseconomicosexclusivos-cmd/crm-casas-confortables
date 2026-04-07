import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { CompanyType, AssignmentMethod } from '@/types';
import { Prisma } from '@prisma/client';

// GET /api/companies - Listar empresas
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as CompanyType | null;
  const search = searchParams.get('search');

  const where: Prisma.CompanyWhereInput = {};

  // Super Admin ve todo, Admin solo su empresa
  if (!isSuperAdmin(session.user.role)) {
    where.id = session.user.companyId;
  }

  if (type) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const [companies, total] = await Promise.all([
    db.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            offices: true,
            leads: true,
            works: true,
          },
        },
      },
    }),
    db.company.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: companies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/companies - Crear empresa
export const POST = withRole(['SUPER_ADMIN', 'ADMIN'], async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    name,
    type,
    taxId,
    email,
    phone,
    website,
    address,
    city,
    province,
    postalCode,
    assignmentMethod,
  } = body;

  if (!name || !type) {
    return errorResponse('Nombre y tipo son requeridos');
  }

  const company = await db.company.create({
    data: {
      name,
      type: type as CompanyType,
      taxId,
      email,
      phone,
      website,
      address,
      city,
      province,
      postalCode,
      assignmentMethod: (assignmentMethod || 'ROUND_ROBIN') as AssignmentMethod,
    },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_company',
      entity: 'company',
      entityId: company.id,
      description: `Empresa ${name} creada`,
    },
  });

  return successResponse(company, 'Empresa creada exitosamente');
});
