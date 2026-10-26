import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Home, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-navy mx-auto mb-4">
        <HelpCircle className="w-8 h-8 text-royal" />
      </div>

      <div className="text-xs font-mono font-bold text-royal uppercase tracking-widest mb-1">
        HTTP 404 Error
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-navy">
        Requested Page Not Found
      </h1>

      <p className="mt-2 text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
        The application path or resource you requested does not exist or may have been relocated.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-royal hover:bg-royal-hover text-white transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Return to Portal Home</span>
        </Link>

        <Link
          to="/applicant/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-white border border-surface-border hover:bg-surface-bg text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
