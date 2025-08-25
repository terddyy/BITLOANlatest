import React from 'react';
import { useParams } from 'wouter';

export default function LoanDetailsPage() {
  const params = useParams();
  const loanId = params ? params.id : 'N/A';

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center">
      <div className="bg-card-bg rounded-xl p-8 border border-slate-700 shadow-lg text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Loan Details</h1>
        <p className="text-slate-400">This is a placeholder page for loan details.</p>
        <p className="text-slate-400 mt-2">Displaying details for Loan ID: <span className="font-medium text-white">{loanId}</span></p>
        <p className="text-slate-400 mt-2">Further development will show comprehensive information about this loan.</p>
      </div>
    </div>
  );
} 