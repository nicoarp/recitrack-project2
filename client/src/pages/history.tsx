import React from "react";
import { BatchHistory } from "@/components/dashboard/batch-history";
import { BlockchainProvider } from "@/hooks/use-blockchain";

export default function History() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Historial de Lotes</h1>
        <p className="mt-2 text-gray-600">Consulta el historial completo de lotes registrados en la blockchain</p>
      </div>
      
      <div className="max-w-lg mx-auto">
        <BatchHistory />
      </div>
    </div>
  );
}
