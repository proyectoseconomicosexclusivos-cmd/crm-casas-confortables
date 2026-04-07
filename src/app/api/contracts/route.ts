import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse, getPaginationParams, paginatedResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin, isTeamLeader } from '@/lib/permissions';
import { ContractType, MainContractStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

// GET /api/contracts - Listar contratos
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as ContractType | null;
  const status = searchParams.get('status') as MainContractStatus | null;
  const partyId = searchParams.get('partyId');
  const workId = searchParams.get('workId');
  const leadId = searchParams.get('leadId');
  const search = searchParams.get('search');

  // Construir filtros según permisos
  const where: Prisma.ContractWhereInput = {};

  // Filtro por empresa según rol
  if (isSuperAdmin(session.user.role)) {
    // Super Admin ve todo
  } else if (isAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
  } else if (isTeamLeader(session.user.role)) {
    where.companyId = session.user.companyId;
  } else {
    // Otros solo ven contratos de su empresa
    where.companyId = session.user.companyId;
  }

  // Aplicar filtros
  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (partyId) {
    where.partyId = partyId;
  }

  if (workId) {
    where.workId = workId;
  }

  if (leadId) {
    where.leadId = leadId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { number: { contains: search } },
      { partyName: { contains: search } },
      { partyTaxId: { contains: search } },
    ];
  }

  const [contracts, total] = await Promise.all([
    db.contract.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        work: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    db.contract.count({ where }),
  ]);

  // Calcular estadísticas
  const stats = await db.contract.groupBy({
    by: ['type', 'status'],
    where: where.companyId ? { companyId: where.companyId as string } : {},
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  // Formatear estadísticas
  const formattedStats = {
    byType: {} as Record<string, { count: number; amount: number }>,
    byStatus: {} as Record<string, { count: number; amount: number }>,
    total: { count: 0, amount: 0 },
  };

  stats.forEach((s) => {
    const typeKey = s.type as string;
    const statusKey = s.status as string;
    const count = s._count.id;
    const amount = s._sum.totalAmount || 0;

    if (!formattedStats.byType[typeKey]) {
      formattedStats.byType[typeKey] = { count: 0, amount: 0 };
    }
    formattedStats.byType[typeKey].count += count;
    formattedStats.byType[typeKey].amount += amount;

    if (!formattedStats.byStatus[statusKey]) {
      formattedStats.byStatus[statusKey] = { count: 0, amount: 0 };
    }
    formattedStats.byStatus[statusKey].count += count;
    formattedStats.byStatus[statusKey].amount += amount;

    formattedStats.total.count += count;
    formattedStats.total.amount += amount;
  });

  return NextResponse.json({
    success: true,
    data: contracts,
    stats: formattedStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/contracts - Crear contrato
export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    type,
    number,
    partyType,
    partyId,
    partyName,
    partyTaxId,
    partyAddress,
    partyPhone,
    partyEmail,
    workId,
    leadId,
    title,
    description,
    startDate,
    endDate,
    totalAmount,
    currency,
    paymentTerms,
    clauses,
    documentUrl,
    autoRenew,
    renewalPeriod,
    notes,
    internalNotes,
  } = body;

  // Validaciones
  if (!type || !title || !partyName || !startDate) {
    return errorResponse('Tipo, título, nombre de la parte y fecha de inicio son requeridos');
  }

  // Determinar empresa
  const companyId = isSuperAdmin(session.user.role)
    ? body.companyId
    : session.user.companyId;

  if (!companyId) {
    return errorResponse('Empresa no especificada');
  }

  // Generar número de contrato si no se proporciona
  let contractNumber = number;
  if (!contractNumber) {
    const year = new Date().getFullYear();
    const count = await db.contract.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    contractNumber = `CNT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Crear contrato
  const contract = await db.contract.create({
    data: {
      companyId,
      type: type as ContractType,
      number: contractNumber,
      partyType: partyType || type.toLowerCase(),
      partyId,
      partyName,
      partyTaxId,
      partyAddress,
      partyPhone,
      partyEmail,
      workId,
      leadId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      totalAmount: totalAmount ? parseFloat(totalAmount) : null,
      currency: currency || 'EUR',
      paymentTerms,
      clauses,
      documentUrl,
      autoRenew: autoRenew || false,
      renewalPeriod: renewalPeriod ? parseInt(renewalPeriod) : null,
      notes,
      internalNotes,
      status: 'DRAFT',
      signedByParty: false,
      signedByCompany: false,
    },
    include: {
      work: {
        select: {
          id: true,
          name: true,
        },
      },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_contract',
      entity: 'contract',
      entityId: contract.id,
      description: `Contrato "${title}" creado (${contractNumber})`,
    },
  });

  return successResponse(contract, 'Contrato creado exitosamente');
});
