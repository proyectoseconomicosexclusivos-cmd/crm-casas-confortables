'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  FileText,
  Signature,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  DollarSign,
  Calendar,
  PenTool,
  Send,
  Download
} from 'lucide-react'

interface Contract {
  id: string
  contractNumber: string
  title: string
  description: string | null
  totalAmount: number
  currency: string
  startDate: string
  endDate: string | null
  status: string
  signedBySubcontractor: boolean
  signedBySubcontractorAt: string | null
  signedByCompany: boolean
  signedByCompanyAt: string | null
  documentUrl: string | null
  delayPenaltyPerDay: number | null
  inactivityPenalty: number | null
  breachPenalty: number | null
  subcontractor: {
    id: string
    businessName: string | null
    specialty: string | null
  }
}

interface ContractFormProps {
  subcontractorId: string
  workId?: string
  onContractCreated?: () => void
}

export function ContractForm({ subcontractorId, workId, onContractCreated }: ContractFormProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    delayPenaltyPerDay: 0,
    inactivityPenalty: 0,
    breachPenalty: 0
  })

  const handleCreateContract = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/subcontractors/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcontractorId,
          workId,
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : null
        })
      })

      if (response.ok) {
        const newContract = await response.json()
        setContracts([...contracts, newContract])
        setShowCreateDialog(false)
        onContractCreated?.()
        resetForm()
      }
    } catch (error) {
      console.error('Error creating contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignContract = async (contractId: string, type: 'subcontractor' | 'company') => {
    try {
      const response = await fetch(`/api/subcontractors/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: type === 'subcontractor' ? 'sign_subcontractor' : 'sign_company' })
      })

      if (response.ok) {
        // Update local state
        setContracts(contracts.map(c => {
          if (c.id === contractId) {
            return {
              ...c,
              [type === 'subcontractor' ? 'signedBySubcontractor' : 'signedByCompany']: true,
              [type === 'subcontractor' ? 'signedBySubcontractorAt' : 'signedByCompanyAt']: new Date().toISOString()
            }
          }
          return c
        }))
      }
    } catch (error) {
      console.error('Error signing contract:', error)
    }
  }

  const handleActivateContract = async (contractId: string) => {
    try {
      const response = await fetch(`/api/subcontractors/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' })
      })

      if (response.ok) {
        setContracts(contracts.map(c => {
          if (c.id === contractId) {
            return { ...c, status: 'ACTIVE' }
          }
          return c
        }))
      }
    } catch (error) {
      console.error('Error activating contract:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      totalAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      delayPenaltyPerDay: 0,
      inactivityPenalty: 0,
      breachPenalty: 0
    })
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: <FileText className="h-4 w-4" />, label: 'Borrador' },
      PENDING_SIGN: { color: 'bg-yellow-100 text-yellow-800', icon: <PenTool className="h-4 w-4" />, label: 'Pendiente Firma' },
      SIGNED: { color: 'bg-blue-100 text-blue-800', icon: <Signature className="h-4 w-4" />, label: 'Firmado' },
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" />, label: 'Activo' },
      COMPLETED: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-4 w-4" />, label: 'Completado' },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-4 w-4" />, label: 'Cancelado' }
    }
    return configs[status] || configs.DRAFT
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Contrato</DialogTitle>
              <DialogDescription>
                Configura los detalles del contrato con la subcontrata
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-medium">Información Básica</h4>
                  <div className="space-y-2">
                    <Label>Título del contrato</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej: Contrato de instalación eléctrica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción detallada del contrato..."
                    />
                  </div>
                </div>

                <Separator />

                {/* Financial */}
                <div className="space-y-4">
                  <h4 className="font-medium">Datos Económicos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Importe Total (€)</Label>
                      <Input
                        type="number"
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Moneda</Label>
                      <Input value="EUR" disabled />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="space-y-4">
                  <h4 className="font-medium">Fechas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Fin (opcional)</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Penalties */}
                <div className="space-y-4">
                  <h4 className="font-medium">Penalizaciones Automáticas</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Retraso (€/día)</Label>
                      <Input
                        type="number"
                        value={formData.delayPenaltyPerDay}
                        onChange={(e) => setFormData({ ...formData, delayPenaltyPerDay: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inactividad (€)</Label>
                      <Input
                        type="number"
                        value={formData.inactivityPenalty}
                        onChange={(e) => setFormData({ ...formData, inactivityPenalty: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Incumplimiento (€)</Label>
                      <Input
                        type="number"
                        value={formData.breachPenalty}
                        onChange={(e) => setFormData({ ...formData, breachPenalty: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateContract} disabled={loading || !formData.title}>
                    Crear Contrato
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>No hay contratos creados</p>
            <p className="text-sm">Crea un nuevo contrato para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const statusConfig = getStatusConfig(contract.status)
            const bothSigned = contract.signedBySubcontractor && contract.signedByCompany

            return (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {contract.title}
                      </CardTitle>
                      <CardDescription>
                        {contract.contractNumber} - {contract.subcontractor.businessName}
                      </CardDescription>
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
                  {/* Financial Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Importe:</span>
                      <p className="font-bold text-lg">{contract.totalAmount.toLocaleString()} {contract.currency}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inicio:</span>
                      <p>{new Date(contract.startDate).toLocaleDateString()}</p>
                    </div>
                    {contract.endDate && (
                      <div>
                        <span className="text-muted-foreground">Fin:</span>
                        <p>{new Date(contract.endDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {contract.delayPenaltyPerDay && (
                      <div>
                        <span className="text-muted-foreground">Penalización:</span>
                        <p>{contract.delayPenaltyPerDay}€/día</p>
                      </div>
                    )}
                  </div>

                  {/* Signature Status */}
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex items-center gap-2">
                      {contract.signedBySubcontractor ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Subcontrata</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {contract.signedByCompany ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Empresa</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    {contract.documentUrl && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    )}
                    {!contract.signedBySubcontractor && contract.status === 'DRAFT' && (
                      <Button 
                        size="sm"
                        onClick={() => handleSignContract(contract.id, 'subcontractor')}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Firmar (Subcontrata)
                      </Button>
                    )}
                    {!contract.signedByCompany && contract.status === 'DRAFT' && (
                      <Button 
                        size="sm"
                        onClick={() => handleSignContract(contract.id, 'company')}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Firmar (Empresa)
                      </Button>
                    )}
                    {bothSigned && contract.status === 'SIGNED' && (
                      <Button 
                        size="sm"
                        onClick={() => handleActivateContract(contract.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activar Contrato
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
