'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Star,
  Upload,
  Camera,
  MapPin,
  Calendar
} from 'lucide-react'

interface SubcontractorData {
  profile: {
    id: string
    businessName: string | null
    specialty: string | null
    rating: number
    totalWorks: number
    completedWorks: number
    onTimeRate: number
    qualityScore: number
    totalPenalties: number
  }
  tasks: Array<{
    id: string
    title: string
    status: string
    progress: number
    work: {
      id: string
      name: string
      address: string
    }
    estimatedEndDate: string | null
  }>
  payments: Array<{
    id: string
    name: string
    status: string
    totalAmount: number
    work: {
      name: string
    }
  }>
  invoices: Array<{
    id: string
    invoiceNumber: string
    total: number
    status: string
    issueDate: string
  }>
}

export function SubcontractorPortal() {
  const [data, setData] = useState<SubcontractorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    fetchSubcontractorData()
  }, [])

  const fetchSubcontractorData = async () => {
    try {
      // Mock data for demo - in production, this would fetch from API
      setData({
        profile: {
          id: '1',
          businessName: 'Electricidad García S.L.',
          specialty: 'Electricista',
          rating: 4.5,
          totalWorks: 25,
          completedWorks: 22,
          onTimeRate: 88,
          qualityScore: 4.2,
          totalPenalties: 150
        },
        tasks: [
          {
            id: '1',
            title: 'Instalación eléctrica planta baja',
            status: 'IN_PROGRESS',
            progress: 65,
            work: {
              id: 'w1',
              name: 'Casa Madrid Norte',
              address: 'Calle Principal 123, Madrid'
            },
            estimatedEndDate: '2024-02-15'
          },
          {
            id: '2',
            title: 'Cuadro eléctrico general',
            status: 'ASSIGNED',
            progress: 0,
            work: {
              id: 'w2',
              name: 'Piso Reforma Centro',
              address: 'Plaza Mayor 5, Madrid'
            },
            estimatedEndDate: '2024-02-20'
          }
        ],
        payments: [
          {
            id: 'p1',
            name: 'Fase 1: Inicio instalación',
            status: 'VALIDATED',
            totalAmount: 1500,
            work: { name: 'Casa Madrid Norte' }
          }
        ],
        invoices: [
          {
            id: 'i1',
            invoiceNumber: 'FAC-2024-0001',
            total: 3630,
            status: 'pending',
            issueDate: '2024-01-15'
          }
        ]
      })
    } catch (error) {
      console.error('Error fetching subcontractor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      ASSIGNED: { variant: 'secondary', label: 'Asignada' },
      IN_PROGRESS: { variant: 'default', label: 'En Progreso' },
      COMPLETED: { variant: 'outline', label: 'Completada' },
      VALIDATED: { variant: 'default', label: 'Validada' },
      REJECTED: { variant: 'destructive', label: 'Rechazada' },
      PENDING: { variant: 'secondary', label: 'Pendiente' },
      VALIDATED: { variant: 'default', label: 'Validada' },
      PAID: { variant: 'default', label: 'Pagada' }
    }
    const config = variants[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No se encontraron datos de subcontrata
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {data.profile.businessName}
              </CardTitle>
              <CardDescription>{data.profile.specialty}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{data.profile.rating.toFixed(1)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.profile.totalWorks}</div>
              <p className="text-sm text-muted-foreground">Total Obras</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{data.profile.completedWorks}</div>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{data.profile.onTimeRate}%</div>
              <p className="text-sm text-muted-foreground">A Tiempo</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.profile.qualityScore.toFixed(1)}</div>
              <p className="text-sm text-muted-foreground">Calidad</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Mis Tareas</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="evidence">Evidencias</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {data.tasks.map((task) => (
            <Card key={task.id}>
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
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} />
                </div>
                
                {task.estimatedEndDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Fecha estimada: {new Date(task.estimatedEndDate).toLocaleDateString()}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Subir Foto
                  </Button>
                  <Button size="sm">
                    Actualizar Progreso
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {data.payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{payment.name}</p>
                  <p className="text-sm text-muted-foreground">{payment.work.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{payment.totalAmount.toLocaleString()}€</p>
                  {getStatusBadge(payment.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {data.invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{invoice.total.toLocaleString()}€</p>
                  {getStatusBadge(invoice.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir Evidencia
              </CardTitle>
              <CardDescription>
                Sube fotos o vídeos de tus trabajos para validación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <Button>Seleccionar Archivos</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
