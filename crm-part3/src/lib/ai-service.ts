// Servicio de IA para scoring y predicciones
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Factores de scoring
const SCORING_WEIGHTS = {
  engagement: 0.25,   // Interacción con el lead
  budget: 0.20,       // Presupuesto del cliente
  timing: 0.15,       // Timing de la compra
  source: 0.15,       // Fuente del lead
  profile: 0.25,      // Perfil del cliente
};

// Puntuación por fuente
const SOURCE_SCORES: Record<string, number> = {
  REFERRAL: 90,       // Recomendación - muy valioso
  FAIR: 80,           // Feria - interés demostrado
  WEB: 70,            // Web propia - interés activo
  GOOGLE: 65,         // Google Ads - intención de búsqueda
  REAL_ESTATE: 60,    // Inmobiliaria - partnership
  FACEBOOK: 50,       // Facebook - descubrimiento
  INSTAGRAM: 50,      // Instagram - descubrimiento
  COLD_CALL: 40,      // Llamada en frío
  OTHER: 50,
};

// Puntuación por tipo
const TYPE_SCORES: Record<string, number> = {
  NEW_BUILD: 80,      // Obra nueva - alto valor
  REFORM: 70,         // Reforma - valor medio-alto
  INVESTMENT: 85,     // Inversión - alta probabilidad
  FRANCHISE: 60,      // Franquicia - largo ciclo
  OTHER: 50,
};

/**
 * Servicio de IA para Lead Scoring
 */
