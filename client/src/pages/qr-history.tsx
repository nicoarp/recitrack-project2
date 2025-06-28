import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, MapPin, User, CheckCircle, Package, FileText, Camera } from 'lucide-react';

interface ValidationEvent {
  id: string;
  phase: string;
  validatedBy: string;
  location: string;
  validatedAt: string;
  notes?: string;
  evidenceMetadata?: {
    weight?: string;
    scalePhoto?: string;
    extraEvidence?: string;
  };
}

interface QrHistoryData {
  qrId: string;
  eventType: string;
  status: string;
  metadata: any;
  createdBy: string;
  createdAt: string;
  history: ValidationEvent[];
  summary: {
    totalValidations: number;
    currentPhase: string;
    isCompleted: boolean;
    phases: Array<{
      phase: string;
      completed: boolean;
    }>;
  };
}

export default function QrHistory() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const qrId = params.qrId;

  // Consultar historial del QR
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ['/api/qr', qrId, 'history'],
    enabled: !!qrId,
    retry: false
  });

  if (!qrId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="font-semibold text-red-900 mb-2">QR No Especificado</h2>
              <p className="text-red-700 mb-4">No se proporcionó un ID de QR</p>
              <Button onClick={() => setLocation('/qr-scanner')}>
                Escanear QR
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Cargando historial...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !(historyData as any)?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="font-semibold text-red-900 mb-2">Error al Cargar</h2>
              <p className="text-red-700 mb-4">No se pudo cargar el historial del QR</p>
              <Button onClick={() => setLocation('/qr-scanner')}>
                Volver al Escáner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const data = historyData as any;
  const history = data.history || [];
  const summary = data.summary || {
    totalValidations: 0,
    currentPhase: 'Ninguna',
    isCompleted: false,
    phases: []
  };

  const getPhaseColor = (phase: string, completed: boolean) => {
    if (!completed) return 'bg-gray-100 text-gray-600';
    
    switch (phase) {
      case 'Deposit': return 'bg-green-100 text-green-700';
      case 'Batch': return 'bg-blue-100 text-blue-700';
      case 'Process': return 'bg-orange-100 text-orange-700';
      case 'Product': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'Deposit': return <Package className="h-4 w-4" />;
      case 'Batch': return <Package className="h-4 w-4" />;
      case 'Process': return <Package className="h-4 w-4" />;
      case 'Product': return <Package className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setLocation('/qr-scanner')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-gray-900">Historial del Lote</h1>
            <p className="text-sm text-gray-600 font-mono">
              {qrId.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información del Lote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <p className="font-semibold">{data.eventType}</p>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <Badge 
                  className={summary.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                >
                  {summary.isCompleted ? 'Completado' : 'En Proceso'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Fase Actual:</span>
                <p className="font-semibold text-blue-600">{summary.currentPhase}</p>
              </div>
              <div>
                <span className="text-gray-600">Validaciones:</span>
                <p className="font-semibold">{summary.totalValidations}</p>
              </div>
            </div>

            {data.metadata && (
              <>
                <Separator />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Metadatos Iniciales:</h4>
                  <div className="text-xs space-y-1">
                    {data.metadata.weight && <p><strong>Peso inicial:</strong> {data.metadata.weight}</p>}
                    {data.metadata.bottleCount && <p><strong>Botellas:</strong> {data.metadata.bottleCount}</p>}
                    {data.metadata.location && <p><strong>Origen:</strong> {data.metadata.location}</p>}
                    {data.metadata.operatorName && <p><strong>Operador:</strong> {data.metadata.operatorName}</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progreso de Fases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Progreso de Fases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.phases.map((phaseInfo: any, index: number) => (
                <div key={phaseInfo.phase} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    phaseInfo.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {phaseInfo.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{phaseInfo.phase}</p>
                    <p className="text-xs text-gray-600">
                      {phaseInfo.completed ? 'Completado' : 'Pendiente'}
                    </p>
                  </div>
                  <Badge className={getPhaseColor(phaseInfo.phase, phaseInfo.completed)}>
                    {getPhaseIcon(phaseInfo.phase)}
                    <span className="ml-1">{phaseInfo.phase}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historial de Validaciones */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historial de Validaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((validation: ValidationEvent, index: number) => (
                  <div key={validation.id} className="border-l-2 border-blue-500 pl-4 relative">
                    {index < history.length - 1 && (
                      <div className="absolute left-0 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge className={getPhaseColor(validation.phase, true)}>
                            {getPhaseIcon(validation.phase)}
                            <span className="ml-1">{validation.phase}</span>
                          </Badge>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-700">{validation.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-700">{validation.validatedBy}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-700">
                            {new Date(validation.validatedAt).toLocaleString('es-ES')}
                          </span>
                        </div>

                        {validation.evidenceMetadata?.weight && (
                          <div className="text-xs text-gray-600">
                            <strong>Peso registrado:</strong> {validation.evidenceMetadata.weight}
                          </div>
                        )}

                        {validation.evidenceMetadata?.scalePhoto && (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <Camera className="h-3 w-3" />
                            <span>Foto de báscula registrada</span>
                          </div>
                        )}

                        {validation.notes && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <strong>Notas:</strong> {validation.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de Acción */}
        <div className="space-y-2">
          {!summary.isCompleted && (
            <Button 
              onClick={() => setLocation(`/batch-validation?qrId=${qrId}`)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continuar Validación
            </Button>
          )}
          
          <Button 
            onClick={() => setLocation('/qr-scanner')}
            variant="outline"
            className="w-full"
          >
            Escanear Otro QR
          </Button>
          
          <Button 
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Ir al Dashboard
          </Button>
        </div>

        {/* Estado Final */}
        {summary.isCompleted && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-green-900 mb-2">
                Lote Completado
              </h3>
              <p className="text-sm text-green-700">
                Este lote ha completado todo el proceso de trazabilidad
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}