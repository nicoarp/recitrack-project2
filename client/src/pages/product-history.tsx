import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faCalendarAlt, faMapMarkerAlt, faWeight, faExternalLinkAlt, faRecycle } from "@fortawesome/free-solid-svg-icons";

interface ProductEvent {
  eventId: number;
  eventType: string;
  location: string;
  quantity: number;
  timestamp: number;
  description: string;
  actor: string;
  relatedIds: string[];
}

export default function ProductHistory() {
  const { data: productEvents = [], isLoading, error } = useQuery({
    queryKey: ["/api/blockchain/product-events"],
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
          <FontAwesomeIcon icon={faBoxOpen} className="text-2xl text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Historial de Productos Finales</h1>
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
          <FontAwesomeIcon icon={faBoxOpen} className="text-2xl text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Historial de Productos Finales</h1>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error al cargar los productos desde blockchain</p>
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
    return `https://sepolia.etherscan.io/address/0x60C06476501C50C36F76462975EcE12c9cdEA851`;
  };

  const extractWeight = (description: string) => {
    const weightMatch = description.match(/Peso:\s*([0-9.]+)kg/);
    return weightMatch ? weightMatch[1] + "kg" : "No especificado";
  };

  const extractProductType = (description: string) => {
    const typeMatch = description.match(/^([^-]+)/);
    return typeMatch ? typeMatch[1].trim() : "Producto reciclado";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <FontAwesomeIcon icon={faBoxOpen} className="text-2xl text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900">Historial de Productos Finales</h1>
      </div>

      {productEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FontAwesomeIcon icon={faBoxOpen} className="text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500">No hay productos finales registrados en blockchain</p>
            <p className="text-sm text-gray-400 mt-2">
              Los productos aparecerán aquí cuando se procesen lotes en productos terminados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {productEvents.map((product: ProductEvent) => (
            <Card key={product.eventId} className="border-l-4 border-l-green-600">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      Producto ID {product.eventId}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {extractProductType(product.description)}
                      </Badge>
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        {product.eventType}
                      </Badge>
                    </div>
                  </div>
                  <a
                    href={getSepoliaLink(product.eventId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-800 text-sm"
                  >
                    Ver en blockchain
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </a>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ubicación</p>
                      <p className="font-medium">{product.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faRecycle} className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Botellas procesadas</p>
                      <p className="font-medium">{product.quantity} botellas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faWeight} className="text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Peso final</p>
                      <p className="font-medium">{extractWeight(product.description)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha de producción</p>
                      <p className="font-medium">{formatDate(product.timestamp)}</p>
                    </div>
                  </div>
                </div>
                
                {product.description && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 mb-1">Descripción del producto</p>
                    <p className="text-gray-900">{product.description}</p>
                  </div>
                )}
                
                {product.relatedIds && product.relatedIds.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-2">Procesos utilizados</p>
                    <div className="flex flex-wrap gap-2">
                      {product.relatedIds.map((id, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          Proceso {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faRecycle} className="text-gray-600" />
                    <p className="text-sm text-gray-600">Operador responsable</p>
                  </div>
                  <p className="font-mono text-sm text-gray-900">{formatAddress(product.actor)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}