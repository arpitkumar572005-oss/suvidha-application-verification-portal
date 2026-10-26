import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Info, AlertTriangle, FileText } from 'lucide-react';

export function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-navy mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-royal-light text-royal uppercase tracking-wider border border-royal/20">
            Terms of Service
          </span>
        </div>
        <h1 className="text-3xl font-bold text-navy">
          Terms and Conditions
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Last Updated: 23 October 2026 | Portal Guidelines Reference: SUVIDHA-TOS-2026
        </p>
      </div>

      {/* Notice Card */}
      <div className="p-4 rounded-lg bg-surface-card border border-surface-border shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-navy font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-royal" />
          <span>Portal Usage and Service Conditions</span>
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed">
          Suvidha is an automated application validation and document authentication platform. By accessing or submitting applications through this portal, users agree to the terms, service guidelines, and security policies outlined below.
        </p>
      </div>

      {/* Terms Content */}
      <div className="space-y-6 text-xs text-ink-primary leading-relaxed">
        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>1. Purpose and Scope of Portal Services</span>
          </h2>
          <p className="text-ink-secondary">
            This platform facilitates citizen application submission, optical character recognition (OCR) analysis, cross-field consistency verification, and regulatory rule screening to assist authorized officers during application adjudication.
          </p>
        </section>

        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>2. Mandatory Human Review and Assisted Automation</span>
          </h2>
          <p className="text-ink-secondary">
            The automated pipeline generates preliminary findings and consistency reports to assist review workflows. <strong>Under no circumstances does automated processing make autonomous, final, or binding rejection decisions.</strong> All findings must be examined by an authorized reviewing officer prior to an official decision.
          </p>
        </section>

        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>3. Document Integrity and Verification Standards</span>
          </h2>
          <p className="text-ink-secondary">
            Applicants are responsible for ensuring that all submitted certificates are genuine, complete, and legible. The system performs automated file validation and consistency comparisons. Any detected discrepancies are flagged for officer clarification or re-upload requests.
          </p>
        </section>

        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>4. Acceptable User Conduct</span>
          </h2>
          <p className="text-ink-secondary">
            Users agree to use this portal strictly in accordance with applicable laws. Uploading malicious software, corrupt files, or submitting forged documentation is strictly prohibited and subject to administrative and legal penalties.
          </p>
        </section>

        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>5. Availability and Technical Support</span>
          </h2>
          <p className="text-ink-secondary">
            The portal is maintained to provide uninterrupted citizen services. For technical assistance or portal inquiries, citizens and departmental officers may reach out to the helpdesk at helpdesk@suvidha.gov.in.
          </p>
        </section>
      </div>
    </div>
  );
}
