import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import AiAlertBanner from "@/components/ai-alert-banner";
import StatsGrid from "@/components/stats-grid";
import ProtectionPanel from "@/components/protection-panel";
import AlertsPanel from "@/components/alerts-panel";
import LoanPositionsTable from "@/components/loan-positions-table";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState, useEffect } from "react";
import RealTimePriceChart from "@/components/real-time-price-chart";
import { type LoanPosition, type Alert, type AiPrediction } from "@shared/schema";

interface DashboardResponse {
  user: {
    username: string;
    walletAddress?: string | null;
    linkedWalletBalance: string;
    autoTopUpEnabled: boolean;
    smsAlertsEnabled: boolean;
  };
  stats: {
    btcPrice: { price: number; change: number; changePercent: number };
    totalCollateral: number;
    healthFactor: number;
    activeLoanCount: number;
    totalBorrowed: number;
  };
  loanPositions: {
    id: string;
    positionName: string;
    collateralBtc: string;
    collateralUsdt: string;
    borrowedAmount: string;
    apr: string;
    healthFactor: string;
    isProtected: boolean;
    createdAt: string;
    updatedAt?: string | null;
    liquidationPrice?: string | null;
  }[];
  alerts: {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: any | null;
  }[];
  prediction: AiPrediction | null;
}

export default function Dashboard() {
  const [realtimeData, setRealtimeData] = useState<any>(null);
  
  const { data: dashboardData, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["/api/dashboard"],
  });

  // WebSocket connection for real-time updates
  useWebSocket("/ws", (data) => {
    if (data.type === "price_update") {
      setRealtimeData(data.data);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-bitcoin rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Create safe data with fallbacks
  const safeData: DashboardResponse = dashboardData || {
    user: { username: "Guest", walletAddress: null, linkedWalletBalance: "0.00", autoTopUpEnabled: false, smsAlertsEnabled: false },
    stats: { totalCollateral: 0, totalBorrowed: 0, activeLoanCount: 0, healthFactor: 0, btcPrice: { price: 0, change: 0, changePercent: 0 } },
    prediction: null,
    alerts: [],
    loanPositions: [],
  };

  // Use real-time data if available, otherwise fall back to API data
  const currentBtcPrice = realtimeData?.btcPrice || safeData.stats?.btcPrice || { price: 0, change: 0, changePercent: 0 };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100">
      <Navigation user={safeData.user} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Alert Banner */}
        {safeData.prediction && (
          <AiAlertBanner prediction={safeData.prediction} />
        )}

        {/* Stats Grid */}
        <StatsGrid 
          stats={safeData.stats}
          btcPrice={currentBtcPrice}
          user={safeData.user}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Real-time Price Chart */}
          <div className="lg:col-span-2">
            <RealTimePriceChart />
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            <ProtectionPanel 
              user={safeData.user}
              stats={safeData.stats}
            />
            <AlertsPanel alerts={safeData.alerts} />
          </div>
        </div>

        {/* Loan Positions */}
        <LoanPositionsTable 
          positions={safeData.loanPositions}
          btcPrice={currentBtcPrice}
        />

        {/* Performance Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card-bg rounded-xl p-6 border border-slate-700 text-center" data-testid="metric-liquidations-prevented">
            <div className="text-2xl font-bold text-success mb-2">23</div>
            <div className="text-sm text-slate-400">Liquidations Prevented</div>
          </div>
          <div className="bg-card-bg rounded-xl p-6 border border-slate-700 text-center" data-testid="metric-btc-saved">
            <div className="text-2xl font-bold text-bitcoin mb-2">$47,830</div>
            <div className="text-sm text-slate-400">BTC Saved</div>
          </div>
          <div className="bg-card-bg rounded-xl p-6 border border-slate-700 text-center" data-testid="metric-success-rate">
            <div className="text-2xl font-bold text-info mb-2">94.2%</div>
            <div className="text-sm text-slate-400">Protection Success Rate</div>
          </div>
          <div className="bg-card-bg rounded-xl p-6 border border-slate-700 text-center" data-testid="metric-response-time">
            <div className="text-2xl font-bold text-white mb-2">1.8s</div>
            <div className="text-sm text-slate-400">Avg Response Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
