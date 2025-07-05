import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  Package, 
  ClipboardCheck, 
  QrCode,
  Database,
  TrendingUp,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { StatsGrid } from "@/components/dashboard/stats-card";
import { BatchHistory } from "@/components/dashboard/batch-history";
import { WalletStatus } from "@/components/dashboard/wallet-status";

export function DashboardAdmin() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* Header con badge de rol */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-600 via-blue-500 to-green-400 bg-clip-text text-transparent drop-shadow-md">
            Recitrack
          </h1>
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
            <Shield className="w-4 h-4 mr-1" />
            Administrador
          </Badge>
        </div>
        <p className="text-lg text-gray-700 font-medium">
          ¡Hola {user?.name || user?.email}! Panel de control administrativo del sistema.
        </p>
      </div>

      {/* Mensaje de bienvenida */}
      <Card className="mb-8 bg-gradient-to-r from-red-50 to-blue-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Database className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Control Total del Sistema
              </h3>
              <p className="text-red-700 text-sm">
                Supervisa todas las operaciones, gestiona usuarios, y mantén la integridad 
                del sistema de trazabilidad. Acceso completo a métricas y configuraciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones administrativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/user-management">
          <Button className="w-full h-24 bg-white shadow-md hover:bg-red-50 border border-red-200 transition group">
            <div className="flex flex-col items-center gap-2">
              <Users className="h-10 w-10 text-red-600 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold text-red-700">Usuarios</span>
              <span className="text-xs text-red-600">Gestionar roles</span>
            </div>
          </Button>
        </Link>

        <Link href="/analytics">
          <Button className="w-full h-24 bg-white shadow-md hover:bg-blue-50 border border-blue-200 transition group">
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold text-blue-700">Métricas</span>
              <span className="text-xs text-blue-600">Analytics</span>
            </div>
          </Button>
        </Link>

        <Link href="/system-settings">
          <Button className="w-full h-24 bg-white shadow-md hover:bg-purple-50 border border-purple-200 transition group">
            <div className="flex flex-col items-center gap-2">
              <Settings className="h-10 w-10 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold text-purple-700">Configuración</span>
              <span className="text-xs text-purple-600">Sistema</span>
            </div>
          </Button>
        </Link>

        <Link href="/blockchain-status">
          <Button className="w-full h-24 bg-white shadow-md hover:bg-green-50 border border-green-200 transition group">
            <div className="flex flex-col items-center gap-2">
              <Globe className="h-10 w-10 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold text-green-700">Blockchain</span>
              <span className="text-xs text-green-600">Estado</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Acciones operativas (también disponibles para admin) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
            Acciones Operativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/batch-grouping">
              <Button variant="outline" className="w-full h-16 hover:bg-blue-50 border-blue-200">
                <div className="flex flex-col items-center gap-1">
                  <Package className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Crear Lote</span>
                </div>
              </Button>
            </Link>

            <Link href="/batch-validation">
              <Button variant="outline" className="w-full h-16 hover:bg-green-50 border-green-200">
                <div className="flex flex-col items-center gap-1">
                  <ClipboardCheck className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Validar Lote</span>
                </div>
              </Button>
            </Link>

            <Link href="/qr-scanner">
              <Button variant="outline" className="w-full h-16 hover:bg-purple-50 border-purple-200">
                <div className="flex flex-col items-center gap-1">
                  <QrCode className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">Escanear QR</span>
                </div>
              </Button>
            </Link>

            <Link href="/history">
              <Button variant="outline" className="w-full h-16 hover:bg-gray-50 border-gray-200">
                <div className="flex flex-col items-center gap-1">
                  <Database className="h-6 w-6 text-gray-600" />
                  <span className="text-sm font-medium">Historial</span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Estado del sistema */}
      <WalletStatus />

      {/* Estadísticas globales */}
      <StatsGrid />

      {/* Información del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Estado del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Blockchain</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Conectado
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Base de Datos</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Activo
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Usuarios Activos</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  3 roles
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Operaciones</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  En funcionamiento
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial de lotes */}
        <BatchHistory />
      </div>

      {/* Controles administrativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <Settings className="h-5 w-5 text-red-600" />
            </div>
            Controles Administrativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Gestión de Usuarios</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Crear/editar usuarios</li>
                <li>• Asignar roles</li>
                <li>• Control de acceso</li>
                <li>• Historial de actividad</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Monitoreo</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Métricas en tiempo real</li>
                <li>• Alertas del sistema</li>
                <li>• Reportes automáticos</li>
                <li>• Análisis de tendencias</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Configuración</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Parámetros del sistema</li>
                <li>• Configuración blockchain</li>
                <li>• Backup y restauración</li>
                <li>• Actualizaciones</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}