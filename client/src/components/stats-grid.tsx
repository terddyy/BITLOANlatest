import { TrendingDown, DollarSign, Activity, BarChart3 } from "lucide-react";

interface StatsGridProps {
  stats: {
    btcPrice: {
      price: number;
      change: number;
      changePercent: number;
    };
    totalCollateral: number;
    healthFactor: number;
    activeLoanCount: number;
    totalBorrowed: number;
  };
  btcPrice: {
    price: number;
    change: number;
    changePercent: number;
  };
  user: {
    linkedWalletBalance: string;
  };
}

export default function StatsGrid({ stats, btcPrice, user }: StatsGridProps) {
  const healthFactor = stats.healthFactor || 0;
  const healthFactorColor = healthFactor >= 1.5 
    ? "text-success" 
    : healthFactor >= 1.2 
    ? "text-bitcoin" 
    : "text-danger";

  const healthFactorStatus = healthFactor >= 1.5 
    ? "Safe" 
    : healthFactor >= 1.2 
    ? "Warning" 
    : "Danger";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* BTC Price */}
      {/* <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="stat-btc-price">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">BTC Price</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs text-success">Live</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-white" data-testid="btc-price-current">
            ${(btcPrice.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${(btcPrice.changePercent || 0) >= 0 ? 'text-success' : 'text-danger'}`} data-testid="btc-price-change">
              {(btcPrice.changePercent || 0) >= 0 ? '+' : ''}{(btcPrice.changePercent || 0).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-sm">24h</span>
          </div>
        </div>
      </div> */}

      {/* Total Collateral */}
      <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="stat-collateral">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">Total Collateral</h3>
          <DollarSign className="w-4 h-4 text-slate-500" />
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-white" data-testid="collateral-total">
            ${(stats.totalCollateral || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-slate-400">Multi-asset collateral</div>
        </div>
      </div>

      {/* Health Factor */}
      <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="stat-health-factor">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">Health Factor</h3>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              healthFactor >= 1.5 ? 'bg-success' : 
              healthFactor >= 1.2 ? 'bg-bitcoin' : 'bg-danger'
            }`}></div>
            <span className={`text-xs ${healthFactorColor}`}>{healthFactorStatus}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${healthFactorColor}`} data-testid="health-factor-value">
            {healthFactor.toFixed(2)}
          </div>
          <div className="text-sm text-slate-400">Safe: {'>'}1.5 | Danger: {'<'}1.2</div>
        </div>
      </div>

      {/* Active Loans */}
      <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="stat-loans">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">Active Loans</h3>
          <BarChart3 className="w-4 h-4 text-slate-500" />
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-white" data-testid="loans-total">
            ${(stats.totalBorrowed || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-slate-400">{stats.activeLoanCount || 0} positions | Avg 8.5% APR</div>
        </div>
      </div>
    </div>
  );
}
