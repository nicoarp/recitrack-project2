import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, ClipboardCheck, BarChart3, Building2, CheckCircle, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserStatsGridCentroAcopio } from "@/components/dashboard/user-stats-grid";
import { BatchHistory } from "@/components/dashboard/batch-history";
import { DocumentManagement } from "@/components/documents/DocumentManagement";

export function DashboardCentroAcopio() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* Header con badge de rol */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-600 via-blue-500 to-green-400 bg-clip-text text-transparent drop-shadow-md">
            Recitrack
          </h1>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            <Building2 className="w-4 h-4 mr-1" />
            Centro de Acopio
          </Badge>
        </div>
        <p className="text-lg text-gray-700 font-medium">
          ¡Hola {user?.name || user?.email}! Gestiona las operaciones de tu centro de acopio.
        </p>
      </div>

      {/* Navegación por pestañas */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard Operativo
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Gestión de Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8">
          {/* Mensaje de bienvenida */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">
                    Control de Operaciones
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Centraliza los depósitos en lotes eficientes y mantén la trazabilidad completa 
                    de todo el material procesado en tu centro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones principales para centro de acopio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/batch-grouping">
              <Button className="w-full h-24 bg-white shadow-md hover:bg-blue-50 border border-blue-200 transition group">
                <div className="flex flex-col items-center gap-2">
                  <Package className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-blue-700">Crear Lote</span>
                  <span className="text-xs text-blue-600">Agrupar depósitos</span>
                </div>
              </Button>
            </Link>

            <Link href="/batch-validation">
              <Button className="w-full h-24 bg-white shadow-md hover:bg-green-50 border border-green-200 transition group">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-10 w-10 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-green-700">Validar Lote</span>
                  <span className="text-xs text-green-600">Verificar proceso</span>
                </div>
              </Button>
            </Link>

            <Link href="/qr-scanner">
              <Button className="w-full h-24 bg-white shadow-md hover:bg-purple-50 border border-purple-200 transition group">
                <div className="flex flex-col items-center gap-2">
                  <ClipboardCheck className="h-10 w-10 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-purple-700">Escanear QR</span>
                  <span className="text-xs text-purple-600">Validar depósito</span>
                </div>
              </Button>
            </Link>

            <Link href="/history">
              <Button className="w-full h-24 bg-white shadow-md hover:bg-gray-50 border border-gray-200 transition group">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-10 w-10 text-gray-600 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-gray-700">Historial</span>
                  <span className="text-xs text-gray-600">Operaciones</span>
                </div>
              </Button>
            </Link>
          </div>

          {/* Estadísticas específicas del centro */}
          <UserStatsGridCentroAcopio />

          {/* Información operativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Proceso de creación de lotes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  Proceso de Lotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <span className="text-xs font-semibold text-green-700">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Seleccionar Depósitos</p>
                      <p className="text-sm text-gray-600">Agrupa depósitos del mismo centro</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <span className="text-xs font-semibold text-blue-700">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Verificar Peso</p>
                      <p className="text-sm text-gray-600">Ajustar cantidades si es necesario</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                      <span className="text-xs font-semibold text-purple-700">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Registrar Evidencia</p>
                      <p className="text-sm text-gray-600">Fotos y documentación del lote</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historial de lotes recientes */}
            <BatchHistory />
          </div>

          {/* Controles de calidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                Controles de Calidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Validación Automática</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Verificación de ubicación por QR</li>
                    <li>✓ Prevención de duplicados</li>
                    <li>✓ Validación de pesos</li>
                    <li>✓ Registro en blockchain</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Trazabilidad Completa</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✓ Historial de cada depósito</li>
                    <li>✓ Operador responsable</li>
                    <li>✓ Evidencia fotográfica</li>
                    <li>✓ Timestamp inmutable</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}