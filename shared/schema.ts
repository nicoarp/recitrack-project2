import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table - Preparado para autenticación futura
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // Autenticación clásica
  email: text("email").unique(),
  password: text("password"),
  name: text("name"),
  // Autenticación por wallet
  walletAddress: text("wallet_address").unique(),
  // Campos adicionales
  role: text("role").default("user"), // "user", "admin"
  isActive: boolean("is_active").default(true),
  totalDeposits: integer("total_deposits").default(0),
  totalBottles: integer("total_bottles").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// Recycling Points table
export const recyclingPoints = pgTable("recycling_points", {
  id: serial("id").primaryKey(),
  depositId: text("deposit_id").notNull().unique(), // ID único para QR (ej: "PLAZA-001")
  name: text("name").notNull(),
  address: text("address").notNull(),
  hours: text("hours"),
  acceptedItems: text("accepted_items").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bottles Deposits table - Soporta usuarios anónimos y autenticados
export const bottleDeposits = pgTable("bottle_deposits", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  bottleCount: integer("bottle_count").notNull(),
  location: text("location").notNull(),
  depositId: text("deposit_id").notNull(), // ID del punto de reciclaje
  // Usuario opcional - null para depósitos anónimos
  userId: integer("user_id").references(() => users.id),
  // Información de blockchain
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  // Timestamps
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  // Metadatos adicionales para el futuro
  deviceInfo: text("device_info"), // Para analytics
  ipAddress: text("ip_address"), // Para geolocalización
});

// Schemas for insertions
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  walletAddress: true,
  role: true,
});

export const insertRecyclingPointSchema = createInsertSchema(recyclingPoints).pick({
  depositId: true,
  name: true,
  address: true,
  hours: true,
  acceptedItems: true,
});

export const insertBottleDepositSchema = createInsertSchema(bottleDeposits).pick({
  batchId: true,
  bottleCount: true,
  location: true,
  depositId: true,
  userId: true,
  txHash: true,
  blockNumber: true,
  deviceInfo: true,
  ipAddress: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRecyclingPoint = z.infer<typeof insertRecyclingPointSchema>;
export type RecyclingPoint = typeof recyclingPoints.$inferSelect;

export type InsertBottleDeposit = z.infer<typeof insertBottleDepositSchema>;
export type BottleDeposit = typeof bottleDeposits.$inferSelect;
