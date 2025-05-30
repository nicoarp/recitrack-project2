import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function ProfileContent() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Obtener eventos de depósito del usuario autenticado
  const { data: userDeposits = [] } = useQuery({
    queryKey: ["/api/blockchain/deposit-events"],
    enabled: isAuthenticated && !!user,
    select: (data: any) => {
      if (!data?.events || !user?.walletAddress) return [];
      return data.events.filter((event: any) => 
        event.actor.toLowerCase() === user.walletAddress.toLowerCase()
      );
    }
  });

  // Calcular estadísticas reales del usuario
  const userStats = {
    totalBottles: userDeposits.reduce((sum: number, event: any) => sum + event.quantity, 0),
    totalDeposits: userDeposits.length,
    impactKg: Math.round(userDeposits.reduce((sum: number, event: any) => sum + event.quantity, 0) * 0.025 * 10) / 10
  };

  // Si no está autenticado, mostrar mensaje de login
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FontAwesomeIcon icon="user-circle" className="text-6xl text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión para ver tu perfil</h2>
              <p className="text-gray-600 mb-6">
                Para acceder a tus estadísticas personales y historial de reciclaje, 
                necesitas iniciar sesión en tu cuenta.
              </p>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-primary-500 hover:bg-primary-600"
              >
                Iniciar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Usuario')}&background=10B981&color=fff`} />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Usuario'}</h2>
              <p className="text-gray-500">{user?.email || 'Sin email'}</p>
              <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start">
                {userStats.totalBottles > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    <FontAwesomeIcon icon="recycle" className="mr-1" /> 
                    {userStats.totalBottles >= 100 ? 'Reciclador Experto' : 
                     userStats.totalBottles >= 50 ? 'Reciclador Avanzado' : 
                     userStats.totalBottles >= 10 ? 'Reciclador Activo' : 'Nuevo Reciclador'}
                  </span>
                )}
                {user?.walletAddress && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FontAwesomeIcon icon="wallet" className="mr-1" /> Wallet conectada
                  </span>
                )}
              </div>
            </div>
            
            {user?.walletAddress && (
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
                <p className="font-medium">Wallet</p>
                <p className="text-gray-600 font-mono text-xs">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </p>
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
                  <p className="text-3xl font-bold text-primary-600">{userStats.totalBottles}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">Depósitos Realizados</p>
                  <p className="text-3xl font-bold text-secondary-600">{userStats.totalDeposits}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">Impacto (kg)</p>
                  <p className="text-3xl font-bold text-green-600">{userStats.impactKg}</p>
                </div>
              </div>
              
              {userStats.totalBottles === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon="info-circle" className="text-4xl mb-3" />
                  <p>No tienes eventos de reciclaje registrados aún.</p>
                  <p className="text-sm mt-1">¡Realiza tu primer depósito para ver tus estadísticas!</p>
                </div>
              )}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-2 text-gray-600">Gestiona tu información personal y revisa tu actividad</p>
      </div>
      
      <ProfileContent />
    </div>
  );
}
