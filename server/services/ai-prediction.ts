import { storage } from "../storage";
import { type InsertAiPrediction } from "@shared/schema";

// Simple moving average and trend detection for Prophet-like predictions
export class AiPredictionService {
  private priceWindow: number[] = [];
  private readonly windowSize = 24; // 24 hours of price data

  async generatePrediction(): Promise<void> {
    // Prediction logic moved to client-side. This method will no longer generate predictions.
    // However, it will still update the price window if needed for other server-side logic
    // or if we decide to reintroduce server-side prediction in the future for specific use cases.
    try {
      const currentPrice = await storage.getLatestPrice("BTC");
      if (!currentPrice) return;

      const price = parseFloat(currentPrice.price);
      this.priceWindow.push(price);
      
      // Keep only last windowSize prices
      if (this.priceWindow.length > this.windowSize) {
        this.priceWindow.shift();
      }
      // Since predictions are now client-side, we no longer store them here directly
      // However, we might still want to call this method to populate the priceWindow
      // if other server-side services (e.g., alerts) depend on it.
    } catch (error) {
      console.error('Error updating AI prediction service price window:', error);
    }
  }

  // The following methods are no longer needed on the server as prediction logic moves to client
  // private calculatePrediction(currentPrice: number) { /* ... */ }
  // private calculateTrend(prices: number[]): number { /* ... */ }
  // private calculateVolatility(prices: number[]): number { /* ... */ }
  // private getDynamicModelAccuracy(): number { /* ... */ }

  // generateChartData is now simplified to only provide historical context if needed,
  // without including predictions.
  private generateChartData(currentPrice: number) {
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
    return data;
  }

  // Alerts logic could potentially be moved to client or refactored to use client-side predictions
  // For now, removing it as it directly depends on the server-side prediction object.
  // private async checkForAlerts(currentPrice: number, prediction: any) { /* ... */ }
}

export const aiPredictionService = new AiPredictionService();
