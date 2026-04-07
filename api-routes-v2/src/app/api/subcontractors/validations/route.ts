import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { updateSubcontractorRanking, validateTaskComplete } from '@/lib/subcontractor-service'

// GET - Listar validaciones pendientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'completed'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Obtener tareas pendientes de validacion (estado COMPLETED)
    const tasks = await db.subcontractorTask.findMany({
      where: { status: 'COMPLETED' },
      include: {
        subcontractor: {
          select: { id: true, businessName: true, specialty: true, rating: true }
        },
        work: {
          select: { id: true, name: true, address: true }
        },
        evidences: true,
        validations: true
      },
      orderBy: { completedAt: 'asc' },
      skip,
      take: limit
    })

    const total = await db.subcontractorTask.count({
      where: { status: 'COMPLETED' }
    })

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
    console.error('Error fetching validations:', error)
    return NextResponse.json(
      { error: 'Error al obtener validaciones' },
      { status: 500 }
    )
  }
}

// POST - Crear validacion (aprobar/rechazar)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, status, comments, checklistResults } = body

    // Verificar que la tarea existe y esta completada
    const task = await db.subcontractorTask.findUnique({
      where: { id: taskId },
      include: { evidences: true }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    if (task.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'La tarea debe estar completada para ser validada' },
        { status: 400 }
      )
    }

    // Validar que la tarea tiene todo lo necesario
    const validation = await validateTaskComplete(taskId)
    if (!validation.isValid && status === 'approved') {
      return NextResponse.json(
        { error: 'La tarea no cumple con los requisitos minimos', details: validation },
        { status: 400 }
      )
    }

    // Obtener ID del usuario validador
    const user = await db.user.findFirst({
      where: { email: session.user.email || '' }
    })

    // Crear validacion
    const newValidation = await db.taskValidation.create({
      data: {
        taskId,
        validatedById: user?.id || 'unknown',
        status,
        comments,
        checklistResults: checklistResults ? JSON.stringify(checklistResults) : null
      }
    })

    // Actualizar estado de la tarea
    const newTaskStatus = status === 'approved' ? 'VALIDATED' : 'REJECTED'
    await db.subcontractorTask.update({
      where: { id: taskId },
      data: {
        status: newTaskStatus,
        validatedAt: status === 'approved' ? new Date() : null
      }
    })

    // Si se aprobo, actualizar ranking
    if (status === 'approved') {
      await updateSubcontractorRanking(task.subcontractorId)
    }

    return NextResponse.json(newValidation, { status: 201 })
  } catch (error) {
    console.error('Error creating validation:', error)
    return NextResponse.json(
      { error: 'Error al crear validacion' },
      { status: 500 }
    )
  }
}
