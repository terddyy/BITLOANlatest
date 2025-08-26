import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { LoanPositionType, DashboardResponse } from '@shared/schema';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

export default function LoanDetailsPage() {
  const params = useParams();
  const loanId = params ? params.id : '';
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [repaymentAmount, setRepaymentAmount] = useState<string>('');
  const [repaymentCurrency, setRepaymentCurrency] = useState<string>('USDT');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch loan details
  const { data: loanData, isLoading: isLoadingLoan, error: loanError } = useQuery<LoanPositionType & { id: string }, Error>({ // Ensure id is included
    queryKey: ["/api/loan-positions", loanId],
    queryFn: () => apiRequest("GET", `/api/loan-positions/${loanId}`),
    enabled: !!loanId, // Only run query if loanId is available
  });

  // Fetch dashboard data for available balances
  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError } = useQuery<DashboardResponse, Error>({
    queryKey: ["/api/dashboard"],
    queryFn: () => apiRequest("GET", "/api/dashboard"),
  });

  const availableBtc = parseFloat(dashboardData?.user?.linkedWalletBalanceBtc || "0");
  const availableUsdt = parseFloat(dashboardData?.user?.linkedWalletBalanceUsdt || "0");

  const repayLoanMutation = useMutation<{
    success: boolean;
    loan: LoanPositionType & { id: string };
  }, Error, { amount: number; currency: string }>({ // Include id in loan type
    mutationFn: ({ amount, currency }) => apiRequest("PATCH", `/api/loans/${loanId}/repay`, { amount, currency }),
    onSuccess: (data) => {
      toast({
        title: "Loan Repaid Successfully!",
        description: `Loan '${data.loan.positionName}' has been partially repaid.`,
      });
      // Invalidate dashboard and loan details queries to refetch latest data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loan-positions", loanId] });
      setRepaymentAmount(''); // Clear input after successful repayment
      navigate("/"); // Navigate back to dashboard
    },
    onError: (error: Error) => {
      toast({
        title: "Repayment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsedRepaymentAmount = parseFloat(repaymentAmount);
    if (isNaN(parsedRepaymentAmount) || parsedRepaymentAmount <= 0) {
      setErrors({ repaymentAmount: "Repayment amount must be a positive number." });
      return;
    }

    if (loanData) {
      const borrowedAmount = parseFloat(loanData.borrowedAmount);
      if (parsedRepaymentAmount > borrowedAmount) {
        setErrors({ repaymentAmount: `Repayment amount cannot exceed borrowed amount ($${borrowedAmount.toFixed(2)}).` });
        return;
      }
    }

    if (repaymentCurrency === "USDT" && parsedRepaymentAmount > availableUsdt) {
      setErrors({ repaymentAmount: `Insufficient USDT balance. Available: ${availableUsdt.toFixed(2)} USDT` });
      return;
    } else if (repaymentCurrency === "BTC") {
      // For BTC repayment, we need to convert USD amount to BTC equivalent
      // This requires the current BTC price, which we get from dashboardData
      const btcPrice = dashboardData?.stats?.btcPrice?.price;
      if (!btcPrice) {
        setErrors({ repaymentAmount: "Could not fetch current BTC price for conversion." });
        return;
      }
      const btcEquivalent = parsedRepaymentAmount / btcPrice; // USD amount divided by BTC price
      if (btcEquivalent > availableBtc) {
        setErrors({ repaymentAmount: `Insufficient BTC balance. Available: ${availableBtc.toFixed(8)} BTC (equivalent to $${(availableBtc * btcPrice).toFixed(2)})` });
        return;
      }
    }

    repayLoanMutation.mutate({ amount: parsedRepaymentAmount, currency: repaymentCurrency });
  };

  if (isLoadingLoan || isLoadingDashboard) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center">
        <p className="text-lg">Loading loan details...</p>
      </div>
    );
  }

  if (loanError) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center">
        <p className="text-lg text-danger">Error loading loan: {loanError.message}</p>
      </div>
    );
  }

  if (!loanData) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center">
        <p className="text-lg">Loan not found.</p>
      </div>
    );
  }

  const currentBtcPrice = dashboardData?.stats?.btcPrice?.price || 0;
  const collateralBtcValueUSD = parseFloat(loanData.collateralBtc) * currentBtcPrice;
  const collateralUsdtValueUSD = parseFloat(loanData.collateralUsdt || "0");
  const totalCollateralValueUSD = collateralBtcValueUSD + collateralUsdtValueUSD;

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center p-4">
      <div className="bg-card-bg rounded-xl p-8 border border-slate-700 shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Loan Details: {loanData.positionName}</h1>
          <Button variant="outline" onClick={() => navigate("/")}>Back to Dashboard</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-slate-300">
          <div>
            <p className="font-medium text-white">Loan ID:</p>
            <p className="text-sm truncate">{loanId}</p>
          </div>
          <div>
            <p className="font-medium text-white">Borrowed Amount:</p>
            <p className="text-sm">${parseFloat(loanData.borrowedAmount).toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-white">Collateral (BTC):</p>
            <p className="text-sm">{parseFloat(loanData.collateralBtc).toFixed(8)} BTC (~${collateralBtcValueUSD.toFixed(2)})</p>
          </div>
          <div>
            <p className="font-medium text-white">Collateral (USDT):</p>
            <p className="text-sm">{parseFloat(loanData.collateralUsdt || "0").toFixed(2)} USDT</p>
          </div>
          <div>
            <p className="font-medium text-white">Total Collateral Value:</p>
            <p className="text-sm">~${totalCollateralValueUSD.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-white">Health Factor:</p>
            <p className="text-sm">{parseFloat(loanData.healthFactor).toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-white">APR:</p>
            <p className="text-sm">{parseFloat(loanData.apr).toFixed(2)}%</p>
          </div>
          <div>
            <p className="font-medium text-white">Liquidation Price:</p>
            <p className="text-sm">${parseFloat(loanData.liquidationPrice).toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-white">Protected:</p>
            <p className="text-sm">{loanData.isProtected ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="font-medium text-white">Created At:</p>
            <p className="text-sm">{new Date(loanData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Repay Loan</h2>
        <form onSubmit={handleRepay} className="space-y-4">
          <div>
            <Label htmlFor="repaymentAmount" className="text-sm text-slate-300">Repayment Amount</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="repaymentAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                className="w-2/3 bg-slate-800 border-slate-700 text-white"
                min="0"
                max={loanData ? parseFloat(loanData.borrowedAmount).toFixed(2) : ""}
              />
              <Select onValueChange={setRepaymentCurrency} defaultValue={repaymentCurrency}>
                <SelectTrigger className="w-1/3 bg-slate-800 text-white border-slate-700">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-slate-700">
                  <SelectItem value="USDT">USDT</SelectItem>
                  {/* BTC repayment is also possible, but might involve more complex UX for USD equivalent input */}
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Available: {repaymentCurrency === "BTC" ? availableBtc.toFixed(8) + " BTC" : availableUsdt.toFixed(2) + " USDT"}
            </p>
            {errors.repaymentAmount && <p className="text-danger text-xs mt-1">{errors.repaymentAmount}</p>}
          </div>
          <Button
            type="submit"
            className="w-full bg-primary-button hover:bg-primary-button-hover text-white py-2 rounded-lg transition-colors"
            disabled={repayLoanMutation.isPending}
          >
            {repayLoanMutation.isPending ? 'Repaying...' : 'Repay Loan'}
          </Button>
        </form>
      </div>
    </div>
  );
} 