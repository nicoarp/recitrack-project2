import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs, faCalendarAlt, faMapMarkerAlt, faBoxes, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

interface ProcessEvent {
  eventId: number;
  eventType: string;
  location: string;
  quantity: number;
  timestamp: number;
  description: string;
  actor: string;
  relatedIds: string[];
}

export default function ProcessHistory() {
  const { data: processEvents = [], isLoading, error } = useQuery({
    queryKey: ["/api/blockchain/process-events"],
    select: (data) => {
      if (data?.events) {
        return data.events.map((event: any) => ({
          eventId: event.eventId,
          eventType: event.eventType,
          location: event.location,
          quantity: event.quantity,
          timestamp: event.timestamp * 1000,
          description: event.description,
          actor: event.actor,
          relatedIds: event.relatedIds || []
        }));
      }
      return [];
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <FontAwesomeIcon icon={faCogs} className="text-2xl text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Historial de Procesos</h1>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
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
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <FontAwesomeIcon icon={faCogs} className="text-2xl text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Historial de Procesos</h1>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error al cargar los procesos desde blockchain</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSepoliaLink = (eventId: number) => {
    // Para procesos específicos, podrías buscar el hash en los logs
    // Por ahora mostramos el enlace al contrato
    return `https://sepolia.etherscan.io/address/0x60C06476501C50C36F76462975EcE12c9cdEA851`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <FontAwesomeIcon icon={faCogs} className="text-2xl text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Historial de Procesos</h1>
      </div>

      {processEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FontAwesomeIcon icon={faCogs} className="text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500">No hay procesos registrados en blockchain</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {processEvents.map((process: ProcessEvent) => (
            <Card key={process.eventId} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      Proceso ID {process.eventId}
                    </CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {process.eventType}
                    </Badge>
                  </div>
                  <a
                    href={getSepoliaLink(process.eventId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver en blockchain
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </a>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ubicación</p>
                      <p className="font-medium">{process.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faBoxes} className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Cantidad procesada</p>
                      <p className="font-medium">{process.quantity} botellas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha de proceso</p>
                      <p className="font-medium">{formatDate(process.timestamp)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCogs} className="text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Operador</p>
                      <p className="font-medium">{formatAddress(process.actor)}</p>
                    </div>
                  </div>
                </div>
                
                {process.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Descripción del proceso</p>
                    <p className="text-gray-900">{process.description}</p>
                  </div>
                )}
                
                {process.relatedIds && process.relatedIds.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-2">Lotes procesados</p>
                    <div className="flex flex-wrap gap-2">
                      {process.relatedIds.map((id, index) => (
                        <Badge key={index} variant="secondary">
                          Lote {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}