import React from "react";
import { WalletStatus } from "@/components/dashboard/wallet-status";
import { StatsGrid } from "@/components/dashboard/stats-card";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { BatchHistory } from "@/components/dashboard/batch-history";
import { FeaturedContent } from "@/components/dashboard/featured-content";
import { BlockchainProvider } from "@/hooks/use-blockchain";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido a EcoTraza!</h1>
        <p className="mt-2 text-gray-600">Tu plataforma de trazabilidad de reciclaje con tecnología blockchain</p>
      </div>
      
      <WalletStatus />
      
      <StatsGrid />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <DepositForm />
        <BatchHistory />
      </div>
      
      <FeaturedContent />
    </div>
  );
}
