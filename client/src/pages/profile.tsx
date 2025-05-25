import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BlockchainProvider } from "@/hooks/use-blockchain";
import { useBlockchain } from "@/hooks/use-blockchain";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function ProfileContent() {
  const { isConnected, account } = useBlockchain();
  const [isEditing, setIsEditing] = useState(false);

  const userProfile = {
    name: "Usuario de EcoTraza",
    email: "usuario@ejemplo.com",
    joinDate: "Sep 2023",
    bottlesRecycled: 158,
    rewards: 45,
    level: "Reciclador Avanzado"
  };

  const userActivity = [
    { date: "25 Sep 2023", event: "Depósito de 12 botellas", location: "Punto Limpio Central" },
    { date: "20 Sep 2023", event: "Depósito de 8 botellas", location: "Punto Limpio Norte" },
    { date: "15 Sep 2023", event: "Depósito de 15 botellas", location: "Centro de Reciclaje Municipal" },
    { date: "10 Sep 2023", event: "Depósito de 10 botellas", location: "Punto Limpio Central" },
    { date: "05 Sep 2023", event: "Depósito de 5 botellas", location: "Punto Limpio Sur" }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://ui-avatars.com/api/?name=Usuario+EcoTraza&background=10B981&color=fff" />
              <AvatarFallback>UT</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
              <p className="text-gray-500">{userProfile.email}</p>
              <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  <FontAwesomeIcon icon="recycle" className="mr-1" /> {userProfile.level}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FontAwesomeIcon icon="calendar" className="mr-1" /> Miembro desde {userProfile.joinDate}
                </span>
              </div>
            </div>
            
            {isConnected && (
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
                <p className="font-medium">Wallet</p>
                <p className="text-gray-600">{account}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Personales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">Botellas Recicladas</p>
                  <p className="text-3xl font-bold text-primary-600">{userProfile.bottlesRecycled}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">Puntos EcoReward</p>
                  <p className="text-3xl font-bold text-secondary-600">{userProfile.rewards}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">Impacto (kg)</p>
                  <p className="text-3xl font-bold text-green-600">11.9</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                      <FontAwesomeIcon icon="bottle-water" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.event}</p>
                      <p className="text-sm text-gray-500">{activity.location} - {activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Información Personal</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                      id="name" 
                      defaultValue={userProfile.name} 
                      disabled={!isEditing} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={userProfile.email} 
                      disabled={!isEditing} 
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <Button className="mt-4 bg-primary-500 hover:bg-primary-600">
                    Guardar Cambios
                  </Button>
                )}
              </form>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Preferencias de Notificaciones</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <input 
                      type="checkbox" 
                      id="email-notifications" 
                      className="toggle" 
                      defaultChecked 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="activity-summary">Resumen de Actividad Semanal</Label>
                    <input 
                      type="checkbox" 
                      id="activity-summary" 
                      className="toggle" 
                      defaultChecked 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-features">Nuevas Funcionalidades</Label>
                    <input 
                      type="checkbox" 
                      id="new-features" 
                      className="toggle" 
                      defaultChecked 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Profile() {
  return (
    <BlockchainProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-2 text-gray-600">Gestiona tu información personal y revisa tu actividad</p>
        </div>
        
        <ProfileContent />
      </div>
    </BlockchainProvider>
  );
}
