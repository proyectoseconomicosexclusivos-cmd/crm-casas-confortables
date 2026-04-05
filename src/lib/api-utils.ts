import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Wrapper para API routes que requiere autenticación
 */
export function withAuth(
  handler: (req: NextRequest, session: any, params?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params?: any } = {}) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 401 }
        );
      }
      
      return handler(req, session, params);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper para API routes que requiere un rol específico
 */
export function withRole(
  allowedRoles: string[],
  handler: (req: NextRequest, session: any, params?: any) => Promise<NextResponse>
) {
  return withAuth(async (req, session, params) => {
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para realizar esta acción' },
        { status: 403 }
      );
    }
    return handler(req, session, params);
  });
}

/**
 * Obtiene los parámetros de paginación de la request
 */
export function getPaginationParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    skip: (parseInt(searchParams.get('page') || '1') - 1) * parseInt(searchParams.get('limit') || '20'),
  };
}

/**
 * Obtiene los parámetros de ordenación de la request
 */
export function getSortParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return {
    field: searchParams.get('sortField') || 'createdAt',
    direction: (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc',
  };
}

/**
 * Obtiene los parámetros de filtro de la request
 */
export function getFilterParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    source: searchParams.get('source') || undefined,
    assignedToId: searchParams.get('assignedToId') || undefined,
    officeId: searchParams.get('officeId') || undefined,
    teamId: searchParams.get('teamId') || undefined,
    companyId: searchParams.get('companyId') || undefined,
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
  };
}

/**
 * Respuesta JSON estándar exitosa
 */
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * Respuesta JSON de error
 */
export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Respuesta paginada
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
