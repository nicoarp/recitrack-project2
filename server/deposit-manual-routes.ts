/**
 * RUTAS PARA REGISTRO MANUAL DE DEPÓSITOS
 * Funcionalidad para centros de acopio que reciben material de donantes sin QR
 */

import express from 'express';
import { z } from 'zod';
import { storage } from './database-storage';
import { insertBottleDepositSchema } from '@shared/schema';

export const depositManualRoutes = express.Router();

// Esquema de validación para depósitos manuales
const depositManualSchema = z.object({
  tipo_material: z.string().min(1, "Tipo de material es requerido"),
  weightKg: z.number().positive("El peso debe ser positivo"),
  donante_nombre: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  location: z.string().min(1, "Ubicación es requerida"),
  depositId: z.string().min(1, "ID del punto de depósito es requerido"),
});

type DepositManualInput = z.infer<typeof depositManualSchema>;

/**
 * POST /api/deposit-manual
 * Registra un nuevo depósito manual para donantes sin QR
 */
depositManualRoutes.post('/', async (req, res) => {
  try {
    // Verificar que el usuario tenga rol de centro de acopio
    if (!req.user || !['centro_acopio', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Solo centros de acopio pueden registrar depósitos manuales.'
      });
    }

    // Validar datos del formulario
    const validatedData = depositManualSchema.parse(req.body);
    
    // Validaciones adicionales de seguridad
    if (validatedData.weightKg <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El peso debe ser mayor a 0 kg'
      });
    }

    if (validatedData.weightKg > 1000) {
      return res.status(400).json({
        success: false,
        error: 'El peso no puede ser mayor a 1000 kg'
      });
    }

    // Generar batch ID único para el depósito manual
    const batchId = Date.now();
    
    // Crear registro de depósito manual
    const depositData = {
      batchId,
      bottleCount: 0, // No aplica para depósitos manuales
      weightKg: validatedData.weightKg,
      location: validatedData.location,
      depositId: validatedData.depositId,
      userId: req.user.id,
      origen: 'manual' as const,
      donante_nombre: validatedData.donante_nombre || 'Anónimo',
      tipo_material: validatedData.tipo_material,
      notes: validatedData.notes || '',
      photos: validatedData.photos || [],
      isValidated: true, // Los depósitos manuales se validan automáticamente
      validatedBy: req.user.id,
      validatedAt: new Date(),
      // Campos opcionales para blockchain (no se registran en blockchain)
      contractStatus: 'manual',
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || '',
      deviceInfo: 'Centro de Acopio - Registro Manual',
    };

    const deposit = await storage.createBottleDeposit(depositData);

    res.json({
      success: true,
      data: {
        id: deposit.id,
        batchId: deposit.batchId,
        tipo_material: deposit.tipo_material,
        weightKg: deposit.weightKg,
        donante_nombre: deposit.donante_nombre,
        location: deposit.location,
        createdAt: deposit.createdAt,
        origen: deposit.origen
      }
    });

  } catch (error) {
    console.error('Error al registrar depósito manual:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/deposit-manual/history
 * Obtiene el historial de depósitos manuales del centro de acopio
 */
depositManualRoutes.get('/history', async (req, res) => {
  try {
    if (!req.user || !['centro_acopio', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado'
      });
    }

    // Obtener todos los depósitos manuales
    const deposits = await storage.getAllBottleDeposits();
    
    const manualDeposits = deposits.filter(deposit => 
      deposit.origen === 'manual' && 
      (['centro_acopio', 'admin'].includes(req.user.role) || deposit.userId === req.user.id)
    );

    res.json({
      success: true,
      data: manualDeposits.map(deposit => ({
        id: deposit.id,
        batchId: deposit.batchId,
        tipo_material: deposit.tipo_material,
        weightKg: deposit.weightKg,
        donante_nombre: deposit.donante_nombre,
        location: deposit.location,
        notes: deposit.notes,
        photos: deposit.photos,
        createdAt: deposit.createdAt,
        origen: deposit.origen
      }))
    });

  } catch (error) {
    console.error('Error al obtener historial de depósitos manuales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/deposit-manual/stats
 * Obtiene estadísticas de depósitos manuales
 */
depositManualRoutes.get('/stats', async (req, res) => {
  try {
    if (!req.user || !['centro_acopio', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado'
      });
    }

    const deposits = await storage.getAllBottleDeposits();
    const manualDeposits = deposits.filter(deposit => deposit.origen === 'manual');
    
    const stats = {
      totalDeposits: manualDeposits.length,
      totalWeight: manualDeposits.reduce((sum, deposit) => sum + deposit.weightKg, 0),
      byMaterial: manualDeposits.reduce((acc, deposit) => {
        const material = deposit.tipo_material || 'Sin especificar';
        acc[material] = (acc[material] || 0) + deposit.weightKg;
        return acc;
      }, {} as Record<string, number>),
      today: manualDeposits.filter(deposit => {
        const today = new Date();
        const depositDate = new Date(deposit.createdAt);
        return depositDate.toDateString() === today.toDateString();
      }).length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de depósitos manuales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});