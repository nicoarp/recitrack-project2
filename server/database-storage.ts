/**
 * DatabaseStorage - Sistema de almacenamiento real con PostgreSQL
 * 
 * Este archivo implementa el almacenamiento real de datos de usuarios y depósitos
 * sin datos simulados ni hardcodeados. Todas las estadísticas se calculan
 * dinámicamente a partir de datos reales de la base de datos.
 */

import { db } from "./db";
import { v4 as uuidv4 } from "uuid";
import { 
  users, 
  bottleDeposits, 
  recyclingPoints, 
  processingCenters,
  movimientosSalidas,
  type User, 
  type BottleDeposit, 
  type RecyclingPoint, 
  type ProcessingCenter,
  type MovimientoSalida,
  type InsertUser,
  type InsertBottleDeposit,
  type InsertRecyclingPoint,
  type InsertProcessingCenter,
  type InsertMovimientoSalida
} from "@shared/schema";
import { eq, and, sum, count, desc } from "drizzle-orm";

export interface IStorage {
  // === OPERACIONES DE USUARIOS ===
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // === OPERACIONES DE DEPÓSITOS ===
  getBottleDeposit(id: number): Promise<BottleDeposit | undefined>;
  getAllBottleDeposits(): Promise<BottleDeposit[]>;
  createBottleDeposit(deposit: InsertBottleDeposit): Promise<BottleDeposit>;
  
  // === ESTADÍSTICAS REALES DEL USUARIO ===
  getUserDepositCount(userId: number): Promise<number>;
  getUserTotalBottles(userId: number): Promise<number>;
  getUserTotalWeight(userId: number): Promise<number>;
  getUserTotalDeposits(userId: number): Promise<number>;
  getUserRecentDeposits(userId: number, limit?: number): Promise<BottleDeposit[]>;
  
  // === OPERACIONES DE PUNTOS DE RECICLAJE ===
  getRecyclingPoint(id: number): Promise<RecyclingPoint | undefined>;
  getRecyclingPointByDepositId(depositId: string): Promise<RecyclingPoint | undefined>;
  getAllRecyclingPoints(): Promise<RecyclingPoint[]>;
  createRecyclingPoint(point: InsertRecyclingPoint): Promise<RecyclingPoint>;
  
  // === OPERACIONES DE CENTROS DE PROCESAMIENTO ===
  getProcessingCenter(id: number): Promise<ProcessingCenter | undefined>;
  getAllProcessingCenters(): Promise<ProcessingCenter[]>;
  getProcessingCentersByType(type: string): Promise<ProcessingCenter[]>;
  createProcessingCenter(center: InsertProcessingCenter): Promise<ProcessingCenter>;
  
  // === ESTADÍSTICAS GLOBALES ===
  getTotalBottles(): Promise<number>;
  getTotalBatches(): Promise<number>;
  getTotalRecyclingPoints(): Promise<number>;
  getTotalWeight(): Promise<number>;
  getTotalUsers(): Promise<number>;
  
  // === OPERACIONES DE MOVIMIENTOS DE SALIDA ===
  getMovimientoSalida(id: number): Promise<MovimientoSalida | undefined>;
  getAllMovimientosSalidas(): Promise<MovimientoSalida[]>;
  getMovimientosSalidasByUser(userId: number): Promise<MovimientoSalida[]>;
  getMovimientosSalidasByBatch(batchId: number): Promise<MovimientoSalida[]>;
  createMovimientoSalida(movimiento: InsertMovimientoSalida): Promise<MovimientoSalida>;
  updateMovimientoSalida(id: number, updates: Partial<InsertMovimientoSalida>): Promise<MovimientoSalida>;
  deleteMovimientoSalida(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  
  // === OPERACIONES DE USUARIOS ===
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // === OPERACIONES DE DEPÓSITOS ===

  async getBottleDeposit(id: number): Promise<BottleDeposit | undefined> {
    const [deposit] = await db.select().from(bottleDeposits).where(eq(bottleDeposits.id, id));
    return deposit;
  }

  async getAllBottleDeposits(): Promise<BottleDeposit[]> {
    return await db.select().from(bottleDeposits);
  }


async createBottleDeposit(insertDeposit: InsertBottleDeposit): Promise<BottleDeposit> {
  // Si insertDeposit ya trae eventId, úsalo. Si no, genera uno nuevo.
  const eventId = insertDeposit.eventId && insertDeposit.eventId.trim() !== ""
    ? insertDeposit.eventId
    : uuidv4();

  console.log("DEBUG Deposit que llega:", insertDeposit);
  console.log("DEBUG EventId usado:", eventId);


  const [deposit] = await db
  

    .insert(bottleDeposits)
    .values({
      ...insertDeposit,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventId, 
    })
    .returning();
  return deposit;
}


  // === ESTADÍSTICAS REALES DEL USUARIO ===
  
  /**
   * Obtiene el número total de depósitos realizados por un usuario
   * @param userId ID del usuario
   * @returns Número real de depósitos del usuario
   */
  async getUserDepositCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(bottleDeposits)
      .where(eq(bottleDeposits.userId, userId));
    
    return result[0]?.count || 0;
  }

