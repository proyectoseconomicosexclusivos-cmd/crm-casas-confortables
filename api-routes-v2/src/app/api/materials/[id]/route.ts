import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single material
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

    const material = await db.materialProduct.findUnique({
      where: { id },
      include: {
        categoryRelation: true,
        priceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { error: 'Error al obtener material' },
      { status: 500 }
    );
  }
}

// PUT - Update material
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const existingMaterial = await db.materialProduct.findUnique({
      where: { id },
    });

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }

    const material = await db.materialProduct.update({
      where: { id },
      data: {
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

    // Check if prices changed and create history
    const priceChanged =
      existingMaterial.costPrice !== material.costPrice ||
      existingMaterial.retailPrice !== material.retailPrice ||
      existingMaterial.contractorPrice !== material.contractorPrice;

    if (priceChanged) {
      await db.materialPriceHistory.create({
        data: {
          productId: material.id,
          costPrice: material.costPrice,
          retailPrice: material.retailPrice,
          contractorPrice: material.contractorPrice,
          reason: data.priceChangeReason || 'Actualizacion de precios',
        },
      });
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Error al actualizar material' },
      { status: 500 }
    );
  }
}

// DELETE - Delete material (soft delete)
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

    const material = await db.materialProduct.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Error al eliminar material' },
      { status: 500 }
    );
  }
}
