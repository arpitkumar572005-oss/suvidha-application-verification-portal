import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge, RiskBadge } from '../components/common/Badges';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { 
  ArrowLeft, 
  FileText, 
  UploadCloud, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  History,
  AlertTriangle,
  User,
  Building,
  RefreshCw,
  SearchCheck,
  Send,
  ChevronDown,
  ChevronUp,
  Calendar,
  HelpCircle,
  XCircle,
  Info
} from 'lucide-react';

function ValidationBadge({ result, size = 'sm' }) {
  const res = (result || '').toUpperCase();
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = null;

  if (res.includes('PASS') || res === 'MATCH' || res === 'VALID' || res === 'COMPLETE' || res === 'MATCHED' || res === 'MATCH CONFIRMED') {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 inline mr-1" />;
  } else if (res.includes('WARN') || res.includes('POSSIBLE')) {
    bg = 'bg-amber-50 text-amber-800 border-amber-300';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 inline mr-1" />;
  } else if (res.includes('FAIL') || res === 'MISMATCH' || res === 'EXPIRED' || res === 'MISMATCH DETECTED') {
    bg = 'bg-rose-50 text-rose-800 border-rose-300';
    icon = <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 inline mr-1" />;
  } else if (res.includes('MISSING')) {
    bg = 'bg-red-50 text-red-800 border-red-300';
    icon = <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 inline mr-1" />;
  } else if (res.includes('REVIEW') || res.includes('UNABLE') || res.includes('MANUAL')) {
    bg = 'bg-indigo-50 text-indigo-800 border-indigo-300';
    icon = <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 inline mr-1" />;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold border tracking-wide ${bg} ${size === 'xs' ? 'text-[10px]' : 'text-[11px]'}`}>
      {icon}
      <span>{result}</span>
    </span>
  );
}

