import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ui/theme-provider";
import { BlockchainProvider } from "./hooks/use-blockchain";
import { TransactionModalProvider } from "./components/ui/transaction-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dashboard from "@/pages/dashboard";
import Deposits from "@/pages/deposits";
import History from "@/pages/history";
import RecyclingPoints from "@/pages/recycling-points";
import Statistics from "@/pages/statistics";
import Profile from "@/pages/profile";
import QRAdmin from "@/pages/qr-admin";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

// Rutas públicas - Accesibles para usuarios anónimos
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/deposit" component={Deposits} />
      <Route path="/deposits" component={Deposits} />
      <Route path="/recycling-points" component={RecyclingPoints} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Rutas autenticadas - Solo para usuarios logueados (futuro)
function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/profile" component={Profile} />
      <Route path="/my-history" component={History} />
      <Route component={PublicRoutes} />
    </Switch>
  );
}

// Rutas de admin - Solo para administradores (futuro)
function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin" component={QRAdmin} />
      <Route path="/qr-admin" component={QRAdmin} />
      <Route path="/admin/statistics" component={Statistics} />
      <Route component={AuthenticatedRoutes} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isAdmin } = useAuth();
  
  return (
    <Switch>
      {/* Rutas públicas para todos */}
      <Route path="/" component={Dashboard} />
      <Route path="/deposits" component={Deposits} />
      <Route path="/deposit" component={Deposits} />
      
      {/* Rutas para usuarios autenticados */}
      {isAuthenticated && (
        <Route path="/history" component={History} />
      )}
      
      {/* Rutas exclusivas para administradores */}
      {isAdmin && (
        <>
          <Route path="/recycling-points" component={RecyclingPoints} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/qr-admin" component={QRAdmin} />
          <Route path="/admin" component={QRAdmin} />
        </>
      )}
      
      {/* Perfil y login siempre disponibles */}
      <Route path="/profile" component={Profile} />
      <Route path="/login" component={Login} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BlockchainProvider>
          <ThemeProvider defaultTheme="light">
            <TransactionModalProvider>
              <TooltipProvider>
                <div className="min-h-screen flex flex-col md:flex-row">
                <Sidebar />
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 md:hidden" 
                    style={{ display: isMobileMenuOpen ? 'block' : 'none' }}
                    onClick={toggleMobileMenu}>
                  <div className="bg-white h-full w-64 shadow-xl transform transition-transform" 
                      onClick={(e) => e.stopPropagation()}>
                    <Sidebar isMobile={true} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <header className="bg-white shadow-md md:hidden p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-500 text-white">
                        <FontAwesomeIcon icon="recycle" className="text-sm" />
                      </div>
                      <h1 className="ml-2 text-lg font-bold text-gray-800">EcoTraza</h1>
                    </div>
                    <button 
                      onClick={toggleMobileMenu} 
                      className="text-gray-600"
                    >
                      <FontAwesomeIcon icon="bars" className="text-xl" />
                    </button>
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                  <MobileNav />
                </div>
              </div>
              <Toaster />
            </TooltipProvider>
          </TransactionModalProvider>
        </ThemeProvider>
      </BlockchainProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;