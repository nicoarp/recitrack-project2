import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BatchData {
  eventId: string;
  location: string;
  quantity: number;
  timestamp: number;
  description: string;
  relatedIds: string[];
}

export default function ProcessManagement() {
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [processLocation, setProcessLocation] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [processType, setProcessType] = useState("Lavado y Triturado");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener lotes disponibles desde blockchain
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["/api/blockchain/batch-events"],
    select: (data) => {
      if (data?.events) {
        return data.events.map((event: any) => ({
          eventId: event.eventId.toString(),
          location: event.location,
          quantity: event.quantity,
          timestamp: event.timestamp * 1000, // Convertir a milliseconds
          description: event.description || `Lote con ${event.quantity} botellas`,
          relatedIds: event.relatedIds || []
        }));
      }
      return [];
    }
  });

  // Mutación para registrar proceso
  const createProcessMutation = useMutation({
    mutationFn: async (processData: any) => {
      const response = await apiRequest('POST', '/api/blockchain/register-multi-stage', processData);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Proceso registrado exitosamente",
        description: `Proceso registrado en blockchain con ID: ${result.eventId}`,
      });
      
      // Limpiar formulario
      setSelectedBatches([]);
      setProcessLocation("");
      setProcessDescription("");
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ["/api/blockchain/batches"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al registrar proceso",
        description: error.message || "No se pudo registrar el proceso",
      });
    },
  });

  const handleBatchToggle = (batchId: string) => {
    setSelectedBatches(prev => 
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleCreateProcess = () => {
    if (selectedBatches.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar al menos un lote para procesar",
      });
      return;
    }

    if (!processLocation.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe especificar la ubicación de la planta",
      });
      return;
    }

    // Calcular cantidad total
    const totalQuantity = batches
      .filter((batch: BatchData) => selectedBatches.includes(batch.eventId))
      .reduce((sum: number, batch: BatchData) => sum + batch.quantity, 0);

    const processData = {
      eventType: "Process",
      relatedIds: selectedBatches.map(id => parseInt(id)),
      location: processLocation,
      quantity: totalQuantity,
      description: processDescription || `${processType} - ${selectedBatches.length} lotes procesados (${totalQuantity} botellas)`
    };

    createProcessMutation.mutate(processData);
  };

  const processTypes = [
    "Lavado y Triturado",
    "Separación por Colores", 
    "Peletizado",
    "Extrusión",
    "Moldeo"
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">Cargando lotes disponibles...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Procesos</h1>
        <p className="mt-2 text-gray-600">Registre el procesamiento de lotes en plantas de reciclaje</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de lotes disponibles para procesar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="layer-group" className="mr-2 text-green-500" />
              Lotes Disponibles ({batches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon="inbox" className="text-4xl mb-4" />
                <p>No hay lotes disponibles para procesar</p>
                <p className="text-sm mt-2">Los lotes aparecerán aquí una vez creados en el sistema</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {batches.map((batch: BatchData) => (
                  <div
                    key={batch.eventId}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedBatches.includes(batch.eventId)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleBatchToggle(batch.eventId)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <Badge variant="outline" className="mr-2">
                            Lote ID: {batch.eventId}
                          </Badge>
                          <Badge variant="secondary">
                            {batch.quantity} botellas
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          📍 {batch.location}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          📦 {batch.relatedIds.length} depósitos agrupados
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(batch.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedBatches.includes(batch.eventId) && (
                        <FontAwesomeIcon icon="check-circle" className="text-green-500 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario para registrar proceso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="cogs" className="mr-2 text-blue-500" />
              Registrar Proceso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBatches.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-green-800">
                  {selectedBatches.length} lotes seleccionados
                </p>
                <p className="text-sm text-green-600">
                  Total: {batches
                    .filter((b: BatchData) => selectedBatches.includes(b.eventId))
                    .reduce((sum: number, b: BatchData) => sum + b.quantity, 0)} botellas
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="processType">Tipo de Proceso</Label>
              <select
                id="processType"
                value={processType}
                onChange={(e) => setProcessType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {processTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="location">Ubicación de la Planta</Label>
              <Input
                id="location"
                value={processLocation}
                onChange={(e) => setProcessLocation(e.target.value)}
                placeholder="Ej: Planta de Reciclaje Industrial Norte"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción del Proceso</Label>
              <Textarea
                id="description"
                value={processDescription}
                onChange={(e) => setProcessDescription(e.target.value)}
                placeholder="Detalles del proceso realizado, temperatura, tiempo, etc..."
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreateProcess}
              disabled={selectedBatches.length === 0 || !processLocation.trim() || createProcessMutation.isPending}
              className="w-full"
            >
              {createProcessMutation.isPending ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="animate-spin mr-2" />
                  Registrando Proceso...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="cogs" className="mr-2" />
                  Registrar Proceso en Blockchain
                </>
              )}
            </Button>

            {selectedBatches.length === 0 && (
              <p className="text-sm text-gray-500 text-center">
                Seleccione lotes de la lista para registrar un proceso
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}