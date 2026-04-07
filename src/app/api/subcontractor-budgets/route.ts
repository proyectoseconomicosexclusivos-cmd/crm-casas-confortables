import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - List subcontractor budgets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const workId = searchParams.get('workId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.companyId,
    };

    // Subcontractors can only see their own budgets
    if (user.role === 'SUBCONTRACTOR') {
      const profile = await db.subcontractorProfile.findUnique({
        where: { userId: user.id },
      });
      if (profile) {
        where.subcontractorId = profile.id;
      }
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { title: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (workId) {
      where.workId = workId;
    }

    const [budgets, total] = await Promise.all([
      db.subcontractorBudget.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.subcontractorBudget.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: budgets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subcontractor budgets:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuestos de subcontratas' },
      { status: 500 }
    );
  }
}

// POST - Create new subcontractor budget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const data = await request.json();

    // Calculate totals
    let subtotal = 0;
    const items = data.items || [];
    
    for (const item of items) {
      subtotal += item.quantity * item.unitPrice;
    }

    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    // Calculate margin
    const clientBudget = data.clientBudget || 0;
    const margin = clientBudget - total;
    const marginPct = clientBudget > 0 ? (margin / clientBudget) * 100 : 0;

    const budget = await db.subcontractorBudget.create({
      data: {
        companyId: user.companyId,
        workId: data.workId,
        subcontractorId: data.subcontractorId,
        number: data.number || null,
        title: data.title,
        description: data.description || null,
        budgetDate: new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'DRAFT',
        subtotal,
        tax,
        total,
        clientBudget,
        margin,
        marginPct,
        notes: data.notes || null,
        items: {
          create: items.map((item: any) => ({
            concept: item.concept,
            description: item.description || null,
            unit: item.unit || 'unidad',
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            total: item.quantity * item.unitPrice,
            certifiedQty: 0,
            pendingQty: parseFloat(item.quantity),
            certifiedAmount: 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    console.error('Error creating subcontractor budget:', error);
    return NextResponse.json(
      { error: 'Error al crear presupuesto de subcontrata' },
      { status: 500 }
    );
  }
}
