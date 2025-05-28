import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faTimes, faCamera } from "@fortawesome/free-solid-svg-icons";
import { BrowserQRCodeReader } from "@zxing/browser";

interface QRScannerProps {
  onScanResult: (depositId: string, locationData: any) => void;
  onClose: () => void;
}

export function QRScanner({ onScanResult, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState("");
  const [detectionMethod, setDetectionMethod] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Inicializar detectores disponibles
  useEffect(() => {
    // Inicializar ZXing como respaldo confiable
    try {
      zxingReaderRef.current = new BrowserQRCodeReader();
      setDetectionMethod("ZXing listo");
    } catch (err) {
      console.log("ZXing no disponible");
    }

    // Verificar BarcodeDetector nativo
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        setDetectionMethod("BarcodeDetector + ZXing listos");
      } catch (err) {
        console.log("BarcodeDetector no se pudo inicializar");
      }
    }

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    setIsScanning(false);
    
    // Detener intervalos de escaneo
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Detener stream de cámara
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Limpiar ZXing reader
    if (zxingReaderRef.current) {
      try {
        // ZXing se limpia automáticamente
        zxingReaderRef.current = new BrowserQRCodeReader();
      } catch (err) {
        console.log("Error al reinicializar ZXing reader");
      }
    }
  };

  const handleQRDetected = (qrText: string, method: string) => {
    console.log(`QR detectado con ${method}:`, qrText);
    
    // Detener escaneo inmediatamente
    stopCamera();
    
    // Procesar el resultado del QR
    handleQRResult(qrText);
    
    toast({
      title: "QR Detectado",
      description: `Código: ${qrText} (${method})`,
    });
  };

  const startCamera = async () => {
    try {
      setError("");
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Iniciar detección multicapa
        startMultiLayerDetection();
      }
    } catch (err) {
      setError("No se pudo acceder a la cámara");
      setIsScanning(false);
    }
  };

  const startMultiLayerDetection = () => {
    if (!videoRef.current) return;

    // Método 1: Intentar con BarcodeDetector nativo (más rápido)
    if (barcodeDetectorRef.current) {
      startBarcodeDetectorScanning();
    }
    
    // Método 2: Usar ZXing como respaldo confiable
    if (zxingReaderRef.current) {
      startZXingScanning();
    }
    
    // Si ninguno está disponible
    if (!barcodeDetectorRef.current && !zxingReaderRef.current) {
      setError("Detección automática no disponible. Use entrada manual.");
    }
  };

  const startBarcodeDetectorScanning = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !isScanning || !context) return;
      
      try {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const barcodes = await barcodeDetectorRef.current.detect(canvas);
        if (barcodes.length > 0) {
          handleQRDetected(barcodes[0].rawValue, "BarcodeDetector");
        }
      } catch (err) {
        // Si BarcodeDetector falla, confiar en ZXing
      }
    }, 500);
  };

  const startZXingScanning = () => {
    if (!zxingReaderRef.current || !videoRef.current) return;
    
    // Usar ZXing de forma más controlada, sin tomar control del video
    const tryZXingDecode = () => {
      if (!isScanning || !zxingReaderRef.current || !videoRef.current) return;
      
      try {
        // Crear canvas temporal para ZXing
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context && videoRef.current.videoWidth > 0) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          
          // Intentar decodificar desde canvas (método sincrónico)
          try {
            const result = zxingReaderRef.current.decodeFromCanvas(canvas);
            if (result && isScanning) {
              handleQRDetected(result.getText(), "ZXing");
            }
          } catch (decodeError) {
            // Error silencioso, seguir intentando
          }
        }
      } catch (err) {
        // Error silencioso
      }
      
      // Intentar de nuevo en 1 segundo si sigue escaneando
      if (isScanning) {
        setTimeout(tryZXingDecode, 1000);
      }
    };
    
    // Iniciar detección ZXing
    setTimeout(tryZXingDecode, 500);
  };

  const handleQRResult = (qrText: string) => {
    const trimmedText = qrText.trim().toUpperCase();
    
    // Buscar coincidencias en puntos de reciclaje
    const recyclingPoints = {
      "CENTRO-001": { name: "Centro de Reciclaje Principal", address: "Av. Principal 123" },
      "NORTE-002": { name: "Punto Norte", address: "Barrio Norte, Calle 45" },
      "SUR-003": { name: "Punto Sur", address: "Zona Sur, Av. Libertad" },
      "MUNICIPAL-004": { name: "Centro Municipal", address: "Plaza Central" },
      "LAGO-005": { name: "Casa, Lago Huechen", address: "Lago Huechen, Zona Residencial" }
    };

    // Buscar coincidencia exacta o similar
    let foundPoint = null;
    let depositId = "";

    for (const [id, point] of Object.entries(recyclingPoints)) {
      if (trimmedText.includes(id) || id.includes(trimmedText)) {
        foundPoint = point;
        depositId = id;
        break;
      }
    }

    if (foundPoint) {
      console.log(`Punto encontrado: ${depositId} - ${foundPoint.name}`);
      onScanResult(depositId, foundPoint);
    } else {
      setError(`No se encontró punto de reciclaje para: ${trimmedText}`);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      handleQRResult(manualInput);
      setManualInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Escanear Código QR</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Estado del detector */}
          {detectionMethod && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              ✓ {detectionMethod}
            </div>
          )}

          {/* Video para escaneo */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-48 bg-gray-100 rounded"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            
            {!isScanning && (
              <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                <FontAwesomeIcon icon={faCamera} className="text-4xl text-gray-400" />
              </div>
            )}
          </div>

          {/* Controles de cámara */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startCamera} className="flex-1">
                <FontAwesomeIcon icon={faCamera} className="mr-2" />
                Activar Cámara
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex-1">
                Detener Cámara
              </Button>
            )}
          </div>

          {/* Entrada manual */}
          <div className="space-y-2">
            <Label htmlFor="manual-input">O ingrese código manualmente:</Label>
            <div className="flex gap-2">
              <Input
                id="manual-input"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Ej: LAGO-005"
                className="flex-1"
              />
              <Button onClick={handleManualSubmit}>
                Buscar
              </Button>
            </div>
          </div>

          {/* Mensajes de error */}
          {error && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Ayuda */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Apunte la cámara al código QR</p>
            <p>• O escriba el código manualmente</p>
            <p>• Códigos válidos: CENTRO-001, NORTE-002, SUR-003, MUNICIPAL-004, LAGO-005</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}