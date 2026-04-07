import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { generateInvoiceFromPhases } from '@/lib/subcontractor-service'

// GET - Listar facturas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const subcontractorId = searchParams.get('subcontractorId')
    const workId = searchParams.get('workId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (subcontractorId) where.subcontractorId = subcontractorId
    if (workId) where.workId = workId
    if (status) where.status = status

    const [invoices, total] = await Promise.all([
      db.subcontractorInvoice.findMany({
        where,
        include: {
          subcontractor: {
            select: { id: true, businessName: true, specialty: true, taxId: true }
          },
          work: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.subcontractorInvoice.count({ where })
    ])

    // Calcular totales
    const totals = await db.subcontractorInvoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        tax: true,
        total: true,
        penaltiesDeducted: true
      }
    })

    return NextResponse.json({
      invoices,
      totals: {
        subtotal: totals._sum.subtotal || 0,
        tax: totals._sum.tax || 0,
        total: totals._sum.total || 0,
        penaltiesDeducted: totals._sum.penaltiesDeducted || 0
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

// POST - Generar factura desde fases validadas
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { subcontractorId, phaseIds, action, invoiceId, paymentReference } = body

    // Obtener usuario actual
    const user = await db.user.findFirst({
      where: { email: session.user.email || '' }
    })

    if (action === 'pay' && invoiceId) {
      // Marcar factura como pagada
      const invoice = await db.subcontractorInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentReference
        }
      })

      return NextResponse.json(invoice)
    }

    if (action === 'cancel' && invoiceId) {
      // Cancelar factura
      const invoice = await db.subcontractorInvoice.update({
        where: { id: invoiceId },
        data: { status: 'cancelled' }
      })

      return NextResponse.json(invoice)
    }

    // Generar nueva factura desde fases validadas
    if (!subcontractorId || !phaseIds || !Array.isArray(phaseIds) || phaseIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere subcontractorId y phaseIds (array)' },
        { status: 400 }
      )
    }

    const result = await generateInvoiceFromPhases(
      subcontractorId,
      phaseIds,
      user?.id || 'unknown'
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.invoice, { status: 201 })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Error al generar factura' },
      { status: 500 }
    )
  }
}
