import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  FileCheck2, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight,
  Filter,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Eye,
  FileText,
  User,
  Bell,
  Check,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export function ReviewerDashboardPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Route-based active navigation tab synced with URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['overview', 'queue', 'assigned', 'in-progress', 'action-required', 'completed', 'notifications', 'profile'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'queue';

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

  // Application data & state
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [assignedOnly, setAssignedOnly] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Profile Form
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, notifsRes] = await Promise.all([
        api.getApplications({
          status: statusFilter,
          type: typeFilter,
          search: searchTerm
        }),
        api.getNotifications().catch(() => ({ notifications: [] }))
      ]);
      setApplications(appsRes.applications || []);
      setNotifications(notifsRes.notifications || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to retrieve application records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Claim unassigned application
  const handleClaim = async (appId) => {
    try {
      setClaimingId(appId);
      await api.updateApplication(appId, {
        assignedReviewerId: user.id,
        assignedReviewerName: user.name,
        assignmentDate: new Date().toISOString(),
        status: 'Under Review'
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to claim application.');
    } finally {
      setClaimingId(null);
    }
  };

  // Profile Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('New password and confirmation do not match.');
      return;
    }

    try {
      setProfileLoading(true);
      const payload = {
        name: profileName,
        phone: profilePhone
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await api.updateProfile(payload);
      updateUser(res.user);
      setProfileSuccess('Officer profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // KPI Calculations
  const kpis = {
    pendingReview: applications.filter(a => ['Submitted', 'Under Review', 'Reviewer Assigned'].includes(a.status)).length,
    assignedToMe: applications.filter(a => a.assignedReviewerId === user?.id || a.assignedReviewerName === user?.name).length,
    inProgress: applications.filter(a => a.status === 'Under Review').length,
    actionRequired: applications.filter(a => ['Action Required', 'Re-upload Requested'].includes(a.status)).length,
    recheckEscalated: applications.filter(a => ['Recheck Required', 'Escalated'].includes(a.status)).length,
    completed: applications.filter(a => ['Verified', 'Approved', 'Rejected'].includes(a.status)).length,
  };

  // Filtered Applications for the table
  const displayedApps = applications.filter(app => {
    if (activeTab === 'assigned' && !(app.assignedReviewerId === user?.id || app.assignedReviewerName === user?.name)) {
      return false;
    }
    if (activeTab === 'in-progress' && app.status !== 'Under Review') {
      return false;
    }
    if (activeTab === 'action-required' && !['Action Required', 'Re-upload Requested'].includes(app.status)) {
      return false;
    }
    if (activeTab === 'completed' && !['Verified', 'Approved', 'Rejected'].includes(app.status)) {
      return false;
    }
    if (assignedOnly && !(app.assignedReviewerId === user?.id || app.assignedReviewerName === user?.name)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-bg flex">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col shrink-0">
        <div className="p-4 border-b border-surface-border bg-surface-muted">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-navy text-xs truncate">{user?.name || 'Review Officer'}</div>
              <div className="text-[10px] text-royal font-semibold bg-royal-light px-1.5 py-0.5 rounded inline-block mt-0.5 border border-royal/20">
                Verification Desk
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
              <LayoutDashboard className={getNavIconClass(activeTab === 'overview')} />
              <span>Overview &amp; KPIs</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={getNavItemClass(activeTab === 'queue')}
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className={getNavIconClass(activeTab === 'queue')} />
              <span>Full Review Queue</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
              activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#334155]'
            }`}>
              {applications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={getNavItemClass(activeTab === 'assigned')}
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className={getNavIconClass(activeTab === 'assigned')} />
              <span>Assigned to Me</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
              activeTab === 'assigned' ? 'bg-white/20 text-white' : 'bg-royal-light text-royal'
            }`}>
              {kpis.assignedToMe}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('in-progress')}
            className={getNavItemClass(activeTab === 'in-progress')}
          >
            <div className="flex items-center gap-2.5">
              <Eye className={getNavIconClass(activeTab === 'in-progress')} />
              <span>In Progress</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
              activeTab === 'in-progress' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {kpis.inProgress}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('action-required')}
            className={getNavItemClass(activeTab === 'action-required')}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className={getNavIconClass(activeTab === 'action-required')} />
              <span>Action Required</span>
            </div>
            {kpis.actionRequired > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
                activeTab === 'action-required' ? 'bg-white text-status-warning' : 'bg-status-warning text-white'
              }`}>
                {kpis.actionRequired}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={getNavItemClass(activeTab === 'completed')}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className={getNavIconClass(activeTab === 'completed')} />
              <span>Completed Reviews</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
              activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {kpis.completed}
            </span>
          </button>

          <div className="pt-3 pb-1 border-t border-surface-border my-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary px-3">
              Officer Account
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={getNavItemClass(activeTab === 'notifications')}
          >
            <div className="flex items-center gap-2.5">
              <Bell className={getNavIconClass(activeTab === 'notifications')} />
              <span>Notifications</span>
            </div>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
                activeTab === 'notifications' ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
              }`}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={getNavItemClass(activeTab === 'profile')}
          >
            <div className="flex items-center gap-2.5">
              <User className={getNavIconClass(activeTab === 'profile')} />
              <span>Officer Profile</span>
            </div>
          </button>
        </nav>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        {/* Officer Banner */}
        <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
              Authorized Verification Officer Workspace
            </span>
            <h1 className="text-2xl font-bold text-navy">
              {activeTab === 'overview' && 'Review Desk Analytics & Workload'}
              {activeTab === 'queue' && 'Application Verification Queue'}
              {activeTab === 'assigned' && 'My Assigned Applications'}
              {activeTab === 'in-progress' && 'In Progress Applications'}
              {activeTab === 'action-required' && 'Applications Awaiting Citizen Correction'}
              {activeTab === 'completed' && 'Completed Verification Records'}
              {activeTab === 'notifications' && 'Review Desk Notifications'}
              {activeTab === 'profile' && 'Verification Officer Profile'}
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Logged in as <strong className="text-navy">{user?.name}</strong> • Authorized Document Authentication Officer
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* 6 KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div 
            onClick={() => { setStatusFilter('All'); setActiveTab('queue'); }}
            className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-ink-secondary">Pending Review</div>
            <div className="text-2xl font-extrabold text-navy mt-1">{kpis.pendingReview}</div>
            <div className="text-[10px] text-ink-secondary mt-1">Ready for inspection</div>
          </div>

          <div 
            onClick={() => setActiveTab('assigned')}
            className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-royal">Assigned to Me</div>
            <div className="text-2xl font-extrabold text-royal mt-1">{kpis.assignedToMe}</div>
            <div className="text-[10px] text-ink-secondary mt-1">Your active caseload</div>
          </div>

          <div 
            onClick={() => setActiveTab('in-progress')}
            className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-royal">In Active Review</div>
            <div className="text-2xl font-extrabold text-navy mt-1">{kpis.inProgress}</div>
            <div className="text-[10px] text-ink-secondary mt-1">Workspace opened</div>
          </div>

          <div 
            onClick={() => setActiveTab('action-required')}
            className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-status-warning cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-status-warning">Action Required</div>
            <div className="text-2xl font-extrabold text-status-warning mt-1">{kpis.actionRequired}</div>
            <div className="text-[10px] text-ink-secondary mt-1">With citizen for upload</div>
          </div>

          <div 
            onClick={() => { setStatusFilter('All'); setActiveTab('queue'); }}
            className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-status-error cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-status-error">Recheck / Escalated</div>
            <div className="text-2xl font-extrabold text-status-error mt-1">{kpis.recheckEscalated}</div>
            <div className="text-[10px] text-ink-secondary mt-1">Compliance flag</div>
          </div>

          <div 
            onClick={() => setActiveTab('completed')}
            className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-ink-secondary">Completed Reviews</div>
            <div className="text-2xl font-extrabold text-navy mt-1">{kpis.completed}</div>
            <div className="text-[10px] text-ink-secondary mt-1">Approved or rejected</div>
          </div>
        </div>

        {/* Tab Content: Overview Analytics */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
              <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2">
                Verification Workspace Quick Guide
              </h3>
              <div className="space-y-3 text-xs text-ink-secondary">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-navy text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-navy">Claim or Open:</strong> Claim unassigned submissions from the review queue or access your assigned applications.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-navy text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-navy">Automated Cross-Validation:</strong> Suvidha extracts certificate fields and compares them side-by-side with form inputs.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-navy text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-navy">Record Regulatory Decision:</strong> Mark Verified, Request Re-upload for specific invalid documents, or Reject with formal explanation.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded font-bold text-xs hover:bg-[#2558C4] shadow-sm cursor-pointer select-none"
                >
                  <span>Go to Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
              <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2">
                Workload &amp; Service Distribution
              </h3>
              <div className="space-y-3 text-xs">
                {['Scholarship Assistance', 'Income Certificate', 'Caste Certificate', 'Trade License'].map((svc, i) => {
                  const count = applications.filter(a => a.applicationType === svc).length;
                  const pct = applications.length > 0 ? Math.round((count / applications.length) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-navy font-semibold">
                        <span>{svc}</span>
                        <span>{count} applications ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-royal h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Review Queue / Assigned / In Progress / Completed */}
        {['queue', 'assigned', 'in-progress', 'action-required', 'completed'].includes(activeTab) && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-surface-card p-4 rounded border border-surface-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by reference or applicant name..."
                  className="w-full pl-9 pr-3 py-2 border border-surface-border rounded text-xs text-navy placeholder-slate-400 focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </form>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-secondary font-medium">Service:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1.5 border border-surface-border rounded text-navy text-xs bg-white focus:outline-none focus:border-royal"
                  >
                    <option value="All">All Services</option>
                    <option value="Scholarship Assistance">Scholarship Assistance</option>
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Caste Certificate">Caste Certificate</option>
                    <option value="Domicile Certificate">Domicile Certificate</option>
                    <option value="Trade License">Trade License</option>
                    <option value="Senior Citizen Pension Scheme">Senior Citizen Pension</option>
                    <option value="Disability Welfare Assistance">Disability Welfare</option>
                    <option value="Kisan Agriculture Land Record Support">Kisan Support</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-ink-secondary font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-surface-border rounded text-navy text-xs bg-white focus:outline-none focus:border-royal"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Submitted">Submitted (Pending Review)</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Action Required">Action Required</option>
                    <option value="Re-upload Requested">Re-upload Requested</option>
                    <option value="Verified">Verified</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 text-center text-ink-secondary text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-royal" />
                  Loading queue records...
                </div>
              ) : displayedApps.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-3">
                  <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-semibold text-navy">No applications in this view</div>
                  <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                    Try adjusting your filter settings or search query.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap">Reference No.</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Service Name</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Applicant Name</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Submission Date</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Assigned Officer</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                        <th className="px-4 py-3.5 text-right sticky right-0 bg-surface-bg font-semibold z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[210px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {displayedApps.map((app) => (
                        <tr key={app._id || app.id} className="group hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-navy whitespace-nowrap">
                            {app.referenceNumber}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-navy">
                            {app.applicationType}
                          </td>
                          <td className="px-4 py-3.5 text-navy whitespace-nowrap font-semibold">
                            {app.applicantName || app.personalDetails?.applicantName || 'Citizen Applicant'}
                          </td>
                          <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                            {app.submissionDate
                              ? new Date(app.submissionDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'Draft'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {app.assignedReviewerName ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy">
                                <UserCheck className="w-3 h-3 text-royal" />
                                <span>{app.assignedReviewerName}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <StatusBadge status={app.status === 'Re-upload Requested' ? 'Action Required' : app.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#F8FAFC] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[210px]">
                            <div className="flex items-center justify-end gap-2">
                              {/* If unassigned, allow Claiming */}
                              {!app.assignedReviewerId && app.status !== 'Draft' && (
                                <button
                                  type="button"
                                  disabled={claimingId === (app._id || app.id)}
                                  onClick={() => handleClaim(app._id || app.id)}
                                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold hover:bg-[#2558C4] text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#93B4FF] disabled:opacity-50 shrink-0 cursor-pointer select-none"
                                  title="Claim this submission to your assigned review desk"
                                >
                                  {claimingId === (app._id || app.id) ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                                  ) : (
                                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  <span>{claimingId === (app._id || app.id) ? 'Claiming...' : 'Claim'}</span>
                                </button>
                              )}

                              <Link
                                to={`/reviewer/workspace/${app._id || app.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#17365D] hover:bg-[#234B7D] text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#93B4FF] shrink-0"
                                title="Open application review workspace"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                <span>Open Workspace</span>
                              </Link>
                            </div>
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

        {/* Tab Content: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-navy">Review Desk Notifications</h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Queue updates, re-upload alerts, and supervisory messages.
                </p>
              </div>

              {notifications.some(n => !n.read) && (
                <button
                  type="button"
                  onClick={async () => {
                    await api.markAllNotificationsRead();
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }}
                  className="px-3.5 py-1.5 rounded text-xs font-semibold bg-white border border-surface-border text-navy hover:bg-surface-bg"
                >
                  Mark All Read
                </button>
              )}
            </div>

            <div className="bg-surface-card rounded border border-surface-border shadow-sm divide-y divide-surface-border">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-xs text-ink-secondary">
                  No notifications recorded.
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n._id || n.id} className={`p-4 flex items-start gap-3 ${!n.read ? 'bg-royal-light/40' : ''}`}>
                    <div className="mt-1">
                      <Bell className="w-4 h-4 text-royal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-navy text-xs">{n.title}</span>
                        <span className="text-[10px] text-ink-secondary whitespace-nowrap">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary mt-1">{n.message}</p>
                      {n.link && (
                        <Link
                          to={n.link}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-royal hover:underline mt-2"
                        >
                          <span>Open Review Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Officer Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
                Officer Account Settings
              </span>
              <h2 className="text-2xl font-bold text-navy">Verification Officer Profile</h2>
              <p className="text-xs text-ink-secondary mt-1">
                Maintain credentials for audit logs and digital review stamping.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-4 rounded bg-status-success-bg border border-status-success/30 text-status-success text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-4 rounded bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider border-b border-surface-border pb-2">
                  Officer Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Officer Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-surface-border rounded text-xs text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-surface-border rounded text-xs text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Official Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-surface-border rounded text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Designation</label>
                    <input
                      type="text"
                      value="Document Verification Officer"
                      disabled
                      className="w-full px-3 py-2 border border-surface-border rounded text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-surface-border">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider border-b border-surface-border pb-2">
                  Update Password
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required only if changing password"
                      className="w-full px-3 py-2 border border-surface-border rounded text-xs text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-navy mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2 border border-surface-border rounded text-xs text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 border border-surface-border rounded text-xs text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                  className="px-6 py-2.5 rounded font-bold text-xs hover:bg-[#2558C4] text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer select-none"
                >
                  {profileLoading ? 'Saving Changes...' : 'Save Officer Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReviewerDashboardPage;