export function ApplicationDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['overview', 'documents', 'extracted', 'findings', 'activity'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const setActiveTab = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };
  const [expandedCards, setExpandedCards] = useState({});

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getApplicationById(id);
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleOpenUpload = (category = '') => {
    setSelectedUploadCategory(category);
    setUploadModalOpen(true);
  };

  const handleSubmitDraft = async () => {
    if (!window.confirm('Are you sure you want to formally submit this application for officer review?')) return;
    try {
      await api.submitApplication(id);
      loadDetails();
    } catch (err) {
      alert(err.message || 'Submission failed.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-ink-secondary text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-royal" />
        Loading application record...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 bg-status-error-bg border border-status-error/30 rounded-lg text-center text-status-error">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-base font-bold">Unable to Load Record</h2>
          <p className="text-xs mt-1">{error || 'Application not found.'}</p>
          <Link
            to={user?.role === 'reviewer' ? '/reviewer/dashboard' : '/applicant/dashboard'}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold bg-white border border-status-error/40 text-status-error hover:bg-slate-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const { application, documents = [], latestVerification, auditEvents = [] } = data;
  const isApplicant = user?.role === 'applicant';
  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin';

  const getServiceRequirements = (appType = '') => {
    const type = (appType || '').toLowerCase();
    if (type.includes('trade')) {
      return [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Business Premise Proof', label: 'Business Premise Proof', mandatory: true },
        { key: 'Fire & Safety NOC', label: 'Fire & Safety NOC', mandatory: true },
        { key: 'GST Registration Certificate', label: 'GST / Udyam Certificate', mandatory: false }
      ];
    }
    if (type.includes('welfare') || type.includes('livelihood')) {
      return [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Income Certificate', label: 'Income Certificate', mandatory: true },
        { key: 'Ration Card', label: 'Ration Card', mandatory: true },
        { key: 'Bank Passbook', label: 'Bank Passbook', mandatory: false }
      ];
    }
    if (type.includes('senior') || type.includes('pension')) {
      return [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Age Proof Certificate', label: 'Age Proof Certificate', mandatory: true },
        { key: 'Bank Passbook', label: 'Bank Passbook', mandatory: true },
        { key: 'Income Certificate', label: 'Income Certificate', mandatory: false }
      ];
    }
    if (type.includes('disability')) {
      return [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Disability Certificate', label: 'Disability Certificate', mandatory: true },
        { key: 'Bank Passbook', label: 'Bank Passbook', mandatory: true },
        { key: 'Income Certificate', label: 'Income Certificate', mandatory: false }
      ];
    }
    if (type.includes('caste') || type.includes('domicile')) {
      return [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Domicile Certificate', label: 'Domicile / Residence Certificate', mandatory: true },
        { key: 'Father Caste Certificate', label: 'Father Caste Certificate', mandatory: true },
        { key: 'Land Revenue Record', label: 'Land Revenue Record', mandatory: false }
      ];
    }
    if (type.includes('agri') || type.includes('kisan')) {
      return [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Land Ownership Record', label: 'Land Ownership Record', mandatory: true },
        { key: 'Bank Passbook', label: 'Bank Passbook', mandatory: true },
        { key: 'Crop Sowing Certificate', label: 'Crop Sowing Certificate', mandatory: false }
      ];
    }
    return [
      { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', mandatory: true },
      { key: 'Academic Marksheet', label: 'Academic Marksheet', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', mandatory: false }
    ];
  };

  const serviceRequirements = getServiceRequirements(application.applicationType);
  const mandatoryCategories = serviceRequirements.filter(r => r.mandatory).map(r => r.key);
  const uploadedCategories = documents.map(d => d.documentCategory);
  const missingCategories = mandatoryCategories.filter(cat => !uploadedCategories.includes(cat));

  const summary = latestVerification?.verificationSummary || {
    totalRequired: mandatoryCategories.length,
    totalUploaded: uploadedCategories.length,
    missingCount: missingCategories.length,
    passedChecks: (latestVerification?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('PASS') || c.status === 'Matched').length || 0) + (missingCategories.length === 0 ? 1 : 0),
    warningChecks: latestVerification?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('WARN')).length || 0,
    failedChecks: (latestVerification?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('FAIL') || c.status === 'Mismatch detected').length || 0) + (missingCategories.length > 0 ? 1 : 0),
    reviewRequiredChecks: latestVerification?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('REVIEW') || c.status === 'Unable to compare').length || 0
  };

  const displayCards = (latestVerification?.documentCards && latestVerification.documentCards.length > 0)
    ? latestVerification.documentCards
    : serviceRequirements.map(req => {
        const doc = documents.find(d => d.documentCategory === req.key);
        const isMissing = !doc && req.mandatory;
        const status = isMissing ? 'MISSING' : (doc ? 'PASS' : 'REVIEW REQUIRED');
        return {
          documentCategory: req.key,
          originalFileName: doc?.originalFileName || null,
          mandatory: req.mandatory,
          status: status,
          requirementStatus: req.mandatory ? 'Required' : 'Optional',
          verificationStatus: status,
          findingReason: isMissing ? `${req.label} is required for this application but has not been uploaded.` : `${req.label} submitted.`,
          primaryFinding: isMissing 
            ? `${req.label} is required but has not been uploaded.`
            : (doc ? `${req.label} uploaded and validated.` : `Optional document not submitted.`),
          correctiveAction: isMissing 
            ? `Applicant must upload a valid copy of ${req.label} to proceed.` 
            : 'No corrective action needed.',
          extractedInfo: doc?.extractedData || null,
          isSimulated: doc?.extractedData?.isSimulated || false,
          confidence: doc?.extractedData?.confidence || null,
          provider: doc?.extractedData?.provider || 'OCR Engine',
          expiryResult: null,
          fieldComparisons: (latestVerification?.crossDocumentComparisons || []).filter(c => 
            c.documentCategory === req.key ||
            (req.key.toLowerCase().includes('identity') && (c.field.includes('Name') || c.field.includes('Birth') || c.field.includes('Address'))) ||
            (req.key.toLowerCase().includes('income') && c.field.includes('Income')) ||
            (req.key.toLowerCase().includes('mark') && (c.field.includes('Roll') || c.field.includes('Mark') || c.field.includes('Institution')))
          )
        };
      });

  const comparisons = (latestVerification?.crossDocumentComparisons && latestVerification.crossDocumentComparisons.length > 0)
    ? latestVerification.crossDocumentComparisons
    : [];

  const toggleCard = (cat) => {
    setExpandedCards(prev => ({
      ...prev,
      [cat]: prev[cat] === false ? true : false
    }));
  };

  const toggleAllCards = (expand) => {
    const next = {};
    displayCards.forEach(c => {
      next[c.documentCategory] = expand;
    });
    setExpandedCards(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={isApplicant ? '/applicant/dashboard' : '/reviewer/dashboard'}
            className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-navy mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {isApplicant ? 'My Dashboard' : 'Reviewer Queue'}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-navy">
              {application.referenceNumber}
            </h1>
            <StatusBadge status={application.status} />
            <PriorityBadge priority={application.priority} />
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Application Type: <span className="font-semibold text-navy">{application.applicationType}</span> | Submitted: {application.submissionDate ? new Date(application.submissionDate).toLocaleString('en-IN') : 'Draft Record'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action button: Upload Document */}
          <button
            type="button"
            onClick={() => handleOpenUpload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-white border border-surface-border hover:border-royal hover:text-royal transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Supporting Document</span>
          </button>

          {/* If draft, show submit button */}
          {application.status === 'Draft' && isApplicant && (
            <button
              type="button"
              onClick={handleSubmitDraft}
              style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold hover:bg-[#2558C4] text-white transition-all shadow-sm cursor-pointer select-none"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Verification</span>
            </button>
          )}

          {/* If reviewer, show button to open Verification Workspace */}
          {isReviewer && (
            <Link
              to={`/reviewer/workspace/${application._id || application.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-navy hover:bg-navy-light text-white transition-colors shadow-sm"
            >
              <SearchCheck className="w-4 h-4 text-royal" />
              <span>Open Verification Workspace</span>
            </Link>
          )}
        </div>
      </div>

      {/* Reviewer Feedback or Re-upload Banner if active */}
      {application.status === 'Re-upload Requested' && (
        <div className="p-4 rounded-lg bg-status-warning-bg border border-status-warning/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-status-warning uppercase tracking-wider">
                Action Required: Document Re-upload Requested
              </h3>
              <p className="text-xs text-navy mt-1">
                The verification officer has reviewed your submission and requested updated scans for:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {application.requestedReuploadDocs?.map((docCat) => (
                  <button
                    key={docCat}
                    type="button"
                    onClick={() => handleOpenUpload(docCat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white border border-status-warning text-status-warning hover:bg-amber-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload {docCat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-surface-border flex items-center gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap rounded-t-[4px] focus:outline-none focus:ring-2 focus:ring-[#93B4FF] ${
            activeTab === 'overview'
              ? 'border-[#2F6FED] text-[#2F6FED] bg-[#EAF1FF]/40 font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#17365D] hover:bg-slate-100/60'
          }`}
        >
          Applicant Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-[4px] focus:outline-none focus:ring-2 focus:ring-[#93B4FF] ${
            activeTab === 'documents'
              ? 'border-[#2F6FED] text-[#2F6FED] bg-[#EAF1FF]/40 font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#17365D] hover:bg-slate-100/60'
          }`}
        >
          <span>Uploaded Documents</span>
          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
            activeTab === 'documents' ? 'bg-[#2F6FED] text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {documents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('extracted')}
          className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap rounded-t-[4px] focus:outline-none focus:ring-2 focus:ring-[#93B4FF] ${
            activeTab === 'extracted'
              ? 'border-[#2F6FED] text-[#2F6FED] bg-[#EAF1FF]/40 font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#17365D] hover:bg-slate-100/60'
          }`}
        >
          Read Information from Documents
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('findings')}
          className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-[4px] focus:outline-none focus:ring-2 focus:ring-[#93B4FF] ${
            activeTab === 'findings'
              ? 'border-[#2F6FED] text-[#2F6FED] bg-[#EAF1FF]/40 font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#17365D] hover:bg-slate-100/60'
          }`}
        >
          <span>Verification Findings</span>
          {latestVerification && (
            <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
              latestVerification.riskLevel === 'Low Risk' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {latestVerification.preliminaryRiskScore}/100
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap rounded-t-[4px] focus:outline-none focus:ring-2 focus:ring-[#93B4FF] ${
            activeTab === 'activity'
              ? 'border-[#2F6FED] text-[#2F6FED] bg-[#EAF1FF]/40 font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#17365D] hover:bg-slate-100/60'
          }`}
        >
          Activity &amp; Audit Trail
        </button>
      </div>

      {/* TAB 1: Applicant Information */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <h2 className="text-xs font-bold text-navy uppercase tracking-wider mb-4">
                Declared Profile Details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-ink-secondary">Applicant Legal Name</dt>
                  <dd className="font-semibold text-navy text-sm mt-0.5">{application.applicantName}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Registered Email</dt>
                  <dd className="font-semibold text-navy mt-0.5">{application.applicantEmail}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Social / Caste Category</dt>
                  <dd className="font-semibold text-navy mt-0.5">{application.category}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Declared Annual Family Income</dt>
                  <dd className="font-semibold text-navy text-sm mt-0.5">
                    Rs. {Number(application.annualFamilyIncome).toLocaleString('en-IN')}
                  </dd>
                </div>
                {application.academicInstitution && (
                  <div>
                    <dt className="text-ink-secondary">Academic Institution</dt>
                    <dd className="font-semibold text-navy mt-0.5">{application.academicInstitution}</dd>
                  </div>
                )}
                {application.rollNumber && (
                  <div>
                    <dt className="text-ink-secondary">Roll Number / Enrollment ID</dt>
                    <dd className="font-semibold text-navy mt-0.5">{application.rollNumber}</dd>
                  </div>
                )}
                {application.businessName && (
                  <div>
                    <dt className="text-ink-secondary">Business / Trade Name</dt>
                    <dd className="font-semibold text-navy mt-0.5">{application.businessName} {application.tradeCategory ? `(${application.tradeCategory})` : ''}</dd>
                  </div>
                )}
                {application.dob && (
                  <div>
                    <dt className="text-ink-secondary">Date of Birth (Senior)</dt>
                    <dd className="font-semibold text-navy mt-0.5">{application.dob}</dd>
                  </div>
                )}
                {application.disabilityUdid && (
                  <div>
                    <dt className="text-ink-secondary">Disability UDID</dt>
                    <dd className="font-semibold text-navy mt-0.5">{application.disabilityUdid}</dd>
                  </div>
                )}
                {application.khasraNumber && (
                  <div>
                    <dt className="text-ink-secondary">Khasra / Plot & Area</dt>
                    <dd className="font-semibold text-navy mt-0.5">{application.khasraNumber} {application.landArea ? `(${application.landArea})` : ''}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-ink-secondary">Bank Account Number</dt>
                  <dd className="font-mono text-navy mt-0.5">{application.bankAccountNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Bank Branch IFSC</dt>
                  <dd className="font-mono text-navy mt-0.5">{application.bankIfscCode || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Reviewer Comments & Feedback */}
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <h2 className="text-xs font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-royal" />
                <span>Officer Remarks &amp; Review History</span>
              </h2>

              {(!application.reviewerComments || application.reviewerComments.length === 0) ? (
                <p className="text-xs text-ink-secondary">
                  No reviewer comments recorded yet. Comments will appear here once an officer processes the queue.
                </p>
              ) : (
                <div className="space-y-3">
                  {application.reviewerComments.map((c, i) => (
                    <div key={i} className="p-3 rounded-md bg-surface-bg border border-surface-border text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-navy">{c.reviewerName}</span>
                        <span className="text-[11px] text-ink-secondary">
                          {new Date(c.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-ink-primary">{c.comment}</p>
                      {c.action && (
                        <div className="mt-1 text-[10px] text-royal font-semibold uppercase">
                          Action: {c.action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Missing Documents and Preliminary Snapshot */}
          <div className="space-y-6">
            <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-royal" />
                <span>Mandatory Documents</span>
              </h3>

              <div className="space-y-2 text-xs">
                {serviceRequirements.map((req) => {
                  const cat = req.key;
                  const uploaded = documents.some(d => d.documentCategory === cat);
                  return (
                    <div
                      key={cat}
                      className={`p-2.5 rounded-md border flex items-center justify-between ${
                        uploaded ? 'bg-status-success-bg/40 border-status-success/20' : 'bg-status-warning-bg/40 border-status-warning/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {uploaded ? (
                          <CheckCircle2 className="w-4 h-4 text-status-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-status-warning" />
                        )}
                        <span className="font-medium text-navy">{req.label}</span>
                        {req.mandatory && (
                          <span className="text-[9px] uppercase px-1 rounded bg-amber-100 text-amber-800 font-bold">
                            Required
                          </span>
                        )}
                      </div>
                      {uploaded ? (
                        <span className="text-[10px] text-status-success font-semibold">Attached</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenUpload(cat)}
                          className="text-[10px] text-royal font-bold hover:underline"
                        >
                          + Upload
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Risk Indicator */}
            {latestVerification && (
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                  Automated Check Snapshot
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-secondary">Preliminary Risk Level</span>
                  <RiskBadge level={latestVerification.riskLevel} score={latestVerification.preliminaryRiskScore} />
                </div>
                <p className="text-[11px] text-ink-secondary leading-relaxed">
                  Preliminary automated screening is complete. Decisions are finalized solely by authorised verification officers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Uploaded Documents */}
      {activeTab === 'documents' && (
        <div className="bg-surface-card rounded-lg border border-surface-border shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">Supporting Document Attachments</h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Private, authenticated file storage. Documents are scanned for cross-reference analysis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenUpload()}
              style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold text-white hover:bg-[#2558C4] shadow-sm cursor-pointer select-none"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-ink-secondary text-xs">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No documents attached to this application yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc._id || doc.id} className="p-4 rounded-lg border border-surface-border bg-surface-bg flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy">{doc.documentCategory}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-surface-border text-ink-secondary font-medium">
                        {Math.round(doc.fileSize / 1024)} KB
                      </span>
                    </div>
                    <div className="text-xs text-ink-secondary truncate mt-1">{doc.originalFileName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Uploaded: {new Date(doc.uploadTimestamp).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {doc.extractedData && (
                    <div className="pt-2 border-t border-surface-border/60 text-[11px] text-navy space-y-1">
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">Extracted Name:</span>
                        <span className="font-semibold">{doc.extractedData.fullName || 'N/A'}</span>
                      </div>
                      {doc.extractedData.annualIncome !== null && doc.extractedData.annualIncome !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">Extracted Income:</span>
                          <span className="font-semibold">Rs. {Number(doc.extractedData.annualIncome).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-ink-secondary">Scan Confidence:</span>
                        <span className="font-mono font-bold text-royal">{doc.extractedData.confidence}%</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs">
                    <a
                      href={`/api/documents/${doc._id || doc.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-royal hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Safe Document Preview</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OCR Extracted Data */}
      {activeTab === 'extracted' && (
        <div className="bg-surface-card rounded-lg border border-surface-border shadow-sm p-6 space-y-6">
          <div className="border-b border-surface-border pb-4">
            <div className="flex items-center gap-2">
              <SearchCheck className="w-5 h-5 text-royal" />
              <h2 className="text-sm font-bold text-navy">Optical Character Recognition (OCR) Field Data</h2>
            </div>
            <p className="text-xs text-ink-secondary mt-1">
              Field values automatically extracted from supporting certificates by the OCR ingestion pipeline.
            </p>
          </div>

          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc._id || doc.id} className="p-4 rounded-md border border-surface-border bg-surface-bg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-border/60 gap-2">
                  <div>
                    <span className="font-bold text-xs text-navy">{doc.documentCategory}</span>
                    <span className="text-[11px] text-ink-secondary block sm:inline sm:ml-2">
                      ({doc.originalFileName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-secondary text-[11px]">Provider:</span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-surface-border">
                      {doc.extractedData?.provider || 'OCR Engine'}
                    </span>
                    <span className="font-semibold text-royal bg-royal-light border border-royal/20 px-2 py-0.5 rounded text-[11px]">
                      Confidence: {doc.extractedData?.confidence || 0}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs mt-3">
                  <div>
                    <span className="text-ink-secondary block">Extracted Legal Name</span>
                    <span className="font-semibold text-navy">{doc.extractedData?.fullName || 'Not Extracted'}</span>
                  </div>
                  <div>
                    <span className="text-ink-secondary block">Document / Certificate No.</span>
                    <span className="font-mono font-semibold text-navy">{doc.extractedData?.documentNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-ink-secondary block">Issuing Authority</span>
                    <span className="font-semibold text-navy">{doc.extractedData?.issuingAuthority || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-ink-secondary block">Issue Date</span>
                    <span className="font-semibold text-navy">{doc.extractedData?.issueDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-ink-secondary block">Expiry Date</span>
                    <span className="font-semibold text-navy">{doc.extractedData?.expiryDate || 'N/A'}</span>
                  </div>
                  {doc.extractedData?.annualIncome !== null && doc.extractedData?.annualIncome !== undefined && (
                    <div>
                      <span className="text-ink-secondary block">Extracted Annual Income</span>
                      <span className="font-semibold text-navy">
                        Rs. {Number(doc.extractedData?.annualIncome).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {doc.extractedData?.rawText && (
                  <div className="mt-3 pt-3 border-t border-surface-border/60">
                    <span className="text-[11px] font-semibold text-ink-secondary block mb-1">OCR Raw Text Ingestion:</span>
                    <pre className="p-2.5 rounded bg-white border border-surface-border text-[11px] text-slate-700 whitespace-pre-wrap font-mono">
                      {doc.extractedData.rawText}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: System Findings & Complete Document Validation Engine */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          {latestVerification ? (
            <>
              {/* Risk Summary Banner */}
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
                  <div>
                    <h2 className="text-sm font-bold text-navy">Preliminary Risk Assessment</h2>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      Rule-based assessment calculated from certificate comparisons and compliance checks.
                    </p>
                  </div>
                  <RiskBadge level={latestVerification.riskLevel} score={latestVerification.preliminaryRiskScore} />
                </div>

                {/* 1. SEVEN SUMMARY METRICS (Pillar 6) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-4">
                  <div className="p-3 rounded border border-surface-border bg-surface-bg flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-ink-secondary tracking-wider">Required</span>
                    <span className="text-xl font-bold font-mono text-navy mt-1">{summary.totalRequired}</span>
                    <span className="text-[10px] text-ink-secondary">Mandatory Docs</span>
                  </div>
                  <div className="p-3 rounded border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Uploaded</span>
                    <span className="text-xl font-bold font-mono text-blue-900 mt-1">{summary.totalUploaded}</span>
                    <span className="text-[10px] text-blue-600">Attached files</span>
                  </div>
                  <div className={`p-3 rounded border flex flex-col justify-between ${summary.missingCount > 0 ? 'border-red-300 bg-red-50/60 text-red-900' : 'border-surface-border bg-surface-bg'}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${summary.missingCount > 0 ? 'text-red-700' : 'text-ink-secondary'}`}>Missing</span>
                    <span className={`text-xl font-bold font-mono mt-1 ${summary.missingCount > 0 ? 'text-red-700' : 'text-navy'}`}>{summary.missingCount}</span>
                    <span className="text-[10px] text-ink-secondary">Mandatory missing</span>
                  </div>
                  <div className="p-3 rounded border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Passed</span>
                    <span className="text-xl font-bold font-mono text-emerald-800 mt-1">{summary.passedChecks}</span>
                    <span className="text-[10px] text-emerald-600">Checks cleared</span>
                  </div>
                  <div className="p-3 rounded border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Warnings</span>
                    <span className="text-xl font-bold font-mono text-amber-800 mt-1">{summary.warningChecks}</span>
                    <span className="text-[10px] text-amber-600">Minor deviations</span>
                  </div>
                  <div className={`p-3 rounded border flex flex-col justify-between ${summary.failedChecks > 0 ? 'border-rose-300 bg-rose-50/60' : 'border-surface-border bg-surface-bg'}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${summary.failedChecks > 0 ? 'text-rose-700' : 'text-ink-secondary'}`}>Failed</span>
                    <span className={`text-xl font-bold font-mono mt-1 ${summary.failedChecks > 0 ? 'text-rose-700' : 'text-navy'}`}>{summary.failedChecks}</span>
                    <span className="text-[10px] text-ink-secondary">Failed checks</span>
                  </div>
                  <div className="p-3 rounded border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Review Req.</span>
                    <span className="text-xl font-bold font-mono text-indigo-800 mt-1">{summary.reviewRequiredChecks}</span>
                    <span className="text-[10px] text-indigo-600">Manual inspection</span>
                  </div>
                </div>

                {/* Explainable Scoring Breakdown */}
                {latestVerification.scoringBreakdown && latestVerification.scoringBreakdown.length > 0 && (
                  <div className="mt-5 space-y-2 pt-4 border-t border-surface-border">
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
                      Score Breakdown Factors:
                    </h3>
                    {latestVerification.scoringBreakdown.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-surface-bg border border-surface-border text-xs flex items-start justify-between gap-4">
                        <div>
                          <span className="font-semibold text-navy block">{item.factor}</span>
                          <span className="text-ink-secondary text-[11px] mt-0.5 block">{item.description}</span>
                        </div>
                        <span className={`font-mono font-bold shrink-0 ${item.impact > 0 ? 'text-status-warning' : 'text-slate-500'}`}>
                          {item.impact > 0 ? `+${item.impact}` : '0'} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. CROSS-DOCUMENT & APPLICATION MATCHING MATRIX (Pillar 5) */}
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-surface-border gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                      Cross-Document &amp; Application Form Matching Matrix
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      Field-by-field reconciliation between submitted application form and extracted certificate scans.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-surface-border rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-bg border-b border-surface-border font-bold text-navy">
                      <tr>
                        <th className="p-2.5 w-48">Field</th>
                        <th className="p-2.5 w-52">Application Value</th>
                        <th className="p-2.5 w-52">Document Value</th>
                        <th className="p-2.5 w-36">Result</th>
                        <th className="p-2.5">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border font-medium bg-white">
                      {comparisons.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 font-semibold text-navy">{c.field}</td>
                          <td className="p-2.5 font-mono text-slate-800 bg-slate-50/50 text-[11px]">{c.applicationValue || 'N/A'}</td>
                          <td className="p-2.5 font-mono text-slate-800 bg-slate-50/50 text-[11px]">{c.documentValue || 'N/A'}</td>
                          <td className="p-2.5">
                            <ValidationBadge result={c.result || (c.status === 'Matched' ? 'PASS' : c.status === 'Mismatch detected' ? 'FAIL' : 'REVIEW REQUIRED')} />
                          </td>
                          <td className="p-2.5 text-ink-secondary text-[11px] leading-relaxed">{c.explanation || c.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. DOCUMENT-WISE EXPANDABLE VALIDATION CARDS (Pillars 1, 3, 4, 6) */}
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-border gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                      Document-Wise Verification Cards ({displayCards.length})
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      Detailed findings, extracted fields, OCR extraction confidence, and validity periods.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAllCards(true)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-surface-border rounded hover:bg-slate-50 text-navy"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllCards(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-surface-border rounded hover:bg-slate-50 text-navy"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {displayCards.map((card) => {
                    const isExpanded = expandedCards[card.documentCategory] !== false; // default open
                    const isMissing = card.status === 'MISSING';
                    const cardBorder = 
                      card.status === 'PASS' ? 'border-emerald-200' :
                      card.status === 'WARNING' ? 'border-amber-300' :
                      card.status === 'FAIL' ? 'border-rose-300' :
                      card.status === 'MISSING' ? 'border-red-300 bg-red-50/20' :
                      'border-indigo-200';

                    return (
                      <div key={card.documentCategory} className={`rounded border ${cardBorder} bg-white shadow-sm transition-all overflow-hidden`}>
                        {/* Card Header (Clickable Toggle) */}
                        <div
                          onClick={() => toggleCard(card.documentCategory)}
                          className="p-3.5 bg-surface-bg flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className={`w-4 h-4 ${isMissing ? 'text-red-500' : 'text-navy'}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-navy">{card.documentCategory}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                  card.mandatory ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {card.mandatory ? 'Required' : 'Optional'}
                                </span>
                              </div>
                              <div className="text-[11px] text-ink-secondary mt-0.5">
                                {card.originalFileName ? (
                                  <span>File: <strong className="text-slate-800 font-mono">{card.originalFileName}</strong></span>
                                ) : (
                                  <span className="text-red-600 italic">No document file attached</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <ValidationBadge result={card.status} />
                            <button
                              type="button"
                              aria-label="Toggle card details"
                              className="p-1 rounded text-ink-secondary hover:text-navy"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Card Body (Collapsible) */}
                        {isExpanded && (
                          <div className="p-4 space-y-3.5 border-t border-surface-border text-xs bg-white">
                            {/* Primary Finding Alert Box */}
                            <div className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
                              card.status === 'PASS' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
                              card.status === 'WARNING' ? 'bg-amber-50/80 border-amber-300 text-amber-900' :
                              card.status === 'FAIL' || card.status === 'MISSING' ? 'bg-rose-50/80 border-rose-300 text-rose-900' :
                              'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                            }`}>
                              <div className="mt-0.5 shrink-0">
                                {card.status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                {card.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                                {(card.status === 'FAIL' || card.status === 'MISSING') && <XCircle className="w-4 h-4 text-rose-600" />}
                                {card.status === 'REVIEW REQUIRED' && <HelpCircle className="w-4 h-4 text-indigo-600" />}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-bold block text-xs">Finding: {card.primaryFinding || card.findingReason}</span>
                                {card.findingReason && card.findingReason !== card.primaryFinding && (
                                  <p className="text-[11px] text-slate-700 leading-relaxed">{card.findingReason}</p>
                                )}
                              </div>
                            </div>

                            {/* Corrective Action */}
                            {card.correctiveAction && (
                              <div className="p-2.5 rounded bg-surface-bg border border-surface-border text-[11px] flex items-start gap-2 text-navy">
                                <Info className="w-3.5 h-3.5 text-royal shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-navy">Recommended Action: </span>
                                  <span className="text-ink-secondary">{card.correctiveAction}</span>
                                </div>
                              </div>
                            )}

                            {/* Extracted Details & OCR Confidence */}
                            {card.extractedInfo ? (
                              <div className="p-3 rounded bg-surface-bg border border-surface-border space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-border text-[11px]">
                                  <span className="font-bold text-navy uppercase tracking-wider">
                                    Extracted Field Details
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                      card.isSimulated
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    }`}>
                                      {card.isSimulated ? 'DEMO / SIMULATED OCR' : `OCR: ${card.provider || 'Engine'}`}
                                    </span>
                                    {card.confidence !== null && card.confidence !== undefined && (
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-surface-border text-navy">
                                        {Math.round(card.confidence)}% Confidence
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
                                  {card.extractedInfo.fullName && (
                                    <div>
                                      <span className="text-ink-secondary block">Extracted Name:</span>
                                      <span className="font-semibold text-navy">{card.extractedInfo.fullName}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.fatherName && (
                                    <div>
                                      <span className="text-ink-secondary block">Father / Guardian:</span>
                                      <span className="font-semibold text-navy">{card.extractedInfo.fatherName}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.dateOfBirth && (
                                    <div>
                                      <span className="text-ink-secondary block">Date of Birth:</span>
                                      <span className="font-semibold text-navy font-mono">{card.extractedInfo.dateOfBirth}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.gender && (
                                    <div>
                                      <span className="text-ink-secondary block">Gender:</span>
                                      <span className="font-semibold text-navy">{card.extractedInfo.gender}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.address && (
                                    <div className="sm:col-span-2">
                                      <span className="text-ink-secondary block">Address:</span>
                                      <span className="font-semibold text-navy">{card.extractedInfo.address}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.documentNumber && (
                                    <div>
                                      <span className="text-ink-secondary block">Certificate / Doc No:</span>
                                      <span className="font-mono font-semibold text-navy">{card.extractedInfo.documentNumber}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.rollNumber && (
                                    <div>
                                      <span className="text-ink-secondary block">Roll / Reg Number:</span>
                                      <span className="font-mono font-semibold text-navy">{card.extractedInfo.rollNumber}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.institutionName && (
                                    <div>
                                      <span className="text-ink-secondary block">Institution:</span>
                                      <span className="font-semibold text-navy">{card.extractedInfo.institutionName}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.marksObtained !== undefined && card.extractedInfo.marksObtained !== null && (
                                    <div>
                                      <span className="text-ink-secondary block">Marks &amp; Percentage:</span>
                                      <span className="font-mono font-semibold text-navy">
                                        {card.extractedInfo.marksObtained} / {card.extractedInfo.maximumMarks || 'N/A'}
                                        {card.extractedInfo.percentage ? ` (${card.extractedInfo.percentage}%)` : ''}
                                      </span>
                                    </div>
                                  )}
                                  {card.extractedInfo.annualIncome !== undefined && card.extractedInfo.annualIncome !== null && (
                                    <div>
                                      <span className="text-ink-secondary block">Extracted Income:</span>
                                      <span className="font-mono font-semibold text-navy">
                                        Rs. {Number(card.extractedInfo.annualIncome).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  )}
                                  {card.extractedInfo.issueDate && (
                                    <div>
                                      <span className="text-ink-secondary block">Issue Date:</span>
                                      <span className="font-mono font-semibold text-navy">{card.extractedInfo.issueDate}</span>
                                    </div>
                                  )}
                                  {card.extractedInfo.expiryDate && (
                                    <div>
                                      <span className="text-ink-secondary block">Expiry Date:</span>
                                      <span className="font-mono font-semibold text-navy">{card.extractedInfo.expiryDate}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : !isMissing && (
                              <p className="text-ink-secondary text-[11px] italic">
                                Extracted field data pending or unreadable from scanned file.
                              </p>
                            )}

                            {/* Expiry & Validity Period Box (Pillar 3) */}
                            {card.expiryResult && (
                              <div className="p-3 rounded bg-surface-bg border border-surface-border space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-royal" />
                                    Validity &amp; Expiry Verification
                                  </span>
                                  <ValidationBadge result={card.expiryResult.result} size="xs" />
                                </div>
                                <p className="text-slate-700 leading-relaxed">
                                  {card.expiryResult.explanation}
                                </p>
                                {(card.expiryResult.issueDate || card.expiryResult.expiryDate) && (
                                  <div className="flex gap-4 font-mono text-[10px] text-ink-secondary pt-1">
                                    {card.expiryResult.issueDate && <span>Issued: {card.expiryResult.issueDate}</span>}
                                    {card.expiryResult.expiryDate && <span>Expires: {card.expiryResult.expiryDate}</span>}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Document Field Comparisons Table */}
                            {card.fieldComparisons && card.fieldComparisons.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="font-bold text-navy text-[11px] uppercase tracking-wider block">
                                  Field-by-Field Reconciliation
                                </span>
                                <div className="border border-surface-border rounded overflow-hidden">
                                  <table className="w-full text-left text-[11px]">
                                    <thead className="bg-surface-bg font-bold text-navy border-b border-surface-border">
                                      <tr>
                                        <th className="p-2 w-36">Field</th>
                                        <th className="p-2">Application Form</th>
                                        <th className="p-2">Extracted Document</th>
                                        <th className="p-2 w-28">Result</th>
                                        <th className="p-2">Reason</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border bg-white">
                                      {card.fieldComparisons.map((fc, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                          <td className="p-2 font-semibold text-navy">{fc.field}</td>
                                          <td className="p-2 font-mono text-slate-800">{fc.applicationValue || 'N/A'}</td>
                                          <td className="p-2 font-mono text-slate-800">{fc.documentValue || 'N/A'}</td>
                                          <td className="p-2">
                                            <ValidationBadge result={fc.result || (fc.status === 'Matched' ? 'PASS' : fc.status === 'Mismatch detected' ? 'FAIL' : 'REVIEW REQUIRED')} size="xs" />
                                          </td>
                                          <td className="p-2 text-ink-secondary text-[10px]">{fc.explanation || fc.message}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Rule Results */}
              <div className="bg-surface-card p-6 rounded-lg border border-surface-border shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                  Explainable Rule-Based Checks
                </h3>

                <div className="space-y-2">
                  {latestVerification.ruleResults?.map((r, idx) => (
                    <div key={idx} className="p-3 rounded-md border border-surface-border bg-surface-bg text-xs flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-navy">{r.ruleName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 uppercase font-medium">
                            {r.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-secondary">{r.explanation}</p>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span className="font-medium">Evidence:</span> {r.evidence}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                        r.status === 'Pass' ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface-card p-12 text-center text-ink-secondary text-xs rounded-lg border border-surface-border">
              <SearchCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>Automated verification pipeline has not run yet. Submit your application or request a check.</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Activity & Audit Trail */}
      {activeTab === 'activity' && (
        <div className="bg-surface-card rounded-lg border border-surface-border shadow-sm p-6 space-y-4">
          <div className="border-b border-surface-border pb-4">
            <h2 className="text-sm font-bold text-navy">Application Audit Trail</h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Immutable chronological record of administrative actions, uploads, and automated verification runs.
            </p>
          </div>

          <div className="space-y-3">
            {auditEvents.map((evt, i) => (
              <div key={i} className="p-3 rounded-md bg-surface-bg border border-surface-border text-xs flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-navy">{evt.action}</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-white border border-surface-border text-ink-secondary">
                      {evt.actorName} ({evt.actorRole})
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-secondary">{evt.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-500 block">
                    {new Date(evt.timestamp).toLocaleString('en-IN')}
                  </span>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-status-success">
                    {evt.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        applicationId={application._id || application.id}
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => { loadDetails(); }}
        preselectedCategory={selectedUploadCategory}
      />
    </div>
  );
}
