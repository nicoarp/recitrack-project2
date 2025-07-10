import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
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

// Bottles Deposits table - Registro real de depósitos con seguimiento completo
export const bottleDeposits = pgTable("bottle_deposits", {
  id: serial("id").primaryKey(),
  // Información del depósito
  batchId: integer("batch_id").notNull(),
  bottleCount: integer("bottle_count").notNull(),
  weightKg: real("weight_kg").notNull(), // Peso real en kilogramos - CAMPO OBLIGATORIO
  location: text("location").notNull(),
  depositId: text("deposit_id").notNull(), // ID del punto de reciclaje
  
  // Usuario OBLIGATORIO - sistema requiere autenticación
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Campos para depósitos manuales
  origen: text("origen").default("qr"), // "qr" o "manual"
  donante_nombre: text("donante_nombre"), // Nombre del donante para depósitos manuales
  tipo_material: text("tipo_material"), // Tipo de material (PET, HDPE, etc.)
  
  // Información de blockchain para auditoría
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  eventId: text("event_id"), // ID del evento en el smart contract
  evidenceHash: text("evidence_hash"), // Hash de evidencia para verificación
  contractStatus: text("contract_status").default("pending"), // "pending", "confirmed", "failed"
  contractError: text("contract_error"), // Error del contrato si hay alguno
  
  // Metadatos para trazabilidad y auditoría
  deviceInfo: text("device_info"), // Para analytics y verificación
  ipAddress: text("ip_address"), // Para geolocalización y seguridad
  userAgent: text("user_agent"), // Información del navegador/app
  
  // Evidencia y validación
  photos: json("photos").$type<string[]>(), // URLs o hashes de fotos del depósito
  notes: text("notes"), // Notas adicionales del usuario
  isValidated: boolean("is_validated").default(false), // Si fue validado por el centro
  validatedBy: integer("validated_by").references(() => users.id), // Usuario que validó
  validatedAt: timestamp("validated_at"), // Cuándo fue validado
  
  // Control de timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Tabla para centros de procesado registrados
export const processingCenters = pgTable("processing_centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  centerType: text("center_type").notNull(), // batch, process, product
  status: text("status").default("active"), // active, inactive
  contactInfo: json("contact_info"), // teléfono, email, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  
  // Campos obligatorios del operador (opcionales durante migración)
  operatorName: text("operator_name"), // Nombre completo del operador
  operatorRut: text("operator_rut"), // RUT chileno del operador
  validatedBy: text("validated_by"), // Email/ID del operador que realizó la validación
  
  // Ubicación obligatoria (debe ser de centros de procesado registrados)
  processingCenterId: integer("processing_center_id"), // ID del centro de procesado
  location: text("location"), // Ubicación de la validación (duplicado para compatibilidad)
  
  // Peso y diferencias obligatorios
  currentWeight: real("current_weight"), // Peso actual en kg
  initialWeight: real("initial_weight"), // Peso inicial para cálculo
  weightDifference: real("weight_difference"), // Diferencia calculada
  weightDifferencePercent: real("weight_difference_percent"), // Porcentaje de diferencia
  
  // Evidencia obligatoria (opcional durante migración)
  evidenceHash: text("evidence_hash"), // Hash de evidencia (fotos de báscula obligatorias)
  evidenceMetadata: json("evidence_metadata"), // Metadatos de evidencia (peso, calidad, etc.)
  scalePhotoRequired: boolean("scale_photo_required").default(true), // Foto de báscula obligatoria
  
  // Blockchain y sistema
  txHash: text("tx_hash"), // Hash de transacción blockchain
  blockNumber: integer("block_number"), // Número de bloque
  validationStatus: text("validation_status").default("pending"), // pending, confirmed, failed
  notes: text("notes"), // Notas adicionales del operador
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === TABLA PARA MINI-ERP: GESTIÓN DE DOCUMENTOS ===

// Tabla para documentos asociados a lotes y movimientos
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  // Información del documento
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(), // En bytes
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(), // Ruta donde se almacena el archivo
  fileHash: text("file_hash"), // SHA-256 del archivo para integridad
  
  // Clasificación y metadatos
  documentType: text("document_type").notNull(), // "boleta", "guia", "certificado", "contrato", "otro"
  description: text("description"), // Descripción opcional del documento
  tags: text("tags").array().default([]), // Etiquetas para búsqueda
  
  // Relaciones - documento puede estar asociado a lotes o movimientos
  batchId: integer("batch_id"), // Referencia al lote (bottleDeposits.batchId)
  blockchainEventId: integer("blockchain_event_id").references(() => blockchainEvents.id), // Referencia a eventos blockchain
  
  // Control de acceso y auditoría
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id), // Usuario que subió el documento
  isPublic: boolean("is_public").default(false), // Si es visible públicamente o solo para el centro
  status: text("status").default("active"), // "active", "archived", "deleted"
  
  // Control de timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === TABLA PARA MOVIMIENTOS DE SALIDA DE MATERIALES ===

// Tabla para registrar salidas de materiales desde centros de acopio
export const movimientosSalidas = pgTable("movimientos_salidas", {
  id: serial("id").primaryKey(),
  
  // Información básica del movimiento
  fecha: timestamp("fecha").notNull(), // Fecha de la salida
  destino: text("destino").notNull(), // Empresa o lugar de destino
  tipoResiduo: text("tipo_residuo").notNull(), // Tipo de residuo (PET, HDPE, etc.)
  peso: real("peso").notNull(), // Peso total en kg
  
  // Lote asociado (opcional)
  batchId: integer("batch_id"), // Referencia al lote si corresponde
  
  // Documentos adjuntos (guías de despacho, etc.)
  documentos: text("documentos").array().default([]), // Array de paths de documentos
  
  // Información del operador
  creadoPor: integer("creado_por").notNull().references(() => users.id), // Usuario que registró la salida
  
  // Metadatos adicionales
  observaciones: text("observaciones"), // Notas adicionales
  numeroGuia: text("numero_guia"), // Número de guía de despacho
  transportista: text("transportista"), // Empresa transportista
  
  // Estado y validación
  estado: text("estado").default("registrado"), // "registrado", "en_transito", "entregado"
  validadoPor: integer("validado_por").references(() => users.id), // Usuario que validó
  fechaValidacion: timestamp("fecha_validacion"), // Fecha de validación
  
  // Control de timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  origen: true,
  donante_nombre: true,
  tipo_material: true,
  weightKg: true,
  userAgent: true,
  photos: true,
  notes: true,
  isValidated: true,
  validatedBy: true,
  validatedAt: true,
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

export const insertProcessingCenterSchema = createInsertSchema(processingCenters).pick({
  name: true,
  location: true,
  address: true,
  centerType: true,
  status: true,
  contactInfo: true,
});

export const insertQrValidationSchema = createInsertSchema(qrValidations).pick({
  qrId: true,
  eventId: true,
  phase: true,
  previousPhase: true,
  operatorName: true,
  operatorRut: true,
  validatedBy: true,
  processingCenterId: true,
  location: true,
  currentWeight: true,
  initialWeight: true,
  weightDifference: true,
  weightDifferencePercent: true,
  evidenceHash: true,
  evidenceMetadata: true,
  scalePhotoRequired: true,
  txHash: true,
  blockNumber: true,
  validationStatus: true,
  notes: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  fileName: true,
  originalName: true,
  fileSize: true,
  mimeType: true,
  filePath: true,
  fileHash: true,
  documentType: true,
  description: true,
  tags: true,
  batchId: true,
  blockchainEventId: true,
  uploadedBy: true,
  isPublic: true,
  status: true,
});

// === ESQUEMA MOVIMIENTOS DE SALIDA ===

export const insertMovimientoSalidaSchema = createInsertSchema(movimientosSalidas).pick({
  fecha: true,
  destino: true,
  tipoResiduo: true,
  peso: true,
  batchId: true,
  documentos: true,
  creadoPor: true,
  observaciones: true,
  numeroGuia: true,
  transportista: true,
  estado: true,
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

export type InsertProcessingCenter = z.infer<typeof insertProcessingCenterSchema>;
export type ProcessingCenter = typeof processingCenters.$inferSelect;

export type InsertQrValidation = z.infer<typeof insertQrValidationSchema>;
export type QrValidation = typeof qrValidations.$inferSelect;

// === TIPOS MINI-ERP ===

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// === TIPOS MOVIMIENTOS DE SALIDA ===

export type InsertMovimientoSalida = z.infer<typeof insertMovimientoSalidaSchema>;
export type MovimientoSalida = typeof movimientosSalidas.$inferSelect;
