"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Eye,
  Download,
  Square,
  BedDouble,
  Bath,
  Calendar,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle,
  Clock,
  HardHat
} from "lucide-react"

interface ClientProject {
  id: string
  name: string
  description: string | null
  location: string | null
  status: string
  totalArea: number | null
  floors: number | null
  bedrooms: number | null
  bathrooms: number | null
  createdAt: string
  plans: {
    id: string
    name: string
    type: string
    fileName: string
    filePath: string
    visibleToClient: boolean
  }[]
  work?: {
    id: string
    name: string
    status: string
    progress: number
  } | null
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  IN_DESIGN: "bg-blue-500",
  FOR_REVIEW: "bg-yellow-500",
  APPROVED: "bg-green-500",
  IN_CONSTRUCTION: "bg-purple-500",
  COMPLETED: "bg-emerald-500"
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  IN_DESIGN: "En Diseño",
  FOR_REVIEW: "Pendiente Revisión",
  APPROVED: "Aprobado",
  IN_CONSTRUCTION: "En Construcción",
  COMPLETED: "Completado"
}

const planTypeLabels: Record<string, string> = {
  FLOOR_PLAN: "Planta",
  ELEVATION: "Alzado",
  SECTION: "Sección",
  ELECTRICAL: "Eléctrico",
  PLUMBING: "Fontanería",
  STRUCTURE: "Estructura",
  LANDSCAPE: "Jardinería",
  THREED_MODEL: "Modelo 3D",
  RENDER: "Render",
  OTHER: "Otro"
}

export default function ClientPortalPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/client/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error("Error fetching client projects:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Mi Portal de Proyectos
          </h1>
          <p className="text-gray-500 mt-2">Visualiza tus proyectos, planos y el avance de tus obras</p>
        </div>

        {projects.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">Sin proyectos asignados</h3>
              <p className="text-gray-400 mt-2">Tu arquitecto te asignará proyectos pronto</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <CardDescription className="text-blue-100 mt-1">
                        {project.location}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusColors[project.status]} text-white`}>
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="w-full rounded-none border-b h-12">
                      <TabsTrigger value="info" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Información
                      </TabsTrigger>
                      <TabsTrigger value="plans" className="flex-1">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Planos ({project.plans.filter(p => p.visibleToClient).length})
                      </TabsTrigger>
                      {project.work && (
                        <TabsTrigger value="work" className="flex-1">
                          <HardHat className="h-4 w-4 mr-2" />
                          Obra
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="info" className="p-6">
                      {project.description && (
                        <p className="text-gray-600 mb-4">{project.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {project.totalArea && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Square className="h-5 w-5 text-blue-600" />
                            <span>{project.totalArea} m²</span>
                          </div>
                        )}
                        {project.floors && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <span>{project.floors} plantas</span>
                          </div>
                        )}
                        {project.bedrooms && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <BedDouble className="h-5 w-5 text-blue-600" />
                            <span>{project.bedrooms} dormitorios</span>
                          </div>
                        )}
                        {project.bathrooms && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Bath className="h-5 w-5 text-blue-600" />
                            <span>{project.bathrooms} baños</span>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="plans" className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {project.plans
                          .filter(p => p.visibleToClient)
                          .map((plan) => (
                            <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                                {plan.type === "RENDER" || plan.type === "THREED_MODEL" ? (
                                  <ImageIcon className="h-12 w-12 text-gray-400" />
                                ) : (
                                  <FileText className="h-12 w-12 text-gray-400" />
                                )}
                              </div>
                              <CardContent className="p-4">
                                <h4 className="font-medium">{plan.name}</h4>
                                <p className="text-sm text-gray-500">{planTypeLabels[plan.type] || plan.type}</p>
                                <div className="flex gap-2 mt-3">
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                                    <Download className="h-4 w-4 mr-1" />
                                    Descargar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        {project.plans.filter(p => p.visibleToClient).length === 0 && (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>Los planos estarán disponibles próximamente</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {project.work && (
                      <TabsContent value="work" className="p-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">{project.work.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Progreso</span>
                              <span className="font-medium">{project.work.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${project.work.progress}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <Badge className={`${statusColors[project.work.status]} text-white`}>
                                {statusLabels[project.work.status]}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
