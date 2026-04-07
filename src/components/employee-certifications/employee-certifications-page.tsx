'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  FileCheck,
  Plus,
  Eye,
  Trash2,
  Euro,
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  User,
  ChevronDown,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  EMPLOYEE_CERTIFICATION_STATUS_LABELS,
  EMPLOYEE_CERTIFICATION_STATUS_COLORS,
  EmployeeCertification,
  EmployeeCertificationStatus,
  EmployeeCertificationItem,
} from '@/types';

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

interface Stats {
  pending: { count: number; amount: number };
  approved: { count: number; amount: number; profit: number };
  paid: { count: number; amount: number; profit: number };
}

interface ItemFormData {
  workId?: string;
  workName?: string;
  description: string;
  hours: string;
  amount: string;
  validatedAmount?: string;
  notes?: string;
}

export function EmployeeCertificationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [certifications, setCertifications] = useState<EmployeeCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0, profit: 0 },
    paid: { count: 0, amount: 0, profit: 0 },
  });
  
  // Filters
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCert, setSelectedCert] = useState<EmployeeCertification | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    workDescription: '',
    items: [] as ItemFormData[],
  });
  
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER';

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (monthFilter) params.append('month', monthFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/employee-certifications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCertifications(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
        setStats(data.stats);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar certificaciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, [monthFilter, yearFilter, statusFilter, pagination.page]);

  const handleViewDetail = async (cert: EmployeeCertification) => {
    try {
      const response = await fetch(`/api/employee-certifications/${cert.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedCert(data.data);
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

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/employee-certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Creado', description: 'Certificación creada correctamente' });
        setShowCreate(false);
        resetForm();
        fetchCertifications();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al crear certificación',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear certificación',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (certId: string, status: EmployeeCertificationStatus, extraData?: any) => {
    try {
      const response = await fetch(`/api/employee-certifications/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Actualizado', description: 'Estado actualizado correctamente' });
        setShowDetail(false);
        fetchCertifications();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al actualizar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm('¿Está seguro de eliminar esta certificación?')) return;
    
    try {
      const response = await fetch(`/api/employee-certifications/${certId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Eliminado', description: 'Certificación eliminada' });
        fetchCertifications();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar certificación',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      workDescription: '',
      items: [],
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', hours: '', amount: '' }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof ItemFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const getStatusBadge = (status: EmployeeCertificationStatus) => {
    return (
      <Badge className={EMPLOYEE_CERTIFICATION_STATUS_COLORS[status]}>
        {EMPLOYEE_CERTIFICATION_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price || 0);
  };

  const getMonthLabel = (month: number) => {
    return MONTHS.find(m => m.value === month)?.label || month.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Certificaciones de Empleados
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Control de certificaciones mensuales y pagos
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Certificación
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pending.count}</p>
                <p className="text-sm text-gray-400">{formatPrice(stats.pending.amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aprobadas</p>
                <p className="text-2xl font-bold">{stats.approved.count}</p>
                <p className="text-sm text-gray-400">{formatPrice(stats.approved.amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Euro className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagadas</p>
                <p className="text-2xl font-bold">{stats.paid.count}</p>
                <p className="text-sm text-gray-400">{formatPrice(stats.paid.amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <Label className="mb-2 block">Mes</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Label className="mb-2 block">Año</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Label className="mb-2 block">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {Object.entries(EMPLOYEE_CERTIFICATION_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  {isAdmin && <TableHead>Empleado</TableHead>}
                  <TableHead>Período</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Validado</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : certifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                      No se encontraron certificaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  certifications.map((cert) => (
                    <TableRow key={cert.id}>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{cert.user?.name} {cert.user?.lastName}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{getMonthLabel(cert.month)} {cert.year}</span>
                        </div>
                      </TableCell>
                      <TableCell>{cert.hoursWorked?.toFixed(1) || 0}h</TableCell>
                      <TableCell className="font-medium">{formatPrice(cert.amount)}</TableCell>
                      <TableCell>{cert.adminAmount ? formatPrice(cert.adminAmount) : '-'}</TableCell>
                      <TableCell>
                        {cert.profitAmount ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            {formatPrice(cert.profitAmount)}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetail(cert)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {cert.status === 'DRAFT' && cert.userId === user?.id && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(cert.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Certificación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Period Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mes</Label>
                <Select 
                  value={formData.month.toString()} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, month: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Select 
                  value={formData.year.toString()} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, year: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Work Description */}
            <div>
              <Label>Descripción General del Trabajo</Label>
              <Textarea
                value={formData.workDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                placeholder="Describa el trabajo realizado este mes..."
                rows={3}
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Partidas de Trabajo</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Partida
                </Button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Añada partidas de trabajo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-6">
                            <Label className="text-xs">Obra (opcional)</Label>
                            <Input
                              value={item.workName || ''}
                              onChange={(e) => updateItem(index, 'workName', e.target.value)}
                              placeholder="Nombre de la obra"
                            />
                          </div>
                          <div className="col-span-12 md:col-span-6">
                            <Label className="text-xs">Descripción *</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="Descripción del trabajo"
                            />
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <Label className="text-xs">Horas</Label>
                            <Input
                              type="number"
                              value={item.hours}
                              onChange={(e) => updateItem(index, 'hours', e.target.value)}
                              placeholder="0"
                              step="0.5"
                            />
                          </div>
                          <div className="col-span-6 md:col-span-3">
                            <Label className="text-xs">Importe (€)</Label>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateItem(index, 'amount', e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                          <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Total */}
              {formData.items.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={formData.items.length === 0}>
              Crear Borrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Certificación - {selectedCert && getMonthLabel(selectedCert.month)} {selectedCert?.year}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCert && (
            <div className="space-y-6">
              {/* Info Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Empleado</p>
                  <p className="font-medium">{selectedCert.user?.name} {selectedCert.user?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Horas Trabajadas</p>
                  <p className="font-medium">{selectedCert.hoursWorked?.toFixed(1) || 0}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Importe Solicitado</p>
                  <p className="font-medium">{formatPrice(selectedCert.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  {getStatusBadge(selectedCert.status)}
                </div>
              </div>

              {/* Work Description */}
              {selectedCert.workDescription && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Descripción del Trabajo</p>
                  <p className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{selectedCert.workDescription}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h4 className="font-medium mb-3">Partidas de Trabajo</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Obra</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Horas</TableHead>
                        <TableHead>Importe</TableHead>
                        {isAdmin && selectedCert.status !== 'DRAFT' && (
                          <TableHead>Validado</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCert.items?.map((item: EmployeeCertificationItem) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.workName || '-'}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.hours}h</TableCell>
                          <TableCell>{formatPrice(item.amount)}</TableCell>
                          {isAdmin && selectedCert.status !== 'DRAFT' && (
                            <TableCell>
                              {item.validatedAmount !== null && item.validatedAmount !== undefined
                                ? formatPrice(item.validatedAmount)
                                : '-'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Admin Validation Section */}
              {isAdmin && selectedCert.status === 'SUBMITTED' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Validación de Administrador</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Importe Validado</Label>
                      <Input
                        type="number"
                        defaultValue={selectedCert.adminAmount || selectedCert.amount}
                        id="adminAmount"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Profit (%)</Label>
                      <Input
                        type="number"
                        defaultValue={selectedCert.profitPct || 0}
                        id="profitPct"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Notas del Administrador</Label>
                    <Textarea
                      id="adminNotes"
                      defaultValue={selectedCert.adminNotes || ''}
                      placeholder="Notas o comentarios..."
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total Solicitado</span>
                  <span className="font-medium">{formatPrice(selectedCert.amount)}</span>
                </div>
                {selectedCert.adminAmount && (
                  <>
                    <div className="flex justify-between">
                      <span>Total Validado</span>
                      <span className="font-medium text-green-600">{formatPrice(selectedCert.adminAmount)}</span>
                    </div>
                    {selectedCert.profitAmount && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Profit</span>
                        <span className="font-bold">{formatPrice(selectedCert.profitAmount)}</span>
                      </div>
                    )}
                  </>
                )}
                {selectedCert.adminNotes && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Notas del Administrador:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{selectedCert.adminNotes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Cerrar
                </Button>
                
                {/* Employee actions */}
                {selectedCert.userId === user?.id && selectedCert.status === 'DRAFT' && (
                  <Button onClick={() => handleUpdateStatus(selectedCert.id, 'SUBMITTED')}>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Enviar para Aprobación
                  </Button>
                )}
                
                {/* Admin actions */}
                {isAdmin && selectedCert.status === 'SUBMITTED' && (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedCert.id, 'REJECTED', {
                        adminNotes: (document.getElementById('adminNotes') as HTMLTextAreaElement)?.value,
                      })}
                    >
                      Rechazar
                    </Button>
                    <Button 
                      onClick={() => handleUpdateStatus(selectedCert.id, 'APPROVED', {
                        adminAmount: parseFloat((document.getElementById('adminAmount') as HTMLInputElement)?.value || selectedCert.amount),
                        profitPct: parseFloat((document.getElementById('profitPct') as HTMLInputElement)?.value || 0),
                        adminNotes: (document.getElementById('adminNotes') as HTMLTextAreaElement)?.value,
                      })}
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                  </>
                )}
                
                {isAdmin && selectedCert.status === 'APPROVED' && (
                  <Button onClick={() => handleUpdateStatus(selectedCert.id, 'PAID')}>
                    <Euro className="w-4 h-4 mr-2" />
                    Marcar Pagado
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
