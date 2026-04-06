// ==========================================
// TIPOS PRINCIPALES DEL CRM - CASAS CONFORTABLES
// ==========================================

// Enum de roles de usuario
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TEAM_LEADER'
  | 'ARCHITECT'
  | 'COMMERCIAL'
  | 'FRANCHISE'
  | 'REAL_ESTATE'
  | 'SUBCONTRACTOR'
  | 'WORKER'
  | 'CLIENT';

// Enum de estados de lead
export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'VISIT'
  | 'OFFER'
  | 'NEGOTIATION'
  | 'CLOSED'
  | 'LOST';

// Enum de tipos de lead
export type LeadType =
  | 'NEW_BUILD'
  | 'REFORM'
  | 'INVESTMENT'
  | 'FRANCHISE'
  | 'OTHER';

// Enum de fuentes de lead
export type LeadSource =
  | 'WEB'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'GOOGLE'
  | 'REFERRAL'
  | 'REAL_ESTATE'
  | 'COLD_CALL'
  | 'FAIR'
  | 'OTHER';

// Enum de tipos de empresa
export type CompanyType =
  | 'FRANCHISE'
  | 'REAL_ESTATE'
  | 'SUBCONTRACTOR'
  | 'PARTNER'
  | 'OWN';

// Enum de estados de obra
export type WorkStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

// Enum de método de asignación
export type AssignmentMethod =
  | 'ROUND_ROBIN'
  | 'BY_ZONE'
  | 'BY_LOAD'
  | 'BY_TYPE'
  | 'MANUAL';

// ==========================================
// INTERFACES PRINCIPALES
// ==========================================

// Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  companyId?: string;
  officeId?: string;
  teamId?: string;
  managerId?: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Relaciones
  company?: Company;
  office?: Office;
  team?: Team;
  manager?: User;
  teamMembers?: User[];
}

// Empresa
export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  logo?: string;
  primaryColor?: string;
  isActive: boolean;
  assignmentMethod: AssignmentMethod;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  offices?: Office[];
  users?: User[];
}

// Oficina
export interface Office {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  zones?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  company?: Company;
  teams?: Team[];
  users?: User[];
}

// Equipo
export interface Team {
  id: string;
  officeId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  office?: Office;
  users?: User[];
}

// Lead
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  alternativePhone?: string;
  
  // Ubicación
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  zone?: string;
  
  // Clasificación
  type: LeadType;
  source: LeadSource;
  status: LeadStatus;
  
  // Valoración
  estimatedValue?: number;
  probability?: number;
  priority: number;
  
  // Descripción
  description?: string;
  requirements?: string;
  
  // Presupuesto del cliente
  budgetMin?: number;
  budgetMax?: number;
  
  // Fechas
  preferredStartDate?: Date;
  deadline?: Date;
  
  // Relaciones organizativas
  companyId: string;
  officeId?: string;
  teamId?: string;
  assignedToId?: string;
  createdById: string;
  clientId?: string;
  
  // Info adicional
  customFields?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  contactedAt?: Date;
  closedAt?: Date;
  
  // Relaciones
  company?: Company;
  office?: Office;
  team?: Team;
  assignedTo?: User;
  createdBy?: User;
  comments?: LeadComment[];
  activities?: LeadActivity[];
  documents?: Document[];
  tasks?: Task[];
  budgets?: Budget[];
  work?: Work;
}

// Comentario de lead
export interface LeadComment {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  
  user?: User;
}

// Actividad de lead
export interface LeadActivity {
  id: string;
  leadId: string;
  userId?: string;
  action: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  metadata?: string;
  createdAt: Date;
  
  user?: User;
}

// Documento
export interface Document {
  id: string;
  companyId: string;
  uploadedById: string;
  leadId?: string;
  workId?: string;
  name: string;
  description?: string;
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType =
  | 'CONTRACT'
  | 'BUDGET'
  | 'INVOICE'
  | 'CERTIFICATE'
  | 'PHOTO'
  | 'VIDEO'
  | 'PLAN'
  | 'OTHER';

// Obra
export interface Work {
  id: string;
  leadId: string;
  companyId: string;
  createdById: string;
  
  name: string;
  description?: string;
  reference?: string;
  
  // Ubicación
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  
  // Estado y fechas
  status: WorkStatus;
  startDate?: Date;
  endDate?: Date;
  estimatedDays?: number;
  
  // Presupuesto
  budget?: number;
  actualCost?: number;
  
  // Progreso
  progress: number;
  
  // Notas
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  lead?: Lead;
  company?: Company;
  createdBy?: User;
  subcontractors?: WorkSubcontractor[];
  updates?: WorkUpdate[];
  documents?: Document[];
  incidents?: Incident[];
  tasks?: Task[];
}

// Subcontratista en obra
export interface WorkSubcontractor {
  id: string;
  workId: string;
  subcontractorId: string;
  role?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Actualización de obra
export interface WorkUpdate {
  id: string;
  workId: string;
  userId: string;
  title: string;
  description: string;
  progressBefore?: number;
  progressAfter?: number;
  photos?: string;
  videos?: string;
  createdAt: Date;
  
