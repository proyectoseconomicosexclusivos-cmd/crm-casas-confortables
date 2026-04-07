import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { MATERIAL_TYPE_LABELS, MATERIAL_STATUS_LABELS } from '@/types';

// GET - List materials with filters
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
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.companyId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { reference: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
      ];
    }

    if (type) {
      where.materialType = type;
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      where.retailPrice = {};
      if (minPrice) where.retailPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.retailPrice.lte = parseFloat(maxPrice);
    }

    const [materials, total] = await Promise.all([
      db.materialProduct.findMany({
        where,
        include: {
          categoryRelation: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.materialProduct.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: materials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Error al obtener materiales' },
      { status: 500 }
    );
  }
}

// POST - Create new material
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

    const material = await db.materialProduct.create({
      data: {
        companyId: user.companyId,
        categoryId: data.categoryId || null,
        sku: data.sku || null,
        reference: data.reference || null,
        barcode: data.barcode || null,
        name: data.name,
        description: data.description || null,
        brand: data.brand || null,
        model: data.model || null,
        materialType: data.materialType || 'FINISHES',
        tags: data.tags || null,
        unit: data.unit || 'unidad',
        unitQuantity: data.unitQuantity ? parseFloat(data.unitQuantity) : null,
        minOrder: data.minOrder ? parseFloat(data.minOrder) : null,
        increment: data.increment ? parseFloat(data.increment) : null,
        length: data.length ? parseFloat(data.length) : null,
        width: data.width ? parseFloat(data.width) : null,
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        retailPrice: data.retailPrice ? parseFloat(data.retailPrice) : null,
        contractorPrice: data.contractorPrice ? parseFloat(data.contractorPrice) : null,
        priceUnit: data.priceUnit || 'unidad',
        taxRate: data.taxRate ? parseFloat(data.taxRate) : 21,
        stockQuantity: data.stockQuantity ? parseFloat(data.stockQuantity) : 0,
        minStock: data.minStock ? parseFloat(data.minStock) : null,
        maxStock: data.maxStock ? parseFloat(data.maxStock) : null,
        status: data.status || 'ACTIVE',
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        imageUrl: data.imageUrl || null,
        images: data.images || null,
        datasheetUrl: data.datasheetUrl || null,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || null,
        leadTime: data.leadTime ? parseInt(data.leadTime) : null,
        internalNotes: data.internalNotes || null,
      },
    });

    // Create price history if price was set
    if (material.costPrice || material.retailPrice || material.contractorPrice) {
      await db.materialPriceHistory.create({
        data: {
          productId: material.id,
          costPrice: material.costPrice,
          retailPrice: material.retailPrice,
          contractorPrice: material.contractorPrice,
          reason: 'Creacion inicial',
        },
      });
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Error al crear material' },
      { status: 500 }
    );
  }
}
