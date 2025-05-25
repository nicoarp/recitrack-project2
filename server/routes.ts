import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertBottleDepositSchema, insertRecyclingPointSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/users", async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error al crear usuario" });
      }
    }
  });

  app.get("/api/recycling-points", async (_req, res) => {
    const points = await storage.getAllRecyclingPoints();
    res.json(points);
  });

  app.post("/api/recycling-points", async (req, res) => {
    try {
      const pointData = insertRecyclingPointSchema.parse(req.body);
      const point = await storage.createRecyclingPoint(pointData);
      res.status(201).json(point);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error al crear punto de reciclaje" });
      }
    }
  });

  app.get("/api/bottle-deposits", async (_req, res) => {
    const deposits = await storage.getAllBottleDeposits();
    res.json(deposits);
  });

  app.post("/api/bottle-deposits", async (req, res) => {
    try {
      const depositData = insertBottleDepositSchema.parse(req.body);
      const deposit = await storage.createBottleDeposit(depositData);
      res.status(201).json(deposit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error al registrar depósito" });
      }
    }
  });

  app.get("/api/stats", async (_req, res) => {
    const totalBottles = await storage.getTotalBottles();
    const totalBatches = await storage.getTotalBatches();
    const totalPoints = await storage.getTotalRecyclingPoints();
    
    res.json({
      totalBottles,
      totalBatches,
      totalPoints,
      environmentalImpact: (totalBottles * 0.075).toFixed(1) // Approx weight in kg
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
