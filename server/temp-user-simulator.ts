/**
 * Simulador temporal de datos de usuario para desarrollo
 * 
 * Este archivo simula estadísticas reales de usuario mientras la base de datos
 * se configura completamente. Los datos devueltos imitan una respuesta real de la API.
 */

export interface TempUserStats {
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

export interface TempUserImpact {
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

/**
 * Genera estadísticas temporales realistas para un usuario específico
 */
export function generateTempUserStats(userId: number, userName: string, userEmail: string): TempUserStats {
  // Generar datos realistas basados en el ID del usuario para consistencia
  const seed = userId * 17; // Multiplicador para variación
  const totalDeposits = 3 + (seed % 12); // Entre 3 y 15 depósitos
  const totalBottles = totalDeposits * (8 + (seed % 15)); // Entre 8-23 botellas por depósito
  const totalWeightKg = totalBottles * (0.03 + (seed % 3) * 0.01); // 0.03-0.06 kg por botella
  
  return {
    userId,
    userName,
    userEmail,
    userRole: "recolector",
    totalDeposits,
    totalBottles,
    totalWeightKg: Number(totalWeightKg.toFixed(2)),
    averageBottlesPerDeposit: Number((totalBottles / totalDeposits).toFixed(1)),
    averageWeightPerDeposit: Number((totalWeightKg / totalDeposits).toFixed(2)),
    lastActivity: new Date(Date.now() - (seed % 7) * 24 * 60 * 60 * 1000), // Última actividad entre hoy y 7 días atrás
    joinedAt: new Date(Date.now() - (30 + (seed % 60)) * 24 * 60 * 60 * 1000), // Entre 30-90 días atrás
    calculatedAt: new Date(),
    dataSource: "temporary_realistic_simulation"
  };
}

/**
 * Genera impacto ambiental temporal basado en las estadísticas del usuario
 */
export function generateTempUserImpact(userStats: TempUserStats): TempUserImpact {
  const weightRecycled = userStats.totalWeightKg;
  
  return {
    bottlesRecycled: userStats.totalBottles,
    weightRecycled,
    co2Saved: Number((weightRecycled * 1.8).toFixed(2)),
    energySaved: Number((weightRecycled * 2.1).toFixed(2)),
    waterSaved: Number((weightRecycled * 15.3).toFixed(1)),
    equivalentTreesPlanted: Number((weightRecycled * 0.02).toFixed(1)),
    equivalentCarKmSaved: Number((weightRecycled * 3.2).toFixed(0)),
    calculatedAt: new Date(),
    methodology: "Factores de conversión basados en estudios de reciclaje de PET"
  };
}

/**
 * Genera estadísticas globales temporales
 */
export function generateTempGlobalStats() {
  const totalUsers = 42;
  const totalBottles = 1847;
  const totalWeight = 92.35;
  
  return {
    totalUsers,
    totalBottles,
    totalBatches: 156,
    totalRecyclingPoints: 8,
    totalWeight,
    averageBottlesPerUser: Number((totalBottles / totalUsers).toFixed(1)),
    averageWeightPerUser: Number((totalWeight / totalUsers).toFixed(2)),
    globalImpact: {
      co2Saved: Number((totalWeight * 1.8).toFixed(2)),
      energySaved: Number((totalWeight * 2.1).toFixed(2)),
      waterSaved: Number((totalWeight * 15.3).toFixed(1)),
      equivalentTreesPlanted: Number((totalWeight * 0.02).toFixed(1)),
    },
    calculatedAt: new Date(),
    dataSource: "temporary_global_simulation"
  };
}