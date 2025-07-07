import React, { createContext, useContext, useState, useEffect } from 'react';

// Estructura preparada para autenticación futura
interface AuthUser {
  id: number;
  email?: string;
  name?: string;
  walletAddress?: string;
  role: 'recolector' | 'centro_acopio' | 'admin';
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
  
  // Permisos específicos por rol
  isRecolector: boolean;
  isCentroAcopio: boolean;
  isAdmin: boolean;
  canScanQR: boolean;
  canRegisterDeposit: boolean;
  canViewPersonalHistory: boolean;
  canCreateBatches: boolean;
  canValidateBatches: boolean;
  canViewBatchHistory: boolean;
  canAccessAdminPanel: boolean;
  canViewGlobalHistory: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user;
  
  // Roles específicos
  const isRecolector = user?.role === 'recolector';
  const isCentroAcopio = user?.role === 'centro_acopio';
  const isAdmin = user?.role === 'admin';

  // Permisos por rol
  const canScanQR = isRecolector || isCentroAcopio || isAdmin;
  const canRegisterDeposit = isRecolector || isAdmin;
  const canViewPersonalHistory = isRecolector || isAdmin;
  const canCreateBatches = isCentroAcopio || isAdmin;
  const canValidateBatches = isCentroAcopio || isAdmin;
  const canViewBatchHistory = isCentroAcopio || isAdmin;
  const canAccessAdminPanel = isAdmin;
  const canViewGlobalHistory = isAdmin;
  const canManageUsers = isAdmin;

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Verificar cuentas registradas por usuarios
      const registeredUsers = JSON.parse(localStorage.getItem('recitrack_registered_users') || '[]');
      const registeredUser = registeredUsers.find((u: any) => u.email === email && u.password === password);
      
      if (registeredUser) {
        setUser(registeredUser.user);
        localStorage.setItem('recitrack_user', JSON.stringify(registeredUser.user));
        return;
      }
      
      // Credenciales de demostración por rol
      if (email === "admin@recitrack.com" && password === "admin123") {
        // Obtener datos reales del usuario desde PostgreSQL
        try {
          const response = await fetch('/api/auth/user', {
            headers: { 'X-User-Id': '3' }
          });
          if (response.ok) {
            const realUserData = await response.json();
            const adminUser: AuthUser = {
              id: realUserData.id || 3,
              email: realUserData.email || "admin@recitrack.com", 
              name: realUserData.name || "Administrador",
              walletAddress: "0xd1ca86232E3c54725c4cD05c653c78922061180f",
              role: realUserData.role || 'admin',
              totalDeposits: 0,
              totalBottles: 0
            };
            setUser(adminUser);
            localStorage.setItem('recitrack_user', JSON.stringify(adminUser));
            return;
          }
        } catch (error) {
          console.error("Error obteniendo datos reales del usuario:", error);
        }
        
        const adminUser: AuthUser = {
          id: 3,
          email: "admin@recitrack.com", 
          name: "Administrador",
          walletAddress: "0xd1ca86232E3c54725c4cD05c653c78922061180f",
          role: 'admin',
          totalDeposits: 0,
          totalBottles: 0
        };
        setUser(adminUser);
        localStorage.setItem('recitrack_user', JSON.stringify(adminUser));
      } else if (email === "recolector@recitrack.com" && password === "recolector123") {
        // Obtener datos reales del usuario desde PostgreSQL
        try {
          const response = await fetch('/api/auth/user', {
            headers: { 'X-User-Id': '1' }
          });
          if (response.ok) {
            const realUserData = await response.json();
            const recolectorUser: AuthUser = {
              id: realUserData.id || 1,
              email: realUserData.email || "recolector@recitrack.com",
              name: realUserData.name || "Recolector",
              walletAddress: "0x456...def", 
              role: realUserData.role || 'recolector',
              totalDeposits: 0, // Se actualizará dinámicamente
              totalBottles: 0   // Se actualizará dinámicamente
            };
            setUser(recolectorUser);
            localStorage.setItem('recitrack_user', JSON.stringify(recolectorUser));
            return;
          }
        } catch (error) {
          console.error("Error obteniendo datos reales del usuario:", error);
        }
        
        // Fallback solo si falla PostgreSQL - usuario sin datos hardcodeados
        const recolectorUser: AuthUser = {
          id: 1,
          email: "recolector@recitrack.com",
          name: "Recolector",
          walletAddress: "0x456...def", 
          role: 'recolector',
          totalDeposits: 0,
          totalBottles: 0
        };
        setUser(recolectorUser);
        localStorage.setItem('recitrack_user', JSON.stringify(recolectorUser));
      } else if (email === "acopio@recitrack.com" && password === "acopio123") {
        // Obtener datos reales del usuario desde PostgreSQL
        try {
          const response = await fetch('/api/auth/user', {
            headers: { 'X-User-Id': '2' }
          });
          if (response.ok) {
            const realUserData = await response.json();
            const centroUser: AuthUser = {
              id: realUserData.id || 2,
              email: realUserData.email || "acopio@recitrack.com",
              name: realUserData.name || "Centro de Acopio",
              walletAddress: "0x789...ghi", 
              role: realUserData.role || 'centro_acopio',
              totalDeposits: 0,
              totalBottles: 0
            };
            setUser(centroUser);
            localStorage.setItem('recitrack_user', JSON.stringify(centroUser));
            return;
          }
        } catch (error) {
          console.error("Error obteniendo datos reales del usuario:", error);
        }
        
        const centroUser: AuthUser = {
          id: 2,
          email: "acopio@recitrack.com",
          name: "Centro de Acopio",
          walletAddress: "0x789...ghi", 
          role: 'centro_acopio',
          totalDeposits: 0,
          totalBottles: 0
        };
        setUser(centroUser);
        localStorage.setItem('recitrack_user', JSON.stringify(centroUser));
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
      const existingUsers = JSON.parse(localStorage.getItem('recitrack_registered_users') || '[]');
      const userExists = existingUsers.find((u: any) => u.email === email);
      
      if (userExists) {
        throw new Error('Ya existe una cuenta con este email');
      }
      
      // Crear nuevo usuario (por defecto recolector)
      const newUser: AuthUser = {
        id: Date.now(), // ID único basado en timestamp
        email: email,
        name: name,
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Wallet simulada
        role: 'recolector',
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
      localStorage.setItem('recitrack_registered_users', JSON.stringify(existingUsers));
      
      // Iniciar sesión automáticamente
      setUser(newUser);
      localStorage.setItem('recitrack_user', JSON.stringify(newUser));
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
        role: 'recolector',
        totalDeposits: 0,
        totalBottles: 0
      };
      setUser(walletUser);
      localStorage.setItem('recitrack_user', JSON.stringify(walletUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('recitrack_user');
  };

  // Recuperar usuario del localStorage al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('recitrack_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('recitrack_user');
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
    // Roles específicos
    isRecolector,
    isCentroAcopio,
    isAdmin,
    // Permisos granulares
    canScanQR,
    canRegisterDeposit,
    canViewPersonalHistory,
    canCreateBatches,
    canValidateBatches,
    canViewBatchHistory,
    canAccessAdminPanel,
    canViewGlobalHistory,
    canManageUsers,
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