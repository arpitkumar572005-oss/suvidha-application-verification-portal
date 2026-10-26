import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  UserCheck,
  Info
} from 'lucide-react';

export function SignInPage() {
  const { login, demoAccounts } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/applicant/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      // Route appropriately based on user role
      if (user.role === 'reviewer') {
        navigate('/reviewer/dashboard');
      } else if (user.role === 'compliance') {
        navigate('/compliance/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/applicant/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoAccount = (acc) => {
    setEmail(acc.email);
    setPassword('Demo@123');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Portal Emblem / Badge */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-lg bg-navy text-white flex items-center justify-center border-2 border-royal shadow-sm">
            <ShieldCheck className="w-8 h-8 text-royal" />
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-navy">
          Suvidha Application Portal
        </h1>
        <p className="mt-1 text-center text-xs text-ink-secondary">
          Application Validation, Document Authentication and Compliance Verification
        </p>

        {/* Portal Access Notice */}
        <div className="mt-4 p-3 bg-royal-light border border-royal/30 rounded-md flex items-start gap-2.5 text-xs text-navy">
          <ShieldCheck className="w-4 h-4 text-royal shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-royal block">Authorized Portal Access</span>
            <span>Sign in with your registered credentials. Pre-configured officer and citizen profiles are available below for quick access.</span>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-card py-8 px-6 shadow-sm border border-surface-border rounded-lg sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-status-error-bg border border-status-error/30 flex items-start gap-2.5 text-xs text-status-error" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-navy mb-1">
                Official or Registered Email Address <span className="text-status-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. arpit@example.com"
                  className="block w-full pl-9 pr-3 py-2 border border-surface-border rounded-md text-sm text-navy placeholder-slate-400 focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-navy mb-1">
                Password <span className="text-status-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="block w-full pl-9 pr-10 py-2 border border-surface-border rounded-md text-sm text-navy placeholder-slate-400 focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-navy"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? '#94A3B8' : '#2F6FED', color: '#FFFFFF' }}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md text-sm font-bold text-white hover:bg-[#2558C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#93B4FF] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer select-none"
              >
                {loading ? 'Verifying Credentials...' : 'Sign In to Portal'}
              </button>
            </div>
          </form>

          {/* Pre-configured Profiles Section */}
          <div className="mt-8 pt-6 border-t border-surface-border">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-navy">
              <UserCheck className="w-4 h-4 text-royal" />
              <span>Select Pre-configured Profile (Quick Access):</span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemoAccount(acc)}
                  className={`w-full text-left p-2.5 rounded-md border text-xs transition-colors flex flex-col gap-0.5 ${
                    email === acc.email
                      ? 'border-royal bg-royal-light/60 text-navy font-medium'
                      : 'border-surface-border hover:bg-surface-bg text-ink-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy">{acc.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-white border border-slate-200 text-ink-secondary">
                      {acc.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-secondary">{acc.email}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{acc.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
