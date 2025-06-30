import React, { createContext, useContext, useState, useEffect } from 'react';

// Estructura preparada para autenticación futura
interface AuthUser {
  id: number;
  email?: string;
  name?: string;
  walletAddress?: string;
  role: 'user' | 'admin' | 'acopio' | 'batch_operator';
  totalDeposits: number;
  totalBottles: number;
}

interface AuthContextType {
  // Estado actual
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Métodos de autenticación
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
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
      // Verificar cuentas registradas por usuarios
      const registeredUsers = JSON.parse(localStorage.getItem('ecotraza_registered_users') || '[]');
      const registeredUser = registeredUsers.find((u: any) => u.email === email && u.password === password);
      
      if (registeredUser) {
        setUser(registeredUser.user);
        localStorage.setItem('ecotraza_user', JSON.stringify(registeredUser.user));
        return;
      }
      
      // Credenciales de demostración
      if (email === "admin@ecotraza.com" && password === "admin123") {
        const adminUser: AuthUser = {
          id: 1,
          email: "admin@ecotraza.com", 
          name: "Administrador EcoTraza",
          walletAddress: "0xd1ca86232E3c54725c4cD05c653c78922061180f",
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

  const registerWithEmail = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Verificar si el usuario ya existe
      const existingUsers = JSON.parse(localStorage.getItem('ecotraza_registered_users') || '[]');
      const userExists = existingUsers.find((u: any) => u.email === email);
      
      if (userExists) {
        throw new Error('Ya existe una cuenta con este email');
      }
      
      // Crear nuevo usuario
      const newUser: AuthUser = {
        id: Date.now(), // ID único basado en timestamp
        email: email,
        name: name,
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Wallet simulada
        role: 'user',
        totalDeposits: 0,
        totalBottles: 0
      };
      
      // Guardar credenciales
      const newUserCredentials = {
        email: email,
        password: password,
        user: newUser
      };
      
      existingUsers.push(newUserCredentials);
      localStorage.setItem('ecotraza_registered_users', JSON.stringify(existingUsers));
      
      // Iniciar sesión automáticamente
      setUser(newUser);
      localStorage.setItem('ecotraza_user', JSON.stringify(newUser));
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
    registerWithEmail,
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