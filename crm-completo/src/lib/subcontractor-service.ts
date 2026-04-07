/**
 * Servicio de Subcontratas - Módulo Avanzado
 * 
 * Este servicio implementa las reglas de negocio críticas:
 * 1. SIN VALIDACIÓN → NO SE PUEDE PAGAR
 * 2. ANTICIPOS CON GARANTÍA
 * 3. FACTURAS CONTROLADAS
 * 4. PENALIZACIONES AUTOMÁTICAS
 * 5. RANKING DINÁMICO
 */

import { db } from './db'

// Tipos
export type PhaseStatusType = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VALIDATED' | 'PAID'
export type GuaranteeType = 'BANK_GUARANTEE' | 'SURETY_INSURANCE' | 'PROMISSORY_NOTE' | 'NONE'
export type ContractStatusType = 'DRAFT' | 'PENDING_SIGN' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type PenaltyTypeType = 'DELAY' | 'INACTIVITY' | 'BREACH' | 'QUALITY'
export type TaskStatusType = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VALIDATED' | 'REJECTED'

// Interfaces
interface PaymentEligibilityResult {
  eligible: boolean
  reasons: string[]
  warnings: string[]
}

interface PenaltyCalculation {
  type: PenaltyTypeType
  amount: number
  days?: number
  reason: string
}

interface ValidationResult {
  isValid: boolean
  missingEvidences: string[]
  incompleteChecklist: string[]
}

interface RankingUpdate {
  newRating: number
  newOnTimeRate: number
  newQualityScore: number
  worksCompleted: number
  totalWorks: number
}

/**
 * Verificar si una fase de pago puede ser pagada
 * REGLA: Una fase solo puede marcarse como PAGADA si primero pasó por VALIDATED
 */
export async function calculatePaymentEligibility(phaseId: string): Promise<PaymentEligibilityResult> {
  const result: PaymentEligibilityResult = {
    eligible: false,
    reasons: [],
    warnings: []
  }

  try {
    const phase = await db.subcontractorPaymentPhase.findUnique({
      where: { id: phaseId },
      include: {
        subcontractor: true,
        work: true,
        task: {
          include: {
            evidences: true,
            validations: true
          }
        }
      }
    })

    if (!phase) {
      result.reasons.push('Fase de pago no encontrada')
      return result
    }

    // Verificar estado de la fase
    if (phase.status !== 'VALIDATED') {
      result.reasons.push(`La fase debe estar VALIDADA. Estado actual: ${phase.status}`)
    }

    // Verificar que existe una validación
    if (phase.task) {
      const approvedValidations = phase.task.validations.filter(v => v.status === 'approved')
      if (approvedValidations.length === 0) {
        result.reasons.push('No existe una validación aprobada para la tarea asociada')
      }
    }

    // Verificar que la subcontrata está activa
    if (!phase.subcontractor.isActive) {
      result.reasons.push('La subcontrata no está activa')
    }

    // Verificar documentación de la subcontrata
    if (phase.subcontractor.insuranceExpiration && new Date() > phase.subcontractor.insuranceExpiration) {
      result.warnings.push('El seguro de responsabilidad civil de la subcontrata ha expirado')
    }

    // Verificar si hay penalizaciones pendientes
    const pendingPenalties = await db.subcontractorPenalty.count({
      where: {
        subcontractorId: phase.subcontractorId,
        isApplied: false,
        isDisputed: false
      }
    })

    if (pendingPenalties > 0) {
      result.warnings.push(`Hay ${pendingPenalties} penalizaciones pendientes de aplicar`)
    }

    result.eligible = result.reasons.length === 0
    return result
  } catch (error) {
    result.reasons.push('Error al verificar elegibilidad de pago')
    console.error('Error in calculatePaymentEligibility:', error)
    return result
  }
}

/**
 * Aplicar penalizaciones automáticas
 * REGLA: Si hay retraso, aplicar automáticamente la penalización configurada en el contrato
 */
