import React from "react";
import { Link, useLocation } from "wouter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBlockchain } from "@/hooks/use-blockchain";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isMobile?: boolean;
  closeMobileMenu?: () => void;
}

export default function Sidebar({ isMobile = false, closeMobileMenu }: SidebarProps) {
  const [location] = useLocation();
  const { isConnected, connectWallet } = useBlockchain();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  // Menú para usuarios públicos (no autenticados)
  const publicNavItems = [
    { path: "/", label: "Inicio", icon: "home" },
    { path: "/deposits", label: "Registrar Depósito", icon: "bottle-water" },
    { path: "/help", label: "Ayuda", icon: "user-circle" },
  ];

  // Menú para usuarios autenticados normales
  const userNavItems = [
    { path: "/", label: "Inicio", icon: "home" },
    { path: "/deposits", label: "Registrar Depósito", icon: "bottle-water" },
    { path: "/history", label: "Mi Historial", icon: "history" },
    { path: "/help", label: "Ayuda", icon: "user-circle" },
  ];

  // Menú completo para administradores
  const adminNavItems = [
    { path: "/", label: "Dashboard Admin", icon: "home" },
    { path: "/recycling-points", label: "Puntos de Depósito", icon: "map-marker-alt" },
    { path: "/qr-admin", label: "Generador de QR", icon: "square" },
    { path: "/batch-management", label: "Gestión de Lotes", icon: "box" },
    { path: "/process-management", label: "Gestión de Procesos", icon: "cogs" },
    { path: "/traceability", label: "Trazabilidad", icon: "link" },
    { path: "/statistics", label: "Reportes", icon: "chart-line" },
    { path: "/history", label: "Historial Global", icon: "history" },
  ];

  // Seleccionar el menú apropiado según el rol
  const getNavItems = () => {
    if (isAdmin) return adminNavItems;
    if (isAuthenticated) return userNavItems;
    return publicNavItems;
  };

  const navItems = getNavItems();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <aside className={`bg-white shadow-lg ${isMobile ? '' : 'hidden md:flex md:flex-col md:w-64'} border-r border-gray-200`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary-500 text-white">
            <FontAwesomeIcon icon="recycle" className="text-xl" />
          </div>
          <h1 className="ml-3 text-xl font-bold text-gray-800">EcoTraza</h1>
        </div>
      </div>
      
      <nav className="flex-1 pt-4 pb-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                onClick={handleClick}
                className={`flex items-center px-4 py-3 ${
                  location === item.path 
                    ? "text-gray-800 bg-gray-100 border-l-4 border-primary-500" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <FontAwesomeIcon icon={item.icon as any} className="w-6" />
                <span className="ml-2">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Información del usuario si está autenticado */}
        {isAuthenticated && user && (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">{user.name}</p>
            <p className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'Usuario'}</p>
          </div>
        )}
        
        {/* Botón de autenticación */}
        {!isAuthenticated ? (
          <Link href="/login">
            <Button className="w-full bg-primary-500 hover:bg-primary-600">
              <FontAwesomeIcon icon="user-circle" className="mr-2" />
              Iniciar Sesión
            </Button>
          </Link>
        ) : (
          <Button
            onClick={logout}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon="user-circle" className="mr-2" />
            Cerrar Sesión
          </Button>
        )}
        
        {/* Botón de wallet (secundario) */}
        <Button
          id="connect-wallet-sidebar"
          onClick={connectWallet}
          variant="outline"
          className={`w-full ${
            isConnected 
              ? "border-green-500 text-green-600 hover:bg-green-50" 
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FontAwesomeIcon icon={isConnected ? "check-circle" : "wallet"} className="mr-2" />
          <span>{isConnected ? "Wallet Conectada" : "Conectar Wallet"}</span>
        </Button>
      </div>
    </aside>
  );
}
