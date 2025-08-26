import {
  type User as UserSchemaType, // Renamed to avoid conflict with Mongoose model
  type InsertUser,
  type LoanPosition as LoanPositionType,
  type AiPrediction as AIPredictionType,
  type InsertAiPrediction,
  type TopUpTransaction as TopUpTransactionType,
  type InsertTopUpTransaction,
  type PriceHistory as PriceHistoryType,
  type CreateLoanRequest
} from "@shared/schema";
import { randomUUID } from "crypto";
import LoanPositionModel from './models/LoanPosition'; // Import Mongoose model
import Notification from "./models/Notification"; // Ensure Notification model is imported if needed for other methods
import User, { IUserDocument } from './models/User'; // Import User model and interface
import AIPredictionModel from './models/AIPrediction'; // Import AIPrediction model
import PriceHistoryModel from './models/PriceHistory'; // Import PriceHistory model
import TopUpTransactionModel from './models/TopUpTransaction'; // Import TopUpTransaction model
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
  getUser(id: string): Promise<(UserSchemaType & { id: string }) | undefined>;
  getUserByUsername(username: string): Promise<(UserSchemaType & { id: string }) | undefined>;
  createUser(user: InsertUser): Promise<UserSchemaType & { id: string }>;
  updateUser(id: string, updates: Partial<UserSchemaType>): Promise<(UserSchemaType & { id: string }) | undefined>;

  // Loan position methods (now MongoDB-backed)
  getLoanPositions(userId: string): Promise<(LoanPositionType & { id: string })[]>;
  getLoanPosition(id: string): Promise<(LoanPositionType & { id: string }) | undefined>;
  createLoanPosition(loanRequest: CreateLoanRequest): Promise<LoanPositionType & { id: string }>;
  updateLoanPosition(id: string, updates: Partial<LoanPositionType>): Promise<(LoanPositionType & { id: string }) | undefined>;
  deleteLoanPosition(id: string): Promise<void>;

  // AI prediction methods
  getLatestPrediction(): Promise<(AIPredictionType & { id: string }) | undefined>;
  createPrediction(prediction: InsertAiPrediction): Promise<AIPredictionType & { id: string }>;
  getPredictionHistory(limit?: number): Promise<(AIPredictionType & { id: string })[]>;

  // Top-up transaction methods
  getTopUpTransactions(userId: string, limit?: number): Promise<(TopUpTransactionType & { id: string })[]>;
  createTopUpTransaction(transaction: InsertTopUpTransaction): Promise<TopUpTransactionType & { id: string }>;

  // Price history methods
  getLatestPrice(symbol: string): Promise<(PriceHistoryType & { id: string }) | undefined>;
  createPriceHistory(price: Omit<PriceHistoryType, "id" | "createdAt">): Promise<PriceHistoryType & { id: string }>;
  getPriceHistory(symbol: string, limit?: number): Promise<(PriceHistoryType & { id: string })[]>;
  getPastPrice(symbol: string, timeAgoMs: number): Promise<(PriceHistoryType & { id: string }) | undefined>;
}

export class MongoStorage implements IStorage {
  private demoUserId: string | null = null;

