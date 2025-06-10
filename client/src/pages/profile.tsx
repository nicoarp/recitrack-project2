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

  // Obtener estadísticas específicas del usuario autenticado
  const { data: userStats = { totalBottles: 0, totalDeposits: 0, environmentalImpact: "0.0" } } = useQuery({
    queryKey: ["/api/user-stats", user?.id, user?.email],
    enabled: isAuthenticated && !!user,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id.toString());
      if (user?.email) params.append('userEmail', user.email);
      
      const response = await fetch(`/api/user-stats?${params}`);
      if (!response.ok) throw new Error('Error fetching user stats');
      return response.json();
    }
  });

  const formattedStats = {
    totalBottles: userStats.totalBottles || 0,
    totalDeposits: userStats.totalDeposits || 0,
    impactKg: userStats.environmentalImpact || "0.0"
  };

  // Si no está autenticado, mostrar mensaje de login
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <FontAwesomeIcon icon="user-circle" className="text-8xl text-gray-300 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Accede a tu perfil personal</h2>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                Crea una cuenta o inicia sesión para ver tus estadísticas de reciclaje, 
                historial de depósitos y logros personales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="bg-primary-500 hover:bg-primary-600 text-lg px-8 py-3"
                  size="lg"
                >
                  <FontAwesomeIcon icon="sign-in-alt" className="mr-2" />
                  Iniciar Sesión
                </Button>
                <Button 
                  onClick={() => window.location.href = '/register'}
                  variant="outline"
                  className="border-primary-500 text-primary-500 hover:bg-primary-50 text-lg px-8 py-3"
                  size="lg"
                >
                  <FontAwesomeIcon icon="user-plus" className="mr-2" />
                  Crear Cuenta
                </Button>
              </div>
              <div className="mt-8 text-sm text-gray-500">
                <p>¿Nuevo en EcoTraza?</p>
                <p>Únete y comienza a rastrear tu impacto ambiental</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card informativa sobre beneficios */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              ¿Por qué crear una cuenta?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <FontAwesomeIcon icon="chart-line" className="text-3xl text-primary-500 mb-3" />
                <h4 className="font-medium mb-2">Estadísticas personales</h4>
                <p className="text-sm text-gray-600">
                  Rastrea tus botellas recicladas y tu impacto ambiental
                </p>
              </div>
              <div className="text-center">
                <FontAwesomeIcon icon="history" className="text-3xl text-secondary-500 mb-3" />
                <h4 className="font-medium mb-2">Historial completo</h4>
                <p className="text-sm text-gray-600">
                  Revisa todos tus depósitos y actividad de reciclaje
                </p>
              </div>
              <div className="text-center">
                <FontAwesomeIcon icon="award" className="text-3xl text-green-500 mb-3" />
                <h4 className="font-medium mb-2">Logros y reconocimientos</h4>
                <p className="text-sm text-gray-600">
                  Gana niveles basados en tu actividad real de reciclaje
                </p>
              </div>
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
                {formattedStats.totalBottles > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    <FontAwesomeIcon icon="recycle" className="mr-1" /> 
                    {formattedStats.totalBottles >= 100 ? 'Reciclador Experto' : 
                     formattedStats.totalBottles >= 50 ? 'Reciclador Avanzado' : 
                     formattedStats.totalBottles >= 10 ? 'Reciclador Activo' : 'Nuevo Reciclador'}
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
                  <p className="text-3xl font-bold text-primary-600">{formattedStats.totalBottles}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">Depósitos Realizados</p>
                  <p className="text-3xl font-bold text-secondary-600">{formattedStats.totalDeposits}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">Impacto (kg)</p>
                  <p className="text-3xl font-bold text-green-600">{formattedStats.impactKg}</p>
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
                {formattedStats.totalDeposits > 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FontAwesomeIcon icon="recycle" className="text-4xl mb-3 text-green-500" />
                    <p className="font-medium">Has realizado {formattedStats.totalDeposits} depósitos</p>
                    <p className="text-sm">Total de {formattedStats.totalBottles} botellas recicladas</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Impacto ambiental: {formattedStats.impactKg} kg de plástico reciclado
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FontAwesomeIcon icon="info-circle" className="text-4xl mb-3" />
                    <p>No tienes actividad de reciclaje registrada.</p>
                    <p className="text-sm mt-1">Realiza tu primer depósito para comenzar a ver tu historial.</p>
                  </div>
                )}
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
                      defaultValue={user?.name || ''} 
                      disabled={!isEditing} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={user?.email || ''} 
                      disabled={!isEditing} 
                    />
                  </div>
                </div>
                
                {user?.walletAddress && (
                  <div className="space-y-2">
                    <Label htmlFor="wallet">Dirección de Wallet</Label>
                    <Input 
                      id="wallet" 
                      value={user.walletAddress}
                      disabled
                      className="font-mono text-sm"
                    />
                  </div>
                )}
                
                {isEditing && (
                  <Button className="mt-4 bg-primary-500 hover:bg-primary-600">
                    Guardar Cambios
                  </Button>
                )}
              </form>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Configuración de Cuenta</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tipo de Usuario</Label>
                      <p className="text-sm text-gray-500">
                        {user?.role === 'admin' ? 'Administrador' : 'Usuario Regular'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Estado de Wallet</Label>
                      <p className="text-sm text-gray-500">
                        {user?.walletAddress ? 'Conectada' : 'No conectada'}
                      </p>
                    </div>
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
