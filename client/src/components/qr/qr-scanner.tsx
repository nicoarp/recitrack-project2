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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startQRDetection = () => {
    if (!videoRef.current) return;

    // Crear un canvas para capturar frames del video
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    // Función que escanea cada frame en busca de QR
    const scanFrame = () => {
      if (!videoRef.current || !isScanning) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (canvas.width > 0 && canvas.height > 0) {
        context.drawImage(videoRef.current, 0, 0);
        
        // Usar la API nativa BarcodeDetector si está disponible
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          detector.detect(canvas)
            .then((barcodes: any[]) => {
              if (barcodes.length > 0) {
                console.log('QR detectado automáticamente:', barcodes[0].rawValue);
                handleQRResult(barcodes[0].rawValue);
              }
            })
            .catch(() => {
              // Si BarcodeDetector falla, continuar intentando
            });
        }
      }
    };

    // Escanear cada 500ms
    intervalRef.current = setInterval(scanFrame, 500);
  };

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
        
        // Iniciar detección automática de QR
        startQRDetection();
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    // Detener la detección automática
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Detener el stream de video
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
      
      // Normalizar el ID para que coincida con nuestro formato
      let normalizedResult = result.toUpperCase().trim();
      
      // Si contiene "CENTRO DE RECICLAJE", convertirlo al ID correcto
      if (normalizedResult.includes("CENTRO DE RECICLAJE")) {
        normalizedResult = "MUNICIPAL-004"; // El ID real del Centro de Reciclaje Municipal
      }
      
      // Validar formato del ID (ej: CENTRO-001, NORTE-002, MUNICIPAL-001)
      if (!normalizedResult.match(/^[A-Z]+-\d+$/)) {
        toast({
          title: "QR Inválido",
          description: `El código QR "${result}" no tiene el formato correcto. Use formato como CENTRO-001`,
          variant: "destructive"
        });
        return;
      }
      
      // Usar el resultado normalizado
      result = normalizedResult;

      // Datos de puntos de depósito locales como fallback
      const recyclingPoints = {
        "CENTRO-001": {
          id: 1,
          depositId: "CENTRO-001",
          name: "Punto Limpio Central",
          address: "Av. Principal 123, Centro",
          hours: "Lun-Vie: 9:00-18:00, Sáb: 10:00-14:00",
          acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio"]
        },
        "NORTE-002": {
          id: 2,
          depositId: "NORTE-002",
          name: "Punto Limpio Norte",
          address: "Calle Norte 456, Zona Norte",
          hours: "Lun-Vie: 8:00-17:00, Sáb: 9:00-13:00",
          acceptedItems: ["Botellas PET", "Plásticos", "Latas", "Vidrio"]
        },
        "SUR-003": {
          id: 3,
          depositId: "SUR-003",
          name: "Punto Limpio Sur",
          address: "Av. Sur 789, Zona Sur",
          hours: "Lun-Vie: 9:00-18:00, Sáb: 10:00-15:00",
          acceptedItems: ["Botellas PET", "Electrónicos", "Papel", "Vidrio"]
        },
        "MUNICIPAL-004": {
          id: 4,
          depositId: "MUNICIPAL-004",
          name: "Centro de Reciclaje Municipal",
          address: "Carretera Principal Km 5, Afueras",
          hours: "Lun-Dom: 8:00-20:00",
          acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio", "Metales", "Electrónicos"]
        },
        "LAGO-005": {
          id: 5,
          depositId: "LAGO-005",
          name: "Casa, Lago Huechen",
          address: "Lago Huechen",
          hours: "Lun-Dom: 8:00-20:00",
          acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio"]
        }
      };

      const locationData = recyclingPoints[result as keyof typeof recyclingPoints];
      
      if (!locationData) {
        toast({
          title: "Punto no encontrado",
          description: `No se encontró el punto de depósito ${result}`,
          variant: "destructive"
        });
        return;
      }

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
                <FontAwesomeIcon icon={faCamera} className="text-4xl text-gray-400" />
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