import { Bell } from "lucide-react";
import { Link, useLocation } from "wouter";

interface NavigationProps {
  user: {
    username: string;
    walletAddress?: string;
  };
}

export default function Navigation({ user }: NavigationProps) {
  const [location] = useLocation();

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
            <div className="w-8 h-8 bg-bitcoin rounded-full flex items-center justify-center" data-testid="logo">
              <span className="text-dark-bg font-bold text-sm">₿</span>
            </div>
            <h1 className="text-xl font-bold text-white" data-testid="app-title">BitLoan</h1>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/" className={getLinkClass("/")} data-testid="nav-dashboard">Dashboard</Link>
            <Link href="/loans" className={getLinkClass("/loans")} data-testid="nav-loans">Loans</Link>
            <Link href="/ai-protection" className={getLinkClass("/ai-protection")} data-testid="nav-protection">AI Protection</Link>
            <Link href="/analytics" className={getLinkClass("/analytics")} data-testid="nav-analytics">Analytics</Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute -top-1 -right-1 bg-danger text-xs rounded-full h-4 w-4 flex items-center justify-center" data-testid="notification-count">3</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-bitcoin to-yellow-500 rounded-full" data-testid="user-avatar"></div>
            <span className="hidden sm:block text-sm font-medium" data-testid="username">{user.username}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
