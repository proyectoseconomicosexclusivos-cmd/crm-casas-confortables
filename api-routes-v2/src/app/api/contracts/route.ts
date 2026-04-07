import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse, getPaginationParams } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';
import { ContractType, MainContractStatus } from '@prisma/client';

// GET /api/contracts
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as ContractType | null;
  const status = searchParams.get('status') as MainContractStatus | null;
  const search = searchParams.get('search');

  const where: any = {};
  if (!isSuperAdmin(session.user.role)) where.companyId = session.user.companyId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (search) where.OR = [{ title: { contains: search } }, { number: { contains: search } }, { partyName: { contains: search } }];

  const [contracts, total] = await Promise.all([
    db.contract.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    db.contract.count({ where }),
  ]);

  return Response.json({ success: true, data: contracts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// POST /api/contracts
export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const { type, title, partyName, startDate } = body;
  
  if (!type || !title || !partyName || !startDate) {
    return errorResponse('Tipo, titulo, nombre y fecha requeridos');
  }

  const companyId = isSuperAdmin(session.user.role) ? body.companyId : session.user.companyId;
  if (!companyId) return errorResponse('Empresa no especificada');

  const year = new Date().getFullYear();
  const count = await db.contract.count({ where: { companyId } });
  const number = `CNT-${year}-${String(count + 1).padStart(4, '0')}`;

  const contract = await db.contract.create({
    data: {
      companyId,
      type: type as ContractType,
      number,
      partyType: type.toLowerCase(),
      partyName,
      title,
      startDate: new Date(startDate),
      status: 'DRAFT',
      signedByParty: false,
      signedByCompany: false,
    },
  });

  return successResponse(contract, 'Contrato creado');
});
