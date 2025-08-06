import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Trash2, Camera, Package, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

// Lógica batch 2025-07: Nueva funcionalidad para agrupación de lotes en centros de acopio
interface ScannedDeposit {
  eventId: string;
  location: string;
  weight: number;
  bottleCount: number;
  timestamp: string;
  collectorInfo?: string;
}

interface WeightAdjustment {
  originalSum: number;
  adjustedWeight: number;
  reason: string;
  operatorComment: string;
}

export default function BatchGrouping() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Lógica batch 2025-07: Estados para escaneo múltiple y agrupación
  const [scannedDeposits, setScannedDeposits] = useState<ScannedDeposit[]>([]);
  const [currentQrInput, setCurrentQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [adjustedWeight, setAdjustedWeight] = useState<number>(0);
  const [weightReason, setWeightReason] = useState('');
  const [operatorComment, setOperatorComment] = useState('');
  const [operatorName, setOperatorName] = useState(user?.name || '');
  const [operatorRut, setOperatorRut] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState<string>('');
  const [showWeightAlert, setShowWeightAlert] = useState(false);
  
  const evidenceRef = useRef<HTMLInputElement>(null);

  // === SEGURIDAD 2025-07: VALIDACIÓN DE ROLES ===
  const hasPermissions = isAuthenticated && ['admin', 'acopio', 'batch_operator', 'centro_acopio'].includes(user?.role || '');
  
  // Bloquear acceso si no tiene permisos
  React.useEffect(() => {
    if (isAuthenticated && !hasPermissions) {
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "Solo usuarios con rol 'centro_acopio', 'acopio' o 'admin' pueden crear lotes",
      });
      setLocation('/dashboard');
    }
  }, [isAuthenticated, hasPermissions, setLocation]);

  // Lógica batch 2025-07: Calcular totales automáticamente
  React.useEffect(() => {
    const sum = scannedDeposits.reduce((acc, deposit) => acc + deposit.weight, 0);
    setTotalWeight(sum);
    setAdjustedWeight(sum);
  }, [scannedDeposits]);

  // Lógica batch 2025-07: Detectar ajustes de peso significativos
  React.useEffect(() => {
    if (totalWeight > 0 && adjustedWeight > 0) {
      const difference = Math.abs(adjustedWeight - totalWeight);
      const percentDiff = (difference / totalWeight) * 100;
      setShowWeightAlert(percentDiff > 5); // Alerta si diferencia > 5%
    }
  }, [totalWeight, adjustedWeight]);

  // Lógica batch 2025-07: Mutación para crear lote
  const createBatchMutation = useMutation({
    mutationFn: async (batchData: any) => {
      return apiRequest('POST', '/api/batch', batchData);
    },
    onSuccess: (data) => {
      toast({
        title: "¡Lote creado exitosamente!",
        description: `Lote ${data.batch.batchId} con ${data.batch.totalDeposits} depósitos`,
      });
      
      // Limpiar formulario
      setScannedDeposits([]);
      setCurrentQrInput('');
      setTotalWeight(0);
      setAdjustedWeight(0);
      setWeightReason('');
      setOperatorComment('');
      setEvidencePhoto('');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/batch-events'] });
    },
    onError: (error: any) => {
      console.error('Error creando lote:', error);
      toast({
        variant: "destructive",
        title: "Error al crear lote",
        description: error.message || "Error desconocido",
      });
    }
  });

  // Lógica batch 2025-07: Escanear/agregar depósito por QR o ID manual
  const handleAddDeposit = async () => {
    if (!currentQrInput.trim()) {
      toast({
        variant: "destructive",
        title: "QR requerido",
        description: "Ingrese un código QR o ID de depósito"
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Lógica batch 2025-07: Resolver QR para obtener datos del depósito
      const response = await apiRequest('POST', '/api/qr/resolve', {
        qrCode: currentQrInput.trim()
      });

      if (response.success && response.type === 'deposit') {
        const depositData = response.data;
        
        // === SEGURIDAD 2025-07: VALIDACIÓN ANTI-DUPLICADOS ===
        // Verificar duplicados en la lista local
        if (scannedDeposits.some(d => d.eventId === depositData.eventId)) {
          toast({
            variant: "destructive",
            title: "Este QR ya fue agregado al lote",
            description: "No puede agregar el mismo depósito dos veces"
          });
          return;
        }
        
        // Verificar que no esté ya en un lote existente (validación adicional)
        try {
          const batchCheckResponse = await apiRequest('GET', `/api/qr/${depositData.qrId}/history`);
          if (batchCheckResponse.success && batchCheckResponse.validations) {
            const hasBatchValidation = batchCheckResponse.validations.some((v: any) => v.phase === 'Batch');
            if (hasBatchValidation) {
              toast({
                variant: "destructive",
                title: "Este QR ya fue agrupado en otro lote",
                description: "No puede agregar depósitos que ya forman parte de un lote"
              });
              return;
            }
          }
        } catch (checkError) {
          console.warn('No se pudo verificar historial de lotes para QR:', depositData.qrId);
        }

        // Agregar a la lista
        const newDeposit: ScannedDeposit = {
          eventId: depositData.eventId,
          location: depositData.location,
          weight: depositData.weight || 0,
          bottleCount: depositData.bottleCount || 0,
          timestamp: depositData.timestamp,
          collectorInfo: depositData.collectorInfo
        };

        setScannedDeposits(prev => [...prev, newDeposit]);
        setCurrentQrInput('');
        
        toast({
          title: "Depósito agregado",
          description: `${depositData.weight}kg agregados al lote`
        });
      } else {
        throw new Error(response.message || 'QR no válido para depósito');
      }
    } catch (error: any) {
      console.error('Error escaneando depósito:', error);
      toast({
        variant: "destructive",
        title: "Error al agregar depósito",
        description: error.message || "QR no válido o depósito no encontrado"
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Lógica batch 2025-07: Remover depósito de la lista
  const handleRemoveDeposit = (eventId: string) => {
    setScannedDeposits(prev => prev.filter(d => d.eventId !== eventId));
    toast({
      title: "Depósito removido",
      description: "Depósito eliminado del lote"
    });
  };

  // Lógica batch 2025-07: Cargar foto de evidencia con compresión
  const handleEvidenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { // 20MB max
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: "La imagen debe ser menor a 20MB"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Lógica batch 2025-07: Compresión automática
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
        setEvidencePhoto(compressedImage);
        
        toast({
          title: "Evidencia cargada",
          description: `Imagen comprimida a ${(compressedImage.length / 1024).toFixed(0)}KB`
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Lógica batch 2025-07: Crear lote final con todas las validaciones
  const handleCreateBatch = () => {
    // Validaciones pre-envío
    if (scannedDeposits.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin depósitos",
        description: "Debe agregar al menos un depósito al lote"
      });
      return;
    }

    if (!evidencePhoto) {
      toast({
        variant: "destructive",
        title: "Evidencia requerida",
        description: "Debe cargar una foto de evidencia del lote"
      });
      return;
    }

    if (!operatorName.trim() || !operatorRut.trim()) {
      toast({
        variant: "destructive",
        title: "Datos del operador",
        description: "Complete nombre y RUT del operador"
      });
      return;
    }

    // Verificar ajuste de peso excesivo
    const difference = Math.abs(adjustedWeight - totalWeight);
    const percentDiff = (difference / totalWeight) * 100;
    
    if (percentDiff > 15) {
      toast({
        variant: "destructive",
        title: "Ajuste de peso excesivo",
        description: `Diferencia del ${percentDiff.toFixed(1)}% excede el límite del 15%`
      });
      return;
    }

    // Verificar comentario obligatorio para ajustes > 5%
    if (percentDiff > 5 && !weightReason.trim()) {
      toast({
        variant: "destructive",
        title: "Razón del ajuste requerida",
        description: "Explique la razón del ajuste de peso"
      });
      return;
    }

    // === SEGURIDAD 2025-07: PREPARAR DATOS CON VALIDACIONES ===
    const batchData = {
      depositIds: scannedDeposits.map(d => d.eventId),
      totalWeight: adjustedWeight,
      userId: user?.id, // Enviar ID de usuario para validación de roles
      weightAdjustment: totalWeight !== adjustedWeight ? {
        originalSum: totalWeight,
        adjustedWeight: adjustedWeight,
        reason: weightReason,
        operatorComment: operatorComment
      } : undefined,
      operatorData: {
        operatorName: operatorName.trim(),
        operatorRut: operatorRut.trim(),
        centerId: user?.id ? `CENTRO-${user.id}` : 'CENTRO-UNKNOWN',
        centerName: user?.name || 'Centro sin nombre'
      },
      evidence: evidencePhoto,
      location: scannedDeposits.length > 0 ? 
        `Centro de Acopio - ${scannedDeposits[0].location}` : 
        'Centro de Acopio'
    };

    createBatchMutation.mutate(batchData);
  };

  // Lógica batch 2025-07: Verificar permisos antes de mostrar interfaz
  if (!hasPermissions) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="font-semibold text-red-900 mb-2">
              Acceso Restringido
            </h3>
            <p className="text-red-700">
              Solo los operadores de centros de acopio pueden crear lotes.
              <br />
              Contacte al administrador para obtener permisos.
            </p>
            <Button 
              onClick={() => setLocation('/dashboard')}
              variant="outline"
              className="mt-4"
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weightDifferencePercent = totalWeight > 0 ? 
    ((Math.abs(adjustedWeight - totalWeight) / totalWeight) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* Lógica batch 2025-07: Header con información del operador */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Agrupar Depositos - Centro de Acopio
        </h1>
        <p className="mt-2 text-gray-600">
          Operador: {user?.name} | Total depósitos: {scannedDeposits.length}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lógica batch 2025-07: Panel de escaneo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escanear Depósitos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="qr-input">Código QR o ID de Depósito</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-input"
                  value={currentQrInput}
                  onChange={(e) => setCurrentQrInput(e.target.value)}
                  placeholder="Escanee QR o ingrese ID manualmente"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDeposit()}
                />
                <Button 
                  onClick={handleAddDeposit}
                  disabled={isScanning || !currentQrInput.trim()}
                >
                  {isScanning ? 'Procesando...' : 'Agregar'}
                </Button>
              </div>
            </div>

            {/* Lógica batch 2025-07: Lista de depósitos escaneados */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scannedDeposits.map((deposit) => (
                <div key={deposit.eventId} 
                     className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{deposit.eventId}</div>
                    <div className="text-xs text-gray-600">{deposit.location}</div>
                    <div className="text-xs text-blue-600">
                      {deposit.weight}kg • {deposit.bottleCount} botellas
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDeposit(deposit.eventId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {scannedDeposits.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay depósitos agregados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lógica batch 2025-07: Panel de ajustes y evidencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Peso y Evidencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen de peso */}
            <div className="p-3 bg-blue-50 rounded border">
              <div className="text-sm font-medium text-blue-900">
                Peso Original: {totalWeight.toFixed(1)} kg
              </div>
              <div className="text-xs text-blue-700">
                Suma de {scannedDeposits.length} depósitos individuales
              </div>
            </div>

            {/* Ajuste de peso */}
            <div>
              <Label htmlFor="adjusted-weight">Peso Final Ajustado (kg)</Label>
              <Input
                id="adjusted-weight"
                type="number"
                step="0.1"
                value={adjustedWeight}
                onChange={(e) => setAdjustedWeight(parseFloat(e.target.value) || 0)}
                className={showWeightAlert ? 'border-orange-300' : ''}
              />
              {showWeightAlert && (
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  Diferencia del {weightDifferencePercent.toFixed(1)}% detectada
                </div>
              )}
            </div>

            {/* Razón del ajuste (obligatorio si > 5% diferencia) */}
            {showWeightAlert && (
              <div>
                <Label htmlFor="weight-reason">
                  Razón del Ajuste {weightDifferencePercent > 5 && '*'}
                </Label>
                <Textarea
                  id="weight-reason"
                  value={weightReason}
                  onChange={(e) => setWeightReason(e.target.value)}
                  placeholder="Ej: Humedad, residuos, calibración de báscula..."
                  rows={2}
                />
              </div>
            )}

            {/* Comentario del operador */}
            <div>
              <Label htmlFor="operator-comment">Comentario Operador</Label>
              <Textarea
                id="operator-comment"
                value={operatorComment}
                onChange={(e) => setOperatorComment(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>

            {/* Datos del operador */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="operator-name">Nombre Operador *</Label>
                <Input
                  id="operator-name"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="operator-rut">RUT Operador *</Label>
                <Input
                  id="operator-rut"
                  value={operatorRut}
                  onChange={(e) => setOperatorRut(e.target.value)}
                  placeholder="12.345.678-9"
                />
              </div>
            </div>

            {/* Evidencia fotográfica */}
            <div>
              <Label htmlFor="evidence">Foto de Evidencia *</Label>
              <input
                ref={evidenceRef}
                id="evidence"
                type="file"
                accept="image/*"
                onChange={handleEvidenceUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => evidenceRef.current?.click()}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {evidencePhoto ? 'Cambiar Foto' : 'Cargar Foto'}
                </Button>
                {evidencePhoto && (
                  <Badge variant="secondary" className="self-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Cargada
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lógica batch 2025-07: Botón de creación de lote */}
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleCreateBatch}
          disabled={createBatchMutation.isPending || scannedDeposits.length === 0}
          className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
        >
          {createBatchMutation.isPending ? 'Creando Lote...' : 
           `Crear Lote (${scannedDeposits.length} depósitos, ${adjustedWeight.toFixed(1)}kg)`}
        </Button>
      </div>
    </div>
  );
}