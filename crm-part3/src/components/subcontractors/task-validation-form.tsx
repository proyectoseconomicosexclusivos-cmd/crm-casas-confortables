'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  Video,
  FileText,
  MapPin,
  Calendar,
  User
} from 'lucide-react'

interface TaskValidationFormProps {
  taskId: string
  task: {
    id: string
    title: string
    description: string | null
    status: string
    progress: number
    completedAt: string | null
    estimatedEndDate: string | null
    work: {
      id: string
      name: string
      address: string
    }
    subcontractor: {
      id: string
      businessName: string | null
      specialty: string | null
      rating: number
    }
    evidences: Array<{
      id: string
      type: string
      url: string
      description: string | null
      takenAt: string | null
      location: string | null
      createdAt: string
    }>
  }
  onValidationComplete?: () => void
}

interface ChecklistItem {
  id: string
  label: string
  required: boolean
  type: 'boolean' | 'text' | 'number'
  checked?: boolean
  value?: string
}

export function TaskValidationForm({
  taskId,
  task,
  onValidationComplete
}: TaskValidationFormProps) {
  const [validationStatus, setValidationStatus] = useState<'pending' | 'approving' | 'rejecting' | 'approved' | 'rejected'>('pending')
  const [comments, setComments] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'Trabajo completado según especificaciones', required: true, type: 'boolean', checked: false },
    { id: '2', label: 'Evidencias fotográficas suficientes', required: true, type: 'boolean', checked: false },
    { id: '3', label: 'Limpieza del área de trabajo', required: false, type: 'boolean', checked: false },
    { id: '4', label: 'Materiales utilizados correctos', required: true, type: 'boolean', checked: false },
    { id: '5', label: 'Cumplimiento de normativa de seguridad', required: true, type: 'boolean', checked: false },
    { id: '6', label: 'Comentarios adicionales', required: false, type: 'text', value: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requiredItemsChecked = checklist
    .filter(item => item.required && item.type === 'boolean')
    .every(item => item.checked)

  const handleChecklistChange = (id: string, value: boolean | string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id 
        ? item.type === 'boolean' 
          ? { ...item, checked: value as boolean }
          : { ...item, value: value as string }
        : item
    ))
  }

  const handleSubmitValidation = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/subcontractors/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          status,
          comments,
          checklistResults: checklist.map(item => ({
            id: item.id,
            label: item.label,
            passed: item.type === 'boolean' ? item.checked : !!item.value,
            value: item.type === 'text' ? item.value : undefined
          }))
        })
      })

      if (response.ok) {
        setValidationStatus(status)
        onValidationComplete?.()
      }
    } catch (error) {
      console.error('Error submitting validation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Task Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <MapPin className="h-3 w-3" />
                {task.work.address}
              </CardDescription>
            </div>
            <Badge variant={task.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {task.status === 'COMPLETED' ? 'Completada' : task.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{task.subcontractor.businessName || 'Sin nombre'}</span>
              <Badge variant="outline" className="text-xs">
                ⭐ {task.subcontractor.rating.toFixed(1)}
              </Badge>
            </div>
            {task.completedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Completada: {new Date(task.completedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Progreso:</span>
              <Progress value={task.progress} className="flex-1 h-2" />
              <span className="font-medium">{task.progress}%</span>
            </div>
          </div>
          {task.description && (
            <p className="mt-4 text-sm text-muted-foreground">{task.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Evidences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidencias Subidas</CardTitle>
          <CardDescription>
            Fotos y vídeos proporcionados por la subcontrata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {task.evidences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>No hay evidencias subidas</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {task.evidences.map((evidence) => (
                  <div key={evidence.id} className="border rounded-lg overflow-hidden">
                    {evidence.type === 'photo' ? (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <img 
                          src={evidence.url} 
                          alt={evidence.description || 'Evidence photo'} 
                          className="max-w-full max-h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {getEvidenceIcon(evidence.type)}
                      </div>
                    )}
                    <div className="p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getEvidenceIcon(evidence.type)}
                        <span>{evidence.type}</span>
                      </div>
                      {evidence.description && (
                        <p className="text-xs mt-1 truncate">{evidence.description}</p>
                      )}
                      {evidence.takenAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(evidence.takenAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Validation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checklist de Validación</CardTitle>
          <CardDescription>
            Marca los items que cumplen con los requisitos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-start gap-3">
                {item.type === 'boolean' ? (
                  <button
                    onClick={() => handleChecklistChange(item.id, !item.checked)}
                    className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                      item.checked 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-input hover:border-primary'
                    }`}
                  >
                    {item.checked && <CheckCircle className="h-3 w-3" />}
                  </button>
                ) : null}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">{item.label}</label>
                    {item.required && (
                      <Badge variant="outline" className="text-xs">Obligatorio</Badge>
                    )}
                  </div>
                  {item.type === 'text' && (
                    <Textarea
                      value={item.value || ''}
                      onChange={(e) => handleChecklistChange(item.id, e.target.value)}
                      placeholder="Añade comentarios..."
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comentarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Añade comentarios sobre la validación..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {validationStatus === 'pending' && (
        <div className="flex justify-end gap-4">
          <Button
            variant="destructive"
            onClick={() => handleSubmitValidation('rejected')}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
          <Button
            onClick={() => handleSubmitValidation('approved')}
            disabled={isSubmitting || !requiredItemsChecked}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprobar
          </Button>
        </div>
      )}

      {validationStatus !== 'pending' && (
        <Card className={validationStatus === 'approved' ? 'border-green-500' : 'border-destructive'}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              {validationStatus === 'approved' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-500">Tarea aprobada correctamente</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Tarea rechazada</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
