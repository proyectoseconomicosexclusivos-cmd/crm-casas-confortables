'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Check,
  X,
  Clock,
  Truck,
  Package,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MATERIAL_ORDER_STATUS_LABELS,
  MaterialOrder,
  MaterialOrderStatus,
  MaterialOrderItem,
} from '@/types';

export function MaterialOrdersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaterialOrder | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/material-orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, pagination.page]);

  const handleViewDetail = async (order: MaterialOrder) => {
    try {
      const response = await fetch(`/api/material-orders/${order.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
        setShowDetail(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar detalle del pedido',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (orderId: string) => {
    try {
      const response = await fetch(`/api/material-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          approvalNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Aprobado', description: 'Pedido aprobado correctamente' });
        setShowDetail(false);
        setApprovalNotes('');
        fetchOrders();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al aprobar pedido',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, status: MaterialOrderStatus) => {
    try {
      const response = await fetch(`/api/material-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Actualizado', description: 'Estado actualizado correctamente' });
        setShowDetail(false);
        fetchOrders();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: MaterialOrderStatus) => {
    const colors: Record<MaterialOrderStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      ORDERED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      PARTIAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return (
      <Badge className={colors[status]}>
        {MATERIAL_ORDER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  const canApprove = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TEAM_LEADER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pedidos de Materiales
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestión de pedidos y entregas de materiales
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">En tránsito</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'ORDERED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Entregados</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'DELIVERED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número o proveedor..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(MATERIAL_ORDER_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{order.supplierName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.type === 'INTERNAL' ? 'Interno' : 
                           order.type === 'SUBCONTRACTOR' ? 'Subcontrata' :
                           order.type === 'PROJECT' ? 'Obra' : 'Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
                      <TableCell>{getStatusBadge(order.status as MaterialOrderStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(order)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {order.status === 'PENDING' && canApprove && (
                              <DropdownMenuItem onClick={() => handleApprove(order.id)}>
                                <Check className="w-4 h-4 mr-2" />
                                Aprobar
                              </DropdownMenuItem>
                            )}
                            {order.status === 'APPROVED' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'ORDERED')}>
                                <Truck className="w-4 h-4 mr-2" />
                                Marcar como pedido
                              </DropdownMenuItem>
                            )}
                            {order.status === 'ORDERED' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}>
                                <Package className="w-4 h-4 mr-2" />
                                Marcar entregado
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Proveedor</p>
                  <p className="font-medium">{selectedOrder.supplierName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  {getStatusBadge(selectedOrder.status as MaterialOrderStatus)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha pedido</p>
                  <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha esperada</p>
                  <p className="font-medium">
                    {selectedOrder.expectedDate ? formatDate(selectedOrder.expectedDate) : '-'}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Artículos</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item: MaterialOrderItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            {item.productSku && (
                              <div className="text-sm text-gray-500">{item.productSku}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity} {item.productUnit}</TableCell>
                        <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell>{formatPrice(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA</span>
                  <span>{formatPrice(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Approval */}
              {selectedOrder.status === 'PENDING' && canApprove && (
                <div className="border-t pt-4">
                  <Label>Notas de aprobación</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Añadir notas..."
                    className="mt-2"
                  />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Cerrar
                </Button>
                {selectedOrder.status === 'PENDING' && canApprove && (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button onClick={() => handleApprove(selectedOrder.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'APPROVED' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'ORDERED')}>
                    <Truck className="w-4 h-4 mr-2" />
                    Marcar como pedido
                  </Button>
                )}
                {selectedOrder.status === 'ORDERED' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}>
                    <Package className="w-4 h-4 mr-2" />
                    Marcar entregado
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
