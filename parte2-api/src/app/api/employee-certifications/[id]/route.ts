import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single employee certification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;

    const certification = await db.employeeCertification.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!certification) {
      return NextResponse.json({ error: 'Certificación no encontrada' }, { status: 404 });
    }

    // Check permissions - employees can only see their own
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'TEAM_LEADER';
    if (!isAdmin && certification.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: certification });
  } catch (error) {
    console.error('Error fetching employee certification:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificación' },
      { status: 500 }
    );
  }
}

// PUT - Update employee certification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;
    const data = await request.json();

    const existingCert = await db.employeeCertification.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingCert) {
      return NextResponse.json({ error: 'Certificación no encontrada' }, { status: 404 });
    }

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'TEAM_LEADER';

    // Build update data
    const updateData: any = {};

    // Employees can update items and submit for approval
    if (existingCert.userId === user.id && existingCert.status === 'DRAFT') {
      // Update items
      if (data.items) {
        // Delete existing items
        await db.employeeCertificationItem.deleteMany({
          where: { certificationId: id },
        });

        // Create new items
        let totalAmount = 0;
        let totalHours = 0;

        for (const item of data.items) {
          totalAmount += parseFloat(item.amount || 0);
          totalHours += parseFloat(item.hours || 0);
        }

        await db.employeeCertificationItem.createMany({
          data: data.items.map((item: any) => ({
            certificationId: id,
            workId: item.workId || null,
            workName: item.workName || null,
            description: item.description,
            hours: parseFloat(item.hours || 0),
            amount: parseFloat(item.amount || 0),
            notes: item.notes || null,
          })),
        });

        updateData.amount = totalAmount;
        updateData.hoursWorked = totalHours;
      }

      updateData.workDescription = data.workDescription || existingCert.workDescription;

      // Submit for approval
      if (data.status === 'SUBMITTED') {
        updateData.status = 'SUBMITTED';
      }
    }

    // Admin can validate and approve/reject
    if (isAdmin) {
      // Validate items
      if (data.items && (existingCert.status === 'DRAFT' || existingCert.status === 'SUBMITTED')) {
        // Update item validated amounts
        for (const item of data.items) {
          if (item.id && item.validatedAmount !== undefined) {
            await db.employeeCertificationItem.update({
              where: { id: item.id },
              data: { validatedAmount: parseFloat(item.validatedAmount || 0) },
            });
          }
        }
      }

      // Admin amount override
      if (data.adminAmount !== undefined) {
        updateData.adminAmount = parseFloat(data.adminAmount);
      }

      if (data.adminNotes !== undefined) {
        updateData.adminNotes = data.adminNotes;
      }

      // Profit calculation
      if (data.profitAmount !== undefined) {
        updateData.profitAmount = parseFloat(data.profitAmount);
      }

      if (data.profitPct !== undefined) {
        updateData.profitPct = parseFloat(data.profitPct);
      }

      // Status changes
      if (data.status === 'APPROVED') {
        updateData.status = 'APPROVED';
        updateData.validatedById = user.id;
        updateData.validatedAt = new Date();
        
        // If admin amount not set, use employee amount
        if (!updateData.adminAmount) {
          updateData.adminAmount = existingCert.amount;
        }
      }

      if (data.status === 'REJECTED') {
        updateData.status = 'REJECTED';
        updateData.adminNotes = data.adminNotes || 'Rechazado';
      }

      if (data.status === 'PAID') {
        updateData.status = 'PAID';
        updateData.paidAt = new Date();
        updateData.paymentRef = data.paymentRef || null;
      }
    }

    const certification = await db.employeeCertification.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: certification });
  } catch (error) {
    console.error('Error updating employee certification:', error);
    return NextResponse.json(
      { error: 'Error al actualizar certificación' },
      { status: 500 }
    );
  }
}

// DELETE - Delete employee certification (only drafts)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;

    const certification = await db.employeeCertification.findUnique({
      where: { id },
    });

    if (!certification) {
      return NextResponse.json({ error: 'Certificación no encontrada' }, { status: 404 });
    }

    // Only allow deletion of own drafts
    if (certification.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (certification.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar certificaciones en borrador' },
        { status: 400 }
      );
    }

    // Delete items first
    await db.employeeCertificationItem.deleteMany({
      where: { certificationId: id },
    });

    await db.employeeCertification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee certification:', error);
    return NextResponse.json(
      { error: 'Error al eliminar certificación' },
      { status: 500 }
    );
  }
}
