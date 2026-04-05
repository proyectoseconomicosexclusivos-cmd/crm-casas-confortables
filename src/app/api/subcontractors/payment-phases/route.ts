import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// GET - Listar fases de pago
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const subcontractorId = searchParams.get('subcontractorId')
    const workId = searchParams.get('workId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (subcontractorId) where.subcontractorId = subcontractorId
    if (workId) where.workId = workId

    const [phases, total] = await Promise.all([
      db.subcontractorPaymentPhase.findMany({
        where,
        include: {
          subcontractor: {
            select: { id: true, businessName: true, specialty: true }
          },
          work: {
            select: { id: true, name: true, status: true }
          },
          task: {
            select: { id: true, title: true, status: true }
          }
        },
        orderBy: [{ workId: 'asc' }, { phaseOrder: 'asc' }],
        skip,
        take: limit
      }),
      db.subcontractorPaymentPhase.count({ where })
    ])

    return NextResponse.json({
      phases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payment phases:', error)
    return NextResponse.json(
      { error: 'Error al obtener fases de pago' },
      { status: 500 }
    )
  }
}

// POST - Crear fase de pago
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      taskId,
      subcontractorId,
      workId,
      name,
      description,
      phaseOrder,
      totalAmount,
      paymentPercent
    } = body

    // Verificar que la obra existe
    const work = await db.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json(
        { error: 'Obra no encontrada' },
        { status: 404 }
      )
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

    const phase = await db.subcontractorPaymentPhase.create({
      data: {
        taskId,
        subcontractorId,
        workId,
        name,
        description,
        phaseOrder: phaseOrder || 1,
        totalAmount,
        paymentPercent: paymentPercent || 100,
        status: 'PENDING'
      },
      include: {
        subcontractor: true,
        work: true
      }
    })

    return NextResponse.json(phase, { status: 201 })
  } catch (error) {
    console.error('Error creating payment phase:', error)
    return NextResponse.json(
      { error: 'Error al crear fase de pago' },
      { status: 500 }
    )
  }
}
