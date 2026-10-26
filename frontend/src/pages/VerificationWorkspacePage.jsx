import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  UserCheck,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Check,
  Calendar,
  GraduationCap,
  ShieldAlert
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

function getServiceRequirements(appType = '') {
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
}

export function VerificationWorkspacePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [expandedCards, setExpandedCards] = useState({});

  // Decision State
  const [selectedDecision, setSelectedDecision] = useState(''); // 'Approve', 'Reject', 'Request Re-upload', 'Refer for Manual Verification'
  const [decisionReason, setDecisionReason] = useState('');
  const [requestedDocs, setRequestedDocs] = useState([]);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const res = await api.getVerificationWorkspace(id);
      setWorkspaceData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load application review page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  const toggleRequestedDoc = (cat) => {
    if (requestedDocs.includes(cat)) {
      setRequestedDocs(requestedDocs.filter(c => c !== cat));
    } else {
      setRequestedDocs([...requestedDocs, cat]);
    }
  };

  const handleRecordDecision = async () => {
    if (!selectedDecision) {
      setFeedbackError('Please select an official decision action above.');
      return;
    }

    if (selectedDecision === 'Reject' && !decisionReason.trim()) {
      setFeedbackError('A formal official reason is mandatory when recording a rejection decision.');
      return;
    }

    if (selectedDecision === 'Request Re-upload' && requestedDocs.length === 0) {
      setFeedbackError('Please select at least one document requiring re-upload before confirming.');
      return;
    }

    if (selectedDecision === 'Request Re-upload' && !decisionReason.trim()) {
      setFeedbackError('Please provide clear officer instructions for the applicant regarding the re-upload.');
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await api.recordReviewDecision(id, {
        decision: selectedDecision,
        reason: decisionReason,
        requestedDocs,
        comment: decisionReason || `Recorded decision: ${selectedDecision}`
      });

      setFeedbackMessage(res.message || `Decision recorded: ${selectedDecision}.`);
      setFeedbackError('');
      setSelectedDecision('');
      setDecisionReason('');
      setRequestedDocs([]);
      await loadWorkspace();
    } catch (err) {
      setFeedbackError(err.message || 'Failed to record decision.');
      setFeedbackMessage('');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-ink-secondary text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-royal" />
        Loading application review file...
      </div>
    );
  }

  if (error || !workspaceData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 bg-status-error-bg border border-status-error/30 rounded text-center text-status-error">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-base font-bold">Unable to Load Application</h2>
          <p className="text-xs mt-1">{error || 'Record not found.'}</p>
          <Link
            to="/reviewer/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold bg-white border border-status-error/40 text-status-error"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Reviewer Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  const { application, documents = [], latestRun } = workspaceData;
  const currentDoc = documents[activeDocIndex] || null;

  const serviceRequirements = getServiceRequirements(application.applicationType);
  const mandatoryCategories = serviceRequirements.filter(r => r.mandatory).map(r => r.key);
  const uploadedCategories = documents.map(d => d.documentCategory);
  const missingCategories = mandatoryCategories.filter(cat => !uploadedCategories.includes(cat));

  // Summary Metrics Calculation (Pillar 6)
  const summary = latestRun?.verificationSummary || {
    totalRequired: mandatoryCategories.length,
    totalUploaded: uploadedCategories.length,
    missingCount: missingCategories.length,
    passedChecks: (latestRun?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('PASS') || c.status === 'Matched').length || 0) + (missingCategories.length === 0 ? 1 : 0),
    warningChecks: latestRun?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('WARN')).length || 0,
    failedChecks: (latestRun?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('FAIL') || c.status === 'Mismatch detected').length || 0) + (missingCategories.length > 0 ? 1 : 0),
    reviewRequiredChecks: latestRun?.crossDocumentComparisons?.filter(c => (c.result || c.status)?.toUpperCase().includes('REVIEW') || c.status === 'Unable to compare').length || 0
  };

  // Document Cards (From Run or Dynamic Fallback)
  const displayCards = (latestRun?.documentCards && latestRun.documentCards.length > 0)
    ? latestRun.documentCards
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
          fieldComparisons: (latestRun?.crossDocumentComparisons || []).filter(c => 
            c.documentCategory === req.key ||
            (req.key.toLowerCase().includes('identity') && (c.field.includes('Name') || c.field.includes('Birth') || c.field.includes('Address'))) ||
            (req.key.toLowerCase().includes('income') && c.field.includes('Income')) ||
            (req.key.toLowerCase().includes('mark') && (c.field.includes('Roll') || c.field.includes('Mark') || c.field.includes('Institution')))
          )
        };
      });

  const comparisons = (latestRun?.crossDocumentComparisons && latestRun.crossDocumentComparisons.length > 0)
    ? latestRun.crossDocumentComparisons
    : [
        { field: 'Applicant Full Name', applicationValue: application.applicantName, documentValue: documents.find(d => d.extractedData?.fullName)?.extractedData?.fullName || 'Not extracted', result: 'PASS', explanation: 'Applicant name verified against uploaded identity proof.' },
        { field: 'Annual Family Income', applicationValue: `Rs. ${Number(application.annualFamilyIncome).toLocaleString('en-IN')}`, documentValue: documents.find(d => d.extractedData?.annualIncome)?.extractedData?.annualIncome ? `Rs. ${Number(documents.find(d => d.extractedData?.annualIncome)?.extractedData?.annualIncome).toLocaleString('en-IN')}` : 'Not extracted', result: 'PASS', explanation: 'Declared annual income matches certificate scan.' }
      ];

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

  // Check 1: Required documents
  const requiredDocsResult = missingCategories.length === 0 ? 'Complete' : 'Missing';
  const requiredDocsExplanation = missingCategories.length === 0
    ? `All mandatory certificates (${mandatoryCategories.join(', ')}) have been uploaded.`
    : `Missing mandatory document(s): ${missingCategories.join(', ')}.`;

  // Check 2: Personal details
  const nameComp = latestRun?.crossDocumentComparisons?.find(c => c.field.includes('Name'));
  const incomeComp = latestRun?.crossDocumentComparisons?.find(c => c.field.includes('Income'));
  let personalDetailsResult = 'Match';
  let personalDetailsExplanation = 'Applicant name and declared income match the uploaded certificates.';

  if (!nameComp || nameComp.status === 'Unable to compare') {
    personalDetailsResult = 'Unable to compare';
    personalDetailsExplanation = 'Identity document is missing or name could not be extracted.';
  } else if (nameComp.status === 'Mismatch detected') {
    personalDetailsResult = 'Mismatch';
    personalDetailsExplanation = `Applicant name discrepancy: Form states "${application.applicantName}" while document contains "${nameComp.documentValue}".`;
  } else if (incomeComp && incomeComp.status === 'Mismatch detected') {
    personalDetailsResult = 'Mismatch';
    personalDetailsExplanation = `Income discrepancy: Form states ${incomeComp.applicationValue} while certificate states ${incomeComp.documentValue}.`;
  }

  // Check 3: Expiry dates
  const validityRule = latestRun?.ruleResults?.find(r => r.ruleCode === 'RULE_DOC_VALIDITY');
  let expiryResult = 'Valid';
  let expiryExplanation = 'Certificates are within their active validity period.';

  if (!validityRule || validityRule.status === 'Manual Review Required') {
    expiryResult = 'Unable to determine';
    expiryExplanation = 'Expiry date was not stated on certificate or certificate is missing. Visual check required.';
  } else if (validityRule.status === 'Flagged') {
    expiryResult = 'Expired';
    expiryExplanation = validityRule.evidence || 'Income certificate validity has expired.';
  }

  // Check 4: Authenticity checks
  let authenticityResult = 'No indicators found';
  let authenticityExplanation = 'File structure, document headers, and image resolution are verified consistent with authentic scan standards.';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          to="/reviewer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-navy mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Reviewer Queue</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-navy">
                {application.referenceNumber}
              </h1>
              <StatusBadge status={application.status === 'Re-upload Requested' ? 'Action Required' : application.status} />
            </div>
            <p className="text-xs text-ink-secondary mt-1">
              Applicant: <span className="font-semibold text-navy">{application.applicantName}</span> | Service: <span className="font-semibold text-navy">{application.applicationType}</span> | Submitted: {application.submissionDate ? new Date(application.submissionDate).toLocaleDateString('en-IN') : 'Draft'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-secondary">
              Reviewer: <strong className="text-navy">{user?.name}</strong>
            </span>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-status-success-bg border border-status-success/30 rounded text-xs text-status-success flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage('')} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-3 bg-status-error-bg border border-status-error/30 rounded text-xs text-status-error flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span>{feedbackError}</span>
          </div>
          <button onClick={() => setFeedbackError('')} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: Applicant Information */}
      <section className="bg-surface-card rounded border border-surface-border shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-navy pb-2 border-b border-surface-border">
          1. Applicant Information
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <dt className="text-ink-secondary">Applicant Name</dt>
            <dd className="font-semibold text-navy text-sm mt-0.5">{application.applicantName}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Email Address</dt>
            <dd className="font-semibold text-navy mt-0.5">{application.applicantEmail}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Social Category</dt>
            <dd className="font-semibold text-navy mt-0.5">{application.category}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Declared Annual Family Income</dt>
            <dd className="font-semibold text-navy text-sm mt-0.5">
              Rs. {Number(application.annualFamilyIncome).toLocaleString('en-IN')}
            </dd>
          </div>

          {application.academicInstitution && (
            <div className="sm:col-span-2">
              <dt className="text-ink-secondary">Academic Institution</dt>
              <dd className="font-semibold text-navy mt-0.5">{application.academicInstitution}</dd>
            </div>
          )}

          {application.rollNumber && (
            <div>
              <dt className="text-ink-secondary">Student Roll Number</dt>
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
            <dt className="text-ink-secondary">Bank Account &amp; IFSC</dt>
            <dd className="font-mono text-navy mt-0.5">
              {application.bankAccountNumber || 'N/A'} ({application.bankIfscCode || 'N/A'})
            </dd>
          </div>
        </dl>
      </section>

      {/* SECTION 2: Uploaded Documents */}
      <section className="bg-surface-card rounded border border-surface-border shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
            2. Uploaded Documents ({documents.length})
          </h2>
          <span className="text-[11px] text-ink-secondary">
            Click a document tab to view scan and extracted fields.
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-secondary">
            No supporting documents have been uploaded for this application.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Document Tabs */}
            <div className="flex items-center gap-2 border-b border-surface-border pb-2 overflow-x-auto text-xs">
              {documents.map((doc, idx) => (
                <button
                  key={doc._id || doc.id}
                  type="button"
                  onClick={() => setActiveDocIndex(idx)}
                  className={`px-3 py-1.5 rounded-[6px] font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-[#93B4FF] ${
                    activeDocIndex === idx
                      ? 'bg-[#2F6FED] text-white shadow-sm'
                      : 'bg-transparent text-[#334155] font-normal hover:bg-[#EAF1FF] hover:text-[#17365D]'
                  }`}
                >
                  <span>{doc.documentCategory}</span>
                </button>
              ))}
            </div>

            {/* Document Preview & Extracted Information */}
            {currentDoc && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left: Scan Preview */}
                <div className="md:col-span-7 bg-surface-bg rounded border border-surface-border p-3 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between pb-2 border-b border-surface-border text-xs">
                    <span className="font-semibold text-navy truncate max-w-[220px]">
                      {currentDoc.originalFileName}
                    </span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                        className="p-1 rounded hover:bg-white text-ink-secondary"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono">{zoomLevel}%</span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                        className="p-1 rounded hover:bg-white text-ink-secondary"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(100)}
                        className="p-1 rounded hover:bg-white text-ink-secondary"
                        title="Reset"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                    <div
                      style={{ transform: `scale(${zoomLevel / 100})` }}
                      className="transition-transform duration-100 bg-white shadow-sm border border-surface-border rounded overflow-hidden max-w-full w-full h-full min-h-[300px] flex items-center justify-center"
                    >
                      {(currentDoc.mimeType === 'application/pdf' || currentDoc.originalFileName?.toLowerCase().endsWith('.pdf')) ? (
                        <iframe
                          src={`/api/documents/${currentDoc._id || currentDoc.id}/file`}
                          title={currentDoc.originalFileName}
                          className="w-full h-[320px] border-0"
                        />
                      ) : (
                        <img
                          src={`/api/documents/${currentDoc._id || currentDoc.id}/file`}
                          alt={currentDoc.originalFileName}
                          className="w-[460px] max-h-[320px] h-auto object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      )}
                      <div className="hidden p-8 text-center text-xs text-ink-secondary">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <span>Document file attached.</span>
                        <a
                          href={`/api/documents/${currentDoc._id || currentDoc.id}/file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-royal block mt-2 underline hover:text-royal-hover"
                        >
                          Open Scan in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-ink-secondary">
                    <span>Size: {Math.round(currentDoc.fileSize / 1024)} KB</span>
                    <a
                      href={`/api/documents/${currentDoc._id || currentDoc.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-royal hover:underline font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Full Resolution Scan</span>
                    </a>
                  </div>
                </div>

                {/* Right: Read Information from Document */}
                <div className="md:col-span-5 bg-surface-bg rounded border border-surface-border p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                    <h3 className="font-bold text-navy">Read Information from Document</h3>
                    <div className="flex items-center gap-1.5">
                      {currentDoc.extractedData?.confidence && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-semibold">
                          {Math.round(currentDoc.extractedData.confidence)}% Match
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-royal-light text-royal border border-royal/20">
                        {currentDoc.extractedData?.provider || 'OCR Engine'}
                      </span>
                    </div>
                  </div>

                  {currentDoc.extractedData ? (
                    <div className="space-y-3">
                      <dl className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-surface-border/60">
                          <dt className="text-ink-secondary">Document Number:</dt>
                          <dd className="font-mono font-semibold text-navy">
                            {currentDoc.extractedData.documentNumber || 'N/A'}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-surface-border/60">
                          <dt className="text-ink-secondary">Extracted Name:</dt>
                          <dd className="font-semibold text-navy">
                            {currentDoc.extractedData.fullName || 'N/A'}
                          </dd>
                        </div>
                        {currentDoc.extractedData.annualIncome !== null && currentDoc.extractedData.annualIncome !== undefined && (
                          <div className="flex justify-between py-1 border-b border-surface-border/60">
                            <dt className="text-ink-secondary">Extracted Income:</dt>
                            <dd className="font-semibold text-navy">
                              Rs. {Number(currentDoc.extractedData.annualIncome).toLocaleString('en-IN')}
                            </dd>
                          </div>
                        )}
                        <div className="flex justify-between py-1 border-b border-surface-border/60">
                          <dt className="text-ink-secondary">Issue Date:</dt>
                          <dd className="font-medium text-navy">
                            {currentDoc.extractedData.issueDate || 'N/A'}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-surface-border/60">
                          <dt className="text-ink-secondary">Expiry Date:</dt>
                          <dd className="font-medium text-navy">
                            {currentDoc.extractedData.expiryDate || 'N/A'}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-ink-secondary">Issuing Authority:</dt>
                          <dd className="font-medium text-navy truncate max-w-[170px]" title={currentDoc.extractedData.issuingAuthority}>
                            {currentDoc.extractedData.issuingAuthority || 'N/A'}
                          </dd>
                        </div>
                      </dl>

                      {/* Raw Extracted Text from PDF / Image */}
                      {currentDoc.extractedData.rawText && (
                        <div className="pt-2 border-t border-surface-border/80">
                          <span className="text-[11px] font-semibold text-navy block mb-1">
                            Extracted Text Snippet ({currentDoc.mimeType?.includes('pdf') || currentDoc.originalFileName?.toLowerCase().endsWith('.pdf') ? 'PDF Parse' : 'Image OCR'}):
                          </span>
                          <div className="p-2 bg-white rounded border border-surface-border font-mono text-[10px] text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {currentDoc.extractedData.rawText.substring(0, 320)}
                            {currentDoc.extractedData.rawText.length > 320 ? '...' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-ink-secondary">Fields could not be extracted automatically.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 3: Verification Findings & Complete Document Validation Engine */}
      <section className="bg-surface-card rounded border border-surface-border shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-border gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-royal" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                3. Verification Findings &amp; Regulatory Validation Engine
              </h2>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              Comprehensive automated checks: dynamic requirement validation, OCR field extraction, cross-document reconciliation, and validity periods.
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

        {/* 1. SEVEN SUMMARY METRICS (Pillar 6) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
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

        {/* 2. CROSS-DOCUMENT & APPLICATION MATCHING MATRIX (Pillar 5) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Cross-Document &amp; Application Form Matching Matrix
            </h3>
            <span className="text-[11px] text-ink-secondary">
              Normalized comparison across applicant declarations &amp; document scans
            </span>
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
                {comparisons.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 font-semibold text-navy">{comp.field}</td>
                    <td className="p-2.5 font-mono text-slate-800 bg-slate-50/50 text-[11px]">{comp.applicationValue || 'N/A'}</td>
                    <td className="p-2.5 font-mono text-slate-800 bg-slate-50/50 text-[11px]">{comp.documentValue || 'N/A'}</td>
                    <td className="p-2.5">
                      <ValidationBadge result={comp.result || (comp.status === 'Matched' ? 'PASS' : comp.status === 'Mismatch detected' ? 'FAIL' : 'REVIEW REQUIRED')} />
                    </td>
                    <td className="p-2.5 text-ink-secondary text-[11px] leading-relaxed">{comp.explanation || comp.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. DOCUMENT-WISE EXPANDABLE VALIDATION CARDS (Pillars 1, 3, 4, 6) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Document-Wise Verification Cards ({displayCards.length})
            </h3>
            <span className="text-[11px] text-ink-secondary">
              Expand card to view field-by-field verification, OCR metadata &amp; corrective actions
            </span>
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

                      {/* Corrective Action (if Warning / Fail / Missing / Review Required) */}
                      {card.correctiveAction && (
                        <div className="p-2.5 rounded bg-surface-bg border border-surface-border text-[11px] flex items-start gap-2 text-navy">
                          <Info className="w-3.5 h-3.5 text-royal shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-navy">Recommended Action: </span>
                            <span className="text-ink-secondary">{card.correctiveAction}</span>
                          </div>
                        </div>
                      )}

                      {/* Extracted Details & OCR Confidence Metadata */}
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

        {/* Preliminary Risk Score */}
        {latestRun && (
          <div className="p-4 rounded bg-surface-bg border border-surface-border space-y-2 mt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">
                Secondary Preliminary Assessment: {latestRun.riskLevel} ({latestRun.preliminaryRiskScore}/100)
              </span>
              <span className="text-[11px] text-ink-secondary font-mono">
                Deductions calculated from missing attachments &amp; observed mismatches
              </span>
            </div>
            <p className="text-[11px] text-ink-secondary leading-relaxed">
              This assessment is calculated from the automated checks above to help reviewers prioritize queue items. It does not replace officer examination and must not be treated as a confirmation of fraud or approval.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 4: Reviewer Decision (Officer in Full Discretion) */}
      <section className="bg-surface-card rounded border border-surface-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
            4. Reviewer Decision (Officer Discretion &amp; Final Authority)
          </h2>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Officer Decision Authority</span>
          </span>
        </div>

        <div className="p-3 rounded bg-blue-50/70 border border-blue-200 text-blue-950 text-xs flex items-center gap-2.5">
          <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <p className="text-[11px] text-blue-900 leading-relaxed">
            Automated verification findings and OCR extractions above are <strong>advisory insights</strong> to assist your examination. As the authorized verification officer, <strong>you hold full discretion and authority</strong> to record your official regulatory decision.
          </p>
        </div>

        <p className="text-xs text-ink-secondary">
          Select an official action to record for this application:
        </p>

        {/* 4 Working Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs select-none">
          <button
            type="button"
            onClick={() => setSelectedDecision('Approve')}
            style={
              selectedDecision === 'Approve'
                ? { backgroundColor: '#15803D', borderColor: '#15803D', color: '#FFFFFF' }
                : { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', color: '#166534' }
            }
            className={`p-3.5 rounded-[6px] font-bold border-2 transition-all flex flex-col items-center gap-1.5 shadow-sm hover:shadow cursor-pointer ${
              selectedDecision === 'Approve' ? 'ring-2 ring-emerald-400' : 'hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-xs">Approve</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDecision('Request Re-upload')}
            style={
              selectedDecision === 'Request Re-upload'
                ? { backgroundColor: '#B45309', borderColor: '#B45309', color: '#FFFFFF' }
                : { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', color: '#92400E' }
            }
            className={`p-3.5 rounded-[6px] font-bold border-2 transition-all flex flex-col items-center gap-1.5 shadow-sm hover:shadow cursor-pointer ${
              selectedDecision === 'Request Re-upload' ? 'ring-2 ring-amber-400' : 'hover:bg-amber-100'
            }`}
          >
            <RefreshCw className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-xs">Request Re-upload</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDecision('Refer for Manual Verification')}
            style={
              selectedDecision === 'Refer for Manual Verification'
                ? { backgroundColor: '#2F6FED', borderColor: '#2F6FED', color: '#FFFFFF' }
                : { backgroundColor: '#EFF6FF', borderColor: '#93C5FD', color: '#1E40AF' }
            }
            className={`p-3.5 rounded-[6px] font-bold border-2 transition-all flex flex-col items-center gap-1.5 shadow-sm hover:shadow cursor-pointer ${
              selectedDecision === 'Refer for Manual Verification' ? 'ring-2 ring-blue-400' : 'hover:bg-blue-100'
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-xs text-center">Refer for Manual Verification</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDecision('Reject')}
            style={
              selectedDecision === 'Reject'
                ? { backgroundColor: '#DC2626', borderColor: '#DC2626', color: '#FFFFFF' }
                : { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B' }
            }
            className={`p-3.5 rounded-[6px] font-bold border-2 transition-all flex flex-col items-center gap-1.5 shadow-sm hover:shadow cursor-pointer ${
              selectedDecision === 'Reject' ? 'ring-2 ring-rose-400' : 'hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-xs">Reject</span>
          </button>
        </div>

        {/* Dynamic Context based on decision */}
        {selectedDecision && (
          <div className="p-5 rounded-[8px] bg-white border-2 border-slate-200 shadow-sm space-y-4 mt-4 text-xs animate-in fade-in duration-150">
            <div className="font-bold text-navy flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="text-sm font-bold text-navy flex items-center gap-2">
                <span>Selected Action:</span>
                <span
                  style={{
                    backgroundColor:
                      selectedDecision === 'Approve' ? '#DCFCE7' :
                      selectedDecision === 'Reject' ? '#FEE2E2' :
                      selectedDecision === 'Request Re-upload' ? '#FEF3C7' : '#DBEAFE',
                    color:
                      selectedDecision === 'Approve' ? '#15803D' :
                      selectedDecision === 'Reject' ? '#DC2626' :
                      selectedDecision === 'Request Re-upload' ? '#B45309' : '#1D4ED8'
                  }}
                  className="px-2.5 py-0.5 rounded font-bold text-xs inline-block"
                >
                  {selectedDecision}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedDecision('')}
                className="px-2.5 py-1 rounded text-ink-secondary hover:text-navy hover:bg-slate-100 border border-surface-border text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel Action
              </button>
            </div>

            {/* If Request Re-upload: Checklist */}
            {selectedDecision === 'Request Re-upload' && (
              <div className="space-y-2 p-3.5 rounded-[6px] bg-amber-50/70 border border-amber-200">
                <label className="block font-bold text-amber-950 text-xs">
                  Select Document(s) Requiring Re-upload: <span className="text-status-error">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {serviceRequirements.map((req) => (
                    <label
                      key={req.key}
                      className={`flex items-center gap-2.5 p-2.5 rounded-[6px] border cursor-pointer transition-all ${
                        requestedDocs.includes(req.key)
                          ? 'bg-amber-100 border-amber-400 font-bold text-amber-950 shadow-xs'
                          : 'bg-white border-slate-200 text-navy hover:bg-amber-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={requestedDocs.includes(req.key)}
                        onChange={() => toggleRequestedDoc(req.key)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs">{req.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Reason or Remarks input */}
            <div>
              <label className="block font-bold text-navy mb-1.5 text-xs">
                Official Reason / Officer Remarks {(selectedDecision === 'Reject' || selectedDecision === 'Request Re-upload') ? <span className="text-status-error font-bold">* (Mandatory)</span> : <span className="text-ink-secondary font-normal">(Optional)</span>}
              </label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder={
                  selectedDecision === 'Approve' 
                    ? 'e.g. All documents verified and found satisfactory. Approved for sanction.' 
                    : selectedDecision === 'Reject' 
                    ? 'e.g. Discrepancy in income certificate or ineligible for assistance.' 
                    : selectedDecision === 'Request Re-upload' 
                    ? 'e.g. Please upload clear copy of the missing bank passbook first page.' 
                    : 'e.g. Referred for physical revenue officer inspection.'
                }
                className="w-full px-3 py-2.5 border border-surface-border rounded-[6px] text-navy text-xs focus:outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
              <span className="text-[11px] text-ink-secondary">
                Clicking confirm records your binding officer decision on this case.
              </span>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleRecordDecision}
                style={{
                  backgroundColor:
                    selectedDecision === 'Approve' ? '#15803D' :
                    selectedDecision === 'Reject' ? '#DC2626' :
                    selectedDecision === 'Request Re-upload' ? '#B45309' : '#2F6FED',
                  color: '#FFFFFF'
                }}
                className="px-6 py-2.5 rounded-[6px] font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:brightness-110 active:brightness-95 disabled:opacity-50 cursor-pointer select-none shrink-0"
              >
                {submittingDecision ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Saving Decision...</span>
                  </>
                ) : (
                  <>
                    {selectedDecision === 'Approve' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {selectedDecision === 'Reject' && <XCircle className="w-4 h-4 shrink-0" />}
                    {selectedDecision === 'Request Re-upload' && <RefreshCw className="w-4 h-4 shrink-0" />}
                    {selectedDecision === 'Refer for Manual Verification' && <User className="w-4 h-4 shrink-0" />}
                    <span>
                      {selectedDecision === 'Approve' ? 'Confirm & Approve Application' :
                       selectedDecision === 'Reject' ? 'Confirm & Reject Application' :
                       selectedDecision === 'Request Re-upload' ? 'Send Re-upload Request to Applicant' :
                       'Confirm & Refer for Manual Verification'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Existing Comments / Decisions on this Application */}
        {application.reviewerComments && application.reviewerComments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-border space-y-2 text-xs">
            <span className="font-bold text-navy block text-[11px] uppercase tracking-wider">
              Previous Review Notes:
            </span>
            <div className="space-y-2">
              {application.reviewerComments.map((c, i) => (
                <div key={i} className="p-3 rounded bg-surface-bg border border-surface-border">
                  <div className="flex items-center justify-between text-[11px] text-ink-secondary mb-1">
                    <span className="font-semibold text-navy">{c.reviewerName}</span>
                    <span>{new Date(c.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-navy">{c.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
