import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export function PriorityBadge({ priority }) {
  if (priority === 'High') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
        <AlertCircle className="w-3 h-3 text-amber-700" aria-hidden="true" />
        High Priority
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs text-ink-secondary bg-surface-muted border border-surface-border">
      Normal Priority
    </span>
  );
}

export function RiskBadge({ level, score }) {
  switch (level) {
    case 'High Risk':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold bg-status-error-bg text-status-error border border-status-error/30">
          <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
          <span>High Risk ({score}/100)</span>
        </span>
      );

    case 'Medium Risk':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold bg-status-warning-bg text-status-warning border border-status-warning/30">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Medium Risk ({score}/100)</span>
        </span>
      );

    case 'Low Risk':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold bg-status-success-bg text-status-success border border-status-success/30">
          <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Low Risk ({score}/100)</span>
        </span>
      );

    case 'Insufficient information':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span>Insufficient information</span>
        </span>
      );
  }
}
