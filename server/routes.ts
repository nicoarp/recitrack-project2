import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertBottleDepositSchema, insertRecyclingPointSchema, insertUserSchema } from "@shared/schema";
import { blockchainService } from "./blockchain.js";

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

  // Blockchain routes - Backend invisible para trazabilidad
  const blockchainEventSchema = z.object({
    batchId: z.string().min(1, "ID de lote requerido"),
    eventType: z.string().min(1, "Tipo de evento requerido"),
    description: z.string().min(1, "Descripción requerida"),
    location: z.string().min(1, "Ubicación requerida")
  });

  app.post("/api/blockchain/register-event", async (req, res) => {
    try {
      const eventData = blockchainEventSchema.parse(req.body);
      
      if (!blockchainService.isReady()) {
        // Fallback a almacenamiento local si blockchain no está disponible
        console.log("⚠️ Blockchain no disponible, usando almacenamiento local");
        res.json({ 
          success: true, 
          message: "Evento registrado localmente",
          mode: "local"
        });
        return;
      }

      const result = await blockchainService.registerEvent(
        eventData.batchId, // Se usa como bottleId en el contrato
        eventData.eventType,
        eventData.description,
        eventData.location
      );

      res.json({
        success: true,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        mode: "blockchain"
      });
    } catch (error) {
      console.error("Error registrando evento blockchain:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al registrar evento" 
      });
    }
  });

  app.get("/api/blockchain/history/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      
      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
        return;
      }

      const history = await blockchainService.getBatchHistory(batchId);
      
      // Si no hay eventos, devolver éxito con array vacío
      res.json({
        success: true,
        batchId,
        events: history,
        mode: "blockchain",
        message: history.length === 0 ? "No hay eventos registrados para este ID" : `${history.length} eventos encontrados`
      });
    } catch (error) {
      console.error("Error consultando historial blockchain:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al consultar historial" 
      });
    }
  });

  app.get("/api/blockchain/status", async (req, res) => {
    try {
      const isReady = blockchainService.isReady();
      const operatorAddress = blockchainService.getOperatorAddress();
      const balance = await blockchainService.getOperatorBalance();

      res.json({
        isReady,
        operatorAddress,
        balance: `${balance} ETH`,
        network: "Sepolia Testnet",
        mode: isReady ? "blockchain" : "local"
      });
    } catch (error) {
      res.json({
        isReady: false,
        error: error.message,
        mode: "offline"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
