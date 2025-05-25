import React from 'react';
import { Link, useLocation } from 'wouter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faRecycle, faHistory, faMapMarkerAlt, faUser } from '@fortawesome/free-solid-svg-icons';

export default function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", label: "Inicio", icon: faHome },
    { path: "/deposits", label: "Depositar", icon: faRecycle },
    { path: "/history", label: "Historial", icon: faHistory },
    { path: "/recycling-points", label: "Puntos", icon: faMapMarkerAlt },
    { path: "/profile", label: "Perfil", icon: faUser },
  ];

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