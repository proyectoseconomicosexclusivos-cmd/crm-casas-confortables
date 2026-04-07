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

// ==========================================
// CATÁLOGOS Y PEDIDOS
// ==========================================

// Tipos de material
export type MaterialTypeEnum =
  | 'STRUCTURAL'
  | 'FINISHES'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'INSULATION'
  | 'FLOORING'
  | 'WALLS'
  | 'CEILING'
  | 'DOORS'
  | 'WINDOWS'
  | 'KITCHEN'
  | 'BATHROOM'
  | 'OUTDOOR'
  | 'OTHER';

export type MaterialStatus = 'ACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK' | 'LIMITED';

// Categoría de producto
export interface ProductCategory {
  id: string;
  companyId: string;
  parentId?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: ProductCategory[];
  parent?: ProductCategory;
}

// Producto de material
export interface MaterialProduct {
  id: string;
  companyId: string;
  categoryId?: string;
  sku?: string;
  reference?: string;
  barcode?: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  materialType: MaterialTypeEnum;
  tags?: string;
  unit: string;
  unitQuantity?: number;
  minOrder?: number;
  increment?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  costPrice?: number;
  retailPrice?: number;
  contractorPrice?: number;
  priceUnit: string;
  taxRate: number;
  stockQuantity: number;
  minStock?: number;
  maxStock?: number;
  status: MaterialStatus;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  images?: string;
  datasheetUrl?: string;
  supplierId?: string;
  supplierName?: string;
  leadTime?: number;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  categoryRelation?: ProductCategory;
}

// Categoría de merchandising
export type MerchCategory =
  | 'BRANDED'
  | 'PROMOTIONAL'
  | 'GIFT'
  | 'UNIFORM'
  | 'SIGNAGE'
  | 'PRINTED'
  | 'DIGITAL'
  | 'OTHER';

// Producto de merchandising
export interface MerchProduct {
  id: string;
  companyId: string;
  sku?: string;
  reference?: string;
  name: string;
  description?: string;
  category: MerchCategory;
  unit: string;
  minOrder?: number;
  costPrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  taxRate: number;
  stockQuantity: number;
  isActive: boolean;
  visibleToRealEstate: boolean;
  visibleToPartners: boolean;
  visibleToFranchises: boolean;
  imageUrl?: string;
  images?: string;
  supplierId?: string;
  supplierName?: string;
  customizable: boolean;
  customizationOptions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Estado de pedido de materiales
export type MaterialOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'ORDERED'
  | 'PARTIAL'
  | 'DELIVERED'
  | 'CANCELLED';

export type MaterialOrderType = 'INTERNAL' | 'SUBCONTRACTOR' | 'PROJECT' | 'STOCK';

// Pedido de materiales
export interface MaterialOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  type: MaterialOrderType;
  requestedById: string;
  subcontractorId?: string;
  workId?: string;
  supplierId?: string;
  supplierName?: string;
  supplierContact?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  deliveryNotes?: string;
  orderDate: Date;
  expectedDate?: Date;
  deliveryDate?: Date;
  status: MaterialOrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  approvedById?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  notes?: string;
  internalNotes?: string;
  purchaseOrderUrl?: string;
  deliveryNoteUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: MaterialOrderItem[];
}

// Item de pedido de materiales
export interface MaterialOrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productSku?: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  total: number;
  deliveredQty: number;
  pendingQty?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  product?: MaterialProduct;
}

// Estado de pedido de merch
export type MerchOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

// Pedido de merchandising
export interface MerchOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  clientId?: string;
  clientType?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingProvince?: string;
  orderDate: Date;
  shipDate?: Date;
  deliveryDate?: Date;
  status: MerchOrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: MerchOrderItem[];
}

// Item de pedido de merch
export interface MerchOrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  customization?: string;
  createdAt: Date;
  product?: MerchProduct;
}

// Estado de certificación
export type CertificationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'PARTIAL'
  | 'FINAL'
  | 'INVOICED'
  | 'PAID';

// Certificación
export interface Certification {
  id: string;
  companyId: string;
  workId: string;
  clientId?: string;
  number: string;
  type: string;
  period?: string;
  certDate: Date;
  fromDate?: Date;
  toDate?: Date;
  status: CertificationStatus;
  previousCertified: number;
  currentCertified: number;
  totalCertified: number;
  retentionPct: number;
  retentionAmount: number;
  subtotal: number;
  tax: number;
  total: number;
  approvedById?: string;
  approvedAt?: Date;
  invoiceNumber?: string;
  invoiceDate?: Date;
  invoiceUrl?: string;
  paidAt?: Date;
  paymentMethod?: string;
  notes?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: CertificationItem[];
}

