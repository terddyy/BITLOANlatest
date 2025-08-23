import { storage } from "../storage";
import { aiPredictionService } from "./ai-prediction";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

export class PriceMonitorService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async initialize() {
    console.log('Initializing price monitoring service...');
    await this.updatePrice(); // Ensure initial price data is loaded
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting price monitoring service...');
    
    // Update price every 30 seconds (in production, would be real-time WebSocket)
    this.intervalId = setInterval(async () => {
      await this.updatePrice().catch(error => console.error('Error in scheduled price update:', error));
    }, 30000);

    // Generate AI predictions every 5 minutes
    setInterval(async () => {
      await aiPredictionService.generatePrediction().catch(error => console.error('Error in scheduled AI prediction:', error));
    }, 5 * 60 * 1000);
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
    let currentPrice: number | undefined;
    try {
      currentPrice = await this.fetchCoinGeckoPrice();
      console.log('Fetched price from CoinGecko:', currentPrice);
    } catch (coinGeckoError) {
      console.error('CoinGecko fetch failed, falling back to mock price:', coinGeckoError);
      const lastPrice = await storage.getLatestPrice("BTC");
      currentPrice = lastPrice ? parseFloat(lastPrice.price) : 31247.82; // Fallback to last known or default price
      console.log('Using fallback mock price:', currentPrice);
    }

    if (currentPrice === undefined) {
      console.error('Could not determine a price from any source. Skipping price update.');
      return;
    }
    
    try {
      await storage.createPriceHistory({
        symbol: "BTC",
        price: currentPrice.toString(),
        source: "coin_gecko_fallback", // Indicate the source of the price
      });

      // Simulate CoinGecko price feed as backup for demonstration
      const coinGeckoPrice = currentPrice * (0.998 + Math.random() * 0.004); // Slight variance
      await storage.createPriceHistory({
        symbol: "BTC",
        price: coinGeckoPrice.toString(),
        source: "coin_gecko_simulated",
      });

    } catch (error) {
      console.error('Error updating price history:', error);
    }
  }

  private async fetchCoinGeckoPrice(): Promise<number> {
    try {
      const response = await fetch(COINGECKO_API_URL);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }
      const data = await response.json();
      if (data && data.bitcoin && data.bitcoin.usd) {
        return parseFloat(data.bitcoin.usd);
      } else {
        throw new Error('Invalid data structure from CoinGecko API');
      }
    } catch (error) {
      console.error('Failed to fetch CoinGecko price:', error);
      throw error; // Re-throw to allow fallback mechanism in updatePrice
    }
  }

  async getCurrentPrice(): Promise<number> {
    const latestPrice = await storage.getLatestPrice("BTC");
    return latestPrice ? parseFloat(latestPrice.price) : 31247.82;
  }

  async getPriceChange24h(): Promise<{ price: number; change: number; changePercent: number }> {
    const current = await this.getCurrentPrice();
    const yesterdayPriceData = await storage.getPastPrice("BTC", 24 * 60 * 60 * 1000); // Get price 24 hours ago
    const yesterdayPrice = yesterdayPriceData ? parseFloat(yesterdayPriceData.price) : current * 1.044; // Fallback to mock if no data
    
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

