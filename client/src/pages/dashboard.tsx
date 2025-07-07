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

  // Si no está autenticado, mostrar página de bienvenida profesional
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Header principal */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-green-600 via-blue-500 to-green-400 bg-clip-text text-transparent drop-shadow-md mb-6">
              Recitrack
            </h1>
            <p className="text-xl text-gray-700 mb-4 max-w-3xl mx-auto">
              Sistema de trazabilidad inteligente para reciclaje de botellas PET con tecnología blockchain
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transforma el reciclaje en una experiencia transparente, segura y verificable
            </p>
          </div>

          {/* Tarjeta de login */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-green-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green-600 text-2xl">♻️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Accede a tu Centro de Control
              </h2>
              <p className="text-gray-600 mb-8">
                Inicia sesión para gestionar tus operaciones de reciclaje
              </p>
              <a href="/login" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg text-lg inline-block transition">
                Iniciar Sesión
              </a>
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">¿No tienes cuenta?</p>
                <a href="/register" className="w-full border border-gray-300 text-gray-700 py-2 px-6 rounded-lg inline-block hover:bg-gray-50 transition">
                  Registrarse
                </a>
              </div>
            </div>
          </div>

          {/* Información de características */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blockchain Seguro</h3>
              <p className="text-gray-600">Trazabilidad inmutable y verificable</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Inteligente</h3>
              <p className="text-gray-600">Seguimiento simplificado por código QR</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Análisis en Tiempo Real</h3>
              <p className="text-gray-600">Métricas e impacto ambiental actualizado</p>
            </div>
          </div>
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
