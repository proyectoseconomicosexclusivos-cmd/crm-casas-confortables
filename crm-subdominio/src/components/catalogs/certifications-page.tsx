'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  FileCheck,
  Search,
  Plus,
  Eye,
  Download,
  MoreHorizontal,
  Euro,
  Calendar,
  FileText,
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
import {
  CERTIFICATION_STATUS_LABELS,
  Certification,
  CertificationStatus,
  CertificationItem,
} from '@/types';

export function CertificationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/certifications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCertifications(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
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
  }, [search, statusFilter, pagination.page]);

  const handleViewDetail = async (cert: Certification) => {
    try {
      const response = await fetch(`/api/certifications/${cert.id}`);
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

  const handleUpdateStatus = async (certId: string, status: CertificationStatus) => {
    try {
      const response = await fetch(`/api/certifications/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Actualizado', description: 'Estado actualizado correctamente' });
        setShowDetail(false);
        fetchCertifications();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: CertificationStatus) => {
    const colors: Record<CertificationStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      FINAL: 'bg-purple-100 text-purple-800',
      INVOICED: 'bg-orange-100 text-orange-800',
      PAID: 'bg-emerald-100 text-emerald-800',
    };
    return (
      <Badge className={colors[status]}>
        {CERTIFICATION_STATUS_LABELS[status]}
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
            Certificaciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Certificaciones de obra y control de pagos
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Certificación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold">
                  {certifications.filter(c => c.status === 'PENDING' || c.status === 'DRAFT').length}
                </p>
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
                <p className="text-2xl font-bold">
                  {certifications.filter(c => c.status === 'APPROVED' || c.status === 'PARTIAL' || c.status === 'FINAL').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Euro className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Facturadas</p>
                <p className="text-2xl font-bold">
                  {certifications.filter(c => c.status === 'INVOICED').length}
                </p>
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
                <p className="text-2xl font-bold">
                  {certifications.filter(c => c.status === 'PAID').length}
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
                placeholder="Buscar por número..."
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
                {Object.entries(CERTIFICATION_STATUS_LABELS).map(([key, label]) => (
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
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Retención</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : certifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No se encontraron certificaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  certifications.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono font-medium">{cert.number}</TableCell>
                      <TableCell>{formatDate(cert.certDate)}</TableCell>
                      <TableCell>{cert.period || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cert.type === 'partial' ? 'Parcial' : 
                           cert.type === 'final' ? 'Final' : 'Mensual'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(cert.currentCertified)}</TableCell>
                      <TableCell>{formatPrice(cert.retentionAmount)}</TableCell>
                      <TableCell className="font-medium">{formatPrice(cert.total)}</TableCell>
                      <TableCell>{getStatusBadge(cert.status as CertificationStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(cert)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {cert.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(cert.id, 'PENDING')}>
                                <FileText className="w-4 h-4 mr-2" />
                                Enviar a revisión
                              </DropdownMenuItem>
                            )}
                            {cert.status === 'APPROVED' && (
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Generar PDF
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
            <DialogTitle>Certificación {selectedCert?.number}</DialogTitle>
          </DialogHeader>
          
          {selectedCert && (
            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">{formatDate(selectedCert.certDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Período</p>
                  <p className="font-medium">{selectedCert.period || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  {getStatusBadge(selectedCert.status as CertificationStatus)}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Partidas</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Presup.</TableHead>
                      <TableHead>Anterior</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCert.items?.map((item: CertificationItem) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.concept}</TableCell>
                        <TableCell>{item.budgetQty} {item.unit}</TableCell>
                        <TableCell>{item.previousQty} {item.unit}</TableCell>
                        <TableCell>{item.currentQty} {item.unit}</TableCell>
                        <TableCell>{formatPrice(item.currentAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Certificación actual</span>
                  <span>{formatPrice(selectedCert.currentCertified)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Certificado anterior</span>
                  <span>{formatPrice(selectedCert.previousCertified)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total certificado</span>
                  <span className="font-medium">{formatPrice(selectedCert.totalCertified)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Retención ({selectedCert.retentionPct}%)</span>
                  <span>-{formatPrice(selectedCert.retentionAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (21%)</span>
                  <span>{formatPrice(selectedCert.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(selectedCert.total)}</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Cerrar
                </Button>
                {selectedCert.status === 'PENDING' && (
                  <Button onClick={() => handleUpdateStatus(selectedCert.id, 'APPROVED')}>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Aprobar
                  </Button>
                )}
                {selectedCert.status === 'APPROVED' && (
                  <Button onClick={() => handleUpdateStatus(selectedCert.id, 'INVOICED')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Marcar facturado
                  </Button>
                )}
                {selectedCert.status === 'INVOICED' && (
                  <Button onClick={() => handleUpdateStatus(selectedCert.id, 'PAID')}>
                    <Euro className="w-4 h-4 mr-2" />
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
