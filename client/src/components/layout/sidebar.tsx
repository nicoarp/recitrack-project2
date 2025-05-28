import React from "react";
import { Link, useLocation } from "wouter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBlockchain } from "@/hooks/use-blockchain";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isMobile?: boolean;
  closeMobileMenu?: () => void;
}

export default function Sidebar({ isMobile = false, closeMobileMenu }: SidebarProps) {
  const [location] = useLocation();
  const { isConnected, connectWallet } = useBlockchain();

  const navItems = [
    { path: "/", label: "Inicio", icon: "home" },
    { path: "/deposits", label: "Registrar Depósito", icon: "bottle-water" },
    { path: "/history", label: "Historial", icon: "history" },
    { path: "/recycling-points", label: "Puntos de Reciclaje", icon: "map-marker-alt" },
    { path: "/qr-admin", label: "Códigos QR", icon: "qrcode" },
    { path: "/statistics", label: "Estadísticas", icon: "chart-line" },
    { path: "/profile", label: "Mi Perfil", icon: "user-circle" },
  ];

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
      
      <div className="p-4 border-t border-gray-200">
        <Button
          id="connect-wallet-sidebar"
          onClick={connectWallet}
          className={`flex items-center justify-center w-full ${
            isConnected 
              ? "bg-green-500 hover:bg-green-600" 
              : "bg-secondary-500 hover:bg-secondary-600"
          }`}
        >
          <FontAwesomeIcon icon={isConnected ? "check-circle" : "wallet"} className="mr-2" />
          <span>{isConnected ? "Wallet Conectada" : "Conectar Wallet"}</span>
        </Button>
      </div>
    </aside>
  );
}
