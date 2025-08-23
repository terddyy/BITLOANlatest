import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AiAlertBannerProps {
  prediction: {
    currentPrice: string;
    predictedPrice: string;
    timeHorizon: number;
    confidence: string;
    riskLevel: string;
  };
}

export default function AiAlertBanner({ prediction }: AiAlertBannerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const autoTopUpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/topup", {
        loanPositionId: "btc-001", // Demo position
        amount: 1500,
        currency: "USDT",
      });
    },
    onSuccess: () => {
      toast({
        title: "Auto Top-Up Initiated",
        description: "Adding 1,500 USDT collateral to protect your position.",
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

  const currentPrice = parseFloat(prediction.currentPrice);
  const predictedPrice = parseFloat(prediction.predictedPrice);
  const priceChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
  const confidence = parseFloat(prediction.confidence);

  // Only show warning if significant drop predicted with high confidence
  if (priceChange > -5 || confidence < 60) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-bitcoin/20 to-yellow-500/20 border border-bitcoin/30 rounded-xl p-4 mb-8" data-testid="ai-alert-banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-bitcoin/20 rounded-full flex items-center justify-center">
              <Info className="w-5 h-5 text-bitcoin" />
            </div>
          </div>
          <div>
            <h3 className="text-bitcoin font-semibold" data-testid="alert-title">AI Price Alert</h3>
            <p className="text-sm text-slate-300" data-testid="alert-message">
              BTC showing {confidence.toFixed(0)}% probability of {Math.abs(priceChange).toFixed(1)}% dip in next {prediction.timeHorizon} hours. Consider adding collateral.
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => autoTopUpMutation.mutate()}
            disabled={autoTopUpMutation.isPending}
            className="bg-bitcoin hover:bg-yellow-500 text-dark-bg px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            data-testid="button-auto-topup"
          >
            {autoTopUpMutation.isPending ? "Processing..." : "Auto Top-Up"}
          </Button>
          <Button 
            variant="outline"
            className="border-bitcoin text-bitcoin hover:bg-bitcoin/10 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            data-testid="button-view-details"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
