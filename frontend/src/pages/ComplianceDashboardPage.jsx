import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Scale, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Eye, 
  Sliders, 
  BarChart3, 
  History, 
  Check, 
  X, 
  ChevronRight,
  ExternalLink,
  FileText,
  AlertCircle
} from 'lucide-react';

export function ComplianceDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Route-based active navigation tab synced with URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['overview', 'queue', 'workspace', 'rules', 'violations', 'reports', 'audit-trail'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const setActiveTab = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  const getNavItemClass = (isActive) =>
    `w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#93B4FF] group ${
      isActive
        ? 'bg-[#2F6FED] text-white font-semibold shadow-sm'
        : 'bg-transparent text-[#334155] font-normal hover:bg-[#EAF1FF] hover:text-[#17365D]'
    }`;

  const getNavIconClass = (isActive) =>
    `w-4 h-4 shrink-0 transition-colors ${
      isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#17365D]'
    }`;

  // Overview metrics
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Queue
  const [queue, setQueue] = useState([]);
  const [queueRisk, setQueueRisk] = useState('All');
  const [queueSearch, setQueueSearch] = useState('');
  const [queueLoading, setQueueLoading] = useState(false);

  // Audit Workspace
  const [selectedAppId, setSelectedAppId] = useState('');
  const [auditCase, setAuditCase] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [checklist, setChecklist] = useState({
    identityMatch: true,
    incomeCeiling: true,
    ageValid: true,
    expiryValid: true,
    academicVerified: true,
    duplicateCheck: true,
    mandatoryDocsComplete: true,
    discrepancyResolved: true,
    proceduralAdherence: true,
    auditTrailComplete: true
  });
  const [complianceDecision, setComplianceDecision] = useState('Compliance Cleared');
  const [complianceComments, setComplianceComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState('');

  // Rules
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Violations
  const [violations, setViolations] = useState([]);
  const [violationsLoading, setViolationsLoading] = useState(false);

  // Reports
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Audit Trail
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Initial Data Load
  const loadOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await api.getComplianceOverview();
      setOverview(res);
    } catch (err) {
      console.error(err);
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadQueue = async () => {
    try {
      setQueueLoading(true);
      const res = await api.getComplianceQueue({ riskLevel: queueRisk });
      let list = res.queue || [];
      if (queueSearch) {
        list = list.filter(q => 
          q.referenceNumber?.toLowerCase().includes(queueSearch.toLowerCase()) ||
          q.applicationType?.toLowerCase().includes(queueSearch.toLowerCase()) ||
          q.applicantName?.toLowerCase().includes(queueSearch.toLowerCase())
        );
      }
      setQueue(list);
    } catch (err) {
      console.error(err);
    } finally {
      setQueueLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      setRulesLoading(true);
      const res = await api.getComplianceRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  const loadViolations = async () => {
    try {
      setViolationsLoading(true);
      const res = await api.getComplianceViolations();
      setViolations(res.violations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setViolationsLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const res = await api.getComplianceReports();
      setReports(res);
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.getAuditEvents();
      setAuditLogs(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'queue') loadQueue();
    if (activeTab === 'rules') loadRules();
    if (activeTab === 'violations') loadViolations();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'audit-trail') loadAuditLogs();
  }, [activeTab, queueRisk]);

  // Load specific audit case
  const handleOpenAuditCase = async (id) => {
    try {
      setAuditLoading(true);
      setSelectedAppId(id);
      setActiveTab('workspace');
      const res = await api.getComplianceAuditDetails(id);
      setAuditCase(res);
      setAuditSuccess('');
      setComplianceComments('');
    } catch (err) {
      alert(err.message || 'Failed to load compliance audit case.');
    } finally {
      setAuditLoading(false);
    }
  };

  // Record Compliance Decision
  const handleRecordDecision = async () => {
    if (!selectedAppId) return;
    if (!complianceComments.trim()) {
      alert('Formal compliance officer remarks are required.');
      return;
    }

    try {
      setActionLoading(true);
      await api.recordComplianceDecision(selectedAppId, {
        decision: complianceDecision,
        comments: complianceComments,
        checklist
      });
      setAuditSuccess(`Compliance decision [${complianceDecision}] recorded successfully.`);
      loadOverview();
      // Reload case
      const res = await api.getComplianceAuditDetails(selectedAppId);
      setAuditCase(res);
    } catch (err) {
      alert(err.message || 'Failed to record compliance decision.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Rule
  const handleToggleRule = async (ruleId, currentEnabled) => {
    try {
      await api.toggleRule(ruleId, !currentEnabled);
      setRules(prev => prev.map(r => (r._id === ruleId || r.id === ruleId ? { ...r, enabled: !currentEnabled } : r)));
    } catch (err) {
      alert(err.message || 'Failed to update rule state.');
    }
  };

  // Update Violation Status
  const handleUpdateViolationStatus = async (vId, newStatus) => {
    try {
      await api.updateComplianceViolation(vId, { status: newStatus });
      setViolations(prev => prev.map(v => (v._id === vId || v.id === vId ? { ...v, status: newStatus } : v)));
    } catch (err) {
      alert(err.message || 'Failed to update violation status.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-bg flex">
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col shrink-0">
        <div className="p-4 border-b border-surface-border bg-surface-muted">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-navy text-xs truncate">{user?.name || 'Compliance Officer'}</div>
              <div className="text-[10px] text-royal font-semibold bg-royal-light px-1.5 py-0.5 rounded inline-block mt-0.5 border border-royal/20">
                Compliance Directorate
              </div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 text-xs flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={getNavItemClass(activeTab === 'overview')}
          >
            <div className="flex items-center gap-2.5">
              <Scale className={getNavIconClass(activeTab === 'overview')} />
              <span>Compliance Overview</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={getNavItemClass(activeTab === 'queue')}
          >
            <div className="flex items-center gap-2.5">
              <Clock className={getNavIconClass(activeTab === 'queue')} />
              <span>Compliance Queue</span>
            </div>
            {overview && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
                activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#334155]'
              }`}>
                {overview.awaitingAudit}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={getNavItemClass(activeTab === 'workspace')}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={getNavIconClass(activeTab === 'workspace')} />
              <span>Audit Workspace</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={getNavItemClass(activeTab === 'rules')}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className={getNavIconClass(activeTab === 'rules')} />
              <span>Rules &amp; Policies</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('violations')}
            className={getNavItemClass(activeTab === 'violations')}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className={getNavIconClass(activeTab === 'violations')} />
              <span>Violations &amp; Escalations</span>
            </div>
            {overview && overview.openViolations > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
                activeTab === 'violations' ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
              }`}>
                {overview.openViolations}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={getNavItemClass(activeTab === 'reports')}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className={getNavIconClass(activeTab === 'reports')} />
              <span>Compliance Reports</span>
            </div>
          </button>

          <div className="pt-3 pb-1 border-t border-surface-border my-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary px-3">
              Regulatory Records
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('audit-trail')}
            className={getNavItemClass(activeTab === 'audit-trail')}
          >
            <div className="flex items-center gap-2.5">
              <History className={getNavIconClass(activeTab === 'audit-trail')} />
              <span>Directorate Audit Trail</span>
            </div>
          </button>
        </nav>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        {/* Banner */}
        <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
              Statutory Directorate of Regulatory Compliance &amp; Standards
            </span>
            <h1 className="text-2xl font-bold text-navy">
              {activeTab === 'overview' && 'Compliance Directorate Control Room'}
              {activeTab === 'queue' && 'Regulatory Audit Queue'}
              {activeTab === 'workspace' && '10-Point Compliance Audit Workspace'}
              {activeTab === 'rules' && 'Statutory Rules &amp; Automated Screening Policies'}
              {activeTab === 'violations' && 'Rule Violations &amp; Escalation Tracker'}
              {activeTab === 'reports' && 'National Compliance &amp; Adherence Reports'}
              {activeTab === 'audit-trail' && 'Immutable Compliance Audit Logs'}
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Active Officer: <strong className="text-navy">{user?.name}</strong> • Directorate ID: CMP-DIR-2026
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadOverview();
                if (activeTab === 'queue') loadQueue();
                if (activeTab === 'rules') loadRules();
                if (activeTab === 'violations') loadViolations();
                if (activeTab === 'reports') loadReports();
                if (activeTab === 'audit-trail') loadAuditLogs();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Directorate</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div 
                onClick={() => setActiveTab('queue')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-royal">Awaiting Audit</div>
                <div className="text-2xl font-extrabold text-navy mt-1">
                  {overview ? overview.awaitingAudit : '...'}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">Pending inspection</div>
              </div>

              <div 
                onClick={() => setActiveTab('queue')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-royal">In Active Audit</div>
                <div className="text-2xl font-extrabold text-navy mt-1">
                  {overview ? overview.inAudit : '...'}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">Under investigation</div>
              </div>

              <div 
                onClick={() => setActiveTab('violations')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-status-error cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-status-error">Open Violations</div>
                <div className="text-2xl font-extrabold text-status-error mt-1">
                  {overview ? overview.openViolations : '...'}
                </div>
                <div className="text-[10px] text-status-error mt-1">Flagged infractions</div>
              </div>

              <div 
                onClick={() => setActiveTab('queue')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-status-warning cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-status-warning">Returned for Recheck</div>
                <div className="text-2xl font-extrabold text-status-warning mt-1">
                  {overview ? overview.returnedForRecheck : '...'}
                </div>
                <div className="text-[10px] text-status-warning mt-1">Sent to reviewer</div>
              </div>

              <div 
                onClick={() => setActiveTab('violations')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-status-error cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-status-error">Escalated Cases</div>
                <div className="text-2xl font-extrabold text-status-error mt-1">
                  {overview ? overview.escalated : '...'}
                </div>
                <div className="text-[10px] text-status-error mt-1">Supervisory review</div>
              </div>

              <div 
                onClick={() => setActiveTab('queue')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-status-success cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-status-success">Compliance Cleared</div>
                <div className="text-2xl font-extrabold text-status-success mt-1">
                  {overview ? overview.cleared : '...'}
                </div>
                <div className="text-[10px] text-status-success mt-1">Passed audit</div>
              </div>
            </div>

            {/* Regulatory Directorate Core Duties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-royal" />
                  <span>Statutory Compliance Oversight Responsibilities</span>
                </h3>
                <ul className="space-y-3 text-xs text-ink-secondary">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-royal mt-1.5 shrink-0" />
                    <span><strong>10-Point Audit Inspection:</strong> Reviewers and algorithms are cross-checked for adherence to national anti-fraud and eligibility thresholds.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-royal mt-1.5 shrink-0" />
                    <span><strong>Inter-Departmental Validity:</strong> Ensure caste, income, and trade certificates meet validity expiration dates dynamically.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-royal mt-1.5 shrink-0" />
                    <span><strong>Policy Enforcement:</strong> Activate, adjust, and evaluate real-time automated verification rules across schemes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-royal mt-1.5 shrink-0" />
                    <span><strong>Discrepancy Remediation:</strong> Prevent arbitrary rejections and verify that citizens are given adequate opportunity for correction.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('queue')}
                    style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded font-bold text-xs hover:bg-[#2558C4] text-white shadow-sm cursor-pointer select-none"
                  >
                    <span>Inspect Pending Audit Queue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-royal" />
                  <span>Quick Directorate Actions</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('queue')}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy">Audit Queue</div>
                    <div className="text-[11px] text-ink-secondary">Review high risk applications</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('rules')}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy">Manage Rules</div>
                    <div className="text-[11px] text-ink-secondary">Enable or tune screening policies</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('violations')}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy">Violations Log</div>
                    <div className="text-[11px] text-ink-secondary">Investigate rule infractions</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy">Compliance Reports</div>
                    <div className="text-[11px] text-ink-secondary">Rate of adherence and stats</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: QUEUE ================= */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-surface-card p-4 rounded border border-surface-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && loadQueue()}
                  placeholder="Search by reference, scheme, or applicant..."
                  className="w-full pl-9 pr-3 py-2 border border-surface-border rounded text-xs text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-secondary font-semibold">Risk Classification:</span>
                <select
                  value={queueRisk}
                  onChange={(e) => setQueueRisk(e.target.value)}
                  className="px-3 py-1.5 border border-surface-border rounded text-navy text-xs bg-white focus:outline-none focus:border-royal"
                >
                  <option value="All">All Risk Profiles</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="Low">Low Risk</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {queueLoading ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-royal" />
                  Loading compliance audit queue...
                </div>
              ) : queue.length === 0 ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  No cases found requiring compliance audit in this filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap">Reference No.</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Service Name</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Applicant Name</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Risk Level</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Assigned Reviewer</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Compliance Status</th>
                        <th className="px-4 py-3.5 text-right sticky right-0 bg-surface-bg font-semibold z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[130px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {queue.map((item) => (
                        <tr key={item.id} className="group hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-navy whitespace-nowrap">
                            {item.referenceNumber}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-navy">
                            {item.applicationType}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-navy">
                            {item.applicantName}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.riskLevel === 'High'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : item.riskLevel === 'Medium'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {item.riskLevel} Risk
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                            {item.assignedReviewerName || 'Unassigned'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.complianceStatus === 'Cleared'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.complianceStatus === 'Escalated'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-royal-light text-royal'
                            }`}>
                              {item.complianceStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#F8FAFC] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[130px]">
                            <button
                              type="button"
                              onClick={() => handleOpenAuditCase(item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-semibold text-xs bg-[#2F6FED] hover:bg-[#2558C4] text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#93B4FF]"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Audit Case</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: AUDIT WORKSPACE ================= */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            {!selectedAppId && !auditCase ? (
              <div className="bg-surface-card p-12 rounded border border-surface-border text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-royal mx-auto" />
                <h3 className="font-bold text-navy text-sm">Select an Application to Audit</h3>
                <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                  Pick a case from the Compliance Queue to open the 10-point regulatory verification checklist.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                  className="px-4 py-2 rounded text-xs font-bold text-white hover:bg-[#2558C4] shadow-sm cursor-pointer select-none"
                >
                  Open Compliance Queue
                </button>
              </div>
            ) : auditLoading ? (
              <div className="py-20 text-center text-xs text-ink-secondary">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-royal" />
                Loading case audit records and extracted documents...
              </div>
            ) : auditCase && (
              <div className="space-y-6">
                {/* Case Header */}
                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy text-lg">{auditCase.application.referenceNumber}</span>
                      <StatusBadge status={auditCase.application.status} />
                    </div>
                    <div className="text-xs text-ink-secondary mt-1">
                      Service: <strong className="text-navy">{auditCase.application.applicationType}</strong> • Citizen: <strong className="text-navy">{auditCase.application.applicantName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/reviewer/workspace/${auditCase.application._id || auditCase.application.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-surface-border text-navy hover:bg-surface-bg text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reviewer Workspace</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>

                {auditSuccess && (
                  <div className="p-4 rounded bg-status-success-bg border border-status-success/30 text-status-success text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{auditSuccess}</span>
                  </div>
                )}

                {/* 10-Point Regulatory Checklist & Decision Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Checklist */}
                  <div className="lg:col-span-2 bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                    <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-royal" />
                        <span>10-Point Regulatory Adherence Inspection</span>
                      </span>
                      <span className="text-xs text-ink-secondary font-normal">
                        Statutory checklist for official clearing
                      </span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      {[
                        { key: 'identityMatch', label: '1. Identity Match Verification', desc: 'Citizen name, father name, and gender match official identity records with allowable variation margins.' },
                        { key: 'incomeCeiling', label: '2. Income Within Scheme Ceiling', desc: 'Annual family income certified by revenue authority does not exceed statutory scheme ceilings.' },
                        { key: 'ageValid', label: '3. Age & Birth Date Verification', desc: 'Date of birth satisfies minimum/maximum regulatory requirements for selected service.' },
                        { key: 'expiryValid', label: '4. Certificate Validity & Expiry Checks', desc: 'Non-permanent certificates (income/license) are within legal validity date on submission.' },
                        { key: 'academicVerified', label: '5. Academic Credentials Verification', desc: 'Roll numbers, passing results, and marks match official education board certificates.' },
                        { key: 'duplicateCheck', label: '6. Duplicate Certificate Authentication', desc: 'Uploaded files verified for non-duplication against regional database hashes.' },
                        { key: 'mandatoryDocsComplete', label: '7. Mandatory Document Completeness', desc: 'All statutory mandatory documents uploaded without unacceptable omission.' },
                        { key: 'discrepancyResolved', label: '8. Discrepancy Resolution Adherence', desc: 'Any spelling or format alerts properly reviewed and justified by verification officer.' },
                        { key: 'proceduralAdherence', label: '9. Reviewer Procedural Adherence', desc: 'Verification officer recorded proper justification without summary arbitrary dismissal.' },
                        { key: 'auditTrailComplete', label: '10. Immutable Audit Trail Completeness', desc: 'All state transitions and uploads digitally logged with timestamp and actor identities.' }
                      ].map((item) => (
                        <label 
                          key={item.key} 
                          className="flex items-start gap-3 p-3 rounded border border-surface-border hover:bg-slate-50/70 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checklist[item.key]}
                            onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="mt-0.5 rounded text-royal focus:ring-royal"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-navy">{item.label}</div>
                            <div className="text-[11px] text-ink-secondary mt-0.5">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Right Col: Directorate Decision Form */}
                  <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                    <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-royal" />
                      <span>Record Directorate Action</span>
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-navy mb-1.5">Compliance Action</label>
                        <select
                          value={complianceDecision}
                          onChange={(e) => setComplianceDecision(e.target.value)}
                          className="w-full p-2.5 border border-surface-border rounded text-xs font-bold text-navy bg-white focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                        >
                          <option value="Compliance Cleared">Compliance Cleared (Passed Audit)</option>
                          <option value="Clarification Required">Clarification Required</option>
                          <option value="Return for Recheck">Return for Recheck (To Reviewer)</option>
                          <option value="Escalate Case">Escalate Case (To Supervisory Cell)</option>
                          <option value="Flag Rule Violation">Flag Rule Violation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-navy mb-1.5">
                          Directorate Audit Remarks (Required)
                        </label>
                        <textarea
                          value={complianceComments}
                          onChange={(e) => setComplianceComments(e.target.value)}
                          rows={6}
                          placeholder="State legal or procedural findings, adherence to 10-point checklist, or instructions for the reviewing officer..."
                          className="w-full p-2.5 border border-surface-border rounded text-xs text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={actionLoading || !complianceComments.trim()}
                          onClick={handleRecordDecision}
                          style={{
                            backgroundColor: (actionLoading || !complianceComments.trim()) ? '#94A3B8' : '#2F6FED',
                            color: '#FFFFFF'
                          }}
                          className="w-full py-2.5 rounded font-bold text-xs text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:brightness-110 cursor-pointer select-none"
                        >
                          {actionLoading ? 'Recording Decision...' : 'Record Compliance Action'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: RULES ================= */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-navy">Statutory Compliance Screening Rules</h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Automated regulatory validation rules evaluated during citizen document submission.
                </p>
              </div>

              <button
                type="button"
                onClick={loadRules}
                className="p-2 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary"
              >
                <RefreshCw className={`w-4 h-4 ${rulesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {rulesLoading ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  Loading rules...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Rule Code</th>
                        <th className="px-6 py-3.5">Rule Name</th>
                        <th className="px-6 py-3.5">Severity</th>
                        <th className="px-6 py-3.5">Regulatory Description</th>
                        <th className="px-6 py-3.5 text-right">Status / Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {rules.map((rule) => (
                        <tr key={rule._id || rule.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-navy whitespace-nowrap">
                            {rule.ruleCode}
                          </td>
                          <td className="px-6 py-4 font-semibold text-navy">
                            {rule.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rule.severity === 'Fatal' || rule.severity === 'Critical'
                                ? 'bg-rose-100 text-rose-800'
                                : rule.severity === 'Warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {rule.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-ink-secondary max-w-md">
                            {rule.description}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleRule(rule._id || rule.id, rule.enabled)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                rule.enabled
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {rule.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: VIOLATIONS ================= */}
        {activeTab === 'violations' && (
          <div className="space-y-4">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-navy">Regulatory Violations &amp; Escalation Tracker</h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Active rule breaches, document tampering flags, and procedural omissions under investigation.
                </p>
              </div>

              <button
                type="button"
                onClick={loadViolations}
                className="p-2 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary"
              >
                <RefreshCw className={`w-4 h-4 ${violationsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {violationsLoading ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  Loading violations...
                </div>
              ) : violations.length === 0 ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  No compliance violations recorded.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Violation Code</th>
                        <th className="px-6 py-3.5">Application Ref</th>
                        <th className="px-6 py-3.5">Rule / Issue</th>
                        <th className="px-6 py-3.5">Severity</th>
                        <th className="px-6 py-3.5">Reported By</th>
                        <th className="px-6 py-3.5">Current Status</th>
                        <th className="px-6 py-3.5 text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {violations.map((v) => (
                        <tr key={v._id || v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-rose-700 whitespace-nowrap">
                            {v.violationCode}
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-navy whitespace-nowrap">
                            {v.applicationReference}
                          </td>
                          <td className="px-6 py-4 text-navy">
                            <div className="font-semibold">{v.ruleName}</div>
                            <div className="text-[11px] text-ink-secondary mt-0.5">{v.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              v.severity === 'Critical'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {v.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-ink-secondary whitespace-nowrap">
                            {v.reportedBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-navy">{v.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <select
                              value={v.status}
                              onChange={(e) => handleUpdateViolationStatus(v._id || v.id, e.target.value)}
                              className="px-2.5 py-1 text-xs border border-surface-border rounded bg-white text-navy font-semibold focus:outline-none focus:border-royal"
                            >
                              <option value="Open">Open</option>
                              <option value="Under Investigation">Under Investigation</option>
                              <option value="Awaiting Recheck">Awaiting Recheck</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Escalated">Escalated</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 6: REPORTS ================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <h2 className="text-xl font-bold text-navy">Regulatory Compliance Analytics</h2>
              <p className="text-xs text-ink-secondary mt-1">
                Real-time metrics on citizen adherence, common certificate omissions, and audit accuracy.
              </p>
            </div>

            {reportsLoading || !reports ? (
              <div className="py-20 text-center text-xs text-ink-secondary">
                Loading compliance reports...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Overall Rate */}
                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">
                    Adherence Performance
                  </span>
                  <div className="text-4xl font-extrabold text-navy">
                    {reports.complianceRate}%
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Applications meeting all statutory requirements without secondary escalations.
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-royal h-2 rounded-full" style={{ width: `${reports.complianceRate}%` }}></div>
                  </div>
                </div>

                {/* Reviewer Score */}
                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">
                    Reviewer Adherence Index
                  </span>
                  <div className="text-4xl font-extrabold text-emerald-600">
                    {reports.reviewerAdherenceScore}%
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Verification officers following standard operating guidelines and audit checklists.
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${reports.reviewerAdherenceScore}%` }}></div>
                  </div>
                </div>

                {/* Average Turnaround */}
                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">
                    Average Audit Turnaround
                  </span>
                  <div className="text-4xl font-extrabold text-navy">
                    {reports.avgProcessingDays} Days
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Average duration from submission to final regulatory sign-off.
                  </p>
                </div>

                {/* Common Omissions */}
                <div className="lg:col-span-2 bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                  <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2">
                    Most Common Certificate Omissions Across Applications
                  </h3>
                  <div className="space-y-3 text-xs">
                    {reports.commonOmissions.length === 0 ? (
                      <div className="text-ink-secondary">No document omissions recorded.</div>
                    ) : (
                      reports.commonOmissions.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-navy font-semibold">
                            <span>{item.documentName}</span>
                            <span>{item.omissionCount} missing ({item.percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Severity Breakdown */}
                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                  <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2">
                    Violation Severity Distribution
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-rose-50 text-rose-800 font-semibold">
                      <span>Critical Violations</span>
                      <span>{reports.violationDistribution.critical}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-amber-50 text-amber-800 font-semibold">
                      <span>High Severity</span>
                      <span>{reports.violationDistribution.high}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-yellow-50 text-yellow-800 font-semibold">
                      <span>Medium Severity</span>
                      <span>{reports.violationDistribution.medium}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-blue-50 text-blue-800 font-semibold">
                      <span>Low Severity</span>
                      <span>{reports.violationDistribution.low}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 7: AUDIT TRAIL ================= */}
        {activeTab === 'audit-trail' && (
          <div className="space-y-4">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-navy">Immutable Regulatory Audit Trail</h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Cryptographically ordered log of all compliance decisions, rule toggles, and status updates.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAuditLogs}
                className="p-2 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary"
              >
                <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {logsLoading ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  Loading audit logs...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Timestamp</th>
                        <th className="px-6 py-3.5">Actor</th>
                        <th className="px-6 py-3.5">Action</th>
                        <th className="px-6 py-3.5">Target</th>
                        <th className="px-6 py-3.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {auditLogs.map((log) => (
                        <tr key={log._id || log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-3 text-ink-secondary whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-3 font-semibold text-navy whitespace-nowrap">
                            {log.actorName} ({log.actorRole})
                          </td>
                          <td className="px-6 py-3 font-semibold text-navy whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="px-6 py-3 font-mono text-navy whitespace-nowrap">
                            {log.targetReference || '—'}
                          </td>
                          <td className="px-6 py-3 text-ink-secondary max-w-sm truncate">
                            {log.details || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ComplianceDashboardPage;
