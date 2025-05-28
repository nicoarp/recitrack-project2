import React, { useState, useRef } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faDownload, faCopy } from "@fortawesome/free-solid-svg-icons";

interface QRGeneratorProps {
  depositId?: string;
  locationName?: string;
}

export function QRGenerator({ depositId = "", locationName = "" }: QRGeneratorProps) {
  const { toast } = useToast();
  const [qrData, setQrData] = useState(depositId);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = async () => {
    if (!qrData.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un ID de depósito válido",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Generar QR con enlace web directo al formulario
      const currentDomain = window.location.origin;
      const qrUrl = `${currentDomain}/deposit?location=${qrData.toUpperCase()}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 500,    // Tamaño más grande para mejor lectura desde pantalla
        margin: 6,     // Más margen para mejor detección
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H', // Alta corrección de errores para mejor detección
        type: 'image/png',
        quality: 0.95,
        rendererOpts: {
          quality: 0.95
        }
      });

      setQrCodeUrl(qrCodeDataUrl);
      
      toast({
        title: "¡QR Generado!",
        description: `Código QR creado para ${qrData.toUpperCase()}`
      });

    } catch (error) {
      console.error('Error generando QR:', error);
      toast({
        title: "Error",
        description: "Error al generar el código QR",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `qr-${qrData.toUpperCase()}.png`;
    link.href = qrCodeUrl;
    link.click();

    toast({
      title: "Descarga iniciada",
      description: "El código QR se está descargando"
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData.toUpperCase());
      toast({
        title: "Copiado",
        description: "ID copiado al portapapeles"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-secondary-500 py-4 px-6">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faQrcode} />
          Generar QR
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depositId" className="text-sm font-medium">
              ID del Punto de Depósito
            </Label>
            <div className="flex gap-2">
              <Input
                id="depositId"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="ej: CENTRO-001"
                className="uppercase"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!qrData.trim()}
              >
                <FontAwesomeIcon icon={faCopy} />
              </Button>
            </div>
            {locationName && (
              <p className="text-sm text-gray-600">
                Ubicación: {locationName}
              </p>
            )}
          </div>

          <Button 
            onClick={generateQR} 
            disabled={isGenerating || !qrData.trim()}
            className="w-full"
          >
            {isGenerating ? "Generando..." : "Generar Código QR"}
          </Button>

          {qrCodeUrl && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR Code para ${qrData}`}
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">
                  {qrData.toUpperCase()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  🔗 Enlace directo al formulario
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={downloadQR}
                  variant="outline"
                  className="flex-1"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Descargar
                </Button>
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1"
                >
                  <FontAwesomeIcon icon={faCopy} className="mr-2" />
                  Copiar ID
                </Button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instrucciones:</strong> Imprime este código QR y colócalo en el punto de depósito. 
                  Los usuarios podrán escanearlo para registrar su reciclaje automáticamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}