// Item de certificación
export interface CertificationItem {
  id: string;
  certificationId: string;
  concept: string;
  description?: string;
  unit: string;
  budgetQty: number;
  previousQty: number;
  currentQty: number;
  unitPrice: number;
  budgetAmount: number;
  previousAmount: number;
  currentAmount: number;
  createdAt: Date;
}

// Estado de presupuesto de subcontrata
export type SubcontractorBudgetStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// Presupuesto de subcontrata
export interface SubcontractorBudget {
  id: string;
  companyId: string;
  workId: string;
  subcontractorId: string;
  number?: string;
  title: string;
  description?: string;
  budgetDate: Date;
  validUntil?: Date;
  startDate?: Date;
  endDate?: Date;
  status: SubcontractorBudgetStatus;
  subtotal: number;
  tax: number;
  total: number;
  clientBudget?: number;
  margin?: number;
  marginPct?: number;
  previousBudgetId?: string;
  previousTotal?: number;
  difference?: number;
  acceptedAt?: Date;
  acceptedById?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: SubcontractorBudgetItem[];
}

// Item de presupuesto de subcontrata
export interface SubcontractorBudgetItem {
  id: string;
  budgetId: string;
  concept: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  certifiedQty: number;
  pendingQty: number;
  certifiedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comparación de presupuestos
export interface BudgetComparison {
  id: string;
  workId: string;
  newBudgetId: string;
  oldBudgetId?: string;
  changedById: string;
  subcontractorBefore?: string;
  subcontractorAfter?: string;
  amountBefore: number;
  amountAfter: number;
  difference: number;
  differencePct: number;
  marginBefore?: number;
  marginAfter?: number;
  marginImprovement?: number;
  profitShareAmount?: number;
  profitSharePct?: number;
  aiAnalysis?: string;
  aiRecommendations?: string;
  createdAt: Date;
}

// Estado de profit share
export type ProfitShareStatus = 'CALCULATED' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';

// Profit Share
export interface ProfitShare {
  id: string;
  companyId: string;
  workId?: string;
  budgetComparisonId?: string;
  userId: string;
  userName: string;
  source: string;
  description: string;
  savingAmount: number;
  sharePct: number;
  shareAmount: number;
  status: ProfitShareStatus;
  approvedById?: string;
  approvedAt?: Date;
  paidAt?: Date;
  paymentRef?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Importación de catálogo
export interface CatalogImport {
  id: string;
  companyId: string;
  uploadedById: string;
  type: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ERROR';
  processedRows: number;
  totalRows?: number;
  errorRows: number;
  productsCreated: number;
  productsUpdated: number;
  errors?: string;
  config?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Draft de producto importado
export interface ImportedProductDraft {
  id: string;
  importId: string;
  rawData: string;
  name?: string;
  sku?: string;
  description?: string;
  unit?: string;
  category?: string;
  price?: number;
  hasPrice: boolean;
  isProcessed: boolean;
  isApproved: boolean;
  productId?: string;
  createdAt: Date;
  processedAt?: Date;
}

// Labels para tipos de material
export const MATERIAL_TYPE_LABELS: Record<MaterialTypeEnum, string> = {
  STRUCTURAL: 'Estructural',
  FINISHES: 'Acabados',
  ELECTRICAL: 'Eléctrico',
  PLUMBING: 'Fontanería',
  INSULATION: 'Aislamiento',
  FLOORING: 'Suelos',
  WALLS: 'Paredes',
  CEILING: 'Techos',
  DOORS: 'Puertas',
  WINDOWS: 'Ventanas',
  KITCHEN: 'Cocina',
  BATHROOM: 'Baño',
  OUTDOOR: 'Exterior',
  OTHER: 'Otro',
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  ACTIVE: 'Activo',
  DISCONTINUED: 'Descatalogado',
  OUT_OF_STOCK: 'Sin Stock',
  LIMITED: 'Limitado',
};

export const MERCH_CATEGORY_LABELS: Record<MerchCategory, string> = {
  BRANDED: 'Marca',
  PROMOTIONAL: 'Promocional',
  GIFT: 'Regalo',
  UNIFORM: 'Uniforme',
  SIGNAGE: 'Señalética',
  PRINTED: 'Impreso',
  DIGITAL: 'Digital',
  OTHER: 'Otro',
};

export const MATERIAL_ORDER_STATUS_LABELS: Record<MaterialOrderStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  ORDERED: 'Pedido',
  PARTIAL: 'Entrega Parcial',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const MERCH_ORDER_STATUS_LABELS: Record<MerchOrderStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PROCESSING: 'En Proceso',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  PARTIAL: 'Parcial',
  FINAL: 'Final',
  INVOICED: 'Facturado',
  PAID: 'Pagado',
};

export const SUBCONTRACTOR_BUDGET_STATUS_LABELS: Record<SubcontractorBudgetStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  IN_PROGRESS: 'En Ejecución',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const PROFIT_SHARE_STATUS_LABELS: Record<ProfitShareStatus, string> = {
  CALCULATED: 'Calculado',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
};

// ==========================================
// CERTIFICACIONES DE EMPLEADOS
// ==========================================

// Estado de certificación de empleado
export type EmployeeCertificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED';

// Certificación de empleado
export interface EmployeeCertification {
  id: string;
  companyId: string;
  userId: string;
  workId?: string;
  month: number;
  year: number;
  amount: number;
  workDescription?: string;
  hoursWorked?: number;
  adminAmount?: number;
  adminNotes?: string;
  validatedById?: string;
  validatedAt?: Date;
  profitAmount?: number;
  profitPct?: number;
  status: EmployeeCertificationStatus;
  paidAt?: Date;
  paymentRef?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: EmployeeCertificationItem[];
  user?: User;
  work?: Work;
}

// Item de certificación de empleado
export interface EmployeeCertificationItem {
  id: string;
  certificationId: string;
  workId?: string;
  workName?: string;
  description: string;
  hours: number;
  amount: number;
  validatedAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Labels para estados de certificación de empleado
export const EMPLOYEE_CERTIFICATION_STATUS_LABELS: Record<EmployeeCertificationStatus, string> = {
  DRAFT: 'Borrador',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprobado',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
};

// Colores para estados de certificación de empleado
export const EMPLOYEE_CERTIFICATION_STATUS_COLORS: Record<EmployeeCertificationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  SUBMITTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

// ==========================================
// CONTRATOS
// ==========================================

// Tipo de contrato
export type ContractType =
  | 'CLIENT'
  | 'SUBCONTRACTOR'
  | 'REAL_ESTATE'
  | 'PARTNER'
  | 'EMPLOYEE'
  | 'SUPPLIER';

// Estado del contrato
export type MainContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGN'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

// Interfaz de contrato
export interface Contract {
  id: string;
  companyId: string;
  type: ContractType;
  number: string;
  
