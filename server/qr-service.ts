import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { qrCodes, qrValidations, bottleDeposits, type QrCode, type QrValidation, type InsertQrCode, type InsertQrValidation } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { blockchainService } from './blockchain.js';

interface QrGenerationOptions {
  eventId?: string;
  eventType: 'Deposit' | 'Batch' | 'Process' | 'Product';
  metadata?: any;
  createdBy?: string;
}

interface QrValidationData {
  qrId: string;
  phase: 'Deposit' | 'Batch' | 'Process' | 'Product';
  validatedBy: string;
  location: string;
  evidenceHash?: string;
  evidenceMetadata?: any;
  notes?: string;
}

export class QrService {
  /**
   * Genera un código QR único para un evento
   */
  async generateQrCode(options: QrGenerationOptions): Promise<{
    success: boolean;
    qrCode?: QrCode;
    qrImage?: string;
    error?: string;
  }> {
    try {
      const qrId = uuidv4();
      
      // Crear datos para el QR que incluyan información identificativa
      const qrData = {
        qrId,
        eventId: options.eventId,
        eventType: options.eventType,
        timestamp: Date.now(),
        system: 'Recitrack',
      };

      const qrCodeData = JSON.stringify(qrData);
      
      // Generar imagen QR en base64
      const qrImageBase64 = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256
      });

      // Guardar en base de datos
      const qrCodeRecord: InsertQrCode = {
        qrId,
        eventId: options.eventId,
        eventType: options.eventType,
        qrCodeData,
        qrImageBase64,
        status: 'active',
        metadata: options.metadata,
        createdBy: options.createdBy,
      };

      const [insertedQrCode] = await db.insert(qrCodes).values(qrCodeRecord).returning();

      console.log(`📱 QR generado exitosamente: ${qrId} para evento ${options.eventType}`);
      
