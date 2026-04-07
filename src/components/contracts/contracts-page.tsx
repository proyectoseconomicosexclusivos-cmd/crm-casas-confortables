'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  Building2,
  User,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCcw,
  MoreVertical,
  Send,
  FileSignature,
  XCircle,
  ArrowRight,
  Building,
  Users,
  Briefcase,
  Handshake,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Contract,
  ContractType,
  MainContractStatus,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_TYPE_COLORS,
} from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// Datos de ejemplo para desarrollo
const mockContracts: Contract[] = [
  {
    id: '1',
    companyId: '1',
    type: 'CLIENT',
    number: 'CNT-2024-0001',
    partyType: 'client',
    partyName: 'Juan García López',
    partyTaxId: '12345678A',
    partyAddress: 'Calle Mayor 10, Madrid',
    partyPhone: '+34 612 345 678',
    partyEmail: 'juan.garcia@email.com',
    title: 'Contrato de Obra Nueva - Vivienda Unifamiliar',
    description: 'Construcción de vivienda unifamiliar de 200m² en parcela',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-15'),
    totalAmount: 285000,
    currency: 'EUR',
    status: 'ACTIVE',
    signedByParty: true,
    signedByCompany: true,
    signedByPartyAt: new Date('2024-01-10'),
    signedByCompanyAt: new Date('2024-01-12'),
    autoRenew: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    companyId: '1',
    type: 'SUBCONTRACTOR',
    number: 'CNT-2024-0002',
    partyType: 'subcontractor',
    partyName: 'Electricidad Martín S.L.',
    partyTaxId: 'B87654321',
    partyAddress: 'Polígono Industrial Norte, Nave 5',
    partyPhone: '+34 912 345 678',
    partyEmail: 'info@electricidadmartin.com',
    title: 'Contrato de Instalaciones Eléctricas',
    description: 'Instalación eléctrica completa para obra',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-06-30'),
    totalAmount: 25000,
    currency: 'EUR',
    status: 'ACTIVE',
    signedByParty: true,
    signedByCompany: true,
    signedByPartyAt: new Date('2024-01-28'),
    signedByCompanyAt: new Date('2024-01-30'),
    autoRenew: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    companyId: '1',
    type: 'REAL_ESTATE',
    number: 'CNT-2024-0003',
    partyType: 'real_estate',
    partyName: 'Inmobiliaria Premium',
    partyTaxId: 'B11223344',
    partyAddress: 'Av. Principal 100, Valencia',
    partyPhone: '+34 963 456 789',
    partyEmail: 'contratos@inmobiliariapremium.com',
    title: 'Convenio de Colaboración Comercial',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-02-28'),
    totalAmount: 0,
    currency: 'EUR',
    status: 'PENDING_SIGN',
    signedByParty: false,
    signedByCompany: false,
    autoRenew: true,
    renewalPeriod: 12,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: '4',
    companyId: '1',
    type: 'PARTNER',
    number: 'CNT-2024-0004',
    partyType: 'partner',
    partyName: 'Arquitectos Asociados',
    partyTaxId: 'B55443322',
    partyAddress: 'Calle Diseño 25, Barcelona',
    partyPhone: '+34 934 567 890',
    partyEmail: 'proyectos@arquitectosasociados.es',
    title: 'Acuerdo de Colaboración Profesional',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    totalAmount: 0,
    currency: 'EUR',
    status: 'ACTIVE',
    signedByParty: true,
    signedByCompany: true,
    signedByPartyAt: new Date('2023-12-20'),
    signedByCompanyAt: new Date('2023-12-22'),
    autoRenew: true,
    renewalPeriod: 12,
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    companyId: '1',
    type: 'CLIENT',
    number: 'CNT-2024-0005',
    partyType: 'client',
    partyName: 'María Fernández Ruiz',
    partyTaxId: '98765432B',
    partyPhone: '+34 623 456 789',
    title: 'Contrato de Reforma Integral',
    description: 'Reforma integral de piso de 90m²',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-07-31'),
    totalAmount: 45000,
    currency: 'EUR',
    status: 'DRAFT',
    signedByParty: false,
    signedByCompany: false,
    autoRenew: false,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '6',
    companyId: '1',
    type: 'SUBCONTRACTOR',
    number: 'CNT-2023-0045',
    partyType: 'subcontractor',
    partyName: 'Fontanería García',
    partyTaxId: 'B66778899',
    title: 'Instalación de Fontanería',
    startDate: new Date('2023-06-01'),
    endDate: new Date('2023-09-30'),
    totalAmount: 18000,
    currency: 'EUR',
    status: 'COMPLETED',
    signedByParty: true,
    signedByCompany: true,
    signedByPartyAt: new Date('2023-05-28'),
    signedByCompanyAt: new Date('2023-05-30'),
    autoRenew: false,
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2023-10-05'),
  },
];

