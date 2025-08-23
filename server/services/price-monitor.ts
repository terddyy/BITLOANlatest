import { storage } from "../storage";
import { aiPredictionService } from "./ai-prediction";

export class PriceMonitorService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting price monitoring service...');
    
    // Update price every 30 seconds (in production, would be real-time WebSocket)
    this.intervalId = setInterval(async () => {
      await this.updatePrice();
    }, 30000);

    // Generate AI predictions every 5 minutes
    setInterval(async () => {
      await aiPredictionService.generatePrediction();
    }, 5 * 60 * 1000);

    // Initial price update
    this.updatePrice();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Price monitoring service stopped');
  }

  private async updatePrice() {
    try {
      // Simulate Binance API call - in production, would use real API
      const mockPrice = await this.fetchMockBinancePrice();
      
      await storage.createPriceHistory({
        symbol: "BTC",
        price: mockPrice.toString(),
        source: "binance",
      });

      // Simulate Chainlink price feed as backup
      const chainlinkPrice = mockPrice * (0.998 + Math.random() * 0.004); // Slight variance
      await storage.createPriceHistory({
        symbol: "BTC",
        price: chainlinkPrice.toString(),
        source: "chainlink",
      });

    } catch (error) {
      console.error('Error updating price:', error);
    }
  }

  private async fetchMockBinancePrice(): Promise<number> {
    // Mock realistic BTC price movement
    const lastPrice = await storage.getLatestPrice("BTC");
    const basePrice = lastPrice ? parseFloat(lastPrice.price) : 31247.82;
    
    // Simulate realistic price volatility
    const volatility = 0.002; // 0.2% max change per update
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const trendBias = -0.0005; // Slight bearish trend for demo
    
    return basePrice * (1 + randomChange + trendBias);
  }

  async getCurrentPrice(): Promise<number> {
    const latestPrice = await storage.getLatestPrice("BTC");
    return latestPrice ? parseFloat(latestPrice.price) : 31247.82;
  }

  async getPriceChange24h(): Promise<{ price: number; change: number; changePercent: number }> {
    const current = await this.getCurrentPrice();
    const yesterdayPrice = current * 1.044; // Mock 24h ago price (higher for negative change)
    
    const change = current - yesterdayPrice;
    const changePercent = (change / yesterdayPrice) * 100;
    
    return {
      price: current,
      change,
      changePercent,
    };
  }
}

export const priceMonitorService = new PriceMonitorService();
