import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - List merch products with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.companyId,
      isActive: true,
    };

    // Visibility filter based on user role
    if (user.role === 'REAL_ESTATE') {
      where.visibleToRealEstate = true;
    } else if (user.role === 'FRANCHISE') {
      where.visibleToFranchises = true;
    } else if (user.role === 'SUBCONTRACTOR' || user.company?.type === 'PARTNER') {
      where.visibleToPartners = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { reference: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      db.merchProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.merchProduct.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching merch products:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos de merchandising' },
      { status: 500 }
    );
  }
}

// POST - Create new merch product
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

    const product = await db.merchProduct.create({
      data: {
        companyId: user.companyId,
        sku: data.sku || null,
        reference: data.reference || null,
        name: data.name,
        description: data.description || null,
        category: data.category || 'BRANDED',
        unit: data.unit || 'unidad',
        minOrder: data.minOrder ? parseInt(data.minOrder) : null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        wholesalePrice: data.wholesalePrice ? parseFloat(data.wholesalePrice) : null,
        retailPrice: data.retailPrice ? parseFloat(data.retailPrice) : null,
        taxRate: data.taxRate ? parseFloat(data.taxRate) : 21,
        stockQuantity: data.stockQuantity ? parseInt(data.stockQuantity) : 0,
        isActive: data.isActive ?? true,
        visibleToRealEstate: data.visibleToRealEstate ?? true,
        visibleToPartners: data.visibleToPartners ?? true,
        visibleToFranchises: data.visibleToFranchises ?? true,
        imageUrl: data.imageUrl || null,
        images: data.images || null,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || null,
        customizable: data.customizable ?? false,
        customizationOptions: data.customizationOptions || null,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error creating merch product:', error);
    return NextResponse.json(
      { error: 'Error al crear producto de merchandising' },
      { status: 500 }
    );
  }
}
