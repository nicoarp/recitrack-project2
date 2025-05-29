import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faCalendarAlt, faMapMarkerAlt, faCogs, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProcessData {
  eventId: string;
  location: string;
  quantity: number;
  timestamp: number;
  description: string;
  relatedIds: string[];
}

export default function ProductManagement() {
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [productLocation, setProductLocation] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productType, setProductType] = useState("Pellets PET");
  const [productWeight, setProductWeight] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener procesos disponibles desde blockchain
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["/api/blockchain/process-events"],
    select: (data) => {
      if (data?.events) {
        return data.events.map((event: any) => ({
          eventId: event.eventId.toString(),
          location: event.location,
          quantity: event.quantity,
          timestamp: event.timestamp * 1000,
          description: event.description || `Proceso con ${event.quantity} botellas`,
          relatedIds: event.relatedIds || []
        }));
      }
      return [];
    }
  });

  // Mutación para registrar producto final
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest('POST', '/api/blockchain/register-multi-stage', productData);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Producto registrado exitosamente",
        description: `Producto final registrado en blockchain con ID: ${result.eventId}`,
      });
      
      // Limpiar formulario
      setSelectedProcesses([]);
      setProductLocation("");
      setProductDescription("");
      setProductWeight("");
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ["/api/blockchain/process-events"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar producto",
        description: error.message || "No se pudo registrar el producto en blockchain",
        variant: "destructive",
      });
    },
  });

  const handleProcessSelection = (processId: string) => {
    setSelectedProcesses(prev => 
      prev.includes(processId) 
        ? prev.filter(id => id !== processId)
        : [...prev, processId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProcesses.length === 0) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar al menos un proceso para crear el producto",
        variant: "destructive",
      });
      return;
    }

    if (!productLocation.trim()) {
      toast({
        title: "Error de validación",
        description: "La ubicación de producción es obligatoria",
        variant: "destructive",
      });
      return;
    }

    if (!productWeight.trim()) {
      toast({
        title: "Error de validación",
        description: "El peso del producto final es obligatorio",
        variant: "destructive",
      });
      return;
    }

    // Calcular cantidad total procesada
    const totalBottles = processes
      .filter((process: ProcessData) => selectedProcesses.includes(process.eventId))
      .reduce((sum: number, process: ProcessData) => sum + process.quantity, 0);

    const productData = {
      eventType: "Product", // Tipo 3 en el contrato
      relatedIds: selectedProcesses,
      location: productLocation.trim(),
      quantity: totalBottles, // Cantidad de botellas que se convirtieron en producto
      description: `${productType} - ${productDescription.trim()} - Peso: ${productWeight}kg (de ${totalBottles} botellas procesadas)`
    };

    createProductMutation.mutate(productData);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <FontAwesomeIcon icon={faBoxOpen} className="text-2xl text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos Finales</h1>
        </div>
        
        <div className="animate-pulse">
          <Card>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <FontAwesomeIcon icon={faBoxOpen} className="text-2xl text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos Finales</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de procesos disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCogs} className="text-blue-600" />
              Procesos Disponibles
            </CardTitle>
            <p className="text-sm text-gray-600">
              Selecciona los procesos que se convertirán en producto final
            </p>
          </CardHeader>
          <CardContent>
            {processes.length === 0 ? (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faCogs} className="text-4xl text-gray-400 mb-4" />
                <p className="text-gray-500">No hay procesos disponibles para convertir en productos</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {processes.map((process: ProcessData) => (
                  <div
                    key={process.eventId}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProcesses.includes(process.eventId)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleProcessSelection(process.eventId)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          Proceso ID {process.eventId}
                        </h3>
                        {selectedProcesses.includes(process.eventId) && (
                          <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                        )}
                      </div>
                      <Badge variant="outline">{process.quantity} botellas</Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                        <span>{process.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                        <span>{formatDate(process.timestamp)}</span>
                      </div>
                    </div>
                    
                    {process.description && (
                      <p className="text-sm text-gray-700 mt-2">{process.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {selectedProcesses.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">
                  <strong>Procesos seleccionados:</strong> {selectedProcesses.length}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Total de botellas:</strong>{" "}
                  {processes
                    .filter((process: ProcessData) => selectedProcesses.includes(process.eventId))
                    .reduce((sum: number, process: ProcessData) => sum + process.quantity, 0)} botellas
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario de producto final */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBoxOpen} className="text-green-600" />
              Registrar Producto Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productType">Tipo de Producto</Label>
                  <select
                    id="productType"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Pellets PET">Pellets PET</option>
                    <option value="Flakes PET">Flakes PET</option>
                    <option value="Resina Reciclada">Resina Reciclada</option>
                    <option value="Fibra Textil">Fibra Textil</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="productWeight">Peso Final (kg)</Label>
                  <Input
                    id="productWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="ej: 15.5"
                    value={productWeight}
                    onChange={(e) => setProductWeight(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="productLocation">Ubicación de Producción</Label>
                <Input
                  id="productLocation"
                  placeholder="ej: Planta de procesamiento central"
                  value={productLocation}
                  onChange={(e) => setProductLocation(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="productDescription">Descripción del Proceso</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Describe el proceso de transformación realizado..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={selectedProcesses.length === 0 || createProductMutation.isPending}
              >
                {createProductMutation.isPending ? (
                  <>
                    <FontAwesomeIcon icon={faCogs} className="mr-2 animate-spin" />
                    Registrando en Blockchain...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faBoxOpen} className="mr-2" />
                    Registrar Producto Final
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}