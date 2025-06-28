import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QrScanner() {
  const [, setLocation] = useLocation();
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

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
      
      // Esperar a que el video esté listo y reproducir
      videoRef.current.onloadedmetadata = async () => {
        try {
          console.log('📹 Video metadata cargada');
          await videoRef.current?.play();
          console.log('▶️ Video iniciado correctamente');
          
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

  const stopCamera = () => {
    console.log('🛑 Deteniendo cámara...');
    
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('🔇 Track detenido:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
    setError('');
    
    toast({
      title: "Cámara desactivada",
      description: "Escaneo cancelado"
    });
  };

  const handleManualSubmit = () => {
    if (!qrCode.trim()) {
      setError('Ingresa un código QR válido');
      return;
    }
    
    // Validar formato del QR
    if (qrCode.includes('clean-point-')) {
      // Es un QR de punto limpio
      setLocation(`/collection-form?pointId=${qrCode.replace('clean-point-', '')}`);
    } else {
      // Es un QR de lote para validación
      setLocation(`/batch-validation?qrId=${qrCode}`);
    }
  };

  const simulateQrScan = (type: 'clean-point' | 'batch') => {
    if (type === 'clean-point') {
      setLocation('/collection-form?pointId=CENTRO-001');
    } else {
      // Usar uno de los QRs generados anteriormente
      setLocation('/batch-validation?qrId=fe5d495d-2ca8-4b8d-9148-9c859d1ff4cd');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escáner QR - EcoTraza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!scanning && !manualEntry && (
              <div className="space-y-4">
                <Button 
                  onClick={startCamera}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={scanning}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {scanning ? 'Activando cámara...' : 'Escanear con Cámara'}
                </Button>
                
                <Button 
                  onClick={() => setManualEntry(true)}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Entrada Manual
                </Button>
                
                {/* Test button para debugging */}
                <div className="pt-2 border-t">
                  <Button 
                    onClick={() => {
                      console.log('🧪 Test de compatibilidad de cámara');
                      console.log('navigator.mediaDevices:', !!navigator.mediaDevices);
                      console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
                      console.log('videoRef.current:', !!videoRef.current);
                      toast({
                        title: "Test de cámara",
                        description: "Revisa la consola del navegador para detalles"
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    🧪 Test Compatibilidad Cámara
                  </Button>
                </div>

                {/* Botones de demostración */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Demostración:</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => simulateQrScan('clean-point')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Simular QR Punto Limpio
                    </Button>
                    <Button 
                      onClick={() => simulateQrScan('batch')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Simular QR Lote Existente
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {scanning && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto object-cover"
                    style={{ 
                      aspectRatio: '4/3',
                      minHeight: '240px'
                    }}
                    onLoadedMetadata={() => {
                      console.log('📹 Video metadata loaded successfully');
                    }}
                    onPlay={() => {
                      console.log('▶️ Video playing');
                    }}
                    onError={(e) => {
                      console.error('❌ Video error:', e);
                    }}
                  />
                  
                  {/* Overlay para guía de escaneo */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <p className="text-white text-sm bg-black bg-opacity-50 rounded px-2 py-1">
                        Centra el código QR en el marco
                      </p>
                    </div>
                  </div>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={stopCamera}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar Escaneo
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setManualEntry(true);
                      stopCamera();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Entrada Manual
                  </Button>
                </div>
              </div>
            )}

            {manualEntry && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="qrCode">Código QR o ID del Lote</Label>
                  <Input
                    id="qrCode"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Ej: CENTRO-001 o fe5d495d-2ca8..."
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleManualSubmit}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Continuar
                  </Button>
                  <Button 
                    onClick={() => {
                      setManualEntry(false);
                      setQrCode('');
                      setError('');
                    }}
                    variant="outline"
                  >
                    Cancelar
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

        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-blue-900">¿Qué tipo de QR vas a escanear?</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>QR Punto Limpio:</strong> Para iniciar una nueva recolección</p>
                <p><strong>QR de Lote:</strong> Para validar un lote existente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}