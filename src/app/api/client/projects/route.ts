import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Listar proyectos visibles para el cliente
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

    // Clientes ven proyectos donde son el cliente o donde la obra está asociada a ellos
    let projects = []

    if (user.role === "CLIENT") {
      // Buscar proyectos donde el cliente está asignado
      projects = await db.architectProject.findMany({
        where: {
          OR: [
            { clientEmail: user.email },
            { visibleToClient: true }
          ]
        },
        include: {
          plans: {
            where: { 
              isActive: true,
              visibleToClient: true 
            },
            select: { 
              id: true, 
              name: true, 
              type: true, 
              fileName: true,
              filePath: true,
              visibleToClient: true
            }
          },
          work: {
            select: {
              id: true,
              name: true,
              status: true,
              progress: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    } else {
      // Otros roles ven todos los proyectos visibles
      projects = await db.architectProject.findMany({
        where: { visibleToClient: true },
        include: {
          plans: {
            where: { 
              isActive: true,
              visibleToClient: true 
            },
            select: { 
              id: true, 
              name: true, 
              type: true, 
              fileName: true,
              filePath: true,
              visibleToClient: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching client projects:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
