import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - List catalog imports
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

    const imports = await db.catalogImport.findMany({
      where: { companyId: user.companyId },
      include: {
        drafts: {
          where: { isProcessed: false },
          take: 50,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, data: imports });
  } catch (error) {
    console.error('Error fetching catalog imports:', error);
    return NextResponse.json(
      { error: 'Error al obtener importaciones' },
      { status: 500 }
    );
  }
}

// POST - Create new catalog import
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

    const catalogImport = await db.catalogImport.create({
      data: {
        companyId: user.companyId,
        uploadedById: user.id,
        type: data.type || 'materials',
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize || null,
        status: 'PENDING',
        config: data.config || null,
      },
    });

    // If products data is provided, create drafts
    if (data.products && Array.isArray(data.products)) {
      await db.importedProductDraft.createMany({
        data: data.products.map((product: any) => ({
          importId: catalogImport.id,
          rawData: JSON.stringify(product),
          name: product.name || null,
          sku: product.sku || null,
          description: product.description || null,
          unit: product.unit || null,
          category: product.category || null,
          price: product.price ? parseFloat(product.price) : null,
          hasPrice: !!product.price,
        })),
      });

      await db.catalogImport.update({
        where: { id: catalogImport.id },
        data: { totalRows: data.products.length },
      });
    }

    return NextResponse.json({ success: true, data: catalogImport });
  } catch (error) {
    console.error('Error creating catalog import:', error);
    return NextResponse.json(
      { error: 'Error al crear importacion' },
      { status: 500 }
    );
  }
}

// PUT - Process imported drafts
export async function PUT(request: NextRequest) {
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
    const { importId, drafts } = data;

    const catalogImport = await db.catalogImport.findUnique({
      where: { id: importId },
    });

    if (!catalogImport) {
      return NextResponse.json({ error: 'Importacion no encontrada' }, { status: 404 });
    }

    let productsCreated = 0;
    let productsUpdated = 0;

    for (const draft of drafts) {
      if (!draft.isApproved) continue;

      const productData = JSON.parse(draft.rawData);

      if (catalogImport.type === 'materials') {
        // Check if product exists by SKU
        const existing = draft.sku 
          ? await db.materialProduct.findFirst({
              where: { sku: draft.sku, companyId: user.companyId },
            })
          : null;

        if (existing) {
          await db.materialProduct.update({
            where: { id: existing.id },
            data: {
              name: draft.name || existing.name,
              description: draft.description || existing.description,
              unit: draft.unit || existing.unit,
              retailPrice: draft.price || existing.retailPrice,
            },
          });
          productsUpdated++;
        } else {
          const newProduct = await db.materialProduct.create({
            data: {
              companyId: user.companyId,
              name: draft.name || 'Sin nombre',
              sku: draft.sku || null,
              description: draft.description || null,
              unit: draft.unit || 'unidad',
              retailPrice: draft.price || null,
              materialType: 'FINISHES',
              status: 'ACTIVE',
            },
          });
          
          await db.importedProductDraft.update({
            where: { id: draft.id },
            data: { 
              isProcessed: true, 
              processedAt: new Date(),
              productId: newProduct.id,
            },
          });
          productsCreated++;
        }
      } else {
        // Merch products
        const existing = draft.sku 
          ? await db.merchProduct.findFirst({
              where: { sku: draft.sku, companyId: user.companyId },
            })
          : null;

        if (existing) {
          await db.merchProduct.update({
            where: { id: existing.id },
            data: {
              name: draft.name || existing.name,
              description: draft.description || existing.description,
              retailPrice: draft.price || existing.retailPrice,
            },
          });
          productsUpdated++;
        } else {
          const newProduct = await db.merchProduct.create({
            data: {
              companyId: user.companyId,
              name: draft.name || 'Sin nombre',
              sku: draft.sku || null,
              description: draft.description || null,
              unit: draft.unit || 'unidad',
              retailPrice: draft.price || null,
              category: 'BRANDED',
            },
          });
          
          await db.importedProductDraft.update({
            where: { id: draft.id },
            data: { 
              isProcessed: true, 
              processedAt: new Date(),
              productId: newProduct.id,
            },
          });
          productsCreated++;
        }
      }
    }

    // Update import status
    await db.catalogImport.update({
      where: { id: importId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        productsCreated,
        productsUpdated,
        processedRows: drafts.filter((d: any) => d.isApproved).length,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: { productsCreated, productsUpdated } 
    });
  } catch (error) {
    console.error('Error processing import:', error);
    return NextResponse.json(
      { error: 'Error al procesar importacion' },
      { status: 500 }
    );
  }
}
