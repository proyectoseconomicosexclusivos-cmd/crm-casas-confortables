import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { isSuperAdmin, isAdmin } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// GET /api/gamification - Obtener ranking y estadísticas
export const GET = withAuth(async (req: NextRequest, session: any) => {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month'; // day, week, month, year, all
  const scope = searchParams.get('scope') || 'company'; // global, company, team, office

  // Calcular fechas según período
  const now = new Date();
  let dateFrom: Date;

  switch (period) {
    case 'day':
      dateFrom = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      dateFrom = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'year':
      dateFrom = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case 'month':
    default:
      dateFrom = new Date(now.setMonth(now.getMonth() - 1));
  }

  // Construir filtros según scope
  const where: Prisma.UserWhereInput = { isActive: true };
  let scopeId: string | null = null;

  if (scope === 'company' && session.user.companyId) {
    where.companyId = session.user.companyId;
    scopeId = session.user.companyId;
  } else if (scope === 'team' && session.user.teamId) {
    where.teamId = session.user.teamId;
    scopeId = session.user.teamId;
  } else if (scope === 'office' && session.user.officeId) {
    where.officeId = session.user.officeId;
    scopeId = session.user.officeId;
  }

  // Obtener usuarios con sus estadísticas
  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      lastName: true,
      avatar: true,
      role: true,
      points: true,
      _count: {
        select: {
          assignedLeads: {
            where: { createdAt: { gte: dateFrom } },
          },
          achievements: true,
        },
      },
      assignedLeads: {
        where: {
          createdAt: { gte: dateFrom },
          status: 'CLOSED',
        },
        select: { estimatedValue: true },
      },
    },
  });

  // Calcular ranking
  const ranking = users.map((user) => {
    const closedValue = user.assignedLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
    const closedCount = user.assignedLeads.length;
    const totalLeads = user._count.assignedLeads;
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;
    const points = user.points?.totalPoints || 0;

    return {
      userId: user.id,
      userName: `${user.name} ${user.lastName || ''}`,
      avatar: user.avatar,
      role: user.role,
      points,
      closedLeads: closedCount,
      closedValue,
      totalLeads,
      conversionRate,
      achievements: user._count.achievements,
    };
  }).sort((a, b) => b.points - a.points);

  // Añadir posición
  const rankedUsers = ranking.map((user, index) => ({
    ...user,
    position: index + 1,
  }));

  // Obtener logros recientes
  const recentAchievements = await db.userAchievement.findMany({
    where: {
      userId: { in: users.map(u => u.id) },
    },
    orderBy: { unlockedAt: 'desc' },
    take: 10,
    include: {
      achievement: true,
    },
  });

  // Obtener los logros del usuario actual
  const myAchievements = await db.userAchievement.findMany({
    where: { userId: session.user.id },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });

  // Obtener puntos del usuario
  const myPoints = await db.userPoints.findUnique({
    where: { userId: session.user.id },
  });

  return successResponse({
    ranking: rankedUsers,
    recentAchievements: recentAchievements.map(ua => ({
      achievementId: ua.achievementId,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      unlockedAt: ua.unlockedAt,
      userId: ua.userId,
    })),
    myStats: {
      position: rankedUsers.find(u => u.userId === session.user.id)?.position || 0,
      points: myPoints?.totalPoints || 0,
      weeklyPoints: myPoints?.weeklyPoints || 0,
      monthlyPoints: myPoints?.monthlyPoints || 0,
      achievements: myAchievements.length,
      achievementsList: myAchievements.map(ua => ({
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        progress: ua.progress,
      })),
    },
    period: {
      type: period,
      from: dateFrom,
      to: new Date(),
    },
  });
});

// POST /api/gamification/points - Añadir puntos
export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const { userId, points, reason, type } = body;

  // Solo Admin puede añadir puntos manualmente
  if (!isSuperAdmin(session.user.role) && !isAdmin(session.user.role)) {
    return errorResponse('No tienes permiso para añadir puntos', 403);
  }

  const targetUserId = userId || session.user.id;
  const pointsToAdd = parseInt(points) || 0;

  if (pointsToAdd <= 0) {
    return errorResponse('Los puntos deben ser positivos');
  }

  // Actualizar o crear registro de puntos
  const userPoints = await db.userPoints.upsert({
    where: { userId: targetUserId },
    update: {
      totalPoints: { increment: pointsToAdd },
      monthlyPoints: { increment: pointsToAdd },
      weeklyPoints: { increment: pointsToAdd },
      lastUpdated: new Date(),
    },
    create: {
      userId: targetUserId,
      companyId: session.user.companyId,
      totalPoints: pointsToAdd,
      monthlyPoints: pointsToAdd,
      weeklyPoints: pointsToAdd,
    },
  });

  // Verificar si ha desbloqueado algún logro
  const achievements = await db.achievement.findMany({
    where: {
      isActive: true,
      OR: [
        { companyId: session.user.companyId },
        { companyId: null },
      ],
    },
  });

  const unlockedAchievements = [];
  for (const achievement of achievements) {
    const requirement = JSON.parse(achievement.requirement || '{}');
    
    // Verificar si cumple el requisito
    if (requirement.type === 'points' && userPoints.totalPoints >= requirement.value) {
      // Verificar si ya lo tiene
      const existing = await db.userAchievement.findUnique({
        where: { userId_achievementId: { userId: targetUserId, achievementId: achievement.id } },
      });

      if (!existing) {
        await db.userAchievement.create({
          data: {
            userId: targetUserId,
            achievementId: achievement.id,
          },
        });
        unlockedAchievements.push(achievement);
      }
    }
  }

  // Crear notificaciones por logros desbloqueados
  for (const achievement of unlockedAchievements) {
    await db.notification.create({
      data: {
        userId: targetUserId,
        type: 'SYSTEM',
        title: '¡Logro desbloqueado!',
        message: `Has desbloqueado: ${achievement.name}`,
      },
    });
  }

  return successResponse({
    points: userPoints,
    unlockedAchievements,
  }, `Puntos añadidos: +${pointsToAdd}`);
});
