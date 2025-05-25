import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBlockchain } from "@/hooks/use-blockchain";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { getBottleHistory, formatAddress } from "@/lib/blockchain";
import { BottleEvent } from "@/types/blockchain";

const formSchema = z.object({
  batchId: z.string().min(1, "El ID del lote es requerido").transform(val => parseInt(val, 10))
});

export function BatchHistory() {
  const { isConnected } = useBlockchain();
  const { toast } = useToast();
  const [events, setEvents] = useState<BottleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchId: "1"
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Conecta tu wallet para consultar el historial",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const history = await getBottleHistory(values.batchId);
      setEvents(history);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Error al consultar el historial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-secondary-500 py-4 px-6">
        <CardTitle className="text-lg font-semibold text-white">Historial del Lote</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mb-4">
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 mb-1">ID de Lote a consultar:</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500" 
                        {...field} 
                      />
                    </FormControl>
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="bg-secondary-500 text-white px-4 py-2 rounded-r-md hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition duration-150 ease-in-out"
                    >
                      {loading ? (
                        <FontAwesomeIcon icon="spinner" spin />
                      ) : "Consultar"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        
        <div className="mt-6">
          <div className="border-t border-gray-200 mt-4 pt-4">
            <h3 className="text-md font-medium text-gray-700 mb-3">Eventos registrados:</h3>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
                </div>
              ) : !hasSearched ? (
                <EmptyState 
                  icon="history" 
                  message="Consulta el historial de un lote para ver los eventos registrados en la blockchain" 
                />
              ) : events.length === 0 ? (
                <EmptyState 
                  icon="info-circle" 
                  message={`No se encontraron eventos para el lote #${form.getValues().batchId}`} 
                />
              ) : (
                <ul className="space-y-4">
                  {events.map((event, index) => {
                    const date = new Date(event.timestamp * 1000).toLocaleString();
                    const shortAddress = formatAddress(event.actor);
                    
                    return (
                      <li key={index} className="border-l-4 border-secondary-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-gray-800">{event.eventType}</span>
                            <p className="text-gray-600 mt-1">{event.description}</p>
                            <p className="text-gray-500 text-sm mt-1">Ubicación: {event.location}</p>
                          </div>
                          <span className="text-xs text-gray-400">{date}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Registrado por: {shortAddress}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
