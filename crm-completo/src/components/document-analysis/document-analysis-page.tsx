'use client';

import { useState, useCallback } from 'react';
import { 
  Upload, FileText, File, Trash2, Eye, Loader2, Sparkles, 
  AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp,
  Package, DollarSign, Calendar, Users, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { 
  DocumentAnalysis, 
  DocumentAnalysisType, 
  DocumentAnalysisStatus,
  ANALYSIS_TYPE_LABELS,
  ANALYSIS_STATUS_LABELS,
  ANALYSIS_STATUS_COLORS
} from '@/types';

// Analysis type labels
const ANALYSIS_TYPE_LABELS_LOCAL: Record<DocumentAnalysisType, string> = {
  budget: 'Presupuesto',
  contract: 'Contrato',
  product_list: 'Lista de Productos',
  generic: 'Genérico',
};

const ANALYSIS_STATUS_LABELS_LOCAL: Record<DocumentAnalysisStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

const ANALYSIS_STATUS_COLORS_LOCAL: Record<DocumentAnalysisStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

interface AnalysisResult {
  id?: string;
  extractedData: Record<string, unknown> | null;
  aiSummary: string;
  aiRecommendations: string;
  status: DocumentAnalysisStatus;
  completedAt?: Date;
}

export function DocumentAnalysisPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [analysisType, setAnalysisType] = useState<DocumentAnalysisType>('generic');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<DocumentAnalysis | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    extractedData: true,
    summary: true,
    recommendations: true,
  });

  // Fetch analysis history
  const fetchAnalyses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('analysisType', filterType);
      
      const response = await fetch(`/crm/api/document-analysis?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyses(data.data);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [filterStatus, filterType]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTextContent('');
    }
  };

  // Handle text input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
    setFile(null);
  };

  // Perform analysis
  const handleAnalyze = async () => {
    if (!file && !textContent.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona un archivo o ingresa texto para analizar.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // First, create the analysis record
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('content', textContent);
      formData.append('analysisType', analysisType);

      const createResponse = await fetch('/crm/api/document-analysis', {
        method: 'POST',
        body: formData,
      });

      const createData = await createResponse.json();
      
      if (!createData.success) {
        throw new Error(createData.error || 'Error al crear análisis');
      }

      const analysisId = createData.data.id;
      const contentToAnalyze = createData.fileContent || textContent;

      // Then, perform the analysis
      const analyzeResponse = await fetch('/crm/api/document-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          content: contentToAnalyze,
          analysisType,
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success) {
        throw new Error(analyzeData.error || 'Error al analizar documento');
      }

      setAnalysisResult(analyzeData.data);
      
      toast({
        title: 'Análisis completado',
        description: 'El documento ha sido analizado exitosamente.',
      });

      // Refresh history
      fetchAnalyses();
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al analizar documento',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete analysis
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/crm/api/document-analysis/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Eliminado',
          description: 'Análisis eliminado correctamente.',
        });
        fetchAnalyses();
        if (selectedAnalysis?.id === id) {
          setSelectedAnalysis(null);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el análisis.',
        variant: 'destructive',
      });
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render extracted data based on analysis type
  const renderExtractedData = (data: Record<string, unknown> | null, type: DocumentAnalysisType) => {
    if (!data) return <p className="text-muted-foreground">No se extrajeron datos</p>;

    if (type === 'budget') {
      const budgetData = data as {
        lineItems?: Array<{
          concept: string;
          quantity?: number;
          unitPrice?: number;
          total?: number;
        }>;
        subtotal?: number;
        tax?: number;
        total?: number;
        parties?: {
          issuer?: { name?: string };
          recipient?: { name?: string };
        };
      };

      return (
        <div className="space-y-4">
          {budgetData.parties && (
            <div className="grid grid-cols-2 gap-4">
              {budgetData.parties.issuer && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emisor</p>
                  <p className="font-medium">{budgetData.parties.issuer.name || 'N/A'}</p>
                </div>
              )}
              {budgetData.parties.recipient && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destinatario</p>
                  <p className="font-medium">{budgetData.parties.recipient.name || 'N/A'}</p>
                </div>
              )}
            </div>
          )}
          
          {budgetData.lineItems && budgetData.lineItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Concepto</th>
                    <th className="text-right py-2">Cantidad</th>
                    <th className="text-right py-2">Precio</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetData.lineItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.concept}</td>
                      <td className="text-right">{item.quantity || '-'}</td>
                      <td className="text-right">{item.unitPrice ? `${item.unitPrice.toFixed(2)}€` : '-'}</td>
                      <td className="text-right">{item.total ? `${item.total.toFixed(2)}€` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="flex justify-end gap-4 text-sm font-medium">
            {budgetData.subtotal !== undefined && <span>Subtotal: {budgetData.subtotal.toFixed(2)}€</span>}
            {budgetData.tax !== undefined && <span>IVA: {budgetData.tax.toFixed(2)}€</span>}
            {budgetData.total !== undefined && <span className="text-lg">Total: {budgetData.total.toFixed(2)}€</span>}
          </div>
        </div>
      );
    }

    if (type === 'contract') {
      const contractData = data as {
        parties?: Array<{ role?: string; name?: string; taxId?: string }>;
        dates?: { startDate?: string; endDate?: string };
        amounts?: { total?: number; currency?: string };
        keyClauses?: Array<{ title?: string; content?: string }>;
      };

      return (
        <div className="space-y-4">
          {contractData.parties && contractData.parties.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" /> Partes
              </h4>
              <div className="space-y-2">
                {contractData.parties.map((party, index) => (
                  <div key={index} className="flex justify-between bg-muted p-2 rounded">
                    <span className="capitalize">{party.role}</span>
                    <span className="font-medium">{party.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {contractData.dates && (
            <div className="grid grid-cols-2 gap-4">
              {contractData.dates.startDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha inicio</p>
                  <p className="font-medium">{contractData.dates.startDate}</p>
                </div>
              )}
              {contractData.dates.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha fin</p>
                  <p className="font-medium">{contractData.dates.endDate}</p>
                </div>
              )}
            </div>
          )}
          
          {contractData.amounts?.total && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-lg font-medium">
                {contractData.amounts.total.toFixed(2)} {contractData.amounts.currency || 'EUR'}
              </span>
            </div>
          )}
          
          {contractData.keyClauses && contractData.keyClauses.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Cláusulas principales</h4>
              <div className="space-y-2">
                {contractData.keyClauses.map((clause, index) => (
                  <div key={index} className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm">{clause.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{clause.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (type === 'product_list') {
      const productData = data as {
        products?: Array<{
          name?: string;
          reference?: string;
          unit?: string;
          price?: number;
        }>;
        totalProducts?: number;
      };

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {productData.totalProducts || productData.products?.length || 0} productos encontrados
          </div>
          
          {productData.products && productData.products.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Producto</th>
                    <th className="text-left py-2">Referencia</th>
                    <th className="text-left py-2">Unidad</th>
                    <th className="text-right py-2">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {productData.products.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{product.name}</td>
                      <td className="py-2">{product.reference || '-'}</td>
                      <td className="py-2">{product.unit || '-'}</td>
                      <td className="text-right">{product.price ? `${product.price.toFixed(2)}€` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // Generic type - show JSON
    return (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Load history on mount
  useState(() => {
    fetchAnalyses();
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Análisis de Documentos con IA</h1>
        <p className="text-muted-foreground mt-1">
          Extrae información automáticamente de presupuestos, contratos y listas de productos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Documento
            </CardTitle>
            <CardDescription>
              Sube un archivo o pega el contenido del documento para analizar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Analysis Type */}
            <div className="space-y-2">
              <Label htmlFor="analysisType">Tipo de Análisis</Label>
              <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as DocumentAnalysisType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Presupuesto</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="product_list">Lista de Productos</SelectItem>
                  <SelectItem value="generic">Genérico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <File className="h-4 w-4" />
                  {file.name}
                </p>
              )}
            </div>

            {/* Text Content */}
            <div className="space-y-2">
              <Label htmlFor="textContent">O pega el contenido del documento</Label>
              <Textarea
                id="textContent"
                placeholder="Pega aquí el texto del documento a analizar..."
                value={textContent}
                onChange={handleTextChange}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {/* Analyze Button */}
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || (!file && !textContent.trim())}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analizar con IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultados del Análisis
            </CardTitle>
            <CardDescription>
              Datos extraídos y recomendaciones de la IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysisResult && !isAnalyzing && (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sube un documento para ver los resultados del análisis</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Analizando documento con IA...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esto puede tardar unos segundos
                </p>
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <Tabs defaultValue="extracted" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="extracted">Datos Extraídos</TabsTrigger>
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
                </TabsList>
                
                <TabsContent value="extracted" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    {renderExtractedData(analysisResult.extractedData, analysisType)}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="summary" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {analysisResult.aiSummary.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="recommendations" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {analysisResult.aiRecommendations.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Análisis</CardTitle>
              <CardDescription>Análisis anteriores</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="budget">Presupuesto</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="product_list">Lista Productos</SelectItem>
                  <SelectItem value="generic">Genérico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay análisis en el historial
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {analyses.map((analysis) => (
                  <div 
                    key={analysis.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{analysis.fileName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{ANALYSIS_TYPE_LABELS_LOCAL[analysis.analysisType]}</span>
                          <span>•</span>
                          <span>{formatDate(analysis.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={ANALYSIS_STATUS_COLORS_LOCAL[analysis.status]}>
                        {ANALYSIS_STATUS_LABELS_LOCAL[analysis.status]}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(analysis.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAnalysis?.fileName}</DialogTitle>
            <DialogDescription>
              Tipo: {selectedAnalysis && ANALYSIS_TYPE_LABELS_LOCAL[selectedAnalysis.analysisType]} | 
              Estado: {selectedAnalysis && ANALYSIS_STATUS_LABELS_LOCAL[selectedAnalysis.status]}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnalysis && (
            <div className="space-y-4">
              {selectedAnalysis.extractedData && (
                <div>
                  <h4 className="font-medium mb-2">Datos Extraídos</h4>
                  {renderExtractedData(
                    JSON.parse(selectedAnalysis.extractedData), 
                    selectedAnalysis.analysisType
                  )}
                </div>
              )}
              
              {selectedAnalysis.aiSummary && (
                <div>
                  <h4 className="font-medium mb-2">Resumen de IA</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    {selectedAnalysis.aiSummary}
                  </div>
                </div>
              )}
              
              {selectedAnalysis.aiRecommendations && (
                <div>
                  <h4 className="font-medium mb-2">Recomendaciones</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    {selectedAnalysis.aiRecommendations}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
