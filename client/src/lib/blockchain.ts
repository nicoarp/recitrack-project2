import { ethers } from "ethers";
import { BottleEvent, Contract } from "@/types/blockchain";

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
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer) as Contract;
};

// Register bottle deposit
export const registerDeposit = async (
  batchId: number, 
  bottleCount: number, 
  location: string
): Promise<ethers.providers.TransactionResponse> => {
  const contract = await getContract();
  const eventType = "DepositoLote";
  const description = `${bottleCount} botellas depositadas`;
  
  return await contract.registerEvent(batchId, eventType, description, location);
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
