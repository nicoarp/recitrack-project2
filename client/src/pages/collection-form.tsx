import { useState, useRef, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Camera, Upload, Package, MapPin, User, Weight, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Schema de validación para el formulario de recolección
const collectionFormSchema = z.object({
  pointId: z.string().min(1, 'ID del punto requerido'),
  operatorName: z.string().min(2, 'Nombre del operador requerido'),
  operatorEmail: z.string().email('Email válido requerido'),
  weight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Peso debe ser mayor a 0'),
  bottleCount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Cantidad debe ser mayor a 0'),
  location: z.string().min(3, 'Ubicación requerida'),
  notes: z.string().optional(),
  scalePhoto: z.string().min(1, 'Foto de la báscula es obligatoria'),
  extraEvidence: z.string().optional()
});

type CollectionFormData = z.infer<typeof collectionFormSchema>;

export default function CollectionForm() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
  const pointId = queryParams.get('pointId') || 'CENTRO-001';
  
  const [uploading, setUploading] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<any>(null);
  const scalePhotoRef = useRef<HTMLInputElement>(null);
  const extraEvidenceRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener datos del punto limpio automáticamente
  const { data: recyclingPoint, isLoading: loadingPoint } = useQuery({
    queryKey: ['/api/recycling-points', pointId],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recycling-points');
      const points = await response.json();
      return points.find((p: any) => p.depositId === pointId);
    },
    enabled: !!pointId,
    retry: false
  });

  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      pointId: pointId,
      operatorName: '',
      operatorEmail: '',
      weight: '',
      bottleCount: '',
      location: '',
      notes: '',
      scalePhoto: '',
      extraEvidence: ''
    }
  });

  // Actualizar ubicación cuando se obtienen los datos del punto
  useEffect(() => {
    if (recyclingPoint) {
      form.setValue('location', `${recyclingPoint.name} - ${recyclingPoint.address}`);
      form.setValue('pointId', recyclingPoint.depositId);
    }
  }, [recyclingPoint, form]);

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

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }

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

  // Mutación para crear el depósito y generar QR
  const createDepositMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      // Primero registramos el depósito
      const depositRes = await apiRequest('POST', '/api/bottle-deposits', {
        userId: 1, // Usuario por defecto para demo
        recyclingPointId: 1,
        quantity: parseInt(data.bottleCount),
        weight: parseFloat(data.weight),
        notes: data.notes
      });
      const depositResponse = await depositRes.json();

      // Luego generamos el QR con toda la información
      const qrRes = await apiRequest('POST', '/api/qr/generate', {
        eventType: 'Deposit',
        metadata: {
          depositId: depositResponse.id || 'dep_' + Date.now(),
          pointId: data.pointId,
          operatorName: data.operatorName,
          operatorEmail: data.operatorEmail,
          weight: data.weight + 'kg',
          bottleCount: parseInt(data.bottleCount),
          location: data.location,
          scalePhoto: data.scalePhoto,
          extraEvidence: data.extraEvidence,
          timestamp: Date.now()
        },
        createdBy: data.operatorEmail
      });
      const qrResponse = await qrRes.json();

      return { deposit: depositResponse, qr: qrResponse };
    },
    onSuccess: (data) => {
      setGeneratedQr(data.qr);
      toast({
        title: "Depósito registrado",
        description: "QR generado exitosamente para el lote"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CollectionFormData) => {
    createDepositMutation.mutate(data);
  };

  const downloadQR = () => {
    if (!generatedQr?.qrImage) return;
    
    const link = document.createElement('a');
    link.href = generatedQr.qrImage;
    link.download = `QR_Lote_${generatedQr.qrCode.qrId.slice(0, 8)}.png`;
    link.click();
  };

  const printQR = () => {
    if (!generatedQr?.qrImage) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>QR Lote EcoTraza</title></head>
          <body style="text-align: center; font-family: Arial;">
            <h2>EcoTraza - Lote de Reciclaje</h2>
            <p><strong>ID:</strong> ${generatedQr.qrCode.qrId}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
            <img src="${generatedQr.qrImage}" style="max-width: 300px;" />
            <p style="font-size: 12px;">Escanea este código para validar el lote</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (generatedQr) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                ¡Lote Creado Exitosamente!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <img 
                  src={generatedQr.qrImage} 
                  alt="QR Code" 
                  className="mx-auto w-48 h-48 border rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-2">
                  ID: <span className="font-mono">{generatedQr.qrCode.qrId.slice(0, 8)}...</span>
                </p>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={downloadQR}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Descargar QR
                </Button>
                
                <Button 
                  onClick={printQR}
                  variant="outline"
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Imprimir QR
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Instrucciones:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Imprime o descarga este QR</li>
                  <li>• Colócalo con el lote durante el transporte</li>
                  <li>• Úsalo para validar en cada punto de la cadena</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setLocation('/qr-scanner')}
                  variant="outline"
                  className="flex-1"
                >
                  Nueva Recolección
                </Button>
                <Button 
                  onClick={() => setLocation('/dashboard')}
                  className="flex-1"
                >
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Registro de Recolección
            </CardTitle>
            <p className="text-sm text-gray-600">
              Punto: <span className="font-semibold">{pointId}</span>
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Información del Operador */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Información del Operador
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="operatorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Operador</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatorEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email del Operador</FormLabel>
                        <FormControl>
                          <Input placeholder="operador@ecotraza.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Información del Punto Limpio - Automática desde QR */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Punto de Recolección
                  </h3>
                  
                  {/* Información bloqueada del punto limpio */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Datos verificados desde QR
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-blue-700">ID del Punto</Label>
                        <Input 
                          value={pointId} 
                          disabled 
                          className="bg-blue-100 border-blue-200 text-blue-900 font-mono text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-blue-700">Ubicación Verificada</Label>
                        <Input 
                          value={loadingPoint ? "Cargando..." : (recyclingPoint ? `${recyclingPoint.name} - ${recyclingPoint.address}` : "Sin datos")} 
                          disabled 
                          className="bg-blue-100 border-blue-200 text-blue-900 text-sm"
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-blue-600 mt-2">
                      🔒 Estos datos no pueden modificarse para garantizar la trazabilidad
                    </p>
                  </div>
                </div>

                {/* Información del Lote */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    Datos del Lote
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input placeholder="2.5" type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bottleCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input placeholder="25" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Evidencia Obligatoria */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Evidencia (Obligatoria)
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
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observaciones del lote..."
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
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={createDepositMutation.isPending || uploading}
                >
                  {createDepositMutation.isPending ? 'Generando QR...' : 'Crear Lote y Generar QR'}
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
                  <li>• Verifica que el peso y cantidad sean correctos</li>
                  <li>• El QR generado debe viajar con el lote</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}