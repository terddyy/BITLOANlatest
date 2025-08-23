import { 
  type User, 
  type InsertUser,
  type LoanPosition,
  type InsertLoanPosition,
  type AiPrediction,
  type InsertAiPrediction,
  type Alert,
  type InsertAlert,
  type TopUpTransaction,
  type InsertTopUpTransaction,
  type PriceHistory,
  type InsertPriceHistory
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Loan position methods
  getLoanPositions(userId: string): Promise<LoanPosition[]>;
  getLoanPosition(id: string): Promise<LoanPosition | undefined>;
  createLoanPosition(position: InsertLoanPosition): Promise<LoanPosition>;
  updateLoanPosition(id: string, updates: Partial<LoanPosition>): Promise<LoanPosition | undefined>;

  // AI prediction methods
  getLatestPrediction(): Promise<AiPrediction | undefined>;
  createPrediction(prediction: InsertAiPrediction): Promise<AiPrediction>;
  getPredictionHistory(limit?: number): Promise<AiPrediction[]>;

  // Alert methods
  getAlerts(userId: string, limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<void>;

  // Top-up transaction methods
  getTopUpTransactions(userId: string, limit?: number): Promise<TopUpTransaction[]>;
  createTopUpTransaction(transaction: InsertTopUpTransaction): Promise<TopUpTransaction>;

  // Price history methods
  getLatestPrice(symbol: string): Promise<PriceHistory | undefined>;
  createPriceHistory(price: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(symbol: string, limit?: number): Promise<PriceHistory[]>;
  getPastPrice(symbol: string, timeAgoMs: number): Promise<PriceHistory | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private loanPositions: Map<string, LoanPosition> = new Map();
  private aiPredictions: AiPrediction[] = [];
  private alerts: Map<string, Alert> = new Map();
  private topUpTransactions: Map<string, TopUpTransaction> = new Map();
  private priceHistory: Map<string, PriceHistory> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create a demo user
    const demoUser: User = {
      id: "demo-user-id",
      username: "trader.eth",
      password: "password",
      walletAddress: "0x1234...5678",
      linkedWalletBalance: "8450.00",
      smsNumber: "+1234567890",
      autoTopUpEnabled: true,
      smsAlertsEnabled: true,
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo loan positions
    const positions: LoanPosition[] = [
      {
        id: "btc-001",
        userId: demoUser.id,
        positionName: "BTC-001",
        collateralBtc: "0.45",
        collateralUsdt: "3200.00",
        borrowedAmount: "8500.00",
        apr: "8.5",
        healthFactor: "1.34",
        isProtected: true,
        liquidationPrice: "25600.00",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "btc-002",
        userId: demoUser.id,
        positionName: "BTC-002",
        collateralBtc: "0.32",
        collateralUsdt: "0.00",
        borrowedAmount: "5500.00",
        apr: "8.2",
        healthFactor: "1.82",
        isProtected: true,
        liquidationPrice: "22100.00",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];
    positions.forEach(pos => this.loanPositions.set(pos.id, pos));

    // Create demo alerts
    const alertsData: Alert[] = [
      {
        id: randomUUID(),
        userId: demoUser.id,
        type: "price_drop",
        severity: "warning",
        title: "Price Drop Detected",
        message: "BTC dropped 3.2% in 15min",
        isRead: false,
        metadata: { priceChange: -3.2, timeFrame: "15min" },
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        type: "auto_topup",
        severity: "info",
        title: "Auto Top-Up Success",
        message: "Added 1,500 USDT collateral",
        isRead: false,
        metadata: { amount: 1500, currency: "USDT" },
        createdAt: new Date(Date.now() - 18 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        type: "model_update",
        severity: "info",
        title: "AI Model Update",
        message: "Accuracy improved to 74.2%",
        isRead: false,
        metadata: { newAccuracy: 74.2 },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];
    alertsData.forEach(alert => this.alerts.set(alert.id, alert));

    // Create initial price history
    const currentPrice = 31247.82;
    const priceEntry: PriceHistory = {
      id: randomUUID(),
      symbol: "BTC",
      price: currentPrice.toString(),
      source: "binance",
      timestamp: new Date(),
    };
    this.priceHistory.set(priceEntry.id, priceEntry);

    // Create demo AI prediction
    const prediction: AiPrediction = {
      id: randomUUID(),
      timestamp: new Date(),
      currentPrice: currentPrice.toString(),
      predictedPrice: "29850.00",
      timeHorizon: 2,
      confidence: "73.00",
      riskLevel: "medium",
      modelAccuracy: "72.00",
      priceData: this.generatePriceData(),
    };
    this.aiPredictions.push(prediction);
  }

  private generatePriceData() {
    const now = new Date();
    const data = [];
    
    // Historical data (last 24 hours)
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const basePrice = 31500;
      const decline = Math.max(0, (24 - i) * 20);
      const volatility = (Math.random() - 0.5) * 200;
      data.push({
        time: time.toISOString(),
        actual: basePrice - decline + volatility,
        predicted: null,
      });
    }
    
    // Prediction data (next 6 hours)
    const currentPrice = data[data.length - 1].actual;
    for (let i = 1; i <= 6; i++) {
      const time = new Date(now.getTime() + (i * 60 * 60 * 1000));
      const prediction = i <= 3 ? currentPrice - (i * 300) : currentPrice - 900 + ((i - 3) * 200);
      data.push({
        time: time.toISOString(),
        actual: null,
        predicted: prediction,
      });
    }
    
    return data;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      walletAddress: insertUser.walletAddress || null,
      linkedWalletBalance: insertUser.linkedWalletBalance || null,
      smsNumber: insertUser.smsNumber || null,
      autoTopUpEnabled: insertUser.autoTopUpEnabled ?? null,
      smsAlertsEnabled: insertUser.smsAlertsEnabled ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Loan position methods
  async getLoanPositions(userId: string): Promise<LoanPosition[]> {
    return Array.from(this.loanPositions.values()).filter(pos => pos.userId === userId);
  }

  async getLoanPosition(id: string): Promise<LoanPosition | undefined> {
    return this.loanPositions.get(id);
  }

  async createLoanPosition(insertPosition: InsertLoanPosition): Promise<LoanPosition> {
    const id = randomUUID();
    const position: LoanPosition = {
      ...insertPosition,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      collateralUsdt: insertPosition.collateralUsdt || null,
      isProtected: insertPosition.isProtected ?? null,
      liquidationPrice: insertPosition.liquidationPrice || null,
    };
    this.loanPositions.set(id, position);
    return position;
  }

  async updateLoanPosition(id: string, updates: Partial<LoanPosition>): Promise<LoanPosition | undefined> {
    const position = this.loanPositions.get(id);
    if (!position) return undefined;
    
    const updatedPosition = { 
      ...position, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.loanPositions.set(id, updatedPosition);
    return updatedPosition;
  }

  // AI prediction methods
  async getLatestPrediction(): Promise<AiPrediction | undefined> {
    return this.aiPredictions[this.aiPredictions.length - 1];
  }

  async createPrediction(insertPrediction: InsertAiPrediction): Promise<AiPrediction> {
    const prediction: AiPrediction = {
      ...insertPrediction,
      id: randomUUID(),
      timestamp: new Date(),
      modelAccuracy: insertPrediction.modelAccuracy || null,
      priceData: insertPrediction.priceData || null,
    };
    this.aiPredictions.push(prediction);
    return prediction;
  }

  async getPredictionHistory(limit = 50): Promise<AiPrediction[]> {
    return this.aiPredictions.slice(-limit);
  }

  // Alert methods
  async getAlerts(userId: string, limit = 20): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const alert: Alert = {
      ...insertAlert,
      id: randomUUID(),
      createdAt: new Date(),
      isRead: insertAlert.isRead ?? null,
      metadata: insertAlert.metadata || null,
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async markAlertAsRead(id: string): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      this.alerts.set(id, { ...alert, isRead: true });
    }
  }

  // Top-up transaction methods
  async getTopUpTransactions(userId: string, limit = 20): Promise<TopUpTransaction[]> {
    return Array.from(this.topUpTransactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createTopUpTransaction(insertTransaction: InsertTopUpTransaction): Promise<TopUpTransaction> {
    const transaction: TopUpTransaction = {
      ...insertTransaction,
      id: randomUUID(),
      createdAt: new Date(),
      isAutomatic: insertTransaction.isAutomatic ?? null,
      txHash: insertTransaction.txHash || null,
      status: insertTransaction.status || null,
    };
    this.topUpTransactions.set(transaction.id, transaction);
    return transaction;
  }

  // Price history methods
  async getLatestPrice(symbol: string): Promise<PriceHistory | undefined> {
    return Array.from(this.priceHistory.values())
      .filter(price => price.symbol === symbol)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))[0];
  }

  async createPriceHistory(insertPrice: InsertPriceHistory): Promise<PriceHistory> {
    const price: PriceHistory = {
      ...insertPrice,
      id: randomUUID(),
      timestamp: new Date(),
    };
    this.priceHistory.set(price.id, price);
    return price;
  }

  async getPriceHistory(symbol: string, limit = 100): Promise<PriceHistory[]> {
    return Array.from(this.priceHistory.values())
      .filter(price => price.symbol === symbol)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async getPastPrice(symbol: string, timeAgoMs: number): Promise<PriceHistory | undefined> {
    const targetTime = new Date(Date.now() - timeAgoMs);
    return Array.from(this.priceHistory.values())
      .filter(price => price.symbol === symbol && price.timestamp! < targetTime)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))[0];
  }
}

export const storage = new MemStorage();
