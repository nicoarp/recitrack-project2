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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Usa entrada manual.');
      setManualEntry(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setScanning(false);
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
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Escanear con Cámara
                </Button>
                
                <Button 
                  onClick={() => setManualEntry(true)}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Entrada Manual
                </Button>

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
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                  style={{ aspectRatio: '4/3' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <Button 
                  onClick={stopCamera}
                  variant="outline"
                  className="w-full"
                >
                  Cancelar Escaneo
                </Button>
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