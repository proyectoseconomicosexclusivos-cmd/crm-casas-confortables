'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, LEAD_SOURCE_LABELS } from '@/types';

// Colores para gráficos
const COLORS = {
  primary: '#10b981',
  secondary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#f59e0b',
  VISIT: '#8b5cf6',
  OFFER: '#f97316',
  NEGOTIATION: '#06b6d4',
  CLOSED: '#22c55e',
  LOST: '#ef4444',
};

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    contacted: number;
    visit: number;
    offer: number;
    negotiation: number;
    closed: number;
    lost: number;
    totalValue: number;
    closedValue: number;
    conversionRate: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    bySource: { source: string; count: number }[];
  };
  works: {
    total: number;
    active: number;
    completed: number;
  };
  commercials: {
    userId: string;
    userName: string;
    totalLeads: number;
    totalValue: number;
  }[];
  period: {
    type: string;
    from: string;
    to: string;
  };
}

// Datos de ejemplo para desarrollo
const mockStats: DashboardStats = {
  leads: {
    total: 156,
    new: 32,
    contacted: 28,
    visit: 18,
    offer: 24,
    negotiation: 15,
    closed: 22,
    lost: 17,
    totalValue: 2450000,
    closedValue: 580000,
    conversionRate: 14.1,
    byStatus: [
      { status: 'NEW', count: 32 },
      { status: 'CONTACTED', count: 28 },
      { status: 'VISIT', count: 18 },
      { status: 'OFFER', count: 24 },
      { status: 'NEGOTIATION', count: 15 },
      { status: 'CLOSED', count: 22 },
      { status: 'LOST', count: 17 },
    ],
    byType: [
      { type: 'NEW_BUILD', count: 58 },
      { type: 'REFORM', count: 45 },
      { type: 'INVESTMENT', count: 32 },
      { type: 'FRANCHISE', count: 21 },
    ],
    bySource: [
      { source: 'WEB', count: 48 },
      { source: 'FACEBOOK', count: 35 },
      { source: 'GOOGLE', count: 28 },
      { source: 'REFERRAL', count: 25 },
      { source: 'REAL_ESTATE', count: 20 },
    ],
  },
  works: {
    total: 34,
    active: 12,
    completed: 18,
  },
  commercials: [
    { userId: '1', userName: 'María García', totalLeads: 42, totalValue: 680000 },
    { userId: '2', userName: 'Carlos López', totalLeads: 38, totalValue: 520000 },
    { userId: '3', userName: 'Ana Martínez', totalLeads: 35, totalValue: 480000 },
    { userId: '4', userName: 'Pedro Sánchez', totalLeads: 28, totalValue: 420000 },
    { userId: '5', userName: 'Laura Fernández', totalLeads: 13, totalValue: 350000 },
  ],
  period: {
    type: 'month',
    from: '2026-02-26',
    to: '2026-03-26',
  },
};

// Datos para gráfico de tendencia mensual
const monthlyData = [
  { month: 'Oct', leads: 45, closed: 8 },
  { month: 'Nov', leads: 52, closed: 12 },
  { month: 'Dic', leads: 38, closed: 9 },
  { month: 'Ene', leads: 61, closed: 15 },
  { month: 'Feb', leads: 55, closed: 14 },
  { month: 'Mar', leads: 48, closed: 11 },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/stats?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Usar datos mock en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const leadTypeChartData = stats.leads.byType.map((item) => ({
    name: LEAD_TYPE_LABELS[item.type as keyof typeof LEAD_TYPE_LABELS] || item.type,
    value: item.count,
  }));

  const leadSourceChartData = stats.leads.bySource.map((item) => ({
    name: LEAD_SOURCE_LABELS[item.source as keyof typeof LEAD_SOURCE_LABELS] || item.source,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Bienvenido de vuelta, {user?.name}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
            <SelectItem value="quarter">Este trimestre</SelectItem>
            <SelectItem value="year">Este año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Leads
            </CardTitle>
            <Users className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.total}</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span>+12% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Leads Cerrados
            </CardTitle>
            <Target className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.closed}</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span>+8% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Valor Cerrado
            </CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.leads.closedValue)}
            </div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span>+15% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Tasa Conversión
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.conversionRate}%</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <ArrowDownRight className="w-3 h-3 mr-1" />
              <span>-2% vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Leads</CardTitle>
          <CardDescription>Distribución de leads por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.leads.byStatus.map((item) => {
              const percentage = stats.leads.total > 0 
                ? Math.round((item.count / stats.leads.total) * 100) 
                : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {LEAD_STATUS_LABELS[item.status as keyof typeof LEAD_STATUS_LABELS]}
                    </span>
                    <span className="text-gray-500">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: STATUS_COLORS[item.status],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tendencia Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
            <CardDescription>Leads y cierres por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary }}
                  />
                  <Line
                    type="monotone"
                    dataKey="closed"
                    name="Cerrados"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ fill: COLORS.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Leads por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Tipo</CardTitle>
            <CardDescription>Distribución por tipo de proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadTypeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {leadTypeChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={[
                          COLORS.primary,
                          COLORS.secondary,
                          COLORS.warning,
                          COLORS.info,
                        ][index % 4]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Leads por Fuente */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Fuente</CardTitle>
            <CardDescription>Origen de los leads</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadSourceChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#9ca3af"
                    width={80}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Rendimiento por Comercial */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rendimiento por Comercial</CardTitle>
            <CardDescription>Top comerciales del período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.commercials.slice(0, 5).map((commercial, index) => {
                const maxValue = stats.commercials[0]?.totalValue || 1;
                const percentage = Math.round((commercial.totalValue / maxValue) * 100);
                return (
                  <div key={commercial.userId} className="flex items-center gap-4">
                    <div className="w-6 text-sm font-medium text-gray-500">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{commercial.userName}</span>
                        <span className="text-sm text-gray-500">
                          {commercial.totalLeads} leads · {formatCurrency(commercial.totalValue)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Works Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Obras</CardTitle>
          <CardDescription>Estado actual de las obras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.works.total}</div>
                <div className="text-sm text-gray-500">Total Obras</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.works.active}</div>
                <div className="text-sm text-gray-500">En Curso</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.works.completed}</div>
                <div className="text-sm text-gray-500">Completadas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
