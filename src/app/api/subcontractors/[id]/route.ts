import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// GET - Detalles de subcontrata con estadísticas
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

    const subcontractor = await db.subcontractorProfile.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            work: {
              select: { id: true, name: true, status: true }
            },
            evidences: {
              select: { id: true, type: true, url: true, createdAt: true }
            },
            validations: {
              select: { id: true, status: true, createdAt: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        contracts: {
          where: { status: { in: ['ACTIVE', 'SIGNED'] } },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        paymentPhases: {
          where: { status: { not: 'PAID' } },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        invoices: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        penalties: {
          where: { isApplied: false },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        rankingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 12
        }
      }
    })

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontrata no encontrada' },
        { status: 404 }
      )
    }

    // Calcular estadísticas adicionales
    const stats = {
      totalTasks: subcontractor.tasks.length,
      completedTasks: subcontractor.tasks.filter(t => t.status === 'VALIDATED').length,
      inProgressTasks: subcontractor.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      pendingTasks: subcontractor.tasks.filter(t => t.status === 'ASSIGNED').length,
      totalContracts: subcontractor.contracts.length,
      activeContracts: subcontractor.contracts.filter(c => c.status === 'ACTIVE').length,
      pendingPayments: subcontractor.paymentPhases
        .filter(p => p.status === 'VALIDATED')
        .reduce((sum, p) => sum + p.totalAmount, 0),
      pendingPenalties: subcontractor.penalties.reduce((sum, p) => sum + p.amount, 0)
    }

    return NextResponse.json({
      subcontractor,
      stats
    })
  } catch (error) {
    console.error('Error fetching subcontractor:', error)
    return NextResponse.json(
      { error: 'Error al obtener subcontrata' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar subcontrata
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

    const subcontractor = await db.subcontractorProfile.findUnique({
      where: { id }
    })

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontrata no encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (body.businessName !== undefined) updateData.businessName = body.businessName
    if (body.taxId !== undefined) updateData.taxId = body.taxId
    if (body.specialty !== undefined) updateData.specialty = body.specialty
    if (body.skills !== undefined) updateData.skills = JSON.stringify(body.skills)
    if (body.insuranceExpiration !== undefined) {
      updateData.insuranceExpiration = body.insuranceExpiration ? new Date(body.insuranceExpiration) : null
    }
    if (body.licenseExpiration !== undefined) {
      updateData.licenseExpiration = body.licenseExpiration ? new Date(body.licenseExpiration) : null
    }
    if (body.maxAdvancePercent !== undefined) updateData.maxAdvancePercent = body.maxAdvancePercent
    if (body.paymentTerms !== undefined) updateData.paymentTerms = body.paymentTerms
    if (body.bankAccount !== undefined) updateData.bankAccount = body.bankAccount
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified
    if (body.companyId !== undefined) updateData.companyId = body.companyId

    const updatedSubcontractor = await db.subcontractorProfile.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedSubcontractor)
  } catch (error) {
    console.error('Error updating subcontractor:', error)
    return NextResponse.json(
      { error: 'Error al actualizar subcontrata' },
      { status: 500 }
    )
  }
}

// DELETE - Desactivar subcontrata
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

    const subcontractor = await db.subcontractorProfile.findUnique({
      where: { id },
      include: {
        tasks: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } }
        }
      }
    })

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontrata no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si tiene tareas activas
    if (subcontractor.tasks.length > 0) {
      return NextResponse.json(
        { error: 'No se puede desactivar la subcontrata porque tiene tareas activas' },
        { status: 400 }
      )
    }

    // Desactivar en lugar de eliminar
    await db.subcontractorProfile.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Subcontrata desactivada correctamente' })
  } catch (error) {
    console.error('Error deleting subcontractor:', error)
    return NextResponse.json(
      { error: 'Error al desactivar subcontrata' },
      { status: 500 }
    )
  }
}
