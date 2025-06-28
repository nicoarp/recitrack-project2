import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, Search } from "lucide-react";

interface QRScannerProps {
  onScanResult: (depositId: string, locationData: any) => void;
  onClose: () => void;
}

export function QRScanner({ onScanResult, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState("");
  const [detectionMethod, setDetectionMethod] = useState("");
  const [cameraStatus, setCameraStatus] = useState("inactive");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  // Inicializar detectores disponibles
  useEffect(() => {
    // Verificar BarcodeDetector nativo
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({ 
          formats: ['qr_code'] 
        });
        setDetectionMethod("BarcodeDetector nativo disponible");
      } catch (err) {
        console.log("BarcodeDetector no se pudo inicializar:", err);
        setDetectionMethod("Detección manual disponible");
      }
    } else {
      setDetectionMethod("Detección manual disponible");
    }

    // Limpiar al desmontar
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    addDebugInfo("🛑 Deteniendo cámara...");
    setIsScanning(false);
    setCameraStatus("stopping");

    // Detener intervalos de escaneo
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Detener stream de cámara
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugInfo(`Track detenido: ${track.kind}`);
      });
      streamRef.current = null;
    }

    // Limpiar video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("inactive");
  };

  const handleQRDetected = (qrText: string, method: string) => {
    addDebugInfo(`QR detectado con ${method}: ${qrText}`);

    // Detener escaneo inmediatamente
    stopCamera();

    // Procesar el resultado del QR
    handleQRResult(qrText);
  };

  const startCamera = async () => {
    try {
      setError("");
      setDebugInfo([]);
      setCameraStatus("requesting");
      addDebugInfo("🎥 Iniciando cámara...");

      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia no soportado");
      }
      addDebugInfo("✅ getUserMedia disponible");

      // Verificar si estamos en HTTPS o localhost
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      addDebugInfo(`🔒 Conexión: ${location.protocol} - ${isSecure ? 'Segura' : 'NO segura'}`);

      if (!isSecure) {
        throw new Error("Se requiere HTTPS para acceder a la cámara");
      }

      // Intentar obtener permisos primero con constraints básicos
      addDebugInfo("🔐 Solicitando permisos...");

      let stream: MediaStream;
      try {
        // Intentar primero con cámara trasera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        addDebugInfo("✅ Cámara trasera obtenida");
      } catch (backCameraError) {
        addDebugInfo("⚠️ Cámara trasera falló, probando frontal...");
        try {
          // Si falla, intentar con cualquier cámara
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          addDebugInfo("✅ Cámara frontal obtenida");
        } catch (anyCameraError) {
          addDebugInfo("❌ No se pudo acceder a ninguna cámara");
          throw anyCameraError;
        }
      }

      addDebugInfo(`📊 Stream: ${stream.getVideoTracks().length} tracks`);
      streamRef.current = stream;
      setCameraStatus("active");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          addDebugInfo("📹 Video metadata cargada");
          videoRef.current?.play().then(() => {
            addDebugInfo("▶️ Video reproduciendo");
            setIsScanning(true);
            // Iniciar detección después de que el video esté reproduciéndose
            setTimeout(() => {
              startDetection();
            }, 500);
          }).catch(err => {
            addDebugInfo(`❌ Error al reproducir: ${err.message}`);
            setError("Error al iniciar la reproducción de video");
          });
        };

        videoRef.current.onerror = (err) => {
          addDebugInfo(`❌ Error en video: ${err}`);
          setError("Error en el elemento de video");
        };
      }
    } catch (err: any) {
      addDebugInfo(`❌ Error: ${err.message}`);
      setCameraStatus("error");

      if (err.name === 'NotAllowedError') {
        setError("❌ Permiso denegado. Permite el acceso a la cámara en la configuración del navegador.");
      } else if (err.name === 'NotFoundError') {
        setError("❌ No se encontró cámara en el dispositivo.");
      } else if (err.name === 'NotReadableError') {
        setError("❌ Cámara en uso por otra aplicación.");
      } else if (err.name === 'OverconstrainedError') {
        setError("❌ Las especificaciones de cámara no son compatibles.");
      } else {
        setError(`❌ Error: ${err.message}`);
      }
      setIsScanning(false);
    }
  };

  const startDetection = () => {
    if (!videoRef.current || !isScanning) {
      addDebugInfo("⚠️ No se puede iniciar detección");
      return;
    }

    addDebugInfo("🔍 Iniciando detección...");

    // Método 1: Intentar con BarcodeDetector nativo
    if (barcodeDetectorRef.current) {
      startBarcodeDetectorScanning();
    } else {
      addDebugInfo("ℹ️ BarcodeDetector no disponible, usar entrada manual");
    }
  };

  const startBarcodeDetectorScanning = () => {
    if (!canvasRef.current) {
      // Crear canvas si no existe
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      addDebugInfo("❌ No se pudo obtener contexto 2D del canvas");
      return;
    }

    addDebugInfo("🔄 Iniciando escaneo con BarcodeDetector...");

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !isScanning || !context) {
        return;
      }

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
          return;
        }

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        const barcodes = await barcodeDetectorRef.current.detect(canvas);
        if (barcodes.length > 0 && isScanning) {
          handleQRDetected(barcodes[0].rawValue, "BarcodeDetector");
        }
      } catch (err) {
        // Error silencioso durante escaneo
      }
    }, 500);
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
      addDebugInfo(`✅ Punto encontrado: ${depositId}`);
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

  const getCameraStatusText = () => {
    switch (cameraStatus) {
      case "requesting": return "Solicitando acceso a cámara...";
      case "active": return "Cámara activa";
      case "stopping": return "Deteniendo cámara...";
      case "error": return "Error en cámara";
      default: return "Cámara inactiva";
    }
  };

  const getCameraStatusColor = () => {
    switch (cameraStatus) {
      case "requesting": return "text-blue-600 bg-blue-50";
      case "active": return "text-green-600 bg-green-50";
      case "stopping": return "text-yellow-600 bg-yellow-50";
      case "error": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Escanear Código QR</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Debug Info */}
          {debugInfo.length > 0 && (
            <div className="text-xs bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
              <div className="font-semibold mb-1">Debug Log:</div>
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-700">{info}</div>
              ))}
            </div>
          )}

          {/* Estado del detector */}
          {detectionMethod && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              ✓ {detectionMethod}
            </div>
          )}

          {/* Estado de la cámara */}
          <div className={`text-sm p-2 rounded ${getCameraStatusColor()}`}>
            📹 {getCameraStatusText()}
          </div>

          {/* Video para escaneo */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-48 bg-gray-100 rounded object-cover"
              style={{ display: isScanning && cameraStatus === 'active' ? 'block' : 'none' }}
              playsInline
              muted
            />

            {(!isScanning || cameraStatus !== 'active') && (
              <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                <Camera size={48} className="text-gray-400" />
              </div>
            )}

            {/* Overlay para mostrar estado de escaneo */}
            {isScanning && (
              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
                {cameraStatus === 'active' ? 'Escaneando QR... Apunte la cámara al código' : 'Preparando cámara...'}
              </div>
            )}
          </div>

          {/* Controles de cámara */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button 
                onClick={startCamera} 
                className="flex-1"
                disabled={cameraStatus === 'requesting'}
              >
                <Camera size={16} className="mr-2" />
                {cameraStatus === 'requesting' ? 'Activando...' : 'Activar Cámara'}
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
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit}>
                <Search size={16} />
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