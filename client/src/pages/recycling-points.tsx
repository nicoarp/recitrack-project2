import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function RecyclingPoints() {
  const recyclingPoints = [
    {
      id: 1,
      name: "Punto Limpio Central",
      address: "Av. Principal 123, Centro",
      hours: "Lun-Vie: 9:00-18:00, Sáb: 10:00-14:00",
      acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio"]
    },
    {
      id: 2,
      name: "Punto Limpio Norte",
      address: "Calle Norte 456, Zona Norte",
      hours: "Lun-Vie: 8:00-17:00, Sáb: 9:00-13:00",
      acceptedItems: ["Botellas PET", "Plásticos", "Latas", "Vidrio"]
    },
    {
      id: 3,
      name: "Punto Limpio Sur",
      address: "Av. Sur 789, Zona Sur",
      hours: "Lun-Vie: 9:00-18:00, Sáb: 10:00-15:00",
      acceptedItems: ["Botellas PET", "Electrónicos", "Papel", "Vidrio"]
    },
    {
      id: 4,
      name: "Centro de Reciclaje Municipal",
      address: "Carretera Principal Km 5, Afueras",
      hours: "Lun-Dom: 8:00-20:00",
      acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio", "Metales", "Electrónicos"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Puntos de Reciclaje</h1>
        <p className="mt-2 text-gray-600">Encuentra los puntos de reciclaje más cercanos para depositar tus botellas</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recyclingPoints.map(point => (
          <Card key={point.id}>
            <CardHeader className="bg-primary-50 pb-2">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                <FontAwesomeIcon icon="map-marker-alt" className="text-primary-500 mr-2" />
                {point.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  <span className="font-medium">Dirección: </span>
                  {point.address}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Horario: </span>
                  {point.hours}
                </p>
                <div>
                  <p className="font-medium text-gray-700">Materiales aceptados:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {point.acceptedItems.map((item, index) => (
                      <span 
                        key={index} 
                        className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <a href="#" className="text-secondary-500 hover:text-secondary-600 font-medium text-sm">
                    Ver en mapa <FontAwesomeIcon icon="arrow-right" className="ml-1" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
