import React from 'react';
import { Link, useLocation } from 'wouter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faRecycle, faHistory, faQrcode, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/use-auth';

export default function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated, isRecolector, isCentroAcopio, isAdmin } = useAuth();
  
  // Navegación moderna y específica por rol
  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { path: "/", label: "Inicio", icon: faHome },
        { path: "/qr-scanner", label: "Escanear", icon: faQrcode },
        { path: "/help", label: "Ayuda", icon: faUser },
      ];
    }
    
    if (isRecolector) {
      return [
        { path: "/", label: "Inicio", icon: faHome },
        { path: "/qr-scanner", label: "Escanear", icon: faQrcode },
        { path: "/deposits", label: "Depósito", icon: faRecycle },
        { path: "/history", label: "Historial", icon: faHistory },
        { path: "/profile", label: "Perfil", icon: faUser },
      ];
    }
    
    if (isCentroAcopio) {
      return [
        { path: "/", label: "Dashboard", icon: faHome },
        { path: "/qr-scanner", label: "Escanear", icon: faQrcode },
        { path: "/batch-grouping", label: "Lotes", icon: faRecycle },
        { path: "/batch-history", label: "Historial", icon: faHistory },
        { path: "/profile", label: "Perfil", icon: faUser },
      ];
    }
    
    if (isAdmin) {
      return [
        { path: "/", label: "Dashboard", icon: faHome },
        { path: "/qr-scanner", label: "Escanear", icon: faQrcode },
        { path: "/user-management", label: "Usuarios", icon: faRecycle },
        { path: "/statistics", label: "Métricas", icon: faHistory },
        { path: "/profile", label: "Perfil", icon: faUser },
      ];
    }
    
    return [
      { path: "/", label: "Inicio", icon: faHome },
      { path: "/profile", label: "Perfil", icon: faUser },
    ];
  };
  
  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-5">
        {navItems.map((item) => (
          <div key={item.path} className="flex flex-col items-center justify-center py-2">
            <Link 
              href={item.path}
              className={`flex flex-col items-center justify-center ${
                location === item.path 
                  ? "text-primary-500" 
                  : "text-gray-500"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-lg mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}