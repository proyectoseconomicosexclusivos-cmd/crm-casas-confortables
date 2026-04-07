import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';

// GET /api/external-links/[id] - Detalle de enlace
export const GET = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const link = await db.externalLink.findUnique({
    where: { id: params.id },
  });

  if (!link) {
    return errorResponse('Enlace no encontrado', 404);
  }

  // Verificar permisos de visualización
  const userRole = session.user.role;
  const canView = link.isPublic || 
    (link.visibleToRoles ? JSON.parse(link.visibleToRoles).includes(userRole) : isAdmin(userRole)) ||
    (isSuperAdmin(userRole) || (isAdmin(userRole) && link.companyId === session.user.companyId));

  if (!canView) {
    return errorResponse('No tienes permiso para ver este enlace', 403);
  }

  return successResponse(link);
});

// PUT /api/external-links/[id] - Actualizar enlace
export const PUT = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const {
    name,
    description,
    url,
    category,
    visibleToRoles,
    isPublic,
    order,
    isActive,
  } = body;

  const link = await db.externalLink.findUnique({
    where: { id: params.id },
  });

  if (!link) {
    return errorResponse('Enlace no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (!isAdmin(session.user.role) || link.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para modificar este enlace', 403);
    }
  }

  // Validar categoría si se proporciona
  if (category) {
    const validCategories = ['calculator', 'tool', 'resource', 'other'];
    if (!validCategories.includes(category)) {
      return errorResponse('Categoría inválida');
    }
  }

  // Validar URL si se proporciona
  if (url) {
    try {
      new URL(url);
    } catch {
      return errorResponse('URL inválida');
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (url !== undefined) updateData.url = url;
  if (category !== undefined) updateData.category = category;
  if (visibleToRoles !== undefined) updateData.visibleToRoles = visibleToRoles ? JSON.stringify(visibleToRoles) : null;
  if (isPublic !== undefined) updateData.isPublic = isPublic;
  if (order !== undefined) updateData.order = order;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await db.externalLink.update({
    where: { id: params.id },
    data: updateData,
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'update_external_link',
      entity: 'external_link',
      entityId: params.id,
      description: `Enlace externo "${updated.name}" actualizado`,
    },
  });

  return successResponse(updated, 'Enlace actualizado');
});

// DELETE /api/external-links/[id] - Eliminar enlace
export const DELETE = withRole(['SUPER_ADMIN', 'ADMIN'], async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const link = await db.externalLink.findUnique({
    where: { id: params.id },
  });

  if (!link) {
    return errorResponse('Enlace no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (link.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para eliminar este enlace', 403);
    }
  }

  await db.externalLink.delete({
    where: { id: params.id },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_external_link',
      entity: 'external_link',
      entityId: params.id,
      description: `Enlace externo "${link.name}" eliminado`,
    },
  });

  return successResponse(null, 'Enlace eliminado');
});

// PATCH /api/external-links/[id] - Actualizar orden (para drag & drop)
export const PATCH = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const { order } = body;

  if (order === undefined) {
    return errorResponse('Orden requerido');
  }

  const link = await db.externalLink.findUnique({
    where: { id: params.id },
  });

  if (!link) {
    return errorResponse('Enlace no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (!isAdmin(session.user.role) || link.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para modificar este enlace', 403);
    }
  }

  const updated = await db.externalLink.update({
    where: { id: params.id },
    data: { order },
  });

  return successResponse(updated, 'Orden actualizado');
});
