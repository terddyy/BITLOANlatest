import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import Navigation from "@/components/navigation";

export default function Loans() {
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100">
      <Navigation user={dashboardData?.user || { username: "Guest" }} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="page-title">Loan Positions</h1>
            <p className="text-slate-400 mt-2">Manage your BTC-collateralized loans with AI protection</p>
          </div>
          <Button className="bg-bitcoin hover:bg-yellow-500 text-dark-bg" data-testid="button-create-loan">
            <Plus className="w-4 h-4 mr-2" />
            Create New Loan
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card-bg border-slate-700" data-testid="stat-total-borrowed">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-bitcoin" />
                <div>
                  <p className="text-sm text-slate-400">Total Borrowed</p>
                  <p className="text-2xl font-bold text-white">$14,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card-bg border-slate-700" data-testid="stat-active-loans">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-slate-400">Active Loans</p>
                  <p className="text-2xl font-bold text-white">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card-bg border-slate-700" data-testid="stat-avg-health">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-8 h-8 text-bitcoin" />
                <div>
                  <p className="text-sm text-slate-400">Avg Health Factor</p>
                  <p className="text-2xl font-bold text-bitcoin">1.58</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card-bg border-slate-700" data-testid="stat-protected-positions">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-slate-400">AI Protected</p>
                  <p className="text-2xl font-bold text-success">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Creation Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card-bg border-slate-700 hover:border-bitcoin transition-colors cursor-pointer" data-testid="loan-option-conservative">
            <CardHeader>
              <CardTitle className="text-success">Conservative Loan</CardTitle>
              <CardDescription>Low risk, stable returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max LTV:</span>
                  <span className="text-white">50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">APR:</span>
                  <span className="text-white">7.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Protection:</span>
                  <Badge variant="default" className="bg-success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700 hover:border-bitcoin transition-colors cursor-pointer" data-testid="loan-option-balanced">
            <CardHeader>
              <CardTitle className="text-bitcoin">Balanced Loan</CardTitle>
              <CardDescription>Moderate risk, good leverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max LTV:</span>
                  <span className="text-white">70%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">APR:</span>
                  <span className="text-white">8.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Protection:</span>
                  <Badge variant="default" className="bg-success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700 hover:border-bitcoin transition-colors cursor-pointer" data-testid="loan-option-aggressive">
            <CardHeader>
              <CardTitle className="text-danger">Aggressive Loan</CardTitle>
              <CardDescription>Higher risk, maximum leverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max LTV:</span>
                  <span className="text-white">85%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">APR:</span>
                  <span className="text-white">10.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Protection:</span>
                  <Badge variant="default" className="bg-success">Essential</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Loan Activity */}
        <Card className="bg-card-bg border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription>Your latest loan transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg" data-testid="activity-topup">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div>
                    <p className="text-white font-medium">Auto Top-Up Executed</p>
                    <p className="text-sm text-slate-400">Added 1,500 USDT to BTC-001</p>
                  </div>
                </div>
                <span className="text-sm text-slate-400">18 min ago</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg" data-testid="activity-ai-alert">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-bitcoin rounded-full"></div>
                  <div>
                    <p className="text-white font-medium">AI Price Alert</p>
                    <p className="text-sm text-slate-400">73% probability of 4.2% dip predicted</p>
                  </div>
                </div>
                <span className="text-sm text-slate-400">2 hours ago</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg" data-testid="activity-health">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-info rounded-full"></div>
                  <div>
                    <p className="text-white font-medium">Health Factor Update</p>
                    <p className="text-sm text-slate-400">BTC-002 improved to 1.82 (Safe)</p>
                  </div>
                </div>
                <span className="text-sm text-slate-400">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}