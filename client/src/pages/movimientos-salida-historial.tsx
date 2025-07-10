import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface MovimientoSalida {
  id: number;
  fecha: string;
  destino: string;
  tipoResiduo: string;
  peso: number;
  batchId?: number;
  observaciones?: string;
  numeroGuia?: string;
  transportista?: string;
  estado: string;
  creadoPor: number;
  createdAt: string;
  updatedAt: string;
}

const tiposResiduos = [
  { value: "all", label: "Todos los tipos" },
  { value: "PET", label: "PET" },
  { value: "HDPE", label: "HDPE" },
  { value: "LDPE", label: "LDPE" },
  { value: "PP", label: "PP" },
  { value: "PS", label: "PS" },
  { value: "PVC", label: "PVC" },
  { value: "MIXTO", label: "Mixto" },
  { value: "OTRO", label: "Otro" },
];

const estadosMovimiento = [
  { value: "all", label: "Todos los estados" },
  { value: "registrado", label: "Registrado" },
  { value: "en_transito", label: "En Tránsito" },
  { value: "entregado", label: "Entregado" },
];

const getEstadoBadgeColor = (estado: string) => {
  switch (estado) {
    case "registrado":
      return "bg-blue-100 text-blue-800";
    case "en_transito":
      return "bg-yellow-100 text-yellow-800";
    case "entregado":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function MovimientosSalidaHistorial() {
  const { user, isCentroAcopio } = useAuth();
  const [filtros, setFiltros] = useState({
    tipoResiduo: "all",
    estado: "all",
    destino: "",
  });

  const { data: movimientos, isLoading, error } = useQuery({
    queryKey: ["/api/movimientos-salida", filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Solo filtrar por usuario si no es admin
      if (user?.role !== 'admin' && user?.id) {
        params.append('userId', user.id.toString());
      }
      
      if (filtros.estado !== "all") {
        params.append('estado', filtros.estado);
      }
      
      if (filtros.tipoResiduo !== "all") {
        params.append('tipoResiduo', filtros.tipoResiduo);
      }

      const response = await fetch(`/api/movimientos-salida?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar movimientos de salida');
      }
      return response.json() as Promise<MovimientoSalida[]>;
    },
  });

  // Filtrar por destino en el frontend
  const movimientosFiltrados = movimientos?.filter(movimiento => {
    if (filtros.destino && !movimiento.destino.toLowerCase().includes(filtros.destino.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  // Calcular estadísticas
  const estadisticas = {
    total: movimientosFiltrados.length,
    pesoTotal: movimientosFiltrados.reduce((sum, m) => sum + m.peso, 0),
    registrados: movimientosFiltrados.filter(m => m.estado === 'registrado').length,
    enTransito: movimientosFiltrados.filter(m => m.estado === 'en_transito').length,
    entregados: movimientosFiltrados.filter(m => m.estado === 'entregado').length,
  };

  const exportarReporte = () => {
    // Generar CSV simple para descarga
    const headers = ['Fecha', 'Destino', 'Tipo Residuo', 'Peso (kg)', 'Estado', 'Transportista', 'Número Guía'];
    const csvContent = [
      headers.join(','),
      ...movimientosFiltrados.map(m => [
        format(new Date(m.fecha), 'dd/MM/yyyy'),
        m.destino,
        m.tipoResiduo,
        m.peso,
        m.estado,
        m.transportista || '',
        m.numeroGuia || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `movimientos_salida_${format(new Date(), 'yyyy_MM_dd')}.csv`;
    link.click();
  };

  // Verificar permisos
  if (!isCentroAcopio && user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FontAwesomeIcon icon="exclamation-triangle" className="text-6xl text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
            <p className="text-gray-600 text-center">
              Esta funcionalidad está disponible únicamente para centros de acopio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FontAwesomeIcon icon="list" className="mr-3 text-primary-500" />
          Historial de Salidas de Materiales
        </h1>
        <p className="text-gray-600 mt-2">
          Consulta y filtra los movimientos de salida registrados
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{estadisticas.total}</div>
              <div className="text-sm text-gray-500">Total Movimientos</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.pesoTotal.toFixed(1)} kg</div>
              <div className="text-sm text-gray-500">Peso Total</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.registrados}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.enTransito}</div>
              <div className="text-sm text-gray-500">En Tránsito</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.entregados}</div>
              <div className="text-sm text-gray-500">Entregados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de Residuo</Label>
              <Select 
                value={filtros.tipoResiduo} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, tipoResiduo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposResiduos.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado</Label>
              <Select 
                value={filtros.estado} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estadosMovimiento.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Destino</Label>
              <Input
                placeholder="Buscar por destino..."
                value={filtros.destino}
                onChange={(e) => setFiltros(prev => ({ ...prev, destino: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={exportarReporte} variant="outline" className="w-full">
                <FontAwesomeIcon icon="download" className="mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Salida</CardTitle>
          <CardDescription>
            {estadisticas.total} movimientos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <FontAwesomeIcon icon="exclamation-triangle" className="text-4xl text-red-500 mb-4" />
              <p className="text-gray-600">Error al cargar los movimientos de salida</p>
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <FontAwesomeIcon icon="inbox" className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">No se encontraron movimientos de salida</p>
            </div>
          ) : (
            <div className="space-y-4">
              {movimientosFiltrados.map((movimiento) => (
                <div
                  key={movimiento.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{movimiento.destino}</h3>
                        <Badge className={getEstadoBadgeColor(movimiento.estado)}>
                          {movimiento.estado.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {movimiento.tipoResiduo}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                          <FontAwesomeIcon icon="calendar" className="mr-1" />
                          {format(new Date(movimiento.fecha), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div>
                          <FontAwesomeIcon icon="weight-hanging" className="mr-1" />
                          {movimiento.peso} kg
                        </div>
                        {movimiento.numeroGuia && (
                          <div>
                            <FontAwesomeIcon icon="truck" className="mr-1" />
                            Guía: {movimiento.numeroGuia}
                          </div>
                        )}
                      </div>
                      
                      {movimiento.transportista && (
                        <div className="text-sm text-gray-600 mt-1">
                          <FontAwesomeIcon icon="shipping-fast" className="mr-1" />
                          {movimiento.transportista}
                        </div>
                      )}
                      
                      {movimiento.observaciones && (
                        <div className="text-sm text-gray-600 mt-2 italic">
                          "{movimiento.observaciones}"
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 md:mt-0 md:ml-4 flex gap-2">
                      {movimiento.batchId && (
                        <Badge variant="secondary">
                          Lote #{movimiento.batchId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}