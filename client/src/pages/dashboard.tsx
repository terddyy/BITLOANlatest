import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import AiAlertBanner from "@/components/ai-alert-banner";
import StatsGrid from "@/components/stats-grid";
import PredictionChart from "@/components/prediction-chart";
import ProtectionPanel from "@/components/protection-panel";
import AlertsPanel from "@/components/alerts-panel";
import LoanPositionsTable from "@/components/loan-positions-table";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [realtimeData, setRealtimeData] = useState<any>(null);
  
  const { data: dashboardData, isLoading } = useQuery({
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger text-lg mb-2">Failed to load dashboard</p>
          <p className="text-slate-400">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Use real-time data if available, otherwise fall back to API data
  const currentBtcPrice = realtimeData?.btcPrice || dashboardData?.stats?.btcPrice;
  const currentPrediction = realtimeData?.prediction || dashboardData?.prediction;

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100">
      <Navigation user={dashboardData?.user || { username: "Guest" }} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Alert Banner */}
        {currentPrediction && (
          <AiAlertBanner prediction={currentPrediction} />
        )}

        {/* Stats Grid */}
        <StatsGrid 
          stats={dashboardData?.stats || {}}
          btcPrice={currentBtcPrice || { price: 0, change: 0, changePercent: 0 }}
          user={dashboardData?.user || { linkedWalletBalance: "0" }}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* AI Prediction Chart */}
          <div className="lg:col-span-2">
            <PredictionChart prediction={currentPrediction} />
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            <ProtectionPanel 
              user={dashboardData?.user || { autoTopUpEnabled: false, smsAlertsEnabled: false, linkedWalletBalance: "0" }}
              stats={dashboardData?.stats || { activeLoanCount: 0 }}
            />
            <AlertsPanel alerts={dashboardData?.alerts || []} />
          </div>
        </div>

        {/* Loan Positions */}
        <LoanPositionsTable 
          positions={dashboardData?.loanPositions || []}
          btcPrice={currentBtcPrice || { price: 0 }}
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
