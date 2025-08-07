// Script de diagnóstico para el problema del UPDATE en bottle_deposits
// Ejecutar con: node debug-update-issue.js

const baseUrl = 'http://127.0.0.1:5000';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function debugUpdateIssue() {
  log('\n🔍 DIAGNÓSTICO DEL PROBLEMA DE UPDATE EN BOTTLE_DEPOSITS\n', 'cyan');
  log('=' .repeat(70), 'cyan');
  
  try {
    // 1. Obtener todos los depósitos
    log('\n1️⃣  ANALIZANDO DEPÓSITOS EXISTENTES...', 'yellow');
    const response = await fetch(`${baseUrl}/api/bottle-deposits`);
    const deposits = await response.json();
    
    log(`   Total de depósitos: ${deposits.length}`);
    
    // Analizar los event_ids
    const depositsWithEventId = deposits.filter(d => d.eventId);
    const depositsWithoutEventId = deposits.filter(d => !d.eventId);
    
    log(`   Con eventId: ${depositsWithEventId.length}`, 'green');
    log(`   Sin eventId: ${depositsWithoutEventId.length}`, 'red');
    
    if (depositsWithEventId.length > 0) {
      log('\n   📋 Muestra de eventIds existentes:', 'cyan');
      depositsWithEventId.slice(0, 3).forEach(dep => {
        const eventId = dep.eventId;
        log(`\n   Depósito ID ${dep.id}:`);
        log(`   eventId: "${eventId}"`);
        log(`   Longitud: ${eventId ? eventId.length : 0} caracteres`);
        log(`   Tipo: ${typeof eventId}`);
        log(`   ¿Validado?: ${dep.isValidated ? '✅' : '❌'}`);
        
        // Análisis detallado del string
        if (eventId) {
          log(`   Primer char code: ${eventId.charCodeAt(0)}`);
          log(`   Último char code: ${eventId.charCodeAt(eventId.length - 1)}`);
          log(`   ¿Tiene espacios?: ${eventId !== eventId.trim() ? 'SÍ ⚠️' : 'NO'}`);
          log(`   ¿Es UUID válido?: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId) ? 'SÍ' : 'NO ⚠️'}`);
          
          // Mostrar bytes hexadecimales
          const hexBytes = Array.from(eventId).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
          log(`   Hex bytes (primeros 20): ${hexBytes.substring(0, 59)}...`);
        }
      });
    }
    
    // 2. Buscar QR codes asociados
    log('\n\n2️⃣  VERIFICANDO QR CODES...', 'yellow');
    
    for (const deposit of depositsWithEventId.slice(0, 2)) {
      if (!deposit.eventId) continue;
      
      log(`\n   Buscando QR para eventId: "${deposit.eventId}"`);
      
      try {
        const qrResponse = await fetch(`${baseUrl}/api/qr/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: deposit.eventId })
        });
        
        const qrResult = await qrResponse.json();
        
        if (qrResult.success) {
          log(`   ✅ QR encontrado`, 'green');
          if (qrResult.data) {
            log(`   QR eventId: "${qrResult.data.eventId || 'N/A'}"`);
            log(`   ¿Coinciden?: ${qrResult.data.eventId === deposit.eventId ? 'SÍ ✅' : 'NO ❌'}`);
          }
        } else {
          log(`   ❌ QR no encontrado: ${qrResult.error}`, 'red');
        }
      } catch (error) {
        log(`   ❌ Error buscando QR: ${error.message}`, 'red');
      }
    }
    
    // 3. TEST DE UPDATE DIRECTO
    log('\n\n3️⃣  TEST DE UPDATE DIRECTO...', 'yellow');
    
    // Buscar un depósito no validado para probar
    const testDeposit = deposits.find(d => d.eventId && !d.isValidated);
    
    if (testDeposit) {
      log(`\n   Depósito de prueba: ID ${testDeposit.id}`);
      log(`   eventId: "${testDeposit.eventId}"`);
      log(`   Estado actual: ${testDeposit.isValidated ? 'Validado ✅' : 'No validado ❌'}`);
      
      // Intentar actualizar via API personalizada de test
      log('\n   Intentando actualizar via endpoint de test...', 'cyan');
      
      try {
        const updateResponse = await fetch(`${baseUrl}/api/test/update-deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: testDeposit.eventId,
            updates: {
              isValidated: true,
              validatedBy: 999,
              validatedAt: new Date().toISOString()
            }
          })
        });
        
        if (updateResponse.ok) {
          const result = await updateResponse.json();
          log(`   Resultado: ${JSON.stringify(result)}`, result.success ? 'green' : 'red');
        } else {
          log(`   ❌ Error HTTP: ${updateResponse.status}`, 'red');
        }
      } catch (error) {
        log(`   ⚠️  Endpoint de test no disponible (esto es normal)`, 'yellow');
        log(`   Necesitas crear el endpoint de test en tu servidor`, 'yellow');
      }
    } else {
      log('   ⚠️  No hay depósitos con eventId sin validar para probar', 'yellow');
    }
    
    // 4. ANÁLISIS DE TIPOS DE DATOS
    log('\n\n4️⃣  ANÁLISIS DE TIPOS DE DATOS...', 'yellow');
    
    // Verificar consistencia de tipos
    const eventIdTypes = new Set();
    const eventIdLengths = new Set();
    
    depositsWithEventId.forEach(d => {
      if (d.eventId) {
        eventIdTypes.add(typeof d.eventId);
        eventIdLengths.add(d.eventId.length);
      }
    });
    
    log(`   Tipos de eventId encontrados: ${Array.from(eventIdTypes).join(', ')}`);
    log(`   Longitudes de eventId: ${Array.from(eventIdLengths).join(', ')}`);
    
    // 5. RECOMENDACIONES
    log('\n\n5️⃣  DIAGNÓSTICO Y RECOMENDACIONES:', 'magenta');
    log('=' .repeat(70), 'magenta');
    
    const issues = [];
    
    if (depositsWithoutEventId.length > 0) {
      issues.push({
        problem: `Hay ${depositsWithoutEventId.length} depósitos sin eventId`,
        solution: 'Estos depósitos nunca podrán ser validados. Necesitan eventId asignado.'
      });
    }
    
    if (eventIdTypes.size > 1) {
      issues.push({
        problem: 'Los eventIds tienen tipos de datos inconsistentes',
        solution: 'Asegúrate de que todos sean strings del mismo formato'
      });
    }
    
    if (eventIdLengths.size > 2) {
      issues.push({
        problem: 'Los eventIds tienen longitudes muy variadas',
        solution: 'Estandariza el formato de generación de eventIds'
      });
    }
    
    const nonUuidEventIds = depositsWithEventId.filter(d => 
      d.eventId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.eventId)
    );
    
    if (nonUuidEventIds.length > 0) {
      issues.push({
        problem: `Hay ${nonUuidEventIds.length} eventIds que no son UUIDs válidos`,
        solution: 'Considera usar un formato UUID estándar para todos los eventIds'
      });
    }
    
    if (issues.length > 0) {
      log('\n   ❌ PROBLEMAS DETECTADOS:', 'red');
      issues.forEach((issue, i) => {
        log(`\n   ${i + 1}. ${issue.problem}`, 'yellow');
        log(`      → ${issue.solution}`, 'cyan');
      });
    } else {
      log('\n   ✅ No se detectaron problemas obvios en la estructura de datos', 'green');
    }
    
    // 6. CÓDIGO DE PRUEBA SUGERIDO
    log('\n\n6️⃣  CÓDIGO DE PRUEBA SUGERIDO:', 'cyan');
    log('=' .repeat(70), 'cyan');
    
    log('\n   Agrega este endpoint de test en tu server/routes.ts:', 'yellow');
    console.log(`
// ENDPOINT DE TEST PARA DIAGNOSTICAR EL PROBLEMA
app.post('/api/test/update-deposit', async (req, res) => {
  const { eventId, updates } = req.body;
  
  console.log('🔍 TEST UPDATE - Input:', {
    eventId,
    eventIdType: typeof eventId,
    eventIdLength: eventId?.length,
    eventIdTrimmed: eventId?.trim(),
    eventIdBytes: Buffer.from(eventId || '').toString('hex')
  });
  
  try {
    // Primero, buscar el depósito
    const [existingDeposit] = await db
      .select()
      .from(bottleDeposits)
      .where(eq(bottleDeposits.eventId, eventId))
      .limit(1);
    
    console.log('🔍 TEST UPDATE - Depósito encontrado:', existingDeposit ? 'SÍ' : 'NO');
    
    if (existingDeposit) {
      console.log('🔍 TEST UPDATE - Depósito actual:', {
        id: existingDeposit.id,
        eventId: existingDeposit.eventId,
        eventIdBytes: Buffer.from(existingDeposit.eventId || '').toString('hex'),
        isValidated: existingDeposit.isValidated
      });
      
      // Comparación byte a byte
      const inputBytes = Buffer.from(eventId);
      const dbBytes = Buffer.from(existingDeposit.eventId || '');
      const bytesMatch = inputBytes.equals(dbBytes);
      
      console.log('🔍 TEST UPDATE - Comparación de bytes:', bytesMatch ? 'COINCIDEN' : 'NO COINCIDEN');
    }
    
    // Intentar el update
    const updateResult = await db
      .update(bottleDeposits)
      .set(updates)
      .where(eq(bottleDeposits.eventId, eventId))
      .returning();
    
    console.log('🔍 TEST UPDATE - Resultado:', updateResult);
    
    res.json({
      success: updateResult.length > 0,
      rowsAffected: updateResult.length,
      updated: updateResult[0] || null,
      debug: {
        inputEventId: eventId,
        foundBeforeUpdate: !!existingDeposit,
        comparison: {
          trimmed: eventId === eventId?.trim(),
          type: typeof eventId
        }
      }
    });
  } catch (error) {
    console.error('🔍 TEST UPDATE - Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});
    `);
    
    log('\n\n7️⃣  PRÓXIMOS PASOS:', 'magenta');
    log('=' .repeat(70), 'magenta');
    log('\n   1. Agrega el endpoint de test en tu servidor');
    log('   2. Reinicia el servidor');
    log('   3. Ejecuta este script nuevamente');
    log('   4. Revisa los logs del servidor para ver la salida detallada');
    log('   5. Comparte los resultados para continuar el diagnóstico');
    
  } catch (error) {
    log(`\n❌ Error durante el diagnóstico: ${error.message}`, 'red');
    console.error(error);
  }
}

// Ejecutar diagnóstico
debugUpdateIssue().catch(console.error);