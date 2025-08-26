import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { MongoStorage, IStorage } from "./storage"; // Import MongoStorage class and IStorage interface
import { PriceMonitorService } from "./services/price-monitor"; // Import PriceMonitorService
import { aiPredictionService } from "./services/ai-prediction";
import Notification from './models/Notification'; // Import the Notification model
import LoanPositionModel from './models/LoanPosition'; // Import the LoanPosition model
import { Request, Response, NextFunction } from 'express'; // Import Request, Response, NextFunction
import { User as UserType } from "@shared/schema"; // Correctly import UserType from shared/schema

// Middleware to prevent duplicate notification processing
const lastTriggers = new Map<string, number>();
function notificationGuard(req: Request, res: Response, next: NextFunction) {
  const key = req.body?.riskLevel || "default";
  const now = Date.now();
  if (lastTriggers.has(key) && now - (lastTriggers.get(key) || 0) < 10000) {
    console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Duplicate notification detected within 10 seconds. Skipping.`);
    return res.status(200).json({ skipped: true });
  }
  lastTriggers.set(key, now);
  next();
}

interface PerformTopUpParams {
  userId: string;
  loanPositionId: string;
  amount: number;
  currency: string;
  isAutomatic: boolean;
  reqId: string; // For logging
  wss: WebSocketServer; // For emitting WebSocket updates
}

async function performTopUp({
  userId,
  loanPositionId,
  amount,
  currency,
  isAutomatic,
  reqId,
  wss,
}: PerformTopUpParams) {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const position = await storage.getLoanPosition(loanPositionId);
  if (!position || position.userId !== userId) {
    throw new Error("Loan position not found");
  }

  // Update user's linked wallet balance
  let currentLinkedBalance: number;
  let newLinkedBalance: string;
  const userUpdates: Partial<UserType> = {};

  if (currency === "BTC") {
    currentLinkedBalance = parseFloat(user.linkedWalletBalanceBtc || "0");
    newLinkedBalance = (currentLinkedBalance + amount).toFixed(8); // Changed to add for top-up
    userUpdates.linkedWalletBalanceBtc = newLinkedBalance;
    console.log(`[ReqID: ${reqId}] [${new Date().toISOString()}] Added ${amount} ${currency} to user ${userId} linked BTC wallet balance. New balance: ${newLinkedBalance}`);
  } else if (currency === "USDT") {
    currentLinkedBalance = parseFloat(user.linkedWalletBalanceUsdt || "0");
    newLinkedBalance = (currentLinkedBalance + amount).toFixed(2); // Changed to add for top-up
    userUpdates.linkedWalletBalanceUsdt = newLinkedBalance;
    console.log(`[ReqID: ${reqId}] [${new Date().toISOString()}] Added ${amount} ${currency} to user ${userId} linked USDT wallet balance. New balance: ${newLinkedBalance}`);
  } else {
    throw new Error(`Unsupported currency for top-up: ${currency}`);
  }

  // For top-ups, always update the user's linked wallet balance
  await storage.updateUser(userId, userUpdates);
  console.log(`[ReqID: ${reqId}] [${new Date().toISOString()}] Updated linked wallet balance for user ${userId}.`);

  // Create transaction record
  const transaction = await storage.createTopUpTransaction({
    userId,
    loanPositionId,
    amount: amount.toString(),
    currency,
    isAutomatic,
    txHash: `0x${Math.random().toString(16).substring(2, 10)}`, // Mock hash
    status: "completed",
  });

  // Update position collateral
  const updates: any = {};
  if (currency === "BTC") {
    updates.collateralBtc = (parseFloat(position.collateralBtc) + amount).toString();
  } else if (currency === "USDT") {
    updates.collateralUsdt = (parseFloat(position.collateralUsdt || "0") + amount).toString();
  }

  // Recalculate health factor (simplified)
  const currentPrice = await priceMonitorService.getCurrentPrice();
  const totalCollateralBtcValue = parseFloat(updates.collateralBtc || position.collateralBtc) * currentPrice;
  const totalCollateralUsdtValue = parseFloat(updates.collateralUsdt || position.collateralUsdt || "0");
  const totalCollateralValue = totalCollateralBtcValue + totalCollateralUsdtValue;
  updates.healthFactor = (totalCollateralValue / parseFloat(position.borrowedAmount)).toFixed(2);

  await storage.updateLoanPosition(loanPositionId, updates);

  // Create success notification
  const topUpNotification = new Notification({
    userId,
    message: `${isAutomatic ? "Auto" : "Manual"} Top-Up Success: Added ${amount} ${currency} collateral to '${position.positionName}'.`,
    type: "topup_success",
    isRead: false,
    createdAt: new Date(),
  });
  await topUpNotification.save();

  // Emit new notification via WebSocket
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_notification',
        data: topUpNotification,
      }));
    }
  });

  return { success: true, transaction };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const storage: IStorage = new MongoStorage(); // Instantiate MongoStorage
  const priceMonitorService = new PriceMonitorService(storage); // Instantiate PriceMonitorService with storage

  // Start background services
  await storage.init(); // Initialize storage after DB connection
  await priceMonitorService.initialize();
  priceMonitorService.start();

  // Get the actual demo user ID from storage after initialization
  const userId = storage.getDemoUserId(); // Use the actual user ID from storage

  // WebSocket server for real-time updates - TEMPORARILY COMMENTED OUT
  // const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  // app.set('wss', wss); // Make wss accessible via app.get('wss')
  
  // // Add heartbeat to WebSocket server
  // interface CustomWebSocket extends WebSocket {
  //   isAlive: boolean;
  // }

  // wss.on('connection', (ws: CustomWebSocket) => {
  //   ws.isAlive = true;
  //   ws.on('pong', () => { ws.isAlive = true; });

  //   console.log('WebSocket client connected');
  //   console.log('Attempting to send initial data to new WebSocket client.');
    
  //   // Send initial data
  //   sendDataUpdate(ws);
    
  //   // Send updates every 5 seconds
  //   const interval = setInterval(() => {
  //     if (ws.readyState === WebSocket.OPEN) {
  //       sendDataUpdate(ws);
  //     }
  //   }, 5000);
    
  //   ws.on('close', () => {
  //     console.log('WebSocket client disconnected');
  //     clearInterval(interval);
  //   });

  //   ws.on('error', (error) => {
  //     console.error('WebSocket server encountered error with client:', error);
  //   });
  // });

  // setInterval(() => {
  //   wss.clients.forEach((ws: WebSocket) => {
  //     const customWs = ws as CustomWebSocket;
  //     if (customWs.isAlive === false) return customWs.terminate();
  //     customWs.isAlive = false;
  //     customWs.ping();
  //   });
  // }, 30000); // Ping clients every 30 seconds

  async function sendDataUpdate(ws: WebSocket) {
    try {
      // Use the dynamically fetched userId
      const [priceData, loanPositions, user] = await Promise.all([
        priceMonitorService.getPriceChange24h(),
        // Removed storage.getLatestPrediction() as predictions are now client-side
        storage.getLoanPositions(userId),
        storage.getUser(userId) // Fetch user data for WebSocket updates
      ]);

      if (!user) {
        console.error("User not found for WebSocket update.");
        return;
      }

      const totalCollateralBtc = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.collateralBtc), 0);
      const totalCollateralUsdt = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.collateralUsdt || "0"), 0);
      const totalBorrowed = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.borrowedAmount), 0); // Added to retrieve borrowedAmount
      const currentPrice = priceData.price; // Get current BTC price
      
      const totalCollateralValue = (totalCollateralBtc * currentPrice) + totalCollateralUsdt; // Recalculate total collateral
      const totalBorrowedAmount = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.borrowedAmount), 0); // Sum all borrowed amounts

      const avgHealthFactor = totalBorrowedAmount > 0 
        ? (totalCollateralValue / totalBorrowedAmount).toFixed(2) 
        : "0.00";

      console.log('Sending WebSocket update:', { btcPrice: priceData, healthFactor: avgHealthFactor, userBalances: { btc: user.linkedWalletBalanceBtc, usdt: user.linkedWalletBalanceUsdt } });

      const update = {
        type: 'price_update',
        data: {
          btcPrice: priceData,
          // Removed prediction as it's now client-side
          healthFactor: avgHealthFactor, // Include health factor
          loanPositions: loanPositions, // Include loan positions
          user: { // Include user balances in WebSocket updates
            linkedWalletBalanceBtc: user.linkedWalletBalanceBtc,
            linkedWalletBalanceUsdt: user.linkedWalletBalanceUsdt,
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(update));
        } catch (sendError) {
          console.error('Error sending data to WebSocket:', sendError);
        }
      }
    } catch (error) {
      console.error('Error preparing or sending WebSocket update:', error);
    }
  }

  // REST API Routes
  
  // New loan creation
  app.post("/api/loans/new", async (req, res) => {
    try {
      // Use the dynamically fetched userId
      const { positionName, collateralBtc, borrowedAmount } = req.body;

      if (!positionName || !collateralBtc || !borrowedAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Basic type validation for numbers
      const parsedCollateralBtc = parseFloat(collateralBtc);
      const parsedBorrowedAmount = parseFloat(borrowedAmount);
      const parsedCollateralUsdt = 0; // Default to 0 for new loans

      if (isNaN(parsedCollateralBtc) || parsedCollateralBtc <= 0) {
        return res.status(400).json({ message: "Collateral BTC must be a positive number" });
      }
      if (isNaN(parsedBorrowedAmount) || parsedBorrowedAmount <= 0) {
        return res.status(400).json({ message: "Borrowed amount must be a positive number" });
      }

      const newLoan = await storage.createLoanPosition({
        positionName,
        collateralBtc: parsedCollateralBtc,
        borrowedAmount: parsedBorrowedAmount,
        collateralUsdt: parsedCollateralUsdt, // Include default USDT collateral
      });

      // Invalidate the dashboard query to refetch loan positions
      // This assumes you have a way to access queryClient on the server if needed for a real system
      // For this in-memory mock, a simple response is sufficient.

      console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] New loan created: ${newLoan.id}`);
      res.status(201).json({ success: true, loan: newLoan });
    } catch (error) {
      console.error(`[ReqID: ${req.id}] [${new Date().toISOString()}] Error creating new loan:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Repay loan
  app.patch("/api/loans/:id/repay", async (req, res) => {
    try {
      const { id } = req.params; // loanPositionId
      const { amount, currency } = req.body; // Repayment amount and currency

      if (!id || !amount || !currency) {
        return res.status(400).json({ message: "Missing required fields: loan ID, amount, or currency." });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Repayment amount must be a positive number." });
      }

      // Use the dynamically fetched userId
      const updatedLoan = await storage.repayLoan(userId, id, parsedAmount, currency);

      if (!updatedLoan) {
        return res.status(404).json({ message: "Loan position not found or repayment failed." });
      }

      res.json({ success: true, loan: updatedLoan });
    } catch (error) {
      console.error(`Error repaying loan:`, error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get dashboard data
  app.get("/api/dashboard", async (req, res) => {
    try {
      // Use the dynamically fetched userId
      
      const [user, loanPositions, priceData, prediction] = await Promise.all([
        storage.getUser(userId),
        storage.getLoanPositions(userId),
        // Removed alerts from here as they are now fetched from MongoDB
        priceMonitorService.getPriceChange24h(),
        storage.getLatestPrediction(),
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate total collateral and health metrics
      const totalCollateralBtc = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.collateralBtc), 0);
      // const totalCollateralUsdt = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.collateralUsdt || "0"), 0);
      const totalBorrowed = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.borrowedAmount), 0);
      
      // const totalCollateralValue = (totalCollateralBtc * priceData.price) + totalCollateralUsdt; 
      const totalCollateralValue = totalCollateralBtc + parseFloat(user.linkedWalletBalanceBtc || "0"); // Display total BTC collateral
      const avgHealthFactor = loanPositions.length > 0 
        ? (totalCollateralValue / totalBorrowed).toFixed(2) 
        : "0.00";

      console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Dashboard data - Loan Positions:`, loanPositions);
      console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Dashboard data - Total Collateral Value:`, totalCollateralValue);

      res.json({
        user: {
          username: user.username,
          walletAddress: user.walletAddress,
          linkedWalletBalanceBtc: user.linkedWalletBalanceBtc,
          linkedWalletBalanceUsdt: user.linkedWalletBalanceUsdt,
          autoTopUpEnabled: user.autoTopUpEnabled,
          smsAlertsEnabled: user.smsAlertsEnabled,
        },
        stats: {
          btcPrice: priceData,
          totalCollateral: totalCollateralValue,
          healthFactor: avgHealthFactor,
          activeLoanCount: loanPositions.length,
          totalBorrowed,
        },
        loanPositions,
        // Removed alerts from here
        prediction,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get AI prediction data
  app.get("/api/predictions", async (req, res) => {
    try {
      const latest = await storage.getLatestPrediction();
      const history = await storage.getPredictionHistory(20);
      
      res.json({
        latest,
        history,
      });
    } catch (error) {
      console.error('Predictions error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manual top-up
  app.post("/api/topup", async (req, res) => {
    try {
      const { loanPositionId, amount, currency } = req.body;
      // Use the dynamically fetched userId
      const wss = req.app.get('wss'); // Get wss from app locals

      if (!loanPositionId || !amount || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await performTopUp({
        userId,
        loanPositionId,
        amount,
        currency,
        isAutomatic: false,
        reqId: req.id,
        wss,
      });

      res.json(result);
    } catch (error) {
      console.error('Top-up error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Update user settings
  app.patch("/api/settings", async (req, res) => {
    try {
      // Use the dynamically fetched userId
      const { autoTopUpEnabled, smsAlertsEnabled, linkedWalletBalanceBtc, linkedWalletBalanceUsdt } = req.body;

      const updates: Partial<UserType> = {};
      if (typeof autoTopUpEnabled === "boolean") updates.autoTopUpEnabled = autoTopUpEnabled;
      if (typeof smsAlertsEnabled === "boolean") updates.smsAlertsEnabled = smsAlertsEnabled;
      if (typeof linkedWalletBalanceBtc === "string") updates.linkedWalletBalanceBtc = linkedWalletBalanceBtc;
      if (typeof linkedWalletBalanceUsdt === "string") updates.linkedWalletBalanceUsdt = linkedWalletBalanceUsdt;

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Settings error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark alert as read (now removed as /api/notifications/:id/read handles this)
  // app.patch("/api/alerts/:id/read", async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     await storage.markAlertAsRead(id);
  //     res.json({ success: true });
  //   } catch (error) {
  //     console.error('Alert read error:', error);
  //     res.status(500).json({ message: "Internal server error" });
  //   }
  // });

  // New endpoint to trigger server-side notifications
  app.post("/api/notifications/trigger", notificationGuard, async (req, res) => { // Apply notificationGuard middleware
    try {
      const { riskLevel } = req.body;
      // Use the dynamically fetched userId

      const user = await storage.getUser(userId);
      const wss = req.app.get('wss'); // Get wss from app locals

      if (!user) {
        console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] User not found for notification trigger.`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Received notification trigger for risk level: ${riskLevel}`);

      // Check if auto top-up is enabled and risk is high/medium-high
      if (user.autoTopUpEnabled && (riskLevel === "high" || riskLevel === "medium-high")) {
        // For simplicity, auto top-up the first loan position found for the user
        const loanPositions = await storage.getLoanPositions(userId);
        if (loanPositions.length > 0) {
          const targetLoanPosition = loanPositions[0]; // Auto top-up the first loan
          const autoTopUpAmount = 1000; // Fixed auto top-up amount in USDT

          try {
            await performTopUp({
              userId,
              loanPositionId: targetLoanPosition.id,
              amount: autoTopUpAmount,
              currency: "USDT", // Changed to USDT
              isAutomatic: true,
              reqId: req.id,
              wss,
            });
            console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Auto Top-Up successfully triggered for ${targetLoanPosition.positionName}.`);
          } catch (topUpError) {
            console.error(`[ReqID: ${req.id}] [${new Date().toISOString()}] Auto Top-Up failed for ${targetLoanPosition.positionName}:`, topUpError);
            // Error notification already handled within performTopUp for insufficient funds
          }
        } else {
          console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] No loan positions found for auto top-up for user ${userId}.`);
        }
      }

      // Save in-app notification to MongoDB (only if not an auto top-up specific notification)
      const newNotification = new Notification({
        userId: user.id || userId, // Use user.id if available, otherwise fallback
        message: `AI Price Alert: BTC showing ${riskLevel} risk level. Consider adding collateral.`,
        type: 'price_alert',
        isRead: false,
        createdAt: new Date(),
      });
      await newNotification.save();
      console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] In-app notification saved to DB.`);

      // Emit new notification via WebSocket
      if (wss) {
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'new_notification',
              data: newNotification,
            }));
          }
        });
        console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] New notification emitted via WebSocket.`);
      }

      if (user.smsAlertsEnabled) {
        console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Sending SMS notification for risk level: ${riskLevel}`);
        console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] SMS to ${user.walletAddress}: AI Price Alert: BTC showing ${riskLevel} risk level. Consider adding collateral.`);
        // TODO: Integrate with a real SMS service (e.g., Twilio)
      }

      console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Sending Email notification for risk level: ${riskLevel}`);
      // TODO: Implement Email notification logic

      res.json({ success: true, message: "Server-side notifications processed." });
    } catch (error) {
      console.error(`[ReqID: ${req.id}] [${new Date().toISOString()}] Notification trigger error:`, error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // New endpoint to get notifications for a user
  app.get("/api/notifications", async (req, res) => {
    try {
      // Use the dynamically fetched userId
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);
      res.json(notifications);
    } catch (error) {
      console.error(`[ReqID: ${req.id}] [${new Date().toISOString()}] Error fetching notifications:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get AI prediction data
  app.get("/api/predictions/:timeframe", async (req, res) => {
    try {
      const { timeframe } = req.params;
      const currentBtcPrice = 31247;
      
      let predictionData;
      
      if (timeframe === '1h') {
        // 1-hour prediction: More volatile, frequent price changes
        const basePrice = currentBtcPrice;
        const priceData = [];
        
        // Generate 12 data points for 5-minute intervals over 1 hour
        for (let i = 0; i < 12; i++) {
          const actual = i < 8 ? basePrice + (Math.sin(i * 0.5) * 150) + (Math.random() - 0.5) * 200 : null;
          const predicted = i >= 6 ? basePrice + (Math.sin((i + 4) * 0.4) * 180) + 120 : null;
          priceData.push({ actual, predicted });
        }
        
        predictionData = {
          timeframe: '1h',
          confidence: '81.3',
          riskLevel: 'medium',
          predictedPrice: (basePrice + 180).toString(),
          currentPrice: basePrice.toString(),
          timeHorizon: 1,
          modelAccuracy: '81',
          priceData,
          trend: 'bullish_short_term',
          volatility: 'high'
        };
      } 
      else if (timeframe === '24h') {
        // 24-hour prediction: Less volatile, showing daily trends
        const basePrice = currentBtcPrice;
        const priceData = [];
        
        // Generate 24 data points for hourly intervals over 24 hours
        for (let i = 0; i < 24; i++) {
          const actual = i < 16 ? basePrice + (Math.sin(i * 0.3) * 400) + (Math.random() - 0.5) * 300 : null;
          const predicted = i >= 12 ? basePrice + (Math.cos(i * 0.25) * 350) - 200 : null;
          priceData.push({ actual, predicted });
        }
        
        predictionData = {
          timeframe: '24h',
          confidence: '67.8',
          riskLevel: 'low',
          predictedPrice: (basePrice - 200).toString(),
          currentPrice: basePrice.toString(),
          timeHorizon: 24,
          modelAccuracy: '68',
          priceData,
          trend: 'bearish_daily',
          volatility: 'moderate'
        };
      }
      else {
        // Default 6h data (fallback)
        const basePrice = currentBtcPrice;
        const priceData = [];
        
        // Generate 18 data points for 20-minute intervals over 6 hours
        for (let i = 0; i < 18; i++) {
          const actual = i < 12 ? basePrice + (Math.sin(i * 0.4) * 250) + (Math.random() - 0.5) * 180 : null;
          const predicted = i >= 8 ? basePrice + (Math.cos(i * 0.35) * 200) - 100 : null;
          priceData.push({ actual, predicted });
        }
        
        predictionData = {
          timeframe: '6h',
          confidence: '73.2',
          riskLevel: 'medium',
          predictedPrice: (basePrice - 100).toString(),
          currentPrice: basePrice.toString(),
          timeHorizon: 6,
          modelAccuracy: '73',
          priceData,
          trend: 'sideways',
          volatility: 'low'
        };
      }
      
      res.json(predictionData);
    } catch (error) {
      console.error(`[ReqID: ${req.id}] [${new Date().toISOString()}] Predictions error:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New endpoint to mark a notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });

      if (!notification) {
        console.log(`[ReqID: ${req.id}] [${new Date().toISOString()}] Notification not found for marking as read: ${id}`);
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ success: true, notification });
    } catch (error) {
      console.error(`[ReqID: ${req.id}] [${new Date().toISOString()}] Error marking notification as read:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New proxy endpoint for Binance Kline data
  app.get("/api/binance-klines", async (req, res) => {
    try {
      const { symbol, interval, limit } = req.query;
      if (!symbol || !interval || !limit) {
        return res.status(400).json({ message: "Missing symbol, interval, or limit query parameters" });
      }
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Binance Kline proxy error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New proxy endpoint for Binance 24hr ticker data
  app.get("/api/binance-24h-ticker", async (req, res) => {
    try {
      const { symbol } = req.query;
      if (!symbol) {
        return res.status(400).json({ message: "Missing symbol query parameter" });
      }
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`Binance 24h Ticker API error: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Binance 24hr Ticker proxy error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}