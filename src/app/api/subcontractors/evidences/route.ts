import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// GET - Listar evidencias de una tarea
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    const type = searchParams.get('type')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Se requiere taskId' },
        { status: 400 }
      )
    }

    const where: any = { taskId }
    if (type) where.type = type

    const evidences = await db.taskEvidence.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(evidences)
  } catch (error) {
    console.error('Error fetching evidences:', error)
    return NextResponse.json(
      { error: 'Error al obtener evidencias' },
      { status: 500 }
    )
  }
}

// POST - Subir nueva evidencia (foto/video)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, type, url, description, takenAt, location } = body

    // Verificar que la tarea existe
    const task = await db.subcontractorTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la tarea está en progreso o completada
    if (task.status === 'ASSIGNED') {
      return NextResponse.json(
        { error: 'La tarea debe estar en progreso para subir evidencias' },
        { status: 400 }
      )
    }

    // Obtener ID del usuario que sube
    const user = await db.user.findFirst({
      where: { email: session.user.email || '' }
    })

    const evidence = await db.taskEvidence.create({
      data: {
        taskId,
        uploadedById: user?.id || 'unknown',
        type,
        url,
        description,
        takenAt: takenAt ? new Date(takenAt) : null,
        location: location ? JSON.stringify(location) : null
      }
    })

    return NextResponse.json(evidence, { status: 201 })
  } catch (error) {
    console.error('Error creating evidence:', error)
    return NextResponse.json(
      { error: 'Error al subir evidencia' },
      { status: 500 }
    )
  }
}
