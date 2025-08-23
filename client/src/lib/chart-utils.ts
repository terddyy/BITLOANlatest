export interface ChartDataPoint {
  time: string;
  actual: number | null;
  predicted: number | null;
}

export function generateMockPriceData(currentPrice: number, hours: number = 24): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();

  // Generate historical data
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const basePrice = currentPrice;
    const decline = Math.max(0, (hours - i) * 20); // Gradual decline
    const volatility = (Math.random() - 0.5) * 200;
    
    data.push({
      time: time.toISOString(),
      actual: basePrice - decline + volatility,
      predicted: null,
    });
  }

  // Generate prediction data (next 6 hours)
  const currentActual = data[data.length - 1].actual!;
  for (let i = 1; i <= 6; i++) {
    const time = new Date(now.getTime() + (i * 60 * 60 * 1000));
    const prediction = i <= 3 
      ? currentActual - (i * 300) 
      : currentActual - 900 + ((i - 3) * 200);
    
    data.push({
      time: time.toISOString(),
      actual: null,
      predicted: prediction,
    });
  }

  return data;
}

export function formatPriceForChart(price: number): string {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatTimeForChart(timeString: string): string {
  const time = new Date(timeString);
  return time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
  });
}

export function calculatePriceChange(current: number, previous: number): {
  absolute: number;
  percentage: number;
} {
  const absolute = current - previous;
  const percentage = (absolute / previous) * 100;
  
  return { absolute, percentage };
}

export function determineRiskLevel(changePercent: number, volatility: number): 'low' | 'medium' | 'high' {
  const absChange = Math.abs(changePercent);
  
  if (absChange > 10 || volatility > 2000) return 'high';
  if (absChange > 5 || volatility > 1000) return 'medium';
  return 'low';
}
