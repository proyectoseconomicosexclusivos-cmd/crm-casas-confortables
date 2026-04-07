'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Calendar
} from 'lucide-react'

interface PaymentPhase {
  id: string
  name: string
  description: string | null
  phaseOrder: number
  totalAmount: number
  paymentPercent: number
  status: string
  startDate: string | null
  completedDate: string | null
  validatedDate: string | null
  paidDate: string | null
  validationComments: string | null
  paymentReference: string | null
  subcontractor: {
    id: string
    businessName: string | null
  }
  work: {
    id: string
    name: string
  }
}

interface PaymentPhaseManagerProps {
  workId?: string
  subcontractorId?: string
}

export function PaymentPhaseManager({ workId, subcontractorId }: PaymentPhaseManagerProps) {
  const [phases, setPhases] = useState<PaymentPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<PaymentPhase | null>(null)

  // Form state for new phase
  const [newPhase, setNewPhase] = useState({
    name: '',
    description: '',
    totalAmount: 0,
    paymentPercent: 0,
    phaseOrder: 1
  })

  useEffect(() => {
    fetchPhases()
  }, [workId, subcontractorId])

  const fetchPhases = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (workId) params.append('workId', workId)
      if (subcontractorId) params.append('subcontractorId', subcontractorId)

      const response = await fetch(`/api/subcontractors/payment-phases?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPhases(data.phases)
      }
    } catch (error) {
      console.error('Error fetching phases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePhase = async () => {
    if (!subcontractorId || !workId) return

    try {
      const response = await fetch('/api/subcontractors/payment-phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPhase,
          subcontractorId,
          workId
        })
      })

      if (response.ok) {
        setShowCreateDialog(false)
        fetchPhases()
        setNewPhase({
          name: '',
          description: '',
          totalAmount: 0,
          paymentPercent: 0,
          phaseOrder: phases.length + 1
        })
      }
    } catch (error) {
      console.error('Error creating phase:', error)
    }
  }

  const handlePhaseAction = async (phaseId: string, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/subcontractors/payment-phases/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      })

      if (response.ok) {
        fetchPhases()
      }
    } catch (error) {
      console.error('Error updating phase:', error)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      PENDING: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-4 w-4" />, label: 'Pendiente' },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: <ArrowRight className="h-4 w-4" />, label: 'En Progreso' },
      COMPLETED: { color: 'bg-yellow-100 text-yellow-800', icon: <CheckCircle className="h-4 w-4" />, label: 'Completada' },
      VALIDATED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" />, label: 'Validada' },
      PAID: { color: 'bg-emerald-100 text-emerald-800', icon: <DollarSign className="h-4 w-4" />, label: 'Pagada' }
    }
    return configs[status] || configs.PENDING
  }

  const calculatePhaseProgress = () => {
    if (phases.length === 0) return 0
    const paidPhases = phases.filter(p => p.status === 'PAID').length
    return (paidPhases / phases.length) * 100
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando fases de pago...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fases de Pago
              </CardTitle>
              <CardDescription>
                Gestiona el progreso de pagos de la subcontrata
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Fase
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Fase de Pago</DialogTitle>
                  <DialogDescription>
                    Define los detalles de la nueva fase de pago
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre de la fase</Label>
                    <Input
                      value={newPhase.name}
                      onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                      placeholder="Ej: Fase 1: Inicio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newPhase.description}
                      onChange={(e) => setNewPhase({ ...newPhase, description: e.target.value })}
                      placeholder="Descripción de la fase..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Importe (€)</Label>
                      <Input
                        type="number"
                        value={newPhase.totalAmount}
                        onChange={(e) => setNewPhase({ ...newPhase, totalAmount: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Porcentaje (%)</Label>
                      <Input
                        type="number"
                        value={newPhase.paymentPercent}
                        onChange={(e) => setNewPhase({ ...newPhase, paymentPercent: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreatePhase} className="w-full">
                    Crear Fase
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso total</span>
              <span>{calculatePhaseProgress().toFixed(0)}%</span>
            </div>
            <Progress value={calculatePhaseProgress()} />
          </div>
        </CardContent>
      </Card>

      {/* Phases List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {phases.map((phase, index) => {
            const statusConfig = getStatusConfig(phase.status)
            
            return (
              <Card key={phase.id} className={selectedPhase?.id === phase.id ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {phase.phaseOrder}
                      </div>
                      <div>
                        <CardTitle className="text-base">{phase.name}</CardTitle>
                        <CardDescription>
                          {phase.work.name} - {phase.subcontractor.businessName}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={statusConfig.color}>
                      <span className="flex items-center gap-1">
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Importe:</span>
                      <span className="font-bold ml-2">{phase.totalAmount.toLocaleString()}€</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Porcentaje:</span>
                      <span className="font-medium ml-2">{phase.paymentPercent}%</span>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {phase.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Inicio: {new Date(phase.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {phase.paidDate && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Pagado: {new Date(phase.paidDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2">
                    {phase.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePhaseAction(phase.id, 'start')}
                      >
                        Iniciar
                      </Button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {phase.status === 'PENDING' && (
                      <Button 
                        size="sm" 
                        onClick={() => handlePhaseAction(phase.id, 'start')}
                      >
                        Iniciar Fase
                      </Button>
                    )}
                    {phase.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm" 
                        onClick={() => handlePhaseAction(phase.id, 'complete')}
                      >
                        Marcar Completada
                      </Button>
                    )}
                    {phase.status === 'COMPLETED' && (
                      <Button 
                        size="sm"
                        onClick={() => handlePhaseAction(phase.id, 'validate')}
                      >
                        Validar
                      </Button>
                    )}
                    {phase.status === 'VALIDATED' && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          const ref = prompt('Introduce la referencia de pago:')
                          if (ref) handlePhaseAction(phase.id, 'pay', { paymentReference: ref })
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Marcar Pagada
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
