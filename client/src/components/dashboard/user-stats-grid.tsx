/**
 * UserStatsGrid - Estadísticas filtradas POR USUARIO específico
 * 
 * Este componente muestra SOLO las estadísticas del usuario autenticado,
 * no datos globales del sistema. Cada usuario ve únicamente sus propios datos.
 */

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent } from "@/components/ui/card";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconProp;
  iconBgColor: string;
  iconColor: string;
}

function StatsCard({ title, value, icon, iconBgColor, iconColor }: StatsCardProps) {
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

/**
 * Estadísticas específicas para usuario Recolector
 * Muestra solo datos del usuario logueado
 */
export function UserStatsGridRecolector() {
  const { user } = useAuth();

  // Obtener estadísticas reales del usuario actual desde PostgreSQL
  const { data: userStats } = useQuery({
    queryKey: ["/api/user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalBottles: 0, totalDeposits: 0, totalWeight: 0 };
      
      const response = await fetch('/api/user-stats', {
        headers: {
          'X-User-Id': user.id.toString(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error("Error obteniendo stats de usuario:", response.status);
        return { totalBottles: 0, totalDeposits: 0, totalWeight: 0 };
      }
      
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
  });

  const stats = [
    {
      title: "Mis Botellas Recicladas",
      value: userStats?.totalBottles || 0,
      icon: "bottle-water",
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Mis Depósitos Realizados",
      value: userStats?.totalDeposits || 0,
      icon: "box",
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Mi Impacto (kg)",
      value: userStats?.totalWeight ? Number(userStats.totalWeight).toFixed(2) : "0.00",
      icon: "leaf",
      iconBgColor: "bg-green-100",
      iconColor: "text-green-500"
    },
    {
      title: "Mi Contribución CO₂",
      value: userStats?.totalWeight ? `${(userStats.totalWeight * 1.8).toFixed(1)} kg` : "0.0 kg",
      icon: "cloud",
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-500"
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

/**
 * Estadísticas específicas para usuario Centro de Acopio
 * Muestra solo lotes y operaciones del centro asignado al usuario
 */
export function UserStatsGridCentroAcopio() {
  const { user } = useAuth();

  // Para centros de acopio, mostrar estadísticas específicas de su centro
  const { data: centerStats } = useQuery({
    queryKey: ["/api/center-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { batchesCreated: 0, depositsProcessed: 0, totalWeight: 0 };
      
      // TODO: Implementar endpoint específico para estadísticas de centro
      // Por ahora, mostrar 0 para datos reales
      return { batchesCreated: 0, depositsProcessed: 0, totalWeight: 0 };
    },
    enabled: !!user?.id,
  });

  const stats = [
    {
      title: "Mis Lotes Creados",
      value: centerStats?.batchesCreated || 0,
      icon: "cubes",
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Depósitos Procesados",
      value: centerStats?.depositsProcessed || 0,
      icon: "industry",
      iconBgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Peso Total Procesado",
      value: centerStats?.totalWeight ? `${centerStats.totalWeight.toFixed(2)} kg` : "0.00 kg",
      icon: "weight-hanging",
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Estado Centro",
      value: "Activo",
      icon: "check-circle",
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

/**
 * Estadísticas específicas para usuario Administrador
 * Puede ver estadísticas globales pero claramente identificadas
 */
export function UserStatsGridAdmin() {
  // Los administradores pueden ver estadísticas globales, pero claramente etiquetadas
  const { data: globalStats } = useQuery({
    queryKey: ["/api/stats"],
    staleTime: 60 * 1000, // 1 minuto
  });

  const stats = [
    {
      title: "Total Botellas (Sistema)",
      value: globalStats?.totalBottles || 0,
      icon: "bottle-water",
      iconBgColor: "bg-red-100",
      iconColor: "text-red-600"
    },
    {
      title: "Total Lotes (Sistema)",
      value: globalStats?.totalBatches || 0,
      icon: "cubes",
      iconBgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "Puntos Reciclaje",
      value: globalStats?.totalPoints || 0,
      icon: "map-marker-alt",
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Impacto Global (kg)",
      value: globalStats?.environmentalImpact || "0.0",
      icon: "globe",
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600"
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