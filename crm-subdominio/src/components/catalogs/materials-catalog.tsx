'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  History,
  AlertTriangle,
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
  MATERIAL_TYPE_LABELS,
  MATERIAL_STATUS_LABELS,
  MaterialProduct,
  MaterialTypeEnum,
  MaterialStatus,
} from '@/types';

// Material form data type
interface MaterialFormData {
  name: string;
  sku: string;
  reference: string;
  brand: string;
  model: string;
  description: string;
  materialType: MaterialTypeEnum;
  unit: string;
  costPrice: string;
  retailPrice: string;
  contractorPrice: string;
  stockQuantity: string;
  minStock: string;
  status: MaterialStatus;
  supplierName: string;
  internalNotes: string;
}

const initialFormData: MaterialFormData = {
  name: '',
  sku: '',
  reference: '',
  brand: '',
  model: '',
  description: '',
  materialType: 'FINISHES',
  unit: 'unidad',
  costPrice: '',
  retailPrice: '',
  contractorPrice: '',
  stockQuantity: '0',
  minStock: '',
  status: 'ACTIVE',
  supplierName: '',
  internalNotes: '',
};

export function MaterialsCatalog() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialProduct | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>(initialFormData);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/materials?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMaterials(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar materiales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [search, typeFilter, statusFilter, pagination.page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedMaterial ? `/api/materials/${selectedMaterial.id}` : '/api/materials';
      const method = selectedMaterial ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: selectedMaterial ? 'Actualizado' : 'Creado',
          description: `Material ${selectedMaterial ? 'actualizado' : 'creado'} correctamente`,
        });
        setShowForm(false);
        setSelectedMaterial(null);
        setFormData(initialFormData);
        fetchMaterials();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar material',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (material: MaterialProduct) => {
    setSelectedMaterial(material);
    setFormData({
      name: material.name,
      sku: material.sku || '',
      reference: material.reference || '',
      brand: material.brand || '',
      model: material.model || '',
      description: material.description || '',
      materialType: material.materialType as MaterialTypeEnum,
      unit: material.unit,
      costPrice: material.costPrice?.toString() || '',
      retailPrice: material.retailPrice?.toString() || '',
      contractorPrice: material.contractorPrice?.toString() || '',
      stockQuantity: material.stockQuantity.toString(),
      minStock: material.minStock?.toString() || '',
      status: material.status as MaterialStatus,
      supplierName: material.supplierName || '',
      internalNotes: material.internalNotes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este material?')) return;

    try {
      const response = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Eliminado', description: 'Material eliminado correctamente' });
        fetchMaterials();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar material',
        variant: 'destructive',
      });
    }
  };

  const handleViewPriceHistory = async (material: MaterialProduct) => {
    try {
      const response = await fetch(`/api/materials/${material.id}`);
      const data = await response.json();
      if (data.success) {
        setPriceHistory(data.data.priceHistory || []);
        setSelectedMaterial(data.data);
        setShowPriceHistory(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar historial de precios',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: MaterialStatus) => {
    const colors: Record<MaterialStatus, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      DISCONTINUED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      OUT_OF_STOCK: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      LIMITED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    };
    return (
      <Badge className={colors[status]}>
        {MATERIAL_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Catálogo de Materiales
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestiona el catálogo de materiales y acabados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar PDF
          </Button>
          <Button onClick={() => { setSelectedMaterial(null); setFormData(initialFormData); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Material
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, SKU, referencia..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(MATERIAL_STATUS_LABELS).map(([key, label]) => (
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron materiales
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-mono text-sm">{material.sku || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{material.name}</div>
                          {material.brand && (
                            <div className="text-sm text-gray-500">{material.brand}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {MATERIAL_TYPE_LABELS[material.materialType as MaterialTypeEnum]}
                        </Badge>
                      </TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(material.retailPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={material.stockQuantity <= (material.minStock || 0) ? 'text-red-600' : ''}>
                            {material.stockQuantity}
                          </span>
                          {material.stockQuantity <= (material.minStock || 0) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(material.status as MaterialStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPriceHistory(material)}>
                              <History className="w-4 h-4 mr-2" />
                              Historial de Precios
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(material)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(material.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMaterial ? 'Editar Material' : 'Nuevo Material'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Datos Básicos</TabsTrigger>
                <TabsTrigger value="pricing">Precios</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU / Código Interno</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference">Referencia Proveedor</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="materialType">Tipo de Material</Label>
                    <Select
                      value={formData.materialType}
                      onValueChange={(value) => setFormData({ ...formData, materialType: value as MaterialTypeEnum })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit">Unidad</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">Unidad</SelectItem>
                        <SelectItem value="m">Metro</SelectItem>
                        <SelectItem value="m2">Metro cuadrado</SelectItem>
                        <SelectItem value="m3">Metro cúbico</SelectItem>
                        <SelectItem value="kg">Kilogramo</SelectItem>
                        <SelectItem value="litro">Litro</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="costPrice">Precio Coste</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retailPrice">Precio Venta (PVP)</Label>
                    <Input
                      id="retailPrice"
                      type="number"
                      step="0.01"
                      value={formData.retailPrice}
                      onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractorPrice">Precio Subcontrata</Label>
                    <Input
                      id="contractorPrice"
                      type="number"
                      step="0.01"
                      value={formData.contractorPrice}
                      onChange={(e) => setFormData({ ...formData, contractorPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplierName">Proveedor</Label>
                  <Input
                    id="supplierName"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stockQuantity">Stock Actual</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      step="0.01"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Stock Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      step="0.01"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as MaterialStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MATERIAL_STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="internalNotes">Notas Internas</Label>
                  <Textarea
                    id="internalNotes"
                    value={formData.internalNotes}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedMaterial ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={showPriceHistory} onOpenChange={setShowPriceHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de Precios</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {selectedMaterial?.name}
            </p>
            {priceHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No hay historial de precios disponible
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Coste</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead>Subcontrata</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>{formatPrice(entry.costPrice)}</TableCell>
                      <TableCell>{formatPrice(entry.retailPrice)}</TableCell>
                      <TableCell>{formatPrice(entry.contractorPrice)}</TableCell>
                      <TableCell>{entry.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
