// Almacenamiento local para registros de depósitos de botellas
// Esto simula una base de datos local mientras desarrollamos
// En producción, esto se reemplazaría por la lectura directa de la blockchain

interface BottleEvent {
  eventType: string;
  description: string;
  location: string;
  timestamp: number;
  actor: string;
  batchId: string;
}

// Almacén de eventos en localStorage
export class LocalStorage {
  private static STORAGE_KEY = 'ecotraza_events';

  // Guardar un nuevo evento
  static saveEvent(event: BottleEvent): void {
    const events = this.getEvents();
    events.push(event);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
  }

  // Obtener todos los eventos
  static getEvents(): BottleEvent[] {
    const eventsJson = localStorage.getItem(this.STORAGE_KEY);
    if (!eventsJson) {
      return [];
    }
    return JSON.parse(eventsJson);
  }

  // Obtener eventos para un lote específico
  static getEventsByBatchId(batchId: string): BottleEvent[] {
    const events = this.getEvents();
    return events.filter(event => event.batchId === batchId);
  }

  // Limpiar todos los eventos (para testing)
  static clearEvents(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}