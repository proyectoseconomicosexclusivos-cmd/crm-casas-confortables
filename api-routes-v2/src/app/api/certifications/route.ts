import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// Generate certification number
async function generateCertNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const count = await db.certification.count({
    where: {
      companyId,
      number: { contains: `CERT-${year}${month}` },
    },
  });
  return `CERT-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// GET - List certifications
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

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { period: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (workId) {
      where.workId = workId;
    }

    const [certifications, total] = await Promise.all([
      db.certification.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.certification.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: certifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificaciones' },
      { status: 500 }
    );
  }
}

// POST - Create new certification
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
    const number = await generateCertNumber(user.companyId);

    // Calculate totals
    let currentCertified = 0;
    const items = data.items || [];
    
    for (const item of items) {
      currentCertified += item.currentAmount || 0;
    }

    const previousCertified = data.previousCertified || 0;
    const totalCertified = previousCertified + currentCertified;
    const retentionPct = data.retentionPct || 5;
    const retentionAmount = currentCertified * (retentionPct / 100);
    const subtotal = currentCertified - retentionAmount;
    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    const certification = await db.certification.create({
      data: {
        companyId: user.companyId,
        workId: data.workId,
        clientId: data.clientId || null,
        number,
        type: data.type || 'partial',
        period: data.period || null,
        certDate: new Date(),
        fromDate: data.fromDate ? new Date(data.fromDate) : null,
        toDate: data.toDate ? new Date(data.toDate) : null,
        status: 'DRAFT',
        previousCertified,
        currentCertified,
        totalCertified,
        retentionPct,
        retentionAmount,
        subtotal,
        tax,
        total,
        notes: data.notes || null,
        items: {
          create: items.map((item: any) => ({
            concept: item.concept,
            description: item.description || null,
            unit: item.unit || 'unidad',
            budgetQty: parseFloat(item.budgetQty || 0),
            previousQty: parseFloat(item.previousQty || 0),
            currentQty: parseFloat(item.currentQty || 0),
            unitPrice: parseFloat(item.unitPrice || 0),
            budgetAmount: parseFloat(item.budgetAmount || 0),
            previousAmount: parseFloat(item.previousAmount || 0),
            currentAmount: parseFloat(item.currentAmount || 0),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: certification });
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json(
      { error: 'Error al crear certificacion' },
      { status: 500 }
    );
  }
}