  user?: User;
}

// Incidencia
export interface Incident {
  id: string;
  workId: string;
  reportedById: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  resolution?: string;
  resolvedAt?: Date;
  resolvedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tarea
export interface Task {
  id: string;
  leadId?: string;
  workId?: string;
  title: string;
  description?: string;
  createdById: string;
  assignedToId?: string;
  dueDate?: Date;
  completedAt?: Date;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  
  createdBy?: User;
  assignedTo?: User;
}

// Presupuesto
export interface Budget {
  id: string;
  leadId: string;
  companyId: string;
  createdById: string;
  number?: string;
  title: string;
  description?: string;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  validUntil?: Date;
  status: string;
  lines?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  acceptedAt?: Date;
  
  lead?: Lead;
  company?: Company;
  createdBy?: User;
}

// Notificación
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: Date;
  sentEmail: boolean;
  sentWhatsapp: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'LEAD_ASSIGNED'
  | 'LEAD_UPDATED'
  | 'NEW_COMMENT'
  | 'WORK_UPDATE'
  | 'TASK_REMINDER'
  | 'SYSTEM';

// Log de actividad
export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

// ==========================================
// TIPOS PARA ESTADÍSTICAS
// ==========================================

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  visitedLeads: number;
  offeredLeads: number;
  closedLeads: number;
  lostLeads: number;
  totalValue: number;
  closedValue: number;
  conversionRate: number;
}

export interface CommercialStats {
  userId: string;
  userName: string;
  totalLeads: number;
  closedLeads: number;
  lostLeads: number;
  closedValue: number;
  conversionRate: number;
}

export interface OfficeStats {
  officeId: string;
  officeName: string;
  totalLeads: number;
  closedLeads: number;
  closedValue: number;
  conversionRate: number;
}

// ==========================================
// TIPOS PARA FORMULARIOS
// ==========================================

export interface LeadFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  alternativePhone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  type: LeadType;
  source: LeadSource;
  estimatedValue?: number;
  probability?: number;
  priority: number;
  description?: string;
  requirements?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredStartDate?: Date;
  deadline?: Date;
  officeId?: string;
  teamId?: string;
  assignedToId?: string;
}

export interface UserFormData {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  companyId?: string;
  officeId?: string;
  teamId?: string;
  managerId?: string;
}

export interface CompanyFormData {
  name: string;
  type: CompanyType;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  assignmentMethod: AssignmentMethod;
}

// ==========================================
// TIPOS PARA LA UI
// ==========================================

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  type?: string;
  source?: string;
  assignedToId?: string;
  officeId?: string;
  teamId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ==========================================
// TIPOS PARA RESPUESTAS API
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationParams;
}

// ==========================================
// HELPERS PARA LABELS
// ==========================================

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  TEAM_LEADER: 'Jefe de Equipo',
  ARCHITECT: 'Arquitecto',
  COMMERCIAL: 'Comercial',
  FRANCHISE: 'Franquiciado',
  REAL_ESTATE: 'Inmobiliaria',
  SUBCONTRACTOR: 'Subcontrata',
  WORKER: 'Trabajador',
  CLIENT: 'Cliente',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISIT: 'Visita Programada',
  OFFER: 'Oferta Enviada',
  NEGOTIATION: 'En Negociación',
  CLOSED: 'Cerrado',
  LOST: 'Perdido',
};

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  NEW_BUILD: 'Obra Nueva',
  REFORM: 'Reforma',
  INVESTMENT: 'Inversión',
  FRANCHISE: 'Franquicia',
  OTHER: 'Otro',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEB: 'Web',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  GOOGLE: 'Google Ads',
  REFERRAL: 'Recomendación',
  REAL_ESTATE: 'Inmobiliaria',
  COLD_CALL: 'Llamada en frío',
  FAIR: 'Feria/Evento',
  OTHER: 'Otro',
};

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  PLANNING: 'Planificación',
  IN_PROGRESS: 'En Curso',
  PAUSED: 'Pausada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  FRANCHISE: 'Franquicia',
  REAL_ESTATE: 'Inmobiliaria',
  SUBCONTRACTOR: 'Subcontrata',
  PARTNER: 'Socio Colaborador',
  OWN: 'Empresa Propia',
};

export const ASSIGNMENT_METHOD_LABELS: Record<AssignmentMethod, string> = {
  ROUND_ROBIN: 'Round Robin',
  BY_ZONE: 'Por Zona',
  BY_LOAD: 'Por Carga de Trabajo',
  BY_TYPE: 'Por Tipo de Lead',
  MANUAL: 'Manual',
};

// Colores para estados de lead
export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-yellow-500',
  VISIT: 'bg-purple-500',
  OFFER: 'bg-orange-500',
  NEGOTIATION: 'bg-cyan-500',
  CLOSED: 'bg-green-500',
  LOST: 'bg-red-500',
};
