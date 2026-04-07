'use client';

import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Plus,
  Search,
  HardHat,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Loader2,
  Eye,
} from 'lucide-react';

interface Work {
  id: string;
  name: string;
  description?: string;
  address: string;
  city?: string;
  province?: string;
  status: string;
  budget?: number;
  progress: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  company?: { id: string; name: string };
  createdBy?: { id: string; name: string; lastName: string };
  lead?: { id: string; firstName: string; lastName: string; email?: string; phone?: string };
  _count?: { documents: number; tasks: number; updates: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PLANNING: { label: 'Planificación', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  IN_PROGRESS: { label: 'En curso', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  PAUSED: { label: 'Pausada', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  COMPLETED: { label: 'Completada', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-50' },
};

function WorksContent() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    province: '',
    budget: '',
    estimatedDays: '',
    startDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchWorks();
  }, [statusFilter, search]);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/works?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setWorks(data.data);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setFormData({
          name: '',
          description: '',
          address: '',
          city: '',
          province: '',
          budget: '',
          estimatedDays: '',
          startDate: '',
          notes: '',
        });
        fetchWorks();
      }
    } catch (error) {
      console.error('Error creating work:', error);
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

  const totalWorks = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Obras</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Control y seguimiento de obras activas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Obra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Obra</DialogTitle>
              <DialogDescription>
                Complete los datos para crear una nueva obra
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre de la obra"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Dirección de la obra"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ciudad"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="province">Provincia</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Provincia"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Presupuesto</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedDays">Días estimados</Label>
                    <Input
                      id="estimatedDays"
                      type="number"
                      value={formData.estimatedDays}
                      onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la obra"
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
                  Crear Obra
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalWorks}</div>
            <div className="text-sm text-gray-500">Total Obras</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.PLANNING || 0}</div>
            <div className="text-sm text-gray-500">Planificación</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.IN_PROGRESS || 0}</div>
            <div className="text-sm text-gray-500">En Curso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.COMPLETED || 0}</div>
            <div className="text-sm text-gray-500">Completadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.PAUSED || 0}</div>
            <div className="text-sm text-gray-500">Pausadas</div>
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
                placeholder="Buscar obras..."
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
                <SelectItem value="PLANNING">Planificación</SelectItem>
                <SelectItem value="IN_PROGRESS">En curso</SelectItem>
                <SelectItem value="PAUSED">Pausada</SelectItem>
                <SelectItem value="COMPLETED">Completada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Works Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardHat className="w-5 h-5" />
            Listado de Obras
          </CardTitle>
          <CardDescription>
            {works.length} obra(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron obras
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obra</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {works.map((work) => (
                    <TableRow key={work.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{work.name}</div>
                          {work.description && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {work.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">{work.address}</span>
                          {work.city && (
                            <span className="text-gray-400">({work.city})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${STATUS_CONFIG[work.status]?.bgColor} ${STATUS_CONFIG[work.status]?.color}`}
                        >
                          {STATUS_CONFIG[work.status]?.label || work.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={work.progress} className="w-16 h-2" />
                          <span className="text-sm text-gray-500">{work.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          {formatCurrency(work.budget)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {work.lead ? (
                          <div>
                            <div className="font-medium">
                              {work.lead.firstName} {work.lead.lastName}
                            </div>
                            {work.lead.phone && (
                              <div className="text-sm text-gray-500">{work.lead.phone}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWork(work);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedWork?.name}</DialogTitle>
            <DialogDescription>Detalles de la obra</DialogDescription>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Estado</Label>
                  <Badge
                    variant="outline"
                    className={`${STATUS_CONFIG[selectedWork.status]?.bgColor} ${STATUS_CONFIG[selectedWork.status]?.color}`}
                  >
                    {STATUS_CONFIG[selectedWork.status]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Progreso</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedWork.progress} className="w-24 h-2" />
                    <span>{selectedWork.progress}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Dirección</Label>
                  <p>{selectedWork.address}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Ciudad</Label>
                  <p>{selectedWork.city || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Presupuesto</Label>
                  <p className="font-medium">{formatCurrency(selectedWork.budget)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Fecha inicio</Label>
                  <p>{formatDate(selectedWork.startDate)}</p>
                </div>
              </div>
              {selectedWork.lead && (
                <div>
                  <Label className="text-sm text-gray-500">Cliente</Label>
                  <p className="font-medium">
                    {selectedWork.lead.firstName} {selectedWork.lead.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedWork.lead.email}</p>
                </div>
              )}
              {selectedWork.description && (
                <div>
                  <Label className="text-sm text-gray-500">Descripción</Label>
                  <p className="text-sm">{selectedWork.description}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedWork._count?.documents || 0}</div>
                  <div className="text-xs text-gray-500">Documentos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedWork._count?.tasks || 0}</div>
                  <div className="text-xs text-gray-500">Tareas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedWork._count?.updates || 0}</div>
                  <div className="text-xs text-gray-500">Actualizaciones</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WorksPage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <WorksContent />
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
