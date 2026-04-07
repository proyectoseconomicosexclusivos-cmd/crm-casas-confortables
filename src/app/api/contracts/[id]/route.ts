import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { MainContractStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

// GET /api/contracts/[id] - Obtener contrato por ID
export const GET = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const { id } = params;

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      work: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          province: true,
          status: true,
          budget: true,
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
      },
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
    },
  });

  if (!contract) {
    return errorResponse('Contrato no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    if (contract.companyId !== session.user.companyId) {
      return errorResponse('No tienes acceso a este contrato', 403);
    }
  }

  return successResponse(contract);
});

// PUT /api/contracts/[id] - Actualizar contrato
export const PUT = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const { id } = params;
  const body = await req.json();

  // Verificar que el contrato existe
  const existingContract = await db.contract.findUnique({
    where: { id },
  });

  if (!existingContract) {
    return errorResponse('Contrato no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    if (existingContract.companyId !== session.user.companyId) {
      return errorResponse('No tienes acceso a este contrato', 403);
    }
  }

  // Extraer campos actualizables
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
    signedDocumentUrl,
    signedByParty,
    signedByCompany,
    status,
    autoRenew,
    renewalPeriod,
    notes,
    internalNotes,
  } = body;

  // Preparar datos de actualización
  const updateData: Prisma.ContractUpdateInput = {};

  if (type) updateData.type = type as any;
  if (number) updateData.number = number;
  if (partyType) updateData.partyType = partyType;
  if (partyId !== undefined) updateData.partyId = partyId;
  if (partyName) updateData.partyName = partyName;
  if (partyTaxId !== undefined) updateData.partyTaxId = partyTaxId;
  if (partyAddress !== undefined) updateData.partyAddress = partyAddress;
  if (partyPhone !== undefined) updateData.partyPhone = partyPhone;
  if (partyEmail !== undefined) updateData.partyEmail = partyEmail;
  if (workId !== undefined) updateData.workId = workId;
  if (leadId !== undefined) updateData.leadId = leadId;
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (totalAmount !== undefined) updateData.totalAmount = totalAmount ? parseFloat(totalAmount) : null;
  if (currency) updateData.currency = currency;
  if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
  if (clauses !== undefined) updateData.clauses = clauses;
  if (documentUrl !== undefined) updateData.documentUrl = documentUrl;
  if (signedDocumentUrl !== undefined) updateData.signedDocumentUrl = signedDocumentUrl;

  // Manejar firmas
  if (signedByParty !== undefined) {
    updateData.signedByParty = signedByParty;
    if (signedByParty && !existingContract.signedByPartyAt) {
      updateData.signedByPartyAt = new Date();
    }
  }

  if (signedByCompany !== undefined) {
    updateData.signedByCompany = signedByCompany;
    if (signedByCompany && !existingContract.signedByCompanyAt) {
      updateData.signedByCompanyAt = new Date();
      updateData.signedByCompanyId = session.user.companyId;
    }
  }

  // Manejar cambio de estado
  if (status && status !== existingContract.status) {
    // Validar transiciones de estado
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['PENDING_SIGN', 'CANCELLED'],
      PENDING_SIGN: ['ACTIVE', 'DRAFT', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED', 'EXPIRED'],
      COMPLETED: [],
      CANCELLED: ['DRAFT'],
      EXPIRED: ['ACTIVE', 'CANCELLED'],
    };

    if (!validTransitions[existingContract.status]?.includes(status)) {
      return errorResponse(`No se puede cambiar de ${existingContract.status} a ${status}`, 400);
    }

    updateData.status = status as MainContractStatus;

    // Si se activa, verificar que ambas partes hayan firmado
    if (status === 'ACTIVE' && (!existingContract.signedByParty || !existingContract.signedByCompany)) {
      return errorResponse('El contrato debe estar firmado por ambas partes antes de activarse', 400);
    }
  }

  if (autoRenew !== undefined) updateData.autoRenew = autoRenew;
  if (renewalPeriod !== undefined) updateData.renewalPeriod = renewalPeriod ? parseInt(renewalPeriod) : null;
  if (notes !== undefined) updateData.notes = notes;
  if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

  // Actualizar contrato
  const updatedContract = await db.contract.update({
    where: { id },
    data: updateData,
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
      action: 'update_contract',
      entity: 'contract',
      entityId: updatedContract.id,
      description: `Contrato "${updatedContract.title}" actualizado`,
    },
  });

  return successResponse(updatedContract, 'Contrato actualizado exitosamente');
});

// DELETE /api/contracts/[id] - Eliminar contrato
export const DELETE = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const { id } = params;

  // Verificar que el contrato existe
  const contract = await db.contract.findUnique({
    where: { id },
  });

  if (!contract) {
    return errorResponse('Contrato no encontrado', 404);
  }

  // Verificar permisos
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    if (contract.companyId !== session.user.companyId) {
      return errorResponse('No tienes acceso a este contrato', 403);
    }
  }

  // Solo se pueden eliminar contratos en borrador
  if (contract.status !== 'DRAFT') {
    return errorResponse('Solo se pueden eliminar contratos en estado borrador', 400);
  }

  // Eliminar contrato
  await db.contract.delete({
    where: { id },
  });

  // Log de actividad
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_contract',
      entity: 'contract',
      entityId: id,
      description: `Contrato "${contract.title}" eliminado`,
    },
  });

  return successResponse({ id }, 'Contrato eliminado exitosamente');
});
