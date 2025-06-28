import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Upload, CheckCircle, AlertCircle, Package, MapPin, User, Clock, Weight, AlertTriangle, Lock, Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRutInput, validateRut } from "@/lib/rut-validation";

// Schema de validación fortalecido
const enhancedValidationSchema = z.object({
  // Campos obligatorios del operador
  operatorName: z.string().min(2, "Nombre del operador requerido (mínimo 2 caracteres)"),
  operatorRut: z.string().min(8, "RUT chileno válido requerido").refine((rut) => {
    return validateRut(rut);
  }, "RUT chileno inválido (formato: 12.345.678-9)"),
  validatedBy: z.string().email("Email válido requerido"),
  
  // Fase de validación
  phase: z.enum(["Deposit", "Batch", "Process", "Product"], {
    required_error: "Selecciona una fase"
  }),
  
  // Ubicación obligatoria (select de centros registrados)
  processingCenterId: z.string().min(1, "Debe seleccionar un centro de procesado registrado"),
  
  // Peso obligatorio y validación de diferencias
  currentWeight: z.string().min(1, "Peso actual requerido").refine((val) => {
    const num = parseFloat(val.replace(",", "."));
    return !isNaN(num) && num > 0;
  }, "Peso debe ser un número positivo"),
  
  // Evidencia obligatoria (foto de báscula)
  scalePhoto: z.string().min(1, "Foto de la báscula es obligatoria para validar"),
  extraEvidence: z.string().optional(),
  notes: z.string().optional()
});

type EnhancedValidationData = z.infer<typeof enhancedValidationSchema>;

interface ProcessingCenter {
  id: number;
  name: string;
  location: string;
  address?: string;
  centerType: string;
  status: string;
}

