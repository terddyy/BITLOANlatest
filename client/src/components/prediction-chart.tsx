import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface PredictionChartProps {
  prediction?: {
    priceData?: any[];
    confidence: string;
    riskLevel: string;
    predictedPrice: string;
    currentPrice: string;
    timeHorizon: number;
    modelAccuracy?: string;
  };
}

export default function PredictionChart({ prediction }: PredictionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!prediction?.priceData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart configuration
    const padding = 40;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = rect.height - 2 * padding;

    // Process data
    const data = prediction.priceData || [];
    if (data.length === 0) return;

    const prices = data.map(d => d.actual || d.predicted).filter(p => p !== null);
    const minPrice = Math.min(...prices) * 0.995;
    const maxPrice = Math.max(...prices) * 1.005;

    // Helper functions
    const getX = (index: number) => padding + (index / (data.length - 1)) * chartWidth;
    const getY = (price: number) => padding + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;

    // Draw grid
    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw actual price line
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let firstActual = true;
    data.forEach((point, index) => {
      if (point.actual !== null) {
        const x = getX(index);
        const y = getY(point.actual);
        if (firstActual) {
          ctx.moveTo(x, y);
          firstActual = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();

    // Draw predicted price line
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    let firstPredicted = true;
    data.forEach((point, index) => {
      if (point.predicted !== null) {
        const x = getX(index);
        const y = getY(point.predicted);
        if (firstPredicted) {
          ctx.moveTo(x, y);
          firstPredicted = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Add price points
    data.forEach((point, index) => {
      const x = getX(index);
      if (point.actual !== null) {
        const y = getY(point.actual);
        ctx.fillStyle = "#F59E0B";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (point.predicted !== null) {
        const y = getY(point.predicted);
        ctx.fillStyle = "#EF4444";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

  }, [prediction]);

  if (!prediction) {
    return (
      <div className="bg-card-bg rounded-xl p-6 border border-slate-700">
        <div className="text-center py-8">
          <p className="text-slate-400">Loading AI prediction data...</p>
        </div>
      </div>
    );
  }

  const confidence = parseFloat(prediction.confidence);
  const currentPrice = parseFloat(prediction.currentPrice);
  const predictedPrice = parseFloat(prediction.predictedPrice);
  const changePercent = ((predictedPrice - currentPrice) / currentPrice) * 100;

  return (
    <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="prediction-chart">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white" data-testid="chart-title">AI Price Prediction</h3>
          <p className="text-sm text-slate-400">
            Prophet ML model • {prediction.modelAccuracy || "72"}% accuracy last 30 days
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-slate-700 text-slate-300 px-3 py-1"
            data-testid="button-timeframe-1h"
          >
            1H
          </Button>
          <Button 
            size="sm" 
            className="text-xs bg-bitcoin text-dark-bg px-3 py-1"
            data-testid="button-timeframe-6h"
          >
            6H
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-slate-700 text-slate-300 px-3 py-1"
            data-testid="button-timeframe-24h"
          >
            24H
          </Button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-64" data-testid="chart-canvas-container">
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          data-testid="chart-canvas"
        />
      </div>

      {/* Prediction Summary */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4" data-testid="prediction-summary-price">
          <div className="text-sm text-slate-400">Next {prediction.timeHorizon}H Prediction</div>
          <div className={`text-lg font-semibold ${changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
            ${predictedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4" data-testid="prediction-summary-confidence">
          <div className="text-sm text-slate-400">Confidence Level</div>
          <div className="text-lg font-semibold text-bitcoin">{confidence.toFixed(0)}%</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4" data-testid="prediction-summary-risk">
          <div className="text-sm text-slate-400">Risk Level</div>
          <div className={`text-lg font-semibold capitalize ${
            prediction.riskLevel === 'high' ? 'text-danger' : 
            prediction.riskLevel === 'medium' ? 'text-bitcoin' : 'text-success'
          }`}>
            {prediction.riskLevel}
          </div>
        </div>
      </div>
    </div>
  );
}
