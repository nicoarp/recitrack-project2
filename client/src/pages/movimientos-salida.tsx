import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Esquema de validación para el formulario
const movimientoSalidaSchema = z.object({
  fecha: z.string().min(1, "Fecha es requerida"),
  destino: z.string().min(1, "Destino es requerido"),
  tipoResiduo: z.string().min(1, "Tipo de residuo es requerido"),
  peso: z.number().min(0.1, "Peso debe ser mayor a 0"),
  batchId: z.number().optional(),
  observaciones: z.string().optional(),
  numeroGuia: z.string().optional(),
  transportista: z.string().optional(),
  estado: z.string().default("registrado"),
});

type MovimientoSalidaData = z.infer<typeof movimientoSalidaSchema>;

const tiposResiduos = [
  { value: "PET", label: "PET (Polietileno Tereftalato)" },
  { value: "HDPE", label: "HDPE (Polietileno de Alta Densidad)" },
  { value: "LDPE", label: "LDPE (Polietileno de Baja Densidad)" },
  { value: "PP", label: "PP (Polipropileno)" },
  { value: "PS", label: "PS (Poliestireno)" },
  { value: "PVC", label: "PVC (Policloruro de Vinilo)" },
  { value: "MIXTO", label: "Plástico Mixto" },
  { value: "OTRO", label: "Otro" },
];

const estadosMovimiento = [
  { value: "registrado", label: "Registrado" },
  { value: "en_transito", label: "En Tránsito" },
  { value: "entregado", label: "Entregado" },
];

export default function MovimientosSalida() {
  const { user, isCentroAcopio } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [documentos, setDocumentos] = useState<File[]>([]);

  const form = useForm<MovimientoSalidaData>({
    resolver: zodResolver(movimientoSalidaSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      destino: "",
      tipoResiduo: "",
      peso: 0,
      observaciones: "",
      numeroGuia: "",
      transportista: "",
      estado: "registrado",
    },
  });

  const createMovimientoMutation = useMutation({
    mutationFn: async (data: MovimientoSalidaData & { creadoPor: number }) => {
      return apiRequest("/api/movimientos-salida", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento de salida registrado correctamente",
      });
      form.reset();
      setDocumentos([]);
      queryClient.invalidateQueries({ queryKey: ["/api/movimientos-salida"] });
    },
    onError: (error: any) => {
      console.error("Error registrando movimiento:", error);
      toast({
        title: "Error",
        description: error.message || "Error al registrar movimiento de salida",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MovimientoSalidaData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debe estar autenticado para registrar movimientos",
        variant: "destructive",
      });
      return;
    }

    if (!isCentroAcopio && user.role !== 'admin') {
      toast({
        title: "Acceso Denegado",
        description: "Solo los centros de acopio pueden registrar salidas de materiales",
        variant: "destructive",
      });
      return;
    }

    createMovimientoMutation.mutate({
      ...data,
      creadoPor: user.id,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocumentos(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocumentos(prev => prev.filter((_, i) => i !== index));
  };

  // Verificar permisos
  if (!isCentroAcopio && user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FontAwesomeIcon icon="exclamation-triangle" className="text-6xl text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
            <p className="text-gray-600 text-center">
              Esta funcionalidad está disponible únicamente para centros de acopio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FontAwesomeIcon icon="truck" className="mr-3 text-primary-500" />
          Registro de Salida de Materiales
        </h1>
        <p className="text-gray-600 mt-2">
          Registra la salida de materiales reciclados desde tu centro de acopio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Movimiento de Salida</CardTitle>
          <CardDescription>
            Completa la información del despacho de materiales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Salida</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipoResiduo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Residuo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de residuo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposResiduos.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destino"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa/Destino</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la empresa o destino final"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0.0"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información del transporte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transportista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa Transportista (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la empresa de transporte"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroGuia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Guía (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Número de guía de despacho"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Estado y lote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estadosMovimiento.map((estado) => (
                            <SelectItem key={estado.value} value={estado.value}>
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID de Lote Asociado (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="ID del lote si corresponde"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observaciones */}
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales sobre el movimiento de salida"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Documentos adjuntos */}
              <div className="space-y-2">
                <Label>Documentos Adjuntos (Opcional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Guías de despacho, certificados, etc. (PDF, imágenes, documentos)
                  </p>
                </div>
                
                {documentos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Archivos seleccionados:</p>
                    {documentos.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{doc.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                        >
                          <FontAwesomeIcon icon="times" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={createMovimientoMutation.isPending}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  {createMovimientoMutation.isPending ? (
                    <>
                      <FontAwesomeIcon icon="spinner" className="mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon="save" className="mr-2" />
                      Registrar Salida
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setDocumentos([]);
                  }}
                >
                  <FontAwesomeIcon icon="undo" className="mr-2" />
                  Limpiar Formulario
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}