export default function EnhancedValidation() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
  const qrId = queryParams.get("qrId");
  
  const [uploading, setUploading] = useState(false);
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [weightDifference, setWeightDifference] = useState<number | null>(null);
  const [weightDifferencePercent, setWeightDifferencePercent] = useState<number | null>(null);
  const [showWeightAlert, setShowWeightAlert] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleRutChange, isValidRut } = useRutInput();

  // Consultar información del QR
  const { data: qrInfo, isLoading: isLoadingQr, error: qrError } = useQuery({
    queryKey: ["/api/qr", qrId],
    enabled: !!qrId,
  });

  // Consultar centros de procesado
  const { data: processingCenters, isLoading: isLoadingCenters } = useQuery<ProcessingCenter[]>({
    queryKey: ["/api/processing-centers"],
  });

  // Setup del formulario con valores por defecto
  const form = useForm<EnhancedValidationData>({
    resolver: zodResolver(enhancedValidationSchema),
    defaultValues: {
      operatorName: "",
      operatorRut: "",
      validatedBy: "",
      phase: "Batch",
      processingCenterId: "",
      currentWeight: "",
      scalePhoto: "",
      extraEvidence: "",
      notes: ""
    }
  });

  // Extraer peso inicial del metadata del QR
  useState(() => {
    if (qrInfo && (qrInfo as any).success && (qrInfo as any).qrCode?.metadata?.weight) {
      const weight = parseFloat((qrInfo as any).qrCode.metadata.weight.replace(/[^0-9.]/g, ""));
      if (!isNaN(weight)) {
        setInitialWeight(weight);
      }
    }
  });

  // Calcular diferencia de peso
  const calculateWeightDifference = (currentWeightStr: string) => {
    if (!initialWeight) return;
    
    const currentWeight = parseFloat(currentWeightStr.replace(",", "."));
    if (isNaN(currentWeight)) return;
    
    const difference = currentWeight - initialWeight;
    const percentage = (difference / initialWeight) * 100;
    
    setWeightDifference(difference);
    setWeightDifferencePercent(percentage);
    
    // Mostrar alerta si supera ±15%
    if (Math.abs(percentage) > 15) {
      setShowWeightAlert(true);
    } else {
      setShowWeightAlert(false);
    }
  };

  // Comprimir imagen automáticamente
  const compressImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Manejar subida de foto de báscula
  const handleScalePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      form.setValue("scalePhoto", compressedBase64);
      
      toast({
        title: "Foto subida exitosamente",
        description: `Imagen comprimida (${Math.round(compressedBase64.length / 1024)} KB)`,
      });
    } catch (error) {
      console.error("Error comprimiendo imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Validación de envío
  const validationMutation = useMutation({
    mutationFn: async (data: EnhancedValidationData) => {
      // Validar RUT antes de enviar
      if (!isValidRut(data.operatorRut)) {
        throw new Error("RUT chileno inválido");
      }
      
      // Obtener centro de procesado seleccionado
      const selectedCenter = processingCenters?.find(c => c.id.toString() === data.processingCenterId);
      if (!selectedCenter) {
        throw new Error("Centro de procesado no válido");
      }
      
      const validationData = {
        qrData: JSON.stringify({
          qrId,
          eventType: qrInfo?.qrCode?.eventType,
          timestamp: Date.now(),
          system: "EcoTraza"
        }),
        phase: data.phase,
        operatorName: data.operatorName,
        operatorRut: data.operatorRut,
        validatedBy: data.validatedBy,
        location: selectedCenter.name,
        processingCenterId: parseInt(data.processingCenterId),
        currentWeight: parseFloat(data.currentWeight.replace(",", ".")),
        initialWeight: initialWeight || 0,
        weightDifference: weightDifference || 0,
        weightDifferencePercent: weightDifferencePercent || 0,
        evidenceHash: `scale_photo_${Date.now()}`,
        evidenceMetadata: {
          scalePhoto: data.scalePhoto,
          extraEvidence: data.extraEvidence,
          fileName: `validacion_${qrId}_${Date.now()}.jpg`,
          fileSize: data.scalePhoto.length,
          photoType: "scale"
        },
        scalePhotoRequired: true,
        notes: data.notes
      };

      return apiRequest("/api/qr/validate", validationData);
    },
    onSuccess: (result: any) => {
      toast({
        title: "✅ Validación completada",
        description: `Evento ${result.validation?.phase} registrado exitosamente en blockchain`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/qr", qrId] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error en la validación",
        description: error.message || "No se pudo completar la validación",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: EnhancedValidationData) => {
    // Verificar que se haya subido foto de báscula
    if (!data.scalePhoto) {
      toast({
        title: "Foto de báscula requerida",
        description: "Debe subir una foto de la báscula antes de validar",
        variant: "destructive",
      });
      return;
    }
    
    // Si hay alerta de peso, confirmar antes de continuar
    if (showWeightAlert) {
      const confirm = window.confirm(
        `⚠️ Diferencia de peso significativa detectada: ${weightDifferencePercent?.toFixed(1)}%\n\n¿Desea continuar con la validación?`
      );
      if (!confirm) return;
    }
    
    validationMutation.mutate(data);
  };

  // Estados de carga
  if (isLoadingQr || isLoadingCenters) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-2xl mx-auto pt-20 text-center">
          <Package className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando información...</h2>
          <p className="text-gray-600">Preparando formulario de validación</p>
        </div>
      </div>
    );
  }

  // Error en QR
  if (qrError || !(qrInfo as any)?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="font-semibold text-red-900 mb-2">QR Inválido</h2>
              <p className="text-red-700 mb-4">No se pudo encontrar información para este QR</p>
              <Button onClick={() => setLocation("/qr-scanner")}>
                Escanear Otro QR
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const qrData = (qrInfo as any).qrCode;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/qr-scanner")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validación Fortalecida</h1>
            <p className="text-gray-600">Sistema de validación con campos obligatorios</p>
          </div>
        </div>

        {/* Información del QR */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información del Lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Tipo de Evento</Label>
                <Badge variant="outline" className="mt-1">
                  {qrData.eventType}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">ID del QR</Label>
                <p className="text-sm font-mono">{qrData.qrId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Estado</Label>
                <Badge className="mt-1">{qrData.status}</Badge>
              </div>
            </div>
            
            {qrData.metadata && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-500">Información del Lote</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  {qrData.metadata.batchId && <p><strong>Lote:</strong> {qrData.metadata.batchId}</p>}
                  {qrData.metadata.weight && <p><strong>Peso inicial:</strong> {qrData.metadata.weight}</p>}
                  {qrData.metadata.bottleCount && <p><strong>Botellas:</strong> {qrData.metadata.bottleCount}</p>}
                  {qrData.metadata.location && <p><strong>Origen:</strong> {qrData.metadata.location}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario de Validación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Formulario de Validación Fortalecida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Información del Operador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Información del Operador (Obligatorio)
                    </h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="operatorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del operador" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="operatorRut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RUT Chileno *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12.345.678-9"
                            {...field}
                            onChange={(e) => {
                              const formatted = handleRutChange(e.target.value);
                              field.onChange(formatted);
                            }}
                            className={!isValidRut(field.value) && field.value ? "border-red-500" : ""}
                          />
                        </FormControl>
                        {field.value && !isValidRut(field.value) && (
                          <p className="text-sm text-red-600">RUT inválido</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="validatedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email del Operador *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="operador@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fase de Validación *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar fase" />
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
                </div>

                <Separator />

                {/* Ubicación del Centro de Procesado */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <Lock className="h-4 w-4 text-blue-600" />
                    Ubicación (Solo Centros Registrados)
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="processingCenterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Centro de Procesado *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-blue-200 bg-blue-50">
                              <SelectValue placeholder="Seleccionar centro registrado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {processingCenters?.map((center) => (
                              <SelectItem key={center.id} value={center.id.toString()}>
                                <div>
                                  <p className="font-medium">{center.name}</p>
                                  <p className="text-sm text-gray-500">{center.location} • {center.centerType}</p>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                          <Shield className="h-3 w-3" />
                          Solo centros autorizados para garantizar trazabilidad
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Peso y Diferencias */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Weight className="h-5 w-5" />
                    Control de Peso
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Peso Inicial</Label>
                      <Input 
                        value={initialWeight ? `${initialWeight} kg` : "No disponible"} 
                        disabled 
                        className="bg-gray-50"
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="currentWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso Actual (kg) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.001" 
                              placeholder="0.000"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                calculateWeightDifference(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Diferencia</Label>
                      <Input 
                        value={
                          weightDifference !== null 
                            ? `${weightDifference > 0 ? '+' : ''}${weightDifference.toFixed(3)} kg (${weightDifferencePercent?.toFixed(1)}%)`
                            : "Calculando..."
                        } 
                        disabled 
                        className={showWeightAlert ? "bg-red-50 border-red-200" : "bg-gray-50"}
                      />
                    </div>
                  </div>
                  
                  {showWeightAlert && (
                    <Alert className="mt-4 border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>Alerta de Peso:</strong> La diferencia supera el umbral de ±15%. 
                        Diferencia actual: {weightDifferencePercent?.toFixed(1)}%
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                {/* Evidencia Obligatoria */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Evidencia Fotográfica (Obligatoria)
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="scale-photo" className="block text-sm font-medium mb-2">
                        Foto de la Báscula *
                      </Label>
                      <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center bg-red-50">
                        <Camera className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-red-700 mb-2">
                          <strong>OBLIGATORIO:</strong> Foto clara de la báscula mostrando el peso
                        </p>
                        <input
                          type="file"
                          id="scale-photo"
                          accept="image/*"
                          capture="environment"
                          onChange={handleScalePhotoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("scale-photo")?.click()}
                          disabled={uploading}
                          className="border-red-400 text-red-700"
                        >
                          {uploading ? (
                            <>
                              <Upload className="h-4 w-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              Tomar/Subir Foto
                            </>
                          )}
                        </Button>
                        {form.watch("scalePhoto") && (
                          <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Foto de báscula subida
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notas Adicionales */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observaciones durante la validación..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botón de Envío */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      validationMutation.isPending || 
                      !form.watch("scalePhoto") ||
                      !form.watch("operatorRut") ||
                      !isValidRut(form.watch("operatorRut"))
                    }
                  >
                    {validationMutation.isPending ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Validando y registrando en blockchain...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completar Validación Fortalecida
                      </>
                    )}
                  </Button>
                  
                  {!form.watch("scalePhoto") && (
                    <p className="text-xs text-red-600 text-center mt-2">
                      Debe subir la foto de la báscula para continuar
                    </p>
                  )}
                  
                  {(!form.watch("operatorRut") || !isValidRut(form.watch("operatorRut"))) && (
                    <p className="text-xs text-red-600 text-center mt-2">
                      Debe ingresar un RUT chileno válido (formato: 12.345.678-9)
                    </p>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}