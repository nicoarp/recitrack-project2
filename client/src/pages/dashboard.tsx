import React from "react";
import { WalletStatus } from "@/components/dashboard/wallet-status";
import { StatsGrid } from "@/components/dashboard/stats-card";
import { BatchHistory } from "@/components/dashboard/batch-history";
import { FeaturedContent } from "@/components/dashboard/featured-content";
import { BlockchainProvider } from "@/hooks/use-blockchain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido a EcoTraza!</h1>
        <p className="mt-2 text-gray-600">Tu plataforma de trazabilidad de reciclaje con tecnología blockchain</p>
      </div>
      
      <WalletStatus />
      
      <StatsGrid />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Información de seguridad para registro de depósitos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="bottle-water" className="mr-2 text-primary-500" />
              Registrar Depósito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Registro Seguro con QR
              </h3>
              
              <p className="text-blue-700 text-sm mb-4">
                Para garantizar la trazabilidad, todos los depósitos se registran escaneando el código QR oficial del punto de reciclaje.
              </p>
              
              <div className="text-xs text-blue-600 space-y-1">
                <p>✓ Ubicación verificada automáticamente</p>
                <p>✓ Previene registros fraudulentos</p>
                <p>✓ Mantiene integridad del blockchain</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <BatchHistory />
      </div>
      
      <FeaturedContent />
    </div>
  );
}
