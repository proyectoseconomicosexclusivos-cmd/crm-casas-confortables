import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - List employee certifications
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Regular employees can only see their own certifications
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'TEAM_LEADER';
    
    if (!isAdmin) {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    // Filter by company for admins
    if (user.companyId) {
      where.companyId = user.companyId;
    }

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (status) {
      where.status = status;
    }

    const [certifications, total] = await Promise.all([
      db.employeeCertification.findMany({
        where,
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
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.employeeCertification.count({ where }),
    ]);

    // Calculate stats
    const stats = await db.employeeCertification.aggregate({
      where: {
        ...where,
        status: 'SUBMITTED',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const approvedStats = await db.employeeCertification.aggregate({
      where: {
        ...where,
        status: 'APPROVED',
      },
      _sum: {
        adminAmount: true,
        profitAmount: true,
      },
      _count: true,
    });

    const paidStats = await db.employeeCertification.aggregate({
      where: {
        ...where,
        status: 'PAID',
      },
      _sum: {
        adminAmount: true,
        profitAmount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: certifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        pending: {
          count: stats._count,
          amount: stats._sum.amount || 0,
        },
        approved: {
          count: approvedStats._count,
          amount: approvedStats._sum.adminAmount || 0,
          profit: approvedStats._sum.profitAmount || 0,
        },
        paid: {
          count: paidStats._count,
          amount: paidStats._sum.adminAmount || 0,
          profit: paidStats._sum.profitAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching employee certifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificaciones de empleados' },
      { status: 500 }
    );
  }
}

// POST - Create new employee certification
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

    // Check if certification already exists for this month/year/user
    const existing = await db.employeeCertification.findUnique({
      where: {
        userId_month_year: {
          userId: user.id,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una certificación para este mes/año' },
        { status: 400 }
      );
    }

    // Calculate totals from items
    let totalAmount = 0;
    let totalHours = 0;
    const items = data.items || [];

    for (const item of items) {
      totalAmount += parseFloat(item.amount || 0);
      totalHours += parseFloat(item.hours || 0);
    }

    const certification = await db.employeeCertification.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        workId: data.workId || null,
        month: data.month,
        year: data.year,
        amount: totalAmount,
        workDescription: data.workDescription || null,
        hoursWorked: totalHours,
        status: 'DRAFT',
        items: {
          create: items.map((item: any) => ({
            workId: item.workId || null,
            workName: item.workName || null,
            description: item.description,
            hours: parseFloat(item.hours || 0),
            amount: parseFloat(item.amount || 0),
            notes: item.notes || null,
          })),
        },
      },
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
    console.error('Error creating employee certification:', error);
    return NextResponse.json(
      { error: 'Error al crear certificación de empleado' },
      { status: 500 }
    );
  }
}
