import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// GET - Listar subcontratas con filtros y ranking
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const specialty = searchParams.get('specialty')
    const isActive = searchParams.get('isActive')
    const minRating = searchParams.get('minRating')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (companyId) where.companyId = companyId
    if (specialty) where.specialty = specialty
    if (isActive !== null) where.isActive = isActive === 'true'
    if (minRating) where.rating = { gte: parseFloat(minRating) }
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { specialty: { contains: search } },
        { taxId: { contains: search } }
      ]
    }

    const [subcontractors, total] = await Promise.all([
      db.subcontractorProfile.findMany({
        where,
        include: {
          tasks: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
            select: { id: true, title: true, status: true }
          },
          _count: {
            select: {
              tasks: true,
              contracts: true,
              paymentPhases: true
            }
          }
        },
        orderBy: { rating: 'desc' },
        skip,
        take: limit
      }),
      db.subcontractorProfile.count({ where })
    ])

    return NextResponse.json({
      subcontractors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching subcontractors:', error)
    return NextResponse.json(
      { error: 'Error al obtener subcontratas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva subcontrata
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      companyId,
      businessName,
      taxId,
      specialty,
      skills,
      insuranceExpiration,
      licenseExpiration,
      maxAdvancePercent,
      paymentTerms,
      bankAccount
    } = body

    // Verificar que el usuario existe
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no existe ya un perfil para este usuario
    const existingProfile = await db.subcontractorProfile.findUnique({
      where: { userId }
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'El usuario ya tiene un perfil de subcontrata' },
        { status: 400 }
      )
    }

    const subcontractor = await db.subcontractorProfile.create({
      data: {
        userId,
        companyId,
        businessName,
        taxId,
        specialty,
        skills: skills ? JSON.stringify(skills) : null,
        insuranceExpiration: insuranceExpiration ? new Date(insuranceExpiration) : null,
        licenseExpiration: licenseExpiration ? new Date(licenseExpiration) : null,
        maxAdvancePercent: maxAdvancePercent || 10,
        paymentTerms: paymentTerms || 30,
        bankAccount
      }
    })

    return NextResponse.json(subcontractor, { status: 201 })
  } catch (error) {
    console.error('Error creating subcontractor:', error)
    return NextResponse.json(
      { error: 'Error al crear subcontrata' },
      { status: 500 }
    )
  }
}
