'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  FileText,
  Search,
  Plus,
  Eye,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  SUBCONTRACTOR_BUDGET_STATUS_LABELS,
  SubcontractorBudget,
  SubcontractorBudgetStatus,
  SubcontractorBudgetItem,
} from '@/types';

export function SubcontractorBudgetsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<SubcontractorBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<SubcontractorBudget | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/subcontractor-budgets?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBudgets(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar presupuestos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [search, statusFilter, pagination.page]);

  const handleViewDetail = async (budget: SubcontractorBudget) => {
    try {
      const response = await fetch(`/api/subcontractor-budgets/${budget.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBudget(data.data);
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

  const handleUpdateStatus = async (budgetId: string, status: SubcontractorBudgetStatus) => {
    try {
      const response = await fetch(`/api/subcontractor-budgets/${budgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Actualizado', description: 'Estado actualizado correctamente' });
        setShowDetail(false);
        fetchBudgets();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: SubcontractorBudgetStatus) => {
    const colors: Record<SubcontractorBudgetStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[status]}>
        {SUBCONTRACTOR_BUDGET_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Presupuestos Subcontratas
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Control de presupuestos y márgenes
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes aprobación</p>
                <p className="text-2xl font-bold">
                  {budgets.filter(b => b.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">En ejecución</p>
                <p className="text-2xl font-bold">
                  {budgets.filter(b => b.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-2xl font-bold">
                  {budgets.filter(b => b.status === 'COMPLETED').length}
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
                placeholder="Buscar..."
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
                {Object.entries(SUBCONTRACTOR_BUDGET_STATUS_LABELS).map(([key, label]) => (
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
                  <TableHead>Título</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ppto. Cliente</TableHead>
                  <TableHead>Margen</TableHead>
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
                ) : budgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron presupuestos
                    </TableCell>
                  </TableRow>
                ) : (
                  budgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{budget.title}</div>
                          {budget.number && (
                            <div className="text-sm text-gray-500">{budget.number}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(budget.budgetDate)}</TableCell>
                      <TableCell className="font-medium">{formatPrice(budget.total)}</TableCell>
                      <TableCell>
                        {budget.clientBudget ? formatPrice(budget.clientBudget) : '-'}
                      </TableCell>
                      <TableCell>
                        {budget.marginPct !== null && budget.marginPct !== undefined ? (
                          <div className="flex items-center gap-1">
                            {budget.marginPct >= 10 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : budget.marginPct >= 5 ? (
                              <TrendingUp className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={
                              budget.marginPct >= 10 ? 'text-green-600' :
                              budget.marginPct >= 5 ? 'text-yellow-600' : 'text-red-600'
                            }>
                              {budget.marginPct.toFixed(1)}%
                            </span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(budget.status as SubcontractorBudgetStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(budget)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {budget.status === 'PENDING' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(budget.id, 'ACCEPTED')}>
                                  <Check className="w-4 h-4 mr-2 text-green-600" />
                                  Aceptar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(budget.id, 'REJECTED')}>
                                  <X className="w-4 h-4 mr-2 text-red-600" />
                                  Rechazar
                                </DropdownMenuItem>
                              </>
                            )}
                            {budget.status === 'ACCEPTED' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(budget.id, 'IN_PROGRESS')}>
                                Iniciar ejecución
                              </DropdownMenuItem>
                            )}
                            {budget.status === 'IN_PROGRESS' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(budget.id, 'COMPLETED')}>
                                Marcar completado
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
            <DialogTitle>{selectedBudget?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedBudget && (
            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">{formatDate(selectedBudget.budgetDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  {getStatusBadge(selectedBudget.status as SubcontractorBudgetStatus)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Margen</p>
                  <p className="font-medium">
                    {selectedBudget.marginPct?.toFixed(1) || 0}%
                    <span className="text-sm text-gray-500 ml-1">
                      ({formatPrice(selectedBudget.margin || 0)})
                    </span>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Partidas</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Certificado</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBudget.items?.map((item: SubcontractorBudgetItem) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.concept}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell>{item.certifiedQty} {item.unit}</TableCell>
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
                  <span>{formatPrice(selectedBudget.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (21%)</span>
                  <span>{formatPrice(selectedBudget.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(selectedBudget.total)}</span>
                </div>
                {selectedBudget.clientBudget && (
                  <>
                    <div className="flex justify-between text-gray-500">
                      <span>Presupuesto cliente</span>
                      <span>{formatPrice(selectedBudget.clientBudget)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Margen</span>
                      <span>{formatPrice(selectedBudget.margin || 0)} ({selectedBudget.marginPct?.toFixed(1)}%)</span>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Cerrar
                </Button>
                {selectedBudget.status === 'PENDING' && (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedBudget.id, 'REJECTED')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button onClick={() => handleUpdateStatus(selectedBudget.id, 'ACCEPTED')}>
                      <Check className="w-4 h-4 mr-2" />
                      Aceptar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