export class LeadScoringService {
  /**
   * Calcula el score completo de un lead
   */
  static async calculateLeadScore(leadId: string): Promise<{
    overallScore: number;
    probabilityToClose: number;
    scores: {
      engagement: number;
      budget: number;
      timing: number;
      source: number;
      profile: number;
    };
    predictions: {
      predictedCloseDate: Date | null;
      predictedValue: number | null;
    };
    recommendations: string[];
  }> {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        comments: { orderBy: { createdAt: 'desc' }, take: 10 },
        budgets: true,
      },
    });

    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    // Calcular scores individuales
    const engagement = this.calculateEngagementScore(lead);
    const budget = this.calculateBudgetScore(lead);
    const timing = this.calculateTimingScore(lead);
    const source = this.calculateSourceScore(lead);
    const profile = this.calculateProfileScore(lead);

    // Score ponderado
    const overallScore = Math.round(
      engagement * SCORING_WEIGHTS.engagement +
      budget * SCORING_WEIGHTS.budget +
      timing * SCORING_WEIGHTS.timing +
      source * SCORING_WEIGHTS.source +
      profile * SCORING_WEIGHTS.profile
    );

    // Probabilidad de cierre
    const probabilityToClose = overallScore / 100;

    // Predicciones
    const predictedCloseDate = this.predictCloseDate(lead, overallScore);
    const predictedValue = this.predictValue(lead);

    // Recomendaciones
    const recommendations = this.generateRecommendations(lead, {
      engagement,
      budget,
      timing,
      source,
      profile,
    });

    // Guardar en base de datos
    await db.leadScore.upsert({
      where: { leadId },
      create: {
        leadId,
        overallScore,
        probabilityToClose,
        engagementScore: engagement,
        budgetScore: budget,
        timingScore: timing,
        sourceScore: source,
        profileScore: profile,
        predictedCloseDate,
        predictedValue,
        recommendations: JSON.stringify(recommendations),
      },
      update: {
        overallScore,
        probabilityToClose,
        engagementScore: engagement,
        budgetScore: budget,
        timingScore: timing,
        sourceScore: source,
        profileScore: profile,
        predictedCloseDate,
        predictedValue,
        recommendations: JSON.stringify(recommendations),
        lastCalculated: new Date(),
      },
    });

    return {
      overallScore,
      probabilityToClose,
      scores: { engagement, budget, timing, source, profile },
      predictions: { predictedCloseDate, predictedValue },
      recommendations,
    };
  }

  /**
   * Score de engagement (interacción)
   */
  private static calculateEngagementScore(lead: any): number {
    let score = 50; // Base

    // Actividades recientes
    const recentActivities = lead.activities?.filter(
      (a: any) => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length || 0;

    score += Math.min(recentActivities * 5, 25);

    // Comentarios
    const comments = lead.comments?.length || 0;
    score += Math.min(comments * 3, 15);

    // Presupuestos solicitados
    const budgets = lead.budgets?.length || 0;
    score += Math.min(budgets * 10, 20);

    // Penalización por inactividad
    const lastActivity = lead.activities?.[0]?.createdAt;
    if (lastActivity) {
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastActivity > 14) score -= 20;
      else if (daysSinceLastActivity > 7) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score de presupuesto
   */
  private static calculateBudgetScore(lead: any): number {
    let score = 50;

    // Valor estimado
    if (lead.estimatedValue) {
      if (lead.estimatedValue >= 200000) score = 90;
      else if (lead.estimatedValue >= 100000) score = 75;
      else if (lead.estimatedValue >= 50000) score = 60;
      else score = 50;
    }

    // Presupuesto definido por cliente
    if (lead.budgetMin && lead.budgetMax) {
      score += 10;
    }

    // Probabilidad indicada
    if (lead.probability) {
      score = Math.round(score * 0.5 + lead.probability * 0.5);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score de timing
   */
  private static calculateTimingScore(lead: any): number {
    let score = 50;

    // Fecha preferida de inicio
    if (lead.preferredStartDate) {
      const daysUntilStart = Math.floor(
        (new Date(lead.preferredStartDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilStart > 0 && daysUntilStart < 30) score = 90;
      else if (daysUntilStart >= 30 && daysUntilStart < 90) score = 70;
      else if (daysUntilStart >= 90) score = 50;
      else score = 40; // Fecha pasada
    }

    // Deadline
    if (lead.deadline) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score de fuente
   */
  private static calculateSourceScore(lead: any): number {
    return SOURCE_SCORES[lead.source] || 50;
  }

  /**
   * Score de perfil
   */
  private static calculateProfileScore(lead: any): number {
    let score = 50;

    // Información completa
    if (lead.email) score += 10;
    if (lead.phone) score += 10;
    if (lead.city) score += 5;
    if (lead.address) score += 5;

    // Tipo de proyecto
    score = Math.round(score * 0.7 + (TYPE_SCORES[lead.type] || 50) * 0.3);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Predecir fecha de cierre
   */
  private static predictCloseDate(lead: any, score: number): Date | null {
    if (score >= 80) {
      // Cierre probable en 2-4 semanas
      return new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    } else if (score >= 60) {
      // Cierre en 1-2 meses
      return new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    } else if (score >= 40) {
      // Cierre en 2-3 meses
      return new Date(Date.now() + 75 * 24 * 60 * 60 * 1000);
    }
    return null;
  }

  /**
   * Predecir valor de cierre
   */
  private static predictValue(lead: any): number | null {
    if (lead.estimatedValue) {
      // Ajustar según probabilidad
      const adjustment = (lead.probability || 50) / 100;
      return lead.estimatedValue * (0.9 + adjustment * 0.2);
    }
    return null;
  }

  /**
   * Generar recomendaciones
   */
  private static generateRecommendations(lead: any, scores: Record<string, number>): string[] {
    const recommendations: string[] = [];

    if (scores.engagement < 50) {
      recommendations.push('Aumentar la frecuencia de contacto con el lead');
    }

    if (scores.budget < 50) {
      recommendations.push('Verificar el presupuesto real del cliente');
    }

    if (scores.timing < 50 && !lead.preferredStartDate) {
      recommendations.push('Preguntar por la fecha deseada de inicio');
    }

    if (!lead.email) {
      recommendations.push('Obtener email del cliente para seguimiento');
    }

    if (lead.activities?.length < 3) {
      recommendations.push('Programar una visita o reunión presencial');
    }

    if (lead.type === 'INVESTMENT' && scores.source >= 70) {
      recommendations.push('Lead de alta calidad - priorizar seguimiento');
    }

    return recommendations;
  }

  /**
   * Obtener resumen de IA para un lead
   */
  static async getLeadInsight(leadId: string): Promise<string> {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: true,
        comments: true,
        score: true,
      },
    });

    if (!lead) return 'Lead no encontrado';

    const score = lead.score?.overallScore || 0;
    const probability = lead.score?.probabilityToClose || 0;

    let insight = `**Análisis del Lead: ${lead.firstName} ${lead.lastName}**\n\n`;
    insight += `📊 **Score General:** ${score}/100\n`;
    insight += `🎯 **Probabilidad de Cierre:** ${(probability * 100).toFixed(0)}%\n\n`;

    if (score >= 80) {
      insight += '🔥 **Lead MUY CALIENTE** - Prioridad máxima\n';
    } else if (score >= 60) {
      insight += '☀️ **Lead CALIENTE** - Buenas posibilidades\n';
    } else if (score >= 40) {
      insight += '🌤️ **Lead TIBIO** - Necesita más seguimiento\n';
    } else {
      insight += '❄️ **Lead FRÍO** - Requiere estrategia especial\n';
    }

    if (lead.score?.recommendations) {
      const recs = JSON.parse(lead.score.recommendations);
      if (recs.length > 0) {
        insight += '\n**Recomendaciones:**\n';
        recs.forEach((r: string, i: number) => {
          insight += `${i + 1}. ${r}\n`;
        });
      }
    }

    return insight;
  }

  /**
   * Asistente IA para preguntas
   */
  static async askQuestion(question: string, context?: { userId: string; companyId: string }): Promise<string> {
    try {
      const zai = await ZAI.create();

      // Obtener contexto de la empresa si está disponible
      let contextData = '';
      if (context) {
        const [leads, works, users] = await Promise.all([
          db.lead.count({ where: { companyId: context.companyId } }),
          db.work.count({ where: { companyId: context.companyId } }),
          db.user.count({ where: { companyId: context.companyId, isActive: true } }),
        ]);
        contextData = `\nContexto de la empresa: ${leads} leads, ${works} obras, ${users} usuarios activos.`;
      }

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de CRM para una empresa de construcción llamada "Casas Confortables".
            Ayudas a los comerciales y gestores con información sobre leads, obras, clientes y estrategias de venta.
            Responde de forma concisa y útil en español.${contextData}`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
      });

      return completion.choices[0]?.message?.content || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('Error en AI:', error);
      return 'Lo siento, hubo un error al procesar tu pregunta. Por favor, inténtalo de nuevo.';
    }
  }
}