export async function applyAutomaticPenalties(taskId: string): Promise<PenaltyCalculation[]> {
  const penalties: PenaltyCalculation[] = []

  try {
    const task = await db.subcontractorTask.findUnique({
      where: { id: taskId },
      include: {
        subcontractor: {
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        work: true
      }
    })

    if (!task || !task.estimatedEndDate) {
      return penalties
    }

    const contract = task.subcontractor.contracts[0]
    const now = new Date()
    const estimatedEnd = new Date(task.estimatedEndDate)
    
    // Verificar retraso
    if (now > estimatedEnd && task.status !== 'COMPLETED' && task.status !== 'VALIDATED') {
      const daysDelayed = Math.ceil((now.getTime() - estimatedEnd.getTime()) / (1000 * 60 * 60 * 24))
      
      if (contract?.delayPenaltyPerDay && contract.delayPenaltyPerDay > 0) {
        penalties.push({
          type: 'DELAY',
          amount: contract.delayPenaltyPerDay * daysDelayed,
          days: daysDelayed,
          reason: `Retraso de ${daysDelayed} días en la tarea "${task.title}"`
        })
      }
    }

    // Aplicar penalizaciones encontradas
    for (const penalty of penalties) {
      await db.subcontractorPenalty.create({
        data: {
          subcontractorId: task.subcontractorId,
          workId: task.workId,
          taskId: taskId,
          contractId: contract?.id,
          type: penalty.type,
          reason: penalty.reason,
          amount: penalty.amount,
          days: penalty.days,
          isApplied: true,
          appliedAt: new Date()
        }
      })

      // Actualizar totales en el perfil
      await db.subcontractorProfile.update({
        where: { id: task.subcontractorId },
        data: {
          totalPenalties: { increment: penalty.amount },
          penaltyCount: { increment: 1 }
        }
      })
    }

    return penalties
  } catch (error) {
    console.error('Error applying automatic penalties:', error)
    return penalties
  }
}

/**
 * Generar factura desde fases validadas
 * REGLA: Las facturas SOLO se pueden generar desde fases validadas, no manualmente
 */
export async function generateInvoiceFromPhases(
  subcontractorId: string,
  phaseIds: string[],
  generatedById: string
): Promise<{ success: boolean; invoice?: any; error?: string }> {
  try {
    // Verificar que todas las fases están validadas
    const phases = await db.subcontractorPaymentPhase.findMany({
      where: {
        id: { in: phaseIds },
        subcontractorId,
        status: 'VALIDATED'
      },
      include: {
        subcontractor: true,
        work: true
      }
    })

    if (phases.length !== phaseIds.length) {
      return {
        success: false,
        error: 'Algunas fases no existen o no están validadas'
      }
    }

    // Calcular totales
    const subtotal = phases.reduce((sum, phase) => sum + phase.totalAmount, 0)
    const taxRate = 21 // IVA España
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax

    // Verificar penalizaciones para descontar
    const pendingPenalties = await db.subcontractorPenalty.findMany({
      where: {
        subcontractorId,
        isApplied: true,
        isDisputed: false
      }
    })
    
    const penaltiesDeducted = pendingPenalties.reduce((sum, p) => sum + p.amount, 0)

    // Generar número de factura
    const year = new Date().getFullYear()
    const count = await db.subcontractorInvoice.count({
      where: {
        subcontractorId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    })
    const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(4, '0')}`

    // Crear factura
    const invoice = await db.subcontractorInvoice.create({
      data: {
        subcontractorId,
        workId: phases[0]?.workId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        subtotal,
        tax,
        taxRate,
        total: total - penaltiesDeducted,
        penaltiesDeducted,
        generatedFromPhases: JSON.stringify(phaseIds),
        status: 'pending'
      }
    })

    // Marcar penalizaciones como aplicadas a un pago
    await db.subcontractorPenalty.updateMany({
      where: {
        subcontractorId,
        isApplied: true,
        isDisputed: false
      },
      data: {
        appliedToPaymentId: invoice.id
      }
    })

    return { success: true, invoice }
  } catch (error) {
    console.error('Error generating invoice:', error)
    return { success: false, error: 'Error al generar la factura' }
  }
}

/**
 * Actualizar ranking de subcontrata
 * REGLA: El ranking se actualiza automáticamente con cada obra completada/validada
 */
export async function updateSubcontractorRanking(subcontractorId: string): Promise<RankingUpdate> {
  try {
    // Obtener estadísticas de tareas completadas
    const tasks = await db.subcontractorTask.findMany({
      where: {
        subcontractorId,
        status: { in: ['COMPLETED', 'VALIDATED'] }
      },
      include: {
        validations: true
      }
    })

    const totalWorks = tasks.length
    const completedWorks = tasks.filter(t => t.status === 'VALIDATED').length

    // Calcular cumplimiento de plazos
    const tasksWithDates = tasks.filter(t => t.estimatedEndDate && t.completedAt)
    const onTimeTasks = tasksWithDates.filter(t => 
      new Date(t.completedAt!) <= new Date(t.estimatedEndDate!)
    )
    const onTimeRate = tasksWithDates.length > 0 
      ? (onTimeTasks.length / tasksWithDates.length) * 100 
      : 0

    // Calcular calidad promedio
    const validatedTasks = tasks.filter(t => t.validations.length > 0)
    let qualityScore = 0
    if (validatedTasks.length > 0) {
      const qualityScores = validatedTasks.map(t => {
        const checklist = t.validations[0]?.checklistResults
        if (checklist) {
          try {
            const items = JSON.parse(checklist)
            const passed = items.filter((i: any) => i.passed).length
            return items.length > 0 ? (passed / items.length) * 5 : 0
          } catch {
            return 0
          }
        }
        return 0
      })
      qualityScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    }

    // Calcular rating general
    const rating = (onTimeRate / 20 + qualityScore) / 2 // Promedio ponderado

    // Actualizar perfil
    await db.subcontractorProfile.update({
      where: { id: subcontractorId },
      data: {
        rating: Math.min(5, Math.max(0, rating)),
        totalWorks,
        completedWorks,
        onTimeRate,
        qualityScore
      }
    })

    // Registrar en historial
    const period = new Date().toISOString().slice(0, 7) // YYYY-MM
    await db.subcontractorRankingHistory.create({
      data: {
        subcontractorId,
        period,
        periodType: 'monthly',
        worksCompleted: completedWorks,
        worksOnTime: onTimeTasks.length,
        averageQuality: qualityScore,
        score: rating
      }
    })

    return {
      newRating: rating,
      newOnTimeRate: onTimeRate,
      newQualityScore: qualityScore,
      worksCompleted: completedWorks,
      totalWorks
    }
  } catch (error) {
    console.error('Error updating subcontractor ranking:', error)
    return {
      newRating: 0,
      newOnTimeRate: 0,
      newQualityScore: 0,
      worksCompleted: 0,
      totalWorks: 0
    }
  }
}

/**
 * Validar que una tarea tiene todas las evidencias necesarias
 */
export async function validateTaskComplete(taskId: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    missingEvidences: [],
    incompleteChecklist: []
  }

  try {
    const task = await db.subcontractorTask.findUnique({
      where: { id: taskId },
      include: {
        evidences: true,
        work: true
      }
    })

    if (!task) {
      result.isValid = false
      return result
    }

    // Verificar que tiene al menos una foto
    const photos = task.evidences.filter(e => e.type === 'photo')
    if (photos.length === 0) {
      result.missingEvidences.push('Se requiere al menos una foto de evidencia')
      result.isValid = false
    }

    // Verificar progreso
    if (task.progress < 100) {
      result.incompleteChecklist.push(`Progreso actual: ${task.progress}%. Debe ser 100% para completar`)
      result.isValid = false
    }

    // Verificar que tiene fecha de inicio
    if (!task.startDate) {
      result.missingEvidences.push('La tarea no tiene fecha de inicio registrada')
    }

    return result
  } catch (error) {
    console.error('Error validating task:', error)
    result.isValid = false
    return result
  }
}

/**
 * Verificar si un anticipo puede ser aprobado
 * REGLA: Los anticipos requieren garantía para ser aprobados
 */
export async function verifyAdvanceEligibility(
  advanceId: string
): Promise<{ eligible: boolean; reasons: string[] }> {
  const result = { eligible: true, reasons: [] as string[] }

  try {
    const advance = await db.subcontractorAdvance.findUnique({
      where: { id: advanceId },
      include: { subcontractor: true }
    })

    if (!advance) {
      result.eligible = false
      result.reasons.push('Anticipo no encontrado')
      return result
    }

    // Verificar garantía
    if (advance.guaranteeType === 'NONE') {
      result.eligible = false
      result.reasons.push('Se requiere una garantía (aval, seguro o pagaré) para aprobar el anticipo')
    }

    // Verificar documento de garantía
    if (!advance.guaranteeDocument) {
      result.eligible = false
      result.reasons.push('Se debe adjuntar el documento de garantía')
    }

    // Verificar que no excede el máximo permitido
    const maxPercent = advance.subcontractor.maxAdvancePercent || 10
    if (advance.percent > maxPercent) {
      result.eligible = false
      result.reasons.push(`El anticipo excede el máximo permitido (${maxPercent}%)`)
    }

    // Verificar que la garantía no ha expirado
    if (advance.guaranteeExpiration && new Date() > advance.guaranteeExpiration) {
      result.eligible = false
      result.reasons.push('La garantía ha expirado')
    }

    return result
  } catch (error) {
    console.error('Error verifying advance eligibility:', error)
    return { eligible: false, reasons: ['Error al verificar elegibilidad'] }
  }
}

/**
 * Aprobar una fase de pago (transición a VALIDATED)
 */
export async function approvePaymentPhase(
  phaseId: string,
  validatedById: string,
  comments?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const phase = await db.subcontractorPaymentPhase.findUnique({
      where: { id: phaseId }
    })

    if (!phase) {
      return { success: false, error: 'Fase de pago no encontrada' }
    }

    // Verificar que está completada
    if (phase.status !== 'COMPLETED') {
      return { success: false, error: 'La fase debe estar completada antes de validarse' }
    }

    // Actualizar fase
    await db.subcontractorPaymentPhase.update({
      where: { id: phaseId },
      data: {
        status: 'VALIDATED',
        validatedDate: new Date(),
        validatedById,
        validationComments: comments
      }
    })

    // Actualizar ranking de la subcontrata
    if (phase.subcontractorId) {
      await updateSubcontractorRanking(phase.subcontractorId)
    }

    return { success: true }
  } catch (error) {
    console.error('Error approving payment phase:', error)
    return { success: false, error: 'Error al aprobar la fase de pago' }
  }
}

/**
 * Marcar fase como pagada
 * REGLA: Solo se puede pagar si está VALIDATED
 */
export async function markPhaseAsPaid(
  phaseId: string,
  paymentReference: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar elegibilidad
    const eligibility = await calculatePaymentEligibility(phaseId)
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reasons.join('. ') }
    }

    // Actualizar fase
    await db.subcontractorPaymentPhase.update({
      where: { id: phaseId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentReference
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error marking phase as paid:', error)
    return { success: false, error: 'Error al marcar como pagada' }
  }
}

/**
 * Obtener estadísticas del dashboard de subcontratas
 */
export async function getSubcontractorDashboardStats(companyId?: string) {
  try {
    const whereClause = companyId ? { companyId } : {}

    const [
      totalSubcontractors,
      activeSubcontractors,
      pendingTasks,
      pendingValidations,
      pendingPayments,
      totalPenaltiesAmount,
      topSubcontractors
    ] = await Promise.all([
      // Total de subcontratas
      db.subcontractorProfile.count({
        where: whereClause
      }),
      // Subcontratas activas
      db.subcontractorProfile.count({
        where: { ...whereClause, isActive: true }
      }),
      // Tareas pendientes
      db.subcontractorTask.count({
        where: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
        }
      }),
      // Validaciones pendientes
      db.subcontractorTask.count({
        where: { status: 'COMPLETED' }
      }),
      // Pagos pendientes
      db.subcontractorPaymentPhase.count({
        where: { status: 'VALIDATED' }
      }),
      // Total penalizaciones
      db.subcontractorPenalty.aggregate({
        where: { isApplied: true },
        _sum: { amount: true }
      }),
      // Top subcontratas por rating
      db.subcontractorProfile.findMany({
        where: { ...whereClause, isActive: true },
        orderBy: { rating: 'desc' },
        take: 5,
        include: {
          tasks: {
            where: { status: 'VALIDATED' },
            select: { id: true }
          }
        }
      })
    ])

    return {
      totalSubcontractors,
      activeSubcontractors,
      pendingTasks,
      pendingValidations,
      pendingPayments,
      totalPenaltiesAmount: totalPenaltiesAmount._sum.amount || 0,
      topSubcontractors: topSubcontractors.map(s => ({
        id: s.id,
        businessName: s.businessName,
        specialty: s.specialty,
        rating: s.rating,
        completedWorks: s.tasks.length
      }))
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      totalSubcontractors: 0,
      activeSubcontractors: 0,
      pendingTasks: 0,
      pendingValidations: 0,
      pendingPayments: 0,
      totalPenaltiesAmount: 0,
      topSubcontractors: []
    }
  }
}

/**
 * Crear contrato con cláusulas por defecto
 */
export async function createContractWithDefaults(
  subcontractorId: string,
  data: {
    title: string
    totalAmount: number
    startDate: Date
    endDate?: Date
    workId?: string
    taskId?: string
    templateId?: string
  }
) {
  try {
    let defaultClauses: any = {}
    let defaultPenalties = {
      delayPenaltyPerDay: 0,
      inactivityPenalty: 0,
      breachPenalty: 0
    }

    // Si hay plantilla, obtener valores por defecto
    if (data.templateId) {
      const template = await db.contractTemplate.findUnique({
        where: { id: data.templateId }
      })
      if (template) {
        if (template.clauses) {
          defaultClauses = JSON.parse(template.clauses)
        }
        defaultPenalties = {
          delayPenaltyPerDay: template.defaultDelayPenalty || 0,
          inactivityPenalty: template.defaultInactivityPenalty || 0,
          breachPenalty: template.defaultBreachPenalty || 0
        }
      }
    }

    // Generar número de contrato
    const year = new Date().getFullYear()
    const count = await db.subcontractorContract.count({
      where: {
        subcontractorId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    })
    const contractNumber = `CON-${year}-${String(count + 1).padStart(4, '0')}`

    // Crear contrato
    const contract = await db.subcontractorContract.create({
      data: {
        subcontractorId,
        workId: data.workId,
        taskId: data.taskId,
        contractNumber,
        title: data.title,
        totalAmount: data.totalAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        clauses: JSON.stringify(defaultClauses),
        delayPenaltyPerDay: defaultPenalties.delayPenaltyPerDay,
        inactivityPenalty: defaultPenalties.inactivityPenalty,
        breachPenalty: defaultPenalties.breachPenalty,
        status: 'DRAFT'
      }
    })

    return { success: true, contract }
  } catch (error) {
    console.error('Error creating contract:', error)
    return { success: false, error: 'Error al crear el contrato' }
  }
}

/**
 * Firmar contrato
 */
export async function signContract(
  contractId: string,
  signerType: 'subcontractor' | 'company',
  signerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const contract = await db.subcontractorContract.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return { success: false, error: 'Contrato no encontrado' }
    }

    const updateData: any = {}

    if (signerType === 'subcontractor') {
      updateData.signedBySubcontractor = true
      updateData.signedBySubcontractorAt = new Date()
    } else {
      updateData.signedByCompany = true
      updateData.signedByCompanyAt = new Date()
      updateData.signedByCompanyId = signerId
    }

    // Si ambas partes firman, cambiar estado a SIGNED
    const updatedContract = await db.subcontractorContract.update({
      where: { id: contractId },
      data: updateData
    })

    if (updatedContract.signedBySubcontractor && updatedContract.signedByCompany) {
      await db.subcontractorContract.update({
        where: { id: contractId },
        data: { status: 'SIGNED' }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error signing contract:', error)
    return { success: false, error: 'Error al firmar el contrato' }
  }
}
