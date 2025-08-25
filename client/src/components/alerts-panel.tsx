import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Notification } from "@shared/schema"; // Import the new Notification type
import { useState, useEffect, memo } from "react"; // Import memo

interface AlertsPanelProps {
  alerts: Notification[]; // Use Notification type
}

// Extracted AlertItem component for memoization
interface AlertItemProps {
  alert: Notification;
  getTimeAgo: (createdAt: string) => string;
  getNotificationColor: (type: string) => string;
  markAsRead: (notificationId: string) => void;
}

const AlertItem = memo(({
  alert,
  getTimeAgo,
  getNotificationColor,
  markAsRead,
}: AlertItemProps) => {
  return (
    <div
      key={alert.id}
      className={`flex items-start space-x-3 p-3 bg-slate-800 rounded-lg cursor-pointer transition-opacity ${
        alert.isRead ? "opacity-60" : ""
      }`}
      onClick={() => {
        if (!alert.isRead) {
          markAsRead(alert.id);
        }
      }}
      data-testid={`alert-${alert.id}`}
    >
      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${getNotificationColor(alert.type)}`}></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white" data-testid={`alert-title-${alert.id}`}>
          {alert.message} {/* Display message instead of title */}
        </div>
        <div className="text-xs text-slate-400" data-testid={`alert-time-${alert.id}`}>
          {getTimeAgo(alert.createdAt)}
        </div>
      </div>
    </div>
  );
});

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const queryClient = useQueryClient();
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "price_alert":
        return "bg-bitcoin"; // Warning color for price alerts
      default:
        return "bg-info"; // Default info color
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const created = new Date(createdAt);
    const diffMs = currentTime.getTime() - created.getTime(); // Use currentTime
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) { // Show "just now" if less than 1 minute
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const alertsToDisplay = showAllAlerts ? alerts : alerts.slice(0, 3);

  return (
    <div className="bg-card-bg rounded-xl p-6 border border-slate-700" data-testid="alerts-panel">
      <h3 className="font-semibold text-white mb-4" data-testid="alerts-title">Recent Alerts</h3>

      <div className="space-y-3">
        {alertsToDisplay.map((alert) => (
          <AlertItem 
            key={alert.id}
            alert={alert}
            getTimeAgo={getTimeAgo}
            getNotificationColor={getNotificationColor}
            markAsRead={markAsReadMutation.mutate}
          />
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm" data-testid="no-alerts">No recent notifications</p>
          </div>
        )}

        {alerts.length > 3 && !showAllAlerts && (
          <button 
            className="w-full text-center text-sm text-bitcoin hover:text-yellow-400 transition-colors mt-4 py-2"
            onClick={() => setShowAllAlerts(true)}
            data-testid="view-all-alerts-button"
          >
            View All ({alerts.length - 3} more)
          </button>
        )}

        {alerts.length > 3 && showAllAlerts && (
          <button 
            className="w-full text-center text-sm text-bitcoin hover:text-yellow-400 transition-colors mt-4 py-2"
            onClick={() => setShowAllAlerts(false)}
            data-testid="show-less-alerts-button"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
  );
}
