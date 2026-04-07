import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET - List document analyses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    
    const [analyses, total] = await Promise.all([
      db.documentAnalysis.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      db.documentAnalysis.count({ where }),
    ]);
    
    return NextResponse.json({ success: true, data: analyses, pagination: { total, limit, offset } });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

// POST - Create document analysis
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const content = formData.get('content') as string | null;
    const analysisType = (formData.get('analysisType') as string) || 'generic';
    
    if (!file && !content) {
      return NextResponse.json({ error: 'Se requiere archivo o contenido' }, { status: 400 });
    }
    
    const fileName = file ? file.name : 'Analisis de texto';
    
    const analysis = await db.documentAnalysis.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        analysisType,
        fileName,
        status: 'pending',
      },
    });
    
    return NextResponse.json({ success: true, data: analysis });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
