// LÓGICA BATCH 2025-07: Script de prueba para el endpoint POST /api/batch
// Este archivo sirve como documentación y testing del nuevo sistema de agrupación

const testData = {
  // Ejemplo de REQUEST válido
  validRequest: {
    depositIds: ["EVT-1751148213", "EVT-1751148214", "EVT-1751148215"],
    totalWeight: 45.5,
    weightAdjustment: {
      originalSum: 42.3,
      adjustedWeight: 45.5,
      reason: "Ajuste por humedad detectada en materiales",
      operatorComment: "Diferencia del 7.6% dentro de rango normal según protocolo"
    },
    operatorData: {
      operatorName: "Juan Pérez López",
      operatorRut: "12.345.678-9",
      centerId: "CENTRO-001",
      centerName: "Centro de Acopio Norte"
    },
    evidence: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...", // Imagen base64
    location: "Centro de Acopio Norte - Calle Principal 123"
  },

  // Ejemplo de RESPONSE exitoso esperado
  successResponse: {
    success: true,
    batch: {
      batchId: "BATCH-2025-06-30-213",
      eventId: "EVT-1751305200",
      qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      qrId: "b7d4e891-2f3a-4c56-9e1b-8a7c3f5d2e4b",
      totalDeposits: 3,
      totalWeight: 45.5,
      weightAdjustment: {
        originalSum: 42.3,
        adjustedWeight: 45.5,
        adjustmentPercent: "7.6",
        reason: "Ajuste por humedad detectada en materiales"
      },
      status: "created",
      blockchainTxHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
      blockNumber: 12345678,
      gasUsed: "250000",
      createdAt: "2025-06-30T18:45:23.456Z",
      location: "Centro de Acopio Norte - Calle Principal 123",
      operatorInfo: {
        name: "Juan Pérez López",
        rut: "12.345.678-9",
        centerId: "CENTRO-001"
      }
    },
    processedDeposits: [
      {
        eventId: "EVT-1751148213",
        originalWeight: 15.2,
        location: "Punto Limpio Central",
        status: "batched"
      },
      {
        eventId: "EVT-1751148214", 
        originalWeight: 14.1,
        location: "Punto Limpio Central",
        status: "batched"
      },
      {
        eventId: "EVT-1751148215",
        originalWeight: 13.0,
        location: "Punto Limpio Central", 
        status: "batched"
      }
    ],
    validationSummary: {
      depositsValidated: 3,
      totalOriginalWeight: 42.3,
      adjustmentPercent: "7.6",
      allFromSameLocation: true,
      locationName: "Punto Limpio Central"
    },
    qrGenerated: true,
    mode: "blockchain"
  },

  // Ejemplos de errores detallados
  errorResponses: {
    validationError: {
      success: false,
      error: "Datos de entrada inválidos",
      validationErrors: [
        "Se requiere al menos un ID de depósito para crear el lote",
        "Foto de evidencia requerida en formato base64",
        "Datos completos del operador requeridos (nombre y RUT)"
      ],
      failedIds: [],
      errorType: "VALIDATION_ERROR"
    },

    depositsNotFound: {
      success: false,
      error: "Algunos depósitos no pudieron procesarse",
      processingErrors: [
        "Depósitos no encontrados: EVT-999, EVT-998",
        "Depósitos ya en lotes existentes: EVT-1751148210"
      ],
      notFoundIds: ["EVT-999", "EVT-998"],
      alreadyBatchedIds: ["EVT-1751148210"],
      failedIds: [
        {
          id: "EVT-997",
          reason: "Tipo de evento inválido: Process (se esperaba Deposit)"
        }
      ],
      validDeposits: 0,
      errorType: "DEPOSIT_PROCESSING_ERROR"
    },

    multipleLocations: {
      success: false,
      error: "No se puede crear un lote con depósitos de diferentes ubicaciones",
      locations: ["Punto Limpio Central", "Punto Limpio Norte"],
      errorType: "MULTIPLE_LOCATIONS"
    },

    weightAdjustmentExcessive: {
      success: false,
      error: "Datos de entrada inválidos",
      validationErrors: [
        "Ajuste de peso excesivo: 18.2% (máximo 15%)"
      ],
      errorType: "VALIDATION_ERROR"
    },

    blockchainError: {
      success: false,
      error: "Error en contrato inteligente: insufficient funds for gas",
      errorType: "BLOCKCHAIN_ERROR",
      contractStatus: "failed",
      mode: "blockchain_error"
    }
  }
};

// Función de prueba para ejecutar manualmente
async function testBatchEndpoint() {
  console.log('🧪 BATCH 2025-07: Iniciando pruebas del endpoint');
  
  try {
    const response = await fetch('http://localhost:5000/api/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData.validRequest)
    });

    const result = await response.json();
    
    console.log('📋 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Lote creado exitosamente:', result.batch.batchId);
      console.log('🔗 TX Hash:', result.batch.blockchainTxHash);
      console.log('📱 QR generado:', result.qrGenerated);
    } else {
      console.log('❌ Error:', result.error);
      console.log('🔍 Tipo:', result.errorType);
      if (result.processingErrors) {
        console.log('📝 Detalles:', result.processingErrors);
      }
    }
    
  } catch (error) {
    console.error('💥 Error de conexión:', error.message);
  }
}

// Casos de prueba específicos
const testCases = {
  // Test 1: Lote válido simple
  simple: {
    name: "Lote válido básico",
    data: {
      depositIds: ["EVT-1751148213"],
      totalWeight: 15.0,
      operatorData: {
        operatorName: "Test Operator",
        operatorRut: "11.111.111-1",
        centerId: "TEST-001",
        centerName: "Centro Test"
      },
      evidence: "data:image/jpeg;base64,test",
      location: "Centro Test"
    }
  },

  // Test 2: Con ajuste de peso
  withAdjustment: {
    name: "Lote con ajuste de peso",
    data: {
      ...testData.validRequest,
      weightAdjustment: {
        originalSum: 40.0,
        adjustedWeight: 42.0,
        reason: "Calibración de báscula",
        operatorComment: "Ajuste menor del 5%"
      }
    }
  },

  // Test 3: Error por depósito inexistente
  notFound: {
    name: "Error depósito no encontrado",
    data: {
      ...testData.validRequest,
      depositIds: ["EVT-NOEXISTE"]
    }
  }
};

// Exportar para uso en otros tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testData, testBatchEndpoint, testCases };
}

console.log('📋 BATCH 2025-07: Script de prueba cargado');
console.log('💡 Para ejecutar: testBatchEndpoint()');
console.log('📊 Datos de prueba disponibles en: testData');