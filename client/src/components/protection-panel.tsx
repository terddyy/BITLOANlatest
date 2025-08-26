import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type LoanPosition } from "@shared/schema";

interface ProtectionPanelProps {
  user: {
    autoTopUpEnabled: boolean;
    smsAlertsEnabled: boolean;
    linkedWalletBalanceBtc: string;
    linkedWalletBalanceUsdt: string;
  };
  stats: {
    activeLoanCount: number;
  };
  loanPositionId: string;
}

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
  loanPositions: LoanPosition[];
}

export default function ProtectionPanel({ user, stats, loanPositionId }: ProtectionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState({
    autoTopUpEnabled: user.autoTopUpEnabled,
    smsAlertsEnabled: user.smsAlertsEnabled,
  });
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [topUpCurrency, setTopUpCurrency] = useState<string>("USDT");
  const [mockBtcInput, setMockBtcInput] = useState<string>("");
  const [mockUsdtInput, setMockUsdtInput] = useState<string>("");
  const [mockBtcBalance, setMockBtcBalance] = useState<number>(parseFloat(user.linkedWalletBalanceBtc || "0"));
  const [mockUsdtBalance, setMockUsdtBalance] = useState<number>(parseFloat(user.linkedWalletBalanceUsdt || "0"));
  const [collateralToAddBtc, setCollateralToAddBtc] = useState<string>("");

  useEffect(() => {
    setMockBtcBalance(parseFloat(user.linkedWalletBalanceBtc || "0"));
    setMockUsdtBalance(parseFloat(user.linkedWalletBalanceUsdt || "0"));
  }, [user.linkedWalletBalanceBtc, user.linkedWalletBalanceUsdt]);

  const settingsMutation = useMutation({
    mutationFn: async (settings: { autoTopUpEnabled?: boolean; smsAlertsEnabled?: boolean; linkedWalletBalanceBtc?: string; linkedWalletBalanceUsdt?: string }) => {
      return apiRequest("PATCH", "/api/settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Settings Updated",
        description: "Your protection settings have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const manualTopUpMutation = useMutation({
    mutationFn: async () => {
      if (!topUpAmount || topUpAmount <= 0) {
        toast({
          title: "Top-Up Failed",
          description: "Please enter a valid amount.",
          variant: "destructive",
        });
        return Promise.reject("Invalid amount");
      }
      if (!topUpCurrency) {
        toast({
          title: "Top-Up Failed",
          description: "Please select a currency.",
          variant: "destructive",
        });
        return Promise.reject("Invalid currency");
      }

      if (topUpCurrency === "BTC") {
        const newBtcBalance = mockBtcBalance + topUpAmount;
        settingsMutation.mutate({ linkedWalletBalanceBtc: newBtcBalance.toFixed(8) });
        setMockBtcBalance(newBtcBalance);
      } else if (topUpCurrency === "USDT") {
        const newUsdtBalance = mockUsdtBalance + topUpAmount;
        settingsMutation.mutate({ linkedWalletBalanceUsdt: newUsdtBalance.toFixed(2) });
        setMockUsdtBalance(newUsdtBalance);
      }

      toast({
        title: "Top-Up Successful",
        description: `Added ${topUpAmount} ${topUpCurrency} to your mock wallet balance.`, 
      });

      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      return Promise.resolve();
    },
  });

  const handleSetBtcBalance = () => {
    const amount = parseFloat(mockBtcInput);
    if (!isNaN(amount) && amount >= 0) {
      settingsMutation.mutate({ linkedWalletBalanceBtc: amount.toFixed(8) });
      setMockBtcBalance(amount);
      toast({
        title: "BTC Balance Set",
        description: `Mock BTC balance set to ${amount}.`,
      });
    } else {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid non-negative number for BTC.",
        variant: "destructive",
      });
    }
    setMockBtcInput("");
  };

  const handleSetUsdtBalance = () => {
    const amount = parseFloat(mockUsdtInput);
    if (!isNaN(amount) && amount >= 0) {
      settingsMutation.mutate({ linkedWalletBalanceUsdt: amount.toFixed(2) });
      setMockUsdtBalance(amount);
      toast({
        title: "USDT Balance Set",
        description: `Mock USDT balance set to ${amount}.`,
      });
    } else {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid non-negative number for USDT.",
        variant: "destructive",
      });
    }
    setMockUsdtInput("");
  };

  const handleAddBtcCollateral = async () => {
    const amount = parseFloat(collateralToAddBtc);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Collateral Amount",
        description: "Please enter a positive number for BTC collateral.",
        variant: "destructive",
      });
      return;
    }
    if (amount > mockBtcBalance) {
      toast({
        title: "Insufficient BTC Balance",
        description: `You only have ${mockBtcBalance.toFixed(8)} BTC available.`, 
        variant: "destructive",
      });
      return;
    }

    // Deduct from mock BTC balance
    const newBtcBalance = mockBtcBalance - amount;
    settingsMutation.mutate({ linkedWalletBalanceBtc: newBtcBalance.toFixed(8) });
    setMockBtcBalance(newBtcBalance);

    // Update loan position or create a mock one if none exists
    queryClient.setQueryData(["/api/dashboard"], (oldData: DashboardResponse | undefined) => {
      if (!oldData) return undefined;

      const updatedLoanPositions = [...oldData.loanPositions];
      let targetLoanIndex = -1;

      if (loanPositionId) {
        targetLoanIndex = updatedLoanPositions.findIndex(loan => loan.id === loanPositionId);
      }

      if (targetLoanIndex !== -1) {
        // Update existing loan
        const existingLoan = updatedLoanPositions[targetLoanIndex];
        const updatedCollateralBtc = (parseFloat(existingLoan.collateralBtc) + amount).toFixed(8);
        const updatedHealthFactor = ((parseFloat(updatedCollateralBtc) * 30000) / parseFloat(existingLoan.borrowedAmount)).toFixed(2); // Simplified health factor calc

        updatedLoanPositions[targetLoanIndex] = {
          ...existingLoan,
          collateralBtc: updatedCollateralBtc,
          healthFactor: updatedHealthFactor,
          updatedAt: new Date(),
        };
      } else {
        // Create a new mock loan if no existing loanPositionId is found or matched
        console.log("No specific loan found or provided, creating a new mock loan position.");
        const newMockLoan: LoanPosition = {
          id: `mock-loan-${Date.now()}`,
          userId: user.username,
          positionName: "BTC Collateral Loan",
          collateralBtc: amount.toFixed(8),
          collateralUsdt: "0.00",
          borrowedAmount: "0.00",
          apr: "7.5",
          healthFactor: "0.00",
          isProtected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        updatedLoanPositions.push(newMockLoan);
      }

      const newTotalCollateralBtc = updatedLoanPositions.reduce((sum, pos) => sum + parseFloat(pos.collateralBtc), 0) + newBtcBalance; 

      return {
        ...oldData,
        user: {
          ...oldData.user,
          linkedWalletBalanceBtc: newBtcBalance.toFixed(8),
        },
        stats: {
          ...oldData.stats,
          totalCollateral: newTotalCollateralBtc,
        },
        loanPositions: updatedLoanPositions,
      };
    });

    toast({
      title: "Collateral Added",
      description: `Added ${amount} BTC to your loan collateral.`, 
    });
    setCollateralToAddBtc("");
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
  };

  const handleAutoTopUpToggle = (enabled: boolean) => {
    setLocalSettings(prev => ({ ...prev, autoTopUpEnabled: enabled }));
    settingsMutation.mutate({ autoTopUpEnabled: enabled });
  };

  const handleSmsAlertsToggle = (enabled: boolean) => {
    setLocalSettings(prev => ({ ...prev, smsAlertsEnabled: enabled }));
    settingsMutation.mutate({ smsAlertsEnabled: enabled });
  };

  return (
    <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="protection-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white" data-testid="protection-title">AI Protection</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span className="text-xs text-success font-medium" data-testid="protection-status">ACTIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between" data-testid="setting-auto-topup">
          <span className="text-sm text-slate-400">Auto Top-Up</span>
          <Switch
            checked={localSettings.autoTopUpEnabled}
            onCheckedChange={handleAutoTopUpToggle}
            disabled={settingsMutation.isPending}
            data-testid="switch-auto-topup"
          />
        </div>

        <div className="flex items-center justify-between" data-testid="setting-sms-alerts">
          <span className="text-sm text-slate-400">SMS Alerts</span>
          <Switch
            checked={localSettings.smsAlertsEnabled}
            onCheckedChange={handleSmsAlertsToggle}
            disabled={settingsMutation.isPending}
            data-testid="switch-sms-alerts"
          />
        </div>

        {/* Mock Balance Input Fields */}
        <div className="pt-4 border-t border-slate-700 space-y-4">
          <div className="text-sm text-slate-400">Set Mock BTC Balance</div>
          <div className="flex space-x-2">
            <Input
              type="number"
              value={mockBtcInput}
              onChange={(e) => setMockBtcInput(e.target.value)}
              placeholder="BTC Amount"
              className="w-full bg-slate-800 text-white border-slate-700"
              data-testid="input-mock-btc"
            />
            <Button onClick={handleSetBtcBalance} className="bg-bitcoin hover:bg-yellow-500 text-dark-bg font-semibold">
              Set BTC
            </Button>
          </div>

          <div className="text-sm text-slate-400">Set Mock USDT Balance</div>
          <div className="flex space-x-2">
            <Input
              type="number"
              value={mockUsdtInput}
              onChange={(e) => setMockUsdtInput(e.target.value)}
              placeholder="USDT Amount"
              className="w-full bg-slate-800 text-white border-slate-700"
              data-testid="input-mock-usdt"
            />
            <Button onClick={handleSetUsdtBalance} className="bg-bitcoin hover:bg-yellow-500 text-dark-bg font-semibold">
              Set USDT
            </Button>
          </div>
        </div>

        {/* Add BTC Collateral Section */}
        <div className="pt-4 border-t border-slate-700 space-y-4">
          <div className="text-sm text-slate-400">Add BTC Collateral</div>
          <div className="flex space-x-2">
            <Input
              type="number"
              value={collateralToAddBtc}
              onChange={(e) => setCollateralToAddBtc(e.target.value)}
              placeholder="BTC Amount"
              className="w-full bg-slate-800 text-white border-slate-700"
              data-testid="input-add-btc-collateral"
            />
            <Button onClick={handleAddBtcCollateral} className="w-auto bg-bitcoin hover:bg-yellow-500 text-dark-bg font-semibold">
              Add BTC
            </Button>
          </div>
        </div>

        {/* Custom Top-Up Input Fields */}
        <div className="pt-4 border-t border-slate-700 space-y-4">
          <div className="text-sm text-slate-400">Manual Top-Up Amount</div>
          <Input
            type="number"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(parseFloat(e.target.value))}
            placeholder="Amount"
            className="w-full bg-slate-800 text-white border-slate-700"
            data-testid="input-topup-amount"
          />
          <Select onValueChange={setTopUpCurrency} defaultValue={topUpCurrency}>
            <SelectTrigger className="w-full bg-slate-800 text-white border-slate-700" data-testid="select-topup-currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 text-white border-slate-700">
              <SelectItem value="BTC">BTC</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">Linked Wallet Balance</div>
          <div className="text-lg font-semibold text-white" data-testid="wallet-balance">
            {mockBtcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} BTC
          </div>
          <div className="text-lg font-semibold text-white" data-testid="wallet-balance-usdt">
            {mockUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </div>
        </div>

        <Button
          onClick={() => manualTopUpMutation.mutate()}
          disabled={manualTopUpMutation.isPending || topUpAmount <= 0}
          className="w-full bg-bitcoin hover:bg-yellow-500 text-dark-bg font-semibold py-3 rounded-lg transition-colors"
          data-testid="button-manual-topup"
        >
          {manualTopUpMutation.isPending ? "Processing..." : "Manual Top-Up"}
        </Button>
      </div>
    </div>
  );
}
