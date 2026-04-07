import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import {
  calculatePaymentEligibility,
  approvePaymentPhase,
  markPhaseAsPaid
} from '@/lib/subcontractor-service'

// GET - Detalles de fase de pago
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const phase = await db.subcontractorPaymentPhase.findUnique({
      where: { id },
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
      return NextResponse.json(
        { error: 'Fase de pago no encontrada' },
        { status: 404 }
      )
    }

    // Verificar elegibilidad de pago
    const eligibility = await calculatePaymentEligibility(id)

    return NextResponse.json({
      phase,
      paymentEligibility: eligibility
    })
  } catch (error) {
    console.error('Error fetching payment phase:', error)
    return NextResponse.json(
      { error: 'Error al obtener fase de pago' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar estado de fase (validar, marcar pagada)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, startDate, completedDate, validatedById, validationComments, paymentReference } = body

    const phase = await db.subcontractorPaymentPhase.findUnique({
      where: { id }
    })

    if (!phase) {
      return NextResponse.json(
        { error: 'Fase de pago no encontrada' },
        { status: 404 }
      )
    }

    // Obtener usuario actual
    const user = await db.user.findFirst({
      where: { email: session.user.email || '' }
    })

    let result

    switch (action) {
      case 'start':
        // Iniciar fase
        result = await db.subcontractorPaymentPhase.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            startDate: startDate ? new Date(startDate) : new Date()
          }
        })
        break

      case 'complete':
        // Completar fase
        result = await db.subcontractorPaymentPhase.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedDate: completedDate ? new Date(completedDate) : new Date()
          }
        })
        break

      case 'validate':
        // Validar fase (aprobar)
        const approvalResult = await approvePaymentPhase(
          id,
          user?.id || 'unknown',
          validationComments
        )
        if (!approvalResult.success) {
          return NextResponse.json(
            { error: approvalResult.error },
            { status: 400 }
          )
        }
        result = await db.subcontractorPaymentPhase.findUnique({
          where: { id }
        })
        break

      case 'pay':
        // Marcar como pagada
        if (!paymentReference) {
          return NextResponse.json(
            { error: 'Se requiere referencia de pago' },
            { status: 400 }
          )
        }
        const paymentResult = await markPhaseAsPaid(id, paymentReference)
        if (!paymentResult.success) {
          return NextResponse.json(
            { error: paymentResult.error },
            { status: 400 }
          )
        }
        result = await db.subcontractorPaymentPhase.findUnique({
          where: { id }
        })
        break

      default:
        // Actualizacion generica
        const updateData: any = {}
        if (body.name !== undefined) updateData.name = body.name
        if (body.description !== undefined) updateData.description = body.description
        if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount
        if (body.paymentPercent !== undefined) updateData.paymentPercent = body.paymentPercent
        
        result = await db.subcontractorPaymentPhase.update({
          where: { id },
          data: updateData
        })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating payment phase:', error)
    return NextResponse.json(
      { error: 'Error al actualizar fase de pago' },
      { status: 500 }
    )
  }
}
