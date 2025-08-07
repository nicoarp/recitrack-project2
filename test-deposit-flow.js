// Script de diagnóstico para el flujo de depósitos validados
// Ejecutar con: node test-deposit-flow.js

const baseUrl = 'http://127.0.0.1:5000';

async function testDepositFlow() {
  console.log('🔍 DIAGNÓSTICO DEL FLUJO DE DEPÓSITOS VALIDADOS\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Obtener depósitos desde la base de datos
    console.log('\n📦 1. VERIFICANDO DEPÓSITOS EN BASE DE DATOS...');
    const depositsResponse = await fetch(`${baseUrl}/api/bottle-deposits`);
    const deposits = await depositsResponse.json();
    
    console.log(`   Total de depósitos: ${deposits.length}`);
    
    // Mostrar los últimos 3 depósitos
    const recentDeposits = deposits.slice(-3);
    recentDeposits.forEach(dep => {
      console.log(`\n   Depósito #${dep.id}:`);
      console.log(`   - EventId: ${dep.eventId || 'NO TIENE'}`);
      console.log(`   - DepositId (punto): ${dep.depositId}`);
      console.log(`   - Ubicación: ${dep.location}`);
      console.log(`   - Botellas: ${dep.bottleCount}`);
      console.log(`   - Peso: ${dep.weightKg}kg`);
      console.log(`   - ¿Validado?: ${dep.isValidated ? 'SÍ' : 'NO'}`);
      console.log(`   - Validado por: ${dep.validatedBy || 'Nadie'}`);
    });
    
    // 2. Verificar QR codes generados
    console.log('\n\n📱 2. VERIFICANDO CÓDIGOS QR GENERADOS...');
    
    // Intentar obtener QRs de tipo Deposit
    const qrTestIds = ['QR-TEST-001', 'QR-TEST-002']; // Ajustar con IDs reales
    
    for (const deposit of recentDeposits.slice(0, 2)) {
      if (deposit.eventId) {
        console.log(`\n   Buscando QR para eventId: ${deposit.eventId}`);
        
        // Intentar resolver como QR
        const resolveResponse = await fetch(`${baseUrl}/api/qr/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: deposit.eventId })
        });
        
        const resolveResult = await resolveResponse.json();
        
        if (resolveResult.success) {
          console.log(`   ✅ QR encontrado: tipo=${resolveResult.type}`);
          if (resolveResult.data) {
            console.log(`   - QR ID: ${resolveResult.data.qrId || 'N/A'}`);
            console.log(`   - Estado: ${resolveResult.data.status || 'N/A'}`);
          }
        } else {
          console.log(`   ❌ QR no encontrado: ${resolveResult.error}`);
        }
      }
    }
    
    // 3. Verificar depósitos validados
    console.log('\n\n✅ 3. VERIFICANDO DEPÓSITOS VALIDADOS...');
    
    const validatedDeposits = deposits.filter(d => d.isValidated === true);
    console.log(`   Total validados: ${validatedDeposits.length}`);
    
    if (validatedDeposits.length > 0) {
      console.log('\n   Depósitos validados encontrados:');
      validatedDeposits.forEach(dep => {
        console.log(`   - ID: ${dep.id}, EventId: ${dep.eventId}, Validado por: ${dep.validatedBy}`);
      });
    } else {
      console.log('   ⚠️ No hay depósitos validados en el sistema');
    }
    
    // 4. Simular búsqueda desde Agrupar Depósitos
    console.log('\n\n🔄 4. SIMULANDO BÚSQUEDA DESDE "AGRUPAR DEPÓSITOS"...');
    
    if (validatedDeposits.length > 0) {
      const testEventId = validatedDeposits[0].eventId;
      console.log(`   Intentando buscar con eventId: ${testEventId}`);
      
      const searchResponse = await fetch(`${baseUrl}/api/qr/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: testEventId })
      });
      
      const searchResult = await searchResponse.json();
      console.log(`   Resultado: ${searchResult.success ? '✅ Encontrado' : '❌ No encontrado'}`);
      
      if (searchResult.error) {
        console.log(`   Error: ${searchResult.error}`);
      }
    }
    
    // 5. Verificar endpoint de lotes
    console.log('\n\n📋 5. VERIFICANDO ENDPOINT DE LOTES...');
    
    const batchEventsResponse = await fetch(`${baseUrl}/api/blockchain/batch-events`);
    const batchEvents = await batchEventsResponse.json();
    
    if (batchEvents.success) {
      console.log(`   Total de lotes: ${batchEvents.events?.length || 0}`);
    } else {
      console.log(`   Error obteniendo lotes: ${batchEvents.error}`);
    }
    
    // DIAGNÓSTICO FINAL
    console.log('\n\n' + '=' .repeat(60));
    console.log('📊 DIAGNÓSTICO COMPLETADO\n');
    
    console.log('POSIBLES PROBLEMAS DETECTADOS:');
    
    if (deposits.length > 0 && validatedDeposits.length === 0) {
      console.log('❌ Hay depósitos pero ninguno está marcado como validado');
      console.log('   → La validación no está actualizando correctamente el campo isValidated');
    }
    
    const depositsWithoutEventId = deposits.filter(d => !d.eventId);
    if (depositsWithoutEventId.length > 0) {
      console.log(`❌ ${depositsWithoutEventId.length} depósitos no tienen eventId`);
      console.log('   → Los depósitos no están generando eventId correctamente');
    }
    
    const validatedWithoutQR = validatedDeposits.filter(d => !d.eventId);
    if (validatedWithoutQR.length > 0) {
      console.log(`❌ ${validatedWithoutQR.length} depósitos validados no tienen QR asociado`);
      console.log('   → La validación no está vinculando correctamente con QR');
    }
    
    console.log('\nRECOMENDACIONES:');
    console.log('1. Verificar que al crear un depósito se genere correctamente el eventId');
    console.log('2. Asegurar que la validación actualice el registro correcto en bottleDeposits');
    console.log('3. Confirmar que /api/qr/resolve pueda encontrar depósitos por eventId');
    console.log('4. Revisar que los depósitos validados tengan QR codes asociados');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar el diagnóstico
testDepositFlow().catch(console.error);