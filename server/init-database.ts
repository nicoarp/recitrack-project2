/**
 * Inicialización de base de datos con datos reales
 * 
 * Este script crea usuarios, puntos de reciclaje y depósitos iniciales
 * para poblar la base de datos con datos de ejemplo realistas.
 */

import { db } from "./db";
import { users, recyclingPoints, bottleDeposits } from "@shared/schema";

export async function initializeDatabase() {
  console.log("🔄 Inicializando base de datos con datos de ejemplo...");

  try {
    // Crear usuarios de ejemplo
    const exampleUsers = await db.insert(users).values([
      {
        email: "recolector@ecotraza.com",
        name: "María Recolectora",
        role: "recolector",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: "acopio@ecotraza.com", 
        name: "Carlos Centro Acopio",
        role: "centro_acopio",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: "admin@ecotraza.com",
        name: "Ana Administradora",
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]).returning();

    console.log(`✅ Usuarios creados: ${exampleUsers.length}`);

    // Crear puntos de reciclaje de ejemplo
    const examplePoints = await db.insert(recyclingPoints).values([
      {
        depositId: "PLAZA-001",
        name: "Plaza de Armas",
        address: "Plaza de Armas, Santiago Centro",
        hours: "24 horas",
        acceptedItems: ["Botellas PET", "Latas de aluminio"],
        createdAt: new Date()
      },
      {
        depositId: "MALL-002",
        name: "Mall Plaza Vespucio",
        address: "Av. Vicuña Mackenna 7110, La Florida",
        hours: "10:00 - 22:00",
        acceptedItems: ["Botellas PET", "Vidrio", "Papel"],
        createdAt: new Date()
      },
      {
        depositId: "UNIV-003",
        name: "Universidad de Chile",
        address: "Beauchef 850, Santiago",
        hours: "8:00 - 18:00",
        acceptedItems: ["Botellas PET", "Cartón", "Papel"],
        createdAt: new Date()
      }
    ]).returning();

    console.log(`✅ Puntos de reciclaje creados: ${examplePoints.length}`);

    // Crear depósitos de ejemplo con datos realistas
    const exampleDeposits = await db.insert(bottleDeposits).values([
      {
        batchId: 1001,
        bottleCount: 15,
        weightKg: 0.75, // 15 botellas * 0.05kg promedio
        location: "Plaza de Armas, Santiago Centro",
        depositId: "PLAZA-001",
        userId: exampleUsers[0].id, // María Recolectora
        contractStatus: "confirmed",
        eventId: "EVT-001",
        evidenceHash: "hash_evidence_001",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        batchId: 1002,
        bottleCount: 22,
        weightKg: 1.1, // 22 botellas * 0.05kg promedio
        location: "Mall Plaza Vespucio, La Florida",
        depositId: "MALL-002",
        userId: exampleUsers[0].id, // María Recolectora
        contractStatus: "confirmed",
        eventId: "EVT-002",
        evidenceHash: "hash_evidence_002",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        batchId: 1003,
        bottleCount: 8,
        weightKg: 0.4, // 8 botellas * 0.05kg promedio
        location: "Universidad de Chile, Santiago",
        depositId: "UNIV-003",
        userId: exampleUsers[0].id, // María Recolectora
        contractStatus: "confirmed",
        eventId: "EVT-003",
        evidenceHash: "hash_evidence_003",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        batchId: 1004,
        bottleCount: 30,
        weightKg: 1.5, // 30 botellas * 0.05kg promedio
        location: "Plaza de Armas, Santiago Centro", 
        depositId: "PLAZA-001",
        userId: exampleUsers[0].id, // María Recolectora
        contractStatus: "pending",
        eventId: "EVT-004",
        evidenceHash: "hash_evidence_004",
        createdAt: new Date(), // Hoy
        updatedAt: new Date()
      }
    ]).returning();

    console.log(`✅ Depósitos de ejemplo creados: ${exampleDeposits.length}`);

    // Mostrar estadísticas de inicialización
    const stats = {
      totalUsers: exampleUsers.length,
      totalPoints: examplePoints.length,
      totalDeposits: exampleDeposits.length,
      totalBottles: exampleDeposits.reduce((sum, dep) => sum + dep.bottleCount, 0),
      totalWeight: exampleDeposits.reduce((sum, dep) => sum + dep.weightKg, 0)
    };

    console.log("📊 Estadísticas de inicialización:");
    console.log(`   👥 Usuarios: ${stats.totalUsers}`);
    console.log(`   📍 Puntos de reciclaje: ${stats.totalPoints}`);
    console.log(`   📦 Depósitos: ${stats.totalDeposits}`);
    console.log(`   🍼 Botellas totales: ${stats.totalBottles}`);
    console.log(`   ⚖️ Peso total: ${stats.totalWeight.toFixed(2)} kg`);
    console.log("✅ Base de datos inicializada correctamente");

    return stats;

  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    throw error;
  }
}

// Función para verificar si la base de datos necesita inicialización
export async function needsInitialization(): Promise<boolean> {
  try {
    const userCount = await db.select().from(users).limit(1);
    return userCount.length === 0;
  } catch (error) {
    console.error("Error verificando estado de base de datos:", error);
    return true; // Por seguridad, asumimos que necesita inicialización
  }
}