import React, { useRef, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Info } from "lucide-react";
// import { type AiPrediction } from "@shared/schema"; // Server-side prediction schema
import { useAiPrediction, type AiPrediction } from '../hooks/use-ai-prediction'; // Client-side prediction hook and type

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export interface PriceData {
  time: string; // ISO string for time
  price: number;
}

export type Timeframe = '6h' | '24h' | '7d' | '1m';

interface TickerData {
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
}

interface RealTimePriceChartProps {
  onPriceDataUpdate: (data: PriceData[]) => void; // Callback to update parent with price data
  onTimeframeChange: (timeframe: Timeframe) => void; // Callback to update parent with timeframe
}

// Removed direct Binance API URLs, now using backend proxy
// const BINANCE_KLINE_API_BASE_URL = "https://api.binance.com/api/v3/klines";
// const BINANCE_24HR_TICKER_API_URL = "https://api.binance.com/api/v3/ticker/24hr?symbol=BTC";

const getBinanceKlineParams = (timeframe: Timeframe) => {
  switch (timeframe) {
    case '6h':
      return { interval: '1h', limit: 6 }; // Last 6 hourly candles
    case '24h':
      return { interval: '1h', limit: 24 }; // Last 24 hourly candles
    case '7d':
      return { interval: '1d', limit: 7 }; // Last 7 daily candles
    case '1m':
      return { interval: '1d', limit: 30 }; // Last 30 daily candles (approx 1 month)
    default:
      return { interval: '1h', limit: 24 }; // Default to 24h hourly
  }
};

