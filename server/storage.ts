import {
  type User as UserSchemaType, // Renamed to avoid conflict with Mongoose model
  type InsertUser,
  type LoanPosition,
  type AiPrediction,
  type InsertAiPrediction,
  type TopUpTransaction,
  type InsertTopUpTransaction,
  type PriceHistory,
  type CreateLoanRequest
} from "@shared/schema";
import { randomUUID } from "crypto";
import LoanPositionModel from './models/LoanPosition'; // Import Mongoose model
import Notification from "./models/Notification"; // Ensure Notification model is imported if needed for other methods
import User from './models/User'; // Import the new User model
import mongoose from 'mongoose'; // Import mongoose to use mongoose.Types.ObjectId

// Define an interface for the raw document returned by .lean() to explicitly include _id
interface RawLoanPositionDocument {
  _id: mongoose.Types.ObjectId;
  userId: string;
  positionName: string;
  collateralBtc: string;
  collateralUsdt: string; // Add collateralUsdt to the raw document interface
  borrowedAmount: string;
  apr: string;
  healthFactor: string;
  isProtected: boolean;
  liquidationPrice?: string | null;
  createdAt: Date; // Mongoose returns Date objects, even with .lean()
  updatedAt: Date; // Mongoose returns Date objects, even with .lean()
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<UserSchemaType | undefined>;
  getUserByUsername(username: string): Promise<UserSchemaType | undefined>;
  createUser(user: InsertUser): Promise<UserSchemaType>;
  updateUser(id: string, updates: Partial<UserSchemaType>): Promise<UserSchemaType | undefined>;

  // Loan position methods (now MongoDB-backed)
  getLoanPositions(userId: string): Promise<LoanPosition[]>;
  getLoanPosition(id: string): Promise<LoanPosition | undefined>;
  createLoanPosition(loanRequest: CreateLoanRequest): Promise<LoanPosition>;
  updateLoanPosition(id: string, updates: Partial<LoanPosition>): Promise<LoanPosition | undefined>;
  deleteLoanPosition(id: string): Promise<void>;

  // AI prediction methods
  getLatestPrediction(): Promise<AiPrediction | undefined>;
  createPrediction(prediction: InsertAiPrediction): Promise<AiPrediction>;
  getPredictionHistory(limit?: number): Promise<AiPrediction[]>;

  // Top-up transaction methods
  getTopUpTransactions(userId: string, limit?: number): Promise<TopUpTransaction[]>;
  createTopUpTransaction(transaction: InsertTopUpTransaction): Promise<TopUpTransaction>;

  // Price history methods
  getLatestPrice(symbol: string): Promise<PriceHistory | undefined>;
  createPriceHistory(price: PriceHistory): Promise<PriceHistory>;
  getPriceHistory(symbol: string, limit?: number): Promise<PriceHistory[]>;
  getPastPrice(symbol: string, timeAgoMs: number): Promise<PriceHistory | undefined>;
}

export class MongoStorage implements IStorage {
  // private users: Map<string, User> = new Map(); // Users now stored in MongoDB
  private aiPredictions: AiPrediction[] = []; // AI predictions still in memory for simplicity for now
  private topUpTransactions: Map<string, TopUpTransaction> = new Map(); // Top-up transactions still in memory for simplicity for now
  private priceHistory: Map<string, PriceHistory> = new Map(); // Price history still in memory for simplicity for now

  constructor() {
    this.initializeMockUsersAndLoans(); // Initialize mock users and loans
  }

  private async initializeMockUsersAndLoans() {
    // Check if demo user already exists in MongoDB
    let demoUser = await User.findOne({ username: "trader.eth" }).lean().exec() as (UserSchemaType & { _id: mongoose.Types.ObjectId }) | null;

    if (!demoUser) {
      // Create demo user if not found
      const newDemoUser = new User({
        username: "trader.eth",
        password: "password", // In a real app, hash this password
        walletAddress: "0x1234...5678",
        linkedWalletBalanceBtc: "0.5", // Example BTC balance
        linkedWalletBalanceUsdt: "8450.00", // Example USDT balance
        smsNumber: "+1234567890",
        autoTopUpEnabled: true,
        smsAlertsEnabled: true,
      });
      const savedUser = await newDemoUser.save();
      demoUser = { ...savedUser.toJSON(), id: savedUser._id.toString() } as UserSchemaType & { _id: mongoose.Types.ObjectId }; // Map to User type
      console.log("Initialized mock user in MongoDB.");
    } else {
      console.log("Demo user already exists in MongoDB.");
    }

    // Add initial mock loan data to MongoDB if not already present
    const existingLoans = await LoanPositionModel.countDocuments({ userId: demoUser.id });
    if (existingLoans === 0) {
      // const positions: CreateLoanRequest[] = [
      //   {
      //     positionName: "BTC-001",
      //     collateralBtc: 0.45,
      //     borrowedAmount: 8500.00,
      //     collateralUsdt: 0, // Initialize with 0 USDT
      //   },
      //   {
      //     positionName: "BTC-002",
      //     collateralBtc: 0.32,
      //     borrowedAmount: 5500.00,
      //     collateralUsdt: 0, // Initialize with 0 USDT
      //   },
      // ];

      // for (const loanRequest of positions) {
      //   await this.createLoanPosition(loanRequest);
      // }
      console.log("Skipped initializing mock loan positions as they should be managed by the user.");
    }
  }

  // User methods (now MongoDB-backed)
  async getUser(id: string): Promise<UserSchemaType | undefined> {
    const user = (await User.findById(id).lean().exec()) as (UserSchemaType & { _id: mongoose.Types.ObjectId }) | null;
    if (!user) return undefined;
    return { ...user, id: user._id.toString() };
  }

