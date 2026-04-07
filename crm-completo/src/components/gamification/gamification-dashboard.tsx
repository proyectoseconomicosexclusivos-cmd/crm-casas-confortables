'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Target,
  Users,
  Crown,
  Flame,
  Award,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/types';

// Datos de ejemplo para el ranking
const mockRanking = [
  { userId: '1', userName: 'María García', points: 2850, position: 1, change: 0, avatar: null, role: 'COMMERCIAL', closedLeads: 12, closedValue: 420000 },
  { userId: '2', userName: 'Carlos López', points: 2420, position: 2, change: 1, avatar: null, role: 'COMMERCIAL', closedLeads: 10, closedValue: 350000 },
  { userId: '3', userName: 'Ana Martínez', points: 2180, position: 3, change: -1, avatar: null, role: 'COMMERCIAL', closedLeads: 8, closedValue: 280000 },
  { userId: '4', userName: 'Pedro Sánchez', points: 1950, position: 4, change: 2, avatar: null, role: 'TEAM_LEADER', closedLeads: 7, closedValue: 245000 },
  { userId: '5', userName: 'Laura Fernández', points: 1820, position: 5, change: 0, avatar: null, role: 'COMMERCIAL', closedLeads: 6, closedValue: 210000 },
  { userId: '6', userName: 'Roberto Díaz', points: 1650, position: 6, change: -2, avatar: null, role: 'COMMERCIAL', closedLeads: 5, closedValue: 175000 },
  { userId: '7', userName: 'Elena Ruiz', points: 1480, position: 7, change: 1, avatar: null, role: 'COMMERCIAL', closedLeads: 4, closedValue: 140000 },
  { userId: '8', userName: 'Miguel Torres', points: 1320, position: 8, change: -1, avatar: null, role: 'COMMERCIAL', closedLeads: 3, closedValue: 105000 },
];

// Logros disponibles
const mockAchievements = [
  { id: '1', name: 'Primer Cierre', description: 'Cierra tu primera venta', icon: '🎯', category: 'bronze', progress: 100, unlocked: true },
  { id: '2', name: 'Ley de Números', description: 'Cierra 10 ventas', icon: '🔢', category: 'bronze', progress: 80, unlocked: false },
  { id: '3', name: 'Cazador de Leads', description: 'Añade 50 leads', icon: '🔍', category: 'silver', progress: 100, unlocked: true },
  { id: '4', name: 'Estrella Ascendente', description: 'Alcanza el top 3 del ranking', icon: '⭐', category: 'gold', progress: 100, unlocked: true },
  { id: '5', name: 'Máquina de Ventas', description: 'Cierra 25 ventas', icon: '🚀', category: 'gold', progress: 40, unlocked: false },
  { id: '6', name: 'Leyenda', description: 'Cierra 100 ventas', icon: '👑', category: 'platinum', progress: 15, unlocked: false },
  { id: '7', name: 'Fuego Ardiente', description: '5 ventas en una semana', icon: '🔥', category: 'silver', progress: 60, unlocked: false },
  { id: '8', name: 'Perfeccionista', description: '100% de satisfacción cliente', icon: '💯', category: 'gold', progress: 85, unlocked: false },
];

// Logros recientes
const mockRecentAchievements = [
  { userName: 'María García', achievementName: 'Estrella Ascendente', icon: '⭐', unlockedAt: new Date('2026-03-25') },
  { userName: 'Carlos López', achievementName: 'Cazador de Leads', icon: '🔍', unlockedAt: new Date('2026-03-24') },
  { userName: 'Ana Martínez', achievementName: 'Primer Cierre', icon: '🎯', unlockedAt: new Date('2026-03-23') },
];

const CATEGORY_COLORS: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-400 to-cyan-600',
};

export function GamificationDashboard() {
  const { user } = useAuth();
  const [ranking] = useState(mockRanking);
  const [achievements] = useState(mockAchievements);
  const [recentAchievements] = useState(mockRecentAchievements);

  const myStats = ranking.find(r => r.userId === user?.id) || ranking[0];
  const myPosition = myStats?.position || 0;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-gray-400">#{position}</span>;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Gamificación y Rankings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Compite con tu equipo y desbloquea logros
          </p>
        </div>
      </div>

      {/* Mis estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Mi Posición
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {myPosition <= 3 ? (
                <Crown className={cn(
                  'w-8 h-8',
                  myPosition === 1 ? 'text-yellow-500' : myPosition === 2 ? 'text-gray-400' : 'text-amber-600'
                )} />
              ) : (
                <span className="text-3xl font-bold text-amber-700">#{myPosition}</span>
              )}
              {myStats?.change !== 0 && (
                <Badge variant={myStats?.change > 0 ? 'default' : 'destructive'} className="ml-2">
                  {myStats?.change > 0 ? `+${myStats.change}` : myStats.change}
                </Badge>
              )}
            </div>
            <p className="text-xs text-amber-600 mt-1">de {ranking.length} comerciales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Mis Puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{myStats?.points.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Ventas Cerradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{myStats?.closedLeads}</div>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(myStats?.closedValue || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Logros Desbloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">de logros totales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ranking principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Ranking de Ventas
            </CardTitle>
            <CardDescription>
              Clasificación mensual por puntos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {ranking.map((item) => (
                  <div
                    key={item.userId}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-colors',
                      item.userId === user?.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8">
                        {getPositionIcon(item.position)}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={item.avatar || ''} />
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {item.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.userName}</p>
                        <p className="text-xs text-gray-500">{ROLE_LABELS[item.role as keyof typeof ROLE_LABELS]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.points.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{item.closedLeads} ventas</p>
                      </div>
                      <div className="w-6 flex justify-center">
                        {getChangeIcon(item.change)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Logros recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAchievements.map((achievement, i) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b last:border-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{achievement.userName}</p>
                    <p className="text-xs text-gray-500">Desbloqueó: {achievement.achievementName}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            Logros
          </CardTitle>
          <CardDescription>
            Desbloquea logros y gana puntos extra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all',
                  achievement.unlocked
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                )}
              >
                {!achievement.unlocked && (
                  <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl" />
                )}
                <div className="relative">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3',
                    `bg-gradient-to-br ${CATEGORY_COLORS[achievement.category] || 'from-gray-400 to-gray-600'}`
                  )}>
                    {achievement.icon}
                  </div>
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                  {!achievement.unlocked && (
                    <div className="mt-3">
                      <Progress value={achievement.progress} className="h-1.5" />
                      <p className="text-xs text-gray-400 mt-1">{achievement.progress}% completado</p>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <Badge className="mt-2 bg-emerald-600">Desbloqueado</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