const RealTimePriceChart: React.FC<RealTimePriceChartProps> = ({ onPriceDataUpdate, onTimeframeChange }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1m'); // Default to 1 month
  const chartRef = useRef<ChartJS<"line", number[], string>>(null);

  const { data: historicalData, isLoading, isFetching } = useQuery<PriceData[]>(
    {
      queryKey: ['binance-bitcoin-historical', selectedTimeframe],
      queryFn: async () => {
        const { interval, limit } = getBinanceKlineParams(selectedTimeframe);
        const response = await fetch(`/api/binance-klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`); // Use proxy endpoint with BTCUSDT
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.statusText}`);
        }
        const result = await response.json();
        // console.log("Raw Binance Kline API response:", result); // DEBUG
        if (!result || !Array.isArray(result)) {
          // console.error("Invalid data structure from Binance API:", result); // Remove console log
          throw new Error('Invalid data structure from Binance API');
        }

        // Binance Kline data structure: [open_time, open, high, low, close, ...]
        let processedData: PriceData[] = result.map((kline: any[]) => ({
          time: new Date(kline[0]).toISOString(), // Open time
          price: parseFloat(kline[4]), // Close price
        }));

        // For simplicity and to match the previous requirement, we will still slice to 50.
        // console.log("Processed historical data before slice:", processedData); // DEBUG
        const slicedData = processedData.slice(-50);
        // console.log("Processed historical data after slice:", slicedData); // DEBUG
        return slicedData;
      },
      staleTime: 5000, // Data considered fresh for 5 seconds for all timeframes
      refetchInterval: 5000,
    }
  );

  // Effect to call onPriceDataUpdate when historicalData changes
  useEffect(() => {
    if (historicalData) {
      // console.log("RealTimePriceChart: historicalData", historicalData); // Remove console log
      onPriceDataUpdate(historicalData);
    }
  }, [historicalData, onPriceDataUpdate]);

  // Effect to call onTimeframeChange when selectedTimeframe changes
  useEffect(() => {
    onTimeframeChange(selectedTimeframe);
  }, [selectedTimeframe, onTimeframeChange]);

  const { data: ticker24hData, isLoading: isLoading24hTicker } = useQuery<TickerData>({
    queryKey: ['binance-24h-ticker'],
    queryFn: async () => {
      const response = await fetch("/api/binance-24h-ticker?symbol=BTCUSDT"); // Use proxy endpoint with BTCUSDT
      if (!response.ok) {
        throw new Error(`Binance 24h Ticker API error: ${response.statusText}`);
      }
      const result = await response.json();
      // console.log("Raw Binance 24hr Ticker API response:", result); // DEBUG
      return result;
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // const { data: kline1hData, isLoading: isLoading1hKline } = useQuery<PriceData[]>({
  //   queryKey: ['binance-1h-kline'],
  //   queryFn: async () => {
  //     const response = await fetch(`${BINANCE_KLINE_API_BASE_URL}?symbol=BTC&interval=1h&limit=2`);
  //     if (!response.ok) {
  //       throw new Error(`Binance 1h Kline API error: ${response.statusText}`);
  //     }
  //     const result = await response.json();
  //     return result.map((kline: any[]) => ({
  //       time: new Date(kline[0]).toISOString(),
  //       price: parseFloat(kline[4]),
  //     }));
  //   },
  //   staleTime: 5000,
  //   refetchInterval: 5000,
  // });

  const priceData = historicalData || [];
  const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 0;
  // console.log("Calculated latestPrice:", latestPrice); // DEBUG

  const { prediction } = useAiPrediction({ currentPriceData: priceData, timeframe: selectedTimeframe });

  // Prepare prediction data for charting
  // const predictionPriceData: PriceData[] = [];
  // if (prediction && prediction.predictedPrice && latestPrice) {
  //   // The prediction is for 24 hours from the latest historical data point
  //   const lastHistoricalPoint = priceData.length > 0 ? priceData[priceData.length - 1] : undefined;
  //   if (lastHistoricalPoint) {
  //     const lastHistoricalTime = new Date(lastHistoricalPoint.time);
  //     const predictedTime = new Date(lastHistoricalTime.getTime() + (prediction.timeHorizon * 60 * 60 * 1000)); // prediction.timeHorizon is in hours
  //     predictionPriceData.push(
  //       { time: lastHistoricalTime.toISOString(), price: lastHistoricalPoint.price }, // Start prediction from last actual price
  //       { time: predictedTime.toISOString(), price: parseFloat(prediction.predictedPrice) }
  //     );
  //   }
  // }

  const chartData = {
    labels: priceData.map((dataPoint) => dataPoint.time),
    datasets: [
      {
        label: 'BTC Price (USD)',
        data: priceData.map((dataPoint) => dataPoint.price),
        fill: false,
        borderColor: '#F59E0B',
        tension: 0.1,
      },
      // Prediction Line
      // ...(predictionPriceData.length > 0 ? [
      //   {
      //     label: 'Predicted Price',
      //     data: predictionPriceData.map((dataPoint) => dataPoint.price),
      //     fill: false,
      //     borderColor: '#1E90FF', // Dodger Blue for prediction
      //     borderDash: [5, 5],
      //     tension: 0.1,
      //     pointRadius: 0,
      //   },
      // ] : []),
    ],
  };

  // Calculate dynamic Y-axis min and max from historical data
  const prices = priceData.map(d => d.price);
  const historicalMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const historicalMaxPrice = prices.length > 0 ? Math.max(...prices) : 100;

  const buffer = (historicalMaxPrice - historicalMinPrice) * 0.1; // 10% buffer
  const yAxisMin = historicalMinPrice - buffer > 0 ? historicalMinPrice - buffer : 0;
  const yAxisMax = historicalMaxPrice + buffer;

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
        },
      },
      title: {
        display: true,
        text: `Bitcoin Price (${selectedTimeframe.toUpperCase()}) from Binance`,
        color: '#ffffff',
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const dataIndex = tooltipItems[0].dataIndex;
            if (dataIndex !== undefined && priceData[dataIndex]) {
              const date = new Date(priceData[dataIndex].time);
              return date.toLocaleString();
            }
            return '';
          },
          label: (tooltipItem) => {
            return `${tooltipItem.dataset.label}: $${(tooltipItem.raw as number)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: selectedTimeframe === '6h' || selectedTimeframe === '24h' ? 'hour' : 'day',
          displayFormats: {
            hour: 'h:mm a',
            day: 'MMM d, yyyy',
            week: 'MMM d, yyyy',
            month: 'MMM yyyy',
          },
        },
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      y: {
        min: yAxisMin,
        max: yAxisMax,
        ticks: {
          color: '#94a3b8',
          callback: function (value) {
            return `$${(value as number).toLocaleString()}`;
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
    },
  };

  return (
    <div className="bg-card-bg rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Real-time Bitcoin Price</h3>
        <div className="flex space-x-2">
          <Button
            variant={selectedTimeframe === '6h' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs px-3 py-1 ${
              selectedTimeframe === '6h'
                ? 'bg-bitcoin text-dark-bg'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTimeframe('6h')}
          >
            6H
          </Button>
          <Button
            variant={selectedTimeframe === '24h' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs px-3 py-1 ${
              selectedTimeframe === '24h'
                ? 'bg-bitcoin text-dark-bg'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTimeframe('24h')}
          >
            24H
          </Button>
          <Button
            variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs px-3 py-1 ${
              selectedTimeframe === '7d'
                ? 'bg-bitcoin text-dark-bg'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTimeframe('7d')}
          >
            7D
          </Button>
          <Button
            variant={selectedTimeframe === '1m' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs px-3 py-1 ${
              selectedTimeframe === '1m'
                ? 'bg-bitcoin text-dark-bg'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTimeframe('1m')}
          >
            1M
          </Button>
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-4 flex items-baseline space-x-2">
        {isLoading || isFetching ? (
          <Loader2 className="h-8 w-8 animate-spin text-bitcoin" />
        ) : (
          `$${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        )}
        {ticker24hData && (
          <div className="flex items-center space-x-1">
            <span className={`text-base font-semibold ${parseFloat(ticker24hData.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parseFloat(ticker24hData.priceChangePercent) >= 0 ? '' : '▾'} {parseFloat(ticker24hData.priceChangePercent).toFixed(1)}% (24h)
            </span>
            <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>
        )}
      </div>
      {prediction && prediction.riskLevel && (
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-sm text-slate-400">Risk Level</div>
            <div className={`text-lg font-semibold capitalize ${
              prediction.riskLevel === 'high' ? 'text-danger' :
              prediction.riskLevel === 'medium' ? 'text-bitcoin' :
              'text-success'
            }`}>
              {prediction.riskLevel}
            </div>
          </div>
        </div>
      )}
      <div className="relative flex-grow h-48 md:h-64 lg:h-80"> {/* Adjusted explicit height classes */}
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 flex items-center justify-center bg-card-bg/80 z-10 rounded-xl">
            <Loader2 className="h-12 w-12 animate-spin text-bitcoin" />
          </div>
        )}
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default RealTimePriceChart; 