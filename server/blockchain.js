import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Cargar ABI desde archivo actualizado
const contractAbiPath = path.join(process.cwd(), 'server', 'contract-abi.json');
const CONTRACT_ABI = JSON.parse(fs.readFileSync(contractAbiPath, 'utf8'));

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
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;

      console.log('🔍 Verificando configuración blockchain...');
      console.log('RPC URL:', rpcUrl ? 'Configurado' : 'No configurado');
      console.log('Contract Address:', contractAddress);
      console.log('Private Key:', operatorPrivateKey ? 'Configurado' : 'No configurado');

      if (!operatorPrivateKey || operatorPrivateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.warn('⚠️  OPERATOR_PRIVATE_KEY no configurado. Modo offline activado.');
        this.isInitialized = false;
        return false;
      }

      // Configurar provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Configurar wallet del operador
      this.operatorWallet = new ethers.Wallet(operatorPrivateKey, this.provider);
      
      // Configurar contrato
      this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.operatorWallet);
      
      console.log('✅ Conexión blockchain establecida');
      console.log('📍 Operador:', this.operatorWallet.address);
      console.log('🔗 Contrato:', contractAddress);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Error inicializando blockchain:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async registerEvent(eventType, relatedIds, location, quantity, description) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      // Mapear tipos de evento a números según el enum del contrato
      const eventTypeMap = {
        'Deposit': 0,
        'Batch': 1, 
        'Process': 2,
        'Product': 3
      };

      const eventTypeNumber = eventTypeMap[eventType];
      if (eventTypeNumber === undefined) {
        throw new Error(`Tipo de evento no válido: ${eventType}. Debe ser: Deposit, Batch, Process, Product`);
      }

      console.log(`📝 Registrando evento: ${eventType} (${eventTypeNumber})`);
      console.log(`🔗 IDs relacionados: [${relatedIds.join(', ')}]`);
      console.log(`📍 Ubicación: ${location}`);
      console.log(`📊 Cantidad: ${quantity}`);
      
      // Convertir parámetros numéricos
      const quantityNumber = parseInt(quantity);
      const relatedIdsNumbers = relatedIds.map(id => parseInt(id));
      
      const tx = await this.contract.registerEvent(
        eventTypeNumber,
        relatedIdsNumbers,
        location,
        quantityNumber,
        description
      );

      console.log(`⏳ Transacción enviada: ${tx.hash}`);
      
      // Esperar confirmación
      const receipt = await tx.wait();
      
      console.log(`✅ Evento registrado en bloque: ${receipt.blockNumber}`);
      
      // Obtener el ID del evento recién creado
      const nextEventId = await this.contract.nextEventId();
      const currentEventId = nextEventId - 1n;
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        eventId: currentEventId.toString(),
        eventType: eventType
      };
    } catch (error) {
      console.error('❌ Error registrando evento:', error.message);
      throw error;
    }
  }

  // Nueva función para obtener un evento específico
  async getEvent(eventId) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      console.log(`🔍 Consultando evento: ${eventId}`);
      
      const eventIdNumber = parseInt(eventId);
      const event = await this.contract.getEvent(eventIdNumber);
      
      if (!event) {
        return null;
      }

      // Mapear números de tipo de evento a nombres
      const eventTypeNames = ['Deposit', 'Batch', 'Process', 'Product'];
      
      return {
        eventId: eventIdNumber,
        eventType: eventTypeNames[parseInt(event[0].toString())] || 'Unknown',
        relatedIds: event[1].map(id => id.toString()),
        location: event[2],
        quantity: parseInt(event[3].toString()),
        actor: event[4],
        timestamp: parseInt(event[5].toString()),
        description: event[6]
      };
    } catch (error) {
      console.error('❌ Error consultando evento:', error.message);
      throw error;
    }
  }

  // Nueva función para obtener eventos relacionados
  async getLinkedEvents(eventId) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      console.log(`🔗 Consultando eventos vinculados a: ${eventId}`);
      
      const eventIdNumber = parseInt(eventId);
      const linkedIds = await this.contract.getLinkedEvents(eventIdNumber);
      
      return linkedIds.map(id => id.toString());
    } catch (error) {
      console.error('❌ Error consultando eventos vinculados:', error.message);
      throw error;
    }
  }

  // Función actualizada para obtener cadena completa de trazabilidad
  async getTraceabilityChain(eventId) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      console.log(`🔍 Construyendo cadena de trazabilidad para evento: ${eventId}`);
      
      const chain = [];
      const visited = new Set();
      
      // Función recursiva para construir la cadena
      const buildChain = async (currentEventId) => {
        if (visited.has(currentEventId)) return;
        visited.add(currentEventId);
        
        const event = await this.getEvent(currentEventId);
        if (event) {
          chain.push(event);
          
          // Agregar eventos relacionados
          for (const relatedId of event.relatedIds) {
            await buildChain(parseInt(relatedId));
          }
        }
      };
      
      await buildChain(parseInt(eventId));
      
      // Ordenar por timestamp
      chain.sort((a, b) => a.timestamp - b.timestamp);
      
      return chain;
    } catch (error) {
      console.error('❌ Error construyendo cadena de trazabilidad:', error.message);
      throw error;
    }
  }

  async getBatchHistory(batchId) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      console.log(`🔍 Consultando historial del lote: ${batchId}`);
      
      // Para el nuevo contrato, buscaremos eventos relacionados con este batchId
      const eventIdNumber = parseInt(batchId);
      
      try {
        const event = await this.getEvent(eventIdNumber);
        if (event) {
          return [this.formatEventForLegacySystem(event)];
        }
      } catch (error) {
        console.log('Evento no encontrado, retornando array vacío');
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error consultando historial:', error.message);
      throw error;
    }
  }

  async getEventsByType(eventType) {
    if (!this.isInitialized) {
      throw new Error('Servicio blockchain no inicializado');
    }

    try {
      console.log(`🔍 Buscando eventos de tipo: ${eventType}`);
      
      // Obtener el número total de eventos
      const nextEventId = await this.contract.nextEventId();
      const totalEvents = parseInt(nextEventId.toString());
      
      const events = [];
      
      // Iterar a través de todos los eventos y filtrar por tipo
      for (let i = 1; i < totalEvents; i++) {
        try {
          const event = await this.getEvent(i);
          if (event && event.eventType === eventType) {
            events.push({
              eventId: event.eventId,
              eventType: event.eventType,
              location: event.location,
              quantity: event.quantity,
              description: event.description,
              timestamp: event.timestamp,
              actor: event.actor,
              relatedIds: event.relatedIds
            });
          }
        } catch (error) {
          // Si un evento específico no existe, continuar con el siguiente
          continue;
        }
      }
      
      console.log(`✅ Encontrados ${events.length} eventos de tipo ${eventType}`);
      return events;
    } catch (error) {
      console.error('❌ Error obteniendo eventos por tipo:', error.message);
      throw error;
    }
  }

  // Función auxiliar para formatear eventos al sistema anterior
  formatEventForLegacySystem(event) {
    return {
      eventType: event.eventType,
      description: event.description,
      location: event.location,
      timestamp: event.timestamp,
      actor: event.actor
    };
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
    return this.isInitialized && this.contract && this.operatorWallet;
  }
}

export const blockchainService = new BlockchainService();