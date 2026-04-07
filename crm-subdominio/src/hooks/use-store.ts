import { create } from 'zustand';
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from '@/types';

// ==========================================
// STORE DE LEADS
// ==========================================

interface LeadsState {
  leads: Lead[];
  selectedLead: Lead | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: LeadStatus | '';
    type: string;
    source: string;
    assignedToId: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Acciones
  setLeads: (leads: Lead[]) => void;
  setSelectedLead: (lead: Lead | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<LeadsState['filters']>) => void;
  setPagination: (pagination: Partial<LeadsState['pagination']>) => void;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  addLead: (lead: Lead) => void;
  removeLead: (leadId: string) => void;
}

export const useLeadsStore = create<LeadsState>((set) => ({
  leads: [],
  selectedLead: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: '',
    type: '',
    source: '',
    assignedToId: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  
  setLeads: (leads) => set({ leads }),
  setSelectedLead: (lead) => set({ selectedLead: lead }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setPagination: (pagination) => set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
  updateLeadStatus: (leadId, status) => set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === leadId ? { ...lead, status } : lead
    ),
  })),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  removeLead: (leadId) => set((state) => ({
    leads: state.leads.filter((lead) => lead.id !== leadId),
  })),
}));

// ==========================================
// STORE DE UI
// ==========================================

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  leadModalOpen: boolean;
  leadDetailOpen: boolean;
  
  // Acciones
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setTheme: (theme: UIState['theme']) => void;
  setLeadModalOpen: (open: boolean) => void;
  setLeadDetailOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system',
  leadModalOpen: false,
  leadDetailOpen: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setLeadModalOpen: (leadModalOpen) => set({ leadModalOpen }),
  setLeadDetailOpen: (leadDetailOpen) => set({ leadDetailOpen }),
}));

// ==========================================
// STORE DE NOTIFICACIONES
// ==========================================

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationsState {
  notifications: Notification[];
  
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    
    // Auto-remove después de la duración
    if (notification.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, notification.duration || 5000);
    }
  },
  
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  
  clearAll: () => set({ notifications: [] }),
}));

// ==========================================
// STORE DE PIPELINE (KANBAN)
// ==========================================

interface PipelineState {
  columns: {
    id: LeadStatus;
    title: string;
    leads: Lead[];
  }[];
  
  setColumns: (columns: PipelineState['columns']) => void;
  moveLead: (leadId: string, fromStatus: LeadStatus, toStatus: LeadStatus) => void;
}

const initialColumns: PipelineState['columns'] = [
  { id: 'NEW', title: 'Nuevo', leads: [] },
  { id: 'CONTACTED', title: 'Contactado', leads: [] },
  { id: 'VISIT', title: 'Visita', leads: [] },
  { id: 'OFFER', title: 'Oferta', leads: [] },
  { id: 'NEGOTIATION', title: 'Negociación', leads: [] },
  { id: 'CLOSED', title: 'Cerrado', leads: [] },
  { id: 'LOST', title: 'Perdido', leads: [] },
];

export const usePipelineStore = create<PipelineState>((set) => ({
  columns: initialColumns,
  
  setColumns: (columns) => set({ columns }),
  
  moveLead: (leadId, fromStatus, toStatus) =>
    set((state) => {
      const newColumns = state.columns.map((column) => {
        if (column.id === fromStatus) {
          return {
            ...column,
            leads: column.leads.filter((lead) => lead.id !== leadId),
          };
        }
        if (column.id === toStatus) {
          const lead = state.columns
            .find((col) => col.id === fromStatus)
            ?.leads.find((l) => l.id === leadId);
          if (lead) {
            return {
              ...column,
              leads: [...column.leads, { ...lead, status: toStatus }],
            };
          }
        }
        return column;
      });
      return { columns: newColumns };
    }),
}));
