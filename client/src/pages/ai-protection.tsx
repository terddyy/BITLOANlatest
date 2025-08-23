import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Shield, Zap, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import Navigation from "@/components/navigation";
import PredictionChart from "@/components/prediction-chart";

export default function AiProtection() {
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: predictionsData } = useQuery({
    queryKey: ["/api/predictions"],
  });

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100">
      <Navigation user={dashboardData?.user || { username: "Guest", walletAddress: null }} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="page-title">AI Protection System</h1>
            <p className="text-slate-400 mt-2">Advanced machine learning for collateral protection</p>
          </div>
          <Badge variant="default" className="bg-success text-white px-4 py-2" data-testid="system-status">
            <Shield className="w-4 h-4 mr-2" />
            System Active
          </Badge>
        </div>

        {/* AI Model Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card-bg border-slate-700" data-testid="model-accuracy">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-bitcoin" />
                <CardTitle className="text-sm">Model Accuracy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-bitcoin">74.2%</span>
                  <span className="text-sm text-success">+2.1%</span>
                </div>
                <Progress value={74.2} className="h-2" />
                <p className="text-xs text-slate-400">Last 30 days performance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700" data-testid="predictions-made">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-info" />
                <CardTitle className="text-sm">Predictions Made</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">1,247</span>
                  <span className="text-sm text-success">+15 today</span>
                </div>
                <p className="text-xs text-slate-400">Total predictions this month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700" data-testid="liquidations-prevented">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-success" />
                <CardTitle className="text-sm">Liquidations Prevented</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-success">23</span>
                  <span className="text-sm text-bitcoin">$47,830 saved</span>
                </div>
                <p className="text-xs text-slate-400">Your positions protected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Prediction Chart */}
        <div className="mb-8">
          <PredictionChart prediction={predictionsData?.latest || null} />
        </div>

        {/* Protection Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Protections */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-success" />
                Active Protections
              </CardTitle>
              <CardDescription>Current AI-powered safeguards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg" data-testid="protection-auto-topup">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Auto Top-Up</p>
                      <p className="text-sm text-slate-400">Automatic collateral addition</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-success">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg" data-testid="protection-price-alerts">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-bitcoin/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-bitcoin" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Price Drop Alerts</p>
                      <p className="text-sm text-slate-400">Real-time risk notifications</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-success">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg" data-testid="protection-health-monitoring">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-info/20 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Health Factor Monitoring</p>
                      <p className="text-sm text-slate-400">Continuous position tracking</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Configuration */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="w-5 h-5 mr-2 text-bitcoin" />
                Model Configuration
              </CardTitle>
              <CardDescription>AI system settings and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Risk Sensitivity</span>
                    <span className="text-sm text-white">Medium</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-slate-400 mt-1">Balanced risk vs. accuracy</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Prediction Confidence Threshold</span>
                    <span className="text-sm text-white">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-slate-400 mt-1">Minimum confidence for actions</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Auto Top-Up Trigger</span>
                    <span className="text-sm text-white">Health Factor {'<'} 1.3</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  <p className="text-xs text-slate-400 mt-1">Automatic collateral addition point</p>
                </div>

                <Button variant="outline" className="w-full border-bitcoin text-bitcoin hover:bg-bitcoin/10" data-testid="button-configure-model">
                  Configure Advanced Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent AI Actions */}
        <Card className="bg-card-bg border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Recent AI Actions</CardTitle>
            <CardDescription>Latest automated protection activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-slate-800 rounded-lg" data-testid="ai-action-prediction">
                <div className="w-8 h-8 bg-bitcoin/20 rounded-full flex items-center justify-center mt-0.5">
                  <Brain className="w-4 h-4 text-bitcoin" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">Price Prediction Generated</p>
                    <span className="text-xs text-slate-400">2 minutes ago</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    73% confidence of 4.2% BTC dip in next 2 hours. Alert sent to user.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-800 rounded-lg" data-testid="ai-action-topup">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center mt-0.5">
                  <Zap className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">Auto Top-Up Executed</p>
                    <span className="text-xs text-slate-400">18 minutes ago</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Added 1,500 USDT to BTC-001. Health factor improved from 1.28 to 1.45.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-800 rounded-lg" data-testid="ai-action-analysis">
                <div className="w-8 h-8 bg-info/20 rounded-full flex items-center justify-center mt-0.5">
                  <TrendingDown className="w-4 h-4 text-info" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">Market Analysis Complete</p>
                    <span className="text-xs text-slate-400">1 hour ago</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Analyzed 24h market data. Medium risk level detected. Monitoring increased.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}