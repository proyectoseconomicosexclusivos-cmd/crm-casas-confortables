'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  FileText,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  History,
  Image,
  Book,
  BookOpen,
  Presentation,
  Calculator,
  FileCheck,
  Award,
  Receipt,
  CreditCard,
  File,
  FileSpreadsheet,
  Folder,
  X,
  Loader2,
  Grid,
  List,
  Filter,
  Check,
  Users,
  Globe,
  Lock,
  Tag,
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
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DocumentCategory,
  DocumentLibraryItem,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_COLORS,
  DOCUMENT_CATEGORY_ICONS,
  UserRole,
  ROLE_LABELS,
} from '@/types';

// Icon mapping
const iconMap: Record<string, any> = {
  FileSpreadsheet,
  Image,
  Book,
  BookOpen,
  FileText,
  Presentation,
  Calculator,
  FileCheck,
  Award,
  Receipt,
  CreditCard,
  File,
};

interface DocumentFormData {
  name: string;
  description: string;
  category: DocumentCategory;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  tags: string;
  isPublic: boolean;
  visibleToRoles: string[];
}

const initialFormData: DocumentFormData = {
  name: '',
  description: '',
  category: 'OTHER',
  fileName: '',
  filePath: '',
  fileSize: 0,
  mimeType: '',
  tags: '',
  isPublic: false,
  visibleToRoles: [],
};

const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'TEAM_LEADER',
  'ARCHITECT',
  'COMMERCIAL',
  'FRANCHISE',
  'REAL_ESTATE',
  'SUBCONTRACTOR',
  'WORKER',
  'CLIENT',
];

