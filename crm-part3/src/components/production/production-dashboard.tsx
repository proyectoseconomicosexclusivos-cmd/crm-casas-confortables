'use client';

import { useState, useEffect } from 'react';
import {
  Factory,
  Package,
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar,
  Play,
  Pause,
  Camera,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Estados de producción con colores
const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', color: 'bg-gray-500', textColor: 'text-gray-600' },
  IN_PROGRESS: { label: 'En Producción', color: 'bg-blue-500', textColor: 'text-blue-600' },
  QUALITY_CHECK: { label: 'Control Calidad', color: 'bg-purple-500', textColor: 'text-purple-600' },
  READY: { label: 'Listo Envío', color: 'bg-green-500', textColor: 'text-green-600' },
  SHIPPED: { label: 'Enviado', color: 'bg-cyan-500', textColor: 'text-cyan-600' },
  DELIVERED: { label: 'Entregado', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-600' },
};

// Fases de producción
const PHASES = [
  { id: 'CUTTING', label: 'Corte', icon: '✂️' },
  { id: 'ASSEMBLY', label: 'Ensamblaje', icon: '🔧' },
  { id: 'WELDING', label: 'Soldadura', icon: '🔥' },
  { id: 'PAINTING', label: 'Pintura', icon: '🎨' },
  { id: 'FINISHING', label: 'Acabado', icon: '✨' },
  { id: 'QUALITY', label: 'Control Calidad', icon: '✓' },
  { id: 'PACKAGING', label: 'Embalaje', icon: '📦' },
];

// Datos de ejemplo para desarrollo
const mockProductionOrders = [
  {
    id: '1',
    orderNumber: 'PED-2026-001',
    name: 'Estructura metálica - Casa García',
    clientName: 'Juan García',
    clientCity: 'Madrid',
    status: 'IN_PROGRESS',
    currentPhase: 'ASSEMBLY',
    progress: 45,
    priority: 1,
    orderDate: new Date('2026-03-20'),
    dueDate: new Date('2026-04-05'),
    quantity: 1,
    estimatedCost: 25000,
  },
  {
    id: '2',
    orderNumber: 'PED-2026-002',
    name: 'Ventanas aluminio - Edificio Sol',
    clientName: 'Inmobiliaria Sol',
    clientCity: 'Barcelona',
    status: 'IN_PROGRESS',
    currentPhase: 'CUTTING',
    progress: 20,
    priority: 2,
    orderDate: new Date('2026-03-22'),
    dueDate: new Date('2026-04-10'),
    quantity: 24,
    estimatedCost: 18500,
  },
  {
    id: '3',
    orderNumber: 'PED-2026-003',
    name: 'Puertas seguridad - Oficinas Central',
    clientName: 'Empresa Central S.L.',
    clientCity: 'Valencia',
    status: 'QUALITY_CHECK',
    currentPhase: 'QUALITY',
    progress: 90,
    priority: 1,
    orderDate: new Date('2026-03-15'),
    dueDate: new Date('2026-03-28'),
    quantity: 8,
    estimatedCost: 12000,
  },
  {
    id: '4',
    orderNumber: 'PED-2026-004',
    name: 'Cerramiento nave industrial',
    clientName: 'Logísticas Norte',
    clientCity: 'Bilbao',
    status: 'READY',
    currentPhase: 'PACKAGING',
    progress: 100,
    priority: 2,
    orderDate: new Date('2026-03-10'),
    dueDate: new Date('2026-03-25'),
    quantity: 1,
    estimatedCost: 45000,
  },
  {
    id: '5',
    orderNumber: 'PED-2026-005',
    name: 'Barandillas - Hotel Marina',
    clientName: 'Hotel Marina',
    clientCity: 'Málaga',
    status: 'PENDING',
    currentPhase: null,
    progress: 0,
    priority: 3,
    orderDate: new Date('2026-03-25'),
    dueDate: new Date('2026-04-20'),
    quantity: 45,
    estimatedCost: 28000,
  },
];

const mockShipments = [
  {
    id: '1',
    shipmentNumber: 'ALB-2026-015',
    destinationCity: 'Sevilla',
    status: 'in_transit',
    shipmentDate: new Date('2026-03-25'),
    driverName: 'Pedro Martínez',
  },
  {
    id: '2',
    shipmentNumber: 'ALB-2026-014',
    destinationCity: 'Zaragoza',
    status: 'delivered',
    shipmentDate: new Date('2026-03-24'),
    deliveryDate: new Date('2026-03-25'),
    driverName: 'Carlos López',
  },
];

export function ProductionDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(mockProductionOrders);
  const [shipments, setShipments] = useState(mockShipments);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Estadísticas rápidas
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
    ready: orders.filter(o => o.status === 'READY' || o.status === 'QUALITY_CHECK').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    urgent: orders.filter(o => o.priority === 1).length,
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
            <Factory className="w-7 h-7 text-emerald-600" />
            Panel de Producción
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestión de pedidos y control de fábrica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Camera className="w-4 h-4 mr-2" />
            Subir Foto
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Package className="w-4 h-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En Producción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.urgent} urgentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Listos para Envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.ready}</div>
            <p className="text-xs text-gray-500 mt-1">Esperando transporte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              En Tránsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600">{stats.shipped}</div>
            <p className="text-xs text-gray-500 mt-1">Camiones en ruta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.pending}</div>
            <p className="text-xs text-gray-500 mt-1">Sin iniciar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="shipments">Envíos</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Pedidos urgentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Pedidos Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders
                  .filter(o => o.priority === 1 && o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
                  .map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.color
                        )} />
                        <div>
                          <p className="font-medium">{order.name}</p>
                          <p className="text-sm text-gray-500">
                            {order.orderNumber} • {order.clientName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{order.progress}%</p>
                          <p className="text-xs text-gray-500">
                            Entrega: {format(new Date(order.dueDate), 'd MMM', { locale: es })}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Producción actual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">En Producción Ahora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders
                  .filter(o => o.status === 'IN_PROGRESS')
                  .map((order) => (
                    <div key={order.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.name}</p>
                          <p className="text-sm text-gray-500">{order.clientCity}</p>
                        </div>
                        <Badge variant="outline">
                          {PHASES.find(p => p.id === order.currentPhase)?.label || 'Sin fase'}
                        </Badge>
                      </div>
                      <Progress value={order.progress} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Pedidos</CardTitle>
              <CardDescription>Gestiona los pedidos de producción</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {orders.map((order) => {
                    const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', statusConfig?.color)}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{order.name}</p>
                            <p className="text-sm text-gray-500">
                              {order.orderNumber} • {order.clientName} • {order.clientCity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(order.estimatedCost)}</p>
                            <p className="text-xs text-gray-500">{order.quantity} unidades</p>
                          </div>
                          <div className="w-24">
                            <Progress value={order.progress} className="h-2" />
                            <p className="text-xs text-center mt-1">{order.progress}%</p>
                          </div>
                          <Badge className={cn(statusConfig?.color, 'text-white')}>
                            {statusConfig?.label}
                          </Badge>
                          {order.priority === 1 && (
                            <Badge variant="destructive">Urgente</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Envíos</CardTitle>
              <CardDescription>Control de cargas y transportes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      )}>
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{shipment.shipmentNumber}</p>
                        <p className="text-sm text-gray-500">
                          Destino: {shipment.destinationCity} • {shipment.driverName}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      shipment.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500',
                      'text-white'
                    )}>
                      {shipment.status === 'delivered' ? 'Entregado' : 'En tránsito'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividad</CardTitle>
              <CardDescription>Últimas actividades de producción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Play className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Inicio de fase: Ensamblaje</p>
                      <p className="text-sm text-gray-500">PED-2026-001 - Estructura metálica</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Hace {i * 2} horas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
