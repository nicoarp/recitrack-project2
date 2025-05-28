import React, { createContext, useContext, useState, useEffect } from 'react';

// Estructura preparada para autenticación futura
interface AuthUser {
  id: number;
  email?: string;
  name?: string;
  walletAddress?: string;
  role: 'user' | 'admin';
  totalDeposits: number;
  totalBottles: number;
}

interface AuthContextType {
  // Estado actual
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Métodos preparados para implementación futura
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithWallet: (walletAddress: string) => Promise<void>;
  logout: () => void;
  
  // Permisos
  isAdmin: boolean;
  canAccessAdminPanel: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Por ahora, mantener como usuario anónimo para el MVP
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const canAccessAdminPanel = isAdmin; // En el futuro, agregar más lógica

  // Funciones preparadas para implementación futura
  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implementar autenticación por email
      // const response = await fetch('/api/auth/login', { ... });
      throw new Error('Autenticación por email no implementada aún');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = async (walletAddress: string) => {
    setIsLoading(true);
    try {
      // TODO: Implementar autenticación por wallet
      // const response = await fetch('/api/auth/wallet', { ... });
      throw new Error('Autenticación por wallet no implementada aún');
    } catch (error) {
      console.error('Error en login con wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // TODO: Limpiar sesión del servidor
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    loginWithEmail,
    loginWithWallet,
    logout,
    isAdmin,
    canAccessAdminPanel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

// Hook específico para verificar permisos de admin
export function useAdminAuth() {
  const { isAuthenticated, isAdmin, canAccessAdminPanel } = useAuth();
  
  return {
    isAdmin,
    canAccessAdminPanel,
    requiresAuth: !isAuthenticated,
  };
}