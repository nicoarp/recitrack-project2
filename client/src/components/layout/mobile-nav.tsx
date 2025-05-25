import React from "react";
import { Link, useLocation } from "wouter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Inicio", icon: "home" },
    { path: "/deposits", label: "Depósito", icon: "bottle-water" },
    { path: "/history", label: "Historial", icon: "history" },
    { path: "/recycling-points", label: "Puntos", icon: "map-marker-alt" },
    { path: "/profile", label: "Perfil", icon: "user-circle" },
  ];

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <Link href={item.path} key={item.path}>
            <a className={`flex flex-col items-center justify-center ${
              location === item.path ? "text-primary-500" : "text-gray-500"
            }`}>
              <FontAwesomeIcon icon={item.icon as any} className="text-lg" />
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
