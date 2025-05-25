import { ethers } from "ethers";

export interface BottleEvent {
  eventType: string;
  description: string;
  location: string;
  timestamp: number;
  actor: string;
}

export interface Contract extends ethers.Contract {
  registerEvent(
    bottleId: number,
    eventType: string,
    description: string,
    location: string
  ): Promise<ethers.providers.TransactionResponse>;
  
  getBottleHistory(bottleId: number): Promise<BottleEvent[]>;
}

// Extend Window interface to include ethereum property
declare global {
  interface Window {
    ethereum: any;
  }
}
