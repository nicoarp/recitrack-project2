import { useState, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Camera, Upload, CheckCircle, AlertCircle, Package, MapPin, User, Clock, Weight, AlertTriangle, Lock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRutInput } from '@/lib/rut-validation';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Schema de validación fortalecido para el formulario de validación
const validationFormSchema = z.object({
  // Campos obligatorios del operador
  operatorName: z.string().min(2, 'Nombre del operador requerido (mínimo 2 caracteres)'),
  operatorRut: z.string().min(8, 'RUT chileno válido requerido'),
  validatedBy: z.string().email('Email válido requerido'),
  
  // Fase de validación
  phase: z.enum(['Deposit', 'Batch', 'Process', 'Product'], {
    required_error: 'Selecciona una fase'
  }),
  
  // Ubicación obligatoria (select de centros registrados)
  processingCenterId: z.string().min(1, 'Debe seleccionar un centro de procesado registrado'),
  
  // Peso obligatorio y validación de diferencias
  currentWeight: z.string().min(1, 'Peso actual requerido').transform((val) => {
    const num = parseFloat(val.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      throw new Error('Peso debe ser un número positivo');
    }
    return num;
  }),
  
  // Evidencia obligatoria (foto de báscula)
  scalePhoto: z.string().min(1, 'Foto de la báscula es obligatoria para validar'),
  extraEvidence: z.string().optional(),
  notes: z.string().optional()
});

type ValidationFormData = z.infer<typeof validationFormSchema>;

interface QrData {
  qrId: string;
  eventType: string;
  status: string;
  metadata: any;
  createdBy: string;
  createdAt: string;
}

interface ValidationHistory {
  id: string;
  phase: string;
  validatedBy: string;
  location: string;
  validatedAt: string;
  notes?: string;
}

