import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  DashboardRecolector, 
  DashboardCentroAcopio, 
  DashboardAdmin 
} from "@/components/dashboard/role-specific";
import { BlockchainProvider } from "@/hooks/use-blockchain";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se carga la autenticación
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje de acceso
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Requerido
          </h2>
          <p className="text-gray-600 mb-8">
            Inicia sesión para acceder a tu dashboard personalizado.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar dashboard específico según el rol del usuario
  const renderRoleSpecificDashboard = () => {
    switch (user.role) {
      case 'recolector':
        return <DashboardRecolector />;
      
      case 'centro_acopio':
        return <DashboardCentroAcopio />;
      
      case 'admin':
        return <DashboardAdmin />;
      
      default:
        // Fallback para roles no reconocidos
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Rol No Reconocido
              </h2>
              <p className="text-gray-600">
                Tu rol ({user.role}) no está configurado correctamente. 
                Contacta al administrador del sistema.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <BlockchainProvider>
      {renderRoleSpecificDashboard()}
    </BlockchainProvider>
  );
}
