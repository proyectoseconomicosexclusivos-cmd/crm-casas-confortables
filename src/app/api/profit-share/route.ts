import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - List profit shares
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
    const userId = searchParams.get('userId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.companyId,
    };

    // Users can only see their own profit shares (unless admin)
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      where.userId = user.id;
    }

    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const [profitShares, total] = await Promise.all([
      db.profitShare.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.profitShare.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: profitShares,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching profit shares:', error);
    return NextResponse.json(
      { error: 'Error al obtener repartos de beneficios' },
      { status: 500 }
    );
  }
}

// POST - Create new profit share
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

    const profitShare = await db.profitShare.create({
      data: {
        companyId: user.companyId,
        workId: data.workId || null,
        budgetComparisonId: data.budgetComparisonId || null,
        userId: data.userId,
        userName: data.userName,
        source: data.source || 'budget_optimization',
        description: data.description,
        savingAmount: parseFloat(data.savingAmount),
        sharePct: parseFloat(data.sharePct || 10),
        shareAmount: parseFloat(data.savingAmount) * (parseFloat(data.sharePct || 10) / 100),
        status: 'CALCULATED',
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: profitShare });
  } catch (error) {
    console.error('Error creating profit share:', error);
    return NextResponse.json(
      { error: 'Error al crear reparto de beneficios' },
      { status: 500 }
    );
  }
}
