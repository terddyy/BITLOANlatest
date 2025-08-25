import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import AiAlertBanner from "@/components/ai-alert-banner";
import StatsGrid from "@/components/stats-grid";
import ProtectionPanel from "@/components/protection-panel";
import AlertsPanel from "@/components/alerts-panel";
import LoanPositionsTable from "@/components/loan-positions-table";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState, useEffect, useRef, useCallback } from "react"; // Add useCallback
import RealTimePriceChart, { type PriceData, type Timeframe } from "@/components/real-time-price-chart";
import { type LoanPosition, type AiPrediction, type Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAiPrediction } from "@/hooks/use-ai-prediction";
import { throttle, debounce } from 'lodash'; // Import debounce

interface WebSocketData {
  type: 'price_update'; // Add type discriminator
  btcPrice: { price: number; change: number; changePercent: number };
  healthFactor: number;
  loanPositions: LoanPosition[];
  timestamp: string;
}

interface NewNotificationMessage {
  type: 'new_notification';
  data: Notification;
}

interface DashboardResponse {
  user: {
    username: string;
    walletAddress?: string | null;
    linkedWalletBalanceBtc: string; // Updated from linkedWalletBalance
    linkedWalletBalanceUsdt: string; // New USDT balance field
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
    borrowedAmount: string;
    apr: string;
    healthFactor: string;
    isProtected: boolean;
    createdAt: string;
    updatedAt?: string | null;
    liquidationPrice?: string | null;
  }[];
  // Removed prediction from here as it's now client-side
}

// Removed global throttledTriggerNotification definition

export default function Dashboard() {
  const [realtimeData, setRealtimeData] = useState<WebSocketData | null>(null);
  const [currentPriceChartData, setCurrentPriceChartData] = useState<PriceData[]>([]);
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>("24h");

  const { data: dashboardData, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["/api/dashboard"],
  });

  const { data: notifications, isLoading: isLoadingNotifications } = useQuery<Notification[]>({ // Fetch notifications
    queryKey: ["/api/notifications"],
  });

  const queryClient = useQueryClient(); // Correctly initialize queryClient

  // Using useRef to create a persistent throttled function
  const throttledTriggerNotification = useRef(
    throttle(
      async (riskLevel: string) => {
        try {
          await apiRequest("POST", "/api/notifications/trigger", { riskLevel });
          console.log(`Server-side notifications triggered from client-side prediction (throttled for ${riskLevel}).`);
        } catch (error) {
          console.error("Failed to trigger server-side notifications from client-side prediction:", error);
        }
      },
      1800000, // 30 minutes in milliseconds
      { leading: true, trailing: false }
    )
  ).current;

  // Client-side AI Prediction
  const { prediction } = useAiPrediction({
    currentPriceData: currentPriceChartData,
    timeframe: currentTimeframe,
    onPrediction: useCallback(
      debounce(async (newPrediction) => {
        const { riskLevel } = newPrediction;
        if (riskLevel === "high" || riskLevel === "medium-high") {
          throttledTriggerNotification(riskLevel); // Call the persistent throttled function
        }
      }, 5000), // Debounce onPrediction for 5 seconds
      [throttledTriggerNotification] // Add throttledTriggerNotification to dependencies
    ),
  });

  // Debounced handler for price data updates from RealTimePriceChart
  const debouncedSetCurrentPriceChartData = useCallback(
    debounce((data: PriceData[]) => {
      setCurrentPriceChartData(data);
    }, 500), // Debounce for 500ms
    []
  );

  // WebSocket connection for real-time updates - TEMPORARILY COMMENTED OUT
  // useWebSocket({
  //   path: "/ws",
  //   onMessage: async (data: WebSocketData | NewNotificationMessage) => {
  //     if (data.type === "price_update") {
  //       setRealtimeData(data); // Pass data directly, as it's already WebSocketData type
  //     } else if (data.type === "new_notification") { // Handle new notification from WebSocket
  //       console.log("Received new notification via WebSocket:", data.data);
  //       queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }); // Invalidate and refetch notifications
  //     }
  //   },
  // });

  // Effect to update currentPriceChartData and currentTimeframe for useAiPrediction
  // Removed direct update to currentPriceChartData here, relying on RealTimePriceChart's onPriceDataUpdate
  useEffect(() => {
    // This useEffect is now primarily for potential future real-time updates to timeframe
    // or other effects dependent on realtimeData that don't involve price history accumulation.
  }, [realtimeData]);

  if (isLoading || isLoadingNotifications) { // Include notification loading state
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
    user: { username: "Guest", walletAddress: null, linkedWalletBalanceBtc: "0.00", linkedWalletBalanceUsdt: "0.00", autoTopUpEnabled: false, smsAlertsEnabled: false },
    stats: { totalCollateral: 0, totalBorrowed: 0, activeLoanCount: 0, healthFactor: 0, btcPrice: { price: 0, change: 0, changePercent: 0 } },
    // Removed prediction from here as it's now client-side
    loanPositions: [],
  };

  // Use real-time data if available, otherwise fall back to API data
  const currentBtcPrice = realtimeData?.btcPrice || safeData.stats?.btcPrice || { price: 0, change: 0, changePercent: 0 };
  const currentHealthFactor = realtimeData?.healthFactor ?? safeData.stats?.healthFactor ?? 0;
  const currentLoanPositions = realtimeData?.loanPositions || safeData.loanPositions || [];

  // Determine the loanPositionId to pass to ProtectionPanel
  const loanPositionIdForTopUp = currentLoanPositions.length > 0 ? currentLoanPositions[0].id : "";

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100">
      <Navigation user={safeData.user} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Alert Banner */}
        {prediction && (
          <AiAlertBanner prediction={prediction} /> // Use client-side prediction
        )}

        {/* Stats Grid */}
        <StatsGrid 
          stats={{ ...safeData.stats, healthFactor: currentHealthFactor }}
          btcPrice={currentBtcPrice}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Real-time Price Chart */}
          <div className="lg:col-span-2">
            <RealTimePriceChart 
              onPriceDataUpdate={debouncedSetCurrentPriceChartData}
              onTimeframeChange={setCurrentTimeframe}
            />
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            <ProtectionPanel 
              user={safeData.user}
              stats={safeData.stats}
              loanPositionId={loanPositionIdForTopUp} // Pass the dynamically determined loanPositionId
            />
            <AlertsPanel alerts={notifications || []} /> {/* Pass fetched notifications */} 
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
