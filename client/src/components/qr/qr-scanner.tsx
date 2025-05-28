import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faTimes, faCamera } from "@fortawesome/free-solid-svg-icons";

interface QRScannerProps {
  onScanResult: (depositId: string, locationData: any) => void;
  onClose: () => void;
}

export function QRScanner({ onScanResult, onClose }: QRScannerProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Cámara trasera preferida
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleManualInput = () => {
    const input = prompt("Ingresa el ID del punto de depósito manualmente:");
    if (input && input.trim()) {
      handleQRResult(input.trim().toUpperCase());
    }
  };

  const handleQRResult = async (result: string) => {
    try {
      console.log('QR escaneado:', result);
      
      // Validar formato del ID (ej: CENTRO-001, NORTE-002)
      if (!result.match(/^[A-Z]+-\d+$/)) {
        toast({
          title: "QR Inválido",
          description: "El código QR no tiene el formato correcto",
          variant: "destructive"
        });
        return;
      }

      // Buscar el punto de depósito por ID
      const response = await fetch(`/api/recycling-points/qr/${result}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Punto no encontrado",
            description: `No se encontró el punto de depósito ${result}`,
            variant: "destructive"
          });
        } else {
          throw new Error("Error al buscar el punto de depósito");
        }
        return;
      }

      const locationData = await response.json();
      
      toast({
        title: "¡QR Escaneado!",
        description: `Punto: ${locationData.name}`
      });

      stopCamera();
      onScanResult(result, locationData);
      
    } catch (error) {
      console.error('Error procesando QR:', error);
      toast({
        title: "Error",
        description: "Error al procesar el código QR",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-primary-500 py-4 px-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faExpand} />
            Escanear QR
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faQrcode} className="text-4xl text-gray-400" />
              </div>
              <p className="text-gray-600">
                Escanea el código QR del punto de depósito para registrar tu reciclaje
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-2">💡 Consejos para escanear:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Enfoca bien el código QR</li>
                  <li>• Asegúrate de tener buena iluminación</li>
                  <li>• Si tienes problemas, usa la opción manual</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Button onClick={startCamera} className="w-full">
                  <FontAwesomeIcon icon={faCamera} className="mr-2" />
                  Activar Cámara
                </Button>
                <Button variant="outline" onClick={handleManualInput} className="w-full">
                  Ingresar ID Manualmente
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-dashed border-white rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 border-2 border-white rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Apunta la cámara hacia el código QR
                </p>
                <Button variant="outline" onClick={stopCamera} className="w-full">
                  Cancelar Escaneo
                </Button>
                <Button variant="ghost" onClick={handleManualInput} className="w-full text-sm">
                  Ingresar ID Manualmente
                </Button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}