  async init() {
    let demoUser = await User.findOne({ username: "trader.eth" });

    if (!demoUser) {
      console.log("Demo user not found, creating...");
      const newDemoUser = new User({
        username: "trader.eth",
        walletAddress: "0x9730c4e0b01962a66b7582b7b8a7b21a329d4d4f",
        linkedWalletBalanceBtc: "0.5",
        linkedWalletBalanceUsdt: "20000",
        autoTopUpEnabled: true,
        smsAlertsEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedUser = await newDemoUser.save();
      demoUser = savedUser;
      console.log("Demo user created.");
    } else {
      console.log("Demo user found.");
    }
    this.demoUserId = demoUser.id; // Store the demo user ID
    console.log(`[Storage] Demo user ID set to: ${this.demoUserId}`);
  }

  public getDemoUserId(): string {
    if (!this.demoUserId) {
      console.error("[Storage] Attempted to get demoUserId before initialization.");
      throw new Error("Demo user not initialized. Call init() first.");
    }
    return this.demoUserId;
  }

  async getUser(id: string): Promise<(UserSchemaType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const user = (await User.findById(id).lean().exec()) as (IUserDocument & { _id: mongoose.Types.ObjectId }) | null;
    if (!user) return undefined;
    return { ...user, id: user._id.toString() };
  }

  async getUserByUsername(username: string): Promise<(UserSchemaType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const user = (await User.findOne({ username }).lean().exec()) as (IUserDocument & { _id: mongoose.Types.ObjectId }) | null;
    if (!user) return undefined;
    return { ...user, id: user._id.toString() };
  }

  async createUser(insertUser: InsertUser): Promise<UserSchemaType & { id: string }> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const newUser = new User({
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const savedUser = await newUser.save();
    return { ...savedUser.toJSON(), id: savedUser._id.toString() };
  }

  async updateUser(id: string, updates: Partial<UserSchemaType>): Promise<(UserSchemaType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    console.log("Updating user with:", updates);
    const updatedUser = (await User.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean().exec()) as (IUserDocument & { _id: mongoose.Types.ObjectId }) | null;
    if (!updatedUser) return undefined;
    return { ...updatedUser, id: updatedUser._id.toString() };
  }

  async getLoanPositions(userId: string): Promise<(LoanPositionType & { id: string })[]> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const positions = (await LoanPositionModel.find({ userId }).lean().exec()) as RawLoanPositionDocument[];
    return positions.map((pos) => ({
      id: pos._id.toString(),
      userId: pos.userId,
      positionName: pos.positionName,
      collateralBtc: pos.collateralBtc,
      collateralUsdt: pos.collateralUsdt,
      borrowedAmount: pos.borrowedAmount,
      apr: pos.apr,
      healthFactor: pos.healthFactor,
      isProtected: pos.isProtected,
      liquidationPrice: pos.liquidationPrice,
      createdAt: new Date(pos.createdAt),
      updatedAt: new Date(pos.updatedAt),
    }));
  }

  async getLoanPosition(id: string): Promise<(LoanPositionType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const position = (await LoanPositionModel.findById(id).lean().exec()) as RawLoanPositionDocument | null;
    if (!position) return undefined;
    return {
      id: position._id.toString(),
      userId: position.userId,
      positionName: position.positionName,
      collateralBtc: position.collateralBtc,
      collateralUsdt: position.collateralUsdt,
      borrowedAmount: position.borrowedAmount,
      apr: position.apr,
      healthFactor: position.healthFactor,
      isProtected: position.isProtected,
      liquidationPrice: position.liquidationPrice,
      createdAt: new Date(position.createdAt),
      updatedAt: new Date(position.updatedAt),
    };
  }

  async createLoanPosition(loanRequest: CreateLoanRequest): Promise<LoanPositionType & { id: string }> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const newLoan = new LoanPositionModel({
      userId: this.demoUserId,
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
    console.log(`[Storage] Saved new loan to DB: ${savedLoan._id.toString()}`);
    return {
      id: savedLoan._id.toString(),
      userId: savedLoan.userId,
      positionName: savedLoan.positionName,
      collateralBtc: savedLoan.collateralBtc,
      collateralUsdt: savedLoan.collateralUsdt,
      borrowedAmount: savedLoan.borrowedAmount,
      apr: savedLoan.apr,
      healthFactor: savedLoan.healthFactor,
      isProtected: savedLoan.isProtected,
      liquidationPrice: savedLoan.liquidationPrice,
      createdAt: new Date(savedLoan.createdAt),
      updatedAt: new Date(savedLoan.updatedAt),
    };
  }

  async updateLoanPosition(id: string, updates: Partial<LoanPositionType>): Promise<(LoanPositionType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const updatedLoan = (await LoanPositionModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean().exec()) as RawLoanPositionDocument | null;
    console.log(`[Storage] Updated loan in DB: ${id} with updates:`, updates);
    if (!updatedLoan) return undefined;
    return {
      id: updatedLoan._id.toString(),
      userId: updatedLoan.userId,
      positionName: updatedLoan.positionName,
      collateralBtc: updatedLoan.collateralBtc,
      collateralUsdt: updatedLoan.collateralUsdt,
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
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    await LoanPositionModel.findByIdAndDelete(id).exec();
    console.log(`[Storage] Deleted loan from DB: ${id}`);
  }

  async createPrediction(prediction: Omit<AIPredictionType, "id" | "createdAt">): Promise<AIPredictionType & { id: string }> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const newPrediction = new AIPredictionModel({
      ...prediction,
      createdAt: new Date(),
    });
    const savedPrediction = await newPrediction.save();
    return { ...savedPrediction.toJSON(), id: savedPrediction._id.toString() };
  }

  async getLatestPrediction(): Promise<(AIPredictionType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const latestPrediction = await AIPredictionModel.findOne().sort({ createdAt: -1 }).lean().exec();
    return latestPrediction ? { ...latestPrediction, id: (latestPrediction._id as mongoose.Types.ObjectId).toString() } : undefined;
  }

  async getPredictionHistory(limit: number = 50): Promise<(AIPredictionType & { id: string })[]> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const predictions = await AIPredictionModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
    return predictions.map(prediction => ({ ...prediction, id: (prediction._id as mongoose.Types.ObjectId).toString() }));
  }

  async createTopUpTransaction(transaction: Omit<TopUpTransactionType, "id" | "createdAt">): Promise<TopUpTransactionType & { id: string }> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const newTransaction = new TopUpTransactionModel({
      ...transaction,
      createdAt: new Date(),
    });
    const savedTransaction = await newTransaction.save();
    return { ...savedTransaction.toJSON(), id: savedTransaction._id.toString() };
  }

  async getTopUpTransactions(userId: string, limit: number = 20): Promise<(TopUpTransactionType & { id: string })[]> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const transactions = await TopUpTransactionModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
    return transactions.map(transaction => ({ ...transaction, id: (transaction._id as mongoose.Types.ObjectId).toString() }));
  }