export default function BatchValidation() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
  const qrId = queryParams.get('qrId');
  
  const [uploading, setUploading] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [weightDifference, setWeightDifference] = useState<number | null>(null);
  const [weightDifferencePercent, setWeightDifferencePercent] = useState<number | null>(null);
  const [showWeightAlert, setShowWeightAlert] = useState(false);
  
  const scalePhotoRef = useRef<HTMLInputElement>(null);
  const extraEvidenceRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleRutChange, isValidRut, formatRut } = useRutInput();

  // Consultar información del QR
  const { data: qrInfo, isLoading: isLoadingQr, error: qrError } = useQuery({
    queryKey: ['/api/qr', qrId],
    enabled: !!qrId,
    retry: false
  });

  // Log para auditar qué está recibiendo el frontend
  console.log('🔍 Debug QR Info:', {
    qrId,
    qrInfo,
    isLoadingQr,
    qrError,
    hasSuccess: qrInfo ? (qrInfo as any)?.success : 'undefined'
  });

  const form = useForm<ValidationFormData>({
    resolver: zodResolver(validationFormSchema),
    defaultValues: {
      validatedBy: '',
      phase: undefined,
      location: '',
      weight: '',
      scalePhoto: '',
      extraEvidence: '',
      notes: ''
    }
  });

  // Función para convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Manejo de carga de foto de báscula
  const handleScalePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: "Error", 
        description: "La imagen debe ser menor a 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      form.setValue('scalePhoto', base64);
      toast({
        title: "Foto cargada",
        description: "Foto de báscula cargada correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar la foto",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Manejo de evidencia extra
  const handleExtraEvidenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      form.setValue('extraEvidence', base64);
      toast({
        title: "Evidencia cargada",
        description: "Evidencia extra cargada correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar la evidencia",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Mutación para validar el QR
  const validateQrMutation = useMutation({
    mutationFn: async (data: ValidationFormData) => {
      const qrData = {
        qrId: qrId,
        eventType: (qrInfo as any)?.qrCode?.eventType || 'Deposit',
        timestamp: Date.now(),
        system: 'EcoTraza'
      };

      const response = await apiRequest('POST', '/api/qr/validate', {
        qrData: JSON.stringify(qrData),
        phase: data.phase,
        validatedBy: data.validatedBy,
        location: data.location,
        evidenceHash: `0x${Date.now().toString(16)}`, // Simulamos hash de evidencia
        evidenceMetadata: {
          weight: data.weight + 'kg',
          scalePhoto: data.scalePhoto,
          extraEvidence: data.extraEvidence
        },
        notes: data.notes
      });

      return await response.json();
    },
    onSuccess: (data) => {
      setValidationComplete(true);
      toast({
        title: "Validación exitosa",
        description: "El lote ha sido validado correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/qr', qrId] });
    },
    onError: (error) => {
      toast({
        title: "Error en validación",
        description: `${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ValidationFormData) => {
    validateQrMutation.mutate(data);
  };

  // Estados de carga y error
  if (!qrId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="font-semibold text-red-900 mb-2">QR No Encontrado</h2>
              <p className="text-red-700 mb-4">No se proporcionó un ID de QR válido</p>
              <Button onClick={() => setLocation('/qr-scanner')}>
                Volver al Escáner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoadingQr) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Cargando información del QR...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (qrError || !(qrInfo as any)?.success) {
    // Log detallado del error para debugging
    console.error('❌ Error en validación QR:', {
      qrError: qrError,
      qrInfoSuccess: (qrInfo as any)?.success,
      qrInfoFull: qrInfo,
      qrId
    });

    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="font-semibold text-red-900 mb-2">QR Inválido</h2>
              <p className="text-red-700 mb-4">
                No se pudo encontrar información para este QR
              </p>
              <div className="text-xs text-gray-600 mb-4 p-2 bg-gray-100 rounded">
                Debug: QR ID = {qrId} | Error = {qrError?.message || 'Sin error'} | Success = {String((qrInfo as any)?.success)}
              </div>
              <Button onClick={() => setLocation('/qr-scanner')}>
                Escanear Otro QR
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (validationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                ¡Validación Exitosa!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Validación Completada</h4>
                <p className="text-sm text-green-700">
                  El lote ha sido validado correctamente y registrado en blockchain.
                </p>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setLocation('/qr-scanner')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Validar Otro Lote
                </Button>
                
                <Button 
                  onClick={() => setLocation(`/qr-history/${qrId}`)}
                  variant="outline"
                  className="w-full"
                >
                  Ver Historial Completo
                </Button>
                
                <Button 
                  onClick={() => setLocation('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const qrData = (qrInfo as any).qrCode;
  const validationHistory = (qrInfo as any).validationHistory || [];
  const currentPhase = (qrInfo as any).currentPhase || 'Ninguna';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Información del QR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información del Lote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">ID:</span>
                <p className="font-mono text-xs">{qrData.qrId.slice(0, 8)}...</p>
              </div>
              <div>
                <span className="text-gray-600">Tipo:</span>
                <p className="font-semibold">{qrData.eventType}</p>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <p className="font-semibold text-green-600">{qrData.status}</p>
              </div>
              <div>
                <span className="text-gray-600">Fase Actual:</span>
                <p className="font-semibold text-blue-600">{currentPhase}</p>
              </div>
            </div>

            {qrData.metadata && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Metadatos del Lote:</h4>
                <div className="text-xs space-y-1">
                  {qrData.metadata.weight && <p><strong>Peso inicial:</strong> {qrData.metadata.weight}</p>}
                  {qrData.metadata.bottleCount && <p><strong>Botellas:</strong> {qrData.metadata.bottleCount}</p>}
                  {qrData.metadata.location && <p><strong>Origen:</strong> {qrData.metadata.location}</p>}
                  {qrData.metadata.operatorName && <p><strong>Creado por:</strong> {qrData.metadata.operatorName}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Validaciones */}
        {validationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Validaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationHistory.map((validation: ValidationHistory, index: number) => (
                  <div key={validation.id} className="border-l-2 border-green-500 pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{validation.phase}</p>
                        <p className="text-xs text-gray-600">{validation.location}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(validation.validatedAt).toLocaleString()}
                        </p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario de Validación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Nueva Validación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Información del Validador */}
                <FormField
                  control={form.control}
                  name="validatedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email del Operador</FormLabel>
                      <FormControl>
                        <Input placeholder="validador@ecotraza.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fase de Validación */}
                <FormField
                  control={form.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fase de Validación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la fase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Deposit">Depósito</SelectItem>
                          <SelectItem value="Batch">Lote</SelectItem>
                          <SelectItem value="Process">Proceso</SelectItem>
                          <SelectItem value="Product">Producto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ubicación y Peso */}
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación Actual</FormLabel>
                        <FormControl>
                          <Input placeholder="Centro de Procesamiento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso Actual (kg)</FormLabel>
                        <FormControl>
                          <Input placeholder="2.3" type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Evidencia Obligatoria */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Evidencia Obligatoria
                  </h3>

                  <div>
                    <Label htmlFor="scalePhoto" className="text-sm font-medium">
                      Foto de la Báscula *
                    </Label>
                    <div className="mt-1 space-y-2">
                      <input
                        ref={scalePhotoRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleScalePhotoUpload}
                        className="hidden"
                        id="scalePhoto"
                      />
                      <Button
                        type="button"
                        onClick={() => scalePhotoRef.current?.click()}
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {form.watch('scalePhoto') ? 'Cambiar Foto' : 'Tomar Foto de Báscula'}
                      </Button>
                      {form.watch('scalePhoto') && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Foto cargada</span>
                        </div>
                      )}
                      {form.formState.errors.scalePhoto && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.scalePhoto.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="extraEvidence" className="text-sm font-medium">
                      Evidencia Extra (Opcional)
                    </Label>
                    <div className="mt-1 space-y-2">
                      <input
                        ref={extraEvidenceRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleExtraEvidenceUpload}
                        className="hidden"
                        id="extraEvidence"
                      />
                      <Button
                        type="button"
                        onClick={() => extraEvidenceRef.current?.click()}
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {form.watch('extraEvidence') ? 'Cambiar Evidencia' : 'Agregar Evidencia'}
                      </Button>
                      {form.watch('extraEvidence') && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Evidencia cargada</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas de Validación</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observaciones del proceso de validación..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={validateQrMutation.isPending || uploading}
                >
                  {validateQrMutation.isPending ? 'Validando...' : 'Validar Lote'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Importante:</p>
                <ul className="space-y-1">
                  <li>• La foto de la báscula es obligatoria</li>
                  <li>• Solo se permite una validación por fase</li>
                  <li>• La secuencia debe ser lógica</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}