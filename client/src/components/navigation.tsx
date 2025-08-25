import { Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Notification } from "@shared/schema";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import AlertsPanel from "./alerts-panel";

interface NavigationProps {
  user: {
    username: string;
    walletAddress?: string | null;
    linkedWalletBalanceBtc?: string | null; // Added new BTC balance field (optional)
    linkedWalletBalanceUsdt?: string | null; // Added new USDT balance field (optional)
    autoTopUpEnabled?: boolean | null;
    smsAlertsEnabled?: boolean | null;
  };
}

export default function Navigation({ user }: NavigationProps) {
  const [location] = useLocation();

  const { data: notifications } = useQuery<Notification[]>({ // Fetch notifications
    queryKey: ["/api/notifications"],
  });

  const unreadCount = notifications?.filter(notification => !notification.isRead).length || 0;

  const getLinkClass = (path: string) => {
    return location === path 
      ? "text-bitcoin font-medium" 
      : "text-slate-400 hover:text-white transition-colors";
  };

  return (
    <nav className="bg-card-bg border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" data-testid="logo">
              <img src="/src/Images/bitloanlogowithbackground.png" alt="BitLoan Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white" data-testid="app-title">BitLoan</h1>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/" className={getLinkClass("/")} data-testid="nav-dashboard">Dashboard</Link>
            <Link href="/loans" className={getLinkClass("/loans")} data-testid="nav-loans">Loans</Link>
            <Link href="/ai-protection" className={getLinkClass("/ai-protection")} data-testid="nav-protection">AI Protection</Link>
            <Link href="/analytics" className={getLinkClass("/analytics")} data-testid="nav-analytics">Analytics</Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors relative" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-xs rounded-full h-4 w-4 flex items-center justify-center" data-testid="notification-count">
                    {unreadCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full md:w-1/3 bg-card-bg border-l border-slate-700">
              <SheetHeader>
                <SheetTitle className="text-white">Notifications</SheetTitle>
              </SheetHeader>
              <div className="py-4 h-[calc(100%-60px)] overflow-y-auto">
                <AlertsPanel alerts={notifications || []} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-bitcoin to-yellow-500 rounded-full" data-testid="user-avatar"></div>
            <span className="hidden sm:block text-sm font-medium" data-testid="username">{user.username}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
