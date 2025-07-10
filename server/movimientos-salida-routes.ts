/**
 * RUTAS PARA MOVIMIENTOS DE SALIDA DE MATERIALES
 * Funcionalidad exclusiva para usuarios con rol 'centro_acopio' o 'admin'
 */

import express from "express";
import { z } from "zod";
import { storage } from "./database-storage";
import { insertMovimientoSalidaSchema, type InsertMovimientoSalida } from "@shared/schema";

export const movimientosSalidaRoutes = express.Router();

/**
 * GET /api/movimientos-salida
 * Obtiene todos los movimientos de salida
 * Filtrable por usuario, estado, tipo de residuo, etc.
 */
movimientosSalidaRoutes.get("/", async (req, res) => {
  try {
    const { userId, estado, tipoResiduo, batchId } = req.query;
    
    let movimientos;
    
    if (userId) {
      movimientos = await storage.getMovimientosSalidasByUser(Number(userId));
    } else if (batchId) {
      movimientos = await storage.getMovimientosSalidasByBatch(Number(batchId));
    } else {
      movimientos = await storage.getAllMovimientosSalidas();
    }
    
    // Filtrar por estado si se especifica
    if (estado && typeof estado === 'string') {
      movimientos = movimientos.filter(m => m.estado === estado);
    }
    
    // Filtrar por tipo de residuo si se especifica
    if (tipoResiduo && typeof tipoResiduo === 'string') {
      movimientos = movimientos.filter(m => m.tipoResiduo === tipoResiduo);
    }
    
    res.json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos de salida:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al obtener movimientos de salida"
    });
  }
});

/**
 * GET /api/movimientos-salida/:id
 * Obtiene un movimiento de salida específico por ID
 */
movimientosSalidaRoutes.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const movimiento = await storage.getMovimientoSalida(Number(id));
    
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: "Movimiento de salida no encontrado"
      });
    }
    
    res.json(movimiento);
  } catch (error) {
    console.error("Error al obtener movimiento de salida:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al obtener movimiento de salida"
    });
  }
});

/**
 * POST /api/movimientos-salida
 * Crea un nuevo movimiento de salida de materiales
 * Solo disponible para centros de acopio y administradores
 */
movimientosSalidaRoutes.post("/", async (req, res) => {
  try {
    console.log("🔍 Creando movimiento de salida:", req.body);
    
    // Validar datos de entrada
    const validationResult = insertMovimientoSalidaSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.error("❌ Error de validación:", validationResult.error.format());
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: validationResult.error.format()
      });
    }
    
    const movimientoData = validationResult.data;
    
    // Validar que el usuario existe
    const usuario = await storage.getUser(movimientoData.creadoPor);
    if (!usuario) {
      return res.status(400).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }
    
    // Validar rol del usuario (solo centro_acopio y admin pueden crear movimientos)
    if (usuario.role !== 'centro_acopio' && usuario.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Acceso denegado: Solo los centros de acopio y administradores pueden registrar salidas de materiales"
      });
    }
    
    // Si se especifica un batchId, validar que existe
    if (movimientoData.batchId) {
      const batchExists = await storage.getBottleDeposit(movimientoData.batchId);
      if (!batchExists) {
        return res.status(400).json({
          success: false,
          error: "Lote especificado no encontrado"
        });
      }
    }
    
    // Crear el movimiento de salida
    const nuevoMovimiento = await storage.createMovimientoSalida(movimientoData);
    
    console.log("✅ Movimiento de salida creado exitosamente:", nuevoMovimiento.id);
    
    res.status(201).json({
      success: true,
      data: nuevoMovimiento,
      message: "Movimiento de salida registrado exitosamente"
    });
    
  } catch (error) {
    console.error("❌ Error al crear movimiento de salida:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al crear movimiento de salida"
    });
  }
});

/**
 * PUT /api/movimientos-salida/:id
 * Actualiza un movimiento de salida existente
 */
movimientosSalidaRoutes.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el movimiento existe
    const movimientoExistente = await storage.getMovimientoSalida(Number(id));
    if (!movimientoExistente) {
      return res.status(404).json({
        success: false,
        error: "Movimiento de salida no encontrado"
      });
    }
    
    // Validar datos de entrada (permitir actualizaciones parciales)
    const updateSchema = insertMovimientoSalidaSchema.partial();
    const validationResult = updateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: validationResult.error.format()
      });
    }
    
    const updateData = validationResult.data;
    
    // Actualizar el movimiento
    const movimientoActualizado = await storage.updateMovimientoSalida(Number(id), updateData);
    
    res.json({
      success: true,
      data: movimientoActualizado,
      message: "Movimiento de salida actualizado exitosamente"
    });
    
  } catch (error) {
    console.error("Error al actualizar movimiento de salida:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al actualizar movimiento de salida"
    });
  }
});

/**
 * DELETE /api/movimientos-salida/:id
 * Elimina un movimiento de salida
 */
movimientosSalidaRoutes.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el movimiento existe
    const movimientoExistente = await storage.getMovimientoSalida(Number(id));
    if (!movimientoExistente) {
      return res.status(404).json({
        success: false,
        error: "Movimiento de salida no encontrado"
      });
    }
    
    // Eliminar el movimiento
    const eliminado = await storage.deleteMovimientoSalida(Number(id));
    
    if (eliminado) {
      res.json({
        success: true,
        message: "Movimiento de salida eliminado exitosamente"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "No se pudo eliminar el movimiento de salida"
      });
    }
    
  } catch (error) {
    console.error("Error al eliminar movimiento de salida:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al eliminar movimiento de salida"
    });
  }
});

/**
 * GET /api/movimientos-salida/reportes/resumen
 * Genera reportes de resumen de movimientos de salida
 */
movimientosSalidaRoutes.get("/reportes/resumen", async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipoResiduo } = req.query;
    
    let movimientos = await storage.getAllMovimientosSalidas();
    
    // Filtrar por fecha si se especifica
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio as string);
      const fin = new Date(fechaFin as string);
      movimientos = movimientos.filter(m => 
        m.fecha >= inicio && m.fecha <= fin
      );
    }
    
    // Filtrar por tipo de residuo si se especifica
    if (tipoResiduo && typeof tipoResiduo === 'string') {
      movimientos = movimientos.filter(m => m.tipoResiduo === tipoResiduo);
    }
    
    // Calcular estadísticas
    const resumen = {
      totalMovimientos: movimientos.length,
      pesoTotal: movimientos.reduce((sum, m) => sum + m.peso, 0),
      tiposResiduos: [...new Set(movimientos.map(m => m.tipoResiduo))],
      destinosUnicos: [...new Set(movimientos.map(m => m.destino))],
      movimientosPorEstado: movimientos.reduce((acc, m) => {
        acc[m.estado] = (acc[m.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      movimientosPorTipo: movimientos.reduce((acc, m) => {
        acc[m.tipoResiduo] = (acc[m.tipoResiduo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
    };
    
    res.json({
      success: true,
      data: resumen
    });
    
  } catch (error) {
    console.error("Error al generar reporte de resumen:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al generar reporte"
    });
  }
});