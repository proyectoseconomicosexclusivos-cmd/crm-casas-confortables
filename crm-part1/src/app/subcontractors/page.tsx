'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Users,
  Search,
  Plus,
  Star,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  FileText
} from 'lucide-react'
import { SubcontractorDashboard } from '@/components/subcontractors/subcontractor-dashboard'

interface Subcontractor {
  id: string
  businessName: string | null
  specialty: string | null
  rating: number
  totalWorks: number
  completedWorks: number
  onTimeRate: number
  isActive: boolean
  isVerified: boolean
  tasks: Array<{
    id: string
    title: string
    status: string
  }>
  _count: {
    tasks: number
    contracts: number
    paymentPhases: number
  }
}

export default function SubcontractorsPage() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (activeTab === 'list') {
      fetchSubcontractors()
    }
  }, [activeTab, searchQuery])

  const fetchSubcontractors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/subcontractors?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSubcontractors(data.subcontractors)
      }
    } catch (error) {
      console.error('Error fetching subcontractors:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Subcontratas</h1>
          <p className="text-muted-foreground">
            Control total de ejecución, validación de trabajos y gestión de pagos
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Subcontrata
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Subcontrata</DialogTitle>
              <DialogDescription>
                Añade una nueva subcontrata al sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Razón Social</Label>
                <Input placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-2">
                <Label>CIF/NIF</Label>
                <Input placeholder="B12345678" />
              </div>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Input placeholder="Electricista, Fontanero, etc." />
              </div>
              <div className="space-y-2">
                <Label>Habilidades (separadas por coma)</Label>
                <Textarea placeholder="Instalaciones, Mantenimiento, Reparaciones..." />
              </div>
              <Button className="w-full">Registrar Subcontrata</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="list">Subcontratas</TabsTrigger>
          <TabsTrigger value="validations">Validaciones</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <SubcontractorDashboard />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {/* Search */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, especialidad o CIF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Subcontractors List */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subcontractors.map((sub) => (
                  <Card key={sub.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {sub.businessName || 'Sin nombre'}
                            </CardTitle>
                            <CardDescription>
                              {sub.specialty || 'Sin especialidad'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">{sub.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Status Badges */}
                        <div className="flex gap-2">
                          {sub.isActive ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                          {sub.isVerified && (
                            <Badge variant="outline" className="text-xs">
                              Verificado
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <p className="font-bold">{sub.totalWorks}</p>
                            <p className="text-xs text-muted-foreground">Obras</p>
                          </div>
                          <div>
                            <p className="font-bold text-green-500">{sub.completedWorks}</p>
                            <p className="text-xs text-muted-foreground">Completadas</p>
                          </div>
                          <div>
                            <p className="font-bold text-blue-500">{sub.onTimeRate.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">A tiempo</p>
                          </div>
                        </div>

                        {/* Active Tasks */}
                        {sub.tasks.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Tareas activas:</p>
                            <div className="flex flex-wrap gap-1">
                              {sub.tasks.slice(0, 2).map((task) => (
                                <Badge key={task.id} variant="secondary" className="text-xs">
                                  {task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}
                                </Badge>
                              ))}
                              {sub.tasks.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{sub.tasks.length - 2} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="validations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Validaciones Pendientes</CardTitle>
              <CardDescription>
                Tareas completadas que requieren validación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No hay validaciones pendientes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pagos</CardTitle>
              <CardDescription>
                Fases de pago pendientes y procesamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4" />
                <p>No hay pagos pendientes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Business Rules Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reglas de Negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Sin validación → No se puede pagar</p>
                <p className="text-muted-foreground">Una fase debe estar validada antes de pagar</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Anticipos con garantía</p>
                <p className="text-muted-foreground">Requieren aval, seguro o pagaré</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Facturas controladas</p>
                <p className="text-muted-foreground">Solo desde fases validadas</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium">Penalizaciones automáticas</p>
                <p className="text-muted-foreground">Por retrasos e incumplimientos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
