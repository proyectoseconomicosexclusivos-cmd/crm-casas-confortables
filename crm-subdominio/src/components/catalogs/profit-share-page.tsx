'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Coins,
  Search,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Clock,
  CheckCircle,
  Euro,
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
import { Input as InputField } from '@/components/ui/input';
import {
  PROFIT_SHARE_STATUS_LABELS,
  ProfitShare,
  ProfitShareStatus,
} from '@/types';

export function ProfitSharePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profitShares, setProfitShares] = useState<ProfitShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedShare, setSelectedShare] = useState<ProfitShare | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchProfitShares = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/profit-share?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProfitShares(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar repartos de beneficios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitShares();
  }, [search, statusFilter, pagination.page]);

  const handleViewDetail = async (share: ProfitShare) => {
    try {
      const response = await fetch(`/api/profit-share/${share.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedShare(data.data);
        setPaymentRef(data.data.paymentRef || '');
        setShowDetail(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar detalle',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (shareId: string, status: ProfitShareStatus) => {
    try {
      const response = await fetch(`/api/profit-share/${shareId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          paymentRef: status === 'PAID' ? paymentRef : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Actualizado', description: 'Estado actualizado correctamente' });
        setShowDetail(false);
        fetchProfitShares();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: ProfitShareStatus) => {
    const colors: Record<ProfitShareStatus, string> = {
      CALCULATED: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[status]}>
        {PROFIT_SHARE_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  const canApprove = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Calculate totals
  const totalPending = profitShares
    .filter(s => s.status === 'PENDING' || s.status === 'CALCULATED')
    .reduce((sum, s) => sum + s.shareAmount, 0);

  const totalApproved = profitShares
    .filter(s => s.status === 'APPROVED')
    .reduce((sum, s) => sum + s.shareAmount, 0);

  const totalPaid = profitShares
    .filter(s => s.status === 'PAID')
    .reduce((sum, s) => sum + s.shareAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profit Share
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Reparto de beneficios por optimización de presupuestos
        </p>
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
                <p className="text-2xl font-bold">{formatPrice(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold">{formatPrice(totalApproved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagados</p>
                <p className="text-2xl font-bold">{formatPrice(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ahorro total</p>
                <p className="text-2xl font-bold">
                  {formatPrice(profitShares.reduce((sum, s) => sum + s.savingAmount, 0))}
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
                placeholder="Buscar por usuario o descripción..."
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
                {Object.entries(PROFIT_SHARE_STATUS_LABELS).map(([key, label]) => (
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
                  <TableHead>Beneficiario</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ahorro</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Cantidad</TableHead>
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
                ) : profitShares.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron repartos de beneficios
                    </TableCell>
                  </TableRow>
                ) : (
                  profitShares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell className="font-medium">{share.userName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{share.description}</div>
                          <div className="text-xs text-gray-500">{formatDate(share.createdAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(share.savingAmount)}</TableCell>
                      <TableCell>{share.sharePct}%</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatPrice(share.shareAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(share.status as ProfitShareStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(share)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {share.status === 'CALCULATED' && canApprove && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(share.id, 'PENDING')}>
                                Enviar a aprobación
                              </DropdownMenuItem>
                            )}
                            {share.status === 'PENDING' && canApprove && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(share.id, 'APPROVED')}>
                                Aprobar
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle Profit Share</DialogTitle>
          </DialogHeader>
          
          {selectedShare && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Beneficiario</p>
                  <p className="font-medium">{selectedShare.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  {getStatusBadge(selectedShare.status as ProfitShareStatus)}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Descripción</p>
                <p className="font-medium">{selectedShare.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Ahorro total</p>
                  <p className="font-bold text-lg">{formatPrice(selectedShare.savingAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Porcentaje</p>
                  <p className="font-bold text-lg">{selectedShare.sharePct}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">A recibir</p>
                  <p className="font-bold text-lg text-green-600">{formatPrice(selectedShare.shareAmount)}</p>
                </div>
              </div>

              {selectedShare.status === 'APPROVED' && (
                <div>
                  <Label>Referencia de pago</Label>
                  <InputField
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Número de transferencia..."
                  />
                </div>
              )}

              {selectedShare.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="text-sm">{selectedShare.notes}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Cerrar
                </Button>
                {selectedShare.status === 'PENDING' && canApprove && (
                  <Button onClick={() => handleUpdateStatus(selectedShare.id, 'APPROVED')}>
                    Aprobar
                  </Button>
                )}
                {selectedShare.status === 'APPROVED' && canApprove && (
                  <Button onClick={() => handleUpdateStatus(selectedShare.id, 'PAID')}>
                    <Coins className="w-4 h-4 mr-2" />
                    Marcar pagado
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
