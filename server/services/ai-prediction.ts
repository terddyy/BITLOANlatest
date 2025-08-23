import { storage } from "../storage";
import { type InsertAiPrediction } from "@shared/schema";

// Simple moving average and trend detection for Prophet-like predictions
export class AiPredictionService {
  private priceWindow: number[] = [];
  private readonly windowSize = 24; // 24 hours of price data

  async generatePrediction(): Promise<void> {
    try {
      const currentPrice = await storage.getLatestPrice("BTC");
      if (!currentPrice) return;

      const price = parseFloat(currentPrice.price);
      this.priceWindow.push(price);
      
      // Keep only last windowSize prices
      if (this.priceWindow.length > this.windowSize) {
        this.priceWindow.shift();
      }

      if (this.priceWindow.length < 5) return; // Need minimum data

      const prediction = this.calculatePrediction(price);
      
      await storage.createPrediction({
        currentPrice: price.toString(),
        predictedPrice: prediction.price.toString(),
        timeHorizon: prediction.timeHorizon,
        confidence: prediction.confidence.toString(),
        riskLevel: prediction.riskLevel,
        modelAccuracy: "72.5", // Simulated model accuracy
        priceData: this.generateChartData(price, prediction.price),
      });

      // Check if we need to create alerts
      await this.checkForAlerts(price, prediction);
    } catch (error) {
      console.error('Error generating AI prediction:', error);
    }
  }

  private calculatePrediction(currentPrice: number) {
    // Simple trend analysis
    const recentPrices = this.priceWindow.slice(-6); // Last 6 hours
    const trend = this.calculateTrend(recentPrices);
    const volatility = this.calculateVolatility(recentPrices);
    
    // Predict price change based on trend and volatility
    const trendMultiplier = trend > 0 ? 0.8 : 1.2; // Bearish bias in volatile markets
    const volatilityFactor = Math.min(volatility / 1000, 0.15); // Cap volatility impact
    
    const priceChange = trend * trendMultiplier + (Math.random() - 0.5) * volatilityFactor * currentPrice;
    const predictedPrice = Math.max(currentPrice + priceChange, currentPrice * 0.7); // Min 30% drop
    
    const confidence = Math.max(50, 90 - volatility / 100); // Higher volatility = lower confidence
    const riskLevel = this.determineRiskLevel(trend, volatility, priceChange);
    
    return {
      price: predictedPrice,
      timeHorizon: 2, // 2 hours ahead
      confidence,
      riskLevel,
    };
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    let sum = 0;
    for (let i = 1; i < prices.length; i++) {
      sum += prices[i] - prices[i - 1];
    }
    return sum / (prices.length - 1);
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((a, b) => a + b) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  private determineRiskLevel(trend: number, volatility: number, priceChange: number): string {
    const changePercent = Math.abs(priceChange) / this.priceWindow[this.priceWindow.length - 1] * 100;
    
    if (changePercent > 10 || volatility > 2000) return "high";
    if (changePercent > 5 || volatility > 1000) return "medium";
    return "low";
  }

  private generateChartData(currentPrice: number, predictedPrice: number) {
    const now = new Date();
    const data = [];
    
    // Historical data (simplified - last 6 points)
    for (let i = 5; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const price = this.priceWindow[this.priceWindow.length - 6 + i] || currentPrice;
      data.push({
        time: time.toISOString(),
        actual: price,
        predicted: null,
      });
    }
    
    // Prediction point
    const futureTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    data.push({
      time: futureTime.toISOString(),
      actual: null,
      predicted: predictedPrice,
    });
    
    return data;
  }

  private async checkForAlerts(currentPrice: number, prediction: any) {
    const priceDropThreshold = 0.05; // 5% drop threshold
    const changePercent = (prediction.price - currentPrice) / currentPrice;
    
    if (changePercent < -priceDropThreshold && prediction.confidence > 60) {
      // Get all users for demo - in real app, would be more targeted
      const users = await storage.getUserByUsername("trader.eth");
      if (users) {
        await storage.createAlert({
          userId: users.id,
          type: "price_drop",
          severity: "warning",
          title: "AI Price Alert",
          message: `BTC showing ${prediction.confidence}% probability of ${Math.abs(changePercent * 100).toFixed(1)}% dip in next ${prediction.timeHorizon} hours. Consider adding collateral.`,
          isRead: false,
          metadata: {
            predictedChange: changePercent,
            confidence: prediction.confidence,
            timeHorizon: prediction.timeHorizon,
          },
        });
      }
    }
  }
}

export const aiPredictionService = new AiPredictionService();
