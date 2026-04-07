import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { MainContractStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

// GET /api/contracts/[id]
export const GET = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const { id } = params;
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      work: { select: { id: true, name: true, address: true, city: true, province: true, status: true, budget: true } },
      lead: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });
  if (!contract) return errorResponse('Contrato no encontrado', 404);
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    if (contract.companyId !== session.user.companyId) return errorResponse('No tienes acceso', 403);
  }
  return successResponse(contract);
});

// PUT /api/contracts/[id]
export const PUT = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const { id } = params;
  const body = await req.json();
  const existing = await db.contract.findUnique({ where: { id } });
  if (!existing) return errorResponse('Contrato no encontrado', 404);
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    if (existing.companyId !== session.user.companyId) return errorResponse('No tienes acceso', 403);
  }
  const { title, status, signedByParty, signedByCompany, totalAmount } = body;
  const updateData: Prisma.ContractUpdateInput = {};
  if (title) updateData.title = title;
  if (totalAmount !== undefined) updateData.totalAmount = totalAmount ? parseFloat(totalAmount) : null;
  if (signedByParty !== undefined) {
    updateData.signedByParty = signedByParty;
    if (signedByParty && !existing.signedByPartyAt) updateData.signedByPartyAt = new Date();
  }
  if (signedByCompany !== undefined) {
    updateData.signedByCompany = signedByCompany;
    if (signedByCompany && !existing.signedByCompanyAt) {
      updateData.signedByCompanyAt = new Date();
      updateData.signedByCompanyId = session.user.companyId;
    }
  }
  if (status && status !== existing.status) {
    updateData.status = status as MainContractStatus;
  }
  const updated = await db.contract.update({ where: { id }, data: updateData });
  return successResponse(updated, 'Contrato actualizado');
});

// DELETE /api/contracts/[id]
export const DELETE = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const { id } = params;
  const contract = await db.contract.findUnique({ where: { id } });
  if (!contract) return errorResponse('Contrato no encontrado', 404);
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    if (contract.companyId !== session.user.companyId) return errorResponse('No tienes acceso', 403);
  }
  if (contract.status !== 'DRAFT') return errorResponse('Solo se pueden eliminar borradores', 400);
  await db.contract.delete({ where: { id } });
  return successResponse({ id }, 'Contrato eliminado');
});
