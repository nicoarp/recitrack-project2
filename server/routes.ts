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

  app.get("/api/recycling-points/qr/:depositId", async (req, res) => {
    try {
      const { depositId } = req.params;
      console.log('Buscando punto con depositId:', depositId);
      
      const point = await storage.getRecyclingPointByDepositId(depositId);
      console.log('Punto encontrado:', point);
      
      if (!point) {
        return res.status(404).json({ message: "Punto de depósito no encontrado" });
      }
      
      return res.json(point);
    } catch (error) {
      console.error('Error en endpoint QR:', error);
      return res.status(500).json({ message: "Error al buscar punto de depósito" });
    }
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

  // Endpoint para estadísticas de usuario específico
  app.get("/api/user-stats", async (req, res) => {
    try {
      const userId = req.query.userId;
      const userEmail = req.query.userEmail;
      
      if (!userId && !userEmail) {
        return res.status(400).json({ message: "Se requiere userId o userEmail" });
      }

      // Obtener eventos de depósito del blockchain filtrados por usuario
      try {
        const depositEvents = await blockchainService.getEventsByType('Deposit');
        
        // Filtrar eventos por usuario (usando descripción que contiene info del usuario)
        const userEvents = depositEvents.filter(event => {
          // Buscar en la descripción del evento información del usuario
          const description = event.description || '';
          const location = event.location || '';
          
          // Por ahora, como no tenemos datos de usuario en blockchain, 
          // retornamos eventos recientes como estadísticas del usuario
          return true; // Temporal - necesitamos implementar mejor filtrado
        });

        const userBottles = userEvents.reduce((sum, event) => sum + (event.quantity || 0), 0);
        const userDeposits = userEvents.length;

        res.json({
          totalBottles: userBottles,
          totalDeposits: userDeposits,
          totalBatches: userDeposits, // Cada depósito genera un batch
          environmentalImpact: (userBottles * 0.075).toFixed(1)
        });
      } catch (blockchainError) {
        // Fallback a datos locales si blockchain falla
        console.log("Blockchain no disponible, retornando estadísticas por defecto para usuario");
        res.json({
          totalBottles: 0,
          totalDeposits: 0,
          totalBatches: 0,
          environmentalImpact: "0.0"
        });
      }
    } catch (error) {
      console.error("Error obteniendo estadísticas de usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Blockchain routes - Backend invisible para trazabilidad
  const blockchainEventSchema = z.object({
    batchId: z.string().min(1, "ID de lote requerido"),
    eventType: z.string().min(1, "Tipo de evento requerido"),
    description: z.string().min(1, "Descripción requerida"),
    location: z.string().min(1, "Ubicación requerida"),
    bottleCount: z.number().min(1, "Cantidad de botellas requerida"),
    userId: z.number().optional().nullable(),
    userEmail: z.string().optional().nullable()
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

      // Adaptar al nuevo formato del contrato
      const result = await blockchainService.registerEvent(
        'Deposit', // Tipo de evento para depósitos de usuarios
        [], // Sin IDs relacionados para depósitos iniciales
        eventData.location,
        eventData.bottleCount,
        eventData.description,
        eventData.userId,
        eventData.userEmail
      );

      res.json({
        success: true,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        eventId: result.eventId,
        eventType: result.eventType,
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

  // Nuevo endpoint para registrar eventos multi-etapa específicos
  app.post('/api/blockchain/register-multi-stage', async (req, res) => {
    try {
      const { eventType, relatedIds, location, quantity, description } = req.body;

      const validEventTypes = ['Deposit', 'Batch', 'Process', 'Product'];
      if (!validEventTypes.includes(eventType)) {
        return res.status(400).json({ 
          error: `Tipo de evento inválido. Debe ser: ${validEventTypes.join(', ')}` 
        });
      }

      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
        return;
      }

      const result = await blockchainService.registerEvent(
        eventType,
        relatedIds || [],
        location,
        quantity,
        description
      );

      res.json({
        success: true,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        eventId: result.eventId,
        eventType: result.eventType,
        mode: "blockchain"
      });
    } catch (error) {
      console.error("Error registrando evento multi-etapa:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al registrar evento" 
      });
    }
  });

  // Endpoint para obtener un evento específico
  app.get('/api/blockchain/event/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;

      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
        return;
      }

      const event = await blockchainService.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          error: "Evento no encontrado"
        });
      }

      res.json({
        success: true,
        event: event,
        mode: "blockchain"
      });
    } catch (error) {
      console.error("Error consultando evento:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al consultar evento" 
      });
    }
  });

  // Endpoint para obtener cadena completa de trazabilidad
  app.get('/api/blockchain/traceability/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;

      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
        return;
      }

      const chain = await blockchainService.getTraceabilityChain(eventId);

      res.json({
        success: true,
        chain: chain,
        totalEvents: chain.length,
        mode: "blockchain"
      });
    } catch (error) {
      console.error("Error construyendo cadena de trazabilidad:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al obtener trazabilidad" 
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

  // Endpoint para obtener eventos de depósito disponibles para lotes
  app.get("/api/blockchain/deposit-events", async (req, res) => {
    try {
      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          events: [],
          mode: "offline"
        });
        return;
      }

      // Intentar obtener eventos reales del contrato
      try {
        const depositEvents = await blockchainService.getEventsByType('Deposit');
        res.json({
          success: true,
          events: depositEvents,
          totalEvents: depositEvents.length,
          mode: "blockchain"
        });
      } catch (contractError) {
        console.log("Error accediendo al contrato:", contractError.message);
        res.status(500).json({ 
          success: false, 
          error: `Error de compatibilidad con contrato: ${contractError.message}`,
          events: [],
          debug: "El ABI del contrato no coincide con la implementación desplegada"
        });
      }
    } catch (error) {
      console.error("Error obteniendo eventos de depósito:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al obtener eventos de depósito",
        events: []
      });
    }
  });

  // Endpoint para obtener eventos de lote disponibles para procesar
  app.get("/api/blockchain/batch-events", async (req, res) => {
    try {
      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          events: [],
          mode: "offline"
        });
        return;
      }

      // Obtener eventos de tipo Batch del contrato
      try {
        const batchEvents = await blockchainService.getEventsByType('Batch');
        res.json({
          success: true,
          events: batchEvents,
          totalEvents: batchEvents.length,
          mode: "blockchain"
        });
      } catch (contractError) {
        console.log("Error accediendo eventos de lote:", contractError.message);
        res.status(500).json({ 
          success: false, 
          error: `Error de compatibilidad con contrato: ${contractError.message}`,
          events: [],
          debug: "No se pudieron obtener eventos de lote desde blockchain"
        });
      }
    } catch (error) {
      console.error("Error obteniendo eventos de lote:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al obtener eventos de lote",
        events: []
      });
    }
  });

  // Endpoint para obtener eventos de proceso disponibles
  app.get("/api/blockchain/process-events", async (req, res) => {
    try {
      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          events: [],
          mode: "offline"
        });
        return;
      }

      // Obtener eventos de tipo Process del contrato
      try {
        const processEvents = await blockchainService.getEventsByType('Process');
        res.json({
          success: true,
          events: processEvents,
          totalEvents: processEvents.length,
          mode: "blockchain"
        });
      } catch (contractError) {
        console.log("Error accediendo eventos de proceso:", contractError.message);
        res.status(500).json({ 
          success: false, 
          error: `Error de compatibilidad con contrato: ${contractError.message}`,
          events: [],
          debug: "No se pudieron obtener eventos de proceso desde blockchain"
        });
      }
    } catch (error) {
      console.error("Error obteniendo eventos de proceso:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al obtener eventos de proceso",
        events: []
      });
    }
  });

  // Endpoint para obtener eventos de productos finales
  app.get("/api/blockchain/product-events", async (req, res) => {
    try {
      if (!blockchainService.isReady()) {
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          events: [],
          mode: "offline"
        });
        return;
      }

      // Obtener eventos de tipo Product del contrato
      try {
        const productEvents = await blockchainService.getEventsByType('Product');
        res.json({
          success: true,
          events: productEvents,
          totalEvents: productEvents.length,
          mode: "blockchain"
        });
      } catch (contractError) {
        console.log("Error accediendo eventos de producto:", contractError.message);
        res.status(500).json({ 
          success: false, 
          error: `Error de compatibilidad con contrato: ${contractError.message}`,
          events: [],
          debug: "No se pudieron obtener eventos de producto desde blockchain"
        });
      }
    } catch (error) {
      console.error("Error obteniendo eventos de producto:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al obtener eventos de producto",
        events: []
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
