"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  Plus,
  FileText,
  Upload,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Square,
  BedDouble,
  Bath,
  CheckCircle,
  Clock,
  AlertCircle,
  FolderOpen,
  Image as ImageIcon
} from "lucide-react"

interface ArchitectProject {
  id: string
  name: string
  description: string | null
  location: string | null
  status: string
  clientName: string | null
  totalArea: number | null
  floors: number | null
  bedrooms: number | null
  bathrooms: number | null
  visibleToClient: boolean
  createdAt: string
  plans: { id: string; name: string; type: string; fileName: string }[]
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  IN_DESIGN: "bg-blue-500",
  FOR_REVIEW: "bg-yellow-500",
  APPROVED: "bg-green-500",
  IN_CONSTRUCTION: "bg-purple-500",
  COMPLETED: "bg-emerald-500",
  ARCHIVED: "bg-gray-400"
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  IN_DESIGN: "En Diseño",
  FOR_REVIEW: "Pendiente Revisión",
  APPROVED: "Aprobado",
  IN_CONSTRUCTION: "En Construcción",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado"
}

export default function ArchitectPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ArchitectProject[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ArchitectProject | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/architect/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await fetch("/api/architect/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          location: formData.get("location"),
          clientName: formData.get("clientName"),
          totalArea: parseFloat(formData.get("totalArea") as string) || null,
          floors: parseInt(formData.get("floors") as string) || null,
          bedrooms: parseInt(formData.get("bedrooms") as string) || null,
          bathrooms: parseInt(formData.get("bathrooms") as string) || null,
        })
      })
      
      if (res.ok) {
        setCreateDialogOpen(false)
        fetchProjects()
      }
    } catch (error) {
      console.error("Error creating project:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Proyectos Arquitectónicos
          </h1>
          <p className="text-gray-500 mt-1">Gestiona proyectos y planos de arquitectura</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
              <DialogDescription>
                Complete los datos del nuevo proyecto arquitectónico
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nombre del Proyecto *</Label>
                  <Input id="name" name="name" required placeholder="Ej: Villa Mediterránea" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" name="description" placeholder="Descripción del proyecto..." />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" name="location" placeholder="Dirección o zona" />
                </div>
                <div>
                  <Label htmlFor="clientName">Cliente</Label>
                  <Input id="clientName" name="clientName" placeholder="Nombre del cliente" />
                </div>
                <div>
                  <Label htmlFor="totalArea">Superficie (m²)</Label>
                  <Input id="totalArea" name="totalArea" type="number" placeholder="250" />
                </div>
                <div>
                  <Label htmlFor="floors">Plantas</Label>
                  <Input id="floors" name="floors" type="number" placeholder="2" />
                </div>
                <div>
                  <Label htmlFor="bedrooms">Dormitorios</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" placeholder="4" />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Baños</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" placeholder="3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Crear Proyecto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Proyectos</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En Diseño</p>
              <p className="text-2xl font-bold">{projects.filter(p => p.status === "IN_DESIGN").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aprobados</p>
              <p className="text-2xl font-bold">{projects.filter(p => p.status === "APPROVED").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Planos</p>
              <p className="text-2xl font-bold">{projects.reduce((acc, p) => acc + p.plans.length, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {project.location && (
                      <>
                        <Building2 className="h-3 w-3" />
                        {project.location}
                      </>
                    )}
                  </CardDescription>
                </div>
                <Badge className={`${statusColors[project.status]} text-white`}>
                  {statusLabels[project.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
              )}
              
              {/* Specs */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                {project.totalArea && (
                  <span className="flex items-center gap-1">
                    <Square className="h-4 w-4" />
                    {project.totalArea} m²
                  </span>
                )}
                {project.floors && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {project.floors} plantas
                  </span>
                )}
                {project.bedrooms && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-4 w-4" />
                    {project.bedrooms}
                  </span>
                )}
                {project.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {project.bathrooms}
                  </span>
                )}
              </div>

              {/* Client & Visibility */}
              <div className="flex justify-between items-center text-sm">
                {project.clientName && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    {project.clientName}
                  </span>
                )}
                {project.visibleToClient && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Eye className="h-3 w-3 mr-1" />
                    Visible cliente
                  </Badge>
                )}
              </div>

              {/* Plans count */}
              <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
                <ImageIcon className="h-4 w-4" />
                {project.plans.length} planos subidos
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/architect/${project.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </Link>
                <Link href={`/architect/${project.id}/upload`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Planos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No hay proyectos</h3>
            <p className="text-gray-400 mt-1">Crea tu primer proyecto arquitectónico</p>
          </div>
        )}
      </div>
    </div>
  )
}
