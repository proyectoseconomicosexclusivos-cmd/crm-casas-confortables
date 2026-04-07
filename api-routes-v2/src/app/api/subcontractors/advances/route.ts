import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { verifyAdvanceEligibility } from '@/lib/subcontractor-service'

// GET - Listar anticipos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const subcontractorId = searchParams.get('subcontractorId')
    const workId = searchParams.get('workId')
    const isApproved = searchParams.get('isApproved')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (subcontractorId) where.subcontractorId = subcontractorId
    if (workId) where.workId = workId
    if (isApproved !== null) where.isApproved = isApproved === 'true'

    const [advances, total] = await Promise.all([
      db.subcontractorAdvance.findMany({
        where,
        include: {
          subcontractor: {
            select: { id: true, businessName: true, specialty: true }
          },
          work: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.subcontractorAdvance.count({ where })
    ])

    return NextResponse.json({
      advances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching advances:', error)
    return NextResponse.json(
      { error: 'Error al obtener anticipos' },
      { status: 500 }
    )
  }
}

// POST - Solicitar/aprobar anticipo
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
      contractId,
      amount,
      percent,
      reason,
      guaranteeType,
      guaranteeDocument,
      guaranteeExpiration,
      action // 'create' or 'approve'
    } = body

    // Obtener usuario actual
    const user = await db.user.findFirst({
      where: { email: session.user.email || '' }
    })

    if (action === 'approve' && body.advanceId) {
      // Aprobar anticipo existente
      const eligibility = await verifyAdvanceEligibility(body.advanceId)
      if (!eligibility.eligible) {
        return NextResponse.json(
          { error: eligibility.reasons.join('. ') },
          { status: 400 }
        )
      }

      const advance = await db.subcontractorAdvance.update({
        where: { id: body.advanceId },
        data: {
          isApproved: true,
          approvedById: user?.id,
          approvedAt: new Date()
        }
      })

      return NextResponse.json(advance)
    }

    // Crear nuevo anticipo
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

    // Verificar que no excede el maximo permitido
    if (percent > subcontractor.maxAdvancePercent) {
      return NextResponse.json(
        { error: `El anticipo excede el maximo permitido (${subcontractor.maxAdvancePercent}%)` },
        { status: 400 }
      )
    }

    const advance = await db.subcontractorAdvance.create({
      data: {
        subcontractorId,
        workId,
        contractId,
        amount,
        percent,
        reason,
        guaranteeType: guaranteeType || 'NONE',
        guaranteeDocument,
        guaranteeExpiration: guaranteeExpiration ? new Date(guaranteeExpiration) : null,
        isApproved: false
      },
      include: {
        subcontractor: true,
        work: true
      }
    })

    return NextResponse.json(advance, { status: 201 })
  } catch (error) {
    console.error('Error creating/approving advance:', error)
    return NextResponse.json(
      { error: 'Error al procesar anticipo' },
      { status: 500 }
    )
  }
}
