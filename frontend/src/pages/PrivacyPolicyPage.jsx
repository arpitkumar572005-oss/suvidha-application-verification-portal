import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Info, Lock, Server, FileText } from 'lucide-react';

export function PrivacyPolicyPage() {
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
            Transparency Disclosure
          </span>
        </div>
        <h1 className="text-3xl font-bold text-navy">
          Privacy Policy
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Effective Date: 23 October 2026 | Policy Standard Reference: GOI-DPDP-2026-SUVIDHA
        </p>
      </div>

      {/* Main Notice */}
      <div className="p-4 rounded-lg bg-surface-card border border-surface-border shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-navy font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-royal" />
          <span>Data Protection and Privacy Framework</span>
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed">
          The Suvidha portal is committed to safeguarding citizen privacy and ensuring transparent data governance. This policy explains what information is collected, how documents are verified, and the security protocols enforced across the validation lifecycle.
        </p>
      </div>

      {/* Structured Policy Sections */}
      <div className="space-y-6 text-xs text-ink-primary leading-relaxed">
        {/* Section 1 */}
        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>1. Information Collected by This System</span>
          </h2>
          <p className="text-ink-secondary">
            During application submission, the system collects only information submitted directly through official forms and upload controls:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-ink-secondary">
            <li><strong>Account Credentials:</strong> Name, registered email address, role identifier, and encrypted password hash (via bcrypt).</li>
            <li><strong>Application Data:</strong> Application type, declared annual income, social category, student roll number, academic institution, and bank IFSC code.</li>
            <li><strong>Document Uploads:</strong> Scanned copies of identity certificates, income certificates, marksheets, and bank passbooks in PDF, JPG, PNG, or SVG format.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>2. Purpose of Document Processing</span>
          </h2>
          <p className="text-ink-secondary">
            Uploaded documents and application fields are processed to ensure regulatory compliance and verification:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-ink-secondary">
            <li>Extracting relevant text attributes (e.g. name, date of birth, income figure) through the automated scan ingestion pipeline.</li>
            <li>Performing cross-field consistency checks between declared applicant information and official document scans.</li>
            <li>Evaluating configured compliance rules (e.g. document validity periods and mandatory checklists).</li>
            <li>Generating structured findings to assist authorised human reviewing officers in administrative decisions.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>3. File Storage, Private Access and Security Safeguards</span>
          </h2>
          <p className="text-ink-secondary">
            Uploaded files are stored in a restricted backend directory with randomised internal identifiers (UUIDv4) to prevent path traversal or unauthorized URL access. Files are accessible only to the applicant owner or authorised reviewing officers through authenticated streaming endpoints protected by JSON Web Tokens.
          </p>
          <p className="text-ink-secondary">
            File uploads are restricted on the server to authorized MIME types (PDF, JPG, PNG) and a maximum size limit of 5 megabytes.
          </p>
        </section>

        {/* Section 4 */}
        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>4. Processing Infrastructure and Security Safeguards</span>
          </h2>
          <p className="text-ink-secondary">
            Document processing is executed within an isolated application boundary. <strong>No uploaded files or personal information are transmitted to external third-party commercial services or unauthorized clouds.</strong>
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>5. Data Retention and Deletion</span>
          </h2>
          <p className="text-ink-secondary">
            Citizen records and uploaded certificates are retained only for the duration required to complete the verification workflow and statutory record audits in accordance with standard data retention policies.
          </p>
        </section>

        {/* Section 6 */}
        <section className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-royal" />
            <span>6. Project Contact and Inquiries</span>
          </h2>
          <p className="text-ink-secondary">
            For inquiries or grievances regarding document validation or data handling, contact the Suvidha Citizen Support Desk:
          </p>
          <div className="p-3 bg-surface-bg rounded border border-surface-border font-mono text-xs text-navy">
            Support Desk: helpdesk@suvidha.gov.in | Toll-Free Grievance Helpline: 1800-11-2026
          </div>
        </section>
      </div>
    </div>
  );
}
