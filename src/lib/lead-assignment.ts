// Sistema de reparto automático de leads
import { db } from '@/lib/db';
import { AssignmentMethod } from '@/types';

interface AssignmentOptions {
  companyId: string;
  leadType?: string;
  zone?: string;
  method?: AssignmentMethod;
}

interface UserInfo {
  id: string;
  name: string;
  lastName: string | null;
  role: string;
  companyId: string | null;
  officeId: string | null;
  teamId: string | null;
  assignmentConfig?: {
    maxLeads: number;
    currentLeads: number;
    weight: number;
    isActive: boolean;
    zones: string | null;
    acceptedTypes: string | null;
  } | null;
  _count?: {
    assignedLeads: number;
  };
}

/**
 * Sistema de reparto automático de leads
 */
export class LeadAssignmentService {
  /**
   * Asigna un lead automáticamente según las reglas configuradas
   */
  static async assignLead(leadId: string, options: AssignmentOptions): Promise<string | null> {
    const { companyId, leadType, zone, method } = options;

    // 1. Verificar si hay reglas específicas para este lead
    const rules = await db.assignmentRule.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    // 2. Evaluar reglas en orden de prioridad
    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions || '{}');
      const matches = this.evaluateConditions(conditions, { leadType, zone });

      if (matches) {
        // Aplicar la regla
        if (rule.targetUserId) {
          return rule.targetUserId;
        }
        if (rule.targetTeamId) {
          // Distribuir dentro del equipo
          return this.distributeToTeam(rule.targetTeamId, method || rule.method);
        }
        if (rule.targetOfficeId) {
          // Distribuir dentro de la oficina
          return this.distributeToOffice(rule.targetOfficeId, method || rule.method);
        }
      }
    }

    // 3. Si no hay reglas, usar método por defecto de la empresa
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) return null;

    return this.distributeLead(companyId, method || company.assignmentMethod, { leadType, zone });
  }

  /**
   * Evalúa si las condiciones coinciden
   */
  private static evaluateConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) return false;
    }
    return true;
  }

  /**
   * Distribuye un lead usando el método especificado
   */
  private static async distributeLead(
    companyId: string,
    method: AssignmentMethod,
    filters: { leadType?: string; zone?: string }
  ): Promise<string | null> {
    switch (method) {
      case 'ROUND_ROBIN':
        return this.roundRobinAssignment(companyId);
      case 'BY_ZONE':
        return this.zoneAssignment(companyId, filters.zone);
      case 'BY_LOAD':
        return this.loadBasedAssignment(companyId);
      case 'BY_TYPE':
        return this.typeBasedAssignment(companyId, filters.leadType);
      default:
        return this.roundRobinAssignment(companyId);
    }
  }

  /**
   * Round Robin: Distribuye equitativamente entre todos los comerciales
   */
  private static async roundRobinAssignment(companyId: string): Promise<string | null> {
    // Obtener última asignación para continuar el ciclo
    const lastAssigned = await db.lead.findFirst({
      where: { companyId, assignedToId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { assignedToId: true },
    });

    // Obtener comerciales activos
    const commercials = await this.getAvailableCommercials(companyId);
    if (commercials.length === 0) return null;

    if (!lastAssigned?.assignedToId) {
      return commercials[0].id;
    }

    // Encontrar el índice del último asignado
    const lastIndex = commercials.findIndex(c => c.id === lastAssigned.assignedToId);
    const nextIndex = (lastIndex + 1) % commercials.length;

    return commercials[nextIndex].id;
  }

  /**
   * Por zona: Asigna al comercial responsable de la zona
   */
  private static async zoneAssignment(companyId: string, zone?: string | null): Promise<string | null> {
    if (!zone) return this.roundRobinAssignment(companyId);

    // Buscar comercial con la zona asignada
    const commercials = await this.getAvailableCommercials(companyId);

    for (const commercial of commercials) {
      if (commercial.assignmentConfig?.zones) {
        const zones = JSON.parse(commercial.assignmentConfig.zones);
        if (zones.includes(zone)) {
          return commercial.id;
        }
      }
    }

    // Si no hay comercial para la zona, usar Round Robin
    return this.roundRobinAssignment(companyId);
  }

  /**
   * Por carga de trabajo: Asigna al comercial con menos leads activos
   */
  private static async loadBasedAssignment(companyId: string): Promise<string | null> {
    const commercials = await this.getAvailableCommercials(companyId, true);

    if (commercials.length === 0) return null;

    // Ordenar por número de leads actuales
    const sorted = commercials.sort((a, b) => {
      const aLeads = a._count?.assignedLeads || 0;
      const bLeads = b._count?.assignedLeads || 0;
      return aLeads - bLeads;
    });

    // Verificar límite máximo
    for (const commercial of sorted) {
      const maxLeads = commercial.assignmentConfig?.maxLeads || 50;
      const currentLeads = commercial._count?.assignedLeads || 0;
      
      if (currentLeads < maxLeads) {
        return commercial.id;
      }
    }

    // Si todos están al máximo, asignar al que tiene menos
    return sorted[0].id;
  }

  /**
   * Por tipo de lead: Asigna según especialización del comercial
   */
  private static async typeBasedAssignment(companyId: string, leadType?: string | null): Promise<string | null> {
    if (!leadType) return this.roundRobinAssignment(companyId);

    const commercials = await this.getAvailableCommercials(companyId);

    // Buscar comerciales que aceptan este tipo
    for (const commercial of commercials) {
      if (commercial.assignmentConfig?.acceptedTypes) {
        const types = JSON.parse(commercial.assignmentConfig.acceptedTypes);
        if (types.includes(leadType)) {
          return commercial.id;
        }
      }
    }

    // Si no hay especialista, usar Round Robin
    return this.roundRobinAssignment(companyId);
  }

  /**
   * Distribuye dentro de un equipo
   */
  private static async distributeToTeam(teamId: string, method: AssignmentMethod): Promise<string | null> {
    const commercials = await db.user.findMany({
      where: {
        teamId,
        isActive: true,
        role: { in: ['COMMERCIAL', 'TEAM_LEADER'] },
      },
      include: {
        assignmentConfig: true,
        _count: { select: { assignedLeads: { where: { status: { notIn: ['CLOSED', 'LOST'] } } } } },
      },
    });

    if (commercials.length === 0) return null;

    // Aplicar el método de distribución
    if (method === 'BY_LOAD') {
      const sorted = commercials.sort((a, b) => (a._count.assignedLeads) - (b._count.assignedLeads));
      return sorted[0].id;
    }

    // Por defecto Round Robin
    return commercials[0].id;
  }

  /**
   * Distribuye dentro de una oficina
   */
  private static async distributeToOffice(officeId: string, method: AssignmentMethod): Promise<string | null> {
    const commercials = await db.user.findMany({
      where: {
        officeId,
        isActive: true,
        role: { in: ['COMMERCIAL', 'TEAM_LEADER'] },
      },
      include: {
        assignmentConfig: true,
        _count: { select: { assignedLeads: { where: { status: { notIn: ['CLOSED', 'LOST'] } } } } },
      },
    });

    if (commercials.length === 0) return null;

    if (method === 'BY_LOAD') {
      const sorted = commercials.sort((a, b) => (a._count.assignedLeads) - (b._count.assignedLeads));
      return sorted[0].id;
    }

    return commercials[0].id;
  }

  /**
   * Obtiene los comerciales disponibles para asignación
   */
  private static async getAvailableCommercials(companyId: string, withCount = false): Promise<UserInfo[]> {
    const commercials = await db.user.findMany({
      where: {
        companyId,
        isActive: true,
        role: { in: ['COMMERCIAL', 'TEAM_LEADER'] },
        OR: [
          { assignmentConfig: { isActive: true } },
          { assignmentConfig: null },
        ],
      },
      include: {
        assignmentConfig: true,
        _count: withCount ? {
          select: { assignedLeads: { where: { status: { notIn: ['CLOSED', 'LOST'] } } } }
        } : false,
      },
    });

    return commercials;
  }

  /**
   * Reasigna un lead a otro comercial
   */
  static async reassignLead(leadId: string, newUserId: string, reason?: string): Promise<void> {
    // Actualizar lead
    await db.lead.update({
      where: { id: leadId },
      data: { assignedToId: newUserId },
    });

    // Registrar actividad
    await db.leadActivity.create({
      data: {
        leadId,
        action: 'reassigned',
        description: reason || 'Lead reasignado',
      },
    });

    // Crear notificación
    await db.notification.create({
      data: {
        userId: newUserId,
        type: 'LEAD_ASSIGNED',
        title: 'Lead reasignado',
        message: `Se te ha asignado un nuevo lead`,
        referenceType: 'lead',
        referenceId: leadId,
      },
    });
  }

  /**
   * Obtiene estadísticas de asignación
   */
  static async getAssignmentStats(companyId: string): Promise<{
    totalCommercials: number;
    activeCommercials: number;
    avgLeadsPerCommercial: number;
    distribution: { userId: string; userName: string; leadsCount: number }[];
  }> {
    const commercials = await db.user.findMany({
      where: {
        companyId,
        isActive: true,
        role: { in: ['COMMERCIAL', 'TEAM_LEADER'] },
      },
      include: {
        _count: { select: { assignedLeads: { where: { status: { notIn: ['CLOSED', 'LOST'] } } } } },
      },
    });

    const activeCommercials = commercials.filter(c => c.assignmentConfig?.isActive !== false);
    const totalLeads = commercials.reduce((sum, c) => sum + (c._count.assignedLeads), 0);

    return {
      totalCommercials: commercials.length,
      activeCommercials: activeCommercials.length,
      avgLeadsPerCommercial: commercials.length > 0 ? Math.round(totalLeads / commercials.length) : 0,
      distribution: commercials.map(c => ({
        userId: c.id,
        userName: `${c.name} ${c.lastName || ''}`,
        leadsCount: c._count.assignedLeads,
      })),
    };
  }
}
