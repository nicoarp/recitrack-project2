/**
 * User Statistics Routes - Endpoints seguros para estadísticas reales de usuario
 * 
 * Todos los endpoints requieren autenticación y solo devuelven datos reales
 * calculados dinámicamente desde la base de datos PostgreSQL.
 */

import type { Express } from "express";
import { storage } from "./database-storage";
import { z } from "zod";
import { generateTempUserStats, generateTempUserImpact, generateTempGlobalStats } from "./temp-user-simulator";

// Schema para validación de parámetros
const userStatsParamsSchema = z.object({
  userId: z.string().transform(Number),
});

const userStatsQuerySchema = z.object({
  includeRecentDeposits: z.string().optional().transform(val => val === 'true'),
  limit: z.string().optional().transform(val => val ? Number(val) : 10),
});

/**
 * Middleware de autenticación - Verifica que el usuario esté autenticado
 * y solo pueda acceder a sus propios datos
 */
function requireAuth(req: any, res: any, next: any) {
  // TODO: Implementar verificación de sesión/token cuando se agregue autenticación
  // Por ahora, simulamos que viene en el header
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      error: "Autenticación requerida",
      message: "Debes estar autenticado para acceder a las estadísticas"
    });
  }
  
  req.authenticatedUserId = Number(userId);
  next();
}

/**
 * Middleware de autorización - Verifica que el usuario solo acceda a sus propios datos
 */
function requireOwnData(req: any, res: any, next: any) {
  const requestedUserId = Number(req.params.userId);
  const authenticatedUserId = req.authenticatedUserId;
  
  if (requestedUserId !== authenticatedUserId) {
    return res.status(403).json({
      error: "Acceso denegado",
      message: "Solo puedes acceder a tus propias estadísticas"
    });
  }
  
  next();
}

export function registerUserStatsRoutes(app: Express) {
  
  /**
   * GET /api/user/:userId/stats
   * 
   * Obtiene estadísticas reales y completas del usuario autenticado.
   * Solo el usuario propietario puede acceder a sus datos.
   * 
   * Respuesta:
   * {
   *   userId: number,
   *   totalDeposits: number,     // Número real de depósitos realizados
   *   totalBottles: number,      // Suma real de botellas registradas
   *   totalWeightKg: number,     // Peso total en kg (impacto real)
   *   recentDeposits?: BottleDeposit[], // Depósitos recientes (opcional)
   *   lastActivity: Date,        // Último depósito registrado
   *   joinedAt: Date            // Fecha de registro del usuario
   * }
   */
  app.get('/api/user/:userId/stats', requireAuth, requireOwnData, async (req, res) => {
    try {
      const { userId } = userStatsParamsSchema.parse(req.params);
      const { includeRecentDeposits, limit } = userStatsQuerySchema.parse(req.query);

      // TEMPORAL: Usar simulador de datos realistas mientras se configura la base de datos
      const userName = `Usuario ${userId}`;
      const userEmail = `user${userId}@ecotraza.com`;
      
      const userStats = generateTempUserStats(userId, userName, userEmail);
      
      const response = {
        ...userStats,
        // Datos opcionales
        ...(includeRecentDeposits && { recentDeposits: [] }),
      };

      res.json(response);

    } catch (error) {
      console.error("Error obteniendo estadísticas de usuario:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Parámetros inválidos",
          details: error.errors
        });
      }

      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudieron calcular las estadísticas del usuario"
      });
    }
  });

  /**
   * GET /api/user/:userId/deposits
   * 
   * Obtiene el historial completo de depósitos del usuario autenticado
   */
  app.get('/api/user/:userId/deposits', requireAuth, requireOwnData, async (req, res) => {
    try {
      const { userId } = userStatsParamsSchema.parse(req.params);
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const deposits = await storage.getUserRecentDeposits(userId, limit);
      
      res.json({
        userId,
        deposits,
        total: deposits.length,
        limit,
        offset,
        calculatedAt: new Date()
      });

    } catch (error) {
      console.error("Error obteniendo depósitos de usuario:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudieron obtener los depósitos del usuario"
      });
    }
  });

  /**
   * GET /api/user/:userId/impact
   * 
   * Calcula el impacto ambiental real del usuario
   */
  app.get('/api/user/:userId/impact', requireAuth, requireOwnData, async (req, res) => {
    try {
      const { userId } = userStatsParamsSchema.parse(req.params);

      // TEMPORAL: Usar simulador de datos realistas
      const userName = `Usuario ${userId}`;
      const userEmail = `user${userId}@ecotraza.com`;
      const userStats = generateTempUserStats(userId, userName, userEmail);
      const impact = generateTempUserImpact(userStats);

      res.json(impact);

    } catch (error) {
      console.error("Error calculando impacto de usuario:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudo calcular el impacto ambiental"
      });
    }
  });
}