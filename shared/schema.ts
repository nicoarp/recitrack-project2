import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
  eventId: text("event_id"), // ID del evento en el smart contract
  evidenceHash: text("evidence_hash"), // Hash de evidencia para verificación
  contractStatus: text("contract_status").default("pending"), // "pending", "confirmed", "failed"
  contractError: text("contract_error"), // Error del contrato si hay alguno
  // Timestamps
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  // Metadatos adicionales para el futuro
  deviceInfo: text("device_info"), // Para analytics
  ipAddress: text("ip_address"), // Para geolocalización
});

// Blockchain Events table - Rastrea todos los eventos del smart contract
export const blockchainEvents = pgTable("blockchain_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(), // ID del evento en el smart contract
  eventType: text("event_type").notNull(), // "Deposit", "Batch", "Process", "Product"
  relatedIds: text("related_ids").array().default([]), // IDs relacionados para trazabilidad
  location: text("location").notNull(),
  quantity: integer("quantity").notNull(),
  description: text("description").notNull(),
  evidenceHash: text("evidence_hash").default(""),
  actor: text("actor"), // Dirección del wallet que ejecutó la transacción
  txHash: text("tx_hash").notNull(),
  blockNumber: integer("block_number"),
  gasUsed: text("gas_used"),
  status: text("status").default("confirmed"), // "pending", "confirmed", "failed"
  contractError: text("contract_error"), // Error del contrato si hay alguno
  // Metadatos de validación
  isValidated: boolean("is_validated").default(false),
  validationPhase: text("validation_phase"), // Fase donde se validó: "deposit", "batch", "process", "product"
  validatedBy: text("validated_by"), // Usuario o sistema que validó
  validatedAt: timestamp("validated_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === TABLAS DEL SISTEMA QR ===

// Tabla para códigos QR y su vinculación física-digital
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  qrId: text("qr_id").notNull().unique(), // UUID único del QR
  eventId: text("event_id"), // ID del evento blockchain asociado
  eventType: text("event_type").notNull(), // Tipo de evento (Deposit, Batch, Process, Product)
  qrCodeData: text("qr_code_data").notNull(), // Datos codificados en el QR
  qrImageBase64: text("qr_image_base64"), // Imagen QR en base64
  status: text("status").default("active"), // active, validated, completed
  metadata: json("metadata"), // Información adicional (peso inicial, descripción, etc.)
  createdBy: text("created_by"), // Operador que creó el QR
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabla para historial de validaciones de QR en diferentes fases
export const qrValidations = pgTable("qr_validations", {
  id: serial("id").primaryKey(),
  qrId: text("qr_id").notNull(), // Referencia al QR validado
  eventId: text("event_id"), // ID del evento blockchain generado por esta validación
  phase: text("phase").notNull(), // Fase validada (Deposit, Batch, Process, Product)
  previousPhase: text("previous_phase"), // Fase anterior
  validatedBy: text("validated_by"), // Operador que realizó la validación
  location: text("location"), // Ubicación de la validación
  evidenceHash: text("evidence_hash"), // Hash de evidencia (fotos, documentos)
  evidenceMetadata: json("evidence_metadata"), // Metadatos de evidencia (peso, calidad, etc.)
  txHash: text("tx_hash"), // Hash de transacción blockchain
  blockNumber: integer("block_number"), // Número de bloque
  validationStatus: text("validation_status").default("pending"), // pending, confirmed, failed
  notes: text("notes"), // Notas adicionales del operador
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  eventId: true,
  evidenceHash: true,
  contractStatus: true,
  contractError: true,
  deviceInfo: true,
  ipAddress: true,
});

export const insertBlockchainEventSchema = createInsertSchema(blockchainEvents).pick({
  eventId: true,
  eventType: true,
  relatedIds: true,
  location: true,
  quantity: true,
  description: true,
  evidenceHash: true,
  actor: true,
  txHash: true,
  blockNumber: true,
  gasUsed: true,
  status: true,
  contractError: true,
  isValidated: true,
  validationPhase: true,
  validatedBy: true,
  validatedAt: true,
});

// === ESQUEMAS QR ===

export const insertQrCodeSchema = createInsertSchema(qrCodes).pick({
  qrId: true,
  eventId: true,
  eventType: true,
  qrCodeData: true,
  qrImageBase64: true,
  status: true,
  metadata: true,
  createdBy: true,
});

export const insertQrValidationSchema = createInsertSchema(qrValidations).pick({
  qrId: true,
  eventId: true,
  phase: true,
  previousPhase: true,
  validatedBy: true,
  location: true,
  evidenceHash: true,
  evidenceMetadata: true,
  txHash: true,
  blockNumber: true,
  validationStatus: true,
  notes: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRecyclingPoint = z.infer<typeof insertRecyclingPointSchema>;
export type RecyclingPoint = typeof recyclingPoints.$inferSelect;

export type InsertBottleDeposit = z.infer<typeof insertBottleDepositSchema>;
export type BottleDeposit = typeof bottleDeposits.$inferSelect;

export type InsertBlockchainEvent = z.infer<typeof insertBlockchainEventSchema>;
export type BlockchainEvent = typeof blockchainEvents.$inferSelect;

// === TIPOS QR ===

export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type QrCode = typeof qrCodes.$inferSelect;

export type InsertQrValidation = z.infer<typeof insertQrValidationSchema>;
export type QrValidation = typeof qrValidations.$inferSelect;
