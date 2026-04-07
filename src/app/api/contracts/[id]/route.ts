import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';

export const GET = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const contract = await db.contract.findUnique({ where: { id: params.id } });
  if (!contract) return errorResponse('Contrato no encontrado', 404);
  return successResponse(contract);
});

export const PUT = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const contract = await db.contract.findUnique({ where: { id: params.id } });
  if (!contract) return errorResponse('Contrato no encontrado', 404);
  const updated = await db.contract.update({ where: { id: params.id }, data: body });
  return successResponse(updated, 'Contrato actualizado');
});

export const DELETE = withAuth(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  const contract = await db.contract.findUnique({ where: { id: params.id } });
  if (!contract) return errorResponse('Contrato no encontrado', 404);
  await db.contract.delete({ where: { id: params.id } });
  return successResponse({ id: params.id }, 'Contrato eliminado');
});
