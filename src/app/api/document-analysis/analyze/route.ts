import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST - Analyze document content using AI
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
    const { analysisId, content, analysisType } = data;

    if (!content && !analysisId) {
      return NextResponse.json(
        { error: 'Se requiere contenido o ID de análisis' },
        { status: 400 }
      );
    }

    // Get existing analysis if ID provided
    let analysis = null;
    if (analysisId) {
      analysis = await db.documentAnalysis.findFirst({
        where: {
          id: analysisId,
          companyId: user.companyId,
        },
      });

      if (!analysis) {
        return NextResponse.json(
          { error: 'Análisis no encontrado' },
          { status: 404 }
        );
      }
    }

    // Update status to processing
    if (analysis) {
      await db.documentAnalysis.update({
        where: { id: analysis.id },
        data: { status: 'processing' },
      });
    }

    const type = analysisType || analysis?.analysisType || 'generic';
    const documentContent = content || '';

    // Initialize AI
    const zai = await ZAI.create();

    // Prepare system prompt based on analysis type
    let systemPrompt = '';
    let extractionPrompt = '';

    switch (type) {
      case 'budget':
        systemPrompt = `Eres un asistente especializado en análisis de presupuestos y documentos financieros. Tu tarea es extraer información estructurada de presupuestos y facturas.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "lineItems": [
    {
      "concept": "nombre del concepto",
      "description": "descripción opcional",
      "quantity": número,
      "unitPrice": número,
      "total": número
    }
  ],
  "subtotal": número,
  "tax": número,
  "total": número,
  "dates": {
    "issued": "fecha de emisión",
    "validUntil": "fecha de validez"
  },
  "parties": {
    "issuer": { "name": "nombre", "taxId": "CIF/NIF", "address": "dirección" },
    "recipient": { "name": "nombre", "taxId": "CIF/NIF", "address": "dirección" }
  }
}`;

        extractionPrompt = `Analiza el siguiente documento de presupuesto y extrae todos los datos estructurados. Si algún campo no está disponible, omítelo o usa null. Los valores numéricos deben ser números, no strings.

DOCUMENTO:
${documentContent}

Responde SOLO con el JSON, sin explicaciones adicionales.`;
        break;

      case 'contract':
        systemPrompt = `Eres un asistente especializado en análisis de contratos legales. Tu tarea es extraer información clave de contratos y acuerdos.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "parties": [
    {
      "role": "parte1/parte2/proveedor/cliente/etc",
      "name": "nombre o razón social",
      "taxId": "CIF/NIF si está disponible",
      "address": "dirección fiscal"
    }
  ],
  "dates": {
    "startDate": "fecha de inicio del contrato",
    "endDate": "fecha de finalización",
    "signedDate": "fecha de firma"
  },
  "amounts": {
    "total": número con el importe total,
    "currency": "moneda (EUR, USD, etc)",
    "paymentTerms": "condiciones de pago"
  },
  "keyClauses": [
    {
      "title": "título de la cláusula",
      "content": "contenido o resumen de la cláusula"
    }
  ]
}`;

        extractionPrompt = `Analiza el siguiente contrato y extrae todos los datos estructurados. Identifica las partes, fechas, importes y cláusulas más importantes. Si algún campo no está disponible, omítelo o usa null.

CONTRATO:
${documentContent}

Responde SOLO con el JSON, sin explicaciones adicionales.`;
        break;

      case 'product_list':
        systemPrompt = `Eres un asistente especializado en análisis de catálogos y listas de productos. Tu tarea es extraer información de productos de catálogos, hojas de precios o listados.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "products": [
    {
      "name": "nombre del producto",
      "reference": "referencia o código",
      "sku": "SKU si está disponible",
      "description": "descripción breve",
      "unit": "unidad de medida (unidad, m, m2, kg, etc)",
      "quantity": cantidad si aplica,
      "price": precio numérico,
      "category": "categoría del producto"
    }
  ],
  "totalProducts": número total de productos encontrados,
  "currency": "moneda de los precios"
}`;

        extractionPrompt = `Analiza la siguiente lista de productos y extrae todos los productos encontrados. Identifica nombres, referencias, precios y cualquier otro dato disponible. Si algún campo no está disponible, omítelo.

LISTA DE PRODUCTOS:
${documentContent}

Responde SOLO con el JSON, sin explicaciones adicionales.`;
        break;

      default:
        systemPrompt = `Eres un asistente especializado en análisis de documentos. Tu tarea es extraer información relevante y estructurada de cualquier tipo de documento.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "documentType": "tipo de documento identificado",
  "title": "título o asunto",
  "date": "fecha del documento si está disponible",
  "keyInfo": {
    "summary": "resumen del documento",
    "mainPoints": ["punto 1", "punto 2", "etc"],
    "entities": ["entidades o nombres importantes"]
  },
  "relevantData": {}
}`;

        extractionPrompt = `Analiza el siguiente documento y extrae toda la información relevante. Identifica el tipo de documento, los datos principales y cualquier información importante.

DOCUMENTO:
${documentContent}

Responde SOLO con el JSON, sin explicaciones adicionales.`;
    }

    // Make AI request for structured data
    let extractedData = null;
    try {
      const extractionResponse = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: extractionPrompt },
        ],
        temperature: 0.1,
      });

      const extractionText = extractionResponse.choices[0]?.message?.content || '';
      
      // Try to parse JSON from response
      const jsonMatch = extractionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing extracted data:', parseError);
    }

    // Generate AI summary
    let aiSummary = '';
    try {
      const summaryResponse = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de CRM especializado en análisis de documentos para una empresa de construcción llamada "Casas Confortables". 
Proporciona resúmenes claros y concisos en español, destacando la información más relevante para el negocio.`,
          },
          {
            role: 'user',
            content: `Resume el siguiente documento en 3-5 párrafos, destacando:
1. Tipo de documento y propósito
2. Partes involucradas
3. Importes o valores principales
4. Fechas relevantes
5. Cualquier información importante para el negocio

DOCUMENTO:
${documentContent}`,
          },
        ],
      });

      aiSummary = summaryResponse.choices[0]?.message?.content || '';
    } catch (summaryError) {
      console.error('Error generating summary:', summaryError);
      aiSummary = 'No se pudo generar el resumen automático.';
    }

    // Generate recommendations
    let aiRecommendations = '';
    try {
      const recsResponse = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de CRM para una empresa de construcción. Tu tarea es proporcionar recomendaciones prácticas basadas en el análisis de documentos.
Las recomendaciones deben ser específicas, accionables y relevantes para el negocio.`,
          },
          {
            role: 'user',
            content: `Basado en el siguiente documento analizado, proporciona 3-5 recomendaciones específicas para:
1. Acciones a tomar
2. Riesgos potenciales
3. Oportunidades
4. Siguientes pasos

DOCUMENTO:
${documentContent}

TIPO DE ANÁLISIS: ${type}`,
          },
        ],
      });

      aiRecommendations = recsResponse.choices[0]?.message?.content || '';
    } catch (recsError) {
      console.error('Error generating recommendations:', recsError);
      aiRecommendations = 'No se pudieron generar recomendaciones automáticas.';
    }

    // Update analysis with results
    const resultData = {
      extractedData,
      aiSummary,
      aiRecommendations,
      status: 'completed',
      completedAt: new Date(),
    };

    if (analysis) {
      analysis = await db.documentAnalysis.update({
        where: { id: analysis.id },
        data: {
          extractedData: JSON.stringify(extractedData),
          aiSummary,
          aiRecommendations,
          status: 'completed',
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: analysis?.id,
        ...resultData,
      },
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    
    // Update status to failed if we have an analysis
    const data = await request.clone().json();
    if (data.analysisId) {
      try {
        await db.documentAnalysis.update({
          where: { id: data.analysisId },
          data: { status: 'failed' },
        });
      } catch {
        // Ignore update errors
      }
    }

    return NextResponse.json(
      { error: 'Error al analizar documento' },
      { status: 500 }
    );
  }
}
