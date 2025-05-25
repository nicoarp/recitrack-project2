import { ethers } from "ethers";
import { BottleEvent, Contract } from "@/types/blockchain";

// Definimos el tipo para las transacciones
type TransactionResponse = {
  hash: string;
  wait: () => Promise<any>;
};

// Contract configuration
const contractAddress = "0xd9145CCE52D386f254917e481eB44e9943F39138";
const contractABI = [
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

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window.ethereum !== 'undefined';
};

// Get current accounts
export const getAccounts = async (): Promise<string[]> => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  
  return await window.ethereum.request({ method: 'eth_accounts' });
};

// Connect to MetaMask
export const connectWallet = async (): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    throw error;
  }
};

// Get contract instance
export const getContract = async (): Promise<Contract> => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  
  // Usar la nueva API de ethers v6
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer) as Contract;
};

// Register bottle deposit
export const registerDeposit = async (
  batchId: number, 
  bottleCount: number, 
  location: string
): Promise<ethers.providers.TransactionResponse> => {
  try {
    const contract = await getContract();
    const eventType = "DepositoLote";
    const description = `${bottleCount} botellas depositadas`;
    
    // En un entorno de desarrollo, podemos simular una transacción exitosa
    // Esto es útil para probar la interfaz sin una conexión real a blockchain
    if (process.env.NODE_ENV === 'development' && !window.ethereum) {
      console.log('Modo desarrollo: Simulando transacción blockchain', { batchId, bottleCount, location });
      // Devolver un objeto que simula una transacción
      return {
        hash: '0x' + Math.random().toString(16).substring(2, 42),
        wait: async () => Promise.resolve({})
      } as unknown as ethers.providers.TransactionResponse;
    }
    
    // Llamada real al contrato blockchain
    return await contract.registerEvent(batchId, eventType, description, location);
  } catch (error) {
    console.error('Error en registerDeposit:', error);
    throw error;
  }
};

// Get bottle history
export const getBottleHistory = async (batchId: number): Promise<BottleEvent[]> => {
  const contract = await getContract();
  return await contract.getBottleHistory(batchId);
};

// Format address to shorter version
export const formatAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
