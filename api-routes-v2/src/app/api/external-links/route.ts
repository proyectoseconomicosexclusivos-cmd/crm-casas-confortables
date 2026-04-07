import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// GET /api/external-links - Listar enlaces externos
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  const where: Prisma.ExternalLinkWhereInput = {};

  // Filtro por empresa
  if (isSuperAdmin(session.user.role)) {
    // Super Admin ve todos los enlaces
  } else if (isAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
  } else {
    // Otros usuarios ven enlaces de su empresa
    where.companyId = session.user.companyId;
  }

  if (category) {
    where.category = category;
  }

  if (activeOnly) {
    where.isActive = true;
  }

  // Filtrar por visibilidad segun rol del usuario
  const userRole = session.user.role;
  const links = await db.externalLink.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  // Filtrar por visibilidad
  const filteredLinks = links.filter(link => {
    // Si es publico, todos pueden verlo
    if (link.isPublic) return true;
    
    // Si tiene roles especificos, verificar
    if (link.visibleToRoles) {
      try {
        const roles = JSON.parse(link.visibleToRoles) as string[];
        return roles.includes(userRole);
      } catch {
        return false;
      }
    }
    
    // Si no es publico y no tiene roles especificos, solo admins pueden verlo
    return isAdmin(userRole);
  });

  return NextResponse.json({
    success: true,
    data: filteredLinks,
    categories: {
      calculator: filteredLinks.filter(l => l.category === 'calculator').length,
      tool: filteredLinks.filter(l => l.category === 'tool').length,
      resource: filteredLinks.filter(l => l.category === 'resource').length,
      other: filteredLinks.filter(l => l.category === 'other').length,
    },
  });
});

// POST /api/external-links - Crear nuevo enlace
export const POST = withRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'], async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    name,
    description,
    url,
    category,
    visibleToRoles,
    isPublic,
    order,
  } = body;

  if (!name || !url || !category) {
    return errorResponse('Nombre, URL y categoria son requeridos');
  }

  // Validar categoria
  const validCategories = ['calculator', 'tool', 'resource', 'other'];
  if (!validCategories.includes(category)) {
    return errorResponse('Categoria invalida');
  }

  // Validar URL
  try {
    new URL(url);
  } catch {
    return errorResponse('URL invalida');
  }

  // Obtener companyId
  let companyId = session.user.companyId;
  if (isSuperAdmin(session.user.role) && body.companyId) {
    companyId = body.companyId;
  }

  if (!companyId) {
    return errorResponse('Empresa requerida');
  }

  // Obtener el siguiente orden si no se especifica
  let linkOrder = order;
  if (linkOrder === undefined || linkOrder === null) {
    const lastLink = await db.externalLink.findFirst({
      where: { companyId, category },
      orderBy: { order: 'desc' },
    });
    linkOrder = lastLink ? lastLink.order + 1 : 0;
  }

  const link = await db.externalLink.create({
    data: {
      name,
      description,
      url,
      category,
      visibleToRoles: visibleToRoles ? JSON.stringify(visibleToRoles) : null,
      isPublic: isPublic ?? false,
      order: linkOrder,
      companyId,
    },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_external_link',
      entity: 'external_link',
      entityId: link.id,
      description: `Enlace externo "${name}" creado`,
    },
  });

  return successResponse(link, 'Enlace creado exitosamente');
});
