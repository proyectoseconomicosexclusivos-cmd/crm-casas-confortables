import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { createContractWithDefaults } from '@/lib/subcontractor-service'

// GET - Listar contratos
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

    const [contracts, total] = await Promise.all([
      db.subcontractorContract.findMany({
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
      db.subcontractorContract.count({ where })
    ])

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Error al obtener contratos' },
      { status: 500 }
    )
  }
}

// POST - Crear contrato
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
      title,
      description,
      totalAmount,
      startDate,
      endDate,
      clauses,
      delayPenaltyPerDay,
      inactivityPenalty,
      breachPenalty,
      templateId
    } = body

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

    // Usar servicio para crear con valores por defecto si hay plantilla
    if (templateId) {
      const result = await createContractWithDefaults(subcontractorId, {
        title,
        totalAmount,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        workId,
        taskId,
        templateId
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json(result.contract, { status: 201 })
    }

    // Generar número de contrato
    const year = new Date().getFullYear()
    const count = await db.subcontractorContract.count({
      where: {
        subcontractorId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    })
    const contractNumber = `CON-${year}-${String(count + 1).padStart(4, '0')}`

    const contract = await db.subcontractorContract.create({
      data: {
        subcontractorId,
        workId,
        taskId,
        contractNumber,
        title,
        description,
        totalAmount,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        clauses: clauses ? JSON.stringify(clauses) : null,
        delayPenaltyPerDay,
        inactivityPenalty,
        breachPenalty,
        status: 'DRAFT'
      },
      include: {
        subcontractor: true
      }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Error al crear contrato' },
      { status: 500 }
    )
  }
}
