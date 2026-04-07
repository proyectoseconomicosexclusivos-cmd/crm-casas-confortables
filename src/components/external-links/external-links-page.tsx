'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Calculator,
  Wrench,
  BookOpen,
  MoreHorizontal,
  Plus,
  ExternalLink as ExternalLinkIcon,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { isAdmin } from '@/lib/permissions';

// Types
interface ExternalLink {
  id: string;
  name: string;
  description: string | null;
  url: string;
  category: string;
  visibleToRoles: string | null;
  isPublic: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LinkFormData {
  name: string;
  url: string;
  description: string;
  category: string;
  isPublic: boolean;
  visibleToRoles: string[];
  order: number;
  isActive: boolean;
}

// Category configuration
const CATEGORIES = {
  calculator: { label: 'Calculadoras', icon: Calculator, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
  tool: { label: 'Herramientas', icon: Wrench, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  resource: { label: 'Recursos', icon: BookOpen, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  other: { label: 'Otros', icon: MoreHorizontal, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20' },
};

// Roles available
const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'TEAM_LEADER', label: 'Jefe de Equipo' },
  { value: 'COMMERCIAL', label: 'Comercial' },
  { value: 'FRANCHISE', label: 'Franquicia' },
  { value: 'REAL_ESTATE', label: 'Inmobiliaria' },
  { value: 'SUBCONTRACTOR', label: 'Subcontratista' },
  { value: 'WORKER', label: 'Trabajador' },
  { value: 'CLIENT', label: 'Cliente' },
];

const initialFormData: LinkFormData = {
  name: '',
  url: '',
  description: '',
  category: 'calculator',
  isPublic: false,
  visibleToRoles: [],
  order: 0,
  isActive: true,
};

export function ExternalLinksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ExternalLink | null>(null);
  const [formData, setFormData] = useState<LinkFormData>(initialFormData);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    calculator: 0,
    tool: 0,
    resource: 0,
    other: 0,
  });

  const canManage = user?.role ? isAdmin(user.role) : false;

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all') {
        params.append('category', activeCategory);
      }

      const response = await fetch(`/api/external-links?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLinks(data.data);
        setCategoryCounts(data.categories);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar enlaces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [activeCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedLink ? `/api/external-links/${selectedLink.id}` : '/api/external-links';
      const method = selectedLink ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: selectedLink ? 'Actualizado' : 'Creado',
          description: `Enlace ${selectedLink ? 'actualizado' : 'creado'} correctamente`,
        });
        setShowForm(false);
        setSelectedLink(null);
        setFormData(initialFormData);
        fetchLinks();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar enlace',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar enlace',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (link: ExternalLink) => {
    setSelectedLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || '',
      category: link.category,
      isPublic: link.isPublic,
      visibleToRoles: link.visibleToRoles ? JSON.parse(link.visibleToRoles) : [],
      order: link.order,
      isActive: link.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (link: ExternalLink) => {
    if (!confirm(`¿Está seguro de eliminar el enlace "${link.name}"?`)) return;

    try {
      const response = await fetch(`/api/external-links/${link.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Eliminado', description: 'Enlace eliminado correctamente' });
        fetchLinks();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar enlace',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (link: ExternalLink) => {
    try {
      const response = await fetch(`/api/external-links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: link.isActive ? 'Desactivado' : 'Activado',
          description: `Enlace ${link.isActive ? 'desactivado' : 'activado'} correctamente`,
        });
        fetchLinks();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cambiar estado',
        variant: 'destructive',
      });
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.other;
    return <cat.icon className={`w-5 h-5 ${cat.color}`} />;
  };

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.other;
    return (
      <Badge variant="secondary" className={`${cat.bgColor} ${cat.color} border-0`}>
        {cat.label}
      </Badge>
    );
  };

  const filteredLinks = activeCategory === 'all' 
    ? links 
    : links.filter(l => l.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enlaces Externos
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Accesos directos a calculadoras, herramientas y recursos útiles
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { setSelectedLink(null); setFormData(initialFormData); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Enlace
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Todos
            <Badge variant="secondary" className="ml-2">
              {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
            </Badge>
          </TabsTrigger>
          {Object.entries(CATEGORIES).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <config.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.label}</span>
              <Badge variant="secondary" className="ml-1">
                {categoryCounts[key] || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Links Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ExternalLinkIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No hay enlaces disponibles en esta categoría
            </p>
            {canManage && (
              <Button variant="outline" className="mt-4" onClick={() => { setFormData({ ...initialFormData, category: activeCategory !== 'all' ? activeCategory : 'calculator' }); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir primer enlace
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <Card key={link.id} className={`group hover:shadow-md transition-shadow ${!link.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${CATEGORIES[link.category as keyof typeof CATEGORIES]?.bgColor || 'bg-gray-100'}`}>
                      {getCategoryIcon(link.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{link.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getCategoryBadge(link.category)}
                        {link.isPublic ? (
                          <Globe className="w-3.5 h-3.5 text-green-500" title="Público" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-gray-400" title="Restringido" />
                        )}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenLink(link.url)}>
                          <ExternalLinkIcon className="w-4 h-4 mr-2" />
                          Abrir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(link)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleActive(link)}>
                          {link.isActive ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(link)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {link.description && (
                  <CardDescription className="mb-4 line-clamp-2">
                    {link.description}
                  </CardDescription>
                )}
                <Button 
                  className="w-full" 
                  onClick={() => handleOpenLink(link.url)}
                  disabled={!link.isActive}
                >
                  <ExternalLinkIcon className="w-4 h-4 mr-2" />
                  Abrir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedLink ? 'Editar Enlace' : 'Nuevo Enlace'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del enlace"
                required
              />
            </div>

            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://ejemplo.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción breve del enlace"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-4 pt-2 border-t">
              <Label className="text-base">Visibilidad</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Enlace público</Label>
                  <p className="text-sm text-gray-500">
                    Visible para todos los usuarios
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked, visibleToRoles: checked ? [] : formData.visibleToRoles })}
                />
              </div>

              {!formData.isPublic && (
                <div>
                  <Label>Roles con acceso</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {ROLES.map((role) => (
                      <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.visibleToRoles.includes(role.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, visibleToRoles: [...formData.visibleToRoles, role.value] });
                            } else {
                              setFormData({ ...formData, visibleToRoles: formData.visibleToRoles.filter(r => r !== role.value) });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Activo</Label>
                <p className="text-sm text-gray-500">
                  El enlace estará disponible para los usuarios
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedLink ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
