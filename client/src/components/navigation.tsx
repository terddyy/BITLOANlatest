import { Bell } from "lucide-react";

interface NavigationProps {
  user: {
    username: string;
    walletAddress?: string;
  };
}

export default function Navigation({ user }: NavigationProps) {
  return (
    <nav className="bg-card-bg border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-bitcoin rounded-full flex items-center justify-center" data-testid="logo">
              <span className="text-dark-bg font-bold text-sm">₿</span>
            </div>
            <h1 className="text-xl font-bold text-white" data-testid="app-title">BitLoan</h1>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-bitcoin font-medium" data-testid="nav-dashboard">Dashboard</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors" data-testid="nav-loans">Loans</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors" data-testid="nav-protection">AI Protection</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors" data-testid="nav-analytics">Analytics</a>
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
