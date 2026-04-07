import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin, isTeamLeader } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// GET /api/commissions - Listar comisiones
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const where: Prisma.CommissionWhereInput = {};

  // Filtro por empresa o usuario
  if (isSuperAdmin(session.user.role)) {
    if (userId) where.userId = userId;
  } else if (isAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
    if (userId) where.userId = userId;
  } else if (isTeamLeader(session.user.role)) {
    // Ve comisiones de su equipo
    where.OR = [
      { userId: session.user.id },
      { user: { managerId: session.user.id } },
    ];
    where.companyId = session.user.companyId;
  } else {
    // Comercial solo ve sus comisiones
    where.userId = session.user.id;
  }

  if (status) {
    where.status = status as any;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [commissions, total] = await Promise.all([
    db.commission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, lastName: true, role: true },
        },
      },
    }),
    db.commission.count({ where }),
  ]);

  // Calcular totales
  const totals = await db.commission.aggregate({
    where,
    _sum: { amount: true, baseAmount: true },
    _count: { id: true },
  });

  return NextResponse.json({
    success: true,
    data: commissions,
    totals: {
      totalCommissions: totals._count.id,
      totalAmount: totals._sum.amount || 0,
      totalBaseAmount: totals._sum.baseAmount || 0,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/commissions - Crear comision
export const POST = withRole(['SUPER_ADMIN', 'ADMIN'], async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    userId,
    leadId,
    workId,
    budgetId,
    type,
    baseAmount,
    percentage,
    amount,
    saleDate,
    notes,
  } = body;

  if (!userId || !baseAmount || !amount) {
    return errorResponse('Usuario, importe base y cantidad son requeridos');
  }

  const companyId = isSuperAdmin(session.user.role) ? body.companyId : session.user.companyId;

  if (!companyId) {
    return errorResponse('Empresa no especificada');
  }

  const commission = await db.commission.create({
    data: {
      userId,
      leadId,
      workId,
      budgetId,
      type: type || 'SALE',
      baseAmount: parseFloat(baseAmount),
      percentage: percentage ? parseFloat(percentage) : null,
      amount: parseFloat(amount),
      saleDate: saleDate ? new Date(saleDate) : null,
      notes,
      companyId,
    },
    include: {
      user: { select: { id: true, name: true, lastName: true } },
    },
  });

  // Crear notificacion
  await db.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'Nueva comision registrada',
      message: `Se ha registrado una comision de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(parseFloat(amount))}`,
    },
  });

  return successResponse(commission, 'Comision creada exitosamente');
});

// PUT /api/commissions/[id] - Actualizar estado de comision
export const PUT = withAuth(async (req: NextRequest, session: any, params: any) => {
  // Solo Admin puede cambiar estado
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    return errorResponse('No tienes permiso para modificar comisiones', 403);
  }

  const body = await req.json();
  const { id } = params;
  const { status, notes } = body;

  const commission = await db.commission.findUnique({
    where: { id },
  });

  if (!commission) {
    return errorResponse('Comision no encontrada', 404);
  }

  const updateData: any = {};
  if (status) {
    updateData.status = status;
    if (status === 'APPROVED') updateData.approvedAt = new Date();
    if (status === 'PAID') updateData.paidAt = new Date();
  }
  if (notes !== undefined) updateData.notes = notes;

  const updated = await db.commission.update({
    where: { id },
    data: updateData,
  });

  return successResponse(updated, 'Comision actualizada');
});
