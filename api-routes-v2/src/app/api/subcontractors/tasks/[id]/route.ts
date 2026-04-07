import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { applyAutomaticPenalties, updateSubcontractorRanking } from '@/lib/subcontractor-service'

// GET - Detalles de tarea
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

    const task = await db.subcontractorTask.findUnique({
      where: { id },
      include: {
        subcontractor: true,
        work: {
          include: {
            lead: {
              select: { firstName: true, lastName: true, phone: true }
            }
          }
        },
        evidences: {
          orderBy: { createdAt: 'desc' }
        },
        validations: {
          include: {
            task: {
              select: { title: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        paymentPhases: {
          orderBy: { phaseOrder: 'asc' }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Error al obtener tarea' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar tarea (cambiar estado, progreso)
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

    const task = await db.subcontractorTask.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    // Manejar cambio de estado
    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        'ASSIGNED': ['IN_PROGRESS'],
        'IN_PROGRESS': ['COMPLETED'],
        'COMPLETED': ['VALIDATED', 'REJECTED'],
        'VALIDATED': [],
        'REJECTED': ['IN_PROGRESS']
      }

      if (!validTransitions[task.status]?.includes(body.status)) {
        return NextResponse.json(
          { error: `Transicion de estado no valida: ${task.status} → ${body.status}` },
          { status: 400 }
        )
      }

      updateData.status = body.status

      // Fechas segun el estado
      if (body.status === 'IN_PROGRESS') {
        updateData.startDate = new Date()
      } else if (body.status === 'COMPLETED') {
        updateData.completedAt = new Date()
        updateData.progress = 100
      } else if (body.status === 'VALIDATED') {
        updateData.validatedAt = new Date()
      }
    }

    if (body.progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, body.progress))
    }
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.estimatedEndDate !== undefined) {
      updateData.estimatedEndDate = body.estimatedEndDate ? new Date(body.estimatedEndDate) : null
    }
    if (body.agreedAmount !== undefined) updateData.agreedAmount = body.agreedAmount

    const updatedTask = await db.subcontractorTask.update({
      where: { id },
      data: updateData
    })

    // Si se completo, verificar penalizaciones automaticas
    if (body.status === 'COMPLETED') {
      await applyAutomaticPenalties(id)
    }

    // Si se valido, actualizar ranking
    if (body.status === 'VALIDATED') {
      await updateSubcontractorRanking(task.subcontractorId)
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const task = await db.subcontractorTask.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    // Solo se puede eliminar si esta asignada
    if (task.status !== 'ASSIGNED') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar tareas en estado ASIGNADA' },
        { status: 400 }
      )
    }

    await db.subcontractorTask.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Tarea eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    )
  }
}
