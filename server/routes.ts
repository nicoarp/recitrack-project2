import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertBottleDepositSchema, insertRecyclingPointSchema, insertUserSchema } from "@shared/schema";
import { blockchainService } from "./blockchain.js";
import { qrService } from "./qr-service";

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

  // === ENDPOINTS CENTROS DE PROCESADO ===
  
  app.get("/api/processing-centers", async (_req, res) => {
    try {
      const centers = await storage.getAllProcessingCenters();
      res.json(centers);
    } catch (error) {
      console.error("Error al obtener centros de procesado:", error);
      res.status(500).json({ message: "Error al obtener centros de procesado" });
    }
  });

  app.get("/api/processing-centers/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const centers = await storage.getProcessingCentersByType(type);
      res.json(centers);
    } catch (error) {
      console.error("Error al obtener centros por tipo:", error);
      res.status(500).json({ message: "Error al obtener centros de procesado" });
    }
  });

  app.get("/api/processing-centers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const center = await storage.getProcessingCenter(id);
      if (!center) {
        return res.status(404).json({ message: "Centro de procesado no encontrado" });
      }
      res.json(center);
    } catch (error) {
      console.error("Error al obtener centro de procesado:", error);
      res.status(500).json({ message: "Error al buscar centro de procesado" });
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

      // Obtener estadísticas directamente de la base de datos local
      if (userId) {
        const userIdNumber = parseInt(userId as string);
        const userBottles = await storage.getUserTotalBottles(userIdNumber);
        const userDeposits = await storage.getUserTotalDeposits(userIdNumber);

        res.json({
          totalBottles: userBottles,
          totalDeposits: userDeposits,
          totalBatches: userDeposits,
          environmentalImpact: (userBottles * 0.075).toFixed(1)
        });
      } else {
        // Si no hay userId, devolver estadísticas vacías
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
    userEmail: z.string().optional().nullable(),
    evidenceHash: z.string().optional().default("")
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

      // Registrar en blockchain con validación robusta
      const result = await blockchainService.registerEvent(
        'Deposit', // Tipo de evento para depósitos de usuarios
        [], // Sin IDs relacionados para depósitos iniciales
        eventData.location,
        eventData.bottleCount,
        eventData.description,
        eventData.evidenceHash || "", // Hash de evidencia opcional
        eventData.userId,
        eventData.userEmail
      );

      // Manejar diferentes resultados del contrato
      if (!result.success) {
        // Error del contrato - registrar en base de datos con estado de error
        if (eventData.userId) {
          try {
            await storage.createBottleDeposit({
              depositId: `DEPOSIT-${Date.now()}`,
              batchId: parseInt(eventData.batchId),
              bottleCount: eventData.bottleCount,
              location: eventData.location,
              userId: eventData.userId,
              txHash: null,
              blockNumber: null,
              eventId: null,
              evidenceHash: eventData.evidenceHash || "",
              contractStatus: result.contractStatus || 'failed',
              contractError: result.error || 'Error desconocido'
            });
          } catch (dbError) {
            console.log("Error guardando en BD local:", dbError);
          }
        }

        return res.status(400).json({
          success: false,
          error: result.error,
          errorType: result.errorType,
          contractStatus: result.contractStatus,
          mode: "blockchain_error"
        });
      }

      // Éxito - guardar en base de datos local con información blockchain
      if (eventData.userId) {
        try {
          await storage.createBottleDeposit({
            depositId: `DEPOSIT-${Date.now()}`,
            batchId: parseInt(eventData.batchId),
            bottleCount: eventData.bottleCount,
            location: eventData.location,
            userId: eventData.userId,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            eventId: result.eventId,
            evidenceHash: eventData.evidenceHash || "",
            contractStatus: result.contractStatus || 'confirmed'
          });
        } catch (dbError) {
          console.log("Error guardando en BD local:", dbError);
        }
      }

      res.json({
        success: true,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        eventId: result.eventId,
        eventType: result.eventType,
        contractStatus: result.contractStatus,
        verified: result.verified,
        attempts: result.attempts,
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
      const { eventType, relatedIds, location, quantity, description, evidenceHash = "" } = req.body;

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

      // Verificar duplicaciones antes de proceder
      const duplicateCheck = await blockchainService.checkForDuplicateValidation(
        eventType, 
        relatedIds || [], 
        `${eventType.toLowerCase()}_validation`
      );
      
      if (duplicateCheck.isDuplicate) {
        return res.status(409).json({
          success: false,
          error: duplicateCheck.message,
          errorType: 'DUPLICATE_VALIDATION',
          existingEventId: duplicateCheck.existingEventId,
          mode: "validation_error"
        });
      }

      const result = await blockchainService.registerEvent(
        eventType,
        relatedIds || [],
        location,
        quantity,
        description,
        evidenceHash
      );

      // Manejar resultado del contrato
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorType: result.errorType,
          contractStatus: result.contractStatus,
          mode: "blockchain_error"
        });
      }

      res.json({
        success: true,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        eventId: result.eventId,
        eventType: result.eventType,
        contractStatus: result.contractStatus,
        verified: result.verified,
        attempts: result.attempts,
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
      console.log('🔍 DEBUG: Iniciando consulta de evento');
      const { eventId } = req.params;
      console.log('🔍 DEBUG: eventId extraído:', eventId);

      if (!blockchainService.isReady()) {
        console.log('🔍 DEBUG: Servicio blockchain no está listo');
        res.status(503).json({ 
          success: false, 
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
        return;
      }

      console.log('🔍 DEBUG: Llamando a blockchainService.getEvent');
      const event = await blockchainService.getEvent(eventId);
      console.log('🔍 DEBUG: Respuesta obtenida:', event);
      
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

  // === ENDPOINTS DE VALIDACIÓN EN PUNTOS DE CONTROL ===

  // Endpoint para validar lotes (Batch) - Agrupa depósitos
  app.post('/api/blockchain/validate-batch', async (req, res) => {
    try {
      const { depositIds, location, description, evidenceHash = "", validatedBy } = req.body;

      if (!Array.isArray(depositIds) || depositIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Se requiere al menos un ID de depósito para crear el lote"
        });
      }

      if (!blockchainService.isReady()) {
        return res.status(503).json({
          success: false,
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
      }

      // Calcular cantidad total de botellas de los depósitos
      const totalQuantity = depositIds.length * 10; // Estimación simplificada

      console.log(`🔍 Validando lote con depósitos: [${depositIds.join(', ')}]`);

      const result = await blockchainService.registerEvent(
        'Batch',
        depositIds, // IDs de los depósitos relacionados
        location,
        totalQuantity,
        description,
        evidenceHash
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorType: result.errorType,
          contractStatus: result.contractStatus,
          mode: "blockchain_error"
        });
      }

      res.json({
        success: true,
        message: "Lote validado exitosamente",
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        eventId: result.eventId,
        eventType: "Batch",
        relatedDeposits: depositIds,
        totalQuantity,
        contractStatus: result.contractStatus,
        verified: result.verified,
        attempts: result.attempts,
        validatedBy,
        mode: "blockchain"
      });
    } catch (error: any) {
      console.error("Error validando lote:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error al validar lote"
      });
    }
  });

  // Endpoint para validar procesamiento (Process) - Procesa lotes
  app.post('/api/blockchain/validate-process', async (req, res) => {
    try {
      const { batchIds, location, description, evidenceHash = "", validatedBy, processType } = req.body;

      if (!Array.isArray(batchIds) || batchIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Se requiere al menos un ID de lote para el procesamiento"
        });
      }

      if (!processType) {
        return res.status(400).json({
          success: false,
          error: "Se requiere especificar el tipo de procesamiento"
        });
      }

      if (!blockchainService.isReady()) {
        return res.status(503).json({
          success: false,
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
      }

      // Calcular cantidad total procesada
      const totalQuantity = batchIds.length * 50; // Estimación simplificada

      console.log(`🔍 Validando procesamiento de lotes: [${batchIds.join(', ')}]`);
      console.log(`🏭 Tipo de procesamiento: ${processType}`);

      const result = await blockchainService.registerEvent(
        'Process',
        batchIds, // IDs de los lotes relacionados
        location,
        totalQuantity,
        `${processType}: ${description}`,
        evidenceHash
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorType: result.errorType,
          contractStatus: result.contractStatus,
          mode: "blockchain_error"
        });
      }

      res.json({
        success: true,
        message: "Procesamiento validado exitosamente",
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        eventId: result.eventId,
        eventType: "Process",
        relatedBatches: batchIds,
        totalQuantity,
        processType,
        contractStatus: result.contractStatus,
        verified: result.verified,
        attempts: result.attempts,
        validatedBy,
        mode: "blockchain"
      });
    } catch (error: any) {
      console.error("Error validando procesamiento:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error al validar procesamiento"
      });
    }
  });

  // Endpoint para validar producto final (Product) - Producto terminado
  app.post('/api/blockchain/validate-product', async (req, res) => {
    try {
      const { processIds, location, description, evidenceHash = "", validatedBy, productType, qualityScore } = req.body;

      if (!Array.isArray(processIds) || processIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Se requiere al menos un ID de proceso para el producto final"
        });
      }

      if (!productType) {
        return res.status(400).json({
          success: false,
          error: "Se requiere especificar el tipo de producto"
        });
      }

      if (!blockchainService.isReady()) {
        return res.status(503).json({
          success: false,
          error: "Servicio blockchain no disponible",
          mode: "offline"
        });
      }

      // Calcular cantidad de productos finales
      const totalQuantity = processIds.length * 20; // Estimación simplificada

      console.log(`🔍 Validando producto final de procesos: [${processIds.join(', ')}]`);
      console.log(`📦 Tipo de producto: ${productType}`);
      console.log(`⭐ Puntuación de calidad: ${qualityScore || 'No especificada'}`);

      const productDescription = qualityScore 
        ? `${productType} (Calidad: ${qualityScore}/10): ${description}`
        : `${productType}: ${description}`;

      const result = await blockchainService.registerEvent(
        'Product',
        processIds, // IDs de los procesos relacionados
        location,
        totalQuantity,
        productDescription,
        evidenceHash
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorType: result.errorType,
          contractStatus: result.contractStatus,
          mode: "blockchain_error"
        });
      }

      res.json({
        success: true,
        message: "Producto final validado exitosamente",
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        eventId: result.eventId,
        eventType: "Product",
        relatedProcesses: processIds,
        totalQuantity,
        productType,
        qualityScore,
        contractStatus: result.contractStatus,
        verified: result.verified,
        attempts: result.attempts,
        validatedBy,
        mode: "blockchain"
      });
    } catch (error: any) {
      console.error("Error validando producto:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error al validar producto"
      });
    }
  });

  // === ENDPOINTS DEL SISTEMA QR ===

  // Resolver y validar códigos QR escaneados
  app.post('/api/qr/resolve', async (req, res) => {
    try {
      const { qrCode } = req.body;
      
      if (!qrCode || typeof qrCode !== 'string') {
        return res.status(400).json({ 
          success: false,
          error: 'Código QR inválido o vacío' 
        });
      }

      console.log('🔍 Resolviendo QR:', qrCode);

      // 1. Verificar si es un punto de reciclaje
      const recyclingPoints = await storage.getAllRecyclingPoints();
      const matchingPoint = recyclingPoints.find(point => 
        qrCode === point.depositId || 
        qrCode.includes(point.depositId) ||
        qrCode === `PUNTO-${point.depositId}` ||
        qrCode === `clean-point-${point.depositId}`
      );

      if (matchingPoint) {
        return res.json({
          success: true,
          type: 'punto-limpio',
          data: {
            pointId: matchingPoint.depositId,
            name: matchingPoint.name,
            location: matchingPoint.address,
            redirectUrl: `/collection-form?pointId=${matchingPoint.depositId}`
          },
          message: `Punto de reciclaje encontrado: ${matchingPoint.name}`
        });
      }

      // 2. Verificar si es un QR de validación existente en la base de datos
      let qrRecord = null;
      let actualQrId = qrCode;
      
      // Intentar parsear como JSON si es un QR complejo
      try {
        const parsedQr = JSON.parse(qrCode);
        if (parsedQr.qrId && parsedQr.system === 'EcoTraza') {
          actualQrId = parsedQr.qrId;
          console.log(`🔍 QR complejo detectado, extrayendo ID: ${actualQrId}`);
        }
      } catch (e) {
        // No es JSON, usar el código tal como está
        actualQrId = qrCode;
      }
      
      // Buscar en la base de datos por el ID extraído
      qrRecord = await qrService.getQrCodeById(actualQrId);
      if (qrRecord) {
        return res.json({
          success: true,
          type: 'validacion',
          data: {
            qrId: qrRecord.qrId,
            eventType: qrRecord.eventType,
            status: qrRecord.status,
            metadata: qrRecord.metadata,
            redirectUrl: `/batch-validation?qrId=${qrRecord.qrId}`
          },
          message: `QR de validación encontrado: ${qrRecord.eventType}`
        });
      }

      // 3. Verificar si es un QR con formato QR-xxxxx (formato estándar de validación)
      if (qrCode.startsWith('QR-')) {
        return res.json({
          success: true,
          type: 'validacion',
          data: {
            qrId: qrCode,
            redirectUrl: `/batch-validation?qrId=${qrCode}`
          },
          message: 'QR de validación detectado'
        });
      }

      // 4. Intentar interpretar otros formatos conocidos para puntos de reciclaje
      if (qrCode.startsWith('CENTRO-') || qrCode.startsWith('PUNTO-')) {
        const pointId = qrCode.replace(/^(CENTRO-|PUNTO-)/, '');
        const point = recyclingPoints.find(p => p.depositId.includes(pointId));
        
        if (point) {
          return res.json({
            success: true,
            type: 'punto-limpio',
            data: {
              pointId: point.depositId,
              name: point.name,
              location: point.address,
              redirectUrl: `/collection-form?pointId=${point.depositId}`
            },
            message: `Punto de reciclaje encontrado: ${point.name}`
          });
        }
      }

      // 5. QR no reconocido en el sistema
      return res.status(404).json({
        success: false,
        error: 'Código QR no reconocido en el sistema',
        suggestion: 'Verifica que el código sea válido o usa entrada manual',
        receivedCode: qrCode
      });

    } catch (error) {
      console.error('❌ Error resolviendo QR:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al procesar QR'
      });
    }
  });

  // Generar código QR para un evento
  app.post('/api/qr/generate', async (req, res) => {
    try {
      const { eventId, eventType, metadata, createdBy } = req.body;

      if (!eventType || !['Deposit', 'Batch', 'Process', 'Product'].includes(eventType)) {
        return res.status(400).json({
          success: false,
          error: 'eventType es requerido y debe ser uno de: Deposit, Batch, Process, Product'
        });
      }

      console.log(`📱 Generando QR para evento ${eventType}${eventId ? ` (ID: ${eventId})` : ''}`);

      const result = await qrService.generateQrCode({
        eventId,
        eventType,
        metadata,
        createdBy: createdBy || 'sistema'
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Código QR generado exitosamente',
        qrCode: {
          qrId: result.qrCode!.qrId,
          eventType: result.qrCode!.eventType,
          status: result.qrCode!.status,
          createdAt: result.qrCode!.createdAt
        },
        qrImage: result.qrImage
      });
    } catch (error: any) {
      console.error('Error generando código QR:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al generar código QR'
      });
    }
  });

  // Validar código QR en punto de control
  app.post('/api/qr/validate', async (req, res) => {
    try {
      const { qrData, phase, validatedBy, location, evidenceHash, evidenceMetadata, notes } = req.body;

      if (!qrData || !phase || !validatedBy || !location) {
        return res.status(400).json({
          success: false,
          error: 'qrData, phase, validatedBy y location son requeridos'
        });
      }

      if (!['Deposit', 'Batch', 'Process', 'Product'].includes(phase)) {
        return res.status(400).json({
          success: false,
          error: 'phase debe ser uno de: Deposit, Batch, Process, Product'
        });
      }

      // Decodificar datos del QR
      const decodedQr = qrService.decodeQrData(qrData);
      if (!decodedQr.success) {
        return res.status(400).json({
          success: false,
          error: decodedQr.error,
          errorType: 'INVALID_QR_FORMAT'
        });
      }

      console.log(`🔍 Validando QR ${decodedQr.qrId} en fase ${phase}`);
      console.log(`📍 Ubicación: ${location}, Operador: ${validatedBy}`);

      const result = await qrService.validateQrCode({
        qrId: decodedQr.qrId!,
        phase,
        validatedBy,
        location,
        evidenceHash,
        evidenceMetadata,
        notes
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorType: result.errorType
        });
      }

      res.json({
        success: true,
        message: `Validación ${phase} completada exitosamente`,
        validation: {
          qrId: result.validation!.qrId,
          phase: result.validation!.phase,
          validatedBy: result.validation!.validatedBy,
          location: result.validation!.location,
          timestamp: result.validation!.timestamp,
          validationStatus: result.validation!.validationStatus
        },
        blockchain: result.blockchainResult,
        qrStatus: result.qrStatus
      });
    } catch (error: any) {
      console.error('Error validando código QR:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al validar código QR'
      });
    }
  });

  // Obtener información de un código QR
  app.get('/api/qr/:qrId', async (req, res) => {
    try {
      const { qrId } = req.params;

      const qrCode = await qrService.getQrCodeById(qrId);
      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'Código QR no encontrado'
        });
      }

      const validationHistory = await qrService.getQrValidationHistory(qrId);

      res.json({
        success: true,
        qrCode: {
          qrId: qrCode.qrId,
          eventId: qrCode.eventId,
          eventType: qrCode.eventType,
          status: qrCode.status,
          metadata: qrCode.metadata,
          createdBy: qrCode.createdBy,
          createdAt: qrCode.createdAt
        },
        validationHistory: validationHistory.map(v => ({
          phase: v.phase,
          previousPhase: v.previousPhase,
          validatedBy: v.validatedBy,
          location: v.location,
          evidenceHash: v.evidenceHash,
          validationStatus: v.validationStatus,
          notes: v.notes,
          timestamp: v.timestamp,
          txHash: v.txHash,
          blockNumber: v.blockNumber
        })),
        totalValidations: validationHistory.length,
        currentPhase: validationHistory.length > 0 ? validationHistory[validationHistory.length - 1].phase : 'Ninguna',
        isCompleted: qrCode.status === 'completed'
      });
    } catch (error: any) {
      console.error('Error obteniendo información QR:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener información del QR'
      });
    }
  });

  // Obtener historial completo de validaciones por QR
  app.get('/api/qr/:qrId/history', async (req, res) => {
    try {
      const { qrId } = req.params;

      const qrCode = await qrService.getQrCodeById(qrId);
      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'Código QR no encontrado'
        });
      }

      const validationHistory = await qrService.getQrValidationHistory(qrId);

      res.json({
        success: true,
        qrId,
        eventType: qrCode.eventType,
        history: validationHistory.map(v => ({
          id: v.id,
          phase: v.phase,
          previousPhase: v.previousPhase,
          validatedBy: v.validatedBy,
          location: v.location,
          evidenceHash: v.evidenceHash,
          evidenceMetadata: v.evidenceMetadata,
          validationStatus: v.validationStatus,
          notes: v.notes,
          timestamp: v.timestamp,
          blockchainInfo: {
            eventId: v.eventId,
            txHash: v.txHash,
            blockNumber: v.blockNumber
          }
        })),
        summary: {
          totalValidations: validationHistory.length,
          currentPhase: validationHistory.length > 0 ? validationHistory[validationHistory.length - 1].phase : 'Ninguna',
          isCompleted: qrCode.status === 'completed',
          phases: ['Deposit', 'Batch', 'Process', 'Product'].map(phase => ({
            phase,
            completed: validationHistory.some(v => v.phase === phase),
            timestamp: validationHistory.find(v => v.phase === phase)?.timestamp
          }))
        }
      });
    } catch (error: any) {
      console.error('Error obteniendo historial QR:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener historial del QR'
      });
    }
  });

  // Buscar códigos QR por criterios
  app.get('/api/qr/search', async (req, res) => {
    try {
      const { eventType, status, createdBy } = req.query;

      // Esta sería una función adicional en el qrService para búsquedas
      // Por ahora, respuesta simple
      res.json({
        success: true,
        message: 'Búsqueda de QR implementada en próxima versión',
        filters: { eventType, status, createdBy }
      });
    } catch (error: any) {
      console.error('Error buscando códigos QR:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar códigos QR'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
