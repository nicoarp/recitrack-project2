import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recycling Points table
export const recyclingPoints = pgTable("recycling_points", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  hours: text("hours"),
  acceptedItems: text("accepted_items").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bottles Deposits table
export const bottleDeposits = pgTable("bottle_deposits", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  bottleCount: integer("bottle_count").notNull(),
  location: text("location").notNull(),
  userId: integer("user_id").references(() => users.id),
  txHash: text("tx_hash"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Schemas for insertions
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const insertRecyclingPointSchema = createInsertSchema(recyclingPoints).pick({
  name: true,
  address: true,
  hours: true,
  acceptedItems: true,
});

export const insertBottleDepositSchema = createInsertSchema(bottleDeposits).pick({
  batchId: true,
  bottleCount: true,
  location: true,
  userId: true,
  txHash: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRecyclingPoint = z.infer<typeof insertRecyclingPointSchema>;
export type RecyclingPoint = typeof recyclingPoints.$inferSelect;

export type InsertBottleDeposit = z.infer<typeof insertBottleDepositSchema>;
export type BottleDeposit = typeof bottleDeposits.$inferSelect;
