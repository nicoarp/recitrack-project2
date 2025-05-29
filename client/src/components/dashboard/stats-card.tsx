import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent } from "@/components/ui/card";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useQuery } from "@tanstack/react-query";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconProp;
  iconBgColor: string;
  iconColor: string;
}

export function StatsCard({ title, value, icon, iconBgColor, iconColor }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`${iconBgColor} rounded-full p-3`}>
            <FontAwesomeIcon icon={icon} className={`${iconColor} text-xl`} />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid() {
  // Obtener estadísticas reales de depósitos
  const { data: depositsData } = useQuery({
    queryKey: ["/api/blockchain/deposit-events"],
    select: (data) => data?.events || []
  });

  // Obtener estadísticas reales de lotes
  const { data: batchesData } = useQuery({
    queryKey: ["/api/blockchain/batch-events"],
    select: (data) => data?.events || []
  });

  // Obtener estadísticas reales de procesos
  const { data: processesData } = useQuery({
    queryKey: ["/api/blockchain/process-events"],
    select: (data) => data?.events || []
  });

  // Obtener estadísticas reales de productos
  const { data: productsData } = useQuery({
    queryKey: ["/api/blockchain/product-events"],
    select: (data) => data?.events || []
  });

  // Obtener puntos de reciclaje reales
  const { data: recyclingPointsData } = useQuery({
    queryKey: ["/api/recycling-points"],
    select: (data) => data || []
  });

  // Calcular estadísticas reales
  const totalBottles = depositsData?.reduce((sum: number, event: any) => sum + (event.quantity || 0), 0) || 0;
  const totalBatches = batchesData?.length || 0;
  const totalProcesses = processesData?.length || 0;
  const totalProducts = productsData?.length || 0;
  const totalRecyclingPoints = recyclingPointsData?.length || 0;

  // Calcular peso estimado (0.025kg por botella PET promedio)
  const estimatedWeight = Math.round(totalBottles * 0.025 * 10) / 10;

  const stats = [
    {
      title: "Botellas Registradas",
      value: totalBottles || "0",
      icon: "bottle-water",
      iconBgColor: "bg-primary-100",
      iconColor: "text-primary-500"
    },
    {
      title: "Lotes Creados",
      value: totalBatches || "0",
      icon: "cubes",
      iconBgColor: "bg-secondary-100",
      iconColor: "text-secondary-500"
    },
    {
      title: "Procesos Completados",
      value: totalProcesses || "0",
      icon: "industry",
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-500"
    },
    {
      title: "Productos Finales",
      value: totalProducts || "0",
      icon: "box",
      iconBgColor: "bg-green-100",
      iconColor: "text-green-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon as IconProp}
          iconBgColor={stat.iconBgColor}
          iconColor={stat.iconColor}
        />
      ))}
    </div>
  );
}
