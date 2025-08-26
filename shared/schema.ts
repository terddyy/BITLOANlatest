import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  linkedWalletBalanceBtc: decimal("linked_wallet_balance_btc", { precision: 18, scale: 8 }).default("0"), // New BTC balance field
  linkedWalletBalanceUsdt: decimal("linked_wallet_balance_usdt", { precision: 18, scale: 2 }).default("0"), // New USDT balance field
  smsNumber: text("sms_number"),
  autoTopUpEnabled: boolean("auto_top_up_enabled").default(true),
  smsAlertsEnabled: boolean("sms_alerts_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Removed Drizzle ORM definition for loanPositions
// export const loanPositions = pgTable("loan_positions", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   userId: varchar("user_id").notNull().references(() => users.id),
//   positionName: text("position_name").notNull(),
//   collateralBtc: decimal("collateral_btc", { precision: 18, scale: 8 }).notNull(),
//   collateralUsdt: decimal("collateral_usdt", { precision: 18, scale: 2 }).default("0"),
//   borrowedAmount: decimal("borrowed_amount", { precision: 18, scale: 2 }).notNull(),
//   apr: decimal("apr", { precision: 5, scale: 2 }).notNull(),
//   healthFactor: decimal("health_factor", { precision: 10, scale: 2 }).notNull(),
//   isProtected: boolean("is_protected").default(true),
//   liquidationPrice: decimal("liquidation_price", { precision: 18, scale: 2 }),
//   createdAt: timestamp("created_at").defaultNow(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// });

export const aiPredictions = pgTable("ai_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow(),
  currentPrice: decimal("current_price", { precision: 18, scale: 2 }).notNull(),
  predictedPrice: decimal("predicted_price", { precision: 18, scale: 2 }).notNull(),
  timeHorizon: integer("time_horizon").notNull(), // hours
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high
  modelAccuracy: decimal("model_accuracy", { precision: 5, scale: 2 }),
  priceData: jsonb("price_data"), // historical price array for chart
});

// New Notification Type for MongoDB
export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string; // Date will be stringified
}

export const topUpTransactions = pgTable("top_up_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  // loanPositionId: varchar("loan_position_id").notNull().references(() => loanPositions.id), // Removed reference to Drizzle loanPositions
  loanPositionId: varchar("loan_position_id").notNull(), // Now just a string
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // USDT, BTC
  isAutomatic: boolean("is_automatic").default(false),
  txHash: text("tx_hash"),
  status: text("status").default("completed"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(), // BTC, ETH, etc.
  price: decimal("price", { precision: 18, scale: 2 }).notNull(),
  source: text("source").notNull(), // binance, chainlink
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
// export const insertLoanPositionSchema = createInsertSchema(loanPositions).omit({ id: true, createdAt: true, updatedAt: true }); // Removed Drizzle insert schema
export const insertAiPredictionSchema = createInsertSchema(aiPredictions).omit({ id: true });
export const insertTopUpTransactionSchema = createInsertSchema(topUpTransactions).omit({ id: true, createdAt: true });
export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Updated LoanPosition interface for MongoDB
export interface LoanPosition {
  id: string;
  userId: string;
  positionName: string;
  collateralBtc: string;
  collateralUsdt: string; // Re-added USDT collateral
  borrowedAmount: string;
  apr: string;
  healthFactor: string;
  isProtected: boolean;
  liquidationPrice?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// export type InsertLoanPosition = z.infer<typeof insertLoanPositionSchema>; // Removed Drizzle InsertLoanPosition
export type AiPrediction = typeof aiPredictions.$inferSelect;
export type InsertAiPrediction = z.infer<typeof insertAiPredictionSchema>;
export type TopUpTransaction = typeof topUpTransactions.$inferSelect;
export type InsertTopUpTransaction = z.infer<typeof insertTopUpTransactionSchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;

export interface CreateLoanRequest {
  positionName: string;
  collateralBtc: number;
  collateralUsdt: number; // Add collateralUsdt to CreateLoanRequest interface
  borrowedAmount: number;
}
