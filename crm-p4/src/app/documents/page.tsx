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
import {
  FileText,
  Search,
  FileIcon,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  FileCheck,
  Upload,
  Download,
  Trash2,
  Loader2,
  Plus,
  Eye,
  HardHat,
  FolderKanban,
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description?: string;
  type: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string;
  createdAt: string;
  company?: { id: string; name: string };
  uploadedBy?: { id: string; name: string; lastName: string };
  lead?: { id: string; firstName: string; lastName: string };
  work?: { id: string; name: string };
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  CONTRACT: { label: 'Contrato', color: 'text-blue-700', bgColor: 'bg-blue-50', icon: FileCheck },
  BUDGET: { label: 'Presupuesto', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: FileSpreadsheet },
  INVOICE: { label: 'Factura', color: 'text-purple-700', bgColor: 'bg-purple-50', icon: FileText },
  CERTIFICATE: { label: 'Certificado', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: FileCheck },
  PHOTO: { label: 'Foto', color: 'text-pink-700', bgColor: 'bg-pink-50', icon: FileImage },
  VIDEO: { label: 'Video', color: 'text-red-700', bgColor: 'bg-red-50', icon: FileVideo },
  PLAN: { label: 'Plano', color: 'text-cyan-700', bgColor: 'bg-cyan-50', icon: FileText },
  OTHER: { label: 'Otro', color: 'text-gray-700', bgColor: 'bg-gray-50', icon: FileIcon },
};

function DocumentsContent() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [typeStats, setTypeStats] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'OTHER',
    fileName: '',
    filePath: '',
    fileSize: '',
    mimeType: '',
    leadId: '',
    workId: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, search]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
        setTypeStats(data.typeStats || {});
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileSize: formData.fileSize ? parseInt(formData.fileSize) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setFormData({
          name: '',
          description: '',
          type: 'OTHER',
          fileName: '',
          filePath: '',
          fileSize: '',
          mimeType: '',
          leadId: '',
          workId: '',
        });
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
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

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const totalDocuments = documents.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestión documental del sistema
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
              <DialogDescription>
                Complete los datos para subir un documento
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
                    placeholder="Nombre del documento"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONTRACT">Contrato</SelectItem>
                        <SelectItem value="BUDGET">Presupuesto</SelectItem>
                        <SelectItem value="INVOICE">Factura</SelectItem>
                        <SelectItem value="CERTIFICATE">Certificado</SelectItem>
                        <SelectItem value="PHOTO">Foto</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="PLAN">Plano</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fileName">Nombre Archivo *</Label>
                    <Input
                      id="fileName"
                      value={formData.fileName}
                      onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                      placeholder="documento.pdf"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
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
                  <div className="grid gap-2">
                    <Label htmlFor="leadId">ID Lead</Label>
                    <Input
                      id="leadId"
                      value={formData.leadId}
                      onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="workId">ID Obra</Label>
                    <Input
                      id="workId"
                      value={formData.workId}
                      onChange={(e) => setFormData({ ...formData, workId: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción opcional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Subir Documento
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalDocuments}</div>
                <div className="text-sm text-gray-500">Total Docs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{typeStats.CONTRACT || 0}</div>
                <div className="text-sm text-gray-500">Contratos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{typeStats.BUDGET || 0}</div>
                <div className="text-sm text-gray-500">Presupuestos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <FileImage className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{typeStats.PHOTO || 0}</div>
                <div className="text-sm text-gray-500">Fotos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{typeStats.INVOICE || 0}</div>
                <div className="text-sm text-gray-500">Facturas</div>
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
                placeholder="Buscar documentos..."
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
                <SelectItem value="CONTRACT">Contrato</SelectItem>
                <SelectItem value="BUDGET">Presupuesto</SelectItem>
                <SelectItem value="INVOICE">Factura</SelectItem>
                <SelectItem value="CERTIFICATE">Certificado</SelectItem>
                <SelectItem value="PHOTO">Foto</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="PLAN">Plano</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Listado de Documentos
          </CardTitle>
          <CardDescription>
            {documents.length} documento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron documentos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Relacionado con</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Subido por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const TypeIcon = TYPE_CONFIG[doc.type]?.icon || FileIcon;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${TYPE_CONFIG[doc.type]?.bgColor || 'bg-gray-50'} flex items-center justify-center`}>
                              <TypeIcon className={`w-5 h-5 ${TYPE_CONFIG[doc.type]?.color || 'text-gray-600'}`} />
                            </div>
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-xs text-gray-500">{doc.fileName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${TYPE_CONFIG[doc.type]?.bgColor} ${TYPE_CONFIG[doc.type]?.color}`}
                          >
                            {TYPE_CONFIG[doc.type]?.label || doc.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.work ? (
                            <div className="flex items-center gap-1 text-sm">
                              <HardHat className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[120px]">{doc.work.name}</span>
                            </div>
                          ) : doc.lead ? (
                            <div className="flex items-center gap-1 text-sm">
                              <FolderKanban className="w-3 h-3 text-gray-400" />
                              <span>{doc.lead.firstName} {doc.lead.lastName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatFileSize(doc.fileSize)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {doc.uploadedBy?.name} {doc.uploadedBy?.lastName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(doc.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.filePath, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <DocumentsContent />
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
