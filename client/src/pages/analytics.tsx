import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, DollarSign } from "lucide-react";
import Navigation from "@/components/navigation";

export default function Analytics() {
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100">
      <Navigation user={dashboardData?.user || { username: "Guest", walletAddress: null }} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="page-title">Analytics Dashboard</h1>
            <p className="text-slate-400 mt-2">Comprehensive insights into your lending performance</p>
          </div>
          <Badge variant="outline" className="border-bitcoin text-bitcoin" data-testid="data-refresh">
            <Activity className="w-4 h-4 mr-2" />
            Real-time Data
          </Badge>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card-bg border-slate-700" data-testid="kpi-total-value">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-slate-400">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">$47,830</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">+12.4%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700" data-testid="kpi-roi">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-bitcoin" />
                <div>
                  <p className="text-sm text-slate-400">30-Day ROI</p>
                  <p className="text-2xl font-bold text-white">18.7%</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">+3.2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700" data-testid="kpi-protection-rate">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-info" />
                <div>
                  <p className="text-sm text-slate-400">Protection Success</p>
                  <p className="text-2xl font-bold text-white">94.2%</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">+1.8%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700" data-testid="kpi-avg-health">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-slate-400">Avg Health Factor</p>
                  <p className="text-2xl font-bold text-white">1.58</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingDown className="w-3 h-3 text-danger" />
                    <span className="text-xs text-danger">-0.12</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Portfolio Performance Chart */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-success" />
                Portfolio Performance
              </CardTitle>
              <CardDescription>30-day portfolio value trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-slate-800 rounded-lg" data-testid="portfolio-chart">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">Portfolio performance chart</p>
                  <p className="text-xs text-slate-500">Interactive chart would display here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Allocation */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-bitcoin" />
                Asset Allocation
              </CardTitle>
              <CardDescription>Current collateral distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between" data-testid="allocation-btc">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-bitcoin rounded-full"></div>
                    <span className="text-white">Bitcoin (BTC)</span>
                  </div>
                  <p className="text-white font-medium">3,200 BTC</p>
                </div>

                <div className="flex items-center justify-between" data-testid="allocation-available">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-slate-600 rounded-full"></div>
                    <span className="text-white">Available Balance</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">$8,450</p>
                    <p className="text-sm text-slate-400">22.5%</p>
                  </div>
                </div>

                <div className="h-32 flex items-center justify-center bg-slate-800 rounded-lg mt-4" data-testid="allocation-chart">
                  <div className="text-center">
                    <PieChart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Pie chart visualization</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Performance Metrics */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">AI Performance Metrics</CardTitle>
              <CardDescription>Machine learning model effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="metric-accuracy">
                  <span className="text-slate-400">Prediction Accuracy</span>
                  <div className="text-right">
                    <span className="text-bitcoin font-medium">74.2%</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-xs text-success">+2.1%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="metric-response-time">
                  <span className="text-slate-400">Avg Response Time</span>
                  <div className="text-right">
                    <span className="text-white font-medium">1.8s</span>
                    <div className="flex items-center space-x-1">
                      <TrendingDown className="w-3 h-3 text-success" />
                      <span className="text-xs text-success">-0.3s</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="metric-false-positives">
                  <span className="text-slate-400">False Positive Rate</span>
                  <div className="text-right">
                    <span className="text-white font-medium">5.8%</span>
                    <div className="flex items-center space-x-1">
                      <TrendingDown className="w-3 h-3 text-success" />
                      <span className="text-xs text-success">-1.2%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="metric-saved-value">
                  <span className="text-slate-400">Total Value Saved</span>
                  <div className="text-right">
                    <span className="text-success font-medium">$47,830</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-xs text-success">23 events</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Risk Analysis</CardTitle>
              <CardDescription>Current risk exposure and mitigation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="risk-liquidation">
                  <span className="text-slate-400">Liquidation Risk</span>
                  <Badge variant="default" className="bg-success">Low</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="risk-volatility">
                  <span className="text-slate-400">Market Volatility</span>
                  <Badge variant="secondary" className="bg-bitcoin text-dark-bg">Medium</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="risk-concentration">
                  <span className="text-slate-400">Asset Concentration</span>
                  <Badge variant="default" className="bg-success">Diversified</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg" data-testid="risk-leverage">
                  <span className="text-slate-400">Average Leverage</span>
                  <div className="text-right">
                    <span className="text-white font-medium">2.1x</span>
                    <p className="text-xs text-slate-400">Conservative</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border-l-4 border-success" data-testid="risk-summary">
                  <p className="text-sm text-success font-medium">Risk Status: Optimal</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your risk profile is well-balanced with adequate protection mechanisms in place.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}