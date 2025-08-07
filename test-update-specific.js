// Script para probar el UPDATE específicamente
// Ejecutar con: node test-update-specific.js

const baseUrl = 'http://127.0.0.1:5000';

async function testSpecificUpdate() {
  console.log('🧪 PRUEBA ESPECÍFICA DE UPDATE\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Primero, obtener un depósito con eventId para probar
    console.log('\n1️⃣ Obteniendo depósitos...');
    const response = await fetch(`${baseUrl}/api/bottle-deposits`);
    const deposits = await response.json();
    
    // Buscar un depósito con eventId que no esté validado
    const testDeposit = deposits.find(d => d.eventId && !d.isValidated);
    
    if (!testDeposit) {
      console.log('❌ No hay depósitos con eventId sin validar');
      console.log('Creando uno de prueba...');
      
      // Crear un depósito de prueba
      const createResponse = await fetch(`${baseUrl}/api/bottle-deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: Date.now(),
          bottleCount: 10,
          weightKg: 5,
          location: 'Test Location',
          depositId: 'PUNTO-TEST',
          userId: 1,
          eventId: `TEST-${Date.now()}` // EventId único
        })
      });
      
      const created = await createResponse.json();
      console.log('Depósito creado:', created);
      return;
    }
    
    console.log('\n✅ Depósito de prueba encontrado:');
    console.log(`   ID: ${testDeposit.id}`);
    console.log(`   EventId: "${testDeposit.eventId}"`);
    console.log(`   Tipo: ${typeof testDeposit.eventId}`);
    console.log(`   Longitud: ${testDeposit.eventId.length}`);
    console.log(`   ¿Validado?: ${testDeposit.isValidated ? 'SÍ' : 'NO'}`);
    
    // 2. Probar el UPDATE usando el endpoint de test
    console.log('\n2️⃣ Probando UPDATE via endpoint de test...');
    
    const updateResponse = await fetch(`${baseUrl}/api/test/update-deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: testDeposit.eventId,
        updates: {
          isValidated: true,
          validatedBy: 2,
          validatedAt: new Date().toISOString()
        }
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log('❌ Error HTTP:', updateResponse.status);
      console.log('Respuesta:', errorText);
      console.log('\n⚠️ Asegúrate de haber agregado el endpoint de test en server/routes.ts');
      return;
    }
    
    const result = await updateResponse.json();
    
    console.log('\n📊 Resultado del UPDATE:');
    console.log(`   ¿Éxito?: ${result.success ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Filas afectadas: ${result.rowsAffected}`);
    
    if (result.debug) {
      console.log('\n🔍 Debug info:');
      console.log(`   EventId enviado: "${result.debug.inputEventId}"`);
      console.log(`   ¿Depósito encontrado antes del update?: ${result.debug.foundBeforeUpdate ? 'SÍ' : 'NO'}`);
    }
    
    if (result.updated) {
      console.log('\n✅ Depósito actualizado:');
      console.log(`   ID: ${result.updated.id}`);
      console.log(`   ¿Validado?: ${result.updated.isValidated ? 'SÍ' : 'NO'}`);
      console.log(`   Validado por: ${result.updated.validatedBy}`);
    }
    
    // 3. Verificar que el cambio se haya guardado
    console.log('\n3️⃣ Verificando que el cambio persista...');
    
    const verifyResponse = await fetch(`${baseUrl}/api/bottle-deposits`);
    const updatedDeposits = await verifyResponse.json();
    
    const verifyDeposit = updatedDeposits.find(d => d.id === testDeposit.id);
    
    if (verifyDeposit) {
      console.log(`   Depósito ID ${verifyDeposit.id}:`);
      console.log(`   ¿Validado?: ${verifyDeposit.isValidated ? '✅ SÍ' : '❌ NO'}`);
      
      if (verifyDeposit.isValidated) {
        console.log('\n🎉 ¡ÉXITO! El UPDATE funcionó correctamente');
      } else {
        console.log('\n❌ El UPDATE no funcionó - el depósito sigue sin validar');
      }
    }
    
    // 4. Análisis adicional si falló
    if (!result.success) {
      console.log('\n\n🔍 ANÁLISIS DE FALLO:');
      console.log('=' .repeat(60));
      
      console.log('\nPosibles causas:');
      console.log('1. El eventId no coincide exactamente (espacios, mayúsculas, etc.)');
      console.log('2. Problema de tipos de datos en la base de datos');
      console.log('3. Problema de transacciones no confirmadas');
      console.log('4. El schema de Drizzle no coincide con la base de datos');
      
      console.log('\n🔧 Intenta ejecutar este SQL directamente en tu base de datos:');
      console.log(`\n   UPDATE bottle_deposits`);
      console.log(`   SET is_validated = true`);
      console.log(`   WHERE event_id = '${testDeposit.eventId}';`);
      console.log(`\n   SELECT * FROM bottle_deposits WHERE event_id = '${testDeposit.eventId}';`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nAsegúrate de que:');
    console.log('1. El servidor esté corriendo (npm run dev)');
    console.log('2. Hayas agregado el endpoint de test en server/routes.ts');
    console.log('3. Hayas reiniciado el servidor después de agregar el endpoint');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Ejecutar la prueba
testSpecificUpdate().catch(console.error);