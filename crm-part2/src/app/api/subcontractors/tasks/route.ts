import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// GET - Listar tareas de subcontratas
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
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status.split(',')
    }
    if (subcontractorId) where.subcontractorId = subcontractorId
    if (workId) where.workId = workId
    if (category) where.category = category

    const [tasks, total] = await Promise.all([
      db.subcontractorTask.findMany({
        where,
        include: {
          subcontractor: {
            select: {
              id: true,
              businessName: true,
              specialty: true,
              rating: true
            }
          },
          work: {
            select: {
              id: true,
              name: true,
              status: true,
              address: true
            }
          },
          evidences: {
            select: { id: true, type: true, url: true }
          },
          validations: {
            select: { id: true, status: true, createdAt: true }
          },
          paymentPhases: {
            select: { id: true, name: true, status: true, totalAmount: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.subcontractorTask.count({ where })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva tarea asignada
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workId,
      subcontractorId,
      title,
      description,
      category,
      estimatedEndDate,
      agreedAmount
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

    // Verificar que la subcontrata existe y está activa
    const subcontractor = await db.subcontractorProfile.findUnique({
      where: { id: subcontractorId }
    })

    if (!subcontractor || !subcontractor.isActive) {
      return NextResponse.json(
        { error: 'Subcontrata no encontrada o inactiva' },
        { status: 404 }
      )
    }

    const task = await db.subcontractorTask.create({
      data: {
        workId,
        subcontractorId,
        title,
        description,
        category,
        estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : null,
        agreedAmount,
        status: 'ASSIGNED'
      },
      include: {
        subcontractor: true,
        work: true
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    )
  }
}
