import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ProtectionPanelProps {
  user: {
    autoTopUpEnabled: boolean;
    smsAlertsEnabled: boolean;
    linkedWalletBalance: string;
  };
  stats: {
    activeLoanCount: number;
  };
}

export default function ProtectionPanel({ user, stats }: ProtectionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState({
    autoTopUpEnabled: user.autoTopUpEnabled,
    smsAlertsEnabled: user.smsAlertsEnabled,
  });

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
      return apiRequest("POST", "/api/topup", {
        loanPositionId: "btc-001", // Demo - in real app, user would select position
        amount: 1000,
        currency: "USDT",
      });
    },
    onSuccess: () => {
      toast({
        title: "Top-Up Successful",
        description: "Added 1,000 USDT collateral to your position.",
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

        <div className="pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">Linked Wallet Balance</div>
          <div className="text-lg font-semibold text-white" data-testid="wallet-balance">
            {parseFloat(user.linkedWalletBalance).toLocaleString()} USDT
          </div>
        </div>

        <Button
          onClick={() => manualTopUpMutation.mutate()}
          disabled={manualTopUpMutation.isPending}
          className="w-full bg-bitcoin hover:bg-yellow-500 text-dark-bg font-semibold py-3 rounded-lg transition-colors"
          data-testid="button-manual-topup"
        >
          {manualTopUpMutation.isPending ? "Processing..." : "Manual Top-Up"}
        </Button>
      </div>
    </div>
  );
}
