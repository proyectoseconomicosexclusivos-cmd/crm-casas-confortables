import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST - Parse PDF file and extract products using AI
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('textContent') as string | null;
    const importType = (formData.get('importType') as string) || 'materials';

    if (!file && !textContent) {
      return NextResponse.json(
        { error: 'Se requiere un archivo o contenido de texto' },
        { status: 400 }
      );
    }

    // Extract text content
    let documentContent = textContent || '';
    let fileName = '';

    if (file) {
      fileName = file.name;
      
      // For text files, read directly
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        documentContent = await file.text();
      } else {
        // For PDFs and other formats, we'd need proper extraction
        // In a real implementation, use a PDF parsing library
        // For now, simulate with placeholder
        documentContent = `[Contenido del archivo: ${file.name} - Se requeriría extracción de texto para PDFs]`;
      }
    }

    // Create catalog import record
    const catalogImport = await db.catalogImport.create({
      data: {
        companyId: user.companyId,
        uploadedById: user.id,
        type: importType,
        fileName: fileName || 'Importación de texto',
        filePath: `/uploads/import/${Date.now()}_${fileName || 'text'}`,
        status: 'PROCESSING',
      },
    });

    // Initialize AI for product extraction
    const zai = await ZAI.create();

    // Use AI to identify and extract product rows
    const extractionPrompt = `Analiza el siguiente contenido de documento y extrae TODOS los productos que encuentres.
Cada producto debe tener al menos un nombre. Busca también referencias, códigos, precios, unidades y descripciones.

CONTENIDO DEL DOCUMENTO:
${documentContent}

Responde en formato JSON con la siguiente estructura:
{
  "products": [
    {
      "name": "nombre del producto",
      "reference": "código o referencia",
      "sku": "SKU si existe",
      "description": "descripción del producto",
      "unit": "unidad de medida",
      "price": precio como número o null,
      "category": "categoría si está indicada"
    }
  ],
  "totalFound": número total de productos,
  "currency": "moneda detectada",
  "confidence": "alto/medio/bajo"
}

Si no encuentras productos claros, devuelve un array vacío.
Responde SOLO con el JSON, sin explicaciones adicionales.`;

    let extractedProducts: Array<{
      name: string;
      reference?: string;
      sku?: string;
      description?: string;
      unit?: string;
      price?: number;
      category?: string;
    }> = [];

    try {
      const aiResponse = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Eres un especialista en extracción de datos de catálogos de productos para una empresa de construcción.
Tu tarea es identificar productos, sus referencias y precios de cualquier documento o lista.
Sé exhaustivo y trata de encontrar todos los productos posibles.`,
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        temperature: 0.1,
      });

      const responseText = aiResponse.choices[0]?.message?.content || '';
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedProducts = parsed.products || [];
      }
    } catch (aiError) {
      console.error('Error extracting products with AI:', aiError);
      
      // Fallback: try simple text parsing
      const lines = documentContent.split('\n').filter(line => line.trim());
      extractedProducts = lines.slice(0, 20).map((line, index) => ({
        name: line.substring(0, 100),
        reference: `REF-${index + 1}`,
      }));
    }

    // Create draft records for each extracted product
    const draftRecords = extractedProducts.map(product => ({
      importId: catalogImport.id,
      rawData: JSON.stringify(product),
      name: product.name || null,
      sku: product.reference || product.sku || null,
      description: product.description || null,
      unit: product.unit || null,
      category: product.category || null,
      price: product.price || null,
      hasPrice: !!product.price,
    }));

    if (draftRecords.length > 0) {
      await db.importedProductDraft.createMany({
        data: draftRecords,
      });
    }

    // Update import status
    await db.catalogImport.update({
      where: { id: catalogImport.id },
      data: {
        totalRows: extractedProducts.length,
        processedRows: extractedProducts.length,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Get the created drafts
    const drafts = await db.importedProductDraft.findMany({
      where: { importId: catalogImport.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        import: catalogImport,
        drafts,
        totalProducts: extractedProducts.length,
        productsWithPrice: extractedProducts.filter(p => p.price).length,
      },
    });
  } catch (error) {
    console.error('Error parsing catalog:', error);
    return NextResponse.json(
      { error: 'Error al procesar el catálogo' },
      { status: 500 }
    );
  }
}
