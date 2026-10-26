import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

export function ComplianceRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.getComplianceRules();
      setRules(res.rules || []);
      setError('');
    } catch (err) {
      setError('Failed to load compliance rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (id, currentEnabled) => {
    try {
      const res = await api.toggleRule(id, !currentEnabled);
      setFeedback(res.message);
      setTimeout(() => setFeedback(''), 3000);
      loadRules();
    } catch (err) {
      alert(err.message || 'Failed to update rule.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-navy text-white uppercase tracking-wider">
            Regulatory Compliance Engine
          </span>
        </div>
        <h1 className="text-2xl font-bold text-navy">
          Configured Compliance Rules Matrix
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Define, inspect, and toggle automated verification rules evaluated by the ingestion pipeline during application screening.
        </p>

        {/* Verification Policy Guidelines */}
        <div className="mt-4 p-3.5 bg-royal-light border border-royal/30 rounded-md flex items-start gap-2.5 text-xs text-navy">
          <ShieldCheck className="w-4 h-4 text-royal shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-royal block">
              Administrative Verification Policy Matrix
            </span>
            <span>
              These criteria govern automated document screening and consistency checks prior to officer adjudication. All flags are advisory and require human reviewer sign-off.
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-status-success-bg border border-status-success/30 rounded-md text-xs text-status-success flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="bg-surface-card rounded-lg border border-surface-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-royal" />
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider">
              Configured Verification Rules ({rules.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={loadRules}
            className="text-xs font-semibold text-ink-secondary hover:text-navy flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-ink-secondary text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-royal" />
            Loading compliance rules...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-status-error text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {rules.map((rule) => (
              <div key={rule._id || rule.id} className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-navy bg-surface-bg px-2 py-0.5 rounded border border-surface-border">
                      {rule.ruleCode}
                    </span>
                    <h3 className="font-bold text-sm text-navy">{rule.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                      v{rule.version}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      rule.severity === 'High' ? 'bg-rose-100 text-rose-800' :
                      rule.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {rule.severity} Severity
                    </span>
                    <span className="text-[11px] text-ink-secondary">
                      Category: {rule.category}
                    </span>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed max-w-3xl">
                    {rule.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Type: System Verification Rule</span>
                    <span>&bull;</span>
                    <span>Execution: Automated Pipeline (Stage 4)</span>
                  </div>
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
                  <span className={`text-xs font-semibold ${rule.enabled ? 'text-status-success' : 'text-slate-400'}`}>
                    {rule.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggle(rule._id || rule.id, rule.enabled)}
                    className="focus:outline-none"
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-8 h-8 text-status-success" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
