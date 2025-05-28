import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faPlus, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { QRGenerator } from "@/components/qr/qr-generator";

export default function QRAdmin() {
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // Obtener lista de puntos de reciclaje
  const { data: recyclingPoints, isLoading } = useQuery({
    queryKey: ["/api/recycling-points"],
    queryFn: async () => {
      const response = await fetch("/api/recycling-points");
      if (!response.ok) throw new Error("Error al cargar puntos de reciclaje");
      return response.json();
    },
  });

  const handleGenerateQR = (point: any) => {
    setSelectedPoint(point);
    setShowGenerator(true);
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
    setSelectedPoint(null);
  };

  if (showGenerator && selectedPoint) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={handleCloseGenerator}
            className="mb-4"
          >
            ← Volver a la lista
          </Button>
        </div>
        <QRGenerator 
          depositId={selectedPoint.depositId}
          locationName={selectedPoint.name}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Administración de Códigos QR
        </h1>
        <p className="text-gray-600">
          Genera códigos QR para los puntos de depósito de reciclaje
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recyclingPoints?.map((point: any) => (
            <Card key={point.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600" />
                  {point.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">ID: {point.depositId}</p>
                    <p>{point.address}</p>
                    {point.hours && (
                      <p className="text-xs text-gray-500 mt-1">{point.hours}</p>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <Button 
                      onClick={() => handleGenerateQR(point)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FontAwesomeIcon icon={faQrcode} className="mr-2" />
                      Generar QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {recyclingPoints && recyclingPoints.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay puntos de reciclaje
            </h3>
            <p className="text-gray-600 mb-4">
              Agrega puntos de reciclaje para poder generar códigos QR
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Agregar Punto de Reciclaje
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faQrcode} />
              Instrucciones para usar los códigos QR
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1.</strong> Genera el código QR para cada punto de depósito</p>
              <p><strong>2.</strong> Descarga e imprime el código QR</p>
              <p><strong>3.</strong> Coloca el QR en un lugar visible en el punto de depósito</p>
              <p><strong>4.</strong> Los usuarios podrán escanear el QR para registrar automáticamente su reciclaje</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}