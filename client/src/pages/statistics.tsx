import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

export default function Statistics() {
  // Obtener datos reales de blockchain
  const { data: depositsData, isLoading: depositsLoading } = useQuery({
    queryKey: ["/api/blockchain/deposit-events"],
    select: (data) => data?.events || []
  });

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ["/api/blockchain/batch-events"],
    select: (data) => data?.events || []
  });

  const { data: processesData, isLoading: processesLoading } = useQuery({
    queryKey: ["/api/blockchain/process-events"],
    select: (data) => data?.events || []
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/blockchain/product-events"],
    select: (data) => data?.events || []
  });

  const isLoading = depositsLoading || batchesLoading || processesLoading || productsLoading;

  // Procesar datos reales para gráficos
  const processLocationData = () => {
    if (!depositsData || depositsData.length === 0) return [];
    
    const locationStats = depositsData.reduce((acc: any, event: any) => {
      const location = event.location || 'Sin ubicación';
      if (!acc[location]) {
        acc[location] = 0;
      }
      acc[location] += event.quantity || 0;
      return acc;
    }, {});

    return Object.entries(locationStats).map(([name, bottles]) => ({
      name,
      bottles
    }));
  };

  const processTimelineData = () => {
    if (!depositsData || depositsData.length === 0) return [];
    
    const timelineStats = depositsData.reduce((acc: any, event: any) => {
      const date = new Date(event.timestamp * 1000);
      const monthKey = date.toLocaleDateString('es-ES', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += event.quantity || 0;
      return acc;
    }, {});

    return Object.entries(timelineStats).map(([name, bottles]) => ({
      name,
      bottles
    }));
  };

  const processTypeData = () => {
    const data = [
      { name: "Depósitos", value: depositsData?.length || 0, color: "#10B981" },
      { name: "Lotes", value: batchesData?.length || 0, color: "#3B82F6" },
      { name: "Procesos", value: processesData?.length || 0, color: "#8B5CF6" },
      { name: "Productos", value: productsData?.length || 0, color: "#EC4899" }
    ].filter(item => item.value > 0);
    
    return data;
  };

  const locationData = processLocationData();
  const timelineData = processTimelineData();
  const typeData = processTypeData();
  
  const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="mt-2 text-gray-600">Cargando datos reales de blockchain...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="mt-2 text-gray-600">Visualiza el impacto de tu contribución al reciclaje</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Registro por Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {locationData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={locationData}
                    margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="bottles" fill="#10B981" name="Botellas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No hay depósitos registrados aún</p>
                  <p className="text-sm text-gray-400">Los datos aparecerán cuando se registren depósitos</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Distribución de Eventos</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {typeData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No hay eventos registrados aún</p>
                  <p className="text-sm text-gray-400">Los datos aparecerán cuando se registren eventos en blockchain</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Tendencia Temporal</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {timelineData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timelineData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bottles" fill="#3B82F6" name="Botellas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No hay suficientes datos temporales</p>
                  <p className="text-sm text-gray-400">Se necesitan múltiples registros para mostrar tendencias</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{depositsData?.length || 0}</p>
                    <p className="text-sm text-green-600">Total Depósitos</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{batchesData?.length || 0}</p>
                    <p className="text-sm text-blue-600">Total Lotes</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{processesData?.length || 0}</p>
                    <p className="text-sm text-purple-600">Total Procesos</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600">{productsData?.length || 0}</p>
                    <p className="text-sm text-pink-600">Total Productos</p>
                  </div>
                </div>
                {(!depositsData || depositsData.length === 0) && (
                  <p className="text-gray-500 text-sm">Los gráficos se mostrarán cuando haya más actividad registrada en blockchain</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
