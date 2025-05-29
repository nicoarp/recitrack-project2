import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TraceabilityEvent {
  eventId: number;
  eventType: string;
  relatedIds: string[];
  location: string;
  quantity: string;
  actor: string;
  timestamp: number;
  description: string;
}

export default function TraceabilityChain() {
  const [eventId, setEventId] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);
  const { toast } = useToast();

  // Query para obtener la cadena de trazabilidad
  const { data: traceabilityData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/blockchain/traceability", eventId],
    queryFn: async () => {
      const response = await apiRequest(`/api/blockchain/traceability/${eventId}`);
      return response;
    },
    enabled: shouldFetch && eventId.trim() !== "",
  });

  const handleSearch = () => {
    if (!eventId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingrese un ID de evento válido",
      });
      return;
    }
    setShouldFetch(true);
    refetch();
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'Deposit': return 'bottle-water';
      case 'Batch': return 'layer-group';
      case 'Process': return 'cogs';
      case 'Product': return 'cube';
      default: return 'circle';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'Deposit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Batch': return 'bg-green-100 text-green-800 border-green-200';
      case 'Process': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Product': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Sistema';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cadena de Trazabilidad</h1>
        <p className="mt-2 text-gray-600">Consulte la historia completa de un evento en la blockchain</p>
      </div>

      {/* Buscador */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon="search" className="mr-2 text-blue-500" />
            Buscar Trazabilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="eventId">ID del Evento</Label>
              <Input
                id="eventId"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Ingrese el ID del evento (ej: 1001)"
                className="mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isLoading || !eventId.trim()}
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="animate-spin mr-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="search" className="mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {error && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-red-600">
              <FontAwesomeIcon icon="exclamation-triangle" className="text-4xl mb-4" />
              <p>Error al consultar la trazabilidad</p>
              <p className="text-sm mt-2">{(error as any)?.message || 'Verifique el ID del evento'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {traceabilityData && traceabilityData.success && (
        <div className="space-y-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon="chart-line" className="mr-2 text-green-500" />
                Resumen de Trazabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {traceabilityData.totalEvents}
                  </div>
                  <div className="text-sm text-blue-600">Eventos Totales</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {traceabilityData.chain?.filter((e: TraceabilityEvent) => e.eventType === 'Deposit').length || 0}
                  </div>
                  <div className="text-sm text-green-600">Depósitos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {traceabilityData.chain?.filter((e: TraceabilityEvent) => e.eventType === 'Process').length || 0}
                  </div>
                  <div className="text-sm text-purple-600">Procesos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cadena de eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon="link" className="mr-2 text-blue-500" />
                Cadena de Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {traceabilityData.chain && traceabilityData.chain.length > 0 ? (
                <div className="space-y-4">
                  {traceabilityData.chain.map((event: TraceabilityEvent, index: number) => (
                    <div key={event.eventId} className="relative">
                      {/* Línea conectora */}
                      {index < traceabilityData.chain.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Icono del evento */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getEventTypeColor(event.eventType)}`}>
                          <FontAwesomeIcon icon={getEventTypeIcon(event.eventType)} />
                        </div>
                        
                        {/* Contenido del evento */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getEventTypeColor(event.eventType)}>
                                {event.eventType}
                              </Badge>
                              <span className="text-sm text-gray-500">ID: {event.eventId}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(event.timestamp)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">📍 Ubicación</p>
                              <p className="text-sm text-gray-600">{event.location}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">📊 Cantidad</p>
                              <p className="text-sm text-gray-600">{event.quantity} botellas</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">👤 Actor</p>
                              <p className="text-sm text-gray-600">{formatAddress(event.actor)}</p>
                            </div>
                            {event.relatedIds.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">🔗 Eventos Relacionados</p>
                                <p className="text-sm text-gray-600">
                                  {event.relatedIds.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {event.description && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700">📝 Descripción</p>
                              <p className="text-sm text-gray-600">{event.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon="link" className="text-4xl mb-4" />
                  <p>No se encontraron eventos en la cadena</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estado inicial */}
      {!shouldFetch && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon="search" className="text-4xl mb-4" />
              <p>Ingrese un ID de evento para consultar su trazabilidad</p>
              <p className="text-sm mt-2">Podrá ver toda la cadena de eventos relacionados</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}