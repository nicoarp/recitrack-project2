import React from "react";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { BlockchainProvider } from "@/hooks/use-blockchain";

export default function Deposits() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Depósito</h1>
        <p className="mt-2 text-gray-600">Registra nuevos depósitos de botellas en la blockchain</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <DepositForm />
      </div>
    </div>
  );
}
