import { useState, useEffect, createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  isMetaMaskInstalled,
  getAccounts,
  connectWallet as connect,
  formatAddress
} from "@/lib/blockchain";

interface BlockchainContextType {
  isConnected: boolean;
  account: string;
  connectWallet: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkIfWalletIsConnected();
    if (isMetaMaskInstalled()) {
      // Setup listeners for account and chain changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (isMetaMaskInstalled()) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (isMetaMaskInstalled()) {
        const accounts = await getAccounts();
        if (accounts.length > 0) {
          setAccount(formatAddress(accounts[0]));
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount("");
      setIsConnected(false);
    } else if (accounts[0] !== account) {
      setAccount(formatAddress(accounts[0]));
      setIsConnected(true);
    }
  };

  const connectWallet = async () => {
    try {
      if (!isMetaMaskInstalled()) {
        toast({
          title: "Error",
          description: "Por favor instala MetaMask para continuar",
          variant: "destructive"
        });
        return;
      }
      
      const accountAddress = await connect();
      setAccount(formatAddress(accountAddress));
      setIsConnected(true);
      
      toast({
        title: "¡Conectado!",
        description: "Wallet conectada correctamente"
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Error",
        description: "Error al conectar la wallet",
        variant: "destructive"
      });
    }
  };

  const value = {
    isConnected,
    account,
    connectWallet
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
}
