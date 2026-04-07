import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';
import { DocumentCategory } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/document-library/[id] - Obtener detalles del documento
export const GET = withAuth(async (req: NextRequest, session: any, { params }: RouteParams) => {
  const { id } = params;

  const document = await db.documentLibrary.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true, lastName: true, avatar: true } },
    },
  });

  if (!document) {
    return errorResponse('Documento no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (document.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para ver este documento', 403);
    }
  }

  // Obtener versiones anteriores
  const previousVersions = await db.documentLibrary.findMany({
    where: {
      parentDocumentId: id,
      isActive: true,
    },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      fileName: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true, lastName: true } },
    },
  });

  // Incrementar contador de descargas
  await db.documentLibrary.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...document,
      previousVersions,
    },
  });
});

// PUT /api/document-library/[id] - Actualizar documento
export const PUT = withAuth(async (req: NextRequest, session: any, { params }: RouteParams) => {
  const { id } = params;
  const body = await req.json();

  const document = await db.documentLibrary.findUnique({
    where: { id },
  });

  if (!document) {
    return errorResponse('Documento no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role)) {
    if (document.companyId !== session.user.companyId) {
      return errorResponse('No tienes permiso para editar este documento', 403);
    }
  }

  const {
    name,
    description,
    category,
    tags,
    isPublic,
    visibleToRoles,
    metadata,
    isActive,
    fileName,
    filePath,
    fileSize,
    mimeType,
  } = body;

  const updateData: any = {};

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category as DocumentCategory;
  if (tags !== undefined) updateData.tags = tags;
  if (isPublic !== undefined) updateData.isPublic = isPublic;
  if (visibleToRoles !== undefined) updateData.visibleToRoles = visibleToRoles;
  if (metadata !== undefined) updateData.metadata = metadata;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (fileName !== undefined) updateData.fileName = fileName;
  if (filePath !== undefined) updateData.filePath = filePath;
  if (fileSize !== undefined) updateData.fileSize = fileSize;
  if (mimeType !== undefined) updateData.mimeType = mimeType;

  const updatedDocument = await db.documentLibrary.update({
    where: { id },
    data: updateData,
    include: {
      company: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true, lastName: true } },
    },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'update_document_library',
      entity: 'document_library',
      entityId: id,
      description: `Documento "${updatedDocument.name}" actualizado`,
    },
  });

  return successResponse(updatedDocument, 'Documento actualizado exitosamente');
});

// DELETE /api/document-library/[id] - Eliminar documento (soft delete)
export const DELETE = withAuth(async (req: NextRequest, session: any, { params }: RouteParams) => {
  const { id } = params;

  const document = await db.documentLibrary.findUnique({
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

  // Soft delete
  await db.documentLibrary.update({
    where: { id },
    data: { isActive: false },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_document_library',
      entity: 'document_library',
      entityId: id,
      description: `Documento "${document.name}" eliminado`,
    },
  });

  return successResponse(null, 'Documento eliminado');
});
