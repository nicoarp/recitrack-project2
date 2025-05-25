// Funciones de simulación para entorno de desarrollo cuando no está disponible MetaMask
// Estas funciones permiten probar la interfaz sin necesidad de una conexión real a blockchain

type MockTransaction = {
  hash: string;
  wait: () => Promise<any>;
};

export const mockRegisterDeposit = async (
  batchId: number,
  bottleCount: number, 
  location: string
): Promise<MockTransaction> => {
  console.log('Simulando registro de depósito en blockchain:', { batchId, bottleCount, location });
  
  // Simulamos un retraso para imitar el comportamiento de la blockchain
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Devolvemos un objeto que simula una transacción
  return {
    hash: '0x' + Math.random().toString(16).substring(2, 42),
    wait: async () => {
      // Simulamos otro retraso para imitar el tiempo de confirmación
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {};
    }
  };
};

export const mockGetBottleHistory = async (batchId: number) => {
  console.log('Simulando obtención de historial para lote:', batchId);
  
  // Simulamos un retraso
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Devolvemos datos de ejemplo
  return [
    {
      eventType: "DepositoLote",
      description: "10 botellas depositadas",
      location: "Punto Limpio Central",
      timestamp: Date.now() - 86400000 * 2, // 2 días atrás
      actor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    },
    {
      eventType: "Procesamiento",
      description: "Botellas clasificadas por color",
      location: "Centro de Reciclaje Municipal",
      timestamp: Date.now() - 86400000, // 1 día atrás
      actor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    }
  ];
};