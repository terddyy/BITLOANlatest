import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"; // Import useQuery
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { apiRequest } from "@/lib/queryClient";
import { type CreateLoanRequest, type LoanPosition } from "@shared/schema"; // Import CreateLoanRequest and LoanPosition

interface DashboardResponse {
  user: {
    username: string;
    walletAddress?: string | null;
    linkedWalletBalanceBtc: string;
    linkedWalletBalanceUsdt: string;
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
  loanPositions: any[];
}

export default function NewLoanPage() {
  const [positionName, setPositionName] = useState("");
  const [collateralAmount, setCollateralAmount] = useState(""); // Combined collateral amount
  const [collateralCurrency, setCollateralCurrency] = useState("BTC"); // New state for collateral currency
  const [borrowedAmount, setBorrowedAmount] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: dashboardData } = useQuery<DashboardResponse>({
    queryKey: ["/api/dashboard"],
  });

  const availableBtc = parseFloat(dashboardData?.user?.linkedWalletBalanceBtc || "0");
  const availableUsdt = parseFloat(dashboardData?.user?.linkedWalletBalanceUsdt || "0");

  const createLoanMutation = useMutation<LoanPosition, Error, CreateLoanRequest>({
    mutationFn: async (newLoanData) => {
      // For demo, we will simulate the API call and update client-side state
      console.log("Simulating loan creation with data:", newLoanData);

      // Deduct collateral from mock wallet balances (client-side only)
      if (newLoanData.collateralBtc > 0) {
        const newBtcBalance = availableBtc - newLoanData.collateralBtc;
        queryClient.setQueryData(["/api/dashboard"], (oldData: DashboardResponse) => ({
          ...oldData,
          user: {
            ...oldData.user,
            linkedWalletBalanceBtc: newBtcBalance.toString(),
          },
        }));
      }
      if (newLoanData.collateralUsdt > 0) {
        const newUsdtBalance = availableUsdt - newLoanData.collateralUsdt; // Corrected typo here
        queryClient.setQueryData(["/api/dashboard"], (oldData: DashboardResponse) => ({
          ...oldData,
          user: {
            ...oldData.user,
            linkedWalletBalanceUsdt: newUsdtBalance.toString(),
          },
        }));
      }

      // Simulate API success
      return Promise.resolve({
        loan: {
          id: `mock-loan-${Date.now()}`,
          userId: "demo-user-id", // Assuming a demo user
          positionName: newLoanData.positionName,
          collateralBtc: newLoanData.collateralBtc.toFixed(8),
          collateralUsdt: newLoanData.collateralUsdt.toFixed(2),
          borrowedAmount: newLoanData.borrowedAmount.toFixed(2),
          apr: "7.5",
          healthFactor: "2.0",
          isProtected: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // In a real app:
      return apiRequest("POST", "/api/loans/new", newLoanData);
    },
    onSuccess: (data) => {
      toast({
        title: "Loan Created Successfully!",
        description: `Your new loan '${data.loan.positionName}' has been created.`,
      });
      queryClient.setQueryData(["/api/dashboard"], (oldData: DashboardResponse | undefined) => {
        if (!oldData) return undefined;

        // Ensure loanPositions is an array and add the new loan
        const updatedLoanPositions = oldData.loanPositions ? [...oldData.loanPositions, data.loan] : [data.loan];

        // Recalculate total collateral in BTC. It should be the sum of collateral from all loans plus the linked wallet BTC balance.
        const totalCollateralFromLoansBtc = updatedLoanPositions.reduce((sum, pos) => sum + parseFloat(pos.collateralBtc), 0);
        const newTotalCollateralBtc = totalCollateralFromLoansBtc + parseFloat(oldData.user.linkedWalletBalanceBtc || "0");

        // Recalculate total borrowed amount
        const newTotalBorrowed = updatedLoanPositions.reduce((sum, pos) => sum + parseFloat(pos.borrowedAmount), 0);

        // Recalculate average health factor if needed (simplified for this update)
        // This might need more sophisticated calculation based on real-time prices etc.
        const newAvgHealthFactor = newTotalBorrowed > 0 
          ? (newTotalCollateralBtc / newTotalBorrowed).toFixed(2)
          : "0.00";

        return {
          ...oldData,
          stats: {
            ...oldData.stats,
            totalCollateral: newTotalCollateralBtc, // This should be in BTC, not USD value
            healthFactor: newAvgHealthFactor,
            activeLoanCount: updatedLoanPositions.length,
            totalBorrowed: newTotalBorrowed, // Update totalBorrowed as well
          },
          loanPositions: updatedLoanPositions,
        };
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Loan Creation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    const newErrors: { [key: string]: string } = {};
    const parsedCollateralAmount = parseFloat(collateralAmount);
    const parsedBorrowedAmount = parseFloat(borrowedAmount);

    if (!positionName.trim()) {
      newErrors.positionName = "Position Name is required.";
    }
    if (isNaN(parsedCollateralAmount) || parsedCollateralAmount <= 0) {
      newErrors.collateralAmount = `Collateral ${collateralCurrency} must be a positive number.`;
    } else if (collateralCurrency === "BTC" && parsedCollateralAmount > availableBtc) {
      newErrors.collateralAmount = `Insufficient BTC balance. Available: ${availableBtc.toFixed(8)} BTC`;
    } else if (collateralCurrency === "USDT" && parsedCollateralAmount > availableUsdt) {
      newErrors.collateralAmount = `Insufficient USDT balance. Available: ${availableUsdt.toFixed(2)} USDT`;
    }

    if (isNaN(parsedBorrowedAmount) || parsedBorrowedAmount <= 0) {
      newErrors.borrowedAmount = "Borrowed Amount must be a positive number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const collateralBtcValue = collateralCurrency === "BTC" ? parsedCollateralAmount : 0;
    const collateralUsdtValue = collateralCurrency === "USDT" ? parsedCollateralAmount : 0;

    createLoanMutation.mutate({
      positionName,
      collateralBtc: collateralBtcValue,
      collateralUsdt: collateralUsdtValue,
      borrowedAmount: parsedBorrowedAmount,
    });
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center">
      <div className="bg-card-bg rounded-xl p-8 border border-slate-700 shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">New Loan Application</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="positionName" className="text-sm text-slate-300">Position Name</Label>
            <Input
              id="positionName"
              type="text"
              placeholder="e.g., BTC-003"
              value={positionName}
              onChange={(e) => setPositionName(e.target.value)}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
            {errors.positionName && <p className="text-danger text-xs mt-1">{errors.positionName}</p>}
          </div>

          <div>
            <Label htmlFor="collateralAmount" className="text-sm text-slate-300">Collateral Amount</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="collateralAmount"
                type="number"
                step={collateralCurrency === "BTC" ? "0.00000001" : "0.01"}
                placeholder="0.00"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                className="w-2/3 bg-slate-800 border-slate-700 text-white"
              />
              <Select onValueChange={setCollateralCurrency} defaultValue={collateralCurrency}>
                <SelectTrigger className="w-1/3 bg-slate-800 text-white border-slate-700">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-slate-700">
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Available: {collateralCurrency === "BTC" ? availableBtc.toFixed(8) + " BTC" : availableUsdt.toFixed(2) + " USDT"}
            </p>
            {errors.collateralAmount && <p className="text-danger text-xs mt-1">{errors.collateralAmount}</p>}
          </div>

          <div>
            <Label htmlFor="borrowedAmount" className="text-sm text-slate-300">Borrowed Amount (USD)</Label>
            <Input
              id="borrowedAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={borrowedAmount}
              onChange={(e) => setBorrowedAmount(e.target.value)}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
            {errors.borrowedAmount && <p className="text-danger text-xs mt-1">{errors.borrowedAmount}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-bitcoin hover:bg-yellow-500 text-dark-bg py-2 rounded-lg font-medium transition-colors"
            disabled={createLoanMutation.isPending}
          >
            {createLoanMutation.isPending ? "Creating Loan..." : "Create New Loan"}
          </Button>
          <Button
            type="button"
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full text-slate-300 border-slate-700 hover:bg-slate-800 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </Button>
        </form>
      </div>
    </div>
  );
} 