  async createPriceHistory(price: Omit<PriceHistoryType, "id" | "createdAt">): Promise<PriceHistoryType & { id: string }> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const newPrice = new PriceHistoryModel({
      ...price,
      createdAt: new Date(),
    });
    const savedPrice = await newPrice.save();
    return { ...savedPrice.toJSON(), id: savedPrice._id.toString() };
  }

  async getLatestPrice(symbol: string): Promise<(PriceHistoryType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const latestPrice = await PriceHistoryModel.findOne({ symbol }).sort({ createdAt: -1 }).lean().exec();
    return latestPrice ? { ...latestPrice, id: (latestPrice._id as mongoose.Types.ObjectId).toString() } : undefined;
  }

  async getPriceHistory(symbol: string, limit: number = 100): Promise<(PriceHistoryType & { id: string })[]> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const prices = await PriceHistoryModel.find({ symbol }).sort({ createdAt: -1 }).limit(limit).lean().exec();
    return prices.map(price => ({ ...price, id: (price._id as mongoose.Types.ObjectId).toString() }));
  }

  async getPastPrice(symbol: string, timeAgoMs: number): Promise<(PriceHistoryType & { id: string }) | undefined> {
    if (!this.demoUserId) {
      throw new Error("Storage not initialized. Call init() first.");
    }
    const targetTime = new Date(Date.now() - timeAgoMs);
    const pastPrice = await PriceHistoryModel.findOne({ symbol, createdAt: { $lte: targetTime } }).sort({ createdAt: -1 }).lean().exec();
    return pastPrice ? { ...pastPrice, id: (pastPrice._id as mongoose.Types.ObjectId).toString() } : undefined;
  }
}

export const storage = new MongoStorage();