import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { apiRequest } from "@/lib/queryClient";

// Esquema de validación
const formSchema = z.object({
  batchId: z.string().min(1, "El ID del lote es requerido")
});

export function BatchHistory() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchId: "1"
    }
  });

  const onSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      setHasSearched(true);
      
      console.log('Consultando historial blockchain para el lote:', values.batchId);
      
      // Consultar historial desde el backend blockchain
      const response = await fetch(`/api/blockchain/history/${values.batchId}`);
      const result = await response.json();
      
      if (result.success && result.events) {
        // Ordenar por fecha, del más reciente al más antiguo
        const sortedHistory = [...result.events].sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
        
        toast({
          title: "Historial cargado",
          description: `Se encontraron ${sortedHistory.length} registros blockchain para el lote ${values.batchId}`
        });
      } else if (result.mode === "offline") {
        toast({
          title: "Servicio blockchain offline",
          description: "No se puede consultar el historial en este momento",
          variant: "destructive"
        });
        setHistory([]);
      } else {
        toast({
          title: "Sin historial",
          description: "No se encontraron registros para este lote",
          variant: "destructive"
        });
        setHistory([]);
      }
      
    } catch (error) {
      console.error('Error fetching blockchain history:', error);
      toast({
        title: "Error",
        description: "Error al consultar el historial blockchain",
        variant: "destructive"
      });
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear la fecha
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear la dirección de blockchain
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-secondary-500 py-4 px-6">
        <CardTitle className="text-lg font-semibold text-white">Historial de Lote</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm font-medium text-gray-700">ID de Lote:</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="self-end bg-secondary-500 text-white py-2 px-4 rounded-md hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition duration-150 ease-in-out"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon="spinner" spin className="mr-2" />
                    Buscando...
                  </>
                ) : "Buscar"}
              </Button>
            </div>
          </form>
          
          {hasSearched && (
            <div className="mt-6">
              {history.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Evento
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ubicación
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((event, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {event.eventType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.location}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.quantity || 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.userAddress && event.userAddress !== '0x0000000000000000000000000000000000000000' 
                                ? formatAddress(event.userAddress) 
                                : 'Anónimo'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(event.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatAddress(event.actor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState 
                  icon="history" 
                  message="No se encontró historial para este lote"
                />
              )}
            </div>
          )}
        </Form>
      </CardContent>
    </Card>
  );
}