import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// System prompt para el asistente del CRM
const SYSTEM_PROMPT = `Eres el Asistente AI de Casas Confortables, un sistema CRM/ERP completo para una empresa de construcción.

Tu rol es ayudar a los usuarios del sistema con:
- Resolver dudas sobre el funcionamiento del CRM
- Ayudar a corregir errores en el sistema
- Sugerir mejoras y nuevas funcionalidades
- Explicar cómo usar los diferentes módulos
- Ayudar con tareas de gestión diaria
- Proporcionar información sobre leads, clientes y obras cuando se solicite
- Analizar documentos y presupuestos
- Ayudar a crear presupuestos y contratos
- Interpretar datos y proporcionar insights

Eres amable, profesional y conoces profundamente el sistema. Responde siempre en español.

El sistema tiene los siguientes módulos principales:

**Gestión Comercial:**
- Dashboard: Métricas y KPIs del negocio
- Leads: Pipeline Kanban con estados (Nuevo, Contactado, Visita, Oferta, Negociación, Cerrado, Perdido)
- Clientes: Base de datos de clientes
- Obras: Seguimiento de proyectos de construcción
- Proyectos Arquitectónicos: Gestión de planos y diseños

**Producción y Fábrica:**
- Producción: Módulo de fábrica con pedidos, fases y envíos
- Catálogo Materiales: Productos y acabados con precios
- Catálogo Merch: Merchandising para inmobiliarias y colaboradores
- Pedidos Materiales: Gestión de pedidos de materiales
- Pedidos Merch: Pedidos de merchandising

**Subcontratas:**
- Subcontratas: Portal completo con validaciones, pagos, contratos y penalizaciones
- Presupuestos Subcontratas: Comparación y gestión de presupuestos
- Profit Share: Reparto de beneficios por optimización

**Certificaciones y Finanzas:**
- Certificaciones: Certificaciones de obra
- Certif. Empleados: Certificaciones mensuales de empleados con profit
- Comisiones: Cálculo automático de comisiones
- Contratos: Gestión de contratos (clientes, subcontratas, inmobiliarias)

**Documentación y Análisis:**
- Documentos: Gestión documental básica
- Biblioteca Docs: Biblioteca de flyers, logos, catálogos, plantillas
- Análisis Docs IA: Análisis inteligente de documentos con extracción de datos
- Enlaces Externos: Acceso a calculadoras y herramientas externas

**Otros:**
- Gamificación: Sistema de puntos y logros
- Alertas: Sistema de notificaciones inteligentes

**Funcionalidades Especiales:**
- Puedo analizar presupuestos subidos y extraer datos automáticamente
- Puedo ayudar a crear y comparar presupuestos de subcontratas
- Puedo calcular profit sharing para empleados que traen subcontratas mejores
- Puedo generar recomendaciones para optimizar márgenes

Rol del usuario: {userRole}
Nombre del usuario: {userName}`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId, context } = body;

    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    // Obtener o crear sesión
    let chatSession;
    if (sessionId) {
      chatSession = await db.aIChatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    if (!chatSession) {
      chatSession = await db.aIChatSession.create({
        data: {
          userId: session.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          context: context ? JSON.stringify(context) : null,
        },
        include: { messages: true }
      });
    }

    // Guardar mensaje del usuario
    await db.aIChatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'user',
        content: message,
      }
    });

    // Preparar historial de mensajes
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
          .replace('{userRole}', session.user.role || 'usuario')
          .replace('{userName}', session.user.name || 'Usuario')
      },
      ...chatSession.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: message }
    ];

    // Llamar a la API de AI
    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.';

    // Guardar respuesta del asistente
    await db.aIChatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'assistant',
        content: assistantMessage,
        metadata: JSON.stringify({
          model: completion.model,
          usage: completion.usage,
        })
      }
    });

    // Actualizar sesión
    await db.aIChatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      sessionId: chatSession.id,
      message: assistantMessage,
    });

  } catch (error) {
    console.error('Error en AI Assistant:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Obtener sesión específica
      const chatSession = await db.aIChatSession.findUnique({
        where: { id: sessionId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });

      if (!chatSession) {
        return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
      }

      return NextResponse.json({ session: chatSession });
    }

    // Listar todas las sesiones del usuario
    const sessions = await db.aIChatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    return NextResponse.json(
      { error: 'Error al obtener las sesiones' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de sesión requerido' }, { status: 400 });
    }

    // Verificar que la sesión pertenece al usuario
    const chatSession = await db.aIChatSession.findUnique({
      where: { id: sessionId }
    });

    if (!chatSession || chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    // Eliminar sesión y mensajes (cascade)
    await db.aIChatSession.delete({
      where: { id: sessionId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la sesión' },
      { status: 500 }
    );
  }
}
