import { Link, useLocation } from 'wouter';
import { Home, QrCode, History, Package, Settings, Users, BarChart3, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated, isRecolector, isCentroAcopio, isAdmin } = useAuth();

  // Seleccionar items según el rol
  const getNavItems = () => {
    if (!isAuthenticated) return [
      { href: '/', icon: Home, label: 'Inicio' },
      { href: '/qr-scanner', icon: QrCode, label: 'QR' }
    ];

    if (isRecolector) return [
      { href: '/', icon: Home, label: 'Inicio' },
      { href: '/qr-scanner', icon: QrCode, label: 'QR' },
      { href: '/deposits', icon: Package, label: 'Depósito' },
      { href: '/history', icon: History, label: 'Historial' }
    ];

    if (isCentroAcopio) return [
      { href: '/', icon: Home, label: 'Inicio' },
      { href: '/qr-scanner', icon: QrCode, label: 'QR' },
      { href: '/batch-grouping', icon: Package, label: 'Lotes' },
      { href: '/batch-history', icon: History, label: 'Historial' }
    ];

    if (isAdmin) return [
      { href: '/', icon: Home, label: 'Inicio' },
      { href: '/qr-scanner', icon: QrCode, label: 'QR' },
      { href: '/batch-grouping', icon: Package, label: 'Lotes' },
      { href: '/user-management', icon: Users, label: 'Usuarios' },
      { href: '/statistics', icon: BarChart3, label: 'Métricas' }
    ];

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <nav className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0",
                isActive 
                  ? "text-green-600 bg-green-50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}