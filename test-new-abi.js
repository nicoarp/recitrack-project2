import { ethers } from 'ethers';
import fs from 'fs';

async function testNewABI() {
  try {
    console.log('🔧 Probando nuevo ABI...');
    
    // Configuración
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
    
    console.log('📍 Contrato:', contractAddress);
    
    // Configurar provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(operatorPrivateKey, provider);
    
    // Cargar ABI
    const abi = JSON.parse(fs.readFileSync('./server/contract-abi-updated.json', 'utf8'));
    
    // Crear instancia del contrato
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    
    console.log('✅ Contrato inicializado');
    
    // Probar getEvent con el ID 2 que creamos antes
    console.log('🔍 Consultando evento ID 2...');
    const event = await contract.getEvent(2);
    
    console.log('📋 Respuesta del contrato:', event);
    console.log('📋 Tipo de respuesta:', typeof event);
    console.log('📋 Longitud del array:', event.length);
    
    // Mapear la respuesta
    const eventData = {
      eventType: Number(event[0]),
      relatedIds: event[1].map(id => id.toString()),
      location: event[2],
      quantity: Number(event[3]),
      actor: event[4],
      timestamp: Number(event[5]),
      description: event[6],
      evidenceHash: event[7] || ""
    };
    
    console.log('✅ Evento decodificado:', eventData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNewABI();