import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  FileCheck2, 
  Sliders, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  UserCheck,
  Search,
  Check,
  UploadCloud,
  Eye,
  FileCheck
} from 'lucide-react';

export function HomePage() {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'applicant') {
        navigate('/applicant/dashboard', { replace: true });
      } else if (user.role === 'reviewer') {
        navigate('/reviewer/dashboard', { replace: true });
      } else if (user.role === 'compliance') {
        navigate('/compliance/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleApplyClick = async () => {
    // If not logged in as applicant, switch to applicant demo account for immediate access
    if (!user || user.role !== 'applicant') {
      await switchDemoRole('applicant');
    }
    navigate('/applicant/new-application');
  };

  const handleReviewClick = async () => {
    // If not logged in as reviewer/admin, switch to reviewer demo account
    if (!user || (user.role !== 'reviewer' && user.role !== 'admin')) {
      await switchDemoRole('reviewer');
    }
    navigate('/reviewer/dashboard');
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Section */}
      <section className="bg-surface-card border-b border-surface-border py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy">
            Application and Document Verification Portal
          </h1>

          <p className="text-sm sm:text-base text-ink-secondary max-w-2xl mx-auto leading-relaxed">
            Submit your application, upload supporting documents, and check for missing information or inconsistencies before a reviewer makes a decision.
          </p>

          {/* Only Two Prominent Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleApplyClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded text-sm font-bold bg-royal hover:bg-royal-hover text-white transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Apply for a Service</span>
            </button>

            <button
              type="button"
              onClick={handleReviewClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded text-sm font-bold bg-navy hover:bg-navy-light text-white transition-colors shadow-sm"
            >
              <FileCheck2 className="w-4 h-4 text-royal" />
              <span>Review Applications</span>
            </button>
          </div>

          {/* 3 Simple Steps Directly Below Hero */}
          <div className="pt-8 border-t border-surface-border mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
              Three Simple Steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded border border-surface-border bg-surface-bg flex items-start gap-3">
                <span className="w-7 h-7 rounded bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-xs text-navy">Submit application and documents</h3>
                  <p className="text-xs text-ink-secondary mt-1">
                    Fill in your details and upload supporting certificate scans (PDF, JPG, PNG).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded border border-surface-border bg-surface-bg flex items-start gap-3">
                <span className="w-7 h-7 rounded bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-xs text-navy">Check documents and details</h3>
                  <p className="text-xs text-ink-secondary mt-1">
                    System reads document information, compares fields, and identifies any missing items.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded border border-surface-border bg-surface-bg flex items-start gap-3">
                <span className="w-7 h-7 rounded bg-royal text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-xs text-navy">Review findings and receive decision</h3>
                  <p className="text-xs text-ink-secondary mt-1">
                    An authorised human officer reviews the findings and records an official decision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Separate "How Verification Works" Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6 scroll-mt-20">
        <div className="max-w-2xl space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-royal">
            Verification Workflow
          </span>
          <h2 className="text-2xl font-bold text-navy">
            How Verification Works
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            The portal assists reviewers by checking application details against uploaded certificates using plain, explainable rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-card p-5 rounded border border-surface-border shadow-sm space-y-2">
            <div className="w-8 h-8 rounded bg-surface-bg border border-surface-border flex items-center justify-center text-navy font-bold text-xs">
              A
            </div>
            <h3 className="font-bold text-xs text-navy">Read Information from Documents</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Optical scan analysis reads applicant name, dates, income figures, and certificate numbers from uploaded documents.
            </p>
            <div className="text-[11px] font-semibold text-royal pt-1">
              Engine: Automated OCR Extraction
            </div>
          </div>

          <div className="bg-surface-card p-5 rounded border border-surface-border shadow-sm space-y-2">
            <div className="w-8 h-8 rounded bg-surface-bg border border-surface-border flex items-center justify-center text-navy font-bold text-xs">
              B
            </div>
            <h3 className="font-bold text-xs text-navy">Compare Application Details</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Compares form entries against certificate values to identify exact matches, minor spelling differences, or mismatches.
            </p>
            <div className="text-[11px] font-semibold text-ink-secondary pt-1">
              Cross-field consistency check
            </div>
          </div>

          <div className="bg-surface-card p-5 rounded border border-surface-border shadow-sm space-y-2">
            <div className="w-8 h-8 rounded bg-surface-bg border border-surface-border flex items-center justify-center text-navy font-bold text-xs">
              C
            </div>
            <h3 className="font-bold text-xs text-navy">Explainable Rule-Based Checks</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Checks whether required documents are attached, whether dates are unexpired, and if financial limits are satisfied.
            </p>
            <div className="text-[11px] font-semibold text-ink-secondary pt-1">
              Configured statutory compliance rules
            </div>
          </div>

          <div className="bg-surface-card p-5 rounded border border-surface-border shadow-sm space-y-2">
            <div className="w-8 h-8 rounded bg-surface-bg border border-surface-border flex items-center justify-center text-navy font-bold text-xs">
              D
            </div>
            <h3 className="font-bold text-xs text-navy">Authorised Human Review</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              An officer examines the summary table, checks highlighted differences, requests re-upload if needed, and records a decision.
            </p>
            <div className="text-[11px] font-semibold text-status-success pt-1">
              Human reviewer required for all decisions
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
