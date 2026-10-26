import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  FilePlus, 
  FileText, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle,
  LayoutDashboard,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  CornerUpLeft,
  Bell,
  User,
  HelpCircle,
  LogOut,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  UploadCloud,
  Check,
  Phone,
  Mail,
  Lock,
  BookOpen,
  Filter
} from 'lucide-react';

export function ApplicantDashboardPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Route-based active navigation tab synced with URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['dashboard', 'apply', 'applications', 'track', 'action-required', 'notifications', 'profile', 'help'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl)
    ? tabFromUrl
    : (tabFromUrl === 'catalog' ? 'apply' : 'dashboard');

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

  // Application data
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Tracking
  const [deleteModalApp, setDeleteModalApp] = useState(null);
  const [withdrawModalApp, setWithdrawModalApp] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingAppId, setTrackingAppId] = useState('');
  const [trackingTimeline, setTrackingTimeline] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Profile Form
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, notifsRes] = await Promise.all([
        api.getApplications(),
        api.getNotifications().catch(() => ({ notifications: [] }))
      ]);
      setApplications(appsRes.applications || []);
      setNotifications(notifsRes.notifications || []);
      setError('');
    } catch (err) {
      setError('Failed to load application records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Counts
  const counts = {
    total: applications.length,
    draft: applications.filter(a => a.status === 'Draft').length,
    underReview: applications.filter(a => ['Under Review', 'Submitted', 'Reviewer Assigned', 'Compliance Review'].includes(a.status)).length,
    actionRequired: applications.filter(a => ['Action Required', 'Re-upload Requested'].includes(a.status)).length,
    approved: applications.filter(a => ['Verified', 'Approved'].includes(a.status)).length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
    withdrawn: applications.filter(a => a.status === 'Withdrawn').length,
  };

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Draft') return app.status === 'Draft';
    if (filterStatus === 'Under Review') return ['Under Review', 'Submitted', 'Reviewer Assigned', 'Compliance Review'].includes(app.status);
    if (filterStatus === 'Action Required') return ['Action Required', 'Re-upload Requested'].includes(app.status);
    if (filterStatus === 'Approved') return ['Verified', 'Approved'].includes(app.status);
    if (filterStatus === 'Rejected') return app.status === 'Rejected';
    if (filterStatus === 'Withdrawn') return app.status === 'Withdrawn';
    return true;
  });

  // Action required apps
  const actionRequiredApps = applications.filter(a => ['Action Required', 'Re-upload Requested'].includes(a.status));

  // Handle draft deletion
  const handleDeleteDraft = async () => {
    if (!deleteModalApp) return;
    try {
      setActionLoading(true);
      await api.deleteApplication(deleteModalApp._id || deleteModalApp.id);
      setDeleteModalApp(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete application draft.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawModalApp) return;
    try {
      setActionLoading(true);
      await api.withdrawApplication(withdrawModalApp._id || withdrawModalApp.id, withdrawReason);
      setWithdrawModalApp(null);
      setWithdrawReason('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to withdraw application.');
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch tracking timeline
  const handleTrackApplication = async (appId) => {
    try {
      setTrackingLoading(true);
      const res = await api.getApplicationTimeline(appId);
      setTrackingTimeline(res.timeline);
      setTrackingAppId(appId);
    } catch (err) {
      alert(err.message || 'Failed to load tracking timeline.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Handle Profile Update
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
      setProfileSuccess('Profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Service Catalog
  const availableServices = [
    {
      id: 'scholarship',
      name: 'Scholarship Assistance',
      category: 'Education & Student Welfare',
      desc: 'Financial support and fee waiver for eligible students across recognized institutions.',
      docs: ['Identity Document', 'Income Certificate', 'Academic Marksheet', 'Fee Receipt']
    },
    {
      id: 'income-cert',
      name: 'Income Certificate',
      category: 'Revenue & District Administration',
      desc: 'Official proof of household annual income issued for governmental reservation and subsidies.',
      docs: ['Identity Document', 'Salary Slip / IT Return', 'Affidavit', 'Ration Card']
    },
    {
      id: 'caste-cert',
      name: 'Caste Certificate',
      category: 'Social Justice & Empowerment',
      desc: 'Statutory caste verification credential for educational admissions and welfare benefits.',
      docs: ['Identity Document', 'Father/Relative Caste Proof', 'Domicile Record']
    },
    {
      id: 'domicile-cert',
      name: 'Domicile Certificate',
      category: 'Citizenship & Residence',
      desc: 'Official state residence certificate confirming permanent regional residency status.',
      docs: ['Identity Document', 'Electricity / Water Bill', 'School Leaving Certificate']
    },
    {
      id: 'trade-license',
      name: 'Trade License',
      category: 'Commerce & Municipal Services',
      desc: 'Municipal permission certificate to legally operate commercial establishment or enterprise.',
      docs: ['Identity Document', 'Commercial Property Tax Receipt', 'Rent Agreement', 'Fire NOC']
    },
    {
      id: 'pension-scheme',
      name: 'Senior Citizen Pension Scheme',
      category: 'Social Security',
      desc: 'Monthly state pension assistance for senior citizens aged 60 and above.',
      docs: ['Identity Document', 'Age Proof / Birth Certificate', 'Bank Passbook', 'Income Certificate']
    },
    {
      id: 'disability-welfare',
      name: 'Disability Welfare Assistance',
      category: 'Social Justice & Healthcare',
      desc: 'Monthly stipend, equipment assistance, and benefits for persons with disabilities.',
      docs: ['Identity Document', 'Medical Board Disability Certificate', 'Bank Passbook']
    },
    {
      id: 'kisan-support',
      name: 'Kisan Agriculture Land Record Support',
      category: 'Agriculture & Farmer Welfare',
      desc: 'Direct subsidy authentication, input subsidies, and Khasra/Khatauni verification.',
      docs: ['Identity Document', 'Land Ownership Record (Khasra/Khatauni)', 'Bank Passbook']
    }
  ];

  const getStatusExplanation = (app) => {
    switch (app.status) {
      case 'Re-upload Requested':
      case 'Action Required':
        return app.requestedReuploadDocs && app.requestedReuploadDocs.length > 0
          ? `Please upload: ${app.requestedReuploadDocs.join(', ')}.`
          : 'Please upload the requested replacement documents.';
      case 'Under Review':
        return 'Application is with the verification officer for review.';
      case 'Compliance Review':
        return 'Selected for regulatory Directorate compliance inspection.';
      case 'Verified':
      case 'Approved':
        return 'Application verified and approved by the reviewer.';
      case 'Rejected':
        return app.reviewDecision?.reason ? `Reason: ${app.reviewDecision.reason}` : 'Application was not approved.';
      case 'Withdrawn':
        return 'Application has been withdrawn upon your request.';
      case 'Draft':
      default:
        return 'Draft incomplete. Please complete and submit.';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-bg flex">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col shrink-0">
        {/* User Card */}
        <div className="p-4 border-b border-surface-border bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-royal text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-navy text-xs truncate">{user?.name || 'Citizen Applicant'}</div>
              <div className="text-[10px] text-royal font-semibold bg-royal-light border border-royal/30 px-1.5 py-0.2 rounded inline-block mt-0.5">
                Citizen Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 text-xs flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={getNavItemClass(activeTab === 'dashboard')}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={getNavIconClass(activeTab === 'dashboard')} />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={getNavItemClass(activeTab === 'apply')}
          >
            <div className="flex items-center gap-2.5">
              <FilePlus className={getNavIconClass(activeTab === 'apply')} />
              <span>Apply for a Service</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={getNavItemClass(activeTab === 'applications')}
          >
            <div className="flex items-center gap-2.5">
              <FileText className={getNavIconClass(activeTab === 'applications')} />
              <span>My Applications</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
              activeTab === 'applications' ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#334155]'
            }`}>
              {counts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={getNavItemClass(activeTab === 'track')}
          >
            <div className="flex items-center gap-2.5">
              <Clock className={getNavIconClass(activeTab === 'track')} />
              <span>Track Application</span>
            </div>
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
            {counts.actionRequired > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
                activeTab === 'action-required' ? 'bg-white text-status-warning' : 'bg-status-warning text-white'
              }`}>
                {counts.actionRequired}
              </span>
            )}
          </button>

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
                activeTab === 'notifications' ? 'bg-white text-status-error' : 'bg-status-error text-white'
              }`}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          <div className="pt-3 pb-1 border-t border-surface-border my-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary px-3">
              Account &amp; Support
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={getNavItemClass(activeTab === 'profile')}
          >
            <div className="flex items-center gap-2.5">
              <User className={getNavIconClass(activeTab === 'profile')} />
              <span>Profile &amp; Security</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={getNavItemClass(activeTab === 'help')}
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className={getNavIconClass(activeTab === 'help')} />
              <span>Help &amp; Support</span>
            </div>
          </button>
        </nav>

        {/* Logout Bottom */}
        <div className="p-3 border-t border-surface-border">
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold text-status-error hover:bg-status-error-bg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
                  Citizen Self-Service Portal
                </span>
                <h1 className="text-2xl font-bold text-navy">
                  Welcome back, {user?.name || 'Applicant'}
                </h1>
                <p className="text-xs text-ink-secondary mt-1">
                  National e-Governance Application Submission, Document Tracking &amp; Compliance Dashboard
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs hover:bg-[#2558C4] text-white transition-all shadow-sm cursor-pointer select-none"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Apply for Service</span>
                </button>
                <button
                  type="button"
                  onClick={loadData}
                  className="p-2.5 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div 
                onClick={() => { setFilterStatus('All'); setActiveTab('applications'); }}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-navy cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-ink-secondary">Total Submissions</div>
                <div className="text-2xl font-extrabold text-navy mt-1">{counts.total}</div>
                <div className="text-[10px] text-ink-secondary mt-1">All applications</div>
              </div>

              <div 
                onClick={() => { setFilterStatus('Draft'); setActiveTab('applications'); }}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-slate-500 cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-ink-secondary">Drafts Incomplete</div>
                <div className="text-2xl font-extrabold text-slate-700 mt-1">{counts.draft}</div>
                <div className="text-[10px] text-ink-secondary mt-1">Ready to finish</div>
              </div>

              <div 
                onClick={() => { setFilterStatus('Under Review'); setActiveTab('applications'); }}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-blue-500 cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-ink-secondary">Under Review</div>
                <div className="text-2xl font-extrabold text-blue-700 mt-1">{counts.underReview}</div>
                <div className="text-[10px] text-ink-secondary mt-1">With review officers</div>
              </div>

              <div 
                onClick={() => setActiveTab('action-required')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-amber-500 cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Action Required</span>
                </div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">{counts.actionRequired}</div>
                <div className="text-[10px] text-amber-700 font-semibold mt-1">Upload replacements</div>
              </div>

              <div 
                onClick={() => { setFilterStatus('Approved'); setActiveTab('applications'); }}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-emerald-500 cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-emerald-700">Verified &amp; Approved</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">{counts.approved}</div>
                <div className="text-[10px] text-emerald-700 mt-1">Successfully cleared</div>
              </div>

              <div 
                onClick={() => { setFilterStatus('Rejected'); setActiveTab('applications'); }}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-rose-500 cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-ink-secondary">Rejected / Withdrawn</div>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">{counts.rejected + counts.withdrawn}</div>
                <div className="text-[10px] text-ink-secondary mt-1">Discontinued cases</div>
              </div>
            </div>

            {/* Urgent Action Banner if Any Action Required */}
            {counts.actionRequired > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-sm flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 text-xs">
                      {counts.actionRequired} Application(s) require replacement documents
                    </h3>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      The verification officer has flagged document issues. Please upload valid certificates promptly to avoid cancellation.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('action-required')}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0"
                >
                  View Required Documents
                </button>
              </div>
            )}

            {/* Recent Applications Table */}
            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-royal" />
                  <h2 className="font-bold text-navy text-xs uppercase tracking-wider">
                    Recent Applications ({applications.slice(0, 5).length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('applications')}
                  className="text-xs font-semibold text-royal hover:underline flex items-center gap-1"
                >
                  <span>View All Applications</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-ink-secondary text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-royal" />
                  Loading your applications...
                </div>
              ) : applications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-semibold text-navy">No applications submitted yet</div>
                  <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                    You have not started or submitted any service applications. Explore available state schemes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('apply')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-royal text-white hover:bg-royal-hover"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Apply for a Service</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Reference No.</th>
                        <th className="px-4 py-3 whitespace-nowrap">Service Name</th>
                        <th className="px-4 py-3 whitespace-nowrap">Submission Date</th>
                        <th className="px-4 py-3 whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 whitespace-nowrap">Status Note</th>
                        <th className="px-4 py-3 text-right sticky right-0 bg-surface-bg font-semibold z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {applications.slice(0, 5).map((app) => (
                        <tr key={app._id || app.id} className="group hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-navy whitespace-nowrap">
                            {app.referenceNumber}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-navy">
                            {app.applicationType}
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
                            <StatusBadge status={app.status === 'Re-upload Requested' ? 'Action Required' : app.status} />
                          </td>
                          <td className="px-4 py-3.5 max-w-xs text-ink-secondary truncate">
                            {getStatusExplanation(app)}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#F8FAFC] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">
                            <div className="flex items-center justify-end gap-1.5">
                              {app.status === 'Draft' ? (
                                <Link
                                  to={`/applications/${app._id || app.id}`}
                                  className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-[#17365D] text-white hover:bg-[#234B7D] transition-colors shadow-sm"
                                >
                                  Continue Draft
                                </Link>
                              ) : (
                                <Link
                                  to={`/applications/${app._id || app.id}`}
                                  className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-white border border-surface-border text-navy hover:border-[#2F6FED] hover:text-[#2F6FED] transition-colors"
                                >
                                  View Details
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => { setActiveTab('track'); handleTrackApplication(app._id || app.id); }}
                                className="p-1 rounded text-ink-secondary hover:text-navy hover:bg-surface-bg"
                                title="Track Status"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
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

        {/* ================= TAB 2: APPLY FOR A SERVICE ================= */}
        {activeTab === 'apply' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
                Citizen Service Catalog
              </span>
              <h1 className="text-2xl font-bold text-navy">
                Available Government Schemes &amp; Certifications
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                Select a service to begin your digital application. Suvidha will validate your uploaded certificates and ensure regulatory adherence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableServices.map((svc) => (
                <div 
                  key={svc.id}
                  className="bg-surface-card rounded border border-surface-border p-5 shadow-sm flex flex-col justify-between hover:border-royal transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider bg-surface-muted px-2 py-0.5 rounded">
                        {svc.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-navy text-sm">{svc.name}</h3>
                    <p className="text-xs text-ink-secondary line-clamp-2">
                      {svc.desc}
                    </p>

                    <div className="pt-2 border-t border-surface-border">
                      <div className="text-[11px] font-semibold text-navy mb-1">Required Documents:</div>
                      <div className="flex flex-wrap gap-1">
                        {svc.docs.map((d, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-surface-border">
                    <Link
                      to={`/applicant/new-application?service=${encodeURIComponent(svc.name)}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-royal hover:bg-royal-hover text-white transition-colors shadow-sm"
                    >
                      <span>Start Application</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: MY APPLICATIONS ================= */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-navy">My Applications</h1>
                <p className="text-xs text-ink-secondary mt-1">
                  Manage all drafts, active reviews, and completed certifications.
                </p>
              </div>

              <Link
                to="/applicant/new-application"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs bg-royal hover:bg-royal-hover text-white transition-colors shadow-sm shrink-0"
              >
                <FilePlus className="w-4 h-4" />
                <span>New Application</span>
              </Link>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-surface-card p-4 rounded border border-surface-border shadow-sm space-y-3">
              <div className="flex flex-wrap items-center gap-2 border-b border-surface-border pb-3 text-xs">
                {['All', 'Draft', 'Under Review', 'Action Required', 'Approved', 'Rejected', 'Withdrawn'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded font-semibold transition-colors ${
                      filterStatus === st
                        ? 'bg-navy text-white'
                        : 'text-ink-secondary hover:bg-surface-hover hover:text-navy'
                    }`}
                  >
                    <span>{st}</span>
                    <span className="ml-1.5 text-[10px] opacity-80">
                      ({st === 'All' ? counts.total : st === 'Draft' ? counts.draft : st === 'Under Review' ? counts.underReview : st === 'Action Required' ? counts.actionRequired : st === 'Approved' ? counts.approved : st === 'Rejected' ? counts.rejected : counts.withdrawn})
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by reference number or service..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border rounded focus:outline-none focus:border-royal text-navy"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                </div>

                <button
                  type="button"
                  onClick={loadData}
                  className="p-1.5 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 text-center text-ink-secondary text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-royal" />
                  Loading applications...
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  No applications found matching your criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap">Reference No.</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Service Name</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Submission Date</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Guidance / Next Step</th>
                        <th className="px-4 py-3.5 text-right sticky right-0 bg-surface-bg font-semibold z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[160px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {filteredApps.map((app) => (
                        <tr key={app._id || app.id} className="group hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-navy whitespace-nowrap">
                            {app.referenceNumber}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-navy">
                            {app.applicationType}
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
                            <StatusBadge status={app.status === 'Re-upload Requested' ? 'Action Required' : app.status} />
                          </td>
                          <td className="px-4 py-3.5 max-w-sm text-ink-secondary">
                            <span className="block font-medium text-navy">
                              {getStatusExplanation(app)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#F8FAFC] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[160px]">
                            <div className="flex items-center justify-end gap-1.5">
                              {app.status === 'Draft' ? (
                                <>
                                  <Link
                                    to={`/applications/${app._id || app.id}`}
                                    className="px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[#17365D] text-white hover:bg-[#234B7D] transition-colors shadow-sm"
                                  >
                                    Continue
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModalApp(app)}
                                    className="p-1.5 rounded-[6px] text-status-error hover:bg-status-error-bg transition-colors"
                                    title="Delete Draft"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Link
                                    to={`/applications/${app._id || app.id}`}
                                    className="px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-white border border-surface-border text-navy hover:border-[#2F6FED] hover:text-[#2F6FED] transition-colors"
                                  >
                                    View
                                  </Link>
                                  {['Submitted', 'Under Review', 'Action Required', 'Reviewer Assigned'].includes(app.status) && (
                                    <button
                                      type="button"
                                      onClick={() => setWithdrawModalApp(app)}
                                      className="px-2 py-1 rounded-[6px] text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                                      title="Withdraw Application"
                                    >
                                      Withdraw
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => { setActiveTab('track'); handleTrackApplication(app._id || app.id); }}
                                    className="p-1.5 rounded-[6px] text-ink-secondary hover:text-navy hover:bg-surface-bg transition-colors"
                                    title="Track Lifecycle"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
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

        {/* ================= TAB 4: TRACK APPLICATION ================= */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
                Real-Time Lifecycle Tracker
              </span>
              <h1 className="text-2xl font-bold text-navy">
                Track Application Milestone Timeline
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                Follow your application through submission, automated document extraction, officer review, and final approval.
              </p>

              {/* Selector */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={trackingAppId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setTrackingAppId(id);
                    if (id) handleTrackApplication(id);
                  }}
                  className="w-full sm:w-96 px-3 py-2 text-xs border rounded bg-white text-navy font-semibold focus:outline-none focus:border-royal"
                >
                  <option value="">-- Select an Application to Track --</option>
                  {applications.map(app => (
                    <option key={app._id || app.id} value={app._id || app.id}>
                      {app.referenceNumber} - {app.applicationType} ({app.status})
                    </option>
                  ))}
                </select>

                {trackingAppId && (
                  <button
                    type="button"
                    onClick={() => handleTrackApplication(trackingAppId)}
                    className="px-4 py-2 rounded text-xs font-semibold bg-navy text-white hover:bg-navy-light flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${trackingLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Milestones</span>
                  </button>
                )}
              </div>
            </div>

            {/* Timeline Stepper View */}
            {trackingTimeline && (
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-surface-border pb-4">
                  <div>
                    <span className="text-xs font-bold text-navy uppercase tracking-wider">
                      Milestone Progression
                    </span>
                    <div className="text-xs text-ink-secondary mt-0.5">
                      Updated in real time from official government verification logs.
                    </div>
                  </div>
                </div>

                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {trackingTimeline.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      {/* Indicator circle */}
                      <div className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.completed
                          ? 'bg-status-success text-white shadow-sm ring-4 ring-status-success/20'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {step.completed ? <Check className="w-3 h-3" /> : idx + 1}
                      </div>

                      <div className="flex-1 bg-surface-bg p-4 rounded border border-surface-border">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-navy text-xs">{step.title}</h4>
                          {step.timestamp && (
                            <span className="text-[10px] text-ink-secondary whitespace-nowrap">
                              {new Date(step.timestamp).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-secondary mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: ACTION REQUIRED ================= */}
        {activeTab === 'action-required' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                Citizen Correction Requests
              </span>
              <h1 className="text-2xl font-bold text-navy">
                Applications Requiring Action ({actionRequiredApps.length})
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                The verification officer has reviewed your submissions and flagged incomplete or unreadable documents. Please upload the requested replacement certificates.
              </p>
            </div>

            {actionRequiredApps.length === 0 ? (
              <div className="bg-surface-card p-12 rounded border border-surface-border text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-status-success mx-auto" />
                <h3 className="font-bold text-navy text-sm">All Set! No Pending Actions Required</h3>
                <p className="text-xs text-ink-secondary max-w-md mx-auto">
                  None of your active applications currently require corrections or re-uploads.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionRequiredApps.map(app => (
                  <div key={app._id || app.id} className="bg-surface-card p-6 rounded border border-amber-300 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-navy text-sm">{app.referenceNumber}</span>
                          <span className="text-xs text-ink-secondary">•</span>
                          <span className="font-semibold text-navy text-xs">{app.applicationType}</span>
                        </div>
                        <div className="text-[11px] text-ink-secondary mt-0.5">
                          Submitted on {app.submissionDate ? new Date(app.submissionDate).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </div>
                      <StatusBadge status="Action Required" />
                    </div>

                    <div className="bg-amber-50 p-4 rounded border border-amber-200">
                      <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Verification Officer Request:</span>
                      </div>
                      <p className="text-xs text-amber-900 mt-1">
                        {app.reviewDecision?.reason || 'Document re-upload requested due to illegibility or certificate expiry.'}
                      </p>

                      {app.requestedReuploadDocs && app.requestedReuploadDocs.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[11px] font-semibold text-amber-800">Requested Replacement Certificates:</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {app.requestedReuploadDocs.map((docName, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-amber-900 font-bold text-xs border border-amber-300">
                                <UploadCloud className="w-3 h-3 text-amber-600" />
                                <span>{docName}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Link
                        to={`/applications/${app._id || app.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs bg-royal hover:bg-royal-hover text-white shadow-sm"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Requested Documents</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: NOTIFICATIONS ================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-navy">Notifications</h1>
                <p className="text-xs text-ink-secondary mt-1">
                  Updates on application status, reviewer findings, and regulatory decisions.
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
                  No notifications currently recorded.
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n._id || n.id} className={`p-4 flex items-start gap-3 ${!n.read ? 'bg-amber-50/40' : ''}`}>
                    <div className="mt-1">
                      {n.type === 'Warning' || n.type === 'Action Required' ? (
                        <AlertTriangle className="w-4 h-4 text-status-warning" />
                      ) : (
                        <Bell className="w-4 h-4 text-navy" />
                      )}
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
                          <span>Open Application Details</span>
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

        {/* ================= TAB 7: PROFILE & SECURITY ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
                User Account Settings
              </span>
              <h1 className="text-2xl font-bold text-navy">Profile &amp; Security</h1>
              <p className="text-xs text-ink-secondary mt-1">
                Maintain your verified citizen details and access credentials.
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
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded text-xs text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Contact Phone Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border rounded text-xs text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Registered Email (Read-Only)</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border rounded text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Assigned Role</label>
                    <input
                      type="text"
                      value="Citizen Applicant"
                      disabled
                      className="w-full px-3 py-2 border rounded text-xs bg-slate-100 text-slate-500 cursor-not-allowed capitalize"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-surface-border">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider border-b border-surface-border pb-2">
                  Change Password (Optional)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required only if changing password"
                      className="w-full px-3 py-2 border rounded text-xs text-navy focus:outline-none focus:border-royal"
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
                        className="w-full px-3 py-2 border rounded text-xs text-navy focus:outline-none focus:border-royal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 border rounded text-xs text-navy focus:outline-none focus:border-royal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{ backgroundColor: profileLoading ? '#94A3B8' : '#2F6FED', color: '#FFFFFF' }}
                  className="px-6 py-2.5 rounded font-bold text-xs hover:bg-[#2558C4] text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none"
                >
                  {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 8: HELP & SUPPORT ================= */}
        {activeTab === 'help' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-royal block mb-1">
                Citizen Assistance Desk
              </span>
              <h1 className="text-2xl font-bold text-navy">Help &amp; Support</h1>
              <p className="text-xs text-ink-secondary mt-1">
                Guidance on document submission standards, acceptable file formats, and grievance redressal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-card p-4 rounded border border-surface-border text-center space-y-2">
                <Phone className="w-6 h-6 text-royal mx-auto" />
                <div className="font-bold text-navy text-xs">National Toll-Free Helpline</div>
                <div className="text-sm font-extrabold text-navy">1800-11-SUVIDHA</div>
                <div className="text-[10px] text-ink-secondary">Mon-Sat 09:00 AM - 06:00 PM IST</div>
              </div>

              <div className="bg-surface-card p-4 rounded border border-surface-border text-center space-y-2">
                <Mail className="w-6 h-6 text-royal mx-auto" />
                <div className="font-bold text-navy text-xs">Citizen Grievance Email</div>
                <div className="text-xs font-bold text-navy">support@suvidha.gov.in</div>
                <div className="text-[10px] text-ink-secondary">Official response within 24 hours</div>
              </div>

              <div className="bg-surface-card p-4 rounded border border-surface-border text-center space-y-2">
                <BookOpen className="w-6 h-6 text-royal mx-auto" />
                <div className="font-bold text-navy text-xs">e-Governance Policy</div>
                <div className="text-xs font-bold text-navy">Digital India Standards</div>
                <div className="text-[10px] text-ink-secondary">Regulatory Compliance Guidelines</div>
              </div>
            </div>

            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
              <h3 className="font-bold text-navy text-sm">Frequently Asked Questions</h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-surface-bg rounded border border-surface-border">
                  <div className="font-bold text-navy">What file formats are accepted for supporting certificates?</div>
                  <p className="text-ink-secondary mt-1">
                    The portal accepts PDF and JPEG/JPG formats. Ensure that documents are crisp, high-resolution scans without blurriness or obscured seals.
                  </p>
                </div>

                <div className="p-3 bg-surface-bg rounded border border-surface-border">
                  <div className="font-bold text-navy">What happens if a required document is expired?</div>
                  <p className="text-ink-secondary mt-1">
                    The system's automated compliance engine checks expiration dates for validity-sensitive certificates (such as Income Certificates or Trade Licenses). If expired, the application will be marked as "Action Required", and you will be asked to upload an updated certificate.
                  </p>
                </div>

                <div className="p-3 bg-surface-bg rounded border border-surface-border">
                  <div className="font-bold text-navy">Can I withdraw a submitted application?</div>
                  <p className="text-ink-secondary mt-1">
                    Yes. Under citizen rights, you can formally withdraw an application while it is still Under Review or in Action Required status by clicking the "Withdraw" action and providing a reason.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Draft Modal */}
      {deleteModalApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card max-w-md w-full rounded-lg shadow-xl border border-surface-border p-6 space-y-4">
            <div className="flex items-center gap-3 text-status-error">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-bold text-navy text-base">Permanently Delete Draft?</h3>
            </div>
            <p className="text-xs text-ink-secondary">
              Are you sure you want to delete the draft application <strong className="text-navy">{deleteModalApp.referenceNumber}</strong>? This action will permanently remove all associated uploaded draft files and cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalApp(null)}
                className="px-4 py-2 rounded text-xs font-semibold border border-surface-border hover:bg-surface-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteDraft}
                className="px-4 py-2 rounded text-xs font-bold bg-status-error text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Application Modal */}
      {withdrawModalApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card max-w-md w-full rounded-lg shadow-xl border border-surface-border p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <CornerUpLeft className="w-6 h-6" />
              <h3 className="font-bold text-navy text-base">Withdraw Application</h3>
            </div>
            <p className="text-xs text-ink-secondary">
              You are requesting to withdraw application <strong className="text-navy">{withdrawModalApp.referenceNumber}</strong>. Once withdrawn, verification processing will cease.
            </p>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Reason for Withdrawal (Required)</label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="e.g. Applied by mistake, details changed, or wish to re-apply under a different scheme."
                rows={3}
                className="w-full p-2.5 text-xs border rounded focus:outline-none focus:border-royal text-navy"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setWithdrawModalApp(null); setWithdrawReason(''); }}
                className="px-4 py-2 rounded text-xs font-semibold border border-surface-border hover:bg-surface-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !withdrawReason.trim()}
                onClick={handleWithdraw}
                className="px-4 py-2 rounded text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicantDashboardPage;
