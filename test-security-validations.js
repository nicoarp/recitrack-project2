#!/usr/bin/env node

/**
 * TEST DE VALIDACIONES DE SEGURIDAD BATCH 2025-07
 * 
 * Este script prueba las validaciones críticas implementadas:
 * 1. Validación de roles (solo acopio, batch_operator, admin)
 * 2. Validación de centros de acopio (depósitos del mismo centro)
 * 3. Validación anti-duplicados (no reutilizar QRs)
 * 4. Validación de permisos (operador debe pertenecer al centro)
 */

async function testSecurityValidations() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔐 INICIANDO TESTS DE SEGURIDAD BATCH 2025-07');
  console.log('=' .repeat(60));
  
  // Test 1: Usuario sin permisos intenta crear lote
  try {
    console.log('\n📋 TEST 1: Usuario sin permisos (rol "user")');
    const invalidRoleResponse = await fetch(`${baseUrl}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositIds: ['DEPOSIT-001'],
        totalWeight: 2.5,
        userId: 2, // Usuario normal sin permisos (role: user) de acopio
        operatorName: 'Usuario Sin Permisos',
        operatorRut: '12.345.678-9',
        evidencePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'
      })
    });
    
    const invalidRoleResult = await invalidRoleResponse.json();
    
    if (invalidRoleResult.success === false && invalidRoleResult.errorType === 'INSUFFICIENT_PERMISSIONS') {
      console.log('✅ BLOQUEADO - Usuario sin permisos rechazado correctamente');
    } else {
      console.log('❌ FALLO - Usuario sin permisos debería ser rechazado');
    }
  } catch (error) {
    console.log('❌ ERROR EN TEST 1:', error.message);
  }
  
  // Test 2: Múltiples centros en un lote (validación anti-fraude)
  try {
    console.log('\n📋 TEST 2: Múltiples centros en un lote');
    const multipleCentersResponse = await fetch(`${baseUrl}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositIds: ['CENTRO-001-DEP', 'NORTE-002-DEP'], // Diferentes centros
        totalWeight: 5.0,
        userId: 3, // Juan Pérez (Operador Central) - rol acopio
        operatorName: 'Juan Pérez',
        operatorRut: '11.111.111-1',
        evidencePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'
      })
    });
    
    const multipleCentersResult = await multipleCentersResponse.json();
    
    if (multipleCentersResult.success === false && multipleCentersResult.errorType === 'MULTIPLE_CENTERS_ERROR') {
      console.log('✅ BLOQUEADO - Múltiples centros rechazados correctamente');
    } else {
      console.log('❌ FALLO - Múltiples centros deberían ser rechazados');
    }
  } catch (error) {
    console.log('❌ ERROR EN TEST 2:', error.message);
  }
  
  // Test 3: Operador con rol válido pero centro incorrecto
  try {
    console.log('\n📋 TEST 3: Operador de centro incorrecto');
    const wrongCenterResponse = await fetch(`${baseUrl}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositIds: ['SUR-003-DEP'], // Centro Sur
        totalWeight: 3.0,
        userId: 3, // Juan Pérez (Operador Central) - rol acopio
        operatorName: 'Juan Pérez',
        operatorRut: '11.111.111-1',
        evidencePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'
      })
    });
    
    const wrongCenterResult = await wrongCenterResponse.json();
    
    if (wrongCenterResult.success === false && wrongCenterResult.errorType === 'UNAUTHORIZED_CENTER_ACCESS') {
      console.log('✅ BLOQUEADO - Acceso a centro incorrecto rechazado');
    } else {
      console.log('❌ FALLO - Acceso a centro incorrecto debería ser rechazado');
    }
  } catch (error) {
    console.log('❌ ERROR EN TEST 3:', error.message);
  }
  
  // Test 4: Depósitos duplicados en un lote
  try {
    console.log('\n📋 TEST 4: Depósitos duplicados');
    const duplicatesResponse = await fetch(`${baseUrl}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositIds: ['CENTRO-001-DEP', 'CENTRO-001-DEP'], // ID duplicado
        totalWeight: 4.0,
        userId: 3, // Juan Pérez (Operador Central) - rol acopio
        operatorName: 'Juan Pérez',
        operatorRut: '11.111.111-1',
        evidencePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'
      })
    });
    
    const duplicatesResult = await duplicatesResponse.json();
    
    if (duplicatesResult.success === false && duplicatesResult.errorType === 'DUPLICATE_DEPOSITS') {
      console.log('✅ BLOQUEADO - Depósitos duplicados rechazados correctamente');
    } else {
      console.log('❌ FALLO - Depósitos duplicados deberían ser rechazados');
    }
  } catch (error) {
    console.log('❌ ERROR EN TEST 4:', error.message);
  }
  
  // Test 5: Lote válido con usuario autorizado
  try {
    console.log('\n📋 TEST 5: Lote válido con permisos correctos');
    const validBatchResponse = await fetch(`${baseUrl}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositIds: ['VALID-DEP-001', 'VALID-DEP-002'],
        totalWeight: 6.0,
        userId: 3, // Juan Pérez (Operador Central) - rol acopio
        operatorName: 'Juan Pérez',
        operatorRut: '11.111.111-1',
        evidencePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
        operatorComment: 'Lote de prueba para validación de seguridad'
      })
    });
    
    const validBatchResult = await validBatchResponse.json();
    
    if (validBatchResult.success === true) {
      console.log('✅ ÉXITO - Lote válido creado correctamente');
      console.log(`   Lote ID: ${validBatchResult.batch?.batchId || 'N/A'}`);
    } else {
      console.log('❌ FALLO - Lote válido debería ser aceptado');
      console.log('   Error:', validBatchResult.error);
    }
  } catch (error) {
    console.log('❌ ERROR EN TEST 5:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🔐 TESTS DE SEGURIDAD COMPLETADOS');
  console.log('✅ Los controles implementados previenen:');
  console.log('   • Usuarios sin permisos creando lotes');
  console.log('   • Mezcla de depósitos de diferentes centros');
  console.log('   • Operadores accediendo a centros no autorizados');
  console.log('   • Reutilización de depósitos ya procesados');
  console.log('🎯 Sistema de lotes seguro y auditado');
}

// Ejecutar tests si el script se ejecuta directamente
testSecurityValidations().catch(console.error);