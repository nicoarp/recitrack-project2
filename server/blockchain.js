import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Cargar ABI desde archivo actualizado
const contractAbiPath = path.join(process.cwd(), 'server', 'contract-abi-updated.json');
const CONTRACT_ABI = JSON.parse(fs.readFileSync(contractAbiPath, 'utf8'));

export class BlockchainService {
  constructor() {
    this.provider = null;
    this.operatorWallet = null;
    this.contract = null;
    this.isInitialized = false;
  }

  // Función auxiliar para reintentos con delay exponencial
  async retryWithDelay(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Si es error de "Too Many Requests", esperar más tiempo
        const isRateLimited = error.message.includes('Too Many Requests') || 
                             error.code === 'BAD_DATA';
        
        const delay = isRateLimited ? baseDelay * Math.pow(2, attempt) : baseDelay;
        console.log(`⏳ Intento ${attempt} falló, reintentando en ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
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

  async registerEvent(eventType, relatedIds, location, quantity, description, evidenceHash = "", userId = null, userEmail = null) {
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
      console.log(`🔗 Hash evidencia: ${evidenceHash || 'No especificado'}`);
      if (userId) console.log(`👤 Usuario: ${userId} (${userEmail})`);
      
      // Convertir parámetros numéricos
      const quantityNumber = parseInt(quantity);
      const relatedIdsNumbers = relatedIds.map(id => parseInt(id));
      
      const tx = await this.contract.registerEvent(
        eventTypeNumber,
        relatedIdsNumbers,
        location,
        quantityNumber,
        description,
        evidenceHash
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
      
      // Usar el mapping 'events' directamente ya que funciona correctamente
      const eventData = await this.contract.events(eventIdNumber);
      
      console.log(`📋 Respuesta del contrato:`, eventData);
      console.log(`📋 Tipo de respuesta:`, typeof eventData);
      
      if (!eventData) {
        return null;
      }

      // Mapear números de tipo de evento a nombres
      const eventTypeNames = ['Deposit', 'Batch', 'Process', 'Product'];
      
      // Convertir todos los valores de manera segura desde el mapping 'events'
      const eventType = eventTypeNames[Number(eventData.eventType)] || 'Unknown';
      
      return {
        eventId: eventIdNumber,
        eventType,
        relatedIds: [], // No disponible en el mapping directo, necesitaríamos usar getEvent
        location: eventData.location,
        quantity: Number(eventData.quantity),
        actor: eventData.actor,
        timestamp: Number(eventData.timestamp),
        description: eventData.description,
        evidenceHash: eventData.evidenceHash || ""
      };
    } catch (error) {
      console.error('❌ Error consultando evento:', error.message);
      
      // Como fallback, intentar consultar el evento directamente desde el mapping 'events'
      try {
        console.log('🔄 Intentando consulta alternativa...');
        const eventData = await this.contract.events(eventIdNumber);
        
        if (eventData) {
          const eventTypeNames = ['Deposit', 'Batch', 'Process', 'Product'];
          return {
            eventId: eventIdNumber,
            eventType: eventTypeNames[Number(eventData.eventType)] || 'Unknown',
            relatedIds: [], // No disponible en el mapping directo
            location: eventData.location,
            quantity: Number(eventData.quantity),
            actor: eventData.actor,
            timestamp: Number(eventData.timestamp),
            description: eventData.description,
            evidenceHash: eventData.evidenceHash || ""
          };
        }
      } catch (fallbackError) {
        console.error('❌ Error en consulta alternativa:', fallbackError.message);
      }
      
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
      console.log(`🔍 Buscando eventos de tipo: ${eventType} usando mapping directo`);
      
      // Obtener el número total de eventos con reintentos
      const nextEventId = await this.retryWithDelay(async () => {
        return await this.contract.nextEventId();
      });
      const totalEvents = parseInt(nextEventId.toString());
      
      const events = [];
      const eventTypeNames = ['Deposit', 'Batch', 'Process', 'Product'];
      
      // Iterar a través de todos los eventos usando el mapping events
      for (let i = 1; i < totalEvents; i++) {
        try {
          const event = await this.retryWithDelay(async () => {
            return await this.contract.events(i);
          }, 3, 500); // Menor delay para consultas individuales
          
          const eventTypeName = eventTypeNames[parseInt(event[0].toString())] || 'Unknown';
          
          if (eventTypeName === eventType) {
            events.push({
              eventId: i,
              eventType: eventTypeName,
              location: event[1],
              quantity: parseInt(event[2].toString()),
              actor: event[3],
              timestamp: parseInt(event[4].toString()),
              description: event[5],
              relatedIds: [] // Las relatedIds están en getEvent, no en events mapping
            });
          }
        } catch (error) {
          console.log(`❌ Error accediendo evento ${i} después de reintentos:`, error.message);
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