import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - Get single merch product
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

    const product = await db.merchProduct.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching merch product:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

// PUT - Update merch product
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

    const product = await db.merchProduct.update({
      where: { id },
      data: {
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
    console.error('Error updating merch product:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE - Delete merch product (soft delete)
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

    const product = await db.merchProduct.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error deleting merch product:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
