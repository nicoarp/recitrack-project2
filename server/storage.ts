import { 
  User, 
  InsertUser, 
  RecyclingPoint, 
  InsertRecyclingPoint, 
  BottleDeposit, 
  InsertBottleDeposit,
  ProcessingCenter,
  InsertProcessingCenter
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Recycling Point operations
  getRecyclingPoint(id: number): Promise<RecyclingPoint | undefined>;
  getRecyclingPointByDepositId(depositId: string): Promise<RecyclingPoint | undefined>;
  getAllRecyclingPoints(): Promise<RecyclingPoint[]>;
  createRecyclingPoint(point: InsertRecyclingPoint): Promise<RecyclingPoint>;
  
  // Bottle Deposit operations
  getBottleDeposit(id: number): Promise<BottleDeposit | undefined>;
  getAllBottleDeposits(): Promise<BottleDeposit[]>;
  createBottleDeposit(deposit: InsertBottleDeposit): Promise<BottleDeposit>;
  
  // Processing Center operations
  getProcessingCenter(id: number): Promise<ProcessingCenter | undefined>;
  getAllProcessingCenters(): Promise<ProcessingCenter[]>;
  getProcessingCentersByType(type: string): Promise<ProcessingCenter[]>;
  createProcessingCenter(center: InsertProcessingCenter): Promise<ProcessingCenter>;
  
  // Statistics
  getTotalBottles(): Promise<number>;
  getTotalBatches(): Promise<number>;
  getTotalRecyclingPoints(): Promise<number>;
  
  // User-specific statistics
  getUserBottleDeposits(userId: number): Promise<BottleDeposit[]>;
  getUserTotalBottles(userId: number): Promise<number>;
  getUserTotalDeposits(userId: number): Promise<number>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private recyclingPoints: Map<number, RecyclingPoint>;
  private bottleDeposits: Map<number, BottleDeposit>;
  private processingCenters: Map<number, ProcessingCenter>;
  private userIdCounter: number;
  private pointIdCounter: number;
  private depositIdCounter: number;
  private processingCenterIdCounter: number;

  constructor() {
    this.users = new Map();
    this.recyclingPoints = new Map();
    this.bottleDeposits = new Map();
    this.processingCenters = new Map();
    this.userIdCounter = 1;
    this.pointIdCounter = 1;
    this.depositIdCounter = 1;
    this.processingCenterIdCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample recycling points con IDs únicos para QR
    const recyclingPoints: InsertRecyclingPoint[] = [
      {
        depositId: "CENTRO-001",
        name: "Punto Limpio Central",
        address: "Av. Principal 123, Centro",
        hours: "Lun-Vie: 9:00-18:00, Sáb: 10:00-14:00",
        acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio"]
      },
      {
        depositId: "NORTE-002",
        name: "Punto Limpio Norte",
        address: "Calle Norte 456, Zona Norte",
        hours: "Lun-Vie: 8:00-17:00, Sáb: 9:00-13:00",
        acceptedItems: ["Botellas PET", "Plásticos", "Latas", "Vidrio"]
      },
      {
        depositId: "SUR-003",
        name: "Punto Limpio Sur",
        address: "Av. Sur 789, Zona Sur",
        hours: "Lun-Vie: 9:00-18:00, Sáb: 10:00-15:00",
        acceptedItems: ["Botellas PET", "Electrónicos", "Papel", "Vidrio"]
      },
      {
        depositId: "MUNICIPAL-004",
        name: "Centro de Reciclaje Municipal",
        address: "Carretera Principal Km 5, Afueras",
        hours: "Lun-Dom: 8:00-20:00",
        acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio", "Metales", "Electrónicos"]
      },
      {
        depositId: "LAGO-005",
        name: "Casa, Lago Huechen",
        address: "Lago Huechen",
        hours: "Lun-Dom: 8:00-20:00",
        acceptedItems: ["Botellas PET", "Papel", "Cartón", "Vidrio"]
      }
    ];
    
    recyclingPoints.forEach(point => {
      this.createRecyclingPoint(point);
    });
    
    // Sample processing centers
    const processingCenters: InsertProcessingCenter[] = [
      {
        name: "Centro de Clasificación Santiago",
        location: "Santiago Centro",
        address: "Av. Libertador Bernardo O'Higgins 1234, Santiago",
        centerType: "batch",
        status: "active",
        contactInfo: {
          phone: "+56 2 2345 6789",
          email: "clasificacion@ecotraza.cl",
          manager: "María González"
        }
      },
      {
        name: "Planta de Procesamiento Norte",
        location: "La Serena",
        address: "Ruta 5 Norte Km 512, La Serena",
        centerType: "process",
        status: "active",
        contactInfo: {
          phone: "+56 51 223 4567",
          email: "procesamiento@ecotraza.cl",
          manager: "Carlos Pérez"
        }
      },
      {
        name: "Fábrica de Productos Finales",
        location: "Valparaíso",
        address: "Puerto Industrial, Valparaíso",
        centerType: "product",
        status: "active",
        contactInfo: {
          phone: "+56 32 234 5678",
          email: "produccion@ecotraza.cl",
          manager: "Ana López"
        }
      },
      {
        name: "Centro de Lote Temuco",
        location: "Temuco",
        address: "Av. Alemania 456, Temuco",
        centerType: "batch",
        status: "active",
        contactInfo: {
          phone: "+56 45 234 5678",
          email: "lote.temuco@ecotraza.cl",
          manager: "Roberto Silva"
        }
      },
      {
        name: "Procesadora Concepción",
        location: "Concepción",
        address: "Zona Industrial Bio Bio, Concepción",
        centerType: "process",
        status: "active",
        contactInfo: {
          phone: "+56 41 234 5678",
          email: "proceso.conce@ecotraza.cl",
          manager: "Patricia Morales"
        }
      }
    ];
    
    processingCenters.forEach(center => {
      this.createProcessingCenter(center);
    });
    
    // === USUARIOS CON ROLES DE SEGURIDAD 2025-07 ===
    const users: InsertUser[] = [
      {
        password: "password123",
        email: "admin@ecotraza.com",
        name: "Administrador",
        role: "admin"
      },
      {
        password: "password123", 
        email: "user@example.com",
        name: "Usuario Ejemplo",
        role: "user"
      },
      // Operadores de centros de acopio con roles específicos
      {
        password: "acopio123",
        email: "operador.central@ecotraza.com",
        name: "Juan Pérez (Operador Central)",
        role: "acopio"
      },
      {
        password: "acopio123",
        email: "operador.norte@ecotraza.com", 
        name: "María González (Operador Norte)",
        role: "acopio"
      },
      {
        password: "batch123",
        email: "lote.temuco@ecotraza.com",
        name: "Roberto Silva (Operador Lote)",
        role: "batch_operator"
      },
      // Usuario demo para María González (frontend)
      {
        password: "acopio123",
        email: "acopio@ecotraza.com",
        name: "María González - Centro Acopio",
        role: "centro_acopio"
      }
    ];
    
    users.forEach(user => {
      this.createUser(user);
    });
    
    // Sample bottle deposits
    const deposits: InsertBottleDeposit[] = [
      {
        depositId: "CENTRO-001",
        batchId: 1,
        bottleCount: 15,
        location: "Punto Limpio Central",
        userId: 1,
        txHash: "0x123abc..."
      },
      {
        depositId: "NORTE-002",
        batchId: 1,
        bottleCount: 20,
        location: "Punto Limpio Norte",
        userId: 2,
        txHash: "0x456def..."
      },
      {
        depositId: "CENTRO-001",
        batchId: 2,
        bottleCount: 10,
        location: "Punto Limpio Central",
        userId: 1,
        txHash: "0x789ghi..."
      }
    ];
    
    deposits.forEach(deposit => {
      this.createBottleDeposit(deposit);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      id,
      email: insertUser.email || null,
      password: insertUser.password || null,
      name: insertUser.name || null,
      walletAddress: insertUser.walletAddress || null,
      role: insertUser.role || null,
      isActive: true,
      totalDeposits: 0,
      totalBottles: 0,
      createdAt,
      lastLoginAt: null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Recycling Point operations
  async getRecyclingPoint(id: number): Promise<RecyclingPoint | undefined> {
    return this.recyclingPoints.get(id);
  }

  async getRecyclingPointByDepositId(depositId: string): Promise<RecyclingPoint | undefined> {
    return Array.from(this.recyclingPoints.values()).find(
      (point) => point.depositId === depositId
    );
  }
  
  async getAllRecyclingPoints(): Promise<RecyclingPoint[]> {
    return Array.from(this.recyclingPoints.values());
  }
  
  async createRecyclingPoint(insertPoint: InsertRecyclingPoint): Promise<RecyclingPoint> {
    const id = this.pointIdCounter++;
    const createdAt = new Date();
    const point: RecyclingPoint = { 
      ...insertPoint, 
      id, 
      createdAt,
      hours: insertPoint.hours || null,
      acceptedItems: insertPoint.acceptedItems || null
    };
    this.recyclingPoints.set(id, point);
    return point;
  }
  
  // Bottle Deposit operations
  async getBottleDeposit(id: number): Promise<BottleDeposit | undefined> {
    return this.bottleDeposits.get(id);
  }
  
  async getAllBottleDeposits(): Promise<BottleDeposit[]> {
    return Array.from(this.bottleDeposits.values());
  }
  
  async createBottleDeposit(insertDeposit: InsertBottleDeposit): Promise<BottleDeposit> {
    const id = this.depositIdCounter++;
    const timestamp = new Date();
    const deposit: BottleDeposit = { 
      id,
      depositId: insertDeposit.depositId,
      batchId: insertDeposit.batchId,
      bottleCount: insertDeposit.bottleCount,
      location: insertDeposit.location,
      userId: insertDeposit.userId || null,
      txHash: insertDeposit.txHash || null,
      blockNumber: insertDeposit.blockNumber || null,
      eventId: insertDeposit.eventId || null,
      evidenceHash: insertDeposit.evidenceHash || null,
      contractStatus: insertDeposit.contractStatus || null,
      contractError: insertDeposit.contractError || null,
      timestamp,
      deviceInfo: insertDeposit.deviceInfo || null,
      ipAddress: insertDeposit.ipAddress || null
    };
    this.bottleDeposits.set(id, deposit);
    
    // Update user statistics if deposit is associated with a user
    if (insertDeposit.userId) {
      const user = this.users.get(insertDeposit.userId);
      if (user) {
        user.totalDeposits = (user.totalDeposits || 0) + 1;
        user.totalBottles = (user.totalBottles || 0) + insertDeposit.bottleCount;
        this.users.set(insertDeposit.userId, user);
      }
    }
    
    return deposit;
  }
  
  // Statistics
  async getTotalBottles(): Promise<number> {
    return Array.from(this.bottleDeposits.values()).reduce(
      (total, deposit) => total + deposit.bottleCount, 0
    );
  }
  
  async getTotalBatches(): Promise<number> {
    const uniqueBatchIds = new Set(
      Array.from(this.bottleDeposits.values()).map(deposit => deposit.batchId)
    );
    return uniqueBatchIds.size;
  }
  
  async getTotalRecyclingPoints(): Promise<number> {
    return this.recyclingPoints.size;
  }
  
  // User-specific statistics
  async getUserBottleDeposits(userId: number): Promise<BottleDeposit[]> {
    return Array.from(this.bottleDeposits.values()).filter(
      deposit => deposit.userId === userId
    );
  }
  
  async getUserTotalBottles(userId: number): Promise<number> {
    const userDeposits = await this.getUserBottleDeposits(userId);
    return userDeposits.reduce((total, deposit) => total + deposit.bottleCount, 0);
  }
  
  async getUserTotalDeposits(userId: number): Promise<number> {
    const userDeposits = await this.getUserBottleDeposits(userId);
    return userDeposits.length;
  }

  // Processing Center operations
  async getProcessingCenter(id: number): Promise<ProcessingCenter | undefined> {
    return this.processingCenters.get(id);
  }

  async getAllProcessingCenters(): Promise<ProcessingCenter[]> {
    return Array.from(this.processingCenters.values());
  }

  async getProcessingCentersByType(type: string): Promise<ProcessingCenter[]> {
    return Array.from(this.processingCenters.values()).filter(
      center => center.centerType === type && center.status === 'active'
    );
  }

  async createProcessingCenter(insertCenter: InsertProcessingCenter): Promise<ProcessingCenter> {
    const id = this.processingCenterIdCounter++;
    const now = new Date();
    
    const center: ProcessingCenter = { 
      id,
      name: insertCenter.name,
      location: insertCenter.location,
      address: insertCenter.address || null,
      centerType: insertCenter.centerType,
      status: insertCenter.status || 'active',
      contactInfo: insertCenter.contactInfo || null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.processingCenters.set(id, center);
    return center;
  }
}

export const storage = new MemStorage();
