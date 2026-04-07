'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  FileText,
  Calendar,
  Building2,
  Star,
  ArrowRight
} from 'lucide-react'

interface DashboardStats {
  generalStats: {
    totalSubcontractors: number
    activeSubcontractors: number
    pendingTasks: number
    pendingValidations: number
    pendingPayments: number
    totalPenaltiesAmount: number
    topSubcontractors: Array<{
      id: string
      businessName: string | null
      specialty: string | null
      rating: number
      completedWorks: number
    }>
  }
  alerts: {
    delayedTasks: Array<any>
    documentsExpiring: Array<any>
    pendingAdvances: Array<any>
  }
  pendingPayments: Array<any>
  recentActivity: Array<any>
  monthlyStats: {
    newTasks: number
    completedTasks: number
    totalInvoiced: number
  }
}

export function SubcontractorDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/subcontractors/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3" />
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
          No se pudieron cargar los datos del dashboard
        </CardContent>
      </Card>
    )
  }

  const { generalStats, alerts, pendingPayments, recentActivity, monthlyStats } = data

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subcontratas Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalStats.activeSubcontractors}</div>
            <p className="text-xs text-muted-foreground">
              de {generalStats.totalSubcontractors} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalStats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              en ejecución
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Validaciones Pendientes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalStats.pendingValidations}</div>
            <p className="text-xs text-muted-foreground">
              esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalStats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              fases validadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(alerts.delayedTasks.length > 0 || alerts.documentsExpiring.length > 0 || alerts.pendingAdvances.length > 0) && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {alerts.delayedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Tareas Retrasadas</h4>
                  <div className="text-2xl font-bold text-destructive">{alerts.delayedTasks.length}</div>
                  <ScrollArea className="h-20">
                    {alerts.delayedTasks.slice(0, 3).map((task: any) => (
                      <div key={task.id} className="text-xs text-muted-foreground py-1">
                        {task.title} - {task.subcontractor?.businessName}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {alerts.documentsExpiring.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Documentos por Expirar</h4>
                  <div className="text-2xl font-bold text-orange-500">{alerts.documentsExpiring.length}</div>
                  <ScrollArea className="h-20">
                    {alerts.documentsExpiring.slice(0, 3).map((sub: any) => (
                      <div key={sub.id} className="text-xs text-muted-foreground py-1">
                        {sub.businessName}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {alerts.pendingAdvances.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Anticipos Pendientes</h4>
                  <div className="text-2xl font-bold text-yellow-500">{alerts.pendingAdvances.length}</div>
                  <ScrollArea className="h-20">
                    {alerts.pendingAdvances.slice(0, 3).map((advance: any) => (
                      <div key={advance.id} className="text-xs text-muted-foreground py-1">
                        {advance.amount}€ - {advance.subcontractor?.businessName}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Subcontractors */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Subcontratas
            </CardTitle>
            <CardDescription>Mejor valoradas por rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {generalStats.topSubcontractors.map((sub, index) => (
                  <div key={sub.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{sub.businessName || 'Sin nombre'}</p>
                        {sub.specialty && (
                          <Badge variant="outline" className="text-xs">
                            {sub.specialty}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {sub.rating.toFixed(1)}
                        <span className="text-xs">• {sub.completedWorks} obras</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pagos Pendientes
            </CardTitle>
            <CardDescription>Fases validadas esperando pago</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {pendingPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay pagos pendientes
                  </p>
                ) : (
                  pendingPayments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{payment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.subcontractor?.businessName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{payment.totalAmount}€</p>
                        <Button size="sm" variant="outline" className="mt-1 h-7 text-xs">
                          Procesar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estadísticas del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold">{monthlyStats.newTasks}</div>
              <p className="text-sm text-muted-foreground">Nuevas Tareas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{monthlyStats.completedTasks}</div>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{monthlyStats.totalInvoiced.toLocaleString()}€</div>
              <p className="text-sm text-muted-foreground">Facturado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
