import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Sliders, 
  Activity, 
  History, 
  Settings, 
  Search, 
  RefreshCw, 
  UserPlus, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Server, 
  HardDrive, 
  Cpu, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  ExternalLink
} from 'lucide-react';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Route-based active navigation tab synced with URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['overview', 'users', 'assignments', 'services', 'audit', 'health'];
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

  // Overview Data
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // User Management
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'reviewer',
    organization: '',
    phone: ''
  });
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Reviewer Assignments
  const [assignmentsData, setAssignmentsData] = useState(null);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedReviewerMap, setSelectedReviewerMap] = useState({});
  const [assigningId, setAssigningId] = useState(null);

  // Service Configuration
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // System Health
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditRoleFilter, setAuditRoleFilter] = useState('All');
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  // Shared Action Feedback
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // 1. Data Loaders
  const loadOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await api.getAdminOverview();
      setOverview(res);
    } catch (err) {
      console.error(err);
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.getAdminUsers({ role: userRoleFilter, search: userSearch });
      setUsersList(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const res = await api.getReviewerAssignments();
      setAssignmentsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      const res = await api.getAdminServices();
      setServices(res.services || []);
    } catch (err) {
      console.error(err);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      setHealthLoading(true);
      const res = await api.getSystemHealth();
      setHealthData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.getAuditEvents({
        actorRole: auditRoleFilter,
        action: auditActionFilter,
        search: auditSearch
      });
      setAuditLogs(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'assignments') loadAssignments();
    if (activeTab === 'services') loadServices();
    if (activeTab === 'health') loadHealth();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab, userRoleFilter, auditRoleFilter, auditActionFilter]);

  const showFeedback = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionMessage('');
    } else {
      setActionMessage(msg);
      setActionError('');
    }
    setTimeout(() => {
      setActionMessage('');
      setActionError('');
    }, 4000);
  };

  // Create User Handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminUser(newUserData);
      setShowCreateUserModal(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        role: 'reviewer',
        organization: '',
        phone: ''
      });
      showFeedback('User account created successfully.');
      loadUsers();
      loadOverview();
    } catch (err) {
      showFeedback(err.message || 'Failed to create user.', true);
    }
  };

  // Toggle User Active
  const handleToggleUserActive = async (targetUser) => {
    try {
      await api.updateAdminUser(targetUser.id, { isActive: !targetUser.isActive });
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, isActive: !u.isActive } : u));
      showFeedback(`User ${targetUser.name} active state changed.`);
    } catch (err) {
      showFeedback(err.message || 'Failed to update user status.', true);
    }
  };

  // Reset User Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordVal) return;
    try {
      await api.resetAdminUserPassword(resetPasswordUser.id, newPasswordVal);
      setResetPasswordUser(null);
      setNewPasswordVal('');
      showFeedback(`Password for ${resetPasswordUser.name} has been reset.`);
    } catch (err) {
      showFeedback(err.message || 'Failed to reset password.', true);
    }
  };

  // Assign Reviewer Handler
  const handleAssignReviewer = async (appId) => {
    const reviewerId = selectedReviewerMap[appId];
    if (!reviewerId) {
      alert('Please select a reviewer from the dropdown.');
      return;
    }
    try {
      setAssigningId(appId);
      await api.assignReviewer(appId, reviewerId);
      showFeedback('Reviewer assigned successfully.');
      await loadAssignments();
      await loadOverview();
    } catch (err) {
      showFeedback(err.message || 'Failed to assign reviewer.', true);
    } finally {
      setAssigningId(null);
    }
  };

  // Update Service Config
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.updateAdminService(editingService.id, {
        description: editingService.description,
        requiredDocuments: editingService.requiredDocuments,
        maxFileSizeMB: Number(editingService.maxFileSizeMB)
      });
      setEditingService(null);
      showFeedback(`Service ${editingService.serviceName} updated successfully.`);
      loadServices();
    } catch (err) {
      showFeedback(err.message || 'Failed to update service.', true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-bg flex">
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col shrink-0">
        <div className="p-4 border-b border-surface-border bg-surface-muted">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ShieldCheck className="w-5 h-5 text-royal" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-navy text-xs truncate">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-royal font-semibold bg-royal-light px-1.5 py-0.5 rounded inline-block mt-0.5 border border-royal/20">
                System Administration
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
              <Activity className={getNavIconClass(activeTab === 'overview')} />
              <span>System Overview</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={getNavItemClass(activeTab === 'users')}
          >
            <div className="flex items-center gap-2.5">
              <Users className={getNavIconClass(activeTab === 'users')} />
              <span>User Management</span>
            </div>
            {overview && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#334155]'
              }`}>
                {overview.users.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={getNavItemClass(activeTab === 'assignments')}
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className={getNavIconClass(activeTab === 'assignments')} />
              <span>Reviewer Assignment</span>
            </div>
            {overview && overview.applications.unassigned > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] transition-colors ${
                activeTab === 'assignments' ? 'bg-white text-royal' : 'bg-royal text-white'
              }`}>
                {overview.applications.unassigned}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={getNavItemClass(activeTab === 'services')}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className={getNavIconClass(activeTab === 'services')} />
              <span>Service Configuration</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={getNavItemClass(activeTab === 'audit')}
          >
            <div className="flex items-center gap-2.5">
              <History className={getNavIconClass(activeTab === 'audit')} />
              <span>Audit Trail &amp; Logs</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={getNavItemClass(activeTab === 'health')}
          >
            <div className="flex items-center gap-2.5">
              <Server className={getNavIconClass(activeTab === 'health')} />
              <span>System Health</span>
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
              Central Administration &amp; Governance Center
            </span>
            <h1 className="text-2xl font-bold text-navy">
              {activeTab === 'overview' && 'System Health &amp; Administrative Overview'}
              {activeTab === 'users' && 'User Accounts &amp; Access Control'}
              {activeTab === 'assignments' && 'Caseload &amp; Reviewer Assignment Desk'}
              {activeTab === 'services' && 'e-Governance Services &amp; Document Rules'}
              {activeTab === 'audit' && 'Security &amp; Transaction Audit Trail'}
              {activeTab === 'health' && 'Server Infrastructure &amp; Engine Status'}
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Logged in as Administrator <strong className="text-navy">{user?.name}</strong> • Full Authority Scope
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadOverview();
                if (activeTab === 'users') loadUsers();
                if (activeTab === 'assignments') loadAssignments();
                if (activeTab === 'services') loadServices();
                if (activeTab === 'health') loadHealth();
                if (activeTab === 'audit') loadAuditLogs();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Center</span>
            </button>
          </div>
        </div>

        {/* Global Action Banner */}
        {actionMessage && (
          <div className="p-4 rounded bg-status-success-bg border border-status-success/30 text-status-success text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center gap-2">
            <X className="w-4 h-4" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ================= TAB 1: SYSTEM OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div 
                onClick={() => setActiveTab('users')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-ink-secondary">Total Users</div>
                <div className="text-2xl font-extrabold text-navy mt-1">
                  {overview?.metrics?.totalUsers ?? overview?.users?.total ?? '...'}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">All registered accounts</div>
              </div>

              <div 
                onClick={() => setActiveTab('assignments')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-royal">Unassigned Apps</div>
                <div className="text-2xl font-extrabold text-royal mt-1">
                  {overview?.metrics?.awaitingAssignment ?? overview?.applications?.unassigned ?? '...'}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">Pending allocation</div>
              </div>

              <div 
                onClick={() => navigate('/reviewer/dashboard')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-royal">Under Review</div>
                <div className="text-2xl font-extrabold text-navy mt-1">
                  {overview?.metrics?.underReview ?? overview?.applications?.underReview ?? '...'}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">Active verification</div>
              </div>

              <div 
                onClick={() => navigate('/compliance/dashboard')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-royal">Compliance Audit</div>
                <div className="text-2xl font-extrabold text-navy mt-1">
                  {overview?.metrics?.awaitingCompliance ?? overview?.applications?.awaitingCompliance ?? '...'}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">Directorate queue</div>
              </div>

              <div 
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm transition-colors"
              >
                <div className="text-[11px] font-semibold text-status-success">Total Processed</div>
                <div className="text-2xl font-extrabold text-status-success mt-1">
                  {overview?.metrics?.completed ?? overview?.applications?.completed ?? '...'}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">Verified / Approved</div>
              </div>

              <div 
                onClick={() => setActiveTab('audit')}
                className="bg-surface-card p-4 rounded border border-surface-border shadow-sm hover:border-royal cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-ink-secondary">Recent Audits</div>
                <div className="text-2xl font-extrabold text-navy mt-1">
                  {overview?.recentActivity?.length ?? 8}
                </div>
                <div className="text-[10px] text-ink-secondary mt-1">Security logs</div>
              </div>
            </div>

            {/* Quick Admin Actions & Role Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-royal" />
                  <span>System Administration Shortcuts</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('users'); setShowCreateUserModal(true); }}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-royal" />
                      <span>Create User</span>
                    </div>
                    <div className="text-[11px] text-ink-secondary">Add new officer or citizen</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('assignments')}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-royal" />
                      <span>Assign Applications</span>
                    </div>
                    <div className="text-[11px] text-ink-secondary">Distribute reviewer workload</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-royal" />
                      <span>Configure Services</span>
                    </div>
                    <div className="text-[11px] text-ink-secondary">Edit required documents</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('health')}
                    className="p-3 rounded border border-surface-border hover:bg-surface-hover hover:border-royal/50 text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-navy flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-royal" />
                      <span>System Health</span>
                    </div>
                    <div className="text-[11px] text-ink-secondary">Inspect storage &amp; OCR</div>
                  </button>
                </div>
              </div>

              {/* Role Distribution Card */}
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2">
                  Registered User Role Breakdown
                </h3>
                {overview && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-surface-muted border border-surface-border font-semibold text-navy">
                      <span>Citizens / Applicants</span>
                      <span>{overview.users.byRole.applicant} accounts</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-surface-muted border border-surface-border font-semibold text-navy">
                      <span>Verification Reviewers</span>
                      <span>{overview.users.byRole.reviewer} officers</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-surface-muted border border-surface-border font-semibold text-navy">
                      <span>Compliance Directorate</span>
                      <span>{overview.users.byRole.compliance} officers</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-royal-light border border-royal/20 font-semibold text-navy">
                      <span>System Administrators</span>
                      <span>{overview.users.byRole.admin} administrators</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: USER MANAGEMENT ================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-surface-card p-4 rounded border border-surface-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && loadUsers()}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-1.5 border rounded text-xs text-navy focus:outline-none focus:border-navy"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-ink-secondary font-semibold">Role:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 border rounded text-navy text-xs bg-white"
                  >
                    <option value="All">All Roles</option>
                    <option value="applicant">Applicant</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="compliance">Compliance</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded font-bold text-xs bg-navy text-white hover:bg-navy-light shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New User</span>
              </button>
            </div>

            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {usersLoading ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  Loading users...
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  No users found matching your criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">User Name</th>
                        <th className="px-6 py-3.5">Email Address</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5">Organization / Dept</th>
                        <th className="px-6 py-3.5">Account Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-bold text-navy whitespace-nowrap">
                            {u.name}
                          </td>
                          <td className="px-6 py-4 text-ink-secondary whitespace-nowrap">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-royal-light text-royal'
                                : u.role === 'compliance'
                                ? 'bg-blue-100 text-blue-800'
                                : u.role === 'reviewer'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-ink-secondary whitespace-nowrap">
                            {u.organization || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {u.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleUserActive(u)}
                                className="p-1 rounded text-ink-secondary hover:text-navy"
                                title={u.isActive ? 'Disable User' : 'Enable User'}
                              >
                                {u.isActive ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setResetPasswordUser(u)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border border-surface-border text-navy hover:bg-surface-bg"
                              >
                                <Key className="w-3 h-3 text-slate-400" />
                                <span>Reset Pwd</span>
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

        {/* ================= TAB 3: REVIEWER ASSIGNMENT ================= */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <h2 className="text-xl font-bold text-navy">Caseload &amp; Reviewer Workload Distribution</h2>
              <p className="text-xs text-ink-secondary mt-1">
                Assign newly submitted applications to active verification officers according to current caseload capacity.
              </p>
            </div>

            {/* Reviewer Workload Counter Cards */}
            {assignmentsData && (
              <div className="space-y-3">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider">
                  Active Reviewers Workload
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {assignmentsData.reviewers.map(r => (
                    <div key={r.id} className="bg-surface-card p-4 rounded border border-surface-border shadow-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy text-xs truncate">{r.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {r.activeCount} active
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-secondary truncate">{r.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications Assignment Table */}
            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider">
                  Applications Pending Assignment or Re-allocation
                </h3>
                <button
                  type="button"
                  onClick={loadAssignments}
                  className="p-1 rounded text-ink-secondary hover:text-navy"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {assignmentsLoading || !assignmentsData ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  Loading assignment queues...
                </div>
              ) : assignmentsData.applications.length === 0 ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  No applications currently awaiting reviewer allocation.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap">Reference No.</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Service Name</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Citizen Applicant</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Submission Date</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Current Assignee</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Assign Reviewer</th>
                        <th className="px-4 py-3.5 text-right sticky right-0 bg-surface-bg font-semibold z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[120px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {assignmentsData.applications.map((app) => (
                        <tr key={app.id} className="group hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-navy whitespace-nowrap">
                            {app.referenceNumber}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-navy">
                            {app.applicationType}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-navy">
                            {app.applicantName}
                          </td>
                          <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                            {app.submissionDate ? new Date(app.submissionDate).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {app.assignedReviewerName ? (
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {app.assignedReviewerName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <select
                              value={selectedReviewerMap[app.id] || (app.assignedReviewerId || '')}
                              onChange={(e) => setSelectedReviewerMap({ ...selectedReviewerMap, [app.id]: e.target.value })}
                              className="px-2.5 py-1.5 text-xs border border-surface-border rounded-[6px] bg-white text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-[#93B4FF]"
                            >
                              <option value="">-- Choose Reviewer --</option>
                              {assignmentsData.reviewers.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.activeCount} active)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#F8FAFC] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[120px]">
                            <button
                              type="button"
                              disabled={assigningId === app.id}
                              onClick={() => handleAssignReviewer(app.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-semibold text-xs bg-[#2F6FED] hover:bg-[#2558C4] text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#93B4FF] disabled:opacity-50"
                            >
                              {assigningId === app.id ? 'Assigning...' : 'Assign'}
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

        {/* ================= TAB 4: SERVICE CONFIGURATION ================= */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <h2 className="text-xl font-bold text-navy">Government Service &amp; Document Rules Configuration</h2>
              <p className="text-xs text-ink-secondary mt-1">
                Configure required statutory certificates, upload limits, and document formats across all schemes.
              </p>
            </div>

            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {servicesLoading ? (
                <div className="py-16 text-center text-xs text-ink-secondary">
                  Loading service rules...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border text-ink-secondary uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Service Name</th>
                        <th className="px-6 py-3.5">Department</th>
                        <th className="px-6 py-3.5">Statutory Required Documents</th>
                        <th className="px-6 py-3.5">Max File Size</th>
                        <th className="px-6 py-3.5 text-right">Configure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {services.map((svc) => (
                        <tr key={svc.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-bold text-navy whitespace-nowrap">
                            {svc.serviceName}
                          </td>
                          <td className="px-6 py-4 text-ink-secondary whitespace-nowrap">
                            {svc.department}
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <div className="flex flex-wrap gap-1">
                              {svc.requiredDocuments.map((doc, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-navy whitespace-nowrap">
                            {svc.maxFileSizeMB} MB ({svc.allowedFormats.join(', ')})
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingService(svc)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded font-semibold text-xs border border-surface-border text-navy hover:bg-surface-bg"
                            >
                              <Edit3 className="w-3 h-3 text-slate-400" />
                              <span>Edit Rules</span>
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

        {/* ================= TAB 5: AUDIT LOGS ================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-surface-card p-4 rounded border border-surface-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && loadAuditLogs()}
                    placeholder="Search logs by action, ref, or actor..."
                    className="w-full pl-9 pr-3 py-1.5 border rounded text-xs text-navy focus:outline-none focus:border-navy"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-ink-secondary font-semibold">Actor Role:</span>
                  <select
                    value={auditRoleFilter}
                    onChange={(e) => setAuditRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 border rounded text-navy text-xs bg-white"
                  >
                    <option value="All">All Roles</option>
                    <option value="applicant">Applicant</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="compliance">Compliance</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={loadAuditLogs}
                className="p-1.5 rounded border border-surface-border hover:bg-surface-bg text-ink-secondary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
              {auditLoading ? (
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
                        <th className="px-6 py-3.5">Target Ref</th>
                        <th className="px-6 py-3.5">Outcome</th>
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
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-3 font-semibold text-navy whitespace-nowrap">
                            {log.actorName} ({log.actorRole})
                          </td>
                          <td className="px-6 py-3 font-bold text-navy whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="px-6 py-3 font-mono text-ink-secondary whitespace-nowrap">
                            {log.targetReference || '—'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.outcome === 'Success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {log.outcome}
                            </span>
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

        {/* ================= TAB 6: SYSTEM HEALTH ================= */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-navy">Infrastructure &amp; Storage Health</h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Active database connectivity, file storage persistence, and OCR engine readiness.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Systems Operational</span>
                </span>
              </div>
            </div>

            {healthLoading || !healthData ? (
              <div className="py-20 text-center text-xs text-ink-secondary">
                Inspecting runtime environment...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-navy font-bold text-sm">
                    <Database className="w-5 h-5 text-royal" />
                    <span>Storage Engine</span>
                  </div>
                  <div className="text-2xl font-extrabold text-navy capitalize">
                    {healthData.storageMode} Mode
                  </div>
                  <div className="text-xs text-ink-secondary">
                    Status: <strong className="text-emerald-700 capitalize">{healthData.database}</strong>
                  </div>
                </div>

                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-navy font-bold text-sm">
                    <HardDrive className="w-5 h-5 text-royal" />
                    <span>Upload Storage</span>
                  </div>
                  <div className="text-2xl font-extrabold text-navy">
                    {healthData.uploads.fileCount} Documents
                  </div>
                  <div className="text-xs text-ink-secondary">
                    Total Disk Usage: <strong className="text-navy">{(healthData.uploads.totalSizeBytes / (1024 * 1024)).toFixed(2)} MB</strong>
                  </div>
                </div>

                <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-navy font-bold text-sm">
                    <Cpu className="w-5 h-5 text-royal" />
                    <span>Memory Allocation</span>
                  </div>
                  <div className="text-2xl font-extrabold text-navy">
                    {healthData.memory.heapUsedMB} MB
                  </div>
                  <div className="text-xs text-ink-secondary">
                    Heap Total: <strong className="text-navy">{healthData.memory.heapTotalMB} MB</strong> ({healthData.memory.rssMB} MB RSS)
                  </div>
                </div>

                <div className="lg:col-span-3 bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                  <h3 className="font-bold text-navy text-sm border-b border-surface-border pb-2">
                    Runtime Component Health &amp; OCR Engine Readiness
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded bg-surface-bg border border-surface-border space-y-1">
                      <div className="text-ink-secondary font-semibold">Optical Character Recognition (OCR)</div>
                      <div className="font-bold text-navy">{healthData.ocrEngine}</div>
                      <div className="text-[10px] text-emerald-700">Tesseract.js Engine Initialized</div>
                    </div>

                    <div className="p-4 rounded bg-surface-bg border border-surface-border space-y-1">
                      <div className="text-ink-secondary font-semibold">Node.js Runtime</div>
                      <div className="font-bold text-navy">{healthData.nodeVersion}</div>
                      <div className="text-[10px] text-ink-secondary">OS Platform: {healthData.platform}</div>
                    </div>

                    <div className="p-4 rounded bg-surface-bg border border-surface-border space-y-1">
                      <div className="text-ink-secondary font-semibold">Audit Logging Engine</div>
                      <div className="font-bold text-emerald-700">Active &amp; Immutable</div>
                      <div className="text-[10px] text-ink-secondary">Complies with MeitY e-Gov Standards</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card max-w-lg w-full rounded-lg shadow-xl border border-surface-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-navy text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-royal" />
                <span>Create New User Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 rounded text-ink-secondary hover:text-navy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-navy mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-navy focus:outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-navy focus:outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">Assigned Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white text-navy font-semibold focus:outline-none focus:border-navy"
                  >
                    <option value="applicant">Citizen Applicant</option>
                    <option value="reviewer">Verification Officer (Reviewer)</option>
                    <option value="compliance">Compliance Directorate</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 border rounded text-navy focus:outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">Organization / Dept (Optional)</label>
                  <input
                    type="text"
                    value={newUserData.organization}
                    onChange={(e) => setNewUserData({ ...newUserData, organization: e.target.value })}
                    placeholder="e.g. Directorate of Higher Education"
                    className="w-full px-3 py-2 border rounded text-navy focus:outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border rounded text-navy focus:outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded font-semibold border border-surface-border hover:bg-surface-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                  className="px-5 py-2 rounded font-bold text-white hover:bg-[#2558C4] shadow-sm cursor-pointer select-none"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card max-w-md w-full rounded-lg shadow-xl border border-surface-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-navy text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-royal" />
                <span>Reset User Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="p-1 rounded text-ink-secondary hover:text-navy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <p className="text-ink-secondary">
                Set a new password for <strong className="text-navy">{resetPasswordUser.name}</strong> ({resetPasswordUser.email}).
              </p>

              <div>
                <label className="block font-semibold text-navy mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-surface-border rounded text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 rounded font-semibold border border-surface-border hover:bg-surface-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                  className="px-5 py-2 rounded font-bold text-white hover:bg-[#2558C4] shadow-sm cursor-pointer select-none"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Configuration Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card max-w-lg w-full rounded-lg shadow-xl border border-surface-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-navy text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-royal" />
                <span>Configure {editingService.serviceName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 rounded text-ink-secondary hover:text-navy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy mb-1">Service Description</label>
                <textarea
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-surface-border rounded text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Required Documents (Comma Separated)
                </label>
                <input
                  type="text"
                  value={editingService.requiredDocuments.join(', ')}
                  onChange={(e) => setEditingService({
                    ...editingService,
                    requiredDocuments: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-surface-border rounded text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">Maximum File Size (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editingService.maxFileSizeMB}
                  onChange={(e) => setEditingService({ ...editingService, maxFileSizeMB: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded text-navy focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded font-semibold border border-surface-border hover:bg-surface-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
                  className="px-5 py-2 rounded font-bold text-white hover:bg-[#2558C4] shadow-sm cursor-pointer select-none"
                >
                  Save Service Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
