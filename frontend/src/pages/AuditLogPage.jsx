import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  History, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  User,
  Clock,
  Filter
} from 'lucide-react';

export function AuditLogPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditEvents({
        actorRole: roleFilter,
        action: actionFilter,
        search: searchTerm
      });
      setEvents(res.events || []);
      setError('');
    } catch (err) {
      setError('Failed to retrieve audit events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [roleFilter, actionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAuditLogs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-navy text-white uppercase tracking-wider">
              Security &amp; Traceability
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy">
            System Audit Event Trail
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Tamper-traceable administrative log tracking citizen submissions, automated OCR verification runs, and reviewer actions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAuditLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-surface-border hover:bg-surface-bg text-ink-secondary text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Zero PII Notice */}
      <div className="p-3 bg-surface-bg border border-surface-border rounded-md text-xs text-navy flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
        <span>
          <strong>Zero PII Privacy Policy:</strong> Passwords, session tokens, and raw personal identifiers are stripped prior to audit persistence.
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-card p-4 rounded-lg border border-surface-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, reference, or action..."
            className="w-full pl-9 pr-3 py-2 border border-surface-border rounded-md text-xs text-navy placeholder-slate-400 focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-secondary font-medium">Actor Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-surface-border rounded-md text-navy text-xs bg-white focus:outline-none focus:border-royal"
            >
              <option value="All">All Roles</option>
              <option value="applicant">Applicant</option>
              <option value="reviewer">Reviewer</option>
              <option value="compliance">Compliance</option>
              <option value="admin">Admin</option>
              <option value="system">System Automated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Events Table */}
      <div className="bg-surface-card rounded-lg border border-surface-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-ink-secondary text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-royal" />
            Loading audit events...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-status-error text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-ink-secondary text-xs">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span>No audit events match your filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Timestamp (IST)</th>
                  <th className="px-6 py-3">Actor &amp; Role</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target Reference</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {events.map((evt) => (
                  <tr key={evt._id || evt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-ink-secondary whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-navy block">{evt.actorName}</span>
                      <span className="text-[10px] uppercase text-ink-secondary font-medium">
                        {evt.actorRole}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-navy">
                      {evt.action}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-navy">
                      {evt.targetReference}
                    </td>
                    <td className="px-6 py-3.5 text-ink-secondary max-w-md">
                      <span className="line-clamp-2">{evt.details}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        evt.outcome === 'Success' ? 'bg-status-success-bg text-status-success' :
                        evt.outcome === 'Warning' ? 'bg-status-warning-bg text-status-warning' :
                        'bg-status-error-bg text-status-error'
                      }`}>
                        {evt.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
