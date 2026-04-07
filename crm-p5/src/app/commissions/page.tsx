'use client';

import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DollarSign,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  User,
} from 'lucide-react';

interface Commission {
  id: string;
  type: string;
  baseAmount: number;
  percentage?: number;
  amount: number;
  status: string;
  saleDate?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  user?: { id: string; name: string; lastName: string; role: string };
}

interface Totals {
  totalCommissions: number;
  totalAmount: number;
  totalBaseAmount: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: Clock },
  APPROVED: { label: 'Aprobada', color: 'text-blue-700', bgColor: 'bg-blue-50', icon: CheckCircle },
  PAID: { label: 'Pagada', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
};

const TYPE_CONFIG: Record<string, string> = {
  SALE: 'Por venta',
  MARGIN: 'Por margen',
  REFERRAL: 'Por referido',
  BONUS: 'Bonus extra',
  FRANCHISE: 'Franquicia',
  REAL_ESTATE: 'Inmobiliaria',
};

function CommissionsContent() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [totals, setTotals] = useState<Totals>({
    totalCommissions: 0,
    totalAmount: 0,
    totalBaseAmount: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    type: 'SALE',
    baseAmount: '',
    percentage: '',
    amount: '',
    saleDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/commissions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCommissions(data.data);
        setTotals(data.totals);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCommissions();
      }
    } catch (error) {
      console.error('Error updating commission:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setFormData({
          userId: '',
          type: 'SALE',
          baseAmount: '',
          percentage: '',
          amount: '',
          saleDate: '',
          notes: '',
        });
        fetchCommissions();
      }
    } catch (error) {
      console.error('Error creating commission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comisiones</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestión y control de comisiones del equipo comercial
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Comisión
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Comisión</DialogTitle>
              <DialogDescription>
                Complete los datos para crear una nueva comisión
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="userId">ID del Usuario *</Label>
                  <Input
                    id="userId"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    placeholder="ID del comercial"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Comisión</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALE">Por venta</SelectItem>
                      <SelectItem value="MARGIN">Por margen</SelectItem>
                      <SelectItem value="REFERRAL">Por referido</SelectItem>
                      <SelectItem value="BONUS">Bonus extra</SelectItem>
                      <SelectItem value="FRANCHISE">Franquicia</SelectItem>
                      <SelectItem value="REAL_ESTATE">Inmobiliaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="baseAmount">Importe Base *</Label>
                    <Input
                      id="baseAmount"
                      type="number"
                      value={formData.baseAmount}
                      onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="percentage">Porcentaje %</Label>
                    <Input
                      id="percentage"
                      type="number"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Cantidad Comisión *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saleDate">Fecha de Venta</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas adicionales"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Crear Comisión
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.totalCommissions}</div>
                <div className="text-sm text-gray-500">Total Comisiones</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(
                    commissions
                      .filter((c) => c.status === 'PENDING')
                      .reduce((sum, c) => sum + c.amount, 0)
                  )}
                </div>
                <div className="text-sm text-gray-500">Pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    commissions
                      .filter((c) => c.status === 'APPROVED')
                      .reduce((sum, c) => sum + c.amount, 0)
                  )}
                </div>
                <div className="text-sm text-gray-500">Aprobadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totals.totalAmount)}
                </div>
                <div className="text-sm text-gray-500">Total Importe</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar comisiones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="APPROVED">Aprobada</SelectItem>
                <SelectItem value="PAID">Pagada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Listado de Comisiones
          </CardTitle>
          <CardDescription>
            {commissions.length} comisión(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron comisiones
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comercial</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Importe Base</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {commission.user?.name} {commission.user?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commission.user?.role}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{TYPE_CONFIG[commission.type] || commission.type}</span>
                      </TableCell>
                      <TableCell>{formatCurrency(commission.baseAmount)}</TableCell>
                      <TableCell>
                        {commission.percentage ? `${commission.percentage}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(commission.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${STATUS_CONFIG[commission.status]?.bgColor} ${STATUS_CONFIG[commission.status]?.color}`}
                        >
                          {STATUS_CONFIG[commission.status]?.label || commission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(commission.saleDate || commission.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600"
                              onClick={() => handleStatusChange(commission.id, 'APPROVED')}
                            >
                              Aprobar
                            </Button>
                          </div>
                        )}
                        {commission.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleStatusChange(commission.id, 'PAID')}
                          >
                            Marcar Pagada
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CommissionsPage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <CommissionsContent />
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
