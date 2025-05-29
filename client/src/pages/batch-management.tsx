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

interface DepositEvent {
  id: number;
  eventId: string;
  location: string;
  quantity: number;
  timestamp: Date;
  description: string;
}

export default function BatchManagement() {
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [batchLocation, setBatchLocation] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener depósitos disponibles para agrupar desde blockchain
  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ["/api/blockchain/deposit-events"],
    select: (data) => {
      if (data?.events) {
        return data.events.map((event: any) => ({
          id: event.eventId,
          eventId: event.eventId,
          location: event.location,
          quantity: event.quantity,
          timestamp: new Date(event.timestamp * 1000),
          description: event.description || `Depósito de ${event.quantity} botellas`
        }));
      }
      return [];
    }
  });

  // Mutación para crear lote
  const createBatchMutation = useMutation({
    mutationFn: async (batchData: any) => {
      const response = await apiRequest('POST', '/api/blockchain/register-multi-stage', batchData);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Lote creado exitosamente",
        description: `Lote registrado en blockchain con ID: ${result.eventId}`,
      });
      
      // Limpiar formulario
      setSelectedDeposits([]);
      setBatchLocation("");
      setBatchDescription("");
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ["/api/bottle-deposits"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al crear lote",
        description: error.message || "No se pudo crear el lote",
      });
    },
  });

  const handleDepositToggle = (depositId: string) => {
    setSelectedDeposits(prev => 
      prev.includes(depositId)
        ? prev.filter(id => id !== depositId)
        : [...prev, depositId]
    );
  };

  // Detectar ubicación automáticamente de los depósitos seleccionados
  const getSelectedDepositsLocation = () => {
    if (selectedDeposits.length === 0) return null;
    
    const selectedDepositObjects = deposits.filter((deposit: any) => 
      selectedDeposits.includes(deposit.eventId.toString())
    );
    
    const locations = Array.from(new Set(selectedDepositObjects.map((d: any) => d.location)));
    
    if (locations.length === 1) {
      return locations[0];
    } else if (locations.length > 1) {
      return "MÚLTIPLES_UBICACIONES";
    }
    
    return null;
  };

  const selectedLocation = getSelectedDepositsLocation();
  const hasMultipleLocations = selectedLocation === "MÚLTIPLES_UBICACIONES";

  const handleCreateBatch = () => {
    if (selectedDeposits.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar al menos un depósito para crear un lote",
      });
      return;
    }

    if (hasMultipleLocations) {
      toast({
        variant: "destructive",
        title: "Error de ubicación",
        description: "No se puede crear un lote con depósitos de diferentes ubicaciones. Seleccione depósitos del mismo punto de reciclaje.",
      });
      return;
    }

    if (!selectedLocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo determinar la ubicación de los depósitos seleccionados",
      });
      return;
    }

    // Calcular cantidad total
    const totalQuantity = deposits
      .filter((deposit: any) => selectedDeposits.includes(deposit.eventId.toString()))
      .reduce((sum: number, deposit: any) => sum + deposit.quantity, 0);

    const batchData = {
      eventType: "Batch",
      relatedIds: selectedDeposits.map(id => parseInt(id)),
      location: selectedLocation,
      quantity: totalQuantity,
      description: batchDescription || `Lote con ${selectedDeposits.length} depósitos (${totalQuantity} botellas) de ${selectedLocation}`
    };

    createBatchMutation.mutate(batchData);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">Cargando depósitos disponibles...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h1>
        <p className="mt-2 text-gray-600">Agrupe depósitos individuales en lotes para su procesamiento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de depósitos disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="box" className="mr-2 text-blue-500" />
              Depósitos Disponibles ({deposits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deposits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon="inbox" className="text-4xl mb-4" />
                <p>No hay depósitos disponibles para agrupar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deposits.map((deposit: any) => (
                  <div
                    key={deposit.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedDeposits.includes(deposit.id.toString())
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDepositToggle(deposit.id.toString())}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <Badge variant="outline" className="mr-2">
                            ID: {deposit.batchId || deposit.id}
                          </Badge>
                          <Badge variant="secondary">
                            {deposit.bottleCount} botellas
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          📍 {deposit.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(deposit.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedDeposits.includes(deposit.id.toString()) && (
                        <FontAwesomeIcon icon="check-circle" className="text-blue-500 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario para crear lote */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="layer-group" className="mr-2 text-green-500" />
              Crear Nuevo Lote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDeposits.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">
                  {selectedDeposits.length} depósitos seleccionados
                </p>
                <p className="text-sm text-blue-600">
                  Total: {deposits
                    .filter((d: any) => selectedDeposits.includes(d.eventId.toString()))
                    .reduce((sum: number, d: any) => sum + d.quantity, 0)} botellas
                </p>
              </div>
            )}

            {/* Mostrar ubicación detectada automáticamente */}
            {selectedDeposits.length > 0 && (
              <div>
                <Label>Ubicación del Lote (Detectada Automáticamente)</Label>
                <div className={`mt-1 p-3 rounded-md border ${
                  hasMultipleLocations ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'
                }`}>
                  {hasMultipleLocations ? (
                    <div className="text-red-700">
                      <FontAwesomeIcon icon="exclamation-triangle" className="mr-2" />
                      Error: Los depósitos seleccionados pertenecen a diferentes ubicaciones.
                      <br />
                      <span className="text-sm">Seleccione depósitos del mismo punto de reciclaje.</span>
                    </div>
                  ) : selectedLocation ? (
                    <div className="text-green-700">
                      <FontAwesomeIcon icon="map-marker-alt" className="mr-2" />
                      {selectedLocation}
                      <span className="text-sm ml-2">(No editable - Garantiza trazabilidad)</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      Seleccione depósitos para detectar ubicación
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                value={batchDescription}
                onChange={(e) => setBatchDescription(e.target.value)}
                placeholder="Información adicional sobre el lote..."
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreateBatch}
              disabled={selectedDeposits.length === 0 || hasMultipleLocations || !selectedLocation || createBatchMutation.isPending}
              className="w-full"
            >
              {createBatchMutation.isPending ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="animate-spin mr-2" />
                  Creando Lote...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="plus" className="mr-2" />
                  Crear Lote en Blockchain
                </>
              )}
            </Button>

            {selectedDeposits.length === 0 && (
              <p className="text-sm text-gray-500 text-center">
                Seleccione depósitos de la lista para crear un lote
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}