const { ethers } = require('ethers');
const contractAbi = require('./server/contract-abi.json');

async function testContract() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, provider);
    
    console.log('🔍 Probando getBatchHistory para lote 3...');
    const events = await contract.getBatchHistory(3);
    
    console.log('📦 Eventos crudos del contrato:');
    console.log(JSON.stringify(events, null, 2));
    
    if (events && events.length > 0) {
      console.log('🔍 Primer evento detallado:');
      const firstEvent = events[0];
      console.log('eventType:', firstEvent.eventType);
      console.log('description:', firstEvent.description);
      console.log('location:', firstEvent.location);
      console.log('userAddress:', firstEvent.userAddress);
      console.log('quantity:', firstEvent.quantity?.toString());
      console.log('timestamp:', firstEvent.timestamp?.toString());
      console.log('actor:', firstEvent.actor);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testContract();