      return {
        success: true,
        qrCode: insertedQrCode,
        qrImage: qrImageBase64
      };
    } catch (error: any) {
      console.error('Error generando código QR:', error);
      return {
        success: false,
        error: error.message || 'Error al generar código QR'
      };
    }
  }

  /**
   * Busca un código QR por su ID
   */
  async getQrCodeById(qrId: string): Promise<QrCode | undefined> {
    try {
      const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.qrId, qrId));
      return qrCode;
    } catch (error) {
      console.error('Error obteniendo código QR:', error);
      return undefined;
    }
  }

  /**
   * Obtiene el historial de validaciones de un QR
   */
  async getQrValidationHistory(qrId: string): Promise<QrValidation[]> {
    try {
      const validations = await db.select().from(qrValidations).where(eq(qrValidations.qrId, qrId));
      return validations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error obteniendo historial de validaciones:', error);
      return [];
    }
  }

  /**
   * Verifica si un QR ya fue validado en una fase específica
   */
  async checkDuplicateValidation(qrId: string, phase: string): Promise<{
    isDuplicate: boolean;
    existingValidation?: QrValidation;
    message?: string;
  }> {
    try {
      const [existingValidation] = await db
        .select()
        .from(qrValidations)
        .where(and(
          eq(qrValidations.qrId, qrId),
          eq(qrValidations.phase, phase)
        ));

      if (existingValidation) {
        return {
          isDuplicate: true,
          existingValidation,
          message: `QR ya fue validado en la fase ${phase} el ${existingValidation.timestamp.toISOString()}`
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error verificando validación duplicada:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Valida un código QR en un punto de control
   */
  async validateQrCode(validationData: QrValidationData): Promise<{
    success: boolean;
    validation?: QrValidation;
    blockchainResult?: any;
    qrStatus?: string;
    error?: string;
    errorType?: string;
  }> {
    try {
      // 1. Verificar que el QR existe
      const qrCode = await this.getQrCodeById(validationData.qrId);
      if (!qrCode) {
        return {
          success: false,
          error: 'Código QR no encontrado',
          errorType: 'QR_NOT_FOUND'
        };
      }

      // 2. Verificar que no haya validación duplicada
      const duplicateCheck = await this.checkDuplicateValidation(validationData.qrId, validationData.phase);
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          error: duplicateCheck.message,
          errorType: 'DUPLICATE_VALIDATION'
        };
      }

      // 3. Obtener historial para determinar la fase anterior
      const history = await this.getQrValidationHistory(validationData.qrId);
      const previousPhase = history.length > 0 ? history[history.length - 1].phase : undefined;

      // 4. Validar secuencia de fases
      const validationResult = this.validatePhaseSequence(previousPhase, validationData.phase);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          errorType: 'INVALID_PHASE_SEQUENCE'
        };
      }

      console.log(`🔍 Validando QR ${validationData.qrId} en fase ${validationData.phase}`);
      console.log(`📍 Ubicación: ${validationData.location}`);
      console.log(`👤 Validado por: ${validationData.validatedBy}`);

      // 5. Registrar evento en blockchain (si es una fase que lo requiere)
      let blockchainResult = null;
      if (this.shouldRegisterInBlockchain(validationData.phase)) {
        // Determinar IDs relacionados basados en el historial
        const relatedIds = this.getRelatedIds(qrCode, history);
        
        try {
          blockchainResult = await blockchainService.registerEvent(
            validationData.phase,
            relatedIds,
            validationData.location,
            this.estimateQuantity(validationData.phase, history.length + 1),
            `Validación QR ${validationData.phase}: ${validationData.notes || 'Sin notas'}`,
            validationData.evidenceHash || ''
          );

          if (!blockchainResult.success) {
            console.warn(`⚠️ Error en blockchain para QR ${validationData.qrId}:`, blockchainResult.error);
          }
        } catch (error: any) {
          console.error(`❌ Error registrando en blockchain:`, error);
          blockchainResult = {
            success: false,
            error: error.message,
            errorType: 'BLOCKCHAIN_ERROR'
          };
        }
      }

      // 6. Guardar validación en base de datos
      const validationRecord: InsertQrValidation = {
        qrId: validationData.qrId,
        eventId: blockchainResult?.eventId,
        phase: validationData.phase,
        previousPhase,
        validatedBy: validationData.validatedBy,
        location: validationData.location,
        evidenceHash: validationData.evidenceHash,
        evidenceMetadata: validationData.evidenceMetadata,
        txHash: blockchainResult?.txHash,
        blockNumber: blockchainResult?.blockNumber,
        validationStatus: blockchainResult?.success ? 'confirmed' : 'pending',
        notes: validationData.notes,
      };

      const [insertedValidation] = await db.insert(qrValidations).values(validationRecord).returning();

      if (validationData.phase === 'Deposit' && qrCode.eventId) {
        await db
          .update(bottleDeposits)
          .set({
            isValidated: true,
            validatedBy: parseInt(validationData.validatedBy, 10), // aquí debe ir un ID numérico
            validatedAt: new Date()
        })
        .where(eq(bottleDeposits.depositId, qrCode.eventId));
      }

      // 7. Actualizar estado del QR si es la fase final
      if (validationData.phase === 'Product') {
        await db.update(qrCodes)
          .set({ 
            status: 'completed',
            updatedAt: new Date()
          })
          .where(eq(qrCodes.qrId, validationData.qrId));
      }

      console.log(`✅ Validación QR completada exitosamente para ${validationData.qrId}`);

      return {
        success: true,
        validation: insertedValidation,
        blockchainResult,
        qrStatus: validationData.phase === 'Product' ? 'completed' : 'validated'
      };

    } catch (error: any) {
      console.error('Error validando código QR:', error);
      return {
        success: false,
        error: error.message || 'Error al validar código QR',
        errorType: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Valida la secuencia correcta de fases
   */
  private validatePhaseSequence(previousPhase: string | undefined, currentPhase: string): {
    isValid: boolean;
    error?: string;
  } {
    const phaseOrder = ['Deposit', 'Batch', 'Process', 'Product'];
    
    if (!previousPhase && currentPhase !== 'Deposit') {
      return {
        isValid: false,
        error: 'La primera validación debe ser en fase Deposit'
      };
    }

    if (previousPhase) {
      const previousIndex = phaseOrder.indexOf(previousPhase);
      const currentIndex = phaseOrder.indexOf(currentPhase);

      if (currentIndex !== previousIndex + 1) {
        return {
          isValid: false,
          error: `Secuencia de fases inválida. Después de ${previousPhase} debe seguir ${phaseOrder[previousIndex + 1]}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Determina si una fase debe registrarse en blockchain
   */
  private shouldRegisterInBlockchain(phase: string): boolean {
    return ['Deposit', 'Batch', 'Process', 'Product'].includes(phase);
  }

  /**
   * Obtiene IDs relacionados basados en el QR y su historial
   */
  private getRelatedIds(qrCode: QrCode, history: QrValidation[]): string[] {
    if (qrCode.eventId) {
      return [qrCode.eventId];
    }
    
    // Si no hay eventId inicial, usar IDs de validaciones previas
    return history
      .filter(v => v.eventId)
      .map(v => v.eventId!)
      .slice(-3); // Tomar los últimos 3 eventos relacionados
  }

  /**
   * Estima la cantidad basada en la fase y número de validaciones
   */
  private estimateQuantity(phase: string, validationCount: number): number {
    const baseQuantity = {
      'Deposit': 10,
      'Batch': 50,
      'Process': 30,
      'Product': 15
    };

    return baseQuantity[phase as keyof typeof baseQuantity] || 10;
  }

  /**
   * Decodifica datos de QR escaneado
   */
  decodeQrData(qrString: string): {
    success: boolean;
    qrId?: string;
    eventType?: string;
    error?: string;
  } {
    try {
      const data = JSON.parse(qrString);
      
      if (!data.qrId || !data.system || data.system !== 'Recitrack') {
        return {
          success: false,
          error: 'Código QR no válido para el sistema Recitrack'
        };
      }

      return {
        success: true,
        qrId: data.qrId,
        eventType: data.eventType
      };
    } catch (error) {
      return {
        success: false,
        error: 'Formato de código QR inválido'
      };
    }
  }
}

export const qrService = new QrService();