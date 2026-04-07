import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single subcontractor budget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const budget = await db.subcontractorBudget.findUnique({
      where: { id },
      include: {
        items: true,
        comparisons: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    console.error('Error fetching subcontractor budget:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuesto' },
      { status: 500 }
    );
  }
}

// PUT - Update subcontractor budget
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

    const existingBudget = await db.subcontractorBudget.findUnique({
      where: { id },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    const updateData: any = {
      status: data.status || existingBudget.status,
      notes: data.notes || null,
    };

    // Handle acceptance
    if (data.status === 'ACCEPTED' && existingBudget.status === 'PENDING') {
      updateData.acceptedById = user.id;
      updateData.acceptedAt = new Date();
    }

    // If total changed, create comparison record
    if (data.items && data.createComparison) {
      const items = data.items;
      let newSubtotal = 0;
      for (const item of items) {
        newSubtotal += item.quantity * item.unitPrice;
      }
      const newTax = newSubtotal * 0.21;
      const newTotal = newSubtotal + newTax;

      if (newTotal !== existingBudget.total) {
        // Create budget comparison
        await db.budgetComparison.create({
          data: {
            workId: existingBudget.workId,
            newBudgetId: id,
            oldBudgetId: existingBudget.previousBudgetId,
            changedById: user.id,
            amountBefore: existingBudget.total,
            amountAfter: newTotal,
            difference: newTotal - existingBudget.total,
            differencePct: ((newTotal - existingBudget.total) / existingBudget.total) * 100,
            marginBefore: existingBudget.margin,
            marginAfter: existingBudget.clientBudget ? existingBudget.clientBudget - newTotal : null,
            marginImprovement: existingBudget.margin && existingBudget.clientBudget 
              ? (existingBudget.clientBudget - newTotal) - existingBudget.margin 
              : null,
          },
        });
      }

      updateData.total = newTotal;
      updateData.subtotal = newSubtotal;
      updateData.tax = newTax;
      updateData.previousTotal = existingBudget.total;
    }

    const budget = await db.subcontractorBudget.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    console.error('Error updating subcontractor budget:', error);
    return NextResponse.json(
      { error: 'Error al actualizar presupuesto' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subcontractor budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const budget = await db.subcontractorBudget.findUnique({
      where: { id },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    if (budget.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar presupuestos en borrador' },
        { status: 400 }
      );
    }

    await db.subcontractorBudgetItem.deleteMany({
      where: { budgetId: id },
    });

    await db.subcontractorBudget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subcontractor budget:', error);
    return NextResponse.json(
      { error: 'Error al eliminar presupuesto' },
      { status: 500 }
    );
  }
}
