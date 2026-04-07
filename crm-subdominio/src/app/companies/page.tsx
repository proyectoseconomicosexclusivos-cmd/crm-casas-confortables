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
  Building2,
  Search,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  Loader2,
  Plus,
  Eye,
  HardHat,
  FolderKanban,
  User,
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  type: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    offices: number;
    leads: number;
    works: number;
  };
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  FRANCHISE: { label: 'Franquicia', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  REAL_ESTATE: { label: 'Inmobiliaria', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  SUBCONTRACTOR: { label: 'Subcontrata', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  PARTNER: { label: 'Socio', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  OWN: { label: 'Empresa propia', color: 'text-gray-700', bgColor: 'bg-gray-50' },
};

function CompaniesContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'FRANCHISE',
    taxId: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, [typeFilter, search]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/companies?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setFormData({
          name: '',
          type: 'FRANCHISE',
          taxId: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
        });
        fetchCompanies();
      }
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestión de franquicias, inmobiliarias, subcontratas y partners
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Empresa</DialogTitle>
              <DialogDescription>
                Complete los datos para registrar una nueva empresa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre de la empresa"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRANCHISE">Franquicia</SelectItem>
                        <SelectItem value="REAL_ESTATE">Inmobiliaria</SelectItem>
                        <SelectItem value="SUBCONTRACTOR">Subcontrata</SelectItem>
                        <SelectItem value="PARTNER">Socio</SelectItem>
                        <SelectItem value="OWN">Empresa propia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="taxId">CIF/NIF</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="B12345678"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@empresa.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+34 900 000 000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">Web</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.empresa.com"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, número, piso"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                  <div className="grid gap-2">
                    <Label htmlFor="postalCode">C.P.</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="28001"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Crear Empresa
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCompanies}</div>
                <div className="text-sm text-gray-500">Total Empresas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{activeCompanies}</div>
                <div className="text-sm text-gray-500">Activas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {companies.reduce((sum, c) => sum + (c._count?.users || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Usuarios</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <HardHat className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {companies.reduce((sum, c) => sum + (c._count?.works || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Obras</div>
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
                placeholder="Buscar empresas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="FRANCHISE">Franquicia</SelectItem>
                <SelectItem value="REAL_ESTATE">Inmobiliaria</SelectItem>
                <SelectItem value="SUBCONTRACTOR">Subcontrata</SelectItem>
                <SelectItem value="PARTNER">Socio</SelectItem>
                <SelectItem value="OWN">Empresa propia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Listado de Empresas
          </CardTitle>
          <CardDescription>
            {companies.length} empresa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron empresas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="w-8 h-8 rounded" />
                            ) : (
                              <Building2 className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.taxId && (
                              <div className="text-xs text-gray-500">CIF: {company.taxId}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${TYPE_CONFIG[company.type]?.bgColor} ${TYPE_CONFIG[company.type]?.color}`}
                        >
                          {TYPE_CONFIG[company.type]?.label || company.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {company.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {company.email}
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              {company.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.city || company.province ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {[company.city, company.province].filter(Boolean).join(', ')}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{company._count?.users || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            company.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-50 text-gray-500'
                          }
                        >
                          {company.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>Detalles de la empresa</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${TYPE_CONFIG[selectedCompany.type]?.bgColor} ${TYPE_CONFIG[selectedCompany.type]?.color}`}
                >
                  {TYPE_CONFIG[selectedCompany.type]?.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    selectedCompany.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-50 text-gray-500'
                  }
                >
                  {selectedCompany.isActive ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">CIF/NIF</Label>
                  <p>{selectedCompany.taxId || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Web</Label>
                  <p className="flex items-center gap-1">
                    {selectedCompany.website ? (
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Visitar
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Email</Label>
                  <p className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    {selectedCompany.email || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Teléfono</Label>
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {selectedCompany.phone || '-'}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Dirección</Label>
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {[selectedCompany.address, selectedCompany.postalCode, selectedCompany.city, selectedCompany.province]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCompany._count?.users || 0}</div>
                  <div className="text-xs text-gray-500">Usuarios</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCompany._count?.offices || 0}</div>
                  <div className="text-xs text-gray-500">Oficinas</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCompany._count?.leads || 0}</div>
                  <div className="text-xs text-gray-500">Leads</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCompany._count?.works || 0}</div>
                  <div className="text-xs text-gray-500">Obras</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <CompaniesContent />
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
