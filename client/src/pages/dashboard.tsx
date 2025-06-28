import React from "react";
import { Link } from "wouter";
import { WalletStatus } from "@/components/dashboard/wallet-status";
import { StatsGrid } from "@/components/dashboard/stats-card";
import { BatchHistory } from "@/components/dashboard/batch-history";
import { FeaturedContent } from "@/components/dashboard/featured-content";
import { BlockchainProvider } from "@/hooks/use-blockchain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Scan, Package } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido a EcoTraza!</h1>
        <p className="mt-2 text-gray-600">Tu plataforma de trazabilidad de reciclaje con tecnología blockchain</p>
      </div>

      {/* Accesos Rápidos QR */}
      <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <QrCode className="h-5 w-5" />
            Accesos Rápidos - Sistema QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/qr-scanner">
              <Button className="w-full h-16 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                <Scan className="h-6 w-6" />
                <span>Escanear QR</span>
              </Button>
            </Link>
            
            <Link href="/enhanced-validation">
              <Button className="w-full h-16 flex flex-col gap-2 bg-green-600 hover:bg-green-700">
                <Package className="h-6 w-6" />
                <span>Validación Fortalecida</span>
              </Button>
            </Link>
            
            <Link href="/batch-validation">
              <Button className="w-full h-16 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700">
                <FontAwesomeIcon icon="clipboard-check" className="h-6 w-6" />
                <span>Validación Estándar</span>
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-600 mt-3 text-center">
            • Validación Fortalecida: Con campos obligatorios, RUT chileno y control de peso
            • Validación Estándar: Proceso básico de validación
          </p>
        </CardContent>
      </Card>
      
      {/* Quick Access QR Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/qr-scanner">
          <Button className="w-full h-16 bg-green-600 hover:bg-green-700 text-white">
            <div className="flex flex-col items-center gap-1">
              <QrCode className="h-6 w-6" />
              <span className="text-sm font-medium">Escanear QR</span>
            </div>
          </Button>
        </Link>
        
        <Link href="/collection-form?pointId=CENTRO-001">
          <Button variant="outline" className="w-full h-16 border-green-200 hover:bg-green-50">
            <div className="flex flex-col items-center gap-1">
              <Package className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-green-700">Nueva Recolección</span>
            </div>
          </Button>
        </Link>
        
        <Link href="/history">
          <Button variant="outline" className="w-full h-16 border-blue-200 hover:bg-blue-50">
            <div className="flex flex-col items-center gap-1">
              <Scan className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Ver Historial</span>
            </div>
          </Button>
        </Link>
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
