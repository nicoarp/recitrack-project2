import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function FeaturedContent() {
  const featuredItems = [
    {
      title: "Trazabilidad Completa",
      description: "Seguimiento de principio a fin de todo el proceso de reciclaje de botellas PET, con registro inmutable en blockchain.",
      imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
      altText: "Centro de reciclaje con botellas de plástico"
    },
    {
      title: "Tecnología Blockchain",
      description: "Utilizamos la blockchain de Ethereum para garantizar la transparencia y seguridad en cada registro de reciclaje.",
      imageUrl: "https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
      altText: "Concepto de tecnología blockchain"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Conoce Más Sobre Recitrack</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {featuredItems.map((item, index) => (
          <Card key={index} className="overflow-hidden flex flex-col">
            <img 
              src={item.imageUrl} 
              alt={item.altText} 
              className="w-full h-48 object-cover" 
            />
            <CardContent className="p-6 flex-1 flex flex-col">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-4 flex-1">{item.description}</p>
              <a href="#" className="text-secondary-500 font-medium hover:text-secondary-600">
                Leer más <FontAwesomeIcon icon="arrow-right" className="ml-1" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
