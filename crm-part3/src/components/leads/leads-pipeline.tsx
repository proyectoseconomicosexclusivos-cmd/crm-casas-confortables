'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  User,
  Search,
  Filter,
  RefreshCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLeadsStore } from '@/hooks/use-store';
import { useAuth } from '@/hooks/use-auth';
import {
  Lead,
  LeadStatus,
  LEAD_STATUS_LABELS,
  LEAD_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_COLORS,
} from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Configuración de columnas del pipeline
const PIPELINE_COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'NEW', title: 'Nuevo', color: 'bg-blue-500' },
  { id: 'CONTACTED', title: 'Contactado', color: 'bg-yellow-500' },
  { id: 'VISIT', title: 'Visita', color: 'bg-purple-500' },
  { id: 'OFFER', title: 'Oferta', color: 'bg-orange-500' },
  { id: 'NEGOTIATION', title: 'Negociación', color: 'bg-cyan-500' },
  { id: 'CLOSED', title: 'Cerrado', color: 'bg-green-500' },
  { id: 'LOST', title: 'Perdido', color: 'bg-red-500' },
];

// Datos de ejemplo para desarrollo
const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'García López',
    email: 'juan.garcia@email.com',
    phone: '+34 612 345 678',
    city: 'Madrid',
    province: 'Madrid',
    type: 'NEW_BUILD',
    source: 'WEB',
    status: 'NEW',
    estimatedValue: 250000,
    probability: 60,
    priority: 1,
    description: 'Interesado en vivienda de 3 habitaciones en zona norte',
    companyId: '1',
    createdById: '1',
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: '2',
    firstName: 'María',
    lastName: 'Fernández Ruiz',
    email: 'maria.fernandez@email.com',
    phone: '+34 623 456 789',
    city: 'Barcelona',
    province: 'Barcelona',
    type: 'REFORM',
    source: 'FACEBOOK',
    status: 'CONTACTED',
    estimatedValue: 45000,
    probability: 40,
    priority: 2,
    description: 'Reforma integral de piso de 90m²',
    companyId: '1',
    createdById: '1',
    createdAt: new Date('2026-03-18'),
    updatedAt: new Date('2026-03-22'),
    contactedAt: new Date('2026-03-22'),
  },
  {
    id: '3',
    firstName: 'Carlos',
    lastName: 'Martínez Soto',
    email: 'carlos.martinez@email.com',
    phone: '+34 634 567 890',
    city: 'Valencia',
    province: 'Valencia',
    type: 'INVESTMENT',
    source: 'REFERRAL',
    status: 'VISIT',
    estimatedValue: 180000,
    probability: 70,
    priority: 1,
    description: 'Inversor buscando propiedades para alquiler',
    companyId: '1',
    createdById: '1',
    createdAt: new Date('2026-03-15'),
    updatedAt: new Date('2026-03-23'),
    contactedAt: new Date('2026-03-17'),
  },
  {
    id: '4',
    firstName: 'Ana',
    lastName: 'López Pérez',
    email: 'ana.lopez@email.com',
    phone: '+34 645 678 901',
    city: 'Sevilla',
    province: 'Sevilla',
    type: 'NEW_BUILD',
    source: 'GOOGLE',
    status: 'OFFER',
    estimatedValue: 320000,
    probability: 80,
    priority: 1,
    description: 'Pareja joven buscando primera vivienda',
    companyId: '1',
    createdById: '1',
    createdAt: new Date('2026-03-10'),
    updatedAt: new Date('2026-03-24'),
    contactedAt: new Date('2026-03-11'),
  },
  {
    id: '5',
    firstName: 'Pedro',
    lastName: 'Sánchez Gil',
    email: 'pedro.sanchez@email.com',
    phone: '+34 656 789 012',
    city: 'Bilbao',
    province: 'Vizcaya',
    type: 'REFORM',
    source: 'REAL_ESTATE',
    status: 'NEGOTIATION',
    estimatedValue: 75000,
    probability: 90,
    priority: 1,
    description: 'Reforma de local comercial',
    companyId: '1',
    createdById: '1',
    createdAt: new Date('2026-03-05'),
    updatedAt: new Date('2026-03-25'),
    contactedAt: new Date('2026-03-06'),
  },
  {
    id: '6',
    firstName: 'Laura',
    lastName: 'Gómez Torres',
    email: 'laura.gomez@email.com',
    phone: '+34 667 890 123',
    city: 'Málaga',
    province: 'Málaga',
    type: 'NEW_BUILD',
    source: 'WEB',
    status: 'CLOSED',
    estimatedValue: 285000,
    probability: 100,
    priority: 1,
    description: 'Vivienda unifamiliar con piscina',
    companyId: '1',
    createdById: '1',
    createdAt: new Date('2026-02-28'),
    updatedAt: new Date('2026-03-20'),
    contactedAt: new Date('2026-03-01'),
    closedAt: new Date('2026-03-20'),
  },
  {
    id: '7',
    firstName: 'Roberto',
    lastName: 'Díaz Navarro',
    email: 'roberto.diaz@email.com',
    phone: '+34 678 901 234',
    city: 'Zaragoza',
    province: 'Zaragoza',
    type: 'INVESTMENT',
    source: 'FAIR',
    status: 'LOST',
    estimatedValue: 150000,
    probability: 0,
    priority: 3,
    description: 'No tenía financiación',
    companyId: '1',
    createdById: '1',
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-03-15'),
    contactedAt: new Date('2026-02-21'),
    closedAt: new Date('2026-03-15'),
  },
];