  /**
   * Obtiene el total de botellas registradas por un usuario
   * @param userId ID del usuario
   * @returns Suma real de botellas del usuario
   */
  async getUserTotalBottles(userId: number): Promise<number> {
    const result = await db
      .select({ total: sum(bottleDeposits.bottleCount) })
      .from(bottleDeposits)
      .where(eq(bottleDeposits.userId, userId));
    
    return Number(result[0]?.total) || 0;
  }

  /**
   * Obtiene el peso total en kg registrado por un usuario
   * @param userId ID del usuario
   * @returns Suma real del peso en kg del usuario
   */
  async getUserTotalWeight(userId: number): Promise<number> {
    const result = await db
      .select({ total: sum(bottleDeposits.weightKg) })
      .from(bottleDeposits)
      .where(eq(bottleDeposits.userId, userId));
    
    return Number(result[0]?.total) || 0;
  }

  /**
   * Alias para getUserDepositCount - mantiene compatibilidad
   */
  async getUserTotalDeposits(userId: number): Promise<number> {
    return this.getUserDepositCount(userId);
  }

  /**
   * Obtiene los depósitos más recientes de un usuario
   * @param userId ID del usuario
   * @param limit Número máximo de depósitos a retornar
   * @returns Lista de depósitos recientes del usuario
   */
  async getUserRecentDeposits(userId: number, limit: number = 10): Promise<BottleDeposit[]> {
    return await db
      .select()
      .from(bottleDeposits)
      .where(eq(bottleDeposits.userId, userId))
      .orderBy(desc(bottleDeposits.createdAt))
      .limit(limit);
  }

  // === OPERACIONES DE PUNTOS DE RECICLAJE ===

  async getRecyclingPoint(id: number): Promise<RecyclingPoint | undefined> {
    const [point] = await db.select().from(recyclingPoints).where(eq(recyclingPoints.id, id));
    return point;
  }

  async getRecyclingPointByDepositId(depositId: string): Promise<RecyclingPoint | undefined> {
    const [point] = await db.select().from(recyclingPoints).where(eq(recyclingPoints.depositId, depositId));
    return point;
  }

  async getAllRecyclingPoints(): Promise<RecyclingPoint[]> {
    return await db.select().from(recyclingPoints);
  }

  async createRecyclingPoint(insertPoint: InsertRecyclingPoint): Promise<RecyclingPoint> {
    const [point] = await db
      .insert(recyclingPoints)
      .values({
        ...insertPoint,
        createdAt: new Date(),
      })
      .returning();
    return point;
  }

  // === OPERACIONES DE CENTROS DE PROCESAMIENTO ===

  async getProcessingCenter(id: number): Promise<ProcessingCenter | undefined> {
    const [center] = await db.select().from(processingCenters).where(eq(processingCenters.id, id));
    return center;
  }

  async getAllProcessingCenters(): Promise<ProcessingCenter[]> {
    return await db.select().from(processingCenters);
  }

  async getProcessingCentersByType(type: string): Promise<ProcessingCenter[]> {
    return await db.select().from(processingCenters).where(eq(processingCenters.centerType, type));
  }

