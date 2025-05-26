import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlockchainStatus {
  isReady: boolean;
  operatorAddress: string;
  balance: string;
  network: string;
  mode: string;
  error?: string;
}

export function BlockchainStatusCard() {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/blockchain/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching blockchain status:", error);
      setStatus({
        isReady: false,
        operatorAddress: "Error",
        balance: "0 ETH",
        network: "Desconectado",
        mode: "offline",
        error: "Error de conexión"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-blue-500 py-4 px-6">
          <CardTitle className="text-lg font-semibold text-white">
            <FontAwesomeIcon icon="spinner" spin className="mr-2" />
            Estado Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">Cargando estado...</div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-blue-500 py-4 px-6">
        <CardTitle className="text-lg font-semibold text-white flex items-center">
          <FontAwesomeIcon 
            icon={status.isReady ? "link" : "unlink"} 
            className="mr-2"
          />
          Estado Blockchain
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Estado:</span>
            <Badge variant={status.isReady ? "default" : "destructive"}>
              {status.mode === "blockchain" ? "Conectado" : 
               status.mode === "local" ? "Modo Local" : "Desconectado"}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Red:</span>
            <span className="text-sm text-gray-600">{status.network}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Operador:</span>
            <span className="text-sm text-gray-600 font-mono">
              {status.operatorAddress.length > 20 
                ? `${status.operatorAddress.substring(0, 6)}...${status.operatorAddress.substring(status.operatorAddress.length - 4)}`
                : status.operatorAddress}
            </span>
          </div>
          
          {status.isReady && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Balance:</span>
              <span className="text-sm text-gray-600">{status.balance}</span>
            </div>
          )}
          
          {status.error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {status.error}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-4">
            {status.isReady 
              ? "✅ Los depósitos se registran en blockchain"
              : "⚠️ Los depósitos se guardan localmente"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}