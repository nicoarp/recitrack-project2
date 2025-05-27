import { ethers } from 'ethers';

// ABI real del contrato EcoTraza
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bottleId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "registerEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "bottleHistory",
    "outputs": [
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "actor",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bottleId",
        "type": "uint256"
      }
    ],
    "name": "getBottleHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "eventType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "actor",
            "type": "address"
          }
        ],
        "internalType": "struct RecyclingMVP.BottleEvent[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export class BlockchainService {
  constructor() {
    this.provider = null;
    this.operatorWallet = null;
    this.contract = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Configuración para Sepolia testnet
      const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
      const contractAddress = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
      const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;

      console.log('🔍 Verificando configuración blockchain...');
      console.log('RPC URL:', rpcUrl ? 'Configurado' : 'No configurado');
      console.log('Contract Address:', contractAddress);
      console.log('Private Key:', operatorPrivateKey ? 'Configurado' : 'No configurado');

      if (!operatorPrivateKey || operatorPrivateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.warn('⚠️  OPERATOR_PRIVATE_KEY no configurado. Modo offline activado.');
        return false;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.operatorWallet = new ethers.Wallet(operatorPrivateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.operatorWallet);

      // Verificar conexión
      await this.provider.getNetwork();
      console.log('✅ Conexión blockchain establecida');
      console.log('📍 Operador:', this.operatorWallet.address);
      console.log('🔗 Contrato:', contractAddress);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Error inicializando blockchain:', error.message);
      return false;
    }
  }

  async registerEvent(batchId, eventType, description, location, userAddress, quantity) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      console.log(`📝 Registrando evento: ${eventType} para lote ${batchId}`);
      
      // Convertir parámetros numéricos
      const batchIdNumber = parseInt(batchId);
      const quantityNumber = parseInt(quantity);
      
      const tx = await this.contract.registerEvent(
        batchIdNumber,
        eventType,
        description,
        location,
        userAddress,
        quantityNumber
      );

      console.log(`⏳ Transacción enviada: ${tx.hash}`);
      
      // Esperar confirmación
      const receipt = await tx.wait();
      
      console.log(`✅ Evento registrado en bloque: ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Error registrando evento:', error.message);
      throw error;
    }
  }

  async getBatchHistory(batchId) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      console.log(`🔍 Consultando historial del lote: ${batchId}`);
      
      // Convertir batchId a número para el contrato
      const batchIdNumber = parseInt(batchId);
      console.log(`🔢 Usando batchId como número: ${batchIdNumber}`);
      
      // Verificar que el contrato está inicializado correctamente
      console.log(`🔗 Dirección del contrato: ${this.contract.target}`);
      const network = await this.provider.getNetwork();
      console.log(`🌐 Red conectada:`, {
        name: network.name,
        chainId: network.chainId,
        ensAddress: network.ensAddress
      });
      
      const events = await this.contract.getBatchHistory(batchIdNumber);
      
      if (!events || events.length === 0) {
        return [];
      }
      
      // Convertir eventos a formato seguro con los nuevos campos
      const formattedEvents = [];
      for (const event of events) {
        console.log('🔍 Datos del evento desde contrato:', {
          eventType: event.eventType,
          description: event.description,
          location: event.location,
          userAddress: event.userAddress,
          quantity: event.quantity?.toString(),
          timestamp: event.timestamp?.toString(),
          actor: event.actor
        });
        
        formattedEvents.push({
          eventType: event.eventType,
          description: event.description,
          location: event.location,
          userAddress: event.userAddress,
          quantity: event.quantity ? parseInt(event.quantity.toString()) : 1,
          timestamp: parseInt(event.timestamp.toString()) * 1000,
          actor: event.actor
        });
      }
      
      console.log(`✅ ${formattedEvents.length} eventos encontrados para lote ${batchId}`);
      return formattedEvents;
    } catch (error) {
      if (error.code === 'BAD_DATA' && error.value === '0x') {
        console.log(`📭 No hay datos para botella ${bottleId} - esto es normal si no se han registrado eventos`);
        return [];
      }
      console.error('❌ Error consultando historial:', error.message);
      throw error;
    }
  }

  async getOperatorBalance() {
    if (!this.isInitialized) {
      return '0';
    }

    try {
      const balance = await this.provider.getBalance(this.operatorWallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Error obteniendo balance:', error.message);
      return '0';
    }
  }

  getOperatorAddress() {
    return this.operatorWallet?.address || 'No configurado';
  }

  isReady() {
    return this.isInitialized;
  }
}

// Instancia singleton
export const blockchainService = new BlockchainService();