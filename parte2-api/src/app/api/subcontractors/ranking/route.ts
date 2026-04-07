import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// GET - Ranking de subcontratas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const period = searchParams.get('period') || 'all' // all, monthly, quarterly, yearly
    const specialty = searchParams.get('specialty')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = { isActive: true }
    if (companyId) where.companyId = companyId
    if (specialty) where.specialty = specialty

    // Ranking general
    const ranking = await db.subcontractorProfile.findMany({
      where,
      orderBy: [
        { rating: 'desc' },
        { completedWorks: 'desc' },
        { onTimeRate: 'desc' }
      ],
      take: limit,
      include: {
        tasks: {
          where: { status: 'VALIDATED' },
          select: { id: true, agreedAmount: true }
        },
        rankingHistory: {
          where: {
            periodType: period === 'all' ? undefined : period
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    })

    // Calcular métricas adicionales para cada subcontrata
    const enrichedRanking = ranking.map((sub, index) => {
      const totalEarned = sub.tasks.reduce((sum, t) => sum + (t.agreedAmount || 0), 0)
      
      return {
        rank: index + 1,
        id: sub.id,
        businessName: sub.businessName,
        specialty: sub.specialty,
        rating: sub.rating,
        totalWorks: sub.totalWorks,
        completedWorks: sub.completedWorks,
        onTimeRate: sub.onTimeRate,
        qualityScore: sub.qualityScore,
        totalPenalties: sub.totalPenalties,
        totalEarned,
        trend: sub.rankingHistory.length >= 2
          ? sub.rankingHistory[0].score - sub.rankingHistory[1].score
          : 0,
        recentHistory: sub.rankingHistory.slice(0, 3)
      }
    })

    // Estadísticas globales
    const globalStats = await db.subcontractorProfile.aggregate({
      where,
      _avg: {
        rating: true,
        onTimeRate: true,
        qualityScore: true
      },
      _sum: {
        totalWorks: true,
        completedWorks: true,
        totalPenalties: true
      },
      _count: {
        id: true
      }
    })

    // Top por categoría
    const topBySpecialty = await db.subcontractorProfile.groupBy({
      by: ['specialty'],
      where: {
        ...where,
        specialty: { not: null }
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      ranking: enrichedRanking,
      globalStats: {
        totalSubcontractors: globalStats._count.id,
        avgRating: globalStats._avg.rating || 0,
        avgOnTimeRate: globalStats._avg.onTimeRate || 0,
        avgQualityScore: globalStats._avg.qualityScore || 0,
        totalWorks: globalStats._sum.totalWorks || 0,
        totalCompletedWorks: globalStats._sum.completedWorks || 0,
        totalPenalties: globalStats._sum.totalPenalties || 0
      },
      topBySpecialty: topBySpecialty.map(s => ({
        specialty: s.specialty,
        count: s._count.id,
        avgRating: s._avg.rating || 0
      }))
    })
  } catch (error) {
    console.error('Error fetching ranking:', error)
    return NextResponse.json(
      { error: 'Error al obtener ranking' },
      { status: 500 }
    )
  }
}
