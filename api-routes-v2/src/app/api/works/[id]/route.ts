import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { WorkStatus } from '@prisma/client';

// GET /api/works/[id] - Detalle de obra
export const GET = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const work = await db.work.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, lastName: true, email: true } },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
        },
      },
      subcontractors: {
        include: {
          work: { select: { id: true, name: true } },
        },
      },
      updates: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, name: true, lastName: true } },
        },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      tasks: {
        where: { status: { not: 'completed' } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      },
      _count: {
        select: {
          documents: true,
          tasks: true,
          updates: true,
          incidents: true,
        },
      },
    },
  });

  if (!work) {
    return errorResponse('Obra no encontrada', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (isAdmin(session.user.role) && work.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para ver esta obra', 403);
    }
  }

  return successResponse(work);
});

// PUT /api/works/[id] - Actualizar obra
export const PUT = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const {
    name,
    description,
    reference,
    address,
    city,
    province,
    postalCode,
    status,
    startDate,
    endDate,
    estimatedDays,
    budget,
    actualCost,
    progress,
    notes,
  } = body;

  const work = await db.work.findUnique({
    where: { id: params.id },
  });

  if (!work) {
    return errorResponse('Obra no encontrada', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (isAdmin(session.user.role) && work.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para modificar esta obra', 403);
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (reference !== undefined) updateData.reference = reference;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (province !== undefined) updateData.province = province;
  if (postalCode !== undefined) updateData.postalCode = postalCode;
  if (status !== undefined) updateData.status = status as WorkStatus;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (estimatedDays !== undefined) updateData.estimatedDays = estimatedDays;
  if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
  if (actualCost !== undefined) updateData.actualCost = actualCost ? parseFloat(actualCost) : null;
  if (progress !== undefined) updateData.progress = parseInt(progress);
  if (notes !== undefined) updateData.notes = notes;

  const updated = await db.work.update({
    where: { id: params.id },
    data: updateData,
    include: {
      company: { select: { id: true, name: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Crear actualizacion si cambio el progreso
  if (progress !== undefined && progress !== work.progress) {
    await db.workUpdate.create({
      data: {
        workId: params.id,
        userId: session.user.id,
        title: 'Actualizacion de progreso',
        description: `Progreso actualizado de ${work.progress}% a ${progress}%`,
        progressBefore: work.progress,
        progressAfter: parseInt(progress),
      },
    });
  }

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'update_work',
      entity: 'work',
      entityId: params.id,
      description: `Obra "${updated.name}" actualizada`,
    },
  });

  return successResponse(updated, 'Obra actualizada');
});

// DELETE /api/works/[id] - Eliminar obra
export const DELETE = withRole(['SUPER_ADMIN', 'ADMIN'], async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const work = await db.work.findUnique({
    where: { id: params.id },
  });

  if (!work) {
    return errorResponse('Obra no encontrada', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (work.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para eliminar esta obra', 403);
    }
  }

  // Soft delete: cambiar estado a CANCELLED
  const deleted = await db.work.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_work',
      entity: 'work',
      entityId: params.id,
      description: `Obra "${work.name}" eliminada`,
    },
  });

  return successResponse(deleted, 'Obra eliminada');
});
