import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent } from "@/components/ui/card";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

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
  const stats = [
    {
      title: "Botellas Recicladas",
      value: 158,
      icon: "bottle-water",
      iconBgColor: "bg-primary-100",
      iconColor: "text-primary-500"
    },
    {
      title: "Lotes Registrados",
      value: 12,
      icon: "cubes",
      iconBgColor: "bg-secondary-100",
      iconColor: "text-secondary-500"
    },
    {
      title: "Puntos de Reciclaje",
      value: 8,
      icon: "map-marker-alt",
      iconBgColor: "bg-accent-100",
      iconColor: "text-accent-500"
    },
    {
      title: "Impacto Ambiental",
      value: "+25kg",
      icon: "leaf",
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
