import { Link, useLocation } from 'wouter';
import { Home, QrCode, History, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Inicio'
  },
  {
    href: '/qr-scanner',
    icon: QrCode,
    label: 'QR'
  },
  {
    href: '/history',
    icon: History,
    label: 'Historial'
  },
  {
    href: '/process-management',
    icon: Package,
    label: 'Lotes'
  }
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <nav className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
          
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