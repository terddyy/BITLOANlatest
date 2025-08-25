import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input"; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

interface ProtectionPanelProps {
  user: {
    autoTopUpEnabled: boolean;
    smsAlertsEnabled: boolean;
    linkedWalletBalanceBtc: string; // New BTC balance field
    linkedWalletBalanceUsdt: string; // New USDT balance field
  };
  stats: {
    activeLoanCount: number;
  };
  loanPositionId: string; // Add loanPositionId to props
}

export default function ProtectionPanel({ user, stats, loanPositionId }: ProtectionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState({
    autoTopUpEnabled: user.autoTopUpEnabled,
    smsAlertsEnabled: user.smsAlertsEnabled,
  });
  const [topUpAmount, setTopUpAmount] = useState<number>(1000); // New state for custom amount
  const [topUpCurrency, setTopUpCurrency] = useState<string>("USDT"); // Changed default to USDT

  const settingsMutation = useMutation({
    mutationFn: async (settings: { autoTopUpEnabled?: boolean; smsAlertsEnabled?: boolean }) => {
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
      return apiRequest("POST", "/api/topup", {
        loanPositionId: loanPositionId,
        amount: topUpAmount,
        currency: topUpCurrency,
      });
    },
    onSuccess: () => {
      toast({
        title: "Top-Up Successful",
        description: `Added ${topUpAmount} ${topUpCurrency} collateral to your position.`, // Update description
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
              <SelectItem value="USDT">USDT</SelectItem> {/* Re-added USDT option */}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">Linked Wallet Balance</div>
          <div className="text-lg font-semibold text-white" data-testid="wallet-balance">
            {parseFloat(user.linkedWalletBalanceBtc ?? "0").toLocaleString()} BTC
          </div>
          <div className="text-lg font-semibold text-white" data-testid="wallet-balance-usdt">
            {parseFloat(user.linkedWalletBalanceUsdt ?? "0").toLocaleString()} USDT
          </div>
        </div>

        <Button
          onClick={() => manualTopUpMutation.mutate()}
          disabled={manualTopUpMutation.isPending || !loanPositionId || topUpAmount <= 0}
          className="w-full bg-bitcoin hover:bg-yellow-500 text-dark-bg font-semibold py-3 rounded-lg transition-colors"
          data-testid="button-manual-topup"
        >
          {manualTopUpMutation.isPending ? "Processing..." : "Manual Top-Up"}
        </Button>
      </div>
    </div>
  );
}
