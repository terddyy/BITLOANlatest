import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Loans from "@/pages/loans";
import AiProtection from "@/pages/ai-protection";
import Analytics from "@/pages/analytics";
import NewLoanPage from "@/pages/new-loan"; // Import the new page
import LoanDetailsPage from "@/pages/loan-details"; // Import the new page
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/loans" component={Loans} />
      <Route path="/loans/new" component={NewLoanPage} /> {/* New loan route */}
      <Route path="/loans/:id" component={LoanDetailsPage} /> {/* Loan details route */}
      <Route path="/ai-protection" component={AiProtection} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
