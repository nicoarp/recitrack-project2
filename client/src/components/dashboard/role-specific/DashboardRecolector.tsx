import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Package, History, Leaf, Target } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { StatsGrid } from "@/components/dashboard/stats-card";

export function DashboardRecolector() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* Header con badge de rol */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-600 via-blue-500 to-green-400 bg-clip-text text-transparent drop-shadow-md">
            Recitrack
          </h1>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            <Leaf className="w-4 h-4 mr-1" />
            Recolector
          </Badge>
        </div>
        <p className="text-lg text-gray-700 font-medium">
          ¡Hola {user?.name || user?.email}! Suma tu reciclaje al impacto real.
        </p>
      </div>

      {/* Mensaje motivacional */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                ¡Cada botella cuenta!
              </h3>
              <p className="text-green-700 text-sm">
                Tu compromiso con el reciclaje ayuda a crear un futuro más sustentable. 
                Cada depósito que registras se convierte en impacto medible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas para recolector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/qr-scanner">
          <Button className="w-full h-24 bg-white shadow-md hover:bg-green-50 border border-green-200 transition group">
            <div className="flex flex-col items-center gap-2">
              <QrCode className="h-10 w-10 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold text-green-700">Escanear QR</span>
              <span className="text-xs text-green-600">Punto de reciclaje</span>
            </div>
          </Button>
        </Link>

        <Link href="/collection-form?pointId=CENTRO-001">
          <Button className="w-full h-24 bg-white shadow-md hover:bg-blue-50 border border-blue-200 transition group">
            <div className="flex flex-col items-center gap-2">
              <Package className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold text-blue-700">Registrar Depósito</span>
              <span className="text-xs text-blue-600">Nueva recolección</span>
            </div>
          </Button>
        </Link>

        <Link href="/history">
          <Button className="w-full h-24 bg-white shadow-md hover:bg-gray-50 border border-gray-200 transition group">
            <div className="flex flex-col items-center gap-2">
              <History className="h-10 w-10 text-gray-600 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold text-gray-700">Mi Historial</span>
              <span className="text-xs text-gray-600">Mis depósitos</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Estadísticas personales */}
      <StatsGrid />

      {/* Información sobre proceso seguro */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-lg">🔒</span>
            </div>
            ¿Cómo funciona el registro seguro?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl">1️⃣</span>
              </div>
              <h4 className="font-semibold text-green-800 mb-1">Escanea QR</h4>
              <p className="text-sm text-gray-600">
                Usa tu cámara para escanear el código QR oficial del punto de reciclaje
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl">2️⃣</span>
              </div>
              <h4 className="font-semibold text-blue-800 mb-1">Registra</h4>
              <p className="text-sm text-gray-600">
                Completa el formulario con la cantidad de botellas y toma fotos
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl">3️⃣</span>
              </div>
              <h4 className="font-semibold text-purple-800 mb-1">Confirma</h4>
              <p className="text-sm text-gray-600">
                Tu depósito se registra automáticamente en la blockchain
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}