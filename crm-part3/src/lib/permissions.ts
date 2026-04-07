import { UserRole } from '@/types';

// Jerarquía de roles (mayor número = más permisos)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  TEAM_LEADER: 60,
  COMMERCIAL: 40,
  FRANCHISE: 40,
  REAL_ESTATE: 30,
  SUBCONTRACTOR: 20,
  WORKER: 20,
  CLIENT: 10,
};

/**
 * Verifica si un usuario tiene un rol con nivel igual o superior al requerido
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Verifica si un usuario tiene alguno de los roles especificados
 */
export function hasAnyRole(userRole: UserRole, roles: UserRole[]): boolean {
  return roles.includes(userRole);
}

/**
 * Verifica si el usuario es administrador o superior
 */
export function isAdmin(userRole: UserRole): boolean {
  return hasRole(userRole, 'ADMIN');
}

/**
 * Verifica si el usuario es super administrador
 */
export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'SUPER_ADMIN';
}

/**
 * Verifica si el usuario es líder de equipo o superior
 */
export function isTeamLeader(userRole: UserRole): boolean {
  return hasRole(userRole, 'TEAM_LEADER');
}

/**
 * Verifica si el usuario puede gestionar otros usuarios
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasRole(userRole, 'ADMIN');
}

/**
 * Verifica si el usuario puede ver todos los leads
 */
export function canViewAllLeads(userRole: UserRole): boolean {
  return hasRole(userRole, 'TEAM_LEADER');
}

/**
 * Verifica si el usuario puede asignar leads
 */
export function canAssignLeads(userRole: UserRole): boolean {
  return hasRole(userRole, 'TEAM_LEADER');
}

/**
 * Verifica si el usuario puede crear/editar obras
 */
export function canManageWorks(userRole: UserRole): boolean {
  return hasRole(userRole, 'TEAM_LEADER');
}

/**
 * Verifica si el usuario puede gestionar empresas
 */
export function canManageCompanies(userRole: UserRole): boolean {
  return hasRole(userRole, 'ADMIN');
}

/**
 * Verifica si el usuario puede acceder al dashboard completo
 */
export function canViewFullDashboard(userRole: UserRole): boolean {
  return hasRole(userRole, 'TEAM_LEADER');
}

/**
 * Verifica si el usuario puede ver estadísticas de otros
 */
export function canViewOthersStats(userRole: UserRole): boolean {
  return hasRole(userRole, 'TEAM_LEADER');
}

/**
 * Permisos por rol para cada módulo
 */
export const PERMISSIONS = {
  // Módulo de Usuarios
  USERS_VIEW: ['SUPER_ADMIN', 'ADMIN'],
  USERS_CREATE: ['SUPER_ADMIN', 'ADMIN'],
  USERS_EDIT: ['SUPER_ADMIN', 'ADMIN'],
  USERS_DELETE: ['SUPER_ADMIN'],
  
  // Módulo de Empresas
  COMPANIES_VIEW: ['SUPER_ADMIN', 'ADMIN'],
  COMPANIES_CREATE: ['SUPER_ADMIN', 'ADMIN'],
  COMPANIES_EDIT: ['SUPER_ADMIN', 'ADMIN'],
  COMPANIES_DELETE: ['SUPER_ADMIN'],
  
  // Módulo de Leads
  LEADS_VIEW_ALL: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'],
  LEADS_VIEW_OWN: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL', 'FRANCHISE'],
  LEADS_CREATE: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL'],
  LEADS_EDIT: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL'],
  LEADS_DELETE: ['SUPER_ADMIN', 'ADMIN'],
  LEADS_ASSIGN: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'],
  
  // Módulo de Obras
  WORKS_VIEW_ALL: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'],
  WORKS_VIEW_OWN: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL', 'SUBCONTRACTOR', 'WORKER'],
  WORKS_CREATE: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'],
  WORKS_EDIT: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'SUBCONTRACTOR'],
  WORKS_DELETE: ['SUPER_ADMIN', 'ADMIN'],
  
  // Módulo de Documentos
  DOCUMENTS_VIEW: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL', 'SUBCONTRACTOR'],
  DOCUMENTS_UPLOAD: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL', 'SUBCONTRACTOR'],
  DOCUMENTS_DELETE: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'],
  
  // Módulo de Presupuestos
  BUDGETS_VIEW: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL'],
  BUDGETS_CREATE: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL'],
  BUDGETS_EDIT: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'],
  BUDGETS_DELETE: ['SUPER_ADMIN', 'ADMIN'],
  
  // Módulo de Dashboard
  DASHBOARD_FULL: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'],
  DASHBOARD_OWN: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'COMMERCIAL'],
  
  // Configuración del Sistema
  SETTINGS_VIEW: ['SUPER_ADMIN', 'ADMIN'],
  SETTINGS_EDIT: ['SUPER_ADMIN', 'ADMIN'],
  
  // Notificaciones
  NOTIFICATIONS_MANAGE: ['SUPER_ADMIN', 'ADMIN'],
} as const;

/**
 * Verifica si un usuario tiene permiso para una acción específica
 */
export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole as any);
}

/**
 * Obtiene los roles que puede gestionar un usuario
 */
export function getManageableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case 'SUPER_ADMIN':
      return ['ADMIN', 'TEAM_LEADER', 'COMMERCIAL', 'FRANCHISE', 'REAL_ESTATE', 'SUBCONTRACTOR', 'WORKER', 'CLIENT'];
    case 'ADMIN':
      return ['TEAM_LEADER', 'COMMERCIAL', 'FRANCHISE', 'REAL_ESTATE', 'SUBCONTRACTOR', 'WORKER', 'CLIENT'];
    case 'TEAM_LEADER':
      return ['COMMERCIAL', 'WORKER'];
    default:
      return [];
  }
}
