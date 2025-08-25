import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { priceMonitorService } from "./services/price-monitor";
import { aiPredictionService } from "./services/ai-prediction";
import Notification from './models/Notification'; // Import the Notification model

declare global {
  namespace Express {
    interface Request {
      wss?: WebSocketServer;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Start background services
  await priceMonitorService.initialize();
  priceMonitorService.start();

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  app.set('wss', wss); // Make wss accessible via app.get('wss')
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    console.log('Attempting to send initial data to new WebSocket client.');
    
    // Send initial data
    sendDataUpdate(ws);
    
    // Send updates every 5 seconds
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        sendDataUpdate(ws);
      }
    }, 5000);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket server encountered error with client:', error);
    });
  });

  async function sendDataUpdate(ws: WebSocket) {
    try {
      const userId = "demo-user-id"; // Assuming a demo user for simplicity
      const [priceData, loanPositions] = await Promise.all([
        priceMonitorService.getPriceChange24h(),
        // Removed storage.getLatestPrediction() as predictions are now client-side
        storage.getLoanPositions(userId)
      ]);

      const avgHealthFactor = loanPositions.length > 0 
        ? loanPositions.reduce((sum, pos) => sum + parseFloat(pos.healthFactor), 0) / loanPositions.length 
        : 0;
      
      console.log('Sending WebSocket update:', { btcPrice: priceData, healthFactor: avgHealthFactor });

      const update = {
        type: 'price_update',
        data: {
          btcPrice: priceData,
          // Removed prediction as it's now client-side
          healthFactor: avgHealthFactor, // Include health factor
          loanPositions: loanPositions, // Include loan positions
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
  
  // Get dashboard data
  app.get("/api/dashboard", async (req, res) => {
    try {
      const userId = "demo-user-id"; // In real app, get from session
      
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
      const totalCollateralUsdt = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.collateralUsdt || "0"), 0);
      const totalBorrowed = loanPositions.reduce((sum, pos) => sum + parseFloat(pos.borrowedAmount), 0);
      
      const totalCollateralValue = totalCollateralBtc * priceData.price + totalCollateralUsdt;
      const avgHealthFactor = loanPositions.length > 0 
        ? loanPositions.reduce((sum, pos) => sum + parseFloat(pos.healthFactor), 0) / loanPositions.length 
        : 0;

      res.json({
        user: {
          username: user.username,
          walletAddress: user.walletAddress,
          linkedWalletBalance: user.linkedWalletBalance,
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
      const userId = "demo-user-id";

      if (!loanPositionId || !amount || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const position = await storage.getLoanPosition(loanPositionId);
      if (!position || position.userId !== userId) {
        return res.status(404).json({ message: "Loan position not found" });
      }

      // Create transaction record
      const transaction = await storage.createTopUpTransaction({
        userId,
        loanPositionId,
        amount: amount.toString(),
        currency,
        isAutomatic: false,
        txHash: `0x${Math.random().toString(16).substring(2, 10)}`, // Mock hash
        status: "completed",
      });

      // Update position collateral
      const updates: any = {};
      if (currency === "USDT") {
        updates.collateralUsdt = (parseFloat(position.collateralUsdt || "0") + amount).toString();
      } else if (currency === "BTC") {
        updates.collateralBtc = (parseFloat(position.collateralBtc) + amount).toString();
      }

      // Recalculate health factor (simplified)
      const currentPrice = await priceMonitorService.getCurrentPrice();
      const totalCollateral = parseFloat(updates.collateralBtc || position.collateralBtc) * currentPrice + 
                             parseFloat(updates.collateralUsdt || position.collateralUsdt || "0");
      updates.healthFactor = (totalCollateral / parseFloat(position.borrowedAmount)).toFixed(2);

      await storage.updateLoanPosition(loanPositionId, updates);

      // Create success alert
      await storage.createAlert({
        userId,
        type: "auto_topup",
        severity: "info",
        title: "Manual Top-Up Success",
        message: `Added ${amount} ${currency} collateral to ${position.positionName}`,
        isRead: false,
        metadata: { amount, currency, transactionId: transaction.id },
      });

      res.json({ success: true, transaction });
    } catch (error) {
      console.error('Top-up error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const { autoTopUpEnabled, smsAlertsEnabled } = req.body;

      const updates: any = {};
      if (typeof autoTopUpEnabled === "boolean") updates.autoTopUpEnabled = autoTopUpEnabled;
      if (typeof smsAlertsEnabled === "boolean") updates.smsAlertsEnabled = smsAlertsEnabled;

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

  // Mark alert as read
  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markAlertAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Alert read error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New endpoint to trigger server-side notifications
  app.post("/api/notifications/trigger", async (req, res) => {
    try {
      const { riskLevel } = req.body;
      const userId = "demo-user-id"; // Assuming a demo user for simplicity

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Received notification trigger for risk level: ${riskLevel}`);

      // Save in-app notification to MongoDB
      const newNotification = new Notification({
        userId: user.id || userId, // Use user.id if available, otherwise fallback
        message: `AI Price Alert: BTC showing ${riskLevel} risk level. Consider adding collateral.`,
        type: 'price_alert',
        isRead: false,
        createdAt: new Date(),
      });
      await newNotification.save();
      console.log("In-app notification saved to DB.");

      // Emit new notification via WebSocket
      const wss = req.app.get('wss');
      if (wss) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'new_notification',
              data: newNotification,
            }));
          }
        });
        console.log("New notification emitted via WebSocket.");
      }

      if (user.smsAlertsEnabled) {
        console.log(`Sending SMS notification for risk level: ${riskLevel}`);
        // TODO: Integrate with a real SMS service (e.g., Twilio)
      }

      console.log(`Sending Email notification for risk level: ${riskLevel}`);
      // TODO: Implement Email notification logic

      res.json({ success: true, message: "Server-side notifications processed." });
    } catch (error) {
      console.error('Notification trigger error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New endpoint to get notifications for a user
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = "demo-user-id"; // Assuming a demo user for simplicity
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get AI predictions for specific timeframes
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
      console.error('Predictions error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New endpoint to mark a notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
