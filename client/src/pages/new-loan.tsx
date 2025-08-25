import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { type CreateLoanRequest, type LoanPosition } from "@shared/schema"; // Import CreateLoanRequest and LoanPosition

export default function NewLoanPage() {
  const [positionName, setPositionName] = useState("");
  const [collateralBtc, setCollateralBtc] = useState("");
  const [borrowedAmount, setBorrowedAmount] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const createLoanMutation = useMutation<LoanPosition, Error, CreateLoanRequest>({
    mutationFn: async (newLoanData) => {
      return apiRequest("POST", "/api/loans/new", newLoanData);
    },
    onSuccess: (data) => {
      toast({
        title: "Loan Created Successfully!",
        description: `Your new loan '${data.positionName}' has been created.`, // Use data.positionName
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); // Invalidate dashboard to refetch loans
      navigate("/"); // Navigate back to dashboard
    },
    onError: (error) => {
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
    const parsedCollateralBtc = parseFloat(collateralBtc);
    const parsedBorrowedAmount = parseFloat(borrowedAmount);

    if (!positionName.trim()) {
      newErrors.positionName = "Position Name is required.";
    }
    if (isNaN(parsedCollateralBtc) || parsedCollateralBtc <= 0) {
      newErrors.collateralBtc = "Collateral BTC must be a positive number.";
    }
    if (isNaN(parsedBorrowedAmount) || parsedBorrowedAmount <= 0) {
      newErrors.borrowedAmount = "Borrowed Amount must be a positive number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createLoanMutation.mutate({
      positionName,
      collateralBtc: parsedCollateralBtc,
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
            <Label htmlFor="collateralBtc" className="text-sm text-slate-300">Collateral Amount (BTC)</Label>
            <Input
              id="collateralBtc"
              type="number"
              step="0.00000001"
              placeholder="0.00"
              value={collateralBtc}
              onChange={(e) => setCollateralBtc(e.target.value)}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
            {errors.collateralBtc && <p className="text-danger text-xs mt-1">{errors.collateralBtc}</p>}
          </div>

          <div>
            <Label htmlFor="borrowedAmount" className="text-sm text-slate-300">Borrowed Amount (BTC)</Label>
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
        </form>
      </div>
    </div>
  );
} 