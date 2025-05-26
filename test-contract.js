// Script mínimo para probar la consulta al contrato
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testContractQuery() {
  try {
    console.log('🔍 Iniciando prueba de consulta al contrato...');
    
    // Configuración exacta
    const RPC_URL = 'https://sepolia.infura.io/v3/e3756259fcf148d5b141d7bb610f314d';
    const CONTRACT_ADDRESS = '0xd1ca86232E3c54725c4cD05c653c78922061180f';
    const PRIVATE_KEY = '0x55c405215bc7bff4a1a1534b88580a27f983640a3b6da67f9e457d30cb4b72a6';
    
    console.log('📡 Conectando al proveedor...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    console.log('🌐 Verificando red...');
    const network = await provider.getNetwork();
    console.log(`   Red: ${network.name} (chainId: ${network.chainId})`);
    
    console.log('💰 Configurando wallet...');
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`   Dirección: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
    
    console.log('📋 Cargando ABI...');
    const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'server/contract-abi.json'), 'utf8'));
    console.log(`   Funciones en ABI: ${contractABI.length}`);
    
    console.log('🔗 Inicializando contrato...');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    console.log(`   Contrato: ${contract.target}`);
    
    console.log('🔍 Probando consulta para bottleId 300...');
    
    try {
      const result = await contract.getBottleHistory(300);
      console.log('✅ RESULTADO EXITOSO:');
      console.log('   Tipo:', typeof result);
      console.log('   Es array:', Array.isArray(result));
      console.log('   Longitud:', result?.length);
      console.log('   Datos raw:', result);
      console.log('   JSON:', JSON.stringify(result, null, 2));
      
      if (result && result.length > 0) {
        console.log('📊 EVENTOS ENCONTRADOS:');
        result.forEach((event, i) => {
          console.log(`   Evento ${i}:`);
          console.log(`     Tipo: ${event.eventType}`);
          console.log(`     Descripción: ${event.description}`);
          console.log(`     Ubicación: ${event.location}`);
          console.log(`     Timestamp: ${event.timestamp}`);
          console.log(`     Actor: ${event.actor}`);
        });
      } else {
        console.log('❌ NO SE ENCONTRARON EVENTOS (pero deberían existir según Remix)');
      }
      
    } catch (queryError) {
      console.log('🚨 ERROR EN CONSULTA:');
      console.log('   Código:', queryError.code);
      console.log('   Mensaje:', queryError.message);
      console.log('   Info:', queryError.info);
      console.log('   Value:', queryError.value);
    }
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  }
}

// Ejecutar la prueba
testContractQuery().then(() => {
  console.log('🏁 Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});