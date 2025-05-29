import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QRScanner } from "@/components/qr/qr-scanner";

// Definimos el esquema de validación
const formSchema = z.object({
  batchId: z.string().min(1, "El ID del lote es requerido"),
  bottleCount: z.string().min(1, "La cantidad de botellas es requerida"),
  location: z.string().min(1, "La ubicación es requerida")
});

interface DepositFormProps {
  prefilledLocation?: {
    depositId: string;
    name: string;
    address: string;
  } | null;
}

export function DepositForm({ prefilledLocation }: DepositFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedLocation, setScannedLocation] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchId: "1",
      bottleCount: "5",
      location: prefilledLocation ? prefilledLocation.name : (scannedLocation ? scannedLocation.name : "Punto Limpio Central")
    }
  });

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      console.log('Registrando depósito en blockchain:', values);
      
      // Enviar al backend blockchain invisible
      const response = await fetch("/api/blockchain/register-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: values.batchId,
          eventType: "DepositoLote", 
          description: `${values.bottleCount} botellas depositadas`,
          location: prefilledLocation ? prefilledLocation.name : values.location,
          bottleCount: parseInt(values.bottleCount)
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.mode === "blockchain" && result.txHash) {
          // Mostrar hash completo con enlace a Etherscan
          const etherscanUrl = `https://sepolia.etherscan.io/tx/${result.txHash}`;
          
          toast({
            title: "¡Éxito!",
            description: (
              <div className="space-y-2">
                <p>Depósito registrado correctamente en blockchain</p>
                <div className="text-xs">
                  <p className="font-medium">Hash de transacción:</p>
                  <a 
                    href={etherscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {result.txHash}
                  </a>
                </div>
                <p className="text-xs text-gray-500">Haz clic en el hash para ver en Etherscan</p>
              </div>
            )
          });
        } else {
          toast({
            title: "¡Éxito!",
            description: "Depósito registrado correctamente localmente"
          });
        }
        
        // Resetear formulario para nuevo depósito
        form.reset({
          batchId: values.batchId,
          bottleCount: "",
          location: values.location
        });
      } else {
        throw new Error(result.error || "Error en el registro");
      }
      
    } catch (error) {
      console.error('Error registering deposit:', error);
      toast({
        title: "Error",
        description: "Error al registrar el depósito",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScan = (depositId: string, locationData: any) => {
    // Actualizar el formulario con los datos escaneados
    form.setValue("location", locationData.name);
    setScannedLocation(locationData);
    setShowQRScanner(false);
    
    toast({
      title: "¡Ubicación detectada!",
      description: `${locationData.name} - ${locationData.depositId}`
    });
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
  };

  const closeQRScanner = () => {
    setShowQRScanner(false);
  };

  if (showQRScanner) {
    return (
      <QRScanner 
        onScanResult={handleQRScan}
        onClose={closeQRScanner}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary-500 py-4 px-6">
        <CardTitle className="text-lg font-semibold text-white">Registrar Depósito</CardTitle>
      </CardHeader>
      <CardContent className="p-6">


        {/* Mostrar ubicación fija si viene desde QR */}
        {prefilledLocation && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <FontAwesomeIcon icon={faQrcode} className="text-2xl text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-green-800">📍 Ubicación desde QR</h3>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="font-bold text-gray-900">{prefilledLocation.name}</p>
                <p className="text-sm text-gray-600">{prefilledLocation.address}</p>
                <p className="text-xs text-green-600 mt-1">ID: {prefilledLocation.depositId}</p>
              </div>
              <p className="text-sm text-green-700">
                ✅ Ubicación confirmada - No editable para mantener trazabilidad
              </p>
            </div>
          </div>
        )}

        {scannedLocation && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <FontAwesomeIcon icon={faQrcode} className="mr-2" />
              <span className="text-sm font-medium">
                Ubicación detectada: {scannedLocation.name} ({scannedLocation.depositId})
              </span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Solo mostrar campo de ID si NO hay ubicación pre-cargada desde QR */}
            {!prefilledLocation && (
              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">ID de Lote/Punto Limpio:</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="bottleCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Cantidad de botellas:</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Solo mostrar selector de ubicación si NO hay ubicación pre-cargada */}
            {!prefilledLocation && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Ubicación:</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <SelectValue placeholder="Selecciona una ubicación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Punto Limpio Central">Punto Limpio Central</SelectItem>
                        <SelectItem value="Punto Limpio Norte">Punto Limpio Norte</SelectItem>
                        <SelectItem value="Punto Limpio Sur">Punto Limpio Sur</SelectItem>
                        <SelectItem value="Centro de Reciclaje Municipal">Centro de Reciclaje Municipal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Mostrar ubicación fija cuando viene desde QR */}
            {prefilledLocation && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ubicación:</label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                  <div className="flex items-center justify-between">
                    <span>{prefilledLocation.name}</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      🔒 Fijo desde QR
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Esta ubicación no puede modificarse para mantener la trazabilidad del QR escaneado
                </p>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon="spinner" spin className="mr-2" />
                  Registrando...
                </>
              ) : "Registrar Depósito"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}