export function DocumentLibraryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentLibraryItem | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    totalDownloads: 0,
    byCategory: {} as Record<string, number>,
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (search) params.append('search', search);

      const response = await fetch(`/api/document-library?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar documentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, search]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/document-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags || null,
          visibleToRoles: formData.visibleToRoles.length > 0 ? JSON.stringify(formData.visibleToRoles) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Documento subido correctamente',
        });
        setShowUploadDialog(false);
        setFormData(initialFormData);
        fetchDocuments();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al subir documento',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    try {
      const response = await fetch(`/api/document-library/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Eliminado', description: 'Documento eliminado correctamente' });
        fetchDocuments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar documento',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async (doc: DocumentLibraryItem) => {
    try {
      const response = await fetch(`/api/document-library/${doc.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedDocument(data.data);
        setShowPreviewDialog(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar documento',
        variant: 'destructive',
      });
    }
  };

  const handleViewVersions = async (doc: DocumentLibraryItem) => {
    try {
      const response = await fetch(`/api/document-library/${doc.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedDocument(data.data);
        setShowVersionDialog(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar versiones',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (doc: DocumentLibraryItem) => {
    window.open(doc.filePath, '_blank');
  };

  const handleUploadNewVersion = (doc: DocumentLibraryItem) => {
    setFormData({
      ...initialFormData,
      name: doc.name,
      category: doc.category,
      description: doc.description || '',
    });
    setSelectedDocument(doc);
    setShowVersionDialog(false);
    setShowUploadDialog(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (category: DocumentCategory) => {
    const iconName = DOCUMENT_CATEGORY_ICONS[category];
    return iconMap[iconName] || File;
  };

  const categories: DocumentCategory[] = [
    'FLYER',
    'LOGO',
    'CATALOG',
    'MANUAL',
    'TEMPLATE',
    'PRESENTATION',
    'BUDGET_TEMPLATE',
    'CONTRACT_TEMPLATE',
    'CERTIFICATE',
    'INVOICE',
    'RECEIPT',
    'OTHER',
  ];

  const getCategoryCount = (category: DocumentCategory) => {
    return stats.byCategory[category] || 0;
  };

  const isImageFile = (mimeType?: string) => {
    return mimeType?.startsWith('image/');
  };

  const isPdfFile = (mimeType?: string) => {
    return mimeType === 'application/pdf';
  };

  const getFileThumbnail = (doc: DocumentLibraryItem) => {
    if (isImageFile(doc.mimeType)) {
      return (
        <img
          src={doc.filePath}
          alt={doc.name}
          className="w-full h-full object-cover"
        />
      );
    }
    
    const Icon = getCategoryIcon(doc.category);
    const colorClass = DOCUMENT_CATEGORY_COLORS[doc.category];
    
    return (
      <div className={`w-full h-full flex items-center justify-center ${colorClass} bg-opacity-20`}>
        <Icon className="w-12 h-12 text-gray-600 dark:text-gray-300" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Biblioteca de Documentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestión centralizada de documentos y plantillas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button onClick={() => { setSelectedDocument(null); setFormData(initialFormData); setShowUploadDialog(true); }}>
            <Upload className="w-4 h-4 mr-2" />
            Subir Documento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Folder className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Documentos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalDownloads}</div>
                <div className="text-sm text-gray-500">Descargas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-sm text-gray-500">Categorías</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Globe className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {documents.filter(d => d.isPublic).length}
                </div>
                <div className="text-sm text-gray-500">Públicos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedCategory === 'ALL' ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => setSelectedCategory('ALL')}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                <Folder className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <div className="font-medium text-sm">Todos</div>
                <div className="text-xs text-gray-500">{stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {categories.map((category) => {
          const Icon = getCategoryIcon(category);
          const count = getCategoryCount(category);
          return (
            <Card
              key={category}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === category ? 'ring-2 ring-emerald-500' : ''
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 ${DOCUMENT_CATEGORY_COLORS[category]} rounded bg-opacity-20`}>
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {DOCUMENT_CATEGORY_LABELS[category].split(' ')[0]}
                    </div>
                    <div className="text-xs text-gray-500">{count}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar documentos por nombre, descripción o tags..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No hay documentos
            </h3>
            <p className="text-gray-500 mt-2">
              Sube tu primer documento a la biblioteca
            </p>
            <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="group cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div
                className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800"
                onClick={() => handlePreview(doc)}
              >
                {getFileThumbnail(doc)}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                {doc.isPublic && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-gray-800/90">
                      <Globe className="w-3 h-3 mr-1" />
                      Público
                    </Badge>
                  </div>
                )}
                {doc.version > 1 && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-gray-800/90">
                      v{doc.version}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm truncate" title={doc.name}>
                  {doc.name}
                </h4>
                <p className="text-xs text-gray-500 truncate mt-1" title={doc.fileName}>
                  {doc.fileName}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    {DOCUMENT_CATEGORY_LABELS[doc.category].split(' ')[0]}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {formatFileSize(doc.fileSize)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {documents.map((doc) => {
                const Icon = getCategoryIcon(doc.category);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      {isImageFile(doc.mimeType) ? (
                        <img src={doc.filePath} alt={doc.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{doc.name}</h4>
                        {doc.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Público
                          </Badge>
                        )}
                        {doc.version > 1 && (
                          <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{doc.fileName}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {DOCUMENT_CATEGORY_LABELS[doc.category]}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handlePreview(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewVersions(doc)}>
                            <History className="w-4 h-4 mr-2" />
                            Ver Versiones
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUploadNewVersion(doc)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Nueva Versión
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? 'Subir Nueva Versión' : 'Subir Documento'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos para subir un documento a la biblioteca
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Datos Básicos</TabsTrigger>
                <TabsTrigger value="file">Archivo</TabsTrigger>
                <TabsTrigger value="visibility">Visibilidad</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del documento"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as DocumentCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {DOCUMENT_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción opcional del documento"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separar tags con comas</p>
                </div>
              </TabsContent>

              <TabsContent value="file" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="fileName">Nombre del Archivo *</Label>
                  <Input
                    id="fileName"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    placeholder="documento.pdf"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="filePath">Ruta del Archivo *</Label>
                  <Input
                    id="filePath"
                    value={formData.filePath}
                    onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                    placeholder="/uploads/documento.pdf"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fileSize">Tamaño (bytes)</Label>
                    <Input
                      id="fileSize"
                      type="number"
                      value={formData.fileSize || ''}
                      onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })}
                      placeholder="1024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mimeType">Tipo MIME</Label>
                    <Input
                      id="mimeType"
                      value={formData.mimeType}
                      onChange={(e) => setFormData({ ...formData, mimeType: e.target.value })}
                      placeholder="application/pdf"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Nota:</strong> En producción, aquí se implementaría la subida real del archivo.
                    Por ahora, ingrese la ruta del archivo manualmente.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="visibility" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublic">Documento Público</Label>
                    <p className="text-sm text-gray-500">
                      Los documentos públicos son visibles para todos los usuarios
                    </p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  />
                </div>

                <Separator />

                <div>
                  <Label>Visible para Roles</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Si no es público, seleccione qué roles pueden ver este documento
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_ROLES.map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={role}
                          checked={formData.visibleToRoles.includes(role)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                visibleToRoles: [...formData.visibleToRoles, role],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                visibleToRoles: formData.visibleToRoles.filter((r) => r !== role),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={role} className="text-sm font-normal">
                          {ROLE_LABELS[role]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {selectedDocument ? 'Subir Nueva Versión' : 'Subir Documento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              {DOCUMENT_CATEGORY_LABELS[selectedDocument?.category || 'OTHER']}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {isImageFile(selectedDocument.mimeType) ? (
                  <img
                    src={selectedDocument.filePath}
                    alt={selectedDocument.name}
                    className="w-full h-full object-contain"
                  />
                ) : isPdfFile(selectedDocument.mimeType) ? (
                  <iframe
                    src={selectedDocument.filePath}
                    className="w-full h-full"
                    title={selectedDocument.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      {(() => {
                        const Icon = getCategoryIcon(selectedDocument.category);
                        return <Icon className="w-16 h-16 mx-auto text-gray-400 mb-4" />;
                      })()}
                      <p className="text-gray-500">Vista previa no disponible</p>
                      <Button className="mt-4" onClick={() => handleDownload(selectedDocument)}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Archivo
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Archivo:</span>
                  <p className="font-medium">{selectedDocument.fileName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tamaño:</span>
                  <p className="font-medium">{formatFileSize(selectedDocument.fileSize)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Versión:</span>
                  <p className="font-medium">{selectedDocument.version}</p>
                </div>
                <div>
                  <span className="text-gray-500">Descargas:</span>
                  <p className="font-medium">{selectedDocument.downloadCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Visibilidad:</span>
                  <p className="font-medium flex items-center gap-1">
                    {selectedDocument.isPublic ? (
                      <>
                        <Globe className="w-4 h-4" />
                        Público
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Restringido
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Subido por:</span>
                  <p className="font-medium">
                    {selectedDocument.uploadedBy?.name} {selectedDocument.uploadedBy?.lastName}
                  </p>
                </div>
              </div>

              {selectedDocument.description && (
                <div>
                  <span className="text-gray-500 text-sm">Descripción:</span>
                  <p className="mt-1">{selectedDocument.description}</p>
                </div>
              )}

              {selectedDocument.tags && (
                <div>
                  <span className="text-gray-500 text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {JSON.parse(selectedDocument.tags).map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cerrar
            </Button>
            {selectedDocument && (
              <>
                <Button variant="outline" onClick={() => handleViewVersions(selectedDocument)}>
                  <History className="w-4 h-4 mr-2" />
                  Versiones
                </Button>
                <Button onClick={() => handleDownload(selectedDocument)}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Historial de Versiones</DialogTitle>
            <DialogDescription>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Current version */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {selectedDocument?.version}
                  </div>
                  <div>
                    <p className="font-medium">Versión Actual</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedDocument?.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge>Actual</Badge>
              </div>
            </div>

            {/* Previous versions */}
            {selectedDocument?.previousVersions?.map((v: any) => (
              <div key={v.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {v.version}
                    </div>
                    <div>
                      <p className="font-medium">{v.fileName}</p>
                      <p className="text-xs text-gray-500">{formatDate(v.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(!selectedDocument?.previousVersions || selectedDocument.previousVersions.length === 0) && (
              <p className="text-center text-gray-500 py-4">
                No hay versiones anteriores
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => selectedDocument && handleUploadNewVersion(selectedDocument)}>
              <Upload className="w-4 h-4 mr-2" />
              Nueva Versión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
