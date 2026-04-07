import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - List document analyses with filtering
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const analysisType = searchParams.get('analysisType');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (analysisType) {
      where.analysisType = analysisType;
    }

    if (search) {
      where.fileName = { contains: search };
    }

    const [analyses, total] = await Promise.all([
      db.documentAnalysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.documentAnalysis.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: analyses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching document analyses:', error);
    return NextResponse.json(
      { error: 'Error al obtener análisis de documentos' },
      { status: 500 }
    );
  }
}

// POST - Create new document analysis
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
    const content = formData.get('content') as string | null;
    const analysisType = (formData.get('analysisType') as string) || 'generic';
    const documentId = formData.get('documentId') as string | null;

    // Validate input
    if (!file && !content) {
      return NextResponse.json(
        { error: 'Se requiere un archivo o contenido de texto' },
        { status: 400 }
      );
    }

    // Validate analysis type
    const validTypes = ['budget', 'contract', 'product_list', 'generic'];
    if (!validTypes.includes(analysisType)) {
      return NextResponse.json(
        { error: 'Tipo de análisis inválido' },
        { status: 400 }
      );
    }

    let fileName = '';
    let filePath = '';
    let fileContent = content || '';

    if (file) {
      fileName = file.name;
      // In a real implementation, we would save the file and extract text
      // For now, we'll use a placeholder path
      filePath = `/uploads/analysis/${Date.now()}_${file.name}`;
      
      // Extract text from file
      if (file.type === 'text/plain' || file.type === 'application/json') {
        fileContent = await file.text();
      } else {
        // For PDFs and other formats, we'd need proper extraction
        // For now, store a placeholder
        fileContent = `[Contenido del archivo: ${file.name}]`;
      }
    }

    // Create the analysis record
    const analysis = await db.documentAnalysis.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        documentId: documentId || null,
        analysisType,
        fileName: fileName || 'Análisis de texto',
        filePath: filePath || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      fileContent: fileContent.substring(0, 5000), // Return content for immediate analysis
    });
  } catch (error) {
    console.error('Error creating document analysis:', error);
    return NextResponse.json(
      { error: 'Error al crear análisis de documento' },
      { status: 500 }
    );
  }
}
