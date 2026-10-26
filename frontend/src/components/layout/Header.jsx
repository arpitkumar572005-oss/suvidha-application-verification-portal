import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { 
  ShieldCheck, 
  User, 
  LogOut, 
  FileText, 
  ChevronDown,
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

export function Header() {
  const { user, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (location.pathname === path) return true;
    if (path === '/reviewer/dashboard' && location.pathname.startsWith('/reviewer')) return true;
    if (path === '/applicant/dashboard' && (location.pathname === '/applicant' || (location.pathname.startsWith('/applications') && user?.role === 'applicant'))) return true;
    if (path === '/compliance/dashboard' && (location.pathname === '/compliance' || (location.pathname.startsWith('/applications') && user?.role === 'compliance'))) return true;
    return false;
  };

  const navLinkClass = (active) =>
    `px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#93B4FF] ${
      active
        ? 'bg-[#2F6FED] text-white shadow-sm'
        : 'text-[#17365D] hover:bg-[#EAF1FF] hover:text-[#2F6FED]'
    }`;

  // Fetch notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      const list = res.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      // quiet fail for unauthenticated or network drop
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle click outside notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id || n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'System Administrator';
      case 'compliance': return 'Compliance Directorate';
      case 'reviewer': return 'Verification Officer';
      case 'applicant': return 'Citizen Applicant';
      default: return 'Visitor';
    }
  };

  return (
    <header className="border-b border-surface-border bg-white shadow-sm sticky top-0 z-40">
      {/* Top National Portal Utility Bar */}
      <div className="bg-navy text-white text-xs py-1.5 px-4 sm:px-8 border-b border-navy-light/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide uppercase text-[11px] text-slate-100">
              Government of India | भारत सरकार
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300 text-[11px]">
              National Application Validation, Document Authentication &amp; Compliance Portal
            </span>
          </div>

          {/* Portal View Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-navy-light hover:bg-slate-700 text-white text-[11px] border border-slate-600 transition-colors"
              aria-expanded={roleMenuOpen}
              aria-label="Switch portal view"
            >
              <span className="text-slate-300">Portal View:</span>
              <span className="font-bold text-white capitalize">{user ? getRoleDisplayName(user.role) : 'Citizen'}</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </button>

            {roleMenuOpen && (
              <div 
                className="absolute right-0 mt-1 w-64 bg-white text-ink-primary rounded-md shadow-lg border border-surface-border py-1 z-50 text-xs"
                role="menu"
              >
                <div className="px-3 py-1.5 font-semibold text-ink-secondary border-b border-surface-border text-[11px] bg-surface-muted">
                  Switch Portal View:
                </div>
                <button
                  type="button"
                  onClick={() => { switchDemoRole('applicant'); setRoleMenuOpen(false); navigate('/applicant/dashboard'); }}
                  className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between border-l-2 ${
                    user?.role === 'applicant'
                      ? 'bg-[#EAF1FF] border-[#2F6FED] font-bold text-[#17365D]'
                      : 'border-transparent hover:bg-[#EAF1FF] text-[#1E293B]'
                  }`}
                  role="menuitem"
                >
                  <div>
                    <div className="font-semibold text-navy">Citizen Applicant</div>
                    <div className="text-[10px] text-ink-secondary">Applications, Uploads, Tracking</div>
                  </div>
                  {user?.role === 'applicant' && <span className="text-[10px] bg-[#2F6FED] text-white font-bold px-2 py-0.5 rounded-[4px] ml-2">Active</span>}
                </button>
                <button
                  type="button"
                  onClick={() => { switchDemoRole('reviewer'); setRoleMenuOpen(false); navigate('/reviewer/dashboard'); }}
                  className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between border-l-2 ${
                    user?.role === 'reviewer'
                      ? 'bg-[#EAF1FF] border-[#2F6FED] font-bold text-[#17365D]'
                      : 'border-transparent hover:bg-[#EAF1FF] text-[#1E293B]'
                  }`}
                  role="menuitem"
                >
                  <div>
                    <div className="font-semibold text-navy">Verification Officer</div>
                    <div className="text-[10px] text-ink-secondary">Review Queue &amp; Inspection Workspace</div>
                  </div>
                  {user?.role === 'reviewer' && <span className="text-[10px] bg-[#2F6FED] text-white font-bold px-2 py-0.5 rounded-[4px] ml-2">Active</span>}
                </button>
                <button
                  type="button"
                  onClick={() => { switchDemoRole('compliance'); setRoleMenuOpen(false); navigate('/compliance/dashboard'); }}
                  className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between border-l-2 ${
                    user?.role === 'compliance'
                      ? 'bg-[#EAF1FF] border-[#2F6FED] font-bold text-[#17365D]'
                      : 'border-transparent hover:bg-[#EAF1FF] text-[#1E293B]'
                  }`}
                  role="menuitem"
                >
                  <div>
                    <div className="font-semibold text-navy">Compliance Directorate</div>
                    <div className="text-[10px] text-ink-secondary">Audit Cases, Rules &amp; Violations</div>
                  </div>
                  {user?.role === 'compliance' && <span className="text-[10px] bg-[#2F6FED] text-white font-bold px-2 py-0.5 rounded-[4px] ml-2">Active</span>}
                </button>
                <button
                  type="button"
                  onClick={() => { switchDemoRole('admin'); setRoleMenuOpen(false); navigate('/admin/dashboard'); }}
                  className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between border-l-2 ${
                    user?.role === 'admin'
                      ? 'bg-[#EAF1FF] border-[#2F6FED] font-bold text-[#17365D]'
                      : 'border-transparent hover:bg-[#EAF1FF] text-[#1E293B]'
                  }`}
                  role="menuitem"
                >
                  <div>
                    <div className="font-semibold text-navy">System Administration</div>
                    <div className="text-[10px] text-ink-secondary">User Mgmt, Assignments, Services, Audit</div>
                  </div>
                  {user?.role === 'admin' && <span className="text-[10px] bg-[#2F6FED] text-white font-bold px-2 py-0.5 rounded-[4px] ml-2">Active</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Branding & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Suvidha Logo */}
        <Link 
          to={user?.role === 'applicant' ? '/applicant/dashboard' : user?.role === 'reviewer' ? '/reviewer/dashboard' : user?.role === 'compliance' ? '/compliance/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/'} 
          className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-royal rounded"
        >
          <div className="w-9 h-9 rounded bg-navy text-royal flex items-center justify-center border border-navy-light shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-navy">Suvidha</span>
              <span className="text-slate-300 font-light">|</span>
              <span className="text-xs font-semibold text-ink-primary">Verification Portal</span>
            </div>
            <p className="text-[11px] text-ink-secondary hidden sm:block">
              National Application Validation, Document Authentication &amp; Compliance Portal
            </p>
          </div>
        </Link>

        {/* Role-Specific Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-semibold">
          {/* Guest / Unauthenticated */}
          {!user && (
            <>
              <Link
                to="/"
                className={navLinkClass(isActive('/'))}
              >
                Home
              </Link>
              <Link
                to="/applicant/new-application"
                className={navLinkClass(isActive('/applicant/new-application'))}
              >
                Apply for Service
              </Link>
              <a
                href="/#how-it-works"
                className="px-3 py-1.5 rounded-[6px] text-xs font-semibold text-[#17365D] hover:bg-[#EAF1FF] hover:text-[#2F6FED] transition-colors hidden sm:inline-block focus:outline-none focus:ring-2 focus:ring-[#93B4FF]"
              >
                How Verification Works
              </a>
            </>
          )}

          {/* Applicant Role Links */}
          {user?.role === 'applicant' && (
            <>
              <Link
                to="/applicant/dashboard"
                className={navLinkClass(isActive('/applicant/dashboard'))}
              >
                My Dashboard
              </Link>
              <Link
                to="/applicant/new-application"
                className={navLinkClass(isActive('/applicant/new-application'))}
              >
                Apply for Service
              </Link>
            </>
          )}

          {/* Reviewer Role Links */}
          {user?.role === 'reviewer' && (
            <>
              <Link
                to="/reviewer/dashboard"
                className={navLinkClass(isActive('/reviewer/dashboard'))}
              >
                Review Queue
              </Link>
            </>
          )}

          {/* Compliance Role Links */}
          {user?.role === 'compliance' && (
            <>
              <Link
                to="/compliance/dashboard"
                className={navLinkClass(isActive('/compliance/dashboard'))}
              >
                Compliance Directorate
              </Link>
              <Link
                to="/compliance/rules"
                className={navLinkClass(isActive('/compliance/rules'))}
              >
                Rules &amp; Policies
              </Link>
            </>
          )}

          {/* Admin Role Links */}
          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className={navLinkClass(isActive('/admin/dashboard'))}
              >
                Admin Center
              </Link>
              <Link
                to="/reviewer/dashboard"
                className={navLinkClass(isActive('/reviewer/dashboard'))}
              >
                Review Desk
              </Link>
              <Link
                to="/admin/audit-logs"
                className={navLinkClass(isActive('/admin/audit-logs'))}
              >
                Audit Logs
              </Link>
            </>
          )}

          {/* Notifications Bell Dropdown */}
          {user && (
            <div className="relative ml-1" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded text-ink-secondary hover:text-navy hover:bg-surface-hover transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-royal text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-xl border border-surface-border py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-surface-border flex items-center justify-between">
                    <div className="font-bold text-navy flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-royal" />
                      <span>Notifications ({notifications.length})</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-royal hover:underline font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-ink-secondary text-xs">
                        No notifications currently
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id || n.id}
                          className={`p-3 transition-colors hover:bg-surface-hover flex items-start gap-2.5 ${
                            !n.read ? 'bg-royal-light/40' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'Warning' || n.type === 'Action Required' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
                            ) : n.type === 'Violation' ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-status-error" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-royal" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-navy truncate">{n.title}</span>
                              <span className="text-[10px] text-ink-secondary whitespace-nowrap">
                                {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-secondary mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            {n.link && (
                              <Link
                                to={n.link}
                                onClick={() => setNotifOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] text-royal font-semibold hover:underline mt-1"
                              >
                                <span>View Details</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                          {!n.read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(n._id || n.id, e)}
                              className="p-1 text-slate-400 hover:text-navy rounded"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Profile and Sign Out */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-surface-border">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-navy leading-tight">{user.name}</div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-royal/30 bg-royal-light text-navy uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 rounded text-ink-secondary hover:text-status-error hover:bg-status-error-bg transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-4 py-1.5 rounded text-xs font-semibold bg-royal text-white hover:bg-royal-hover transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
