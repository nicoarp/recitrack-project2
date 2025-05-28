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

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const canAccessAdminPanel = isAdmin;

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Credenciales de demostración
      if (email === "admin@ecotraza.com" && password === "admin123") {
        const adminUser: AuthUser = {
          id: 1,
          email: "admin@ecotraza.com", 
          name: "Administrador EcoTraza",
          walletAddress: "0x123...abc",
          role: 'admin',
          totalDeposits: 15,
          totalBottles: 145
        };
        setUser(adminUser);
        localStorage.setItem('ecotraza_user', JSON.stringify(adminUser));
      } else if (email === "user@example.com" && password === "user123") {
        const normalUser: AuthUser = {
          id: 2,
          email: "user@example.com",
          name: "Usuario Normal",
          walletAddress: "0x456...def", 
          role: 'user',
          totalDeposits: 5,
          totalBottles: 25
        };
        setUser(normalUser);
        localStorage.setItem('ecotraza_user', JSON.stringify(normalUser));
      } else {
        throw new Error('Credenciales incorrectas');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = async (walletAddress: string) => {
    setIsLoading(true);
    try {
      const walletUser: AuthUser = {
        id: 3,
        email: undefined,
        name: "Usuario Wallet",
        walletAddress,
        role: 'user',
        totalDeposits: 0,
        totalBottles: 0
      };
      setUser(walletUser);
      localStorage.setItem('ecotraza_user', JSON.stringify(walletUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ecotraza_user');
  };

  // Recuperar usuario del localStorage al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('ecotraza_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('ecotraza_user');
      }
    }
  }, []);

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