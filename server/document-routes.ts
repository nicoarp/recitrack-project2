/**
 * MINI-ERP: Rutas para gestión de documentos
 * Funcionalidad exclusiva para usuarios con rol 'centro_acopio'
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { db } from './db';
import { documents, users } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Schema de validación para subida de documentos
const uploadDocumentSchema = z.object({
  documentType: z.enum(['boleta', 'guia', 'certificado', 'contrato', 'otro']),
  description: z.string().optional(),
  tags: z.string().optional(),
  batchId: z.string().optional(),
  blockchainEventId: z.string().optional(),
  isPublic: z.boolean().default(false)
});

export const documentRoutes = express.Router();

// Middleware para verificar permisos de centro de acopio
const requireCentroAcopio = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  const userRole = req.user.role;
  if (userRole !== 'centro_acopio' && userRole !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Solo usuarios con rol "centro_acopio" pueden gestionar documentos.' 
    });
  }
  
  next();
};

// POST /api/documents/upload - Subir nuevo documento
documentRoutes.post('/upload', requireCentroAcopio, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    // Validar datos del formulario
    const validationResult = uploadDocumentSchema.safeParse({
      documentType: req.body.documentType,
      description: req.body.description,
      tags: req.body.tags,
      batchId: req.body.batchId ? parseInt(req.body.batchId) : undefined,
      blockchainEventId: req.body.blockchainEventId ? parseInt(req.body.blockchainEventId) : undefined,
      isPublic: req.body.isPublic === 'true'
    });

    if (!validationResult.success) {
      // Eliminar archivo subido si la validación falla
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    // Calcular hash del archivo para integridad
    const fileBuffer = await fs.readFile(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Procesar tags
    const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Crear registro en base de datos
    const [document] = await db.insert(documents).values({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      fileHash,
      documentType: data.documentType,
      description: data.description,
      tags,
      batchId: data.batchId,
      blockchainEventId: data.blockchainEventId,
      uploadedBy: req.user.id,
      isPublic: data.isPublic
    }).returning();

    res.status(201).json({
      message: 'Documento subido exitosamente',
      document: {
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        fileSize: document.fileSize,
        documentType: document.documentType,
        description: document.description,
        tags: document.tags,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Error al subir documento:', error);
    
    // Limpiar archivo si algo falló
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/documents - Listar documentos con filtros
documentRoutes.get('/', requireCentroAcopio, async (req: any, res) => {
  try {
    const { documentType, batchId, search, page = 1, limit = 20 } = req.query;
    
    let query = db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        originalName: documents.originalName,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        documentType: documents.documentType,
        description: documents.description,
        tags: documents.tags,
        batchId: documents.batchId,
        blockchainEventId: documents.blockchainEventId,
        isPublic: documents.isPublic,
        status: documents.status,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        uploaderName: users.name
      })
      .from(documents)
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(eq(documents.status, 'active'))
      .orderBy(desc(documents.createdAt));

    // Aplicar filtros
    const whereConditions = [eq(documents.status, 'active')];
    
    if (documentType) {
      whereConditions.push(eq(documents.documentType, documentType));
    }
    
    if (batchId) {
      whereConditions.push(eq(documents.batchId, parseInt(batchId)));
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const results = await query
      .where(and(...whereConditions))
      .limit(parseInt(limit))
      .offset(offset);

    res.json({
      documents: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length
      }
    });

  } catch (error) {
    console.error('Error al listar documentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/documents/:id/download - Descargar documento
documentRoutes.get('/:id/download', requireCentroAcopio, async (req: any, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const [document] = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.id, documentId),
        eq(documents.status, 'active')
      ));

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Verificar que el archivo existe
    try {
      await fs.access(document.filePath);
    } catch {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);
    
    // Enviar archivo
    res.sendFile(path.resolve(document.filePath));

  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/documents/:id - Eliminar documento (soft delete)
documentRoutes.delete('/:id', requireCentroAcopio, async (req: any, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const [document] = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.id, documentId),
        eq(documents.status, 'active')
      ));

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Verificar permisos (solo el usuario que subió o admin puede eliminar)
    if (document.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este documento' });
    }

    // Soft delete
    await db
      .update(documents)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    res.json({ message: 'Documento eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/documents/stats - Estadísticas de documentos
documentRoutes.get('/stats', requireCentroAcopio, async (req: any, res) => {
  try {
    // Obtener estadísticas básicas
    const [totalDocs] = await db
      .select({ count: documents.id })
      .from(documents)
      .where(eq(documents.status, 'active'));

    // Documentos por tipo
    const docsByType = await db
      .select({
        documentType: documents.documentType,
        count: documents.id
      })
      .from(documents)
      .where(eq(documents.status, 'active'))
      .groupBy(documents.documentType);

    res.json({
      totalDocuments: totalDocs || 0,
      documentsByType: docsByType || [],
      supportedTypes: ['boleta', 'guia', 'certificado', 'contrato', 'otro']
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});