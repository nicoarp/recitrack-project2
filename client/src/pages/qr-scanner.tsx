import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrowserQRCodeReader } from '@zxing/browser';

export default function QrScanner() {
  const [, setLocation] = useLocation();
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Función para detectar códigos QR en el video
  const detectQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !codeReaderRef.current) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar frame actual del video en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Intentar detectar QR del frame actual
      const result = await codeReaderRef.current.decodeFromCanvas(canvas);
      
      if (result && result.getText()) {
        const detectedCode = result.getText();
        console.log('🎯 QR detectado:', detectedCode);
        
        // Detener el escaneo
        stopCamera();
        
        // Procesar el código QR
        handleQRDetected(detectedCode);
      }
    } catch (error: any) {
      // Errores normales durante el escaneo (no encontrado) - ignorar
      if (error?.name !== 'NotFoundException') {
        console.warn('⚠️ Error en detección QR:', error);
      }
    }
  };

  // Función para manejar QR detectado
  const handleQRDetected = (detectedCode: string) => {
    console.log('✅ Procesando código QR:', detectedCode);
    setQrCode(detectedCode);
    
    toast({
      title: "¡Código QR detectado!",
      description: `Código: ${detectedCode}`,
    });

    // Redirigir según el tipo de QR
    if (detectedCode.includes('CENTRO-') || detectedCode.includes('PUNTO-')) {
      // QR de punto de reciclaje - ir al formulario de recolección
      setLocation(`/collection-form?pointId=${detectedCode}`);
    } else if (detectedCode.startsWith('QR-')) {
      // QR de validación - ir al formulario de validación
      setLocation(`/batch-validation?qrId=${detectedCode}`);
    } else {
      // QR desconocido - mostrar entrada manual
      setManualEntry(true);
      setError('Código QR no reconocido. Usa entrada manual.');
    }
  };

  // Función para detener la cámara y limpiar recursos
  const stopCamera = () => {
    console.log('🛑 Deteniendo cámara...');
    
    // Detener detección automática
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
      console.log('⏹️ Detección QR detenida');
    }
    
    // Detener stream de video
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('📹 Track de cámara detenido');
      });
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  const startCamera = async () => {
    try {
      setError('');
      console.log('🔍 Iniciando cámara...');
      
      // Verificar compatibilidad
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia no soportado');
      }

      // Configuraciones de video más compatibles
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      console.log('📷 Solicitando permisos de cámara...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Stream obtenido:', stream);
      
      // Activar estado de escaneo primero para mostrar el video
      setScanning(true);
      
      // Esperar a que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar que la referencia del video existe después del render
      if (!videoRef.current) {
        console.error('❌ videoRef.current es null después del render');
        throw new Error('No se pudo acceder al elemento video');
      }
      
      console.log('📹 Asignando stream al video element');
      videoRef.current.srcObject = stream;
      
      // Inicializar el lector QR
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
        console.log('🔍 Lector QR inicializado');
      }
      
      // Esperar a que el video esté listo y reproducir
      videoRef.current.onloadedmetadata = async () => {
        try {
          console.log('📹 Video metadata cargada');
          await videoRef.current?.play();
          console.log('▶️ Video iniciado correctamente');
          
          // Iniciar detección automática cada 500ms
          scanningIntervalRef.current = setInterval(() => {
            detectQRCode();
          }, 500);
          
          console.log('🎯 Detección QR activada cada 500ms');
          
          toast({
            title: "Cámara activada",
            description: "Apunta hacia el código QR para escanearlo"
          });
        } catch (playError) {
          console.warn('⚠️ Error en autoplay:', playError);
          toast({
            title: "Cámara activada",
            description: "Toca la pantalla para iniciar el video"
          });
        }
      };
      
    } catch (err: any) {
      console.error('❌ Error cámara:', err);
      
      let errorMessage = 'No se pudo acceder a la cámara.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Permite el acceso y recarga la página.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró cámara. Usa entrada manual.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Cámara no soportada en este navegador.';
      }
      
      setError(errorMessage);
      setManualEntry(true);
      setScanning(false);
      
      toast({
        title: "Error de cámara",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleManualSubmit = () => {
    if (!qrCode.trim()) {
      setError('Ingresa un código QR válido');
      return;
    }
    
    // Validar formato del QR
    if (qrCode.includes('CENTRO-') || qrCode.includes('PUNTO-')) {
      // Es un QR de punto de reciclaje
      setLocation(`/collection-form?pointId=${qrCode}`);
    } else if (qrCode.startsWith('QR-')) {
      // Es un QR de validación
      setLocation(`/batch-validation?qrId=${qrCode}`);
    } else {
      setError('Formato de QR no reconocido');
    }
  };

  const simulateQrScan = (type: 'clean-point' | 'batch') => {
    if (type === 'clean-point') {
      setLocation('/collection-form?pointId=CENTRO-001');
    } else {
      setLocation('/batch-validation?qrId=QR-12345');
    }
  };

  // Limpiar recursos al desmontar el componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escáner QR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!scanning && !manualEntry && (
            <div className="space-y-3">
              <Button 
                onClick={startCamera} 
                className="w-full"
                size="lg"
              >
                <Camera className="mr-2 h-4 w-4" />
                Escanear con Cámara
              </Button>
              
              <Button 
                onClick={() => setManualEntry(true)} 
                variant="outline" 
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Entrada Manual
              </Button>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Pruebas rápidas:
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => simulateQrScan('clean-point')} 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                  >
                    Punto Limpio
                  </Button>
                  <Button 
                    onClick={() => simulateQrScan('batch')} 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                  >
                    Validación
                  </Button>
                </div>
              </div>
            </div>
          )}

          {scanning && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-400 rounded-lg shadow-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={stopCamera} 
                variant="destructive" 
                className="w-full"
              >
                Cancelar Escaneo
              </Button>
            </div>
          )}

          {manualEntry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qrInput">Código QR</Label>
                <Input
                  id="qrInput"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Ej: CENTRO-001 o QR-12345"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleManualSubmit} 
                  className="flex-1"
                  disabled={!qrCode.trim()}
                >
                  Procesar
                </Button>
                <Button 
                  onClick={() => setManualEntry(false)} 
                  variant="outline"
                >
                  Volver
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canvas oculto para detección QR */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
}