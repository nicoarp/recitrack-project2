import { 
  User, 
  InsertUser, 
  RecyclingPoint, 
  InsertRecyclingPoint, 
  BottleDeposit, 
  InsertBottleDeposit 
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
  private userIdCounter: number;
  private pointIdCounter: number;
  private depositIdCounter: number;

  constructor() {
    this.users = new Map();
    this.recyclingPoints = new Map();
    this.bottleDeposits = new Map();
    this.userIdCounter = 1;
    this.pointIdCounter = 1;
    this.depositIdCounter = 1;
    
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
    
    // Sample users
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
      ...insertDeposit, 
      id, 
      timestamp,
      userId: insertDeposit.userId || null,
      txHash: insertDeposit.txHash || null
    };
    this.bottleDeposits.set(id, deposit);
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
}

export const storage = new MemStorage();
