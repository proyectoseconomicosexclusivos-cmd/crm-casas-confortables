'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  MERCH_CATEGORY_LABELS,
  MerchProduct,
  MerchCategory,
} from '@/types';

interface MerchFormData {
  name: string;
  sku: string;
  reference: string;
  description: string;
  category: MerchCategory;
  unit: string;
  costPrice: string;
  wholesalePrice: string;
  retailPrice: string;
  stockQuantity: string;
  visibleToRealEstate: boolean;
  visibleToPartners: boolean;
  visibleToFranchises: boolean;
  customizable: boolean;
}

const initialFormData: MerchFormData = {
  name: '',
  sku: '',
  reference: '',
  description: '',
  category: 'BRANDED',
  unit: 'unidad',
  costPrice: '',
  wholesalePrice: '',
  retailPrice: '',
  stockQuantity: '0',
  visibleToRealEstate: true,
  visibleToPartners: true,
  visibleToFranchises: true,
  customizable: false,
};

export function MerchCatalog() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null);
  const [formData, setFormData] = useState<MerchFormData>(initialFormData);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/merch?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar productos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, pagination.page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedProduct ? `/api/merch/${selectedProduct.id}` : '/api/merch';
      const method = selectedProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: selectedProduct ? 'Actualizado' : 'Creado',
          description: `Producto ${selectedProduct ? 'actualizado' : 'creado'} correctamente`,
        });
        setShowForm(false);
        setSelectedProduct(null);
        setFormData(initialFormData);
        fetchProducts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar producto',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: MerchProduct) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      reference: product.reference || '',
      description: product.description || '',
      category: product.category as MerchCategory,
      unit: product.unit,
      costPrice: product.costPrice?.toString() || '',
      wholesalePrice: product.wholesalePrice?.toString() || '',
      retailPrice: product.retailPrice?.toString() || '',
      stockQuantity: product.stockQuantity.toString(),
      visibleToRealEstate: product.visibleToRealEstate,
      visibleToPartners: product.visibleToPartners,
      visibleToFranchises: product.visibleToFranchises,
      customizable: product.customizable,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;

    try {
      const response = await fetch(`/api/merch/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Eliminado', description: 'Producto eliminado correctamente' });
        fetchProducts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar producto',
        variant: 'destructive',
      });
    }
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
            Catálogo de Merchandising
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Productos para inmobiliarias y colaboradores
          </p>
        </div>
        <Button onClick={() => { setSelectedProduct(null); setFormData(initialFormData); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, SKU..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {Object.entries(MERCH_CATEGORY_LABELS).map(([key, label]) => (
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
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio Mayorista</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Visibilidad</TableHead>
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
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        {product.customizable && (
                          <Badge variant="outline" className="text-xs mt-1">Personalizable</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {MERCH_CATEGORY_LABELS[product.category as MerchCategory]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(product.wholesalePrice)}</TableCell>
                      <TableCell>{formatPrice(product.retailPrice)}</TableCell>
                      <TableCell>{product.stockQuantity}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {product.visibleToRealEstate && (
                            <Badge variant="secondary" className="text-xs">Inmob.</Badge>
                          )}
                          {product.visibleToPartners && (
                            <Badge variant="secondary" className="text-xs">Socios</Badge>
                          )}
                          {product.visibleToFranchises && (
                            <Badge variant="secondary" className="text-xs">Franq.</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(product.id)}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference">Referencia</Label>
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

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as MerchCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MERCH_CATEGORY_LABELS).map(([key, label]) => (
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
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                <Label htmlFor="wholesalePrice">Precio Mayorista</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
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
            </div>

            <div>
              <Label htmlFor="stockQuantity">Stock</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Visibilidad</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.visibleToRealEstate}
                    onCheckedChange={(checked) => setFormData({ ...formData, visibleToRealEstate: checked })}
                  />
                  <Label className="font-normal">Inmobiliarias</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.visibleToPartners}
                    onCheckedChange={(checked) => setFormData({ ...formData, visibleToPartners: checked })}
                  />
                  <Label className="font-normal">Socios</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.visibleToFranchises}
                    onCheckedChange={(checked) => setFormData({ ...formData, visibleToFranchises: checked })}
                  />
                  <Label className="font-normal">Franquicias</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.customizable}
                onCheckedChange={(checked) => setFormData({ ...formData, customizable: checked })}
              />
              <Label className="font-normal">Personalizable</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedProduct ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
