/**
 * Hook para obtener estadísticas reales de usuario desde la base de datos
 * 
 * Este hook consume los endpoints de estadísticas reales y proporciona
 * datos actualizados en tiempo real sin usar datos simulados.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface UserStats {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  totalDeposits: number;
  totalBottles: number;
  totalWeightKg: number;
  averageBottlesPerDeposit: number;
  averageWeightPerDeposit: number;
  lastActivity: Date | null;
  joinedAt: Date;
  calculatedAt: Date;
  dataSource: string;
}

interface UserImpact {
  bottlesRecycled: number;
  weightRecycled: number;
  co2Saved: number;
  energySaved: number;
  waterSaved: number;
  equivalentTreesPlanted: number;
  equivalentCarKmSaved: number;
  calculatedAt: Date;
  methodology: string;
}

interface UserDeposit {
  id: number;
  batchId: number;
  bottleCount: number;
  weightKg: number;
  location: string;
  depositId: string;
  contractStatus: string;
  eventId: string;
  createdAt: Date;
}

/**
 * Hook para obtener estadísticas completas del usuario autenticado
 */
export function useUserStats(includeRecentDeposits: boolean = false) {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['/api/user-stats', user?.id, includeRecentDeposits],
    queryFn: async (): Promise<UserStats> => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const params = new URLSearchParams({
        includeRecentDeposits: includeRecentDeposits.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/user/${user.id}/stats?${params}`, {
        headers: {
          'X-User-Id': user.id.toString(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo estadísticas: ${response.status}`);
      }

      return response.json();
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // Actualizar cada 30 segundos
  });
}

/**
 * Hook para obtener el impacto ambiental del usuario
 */
export function useUserImpact() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['/api/user-impact', user?.id],
    queryFn: async (): Promise<UserImpact> => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const response = await fetch(`/api/user/${user.id}/impact`, {
        headers: {
          'X-User-Id': user.id.toString(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo impacto: ${response.status}`);
      }

      return response.json();
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obtener el historial de depósitos del usuario
 */
export function useUserDeposits(limit: number = 10) {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['/api/user-deposits', user?.id, limit],
    queryFn: async (): Promise<{ deposits: UserDeposit[]; total: number }> => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(`/api/user/${user.id}/deposits?${params}`, {
        headers: {
          'X-User-Id': user.id.toString(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo depósitos: ${response.status}`);
      }

      return response.json();
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener estadísticas globales del sistema
 */
export function useGlobalStats() {
  return useQuery({
    queryKey: ['/api/global-stats'],
    queryFn: async () => {
      const response = await fetch('/api/global-stats');
      if (!response.ok) {
        throw new Error(`Error obteniendo estadísticas globales: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    refetchInterval: 5 * 60 * 1000, // Actualizar cada 5 minutos
  });
}