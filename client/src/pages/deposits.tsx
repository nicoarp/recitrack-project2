import React, { useEffect, useState } from "react";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { BlockchainProvider } from "@/hooks/use-blockchain";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Deposits() {
  const [location] = useLocation();
  const [prefilledLocation, setPrefilledLocation] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Detectar parámetros de URL para auto-completar desde QR
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    
    if (locationParam) {
      // Mapear códigos QR a ubicaciones
      const recyclingPoints = {
        "CENTRO-001": { name: "Centro de Reciclaje Principal", address: "Av. Principal 123" },
        "NORTE-002": { name: "Punto Norte", address: "Barrio Norte, Calle 45" },
        "SUR-003": { name: "Punto Sur", address: "Zona Sur, Av. Libertad" },
        "MUNICIPAL-004": { name: "Centro Municipal", address: "Plaza Central" },
        "LAGO-005": { name: "Casa, Lago Huechen", address: "Lago Huechen, Zona Residencial" }
      };

      const foundLocation = recyclingPoints[locationParam as keyof typeof recyclingPoints];
      
      if (foundLocation) {
        setPrefilledLocation({
          depositId: locationParam,
          ...foundLocation
        });
        
        toast({
          title: "Ubicación detectada",
          description: `${foundLocation.name} - ${foundLocation.address}`,
        });
      }
    }
  }, [location, toast]);

  // Si no hay ubicación pre-cargada desde QR, mostrar mensaje de seguridad
  if (!prefilledLocation) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="max-w-md mx-auto">
          <div className="text-center p-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-yellow-800 mb-3">
              Acceso Restringido
            </h2>
            
            <p className="text-yellow-700 mb-4">
              Para registrar un depósito, debe escanear el código QR del punto de reciclaje oficial.
            </p>
            
            <div className="text-sm text-yellow-600 mb-6">
              <p className="mb-2">✅ Garantiza trazabilidad completa</p>
              <p className="mb-2">✅ Evita registros en ubicaciones incorrectas</p>
              <p>✅ Mantiene integridad del sistema</p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-yellow-800">
                Para registrar un depósito:
              </p>
              <ol className="text-sm text-yellow-700 text-left space-y-1">
                <li>1. Busque el código QR en el punto de reciclaje</li>
                <li>2. Escanee con la cámara de su teléfono</li>
                <li>3. Se abrirá automáticamente este formulario</li>
                <li>4. Complete la cantidad de botellas</li>
              </ol>
            </div>
            
            <div className="mt-6 p-3 bg-white border border-yellow-300 rounded">
              <p className="text-xs text-yellow-600">
                <strong>Administradores:</strong> Contacte al equipo técnico para acceso especial
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Depósito</h1>
        <p className="mt-2 text-gray-600">
          Registrando en: {prefilledLocation.name}
        </p>
      </div>
      
      <div className="max-w-md mx-auto mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800">✓ Ubicación Verificada desde QR</h3>
        <p className="text-green-700">{prefilledLocation.name}</p>
        <p className="text-sm text-green-600">{prefilledLocation.address}</p>
        <p className="text-xs text-green-500 mt-1">🔐 Acceso autorizado</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <DepositForm prefilledLocation={prefilledLocation} />
      </div>
    </div>
  );
}
