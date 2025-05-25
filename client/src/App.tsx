import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Using our custom ThemeProvider
import { ThemeProvider } from "./components/ui/theme-provider";
// Ensure blockchain functionality works with MetaMask
import { BlockchainProvider } from "./hooks/use-blockchain";
// Import the TransactionModalProvider for blockchain transactions
import { TransactionModalProvider } from "./components/ui/transaction-modal";
import Dashboard from "@/pages/dashboard";
import Deposits from "@/pages/deposits";
import History from "@/pages/history";
import RecyclingPoints from "@/pages/recycling-points";
import Statistics from "@/pages/statistics";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import TransactionModal from "@/components/ui/transaction-modal";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/deposits" component={Deposits} />
      <Route path="/history" component={History} />
      <Route path="/recycling-points" component={RecyclingPoints} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/profile" component={Profile} />
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
      <BlockchainProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <TransactionModalProvider>
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
                        <i className="fas fa-recycle text-sm"></i>
                      </div>
                      <h1 className="ml-2 text-lg font-bold text-gray-800">EcoTraza</h1>
                    </div>
                    <button 
                      onClick={toggleMobileMenu} 
                      className="text-gray-600"
                    >
                      <i className="fas fa-bars text-xl"></i>
                    </button>
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                  <MobileNav />
                </div>
              </div>
              <Toaster />
            </TransactionModalProvider>
          </TooltipProvider>
        </ThemeProvider>
      </BlockchainProvider>
    </QueryClientProvider>
  );
}

export default App;
