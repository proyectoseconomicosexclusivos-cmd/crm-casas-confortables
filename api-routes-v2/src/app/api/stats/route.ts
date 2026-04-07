import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin, isTeamLeader, canViewOthersStats } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// GET /api/stats - Estadisticas del dashboard
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month'; // today, week, month, quarter, year
  const officeId = searchParams.get('officeId');
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');

  // Calcular fechas segun periodo
  const now = new Date();
  let dateFrom: Date;

  switch (period) {
    case 'today':
      dateFrom = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      dateFrom = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'quarter':
      dateFrom = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      dateFrom = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case 'month':
    default:
      dateFrom = new Date(now.setMonth(now.getMonth() - 1));
  }

  // Construir filtros segun permisos
  const leadWhere: Prisma.LeadWhereInput = {
    createdAt: { gte: dateFrom },
  };

  if (isSuperAdmin(session.user.role)) {
    // Ve todo
    if (officeId) leadWhere.officeId = officeId;
    if (teamId) leadWhere.teamId = teamId;
    if (userId) leadWhere.assignedToId = userId;
  } else if (isAdmin(session.user.role)) {
    leadWhere.companyId = session.user.companyId;
    if (officeId) leadWhere.officeId = officeId;
    if (teamId) leadWhere.teamId = teamId;
    if (userId) leadWhere.assignedToId = userId;
  } else if (isTeamLeader(session.user.role)) {
    leadWhere.teamId = session.user.teamId;
    if (userId) leadWhere.assignedToId = userId;
  } else {
    // Comercial solo ve sus estadisticas
    leadWhere.assignedToId = session.user.id;
  }

  // Obtener estadisticas de leads
  const [
    totalLeads,
    newLeads,
    contactedLeads,
    visitLeads,
    offerLeads,
    negotiationLeads,
    closedLeads,
    lostLeads,
    totalValueResult,
    closedValueResult,
    leadsByStatus,
    leadsByType,
    leadsBySource,
  ] = await Promise.all([
    // Total leads
    db.lead.count({ where: leadWhere }),
    
    // Leads por estado
    db.lead.count({ where: { ...leadWhere, status: 'NEW' } }),
    db.lead.count({ where: { ...leadWhere, status: 'CONTACTED' } }),
    db.lead.count({ where: { ...leadWhere, status: 'VISIT' } }),
    db.lead.count({ where: { ...leadWhere, status: 'OFFER' } }),
    db.lead.count({ where: { ...leadWhere, status: 'NEGOTIATION' } }),
    db.lead.count({ where: { ...leadWhere, status: 'CLOSED' } }),
    db.lead.count({ where: { ...leadWhere, status: 'LOST' } }),
    
    // Valores
    db.lead.aggregate({
      where: leadWhere,
      _sum: { estimatedValue: true },
    }),
    db.lead.aggregate({
      where: { ...leadWhere, status: 'CLOSED' },
      _sum: { estimatedValue: true },
    }),
    
    // Distribucion por estado
    db.lead.groupBy({
      by: ['status'],
      where: leadWhere,
      _count: { id: true },
    }),
    
    // Distribucion por tipo
    db.lead.groupBy({
      by: ['type'],
      where: leadWhere,
      _count: { id: true },
    }),
    
    // Distribucion por fuente
    db.lead.groupBy({
      by: ['source'],
      where: leadWhere,
      _count: { id: true },
    }),
  ]);

  // Calcular tasa de conversion
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  // Estadisticas por comercial (solo si tiene permisos)
  let commercialStats: any[] = [];
  if (canViewOthersStats(session.user.role)) {
    const commercialWhere: Prisma.LeadWhereInput = { ...leadWhere };
    
    const leadsByUser = await db.lead.groupBy({
      by: ['assignedToId'],
      where: commercialWhere,
      _count: { id: true },
      _sum: { estimatedValue: true },
    });

    // Obtener nombres de usuarios
    const userIds = leadsByUser.map(l => l.assignedToId).filter(Boolean) as string[];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, lastName: true },
    });

    commercialStats = leadsByUser.map(l => {
      const user = users.find(u => u.id === l.assignedToId);
      return {
        userId: l.assignedToId,
        userName: user ? `${user.name} ${user.lastName || ''}`.trim() : 'Sin asignar',
        totalLeads: l._count.id,
        totalValue: l._sum.estimatedValue || 0,
      };
    });
  }

  // Tendencia mensual (ultimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyLeads = await db.lead.groupBy({
    by: ['status'],
    where: {
      ...leadWhere,
      createdAt: { gte: sixMonthsAgo },
    },
    _count: { id: true },
  });

  // Estadisticas de obras
  const workWhere: Prisma.WorkWhereInput = {
    createdAt: { gte: dateFrom },
  };

  if (!isSuperAdmin(session.user.role)) {
    workWhere.companyId = session.user.companyId;
  }

  const [totalWorks, activeWorks, completedWorks] = await Promise.all([
    db.work.count({ where: workWhere }),
    db.work.count({ where: { ...workWhere, status: 'IN_PROGRESS' } }),
    db.work.count({ where: { ...workWhere, status: 'COMPLETED' } }),
  ]);

  return successResponse({
    leads: {
      total: totalLeads,
      new: newLeads,
      contacted: contactedLeads,
      visit: visitLeads,
      offer: offerLeads,
      negotiation: negotiationLeads,
      closed: closedLeads,
      lost: lostLeads,
      totalValue: totalValueResult._sum.estimatedValue || 0,
      closedValue: closedValueResult._sum.estimatedValue || 0,
      conversionRate,
      byStatus: leadsByStatus.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      byType: leadsByType.map(t => ({
        type: t.type,
        count: t._count.id,
      })),
      bySource: leadsBySource.map(s => ({
        source: s.source,
        count: s._count.id,
      })),
    },
    works: {
      total: totalWorks,
      active: activeWorks,
      completed: completedWorks,
    },
    commercials: commercialStats,
    period: {
      type: period,
      from: dateFrom,
      to: new Date(),
    },
  });
});
