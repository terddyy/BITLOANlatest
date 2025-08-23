import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest("PATCH", `/api/alerts/${alertId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "danger":
        return "bg-danger";
      case "warning":
        return "bg-bitcoin";
      case "info":
        return "bg-info";
      default:
        return "bg-slate-500";
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="alerts-panel">
      <h3 className="font-semibold text-white mb-4" data-testid="alerts-title">Recent Alerts</h3>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start space-x-3 p-3 bg-slate-800 rounded-lg cursor-pointer transition-opacity ${
              alert.isRead ? "opacity-60" : ""
            }`}
            onClick={() => {
              if (!alert.isRead) {
                markAsReadMutation.mutate(alert.id);
              }
            }}
            data-testid={`alert-${alert.id}`}
          >
            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`}></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white" data-testid={`alert-title-${alert.id}`}>
                {alert.title}
              </div>
              <div className="text-xs text-slate-400" data-testid={`alert-time-${alert.id}`}>
                {getTimeAgo(alert.createdAt)}
              </div>
              <div className="text-xs text-slate-300 mt-1" data-testid={`alert-message-${alert.id}`}>
                {alert.message}
              </div>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm" data-testid="no-alerts">No recent alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
