import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { getSubcontractorDashboardStats } from '@/lib/subcontractor-service'

// GET - Estadisticas completas para el dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    // Obtener estadisticas generales
    const generalStats = await getSubcontractorDashboardStats(companyId || undefined)

    // Obtener alertas de retrasos
    const delayedTasks = await db.subcontractorTask.findMany({
      where: {
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        estimatedEndDate: { lt: new Date() }
      },
      include: {
        subcontractor: {
          select: { id: true, businessName: true }
        },
        work: {
          select: { id: true, name: true }
        }
      },
      take: 10
    })

    // Obtener documentos por expirar
    const documentsExpiring = await db.subcontractorProfile.findMany({
      where: {
        OR: [
          {
            insuranceExpiration: {
              gte: new Date(),
              lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
            }
          },
          {
            licenseExpiration: {
              gte: new Date(),
              lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      },
      select: {
        id: true,
        businessName: true,
        insuranceExpiration: true,
        licenseExpiration: true
      }
    })

    // Obtener anticipos pendientes de aprobacion
    const pendingAdvances = await db.subcontractorAdvance.findMany({
      where: { isApproved: false },
      include: {
        subcontractor: {
          select: { id: true, businessName: true }
        },
        work: {
          select: { id: true, name: true }
        }
      },
      take: 10
    })

    // Obtener actividad reciente
    const recentActivity = await db.subcontractorTask.findMany({
      where: {
        OR: [
          { status: 'COMPLETED' },
          { status: 'VALIDATED' }
        ]
      },
      include: {
        subcontractor: {
          select: { id: true, businessName: true }
        },
        work: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })

    // Obtener pagos pendientes de procesar
    const pendingPayments = await db.subcontractorPaymentPhase.findMany({
      where: { status: 'VALIDATED' },
      include: {
        subcontractor: {
          select: { id: true, businessName: true }
        },
        work: {
          select: { id: true, name: true }
        }
      },
      orderBy: { validatedDate: 'asc' },
      take: 10
    })

    // Calcular metricas mensuales
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const monthlyStats = await db.subcontractorTask.aggregate({
      where: {
        createdAt: { gte: monthStart }
      },
      _count: {
        id: true
      }
    })

    const monthlyCompleted = await db.subcontractorTask.count({
      where: {
        validatedAt: { gte: monthStart }
      }
    })

    const monthlyInvoiced = await db.subcontractorInvoice.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: { not: 'cancelled' }
      },
      _sum: {
        total: true
      }
    })

    return NextResponse.json({
      generalStats,
      alerts: {
        delayedTasks,
        documentsExpiring,
        pendingAdvances
      },
      pendingPayments,
      recentActivity,
      monthlyStats: {
        newTasks: monthlyStats._count.id || 0,
        completedTasks: monthlyCompleted,
        totalInvoiced: monthlyInvoiced._sum.total || 0
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Error al obtener dashboard' },
      { status: 500 }
    )
  }
}
