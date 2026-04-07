'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  User,
  Building2,
  Filter
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  progress: number
  assignedAt: string
  startDate: string | null
  estimatedEndDate: string | null
  completedAt: string | null
  agreedAmount: number | null
  subcontractor: {
    id: string
    businessName: string | null
    specialty: string | null
    rating: number
  }
  work: {
    id: string
    name: string
    status: string
    address: string
  }
  evidences: Array<{ id: string; type: string }>
  validations: Array<{ id: string; status: string }>
}

export default function SubcontractorTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [statusFilter])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/subcontractors/tasks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      ASSIGNED: { variant: 'secondary', label: 'Asignada' },
      IN_PROGRESS: { variant: 'default', label: 'En Progreso' },
      COMPLETED: { variant: 'outline', label: 'Completada' },
      VALIDATED: { variant: 'default', label: 'Validada' },
      REJECTED: { variant: 'destructive', label: 'Rechazada' }
    }
    const config = configs[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const isDelayed = (task: Task) => {
    if (task.status === 'VALIDATED' || task.status === 'COMPLETED') return false
    if (!task.estimatedEndDate) return false
    return new Date(task.estimatedEndDate) < new Date()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tareas de Subcontratas</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de tareas asignadas
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asignar Nueva Tarea</DialogTitle>
              <DialogDescription>
                Crea y asigna una nueva tarea a una subcontrata
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Obra</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar obra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Casa Madrid Norte</SelectItem>
                      <SelectItem value="2">Piso Reforma Centro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcontrata</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar subcontrata" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Electricidad García S.L.</SelectItem>
                      <SelectItem value="2">Fontanería López</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título de la tarea</Label>
                <Input placeholder="Ej: Instalación eléctrica planta baja" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea placeholder="Descripción detallada de la tarea..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estructura">Estructura</SelectItem>
                      <SelectItem value="cerramientos">Cerramientos</SelectItem>
                      <SelectItem value="instalaciones">Instalaciones</SelectItem>
                      <SelectItem value="acabados">Acabados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Importe acordado (€)</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha estimada de finalización</Label>
                <Input type="date" />
              </div>
              <Button className="w-full">Crear y Asignar Tarea</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ASSIGNED">Asignadas</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="COMPLETED">Completadas</SelectItem>
                <SelectItem value="VALIDATED">Validadas</SelectItem>
                <SelectItem value="REJECTED">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4" />
            <p>No hay tareas que mostrar</p>
            <p className="text-sm">Crea una nueva tarea para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <Card 
                key={task.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  isDelayed(task) ? 'border-destructive/50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3" />
                        {task.work.address}
                      </CardDescription>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subcontractor Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{task.subcontractor.businessName || 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span>{task.subcontractor.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} />
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {task.category && (
                      <Badge variant="outline">{task.category}</Badge>
                    )}
                    {task.agreedAmount && (
                      <span className="flex items-center gap-1">
                        💰 {task.agreedAmount.toLocaleString()}€
                      </span>
                    )}
                    {task.estimatedEndDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.estimatedEndDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      📷 {task.evidences.length} evidencias
                    </span>
                  </div>

                  {/* Delay Warning */}
                  {isDelayed(task) && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Tarea retrasada</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                    {task.status === 'COMPLETED' && (
                      <Button size="sm">
                        Validar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
