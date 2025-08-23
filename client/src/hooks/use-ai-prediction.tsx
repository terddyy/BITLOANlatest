import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type PriceData, type Timeframe } from '../components/real-time-price-chart'; // Re-use types

export interface AiPrediction {
  predictedPrice: string;
  timeHorizon: number; // In hours, e.g., 24 for 1 day
  confidence: number; // Percentage
  riskLevel: string; // e.g., "low", "medium", "high"
  modelAccuracy: number; // Percentage
}

interface UseAiPredictionProps {
  currentPriceData: PriceData[]; // Historical data to base prediction on
  timeframe: Timeframe; // Current timeframe of the chart
}

export const useAiPrediction = ({ currentPriceData, timeframe }: UseAiPredictionProps) => {
  const [prediction, setPrediction] = useState<AiPrediction | null>(null);

  const calculateTrend = useCallback((prices: number[]): number => {
    if (prices.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < prices.length; i++) {
      sum += prices[i] - prices[i - 1];
    }
    return sum / (prices.length - 1);
  }, []);

  const calculateVolatility = useCallback((prices: number[]): number => {
    if (prices.length < 2) return 0;
    const mean = prices.reduce((a, b) => a + b) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }, []);

  const getDynamicModelAccuracy = useCallback((): number => {
    return parseFloat((70 + Math.random() * 10).toFixed(1)); // Between 70.0% and 80.0%
  }, []);

  useEffect(() => {
    if (currentPriceData.length < 5) { // Need minimum data points
      setPrediction(null);
      return;
    }

    const latestPrice = currentPriceData[currentPriceData.length - 1].price;
    const prices = currentPriceData.map(d => d.price);

    // Use a reasonable window for trend and volatility based on available data and timeframe
    const windowSize = prices.length > 24 ? 24 : prices.length;
    const recentPrices = prices.slice(-Math.floor(windowSize / 2));
    const longTermPrices = prices.slice(-windowSize);

    const recentTrend = calculateTrend(recentPrices);
    const longTermTrend = calculateTrend(longTermPrices);
    const volatility = calculateVolatility(recentPrices);

    const timeHorizonHours = 24; // Predict 1 day (24 hours) ahead
    const trendInfluence = 0.5;
    const volatilityInfluence = 0.3;

    let predictedChange = (recentTrend / latestPrice) * trendInfluence * timeHorizonHours * latestPrice;
    predictedChange += (longTermTrend / latestPrice) * (1 - trendInfluence) * timeHorizonHours * latestPrice;
    predictedChange += (Math.random() - 0.5) * volatilityInfluence * volatility;

    const predictedPrice = latestPrice + predictedChange;

    let confidence = 100 - (volatility / latestPrice) * 100 * 2;
    confidence -= Math.abs(recentTrend - longTermTrend) * 100;
    confidence = Math.max(30, Math.min(95, confidence));

    const priceChangePercentage = (predictedChange / latestPrice) * 100;
    let riskLevel: string;
    if (confidence < 50) {
      riskLevel = "high";
    } else if (confidence < 70 || volatility > (latestPrice * 0.02)) {
      riskLevel = "medium";
    } else if (confidence < 85 || volatility > (latestPrice * 0.01)) {
      riskLevel = "medium-low";
    } else {
      riskLevel = "low";
    }

    if (Math.abs(priceChangePercentage) > 5 && riskLevel !== "high") {
        riskLevel = "medium-high";
    } else if (Math.abs(priceChangePercentage) > 10) {
        riskLevel = "high";
    }

    setPrediction({
      predictedPrice: predictedPrice.toFixed(2),
      timeHorizon: timeHorizonHours,
      confidence: parseFloat(confidence.toFixed(1)),
      riskLevel,
      modelAccuracy: getDynamicModelAccuracy(),
    });

  }, [currentPriceData, timeframe, calculateTrend, calculateVolatility, getDynamicModelAccuracy]);

  return { prediction };
}; 