import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

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
    
    const body = await req.json();
    const { analysisId, content } = body;
    
    let result = { extractedData: {}, aiSummary: 'OK', aiRecommendations: 'OK' };
    
    if (analysisId) {
      const existing = await db.documentAnalysis.findFirst({ 
        where: { id: analysisId, companyId: user.companyId } 
      });
      if (existing) {
        await db.documentAnalysis.update({
          where: { id: analysisId },
          data: {
            extractedData: JSON.stringify({ content: content || '' }),
            aiSummary: 'Analizado',
            aiRecommendations: 'Revisar',
            status: 'completed',
            completedAt: new Date()
          }
        });
      }
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
