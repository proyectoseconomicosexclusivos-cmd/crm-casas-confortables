import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { DocumentType } from '@prisma/client';
import { Prisma } from '@prisma/client';

// GET /api/documents - Listar documentos
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as DocumentType | null;
  const leadId = searchParams.get('leadId');
  const workId = searchParams.get('workId');
  const search = searchParams.get('search');

  const where: Prisma.DocumentWhereInput = {};

  // Filtro por empresa
  if (!isSuperAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
  }

  if (type) {
    where.type = type;
  }

  if (leadId) {
    where.leadId = leadId;
  }

  if (workId) {
    where.workId = workId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { fileName: { contains: search } },
    ];
  }

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true, lastName: true } },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        work: {
          select: { id: true, name: true },
        },
      },
    }),
    db.document.count({ where }),
  ]);

  // Estadísticas por tipo
  const typeStats = await db.document.groupBy({
    by: ['type'],
    where,
    _count: { id: true },
  });

  return NextResponse.json({
    success: true,
    data: documents,
    typeStats: typeStats.reduce((acc, t) => {
      acc[t.type] = t._count.id;
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

// POST /api/documents - Subir documento
export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    name,
    description,
    type,
    fileName,
    filePath,
    fileSize,
    mimeType,
    tags,
    leadId,
    workId,
    companyId,
  } = body;

  if (!name || !fileName || !filePath) {
    return errorResponse('Nombre, nombre de archivo y ruta son requeridos');
  }

  const docCompanyId = isSuperAdmin(session.user.role)
    ? companyId
    : session.user.companyId;

  if (!docCompanyId) {
    return errorResponse('Empresa no especificada');
  }

  const document = await db.document.create({
    data: {
      name,
      description,
      type: type || 'OTHER',
      fileName,
      filePath,
      fileSize,
      mimeType,
      tags,
      leadId,
      workId,
      companyId: docCompanyId,
      uploadedById: session.user.id,
    },
    include: {
      company: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true, lastName: true } },
    },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'upload_document',
      entity: 'document',
      entityId: document.id,
      description: `Documento "${name}" subido`,
    },
  });

  return successResponse(document, 'Documento subido exitosamente');
});

// DELETE /api/documents - Eliminar documento
export const DELETE = withAuth(async (req: NextRequest, session: any) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('ID de documento requerido');
  }

  const document = await db.document.findUnique({
    where: { id },
  });

  if (!document) {
    return errorResponse('Documento no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (document.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para eliminar este documento', 403);
    }
  }

  await db.document.delete({
    where: { id },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_document',
      entity: 'document',
      entityId: id,
      description: `Documento "${document.name}" eliminado`,
    },
  });

  return successResponse(null, 'Documento eliminado');
});
