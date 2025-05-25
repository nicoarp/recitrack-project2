import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBlockchain } from "@/hooks/use-blockchain";

export function WalletStatus() {
  const { account, isConnected, connectWallet } = useBlockchain();

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Estado de la Wallet</h2>
            <p className="mt-1 text-gray-500">
              {isConnected 
                ? `Conectado: ${account}` 
                : "No conectado"}
            </p>
          </div>
          <Button
            id="connect-wallet-main"
            onClick={connectWallet}
            className={`mt-4 md:mt-0 ${
              isConnected 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-secondary-500 hover:bg-secondary-600"
            }`}
          >
            <FontAwesomeIcon icon={isConnected ? "check-circle" : "wallet"} className="mr-2" />
            <span>{isConnected ? "Wallet Conectada" : "Conectar con MetaMask"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
