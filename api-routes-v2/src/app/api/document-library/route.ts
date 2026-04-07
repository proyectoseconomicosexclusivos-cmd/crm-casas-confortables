import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';
import { DocumentCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';

// GET /api/document-library - Listar documentos de la biblioteca
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') as DocumentCategory | null;
  const search = searchParams.get('search');
  const isPublic = searchParams.get('isPublic');
  const uploadedById = searchParams.get('uploadedById');

  const where: Prisma.DocumentLibraryWhereInput = {
    isActive: true,
  };

  // Filtro por empresa
  if (!isSuperAdmin(session.user.role)) {
    where.companyId = session.user.companyId;
  }

  if (category) {
    where.category = category;
  }

  if (isPublic !== null) {
    where.isPublic = isPublic === 'true';
  }

  if (uploadedById) {
    where.uploadedById = uploadedById;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { fileName: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const [documents, total] = await Promise.all([
    db.documentLibrary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true, lastName: true } },
      },
    }),
    db.documentLibrary.count({ where }),
  ]);

  // Estadisticas por categoria
  const categoryStats = await db.documentLibrary.groupBy({
    by: ['category'],
    where: {
      ...where,
      isActive: true,
    },
    _count: { id: true },
  });

  // Total de documentos
  const totalDocs = await db.documentLibrary.count({
    where: {
      ...where,
      isActive: true,
    },
  });

  // Total de descargas
  const totalDownloads = await db.documentLibrary.aggregate({
    where: {
      ...where,
      isActive: true,
    },
    _sum: { downloadCount: true },
  });

  return NextResponse.json({
    success: true,
    data: documents,
    stats: {
      total: totalDocs,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      byCategory: categoryStats.reduce((acc, c) => {
        acc[c.category] = c._count.id;
        return acc;
      }, {} as Record<string, number>),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/document-library - Subir nuevo documento
export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const {
    name,
    description,
    category,
    fileName,
    filePath,
    fileSize,
    mimeType,
    tags,
    isPublic,
    visibleToRoles,
    metadata,
    parentDocumentId,
  } = body;

  if (!name || !fileName || !filePath) {
    return errorResponse('Nombre, nombre de archivo y ruta son requeridos');
  }

  const companyId = isSuperAdmin(session.user.role)
    ? body.companyId
    : session.user.companyId;

  if (!companyId) {
    return errorResponse('Empresa no especificada');
  }

  // Si es una nueva version de un documento existente
  let version = 1;
  if (parentDocumentId) {
    const parentDoc = await db.documentLibrary.findUnique({
      where: { id: parentDocumentId },
    });
    if (parentDoc) {
      version = parentDoc.version + 1;
    }
  }

  const document = await db.documentLibrary.create({
    data: {
      name,
      description,
      category: category || 'OTHER',
      fileName,
      filePath,
      fileSize,
      mimeType,
      tags,
      isPublic: isPublic ?? false,
      visibleToRoles,
      metadata,
      version,
      parentDocumentId,
      companyId,
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
      action: 'upload_document_library',
      entity: 'document_library',
      entityId: document.id,
      description: `Documento "${name}" subido a la biblioteca`,
    },
  });

  return successResponse(document, 'Documento subido exitosamente');
});