// Stats card component
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', color)}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Contract form component
interface ContractFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Contract | null;
  leads?: any[];
  works?: any[];
}

function ContractForm({ onSubmit, onCancel, initialData, leads = [], works = [] }: ContractFormProps) {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'CLIENT',
    title: initialData?.title || '',
    partyName: initialData?.partyName || '',
    partyTaxId: initialData?.partyTaxId || '',
    partyAddress: initialData?.partyAddress || '',
    partyPhone: initialData?.partyPhone || '',
    partyEmail: initialData?.partyEmail || '',
    workId: initialData?.workId || '',
    leadId: initialData?.leadId || '',
    startDate: initialData?.startDate ? format(new Date(initialData.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: initialData?.endDate ? format(new Date(initialData.endDate), 'yyyy-MM-dd') : '',
    totalAmount: initialData?.totalAmount || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    autoRenew: initialData?.autoRenew || false,
    renewalPeriod: initialData?.renewalPeriod || 12,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de contrato */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Contrato *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONTRACT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">Título del Contrato *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Contrato de Obra Nueva"
            required
          />
        </div>
      </div>

      <Separator />

      {/* Datos de la otra parte */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Datos de la Parte Contratante
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="partyName">Nombre / Razón Social *</Label>
            <Input
              id="partyName"
              value={formData.partyName}
              onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
              placeholder="Nombre completo o empresa"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partyTaxId">CIF/NIF</Label>
            <Input
              id="partyTaxId"
              value={formData.partyTaxId}
              onChange={(e) => setFormData({ ...formData, partyTaxId: e.target.value })}
              placeholder="B12345678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partyPhone">Teléfono</Label>
            <Input
              id="partyPhone"
              value={formData.partyPhone}
              onChange={(e) => setFormData({ ...formData, partyPhone: e.target.value })}
              placeholder="+34 612 345 678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partyEmail">Email</Label>
            <Input
              id="partyEmail"
              type="email"
              value={formData.partyEmail}
              onChange={(e) => setFormData({ ...formData, partyEmail: e.target.value })}
              placeholder="email@ejemplo.com"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="partyAddress">Dirección</Label>
            <Input
              id="partyAddress"
              value={formData.partyAddress}
              onChange={(e) => setFormData({ ...formData, partyAddress: e.target.value })}
              placeholder="Calle, número, ciudad"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Relación con obra/lead */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workId">Obra Relacionada</Label>
          <Select
            value={formData.workId}
            onValueChange={(value) => setFormData({ ...formData, workId: value, leadId: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin obra asociada</SelectItem>
              {works.map((work) => (
                <SelectItem key={work.id} value={work.id}>
                  {work.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="leadId">Lead Relacionado</Label>
          <Select
            value={formData.leadId}
            onValueChange={(value) => setFormData({ ...formData, leadId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin lead asociado</SelectItem>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.firstName} {lead.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Fechas e importe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Fecha de Inicio *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Fecha de Fin</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalAmount">Importe Total (€)</Label>
          <Input
            id="totalAmount"
            type="number"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Descripción y notas */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción del contrato..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notas Internas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notas visibles solo internamente..."
            rows={2}
          />
        </div>
      </div>

      {/* Renovación automática */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.autoRenew}
            onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">Renovación Automática</span>
        </label>
        {formData.autoRenew && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">cada</span>
            <Select
              value={formData.renewalPeriod.toString()}
              onValueChange={(value) => setFormData({ ...formData, renewalPeriod: parseInt(value) })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
                <SelectItem value="24">24 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Actualizar' : 'Crear'} Contrato
        </Button>
      </DialogFooter>
    </form>
  );
}

// Contract detail dialog
interface ContractDetailProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (contract: Contract) => void;
  onStatusChange: (id: string, status: MainContractStatus) => void;
  onSign: (id: string, type: 'party' | 'company') => void;
  onDelete: (id: string) => void;
}

function ContractDetail({ contract, open, onOpenChange, onEdit, onStatusChange, onSign, onDelete }: ContractDetailProps) {
  if (!contract) return null;

  const formatCurrency = (value: number | undefined | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getStatusActions = () => {
    const actions: { label: string; status: MainContractStatus; icon: React.ReactNode }[] = [];
    
    switch (contract.status) {
      case 'DRAFT':
        actions.push({
          label: 'Enviar a Firma',
          status: 'PENDING_SIGN',
          icon: <Send className="w-4 h-4" />,
        });
        break;
      case 'PENDING_SIGN':
        if (contract.signedByParty && contract.signedByCompany) {
          actions.push({
            label: 'Activar',
            status: 'ACTIVE',
            icon: <CheckCircle className="w-4 h-4" />,
          });
        }
        break;
      case 'ACTIVE':
        actions.push({
          label: 'Completar',
          status: 'COMPLETED',
          icon: <CheckCircle className="w-4 h-4" />,
        });
        actions.push({
          label: 'Cancelar',
          status: 'CANCELLED',
          icon: <XCircle className="w-4 h-4" />,
        });
        break;
    }

    return actions;
  };

  const isExpiringSoon = contract.endDate && 
    contract.status === 'ACTIVE' && 
    differenceInDays(new Date(contract.endDate), new Date()) <= 30 &&
    differenceInDays(new Date(contract.endDate), new Date()) > 0;

  const isExpired = contract.endDate && 
    contract.status === 'ACTIVE' && 
    isBefore(new Date(contract.endDate), new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{contract.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="font-mono">{contract.number}</span>
                <Badge variant="outline">{CONTRACT_TYPE_LABELS[contract.type]}</Badge>
                <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                  {CONTRACT_STATUS_LABELS[contract.status]}
                </Badge>
              </DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(contract)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {contract.documentUrl && (
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {getStatusActions().map((action) => (
                  <DropdownMenuItem
                    key={action.status}
                    onClick={() => onStatusChange(contract.id, action.status)}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                ))}
                {contract.status === 'DRAFT' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(contract.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Alertas */}
            {(isExpiringSoon || isExpired) && (
              <div className={cn(
                'p-3 rounded-lg flex items-center gap-2',
                isExpired ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
              )}>
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {isExpired 
                    ? 'Este contrato ha expirado' 
                    : `Este contrato expira en ${differenceInDays(new Date(contract.endDate!), new Date())} días`
                  }
                </span>
              </div>
            )}

            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="signatures">Firmas</TabsTrigger>
                <TabsTrigger value="details">Detalles</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Parte contratante */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Parte Contratante
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre:</span>
                      <p className="font-medium">{contract.partyName}</p>
                    </div>
                    {contract.partyTaxId && (
                      <div>
                        <span className="text-gray-500">CIF/NIF:</span>
                        <p className="font-medium">{contract.partyTaxId}</p>
                      </div>
                    )}
                    {contract.partyPhone && (
                      <div>
                        <span className="text-gray-500">Teléfono:</span>
                        <p className="font-medium">{contract.partyPhone}</p>
                      </div>
                    )}
                    {contract.partyEmail && (
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium">{contract.partyEmail}</p>
                      </div>
                    )}
                    {contract.partyAddress && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Dirección:</span>
                        <p className="font-medium">{contract.partyAddress}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Fechas e importe */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        Fecha Inicio
                      </div>
                      <p className="text-lg font-semibold mt-1">
                        {format(new Date(contract.startDate), 'd MMM yyyy', { locale: es })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        Fecha Fin
                      </div>
                      <p className="text-lg font-semibold mt-1">
                        {contract.endDate 
                          ? format(new Date(contract.endDate), 'd MMM yyyy', { locale: es })
                          : 'Sin fecha'
                        }
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FileText className="w-4 h-4" />
                        Importe
                      </div>
                      <p className="text-lg font-semibold mt-1">
                        {formatCurrency(contract.totalAmount)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Descripción */}
                {contract.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Descripción</h4>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {contract.description}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signatures" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Firma de la parte */}
                  <Card className={cn(
                    contract.signedByParty && 'border-green-500'
                  )}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {contract.signedByParty ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          ) : (
                            <Clock className="w-8 h-8 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">Parte Contratante</p>
                            <p className="text-sm text-gray-500">
                              {contract.signedByParty 
                                ? `Firmado: ${format(new Date(contract.signedByPartyAt!), 'd MMM yyyy', { locale: es })}`
                                : 'Pendiente de firma'
                              }
                            </p>
                          </div>
                        </div>
                        {!contract.signedByParty && contract.status === 'PENDING_SIGN' && (
                          <Button
                            size="sm"
                            onClick={() => onSign(contract.id, 'party')}
                          >
                            <FileSignature className="w-4 h-4 mr-2" />
                            Firmar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Firma de la empresa */}
                  <Card className={cn(
                    contract.signedByCompany && 'border-green-500'
                  )}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {contract.signedByCompany ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          ) : (
                            <Clock className="w-8 h-8 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">Empresa</p>
                            <p className="text-sm text-gray-500">
                              {contract.signedByCompany 
                                ? `Firmado: ${format(new Date(contract.signedByCompanyAt!), 'd MMM yyyy', { locale: es })}`
                                : 'Pendiente de firma'
                              }
                            </p>
                          </div>
                        </div>
                        {!contract.signedByCompany && contract.status === 'PENDING_SIGN' && (
                          <Button
                            size="sm"
                            onClick={() => onSign(contract.id, 'company')}
                          >
                            <FileSignature className="w-4 h-4 mr-2" />
                            Firmar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {contract.status === 'PENDING_SIGN' && contract.signedByParty && contract.signedByCompany && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Ambas partes han firmado. El contrato está listo para activarse.</span>
                    <Button
                      size="sm"
                      onClick={() => onStatusChange(contract.id, 'ACTIVE')}
                      className="ml-auto"
                    >
                      Activar Contrato
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Renovación */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Renovación Automática</p>
                        <p className="text-sm text-gray-500">
                          {contract.autoRenew 
                            ? `Se renueva cada ${contract.renewalPeriod} meses`
                            : 'Sin renovación automática'
                          }
                        </p>
                      </div>
                      <Badge variant={contract.autoRenew ? 'default' : 'secondary'}>
                        {contract.autoRenew ? 'Activada' : 'Desactivada'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Notas */}
                {contract.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Notas</h4>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {contract.notes}
                    </p>
                  </div>
                )}

                {/* Metadatos */}
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Creado: {format(new Date(contract.createdAt), 'd MMM yyyy HH:mm', { locale: es })}</p>
                  <p>Actualizado: {format(new Date(contract.updatedAt), 'd MMM yyyy HH:mm', { locale: es })}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Main component
export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calculate stats
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'ACTIVE').length,
    pending: contracts.filter(c => c.status === 'PENDING_SIGN').length,
    totalAmount: contracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0),
    byType: Object.keys(CONTRACT_TYPE_LABELS).reduce((acc, type) => {
      acc[type] = contracts.filter(c => c.type === type).length;
      return acc;
    }, {} as Record<string, number>),
  };

  // Filtered contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = !search || 
      contract.title.toLowerCase().includes(search.toLowerCase()) ||
      contract.number.toLowerCase().includes(search.toLowerCase()) ||
      contract.partyName.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || contract.type === typeFilter;
    const matchesStatus = !statusFilter || contract.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handlers
  const handleCreate = async (data: any) => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        setContracts([result.data, ...contracts]);
        setCreateOpen(false);
        toast.success('Contrato creado exitosamente');
      } else {
        toast.error('Error al crear el contrato');
      }
    } catch (error) {
      // Use mock data in development
      const newContract: Contract = {
        id: `mock-${Date.now()}`,
        companyId: '1',
        type: data.type as ContractType,
        number: `CNT-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(4, '0')}`,
        partyType: data.type.toLowerCase(),
        partyName: data.partyName,
        partyTaxId: data.partyTaxId,
        partyAddress: data.partyAddress,
        partyPhone: data.partyPhone,
        partyEmail: data.partyEmail,
        workId: data.workId || undefined,
        leadId: data.leadId || undefined,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
        currency: 'EUR',
        status: 'DRAFT',
        signedByParty: false,
        signedByCompany: false,
        autoRenew: data.autoRenew,
        renewalPeriod: data.renewalPeriod,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContracts([newContract, ...contracts]);
      setCreateOpen(false);
      toast.success('Contrato creado exitosamente');
    }
  };

  const handleStatusChange = async (id: string, status: MainContractStatus) => {
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setContracts(contracts.map(c => 
          c.id === id ? { ...c, status } : c
        ));
        toast.success('Estado actualizado');
        setDetailOpen(false);
      }
    } catch (error) {
      // Update locally in development
      setContracts(contracts.map(c => 
        c.id === id ? { ...c, status, updatedAt: new Date() } : c
      ));
      toast.success('Estado actualizado');
      setDetailOpen(false);
    }
  };

  const handleSign = async (id: string, type: 'party' | 'company') => {
    try {
      const data = type === 'party' 
        ? { signedByParty: true }
        : { signedByCompany: true };
      
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setContracts(contracts.map(c => 
          c.id === id ? { 
            ...c, 
            [type === 'party' ? 'signedByParty' : 'signedByCompany']: true,
            [type === 'party' ? 'signedByPartyAt' : 'signedByCompanyAt']: new Date(),
          } : c
        ));
        setSelectedContract(prev => prev ? {
          ...prev,
          [type === 'party' ? 'signedByParty' : 'signedByCompany']: true,
          [type === 'party' ? 'signedByPartyAt' : 'signedByCompanyAt']: new Date(),
        } : null);
        toast.success('Firma registrada');
      }
    } catch (error) {
      // Update locally in development
      setContracts(contracts.map(c => 
        c.id === id ? { 
          ...c, 
          [type === 'party' ? 'signedByParty' : 'signedByCompany']: true,
          [type === 'party' ? 'signedByPartyAt' : 'signedByCompanyAt']: new Date(),
        } : c
      ));
      setSelectedContract(prev => prev ? {
        ...prev,
        [type === 'party' ? 'signedByParty' : 'signedByCompany']: true,
        [type === 'party' ? 'signedByPartyAt' : 'signedByCompanyAt']: new Date(),
      } : null);
      toast.success('Firma registrada');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setContracts(contracts.filter(c => c.id !== id));
        setDeleteId(null);
        setDetailOpen(false);
        toast.success('Contrato eliminado');
      }
    } catch (error) {
      // Delete locally in development
      setContracts(contracts.filter(c => c.id !== id));
      setDeleteId(null);
      setDetailOpen(false);
      toast.success('Contrato eliminado');
    }
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailOpen(false);
    // Open edit dialog...
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contratos</h1>
          <p className="text-gray-500">Gestión de contratos con clientes, subcontratas y colaboradores</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Contrato</DialogTitle>
              <DialogDescription>
                Complete los datos del contrato
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <ContractForm
                onSubmit={handleCreate}
                onCancel={() => setCreateOpen(false)}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Contratos"
          value={stats.total}
          icon={<FileText className="w-5 h-5 text-white" />}
          color="bg-emerald-500"
        />
        <StatsCard
          title="Activos"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          color="bg-green-500"
        />
        <StatsCard
          title="Pendientes Firma"
          value={stats.pending}
          icon={<FileSignature className="w-5 h-5 text-white" />}
          color="bg-yellow-500"
        />
        <StatsCard
          title="Importe Total"
          value={formatCurrency(stats.totalAmount)}
          icon={<Briefcase className="w-5 h-5 text-white" />}
          color="bg-violet-500"
        />
      </div>

      {/* Stats by type */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Object.entries(CONTRACT_TYPE_LABELS).map(([type, label]) => (
          <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setTypeFilter(typeFilter === type ? '' : type)}>
            <CardContent className="p-3 text-center">
              <Badge className={cn('mb-2', CONTRACT_TYPE_COLORS[type as ContractType])}>
                {stats.byType[type] || 0}
              </Badge>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por título, número o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            {Object.entries(CONTRACT_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {Object.entries(CONTRACT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Parte</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No hay contratos que coincidan con los filtros
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => {
                  const isExpiringSoon = contract.endDate && 
                    contract.status === 'ACTIVE' && 
                    differenceInDays(new Date(contract.endDate), new Date()) <= 30 &&
                    differenceInDays(new Date(contract.endDate), new Date()) > 0;
                  const isExpired = contract.endDate && 
                    contract.status === 'ACTIVE' && 
                    isBefore(new Date(contract.endDate), new Date());

                  return (
                    <TableRow 
                      key={contract.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        setSelectedContract(contract);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-mono text-sm">{contract.number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.title}</p>
                          <p className="text-xs text-gray-500">{contract.description?.substring(0, 50)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={CONTRACT_TYPE_COLORS[contract.type]}>
                          {CONTRACT_TYPE_LABELS[contract.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.partyName}</p>
                          {contract.partyTaxId && (
                            <p className="text-xs text-gray-500">{contract.partyTaxId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(contract.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.endDate ? (
                          <div className={cn(
                            isExpired && 'text-red-600',
                            isExpiringSoon && 'text-yellow-600'
                          )}>
                            {format(new Date(contract.endDate), 'd MMM yyyy', { locale: es })}
                            {isExpiringSoon && (
                              <p className="text-xs">({differenceInDays(new Date(contract.endDate), new Date())} días)</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin fecha</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContract(contract);
                              setDetailOpen(true);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(contract);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {contract.status === 'DRAFT' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(contract.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <ContractDetail
        contract={selectedContract}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
        onSign={handleSign}
        onDelete={(id) => {
          setDetailOpen(false);
          setDeleteId(id);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Solo se pueden eliminar contratos en estado borrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
