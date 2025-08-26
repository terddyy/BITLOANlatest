import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter"; // Import useLocation
import { LoanPosition } from "@shared/schema"; // Import LoanPosition from shared schema

interface LoanPositionsTableProps {
  positions: LoanPosition[];
  btcPrice: { price: number; change: number; changePercent: number };
}

export default function LoanPositionsTable({ positions, btcPrice }: LoanPositionsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation(); // Initialize navigate

  const topUpMutation = useMutation({
    mutationFn: async (positionId: string) => {
      return apiRequest("POST", "/api/topup", {
        loanPositionId: positionId,
        amount: 1000,
        currency: "BTC", // Default to BTC for now
      });
    },
    onSuccess: () => {
      toast({
        title: "Top-Up Successful",
        description: "Added 1,000 BTC collateral to position.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Top-Up Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const getHealthFactorColor = (healthFactor: number) => {
    if (healthFactor >= 1.5) return "text-success";
    if (healthFactor >= 1.2) return "text-bitcoin";
    return "text-danger";
  };

  const getHealthFactorStatus = (healthFactor: number) => {
    if (healthFactor >= 1.5) return { label: "Safe", variant: "default" as const };
    if (healthFactor >= 1.2) return { label: "Warning", variant: "secondary" as const };
    return { label: "Danger", variant: "destructive" as const };
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return "1 week ago";
    return `${diffWeeks} weeks ago`;
  };

  return (
    <div className="mt-8 bg-card-bg rounded-xl border border-slate-700" data-testid="loan-positions-table">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white" data-testid="table-title">Active Loan Positions</h3>
          <Button 
            onClick={() => navigate("/loans/new")}
            className="text-sm bg-bitcoin hover:bg-yellow-500 text-dark-bg px-4 py-2 rounded-lg font-medium transition-colors"
            data-testid="button-new-loan"
          >
            New Loan
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">Position</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">Collateral</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">Borrowed</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">Health Factor</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">APR</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">Status</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {positions.map((position) => {
              const healthFactor = parseFloat(position.borrowedAmount) > 0
                ? (parseFloat(position.collateralBtc) * btcPrice.price + parseFloat(position.collateralUsdt || "0")) / parseFloat(position.borrowedAmount)
                : Infinity; // Calculate dynamically
              const healthStatus = getHealthFactorStatus(healthFactor);
              const collateralBtcValue = parseFloat(position.collateralBtc) * btcPrice.price;
              const totalCollateralValue = collateralBtcValue + parseFloat(position.collateralUsdt || "0"); // Include USDT in total value

              return (
                <tr key={position.id} className="hover:bg-slate-800/50 transition-colors" data-testid={`position-row-${position.id}`}>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-white" data-testid={`position-name-${position.id}`}>
                        {position.positionName}
                      </div>
                      <div className="text-sm text-slate-400" data-testid={`position-created-${position.id}`}>
                        Opened {getTimeAgo(position.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-white" data-testid={`collateral-btc-${position.id}`}>
                        {position.collateralBtc} BTC
                      </div>
                      <div className="text-sm text-slate-400" data-testid={`collateral-value-${position.id}`}>
                        ${totalCollateralValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-white" data-testid={`borrowed-amount-${position.id}`}>
                        ${parseFloat(position.borrowedAmount).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">BTC</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getHealthFactorColor(healthFactor)}`} data-testid={`health-factor-${position.id}`}>
                        {healthFactor.toFixed(2)}
                      </span>
                      <Badge variant={healthStatus.variant} className="text-xs" data-testid={`health-status-${position.id}`}>
                        {healthStatus.label}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white" data-testid={`apr-${position.id}`}>
                    {position.apr}%
                  </td>
                  <td className="py-4 px-6">
                    <Badge 
                      variant={position.isProtected ? "default" : "secondary"} 
                      className="text-xs"
                      data-testid={`protection-status-${position.id}`}
                    >
                      {position.isProtected ? "Protected" : "Unprotected"}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => topUpMutation.mutate(position.id)}
                        disabled={topUpMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition-colors"
                        data-testid={`button-topup-${position.id}`}
                      >
                        {topUpMutation.isPending ? "Processing..." : "Top-Up"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm text-slate-400 hover:text-white px-3 py-1 rounded transition-colors"
                        data-testid={`button-details-${position.id}`}
                        onClick={() => navigate(`/loans/${position.id}`)} // Navigate to details page
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {positions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400" data-testid="no-positions">No active loan positions</p>
          </div>
        )}
      </div>
    </div>
  );
}
