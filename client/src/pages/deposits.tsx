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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Depósito</h1>
        <p className="mt-2 text-gray-600">
          {prefilledLocation 
            ? `Registrando en: ${prefilledLocation.name}` 
            : "Registra nuevos depósitos de botellas en la blockchain"
          }
        </p>
      </div>
      
      {prefilledLocation && (
        <div className="max-w-md mx-auto mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800">✓ Ubicación Pre-seleccionada</h3>
          <p className="text-green-700">{prefilledLocation.name}</p>
          <p className="text-sm text-green-600">{prefilledLocation.address}</p>
        </div>
      )}
      
      <div className="max-w-md mx-auto">
        <DepositForm prefilledLocation={prefilledLocation} />
      </div>
    </div>
  );
}
