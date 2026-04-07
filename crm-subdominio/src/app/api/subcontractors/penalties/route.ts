import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { applyAutomaticPenalties } from '@/lib/subcontractor-service'

// GET - Listar penalizaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const subcontractorId = searchParams.get('subcontractorId')
    const type = searchParams.get('type')
    const isApplied = searchParams.get('isApplied')
    const isDisputed = searchParams.get('isDisputed')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (subcontractorId) where.subcontractorId = subcontractorId
    if (type) where.type = type
    if (isApplied !== null) where.isApplied = isApplied === 'true'
    if (isDisputed !== null) where.isDisputed = isDisputed === 'true'

    const [penalties, total] = await Promise.all([
      db.subcontractorPenalty.findMany({
        where,
        include: {
          subcontractor: {
            select: { id: true, businessName: true, specialty: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.subcontractorPenalty.count({ where })
    ])

    // Calcular totales
    const totalAmount = penalties.reduce((sum, p) => sum + p.amount, 0)
    const appliedAmount = penalties
      .filter(p => p.isApplied)
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      penalties,
      summary: {
        total,
        totalAmount,
        appliedAmount,
        pendingAmount: totalAmount - appliedAmount
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching penalties:', error)
    return NextResponse.json(
      { error: 'Error al obtener penalizaciones' },
      { status: 500 }
    )
  }
}

// POST - Aplicar penalización
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      subcontractorId,
      workId,
      taskId,
      contractId,
      type,
      reason,
      description,
      amount,
      days,
      action // 'create', 'apply', 'dispute', 'resolve_dispute'
    } = body

    if (action === 'apply' && body.penaltyId) {
      // Aplicar penalización existente
      const penalty = await db.subcontractorPenalty.update({
        where: { id: body.penaltyId },
        data: {
          isApplied: true,
          appliedAt: new Date()
        }
      })

      // Actualizar totales en el perfil
      await db.subcontractorProfile.update({
        where: { id: penalty.subcontractorId },
        data: {
          totalPenalties: { increment: penalty.amount },
          penaltyCount: { increment: 1 }
        }
      })

      return NextResponse.json(penalty)
    }

    if (action === 'dispute' && body.penaltyId) {
      // Disputar penalización
      const penalty = await db.subcontractorPenalty.update({
        where: { id: body.penaltyId },
        data: {
          isDisputed: true,
          disputeReason: body.disputeReason
        }
      })

      return NextResponse.json(penalty)
    }

    if (action === 'resolve_dispute' && body.penaltyId) {
      // Resolver disputa
      const penalty = await db.subcontractorPenalty.update({
        where: { id: body.penaltyId },
        data: {
          isDisputed: false,
          disputeResolvedAt: new Date(),
          disputeResult: body.disputeResult,
          isApplied: body.disputeResult === 'approved',
          appliedAt: body.disputeResult === 'approved' ? new Date() : null
        }
      })

      return NextResponse.json(penalty)
    }

    // Verificar que la subcontrata existe
    const subcontractor = await db.subcontractorProfile.findUnique({
      where: { id: subcontractorId }
    })

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontrata no encontrada' },
        { status: 404 }
      )
    }

    // Crear nueva penalización
    const penalty = await db.subcontractorPenalty.create({
      data: {
        subcontractorId,
        workId,
        taskId,
        contractId,
        type,
        reason,
        description,
        amount,
        days,
        isApplied: false
      },
      include: {
        subcontractor: true
      }
    })

    return NextResponse.json(penalty, { status: 201 })
  } catch (error) {
    console.error('Error creating/applying penalty:', error)
    return NextResponse.json(
      { error: 'Error al procesar penalización' },
      { status: 500 }
    )
  }
}
