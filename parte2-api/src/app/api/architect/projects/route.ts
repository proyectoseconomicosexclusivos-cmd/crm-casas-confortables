import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Listar proyectos
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Arquitectos ven sus proyectos, Admins ven todos
    const where = user.role === "ARCHITECT" 
      ? { createdById: user.id } 
      : {}

    const projects = await db.architectProject.findMany({
      where,
      include: {
        plans: {
          where: { isActive: true },
          select: { id: true, name: true, type: true, fileName: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching architect projects:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

// POST - Crear proyecto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !["ARCHITECT", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    const data = await request.json()

    const project = await db.architectProject.create({
      data: {
        name: data.name,
        description: data.description || null,
        location: data.location || null,
        clientName: data.clientName || null,
        totalArea: data.totalArea ? parseFloat(data.totalArea) : null,
        floors: data.floors ? parseInt(data.floors) : null,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
        companyId: user.companyId || "main-company",
        createdById: user.id,
        status: "DRAFT"
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error creating architect project:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