  // Partes
  partyType: string;
  partyId?: string;
  partyName: string;
  partyTaxId?: string;
  partyAddress?: string;
  partyPhone?: string;
  partyEmail?: string;
  
  // Relación con obra/lead
  workId?: string;
  leadId?: string;
  
  // Datos del contrato
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  
  // Importes
  totalAmount?: number;
  currency: string;
  paymentTerms?: string;
  
  // Cláusulas
  clauses?: string;
  
  // Archivos
  documentUrl?: string;
  signedDocumentUrl?: string;
  
  // Firmas
  signedByParty: boolean;
  signedByPartyAt?: Date;
  signedByCompany: boolean;
  signedByCompanyAt?: Date;
  signedByCompanyId?: string;
  
  // Estado
  status: MainContractStatus;
  
  // Renovación
  autoRenew: boolean;
  renewalPeriod?: number;
  
  // Notas
  notes?: string;
  internalNotes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  company?: Company;
  work?: Work;
  lead?: Lead;
}

// Labels para tipos de contrato
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  CLIENT: 'Cliente',
  SUBCONTRACTOR: 'Subcontrata',
  REAL_ESTATE: 'Inmobiliaria',
  PARTNER: 'Colaborador',
  EMPLOYEE: 'Empleado',
  SUPPLIER: 'Proveedor',
};

// Labels para estados de contrato
export const CONTRACT_STATUS_LABELS: Record<MainContractStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_SIGN: 'Pendiente de Firma',
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
};

// Colores para estados de contrato
export const CONTRACT_STATUS_COLORS: Record<MainContractStatus, string> = {
  DRAFT: 'bg-gray-500',
  PENDING_SIGN: 'bg-yellow-500',
  ACTIVE: 'bg-green-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
  EXPIRED: 'bg-orange-500',
};

// Colores para tipos de contrato
export const CONTRACT_TYPE_COLORS: Record<ContractType, string> = {
  CLIENT: 'bg-emerald-500',
  SUBCONTRACTOR: 'bg-violet-500',
  REAL_ESTATE: 'bg-cyan-500',
  PARTNER: 'bg-amber-500',
  EMPLOYEE: 'bg-pink-500',
  SUPPLIER: 'bg-slate-500',
};

// ==========================================
// BIBLIOTECA DE DOCUMENTOS
// ==========================================

// Categoría de documento
export type DocumentCategory =
  | 'FLYER'
  | 'LOGO'
  | 'CATALOG'
  | 'MANUAL'
  | 'TEMPLATE'
  | 'PRESENTATION'
  | 'BUDGET_TEMPLATE'
  | 'CONTRACT_TEMPLATE'
  | 'CERTIFICATE'
  | 'INVOICE'
  | 'RECEIPT'
  | 'OTHER';

// Documento de biblioteca
export interface DocumentLibraryItem {
  id: string;
  companyId: string;
  uploadedById: string;
  category: DocumentCategory;
  name: string;
  description?: string;
  tags?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  version: number;
  parentDocumentId?: string;
  isPublic: boolean;
  visibleToRoles?: string;
  downloadCount: number;
  metadata?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  company?: Company;
  uploadedBy?: User;
  parentDocument?: DocumentLibraryItem;
}

// Labels para categorías de documento
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  FLYER: 'Flyers Promocionales',
  LOGO: 'Logos',
  CATALOG: 'Catálogos',
  MANUAL: 'Manuales',
  TEMPLATE: 'Plantillas',
  PRESENTATION: 'Presentaciones',
  BUDGET_TEMPLATE: 'Plantillas de Presupuesto',
  CONTRACT_TEMPLATE: 'Plantillas de Contrato',
  CERTIFICATE: 'Certificados',
  INVOICE: 'Facturas',
  RECEIPT: 'Recibos',
  OTHER: 'Otros',
};