// Componente de tarjeta de lead
interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg'
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-emerald-600 text-white text-xs">
                {getInitials(lead.firstName, lead.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {lead.firstName} {lead.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{lead.city}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>
                <Eye className="w-4 h-4 mr-2" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 space-y-2">
          {lead.estimatedValue && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Valor</span>
              <span className="font-medium">{formatCurrency(lead.estimatedValue)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {LEAD_TYPE_LABELS[lead.type]}
            </Badge>
            {lead.priority === 1 && (
              <Badge variant="destructive" className="text-xs">
                Alta
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span className="truncate">{lead.phone}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t text-xs text-gray-400">
          {format(new Date(lead.createdAt), "d MMM yyyy", { locale: es })}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de columna del pipeline
interface PipelineColumnProps {
  id: LeadStatus;
  title: string;
  color: string;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

function PipelineColumn({ id, title, color, leads, onLeadClick }: PipelineColumnProps) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', color)} />
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2" ref={setNodeRef}>
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
            ))}
          </div>
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No hay leads</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Añadir lead
        </Button>
      </div>
    </div>
  );
}

// Componente principal del Pipeline
export function LeadsPipeline() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getLeadsByStatus = useCallback(
    (status: LeadStatus) => {
      return leads.filter((lead) => {
        const matchesSearch =
          !search ||
          `${lead.firstName} ${lead.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          lead.email?.toLowerCase().includes(search.toLowerCase()) ||
          lead.phone.includes(search);

        const matchesStatus = !statusFilter || lead.status === statusFilter;

        return lead.status === status && matchesSearch && matchesStatus;
      });
    },
    [leads, search, statusFilter]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status !== newStatus) {
      // Actualizar estado localmente
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: newStatus } : l
        )
      );

      // Aquí iría la llamada a la API
      try {
        await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (error) {
        console.error('Error updating lead status:', error);
        // Revertir cambio en caso de error
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: lead.status } : l
          )
        );
      }
    }
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {PIPELINE_COLUMNS.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Pipeline */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={PIPELINE_COLUMNS.map((col) => col.id)}>
            {PIPELINE_COLUMNS.map((column) => (
              <PipelineColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                leads={getLeadsByStatus(column.id)}
                onLeadClick={setSelectedLead}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeLead && <LeadCard lead={activeLead} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
