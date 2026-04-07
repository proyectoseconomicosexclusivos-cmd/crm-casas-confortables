import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { signContract } from '@/lib/subcontractor-service'

// GET - Detalles de contrato
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

    const contract = await db.subcontractorContract.findUnique({
      where: { id },
      include: {
        subcontractor: {
          include: {
            tasks: {
              where: { workId: undefined },
              select: { id: true, title: true, status: true }
            }
          }
        }
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Error al obtener contrato' },
      { status: 500 }
    )
  }
}

// PUT - Firmar contrato, cambiar estado
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
    const { action, documentUrl, status, delayPenaltyPerDay, inactivityPenalty, breachPenalty } = body

    const contract = await db.subcontractorContract.findUnique({
      where: { id }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      )
    }

    // Obtener usuario actual
    const user = await db.user.findFirst({
      where: { email: session.user.email || '' }
    })

    let result

    switch (action) {
      case 'sign_subcontractor':
        // Firma de subcontrata
        const subSignResult = await signContract(id, 'subcontractor', user?.id || 'unknown')
        if (!subSignResult.success) {
          return NextResponse.json(
            { error: subSignResult.error },
            { status: 400 }
          )
        }
        result = await db.subcontractorContract.findUnique({ where: { id } })
        break

      case 'sign_company':
        // Firma de empresa
        const companySignResult = await signContract(id, 'company', user?.id || 'unknown')
        if (!companySignResult.success) {
          return NextResponse.json(
            { error: companySignResult.error },
            { status: 400 }
          )
        }
        result = await db.subcontractorContract.findUnique({ where: { id } })
        break

      case 'activate':
        // Activar contrato (ambas partes han firmado)
        if (!contract.signedBySubcontractor || !contract.signedByCompany) {
          return NextResponse.json(
            { error: 'Ambas partes deben firmar antes de activar' },
            { status: 400 }
          )
        }
        result = await db.subcontractorContract.update({
          where: { id },
          data: { status: 'ACTIVE' }
        })
        break

      case 'complete':
        // Completar contrato
        result = await db.subcontractorContract.update({
          where: { id },
          data: { status: 'COMPLETED', endDate: new Date() }
        })
        break

      case 'cancel':
        // Cancelar contrato
        result = await db.subcontractorContract.update({
          where: { id },
          data: { status: 'CANCELLED' }
        })
        break

      default:
        // Actualización genérica
        const updateData: any = {}
        if (documentUrl !== undefined) updateData.documentUrl = documentUrl
        if (status !== undefined) updateData.status = status
        if (delayPenaltyPerDay !== undefined) updateData.delayPenaltyPerDay = delayPenaltyPerDay
        if (inactivityPenalty !== undefined) updateData.inactivityPenalty = inactivityPenalty
        if (breachPenalty !== undefined) updateData.breachPenalty = breachPenalty

        result = await db.subcontractorContract.update({
          where: { id },
          data: updateData
        })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Error al actualizar contrato' },
      { status: 500 }
    )
  }
}