// Colores para categorías de documento
export const DOCUMENT_CATEGORY_COLORS: Record<DocumentCategory, string> = {
  FLYER: 'bg-pink-500',
  LOGO: 'bg-purple-500',
  CATALOG: 'bg-indigo-500',
  MANUAL: 'bg-blue-500',
  TEMPLATE: 'bg-cyan-500',
  PRESENTATION: 'bg-teal-500',
  BUDGET_TEMPLATE: 'bg-emerald-500',
  CONTRACT_TEMPLATE: 'bg-green-500',
  CERTIFICATE: 'bg-amber-500',
  INVOICE: 'bg-orange-500',
  RECEIPT: 'bg-red-500',
  OTHER: 'bg-gray-500',
};

// Iconos para categorías de documento
export const DOCUMENT_CATEGORY_ICONS: Record<DocumentCategory, string> = {
  FLYER: 'FileSpreadsheet',
  LOGO: 'Image',
  CATALOG: 'Book',
  MANUAL: 'BookOpen',
  TEMPLATE: 'FileText',
  PRESENTATION: 'Presentation',
  BUDGET_TEMPLATE: 'Calculator',
  CONTRACT_TEMPLATE: 'FileCheck',
  CERTIFICATE: 'Award',
  INVOICE: 'Receipt',
  RECEIPT: 'CreditCard',
  OTHER: 'File',
};

// ==========================================
// ANÁLISIS DE DOCUMENTOS CON IA
// ==========================================

// Tipo de análisis de documento
export type DocumentAnalysisType =
  | 'budget'
  | 'contract'
  | 'product_list'
  | 'generic';

// Estado del análisis
export type DocumentAnalysisStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

// Interfaz de análisis de documento
export interface DocumentAnalysis {
  id: string;
  companyId: string;
  userId: string;
  documentId?: string;
  analysisType: DocumentAnalysisType;
  fileName: string;
  filePath?: string;
  extractedData?: string; // JSON string
  aiSummary?: string;
  aiRecommendations?: string;
  status: DocumentAnalysisStatus;
  createdAt: Date;
  completedAt?: Date;
}

// Datos extraídos de presupuesto
export interface BudgetExtractedData {
  lineItems: Array<{
    concept: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  dates?: {
    issued?: string;
    validUntil?: string;
  };
  parties?: {
    issuer?: {
      name: string;
      taxId?: string;
      address?: string;
    };
    recipient?: {
      name: string;
      taxId?: string;
      address?: string;
    };
  };
}

// Datos extraídos de contrato
export interface ContractExtractedData {
  parties: Array<{
    role: string;
    name: string;
    taxId?: string;
    address?: string;
  }>;
  dates: {
    startDate?: string;
    endDate?: string;
    signedDate?: string;
  };
  amounts: {
    total?: number;
    currency?: string;
    paymentTerms?: string;
  };
  keyClauses: Array<{
    title: string;
    content: string;
  }>;
}

// Datos extraídos de lista de productos
export interface ProductListExtractedData {
  products: Array<{
    name: string;
    reference?: string;
    sku?: string;
    description?: string;
    unit?: string;
    quantity?: number;
    price?: number;
    category?: string;
  }>;
  totalProducts: number;
  currency?: string;
}

// Labels para tipos de análisis
export const ANALYSIS_TYPE_LABELS: Record<DocumentAnalysisType, string> = {
  budget: 'Presupuesto',
  contract: 'Contrato',
  product_list: 'Lista de Productos',
  generic: 'Genérico',
};

// Labels para estados de análisis
export const ANALYSIS_STATUS_LABELS: Record<DocumentAnalysisStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

// Colores para estados de análisis
export const ANALYSIS_STATUS_COLORS: Record<DocumentAnalysisStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};