  async createProcessingCenter(insertCenter: InsertProcessingCenter): Promise<ProcessingCenter> {
    const [center] = await db
      .insert(processingCenters)
      .values({
        ...insertCenter,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return center;
  }

  // === ESTADÍSTICAS GLOBALES ===

  /**
   * Obtiene el total de botellas registradas en el sistema
   */
  async getTotalBottles(): Promise<number> {
    const result = await db
      .select({ total: sum(bottleDeposits.bottleCount) })
      .from(bottleDeposits);
    
    return Number(result[0]?.total) || 0;
  }

  /**
   * Obtiene el número de lotes únicos en el sistema
   */
  async getTotalBatches(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(bottleDeposits);
    
    return result[0]?.count || 0;
  }

  /**
   * Obtiene el número total de puntos de reciclaje
   */
  async getTotalRecyclingPoints(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(recyclingPoints);
    
    return result[0]?.count || 0;
  }

  /**
   * Obtiene el peso total procesado en el sistema
   */
  async getTotalWeight(): Promise<number> {
    const result = await db
      .select({ total: sum(bottleDeposits.weightKg) })
      .from(bottleDeposits);
    
    return Number(result[0]?.total) || 0;
  }

  /**
   * Obtiene el número total de usuarios registrados
   */
  async getTotalUsers(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(users);
    
    return result[0]?.count || 0;
  }

  // === OPERACIONES DE MOVIMIENTOS DE SALIDA ===

  /**
   * Obtiene un movimiento de salida por ID
   * @param id ID del movimiento de salida
   * @returns Movimiento de salida encontrado
   */
  async getMovimientoSalida(id: number): Promise<MovimientoSalida | undefined> {
    const [movimiento] = await db.select().from(movimientosSalidas).where(eq(movimientosSalidas.id, id));
    return movimiento;
  }

  /**
   * Obtiene todos los movimientos de salida
   * @returns Lista completa de movimientos de salida
   */
  async getAllMovimientosSalidas(): Promise<MovimientoSalida[]> {
    return await db
      .select()
      .from(movimientosSalidas)
      .orderBy(desc(movimientosSalidas.fecha));
  }

  /**
   * Obtiene movimientos de salida de un usuario específico
   * @param userId ID del usuario
   * @returns Lista de movimientos de salida del usuario
   */
  async getMovimientosSalidasByUser(userId: number): Promise<MovimientoSalida[]> {
    return await db
      .select()
      .from(movimientosSalidas)
      .where(eq(movimientosSalidas.creadoPor, userId))
      .orderBy(desc(movimientosSalidas.fecha));
  }

  /**
   * Obtiene movimientos de salida asociados a un lote específico
   * @param batchId ID del lote
   * @returns Lista de movimientos de salida del lote
   */
  async getMovimientosSalidasByBatch(batchId: number): Promise<MovimientoSalida[]> {
    return await db
      .select()
      .from(movimientosSalidas)
      .where(eq(movimientosSalidas.batchId, batchId))
      .orderBy(desc(movimientosSalidas.fecha));
  }

  /**
   * Crea un nuevo movimiento de salida
   * @param movimiento Datos del movimiento de salida a crear
   * @returns Movimiento de salida creado
   */
  async createMovimientoSalida(insertMovimiento: InsertMovimientoSalida): Promise<MovimientoSalida> {
    const [movimiento] = await db
      .insert(movimientosSalidas)
      .values({
        ...insertMovimiento,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return movimiento;
  }

  /**
   * Actualiza un movimiento de salida existente
   * @param id ID del movimiento de salida
   * @param updates Campos a actualizar
   * @returns Movimiento de salida actualizado
   */
  async updateMovimientoSalida(id: number, updates: Partial<InsertMovimientoSalida>): Promise<MovimientoSalida> {
    const [movimiento] = await db
      .update(movimientosSalidas)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(movimientosSalidas.id, id))
      .returning();
    return movimiento;
  }

  /**
   * Elimina un movimiento de salida
   * @param id ID del movimiento de salida
   * @returns true si se eliminó correctamente
   */
  async deleteMovimientoSalida(id: number): Promise<boolean> {
    const result = await db
      .delete(movimientosSalidas)
      .where(eq(movimientosSalidas.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

// Crear instancia única de almacenamiento de base de datos
export const storage = new DatabaseStorage();