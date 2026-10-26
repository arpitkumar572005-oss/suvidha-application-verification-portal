import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { SignInPage } from './pages/SignInPage';
import { ApplicantDashboardPage } from './pages/ApplicantDashboardPage';
import { NewApplicationPage } from './pages/NewApplicationPage';
import { ApplicationDetailsPage } from './pages/ApplicationDetailsPage';
import { VerificationWorkspacePage } from './pages/VerificationWorkspacePage';
import { ReviewerDashboardPage } from './pages/ReviewerDashboardPage';
import { ComplianceDashboardPage } from './pages/ComplianceDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ComplianceRulesPage } from './pages/ComplianceRulesPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './pages/TermsAndConditionsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-ink-secondary">
        Verifying user session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    // If user tries to access unauthorized role route, redirect to their role's home dashboard
    if (user.role === 'applicant') {
      return <Navigate to="/applicant/dashboard" replace />;
    }
    if (user.role === 'reviewer') {
      return <Navigate to="/reviewer/dashboard" replace />;
    }
    if (user.role === 'compliance') {
      return <Navigate to="/compliance/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-surface-bg text-ink-primary font-sans">
          <Header />
          <main className="flex-1">
            <ErrorBoundary>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<SignInPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />

              {/* 1. Citizen Applicant Routes */}
              <Route
                path="/applicant/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                    <ApplicantDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applicant/new-application"
                element={
                  <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                    <NewApplicationPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Application Details */}
              <Route
                path="/applications/:id"
                element={
                  <ProtectedRoute>
                    <ApplicationDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* 2. Verification Officer (Reviewer) Routes */}
              <Route
                path="/reviewer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['reviewer', 'compliance', 'admin']}>
                    <ReviewerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviewer/workspace/:id"
                element={
                  <ProtectedRoute allowedRoles={['reviewer', 'compliance', 'admin']}>
                    <VerificationWorkspacePage />
                  </ProtectedRoute>
                }
              />

              {/* 3. Compliance Directorate Routes */}
              <Route
                path="/compliance/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['compliance', 'admin']}>
                    <ComplianceDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compliance/rules"
                element={
                  <ProtectedRoute allowedRoles={['compliance', 'admin', 'reviewer']}>
                    <ComplianceRulesPage />
                  </ProtectedRoute>
                }
              />

              {/* 4. Administrator Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'compliance', 'reviewer']}>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