  async getUserByUsername(username: string): Promise<UserSchemaType | undefined> {
    const user = (await User.findOne({ username }).lean().exec()) as (UserSchemaType & { _id: mongoose.Types.ObjectId }) | null;
    if (!user) return undefined;
    return { ...user, id: user._id.toString() };
  }

  async createUser(insertUser: InsertUser): Promise<UserSchemaType> {
    const newUser = new User({
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const savedUser = await newUser.save();
    return { ...savedUser.toJSON(), id: savedUser._id.toString() };
  }

  async updateUser(id: string, updates: Partial<UserSchemaType>): Promise<UserSchemaType | undefined> {
    const updatedUser = (await User.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean().exec()) as (UserSchemaType & { _id: mongoose.Types.ObjectId }) | null;
    if (!updatedUser) return undefined;
    return { ...updatedUser, id: updatedUser._id.toString() };
  }

  // Loan position methods (now MongoDB-backed)
  async getLoanPositions(userId: string): Promise<LoanPosition[]> {
    const positions = (await LoanPositionModel.find({ userId }).lean().exec()) as RawLoanPositionDocument[];
    return positions.map((pos) => ({
      id: pos._id.toString(),
      userId: pos.userId,
      positionName: pos.positionName,
      collateralBtc: pos.collateralBtc,
      collateralUsdt: pos.collateralUsdt, // Include collateralUsdt in mapping
      borrowedAmount: pos.borrowedAmount,
      apr: pos.apr,
      healthFactor: pos.healthFactor,
      isProtected: pos.isProtected,
      liquidationPrice: pos.liquidationPrice,
      createdAt: new Date(pos.createdAt),
      updatedAt: new Date(pos.updatedAt),
    }));
  }

  async getLoanPosition(id: string): Promise<LoanPosition | undefined> {
    const position = (await LoanPositionModel.findById(id).lean().exec()) as RawLoanPositionDocument | null;
    if (!position) return undefined;
    return {
      id: position._id.toString(),
      userId: position.userId,
      positionName: position.positionName,
      collateralBtc: position.collateralBtc,
      collateralUsdt: position.collateralUsdt, // Include collateralUsdt in mapping
      borrowedAmount: position.borrowedAmount,
      apr: position.apr,
      healthFactor: position.healthFactor,
      isProtected: position.isProtected,
      liquidationPrice: position.liquidationPrice,
      createdAt: new Date(position.createdAt),
      updatedAt: new Date(position.updatedAt),
    };
  }

  async createLoanPosition(loanRequest: CreateLoanRequest): Promise<LoanPosition> {
    const userId = "demo-user-id"; // Assuming a demo user for simplicity
    const newLoan = new LoanPositionModel({
      userId,
      positionName: loanRequest.positionName,
      collateralBtc: loanRequest.collateralBtc.toFixed(8),
      collateralUsdt: "0.00", // Default collateralUsdt
      borrowedAmount: loanRequest.borrowedAmount.toFixed(2),
      apr: "7.5", // Default APR
      healthFactor: "2.0", // Default healthy health factor
      isProtected: true,
      liquidationPrice: "25000.00", // Example liquidation price
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const savedLoan = await newLoan.save();
    return {
      id: savedLoan._id.toString(),
      userId: savedLoan.userId,
      positionName: savedLoan.positionName,
      collateralBtc: savedLoan.collateralBtc,
      collateralUsdt: savedLoan.collateralUsdt, // Include collateralUsdt in mapping
      borrowedAmount: savedLoan.borrowedAmount,
      apr: savedLoan.apr,
      healthFactor: savedLoan.healthFactor,
      isProtected: savedLoan.isProtected,
      liquidationPrice: savedLoan.liquidationPrice,
      createdAt: new Date(savedLoan.createdAt),
      updatedAt: new Date(savedLoan.updatedAt),
    };
  }

  async updateLoanPosition(id: string, updates: Partial<LoanPosition>): Promise<LoanPosition | undefined> {
    const updatedLoan = (await LoanPositionModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean().exec()) as RawLoanPositionDocument | null;
    if (!updatedLoan) return undefined;
    return {
      id: updatedLoan._id.toString(),
      userId: updatedLoan.userId,
      positionName: updatedLoan.positionName,
      collateralBtc: updatedLoan.collateralBtc,
      collateralUsdt: updatedLoan.collateralUsdt, // Include collateralUsdt in mapping
      borrowedAmount: updatedLoan.borrowedAmount,
      apr: updatedLoan.apr,
      healthFactor: updatedLoan.healthFactor,
      isProtected: updatedLoan.isProtected,
      liquidationPrice: updatedLoan.liquidationPrice,
      createdAt: new Date(updatedLoan.createdAt),
      updatedAt: new Date(updatedLoan.updatedAt),
    };
  }

  async deleteLoanPosition(id: string): Promise<void> {
    await LoanPositionModel.findByIdAndDelete(id).exec();
  }

  // AI prediction methods (remain in-memory for now)
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

  // Top-up transaction methods (remain in-memory for now)
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

  // Price history methods (remain in-memory for now)
  async getLatestPrice(symbol: string): Promise<PriceHistory | undefined> {
    return Array.from(this.priceHistory.values())
      .filter(price => price.symbol === symbol)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))[0];
  }

  async createPriceHistory(insertPrice: PriceHistory): Promise<PriceHistory> {
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

export const storage = new MongoStorage();