import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Send,
  X,
  FileCheck,
  Check,
  FileQuestion,
  HelpCircle
} from 'lucide-react';

export function NewApplicationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Multi-step form state (1 = Details, 2 = Upload Documents, 3 = Review & Submit, 4 = Confirmation)
  const [step, setStep] = useState(1);

  // Step 1: Applicant Details
  const [applicantName, setApplicantName] = useState(user?.name || 'Arpit Kumar');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || 'arpit@example.com');
  const [applicationType, setApplicationType] = useState('Scholarship Assistance');
  const [category, setCategory] = useState('General');
  const [annualFamilyIncome, setAnnualFamilyIncome] = useState(180000);
  const [academicInstitution, setAcademicInstitution] = useState('State Institute of Engineering and Technology');
  const [rollNumber, setRollNumber] = useState('2022-CS-084');
  const [bankAccountNumber, setBankAccountNumber] = useState('987654321012');
  const [bankIfscCode, setBankIfscCode] = useState('SBIN0004521');
  const [businessName, setBusinessName] = useState('Arpit Enterprises');
  const [tradeCategory, setTradeCategory] = useState('Retail & Commercial Services');
  const [dob, setDob] = useState('2003-05-14');
  const [fatherName, setFatherName] = useState('Rajesh Kumar');
  const [address, setAddress] = useState('Flat 402, Civil Lines, New Delhi 110054');
  const [gender, setGender] = useState('Male');
  const [marksObtained, setMarksObtained] = useState('486');
  const [maximumMarks, setMaximumMarks] = useState('600');
  const [disabilityUdid, setDisabilityUdid] = useState('UDID-MH-2024-8819');
  const [landArea, setLandArea] = useState('2.45 Hectares');
  const [khasraNumber, setKhasraNumber] = useState('KH-741/2');

  // Step 2: Upload Documents
  // Documents map: category -> { file: File, name: string, size: number, isDemoSample: boolean }
  const [uploadedFiles, setUploadedFiles] = useState({});

  // Submission & Results
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedReference, setSubmittedReference] = useState('');
  const [submittedAppId, setSubmittedAppId] = useState('');

  // Service-Specific Document Requirements Checklist Mapping
  const SERVICE_DOCUMENT_REQUIREMENTS = {
    'Scholarship Assistance': [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar, Voter ID, or Passport (Demo scan)', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', description: 'Revenue department certificate issued within 12 months', mandatory: true },
      { key: 'Academic Marksheet', label: 'Academic Marksheet', description: 'Latest semester grade report or enrollment certificate', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Passbook first page with Account Number & IFSC', mandatory: false }
    ],
    'Municipal Trade License': [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Proprietor Aadhaar / PAN / Voter ID', mandatory: true },
      { key: 'Business Premise Proof', label: 'Business Premise Proof', description: 'Rent Agreement, Property Tax Receipt or Ownership Deed', mandatory: true },
      { key: 'Fire & Safety NOC', label: 'Fire & Safety NOC', description: 'Fire Department No-Objection Certificate', mandatory: true },
      { key: 'GST Registration Certificate', label: 'GST / Udyam Certificate', description: 'GSTIN registration or MSME Udyam Certificate', mandatory: false }
    ],
    'Family Welfare & Livelihood Grant': [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar Card or Voter ID of family head', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', description: 'Revenue department certificate or BPL survey certificate', mandatory: true },
      { key: 'Ration Card', label: 'Ration Card', description: 'National Food Security (NFSA) / BPL Ration Card copy', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Passbook front page with Account Number & IFSC for DBT', mandatory: false }
    ],
    'Senior Citizen Pension Scheme': [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar Card showing full date of birth', mandatory: true },
      { key: 'Age Proof Certificate', label: 'Age Proof Certificate', description: 'Birth Certificate, Voter ID, or School Leaving Certificate (60+ yrs)', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Savings bank passbook for direct monthly pension disbursement', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', description: 'Income or non-taxpayer declaration certificate', mandatory: false }
    ],
    'Disability Welfare Assistance': [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar Card or National ID', mandatory: true },
      { key: 'Disability Certificate', label: 'Disability Certificate', description: 'Unique Disability ID (UDID) or Chief Medical Officer Report (40%+)', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Direct Benefit Transfer (DBT) bank passbook', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', description: 'Family income certificate for eligibility slab', mandatory: false }
    ],
    'Caste & Domicile Verification': [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Applicant Aadhaar or Government ID', mandatory: true },
      { key: 'Domicile Certificate', label: 'Domicile / Residence Proof', description: 'Proof of continuous state residence (10+ years) or PRC', mandatory: true },
      { key: 'Father Caste Certificate', label: 'Father Caste Certificate', description: 'Paternal lineage caste certificate or school record', mandatory: true },
      { key: 'Land Revenue Record', label: 'Land Revenue Record', description: 'Ancestral land Khasra / Khatauni document', mandatory: false }
    ],
    'Agricultural Subsidy & PM-KISAN Assistance': [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Farmer Aadhaar Card', mandatory: true },
      { key: 'Land Ownership Record', label: 'Land Ownership Record', description: 'Record of Rights (RoR / 7-12 / Khasra-Khatauni)', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Active Kisan Credit Card (KCC) or savings passbook with IFSC', mandatory: true },
      { key: 'Crop Sowing Certificate', label: 'Crop Sowing Certificate', description: 'Village Revenue Officer / Patwari certified crop record', mandatory: false }
    ]
  };

  const requiredCategories = SERVICE_DOCUMENT_REQUIREMENTS[applicationType] || SERVICE_DOCUMENT_REQUIREMENTS['Scholarship Assistance'];

  // Validation
  const validateStep1 = () => {
    const errs = {};
    if (!applicantName.trim()) errs.applicantName = 'Full name is required.';
    if (!applicantEmail.trim()) errs.applicantEmail = 'Email is required.';
    if (!annualFamilyIncome || Number(annualFamilyIncome) <= 0) {
      errs.annualFamilyIncome = 'Please enter a valid annual family income.';
    }
    if (applicationType.includes('Scholarship')) {
      if (!academicInstitution.trim()) errs.academicInstitution = 'Academic institution is required.';
      if (!rollNumber.trim()) errs.rollNumber = 'Student roll number or registration ID is required.';
    }
    if (applicationType.includes('Trade')) {
      if (!businessName.trim()) errs.businessName = 'Business or enterprise name is required.';
    }
    if (applicationType.includes('Pension') || applicationType.includes('Disability') || applicationType.includes('Scholarship') || applicationType.includes('Welfare') || applicationType.includes('Agricultural')) {
      if (!bankAccountNumber.trim()) errs.bankAccountNumber = 'Bank account number is required.';
      if (!bankIfscCode.trim()) errs.bankIfscCode = 'Bank IFSC code is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToStep2 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleFileSelect = (categoryKey, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5MB size limit. Please upload a smaller scan.');
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png', '.svg'].includes(ext)) {
      alert('Only PDF, JPG, and PNG files are allowed.');
      return;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [categoryKey]: {
        file,
        name: file.name,
        size: file.size,
        isDemoSample: false
      }
    }));
  };

  const handleRemoveFile = (categoryKey) => {
    setUploadedFiles(prev => {
      const next = { ...prev };
      delete next[categoryKey];
      return next;
    });
  };

  const handleAttachDemoSample = (categoryKey) => {
    // Generates a mock File object so user can test without browsing local disk
    const sampleNames = {
      'Identity Proof': 'Aadhaar_Card_ArpitKumar.png',
      'Income Certificate': 'Income_Certificate_2025_Arpit.pdf',
      'Academic Marksheet': 'Semester6_GradeSheet_Arpit.pdf',
      'Bank Passbook': 'Bank_Passbook_FirstPage_Arpit.png',
      'Business Premise Proof': 'Electricity_Premise_Deed_Shop14.pdf',
      'Fire & Safety NOC': 'Fire_Safety_NOC_Certificate.pdf',
      'GST Registration Certificate': 'GST_Registration_Certificate.pdf',
      'Ration Card': 'NFSA_Priority_Ration_Card.png',
      'Age Proof Certificate': 'Birth_Age_Proof_Certificate.pdf',
      'Disability Certificate': 'UDID_Disability_Certificate.png',
      'Domicile Certificate': 'Domicile_Residence_Certificate.pdf',
      'Father Caste Certificate': 'Paternal_Caste_Lineage_Record.pdf',
      'Land Revenue Record': 'Land_Revenue_Khasra_Record.pdf',
      'Land Ownership Record': 'Khasra_Khatauni_RoR_712.pdf',
      'Crop Sowing Certificate': 'Patwari_Girdhawari_Crop_Report.pdf'
    };
    const sampleMimes = {
      'Identity Proof': 'image/png',
      'Income Certificate': 'application/pdf',
      'Academic Marksheet': 'application/pdf',
      'Bank Passbook': 'image/png',
      'Business Premise Proof': 'application/pdf',
      'Fire & Safety NOC': 'application/pdf',
      'GST Registration Certificate': 'application/pdf',
      'Ration Card': 'image/png',
      'Age Proof Certificate': 'application/pdf',
      'Disability Certificate': 'image/png',
      'Domicile Certificate': 'application/pdf',
      'Father Caste Certificate': 'application/pdf',
      'Land Revenue Record': 'application/pdf',
      'Land Ownership Record': 'application/pdf',
      'Crop Sowing Certificate': 'application/pdf'
    };
    const fileName = sampleNames[categoryKey] || `${categoryKey.replace(/\s+/g, '_')}.pdf`;
    const mimeType = sampleMimes[categoryKey] || 'application/pdf';
    const blob = new Blob([`OFFICIAL VERIFICATION DOCUMENT COPY FOR ${categoryKey}`], { type: mimeType });
    const dummyFile = new File([blob], fileName, { type: mimeType });

    setUploadedFiles(prev => ({
      ...prev,
      [categoryKey]: {
        file: dummyFile,
        name: fileName,
        size: 48500,
        isDemoSample: true
      }
    }));
  };

  const handleAttachAllDemoSamples = () => {
    requiredCategories.forEach(cat => {
      handleAttachDemoSample(cat.key);
    });
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Create the application on backend (generates unique reference number)
      const appRes = await api.createApplication({
        applicationType,
        academicInstitution,
        rollNumber,
        businessName,
        tradeCategory,
        dob,
        fatherName,
        address,
        gender,
        marksObtained: marksObtained ? Number(marksObtained) : null,
        maximumMarks: maximumMarks ? Number(maximumMarks) : null,
        disabilityUdid,
        landArea,
        khasraNumber,
        annualFamilyIncome: Number(annualFamilyIncome),
        category,
        bankAccountNumber,
        bankIfscCode,
        notes: `Submitted application for ${applicationType}.`,
        isDraft: false
      });

      const newApp = appRes.application;
      const newAppId = newApp._id || newApp.id;

      // 2. Upload any attached documents
      for (const [catKey, item] of Object.entries(uploadedFiles)) {
        if (item.file) {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('documentCategory', catKey);
          await api.uploadDocument(newAppId, formData);
        }
      }

      // 3. Trigger verification run
      try {
        await api.triggerVerification(newAppId);
      } catch (verErr) {
        console.warn('Verification trigger notice:', verErr);
      }

      setSubmittedReference(newApp.referenceNumber);
      setSubmittedAppId(newAppId);
      setStep(4); // Move to Confirmation screen
      window.scrollTo(0, 0);
    } catch (err) {
      alert(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation Screen (Step 4)
  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-surface-card p-8 rounded border border-surface-border shadow-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto border border-status-success/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-status-success">
              Application Successfully Submitted
            </span>
            <h1 className="text-2xl font-bold text-navy">
              Receipt Reference: {submittedReference}
            </h1>
            <p className="text-xs text-ink-secondary max-w-md mx-auto mt-2 leading-relaxed">
              Your application has been received and queued for automated document analysis and authorised officer review.
            </p>
          </div>

          <div className="p-4 rounded bg-surface-bg border border-surface-border text-left text-xs space-y-2 max-w-lg mx-auto">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Applicant Name:</span>
              <span className="font-semibold text-navy">{applicantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Service Applied:</span>
              <span className="font-semibold text-navy">{applicationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Declared Annual Income:</span>
              <span className="font-semibold text-navy">Rs. {Number(annualFamilyIncome).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Attached Documents:</span>
              <span className="font-semibold text-navy">{Object.keys(uploadedFiles).length} files</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/applicant/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded font-bold text-xs bg-royal text-white hover:bg-royal-hover text-center transition-colors shadow-sm"
            >
              Go to My Applications Dashboard
            </Link>

            <Link
              to={`/applications/${submittedAppId}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded font-bold text-xs bg-white border border-surface-border text-navy hover:bg-slate-50 text-center transition-colors"
            >
              View Application Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/applicant/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-navy mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-navy">
          Apply for a Service
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Complete the three simple steps to submit your application and supporting certificates.
        </p>
      </div>

      {/* Clean 3-Step Stepper */}
      <div className="mb-8 grid grid-cols-3 gap-2 border-b border-surface-border pb-4 text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step === 1 ? 'text-royal' : 'text-status-success'}`}>
          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs text-white ${step === 1 ? 'bg-royal' : 'bg-status-success'}`}>
            1
          </span>
          <span>Applicant Details</span>
        </div>

        <div className={`flex items-center gap-2 ${step === 2 ? 'text-royal' : step > 2 ? 'text-status-success' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs text-white ${step === 2 ? 'bg-royal' : step > 2 ? 'bg-status-success' : 'bg-slate-300'}`}>
            2
          </span>
          <span>Upload Documents</span>
        </div>

        <div className={`flex items-center gap-2 ${step === 3 ? 'text-royal' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs text-white ${step === 3 ? 'bg-royal' : 'bg-slate-300'}`}>
            3
          </span>
          <span>Review &amp; Submit</span>
        </div>
      </div>

      {/* STEP 1: Applicant Details */}
      {step === 1 && (
        <form onSubmit={handleNextToStep2} className="space-y-6">
          <div className="bg-surface-card p-6 rounded border border-surface-border shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy pb-2 border-b border-surface-border">
              Step 1: Applicant Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-navy font-semibold mb-1">
                  Full Name <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Arpit Kumar"
                  className={`w-full px-3 py-2 border rounded text-navy ${errors.applicantName ? 'border-status-error' : ''}`}
                />
                {errors.applicantName && <p className="text-status-error text-[11px] mt-1">{errors.applicantName}</p>}
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Email Address <span className="text-status-error">*</span>
                </label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="e.g. arpit@example.com"
                  className={`w-full px-3 py-2 border rounded text-navy ${errors.applicantEmail ? 'border-status-error' : ''}`}
                />
                {errors.applicantEmail && <p className="text-status-error text-[11px] mt-1">{errors.applicantEmail}</p>}
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Father's / Mother's Name
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 border rounded text-navy"
                />
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-navy"
                />
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-navy"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-navy font-semibold mb-1">
                  Residential Address (with PIN Code)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Civil Lines, New Delhi 110054"
                  className="w-full px-3 py-2 border rounded text-navy"
                />
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Social Category <span className="text-status-error">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-navy"
                >
                  <option value="General">General</option>
                  <option value="OBC">Other Backward Classes (OBC)</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="EWS">Economically Weaker Section (EWS)</option>
                </select>
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Application / Service Type <span className="text-status-error">*</span>
                </label>
                <select
                  value={applicationType}
                  onChange={(e) => setApplicationType(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-navy"
                >
                  <option value="Scholarship Assistance">Scholarship Assistance (Post-Matric Scheme)</option>
                  <option value="Municipal Trade License">Municipal Trade License</option>
                  <option value="Family Welfare & Livelihood Grant">Family Welfare &amp; Livelihood Grant</option>
                  <option value="Senior Citizen Pension Scheme">Senior Citizen Pension Scheme</option>
                  <option value="Disability Welfare Assistance">Disability Welfare Assistance</option>
                  <option value="Caste & Domicile Verification">Caste &amp; Domicile Verification</option>
                  <option value="Agricultural Subsidy & PM-KISAN Assistance">Agricultural Subsidy &amp; PM-KISAN Assistance</option>
                </select>
              </div>

              {applicationType === 'Scholarship Assistance' && (
                <>
                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Academic Institution <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={academicInstitution}
                      onChange={(e) => setAcademicInstitution(e.target.value)}
                      placeholder="e.g. State Institute of Engineering and Technology"
                      className={`w-full px-3 py-2 border rounded text-navy ${errors.academicInstitution ? 'border-status-error' : ''}`}
                    />
                    {errors.academicInstitution && <p className="text-status-error text-[11px] mt-1">{errors.academicInstitution}</p>}
                  </div>

                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Roll Number / Student ID <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 2022-CS-084"
                      className={`w-full px-3 py-2 border rounded text-navy ${errors.rollNumber ? 'border-status-error' : ''}`}
                    />
                    {errors.rollNumber && <p className="text-status-error text-[11px] mt-1">{errors.rollNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Marks Obtained (Grade Report)
                    </label>
                    <input
                      type="number"
                      value={marksObtained}
                      onChange={(e) => setMarksObtained(e.target.value)}
                      placeholder="e.g. 486"
                      className="w-full px-3 py-2 border rounded text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      value={maximumMarks}
                      onChange={(e) => setMaximumMarks(e.target.value)}
                      placeholder="e.g. 600"
                      className="w-full px-3 py-2 border rounded text-navy"
                    />
                  </div>
                </>
              )}

              {applicationType.includes('Trade') && (
                <>
                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Business / Trade Name <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Royal General Stores"
                      className={`w-full px-3 py-2 border rounded text-navy ${errors.businessName ? 'border-status-error' : ''}`}
                    />
                    {errors.businessName && <p className="text-status-error text-[11px] mt-1">{errors.businessName}</p>}
                  </div>

                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Trade Category / Industry
                    </label>
                    <input
                      type="text"
                      value={tradeCategory}
                      onChange={(e) => setTradeCategory(e.target.value)}
                      placeholder="e.g. Retail Grocery & Consumer Goods"
                      className="w-full px-3 py-2 border rounded text-navy"
                    />
                  </div>
                </>
              )}

              {applicationType.includes('Pension') && (
                <div>
                  <label className="block text-navy font-semibold mb-1">
                    Date of Birth (Senior 60+ yrs) <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-navy"
                  />
                </div>
              )}

              {applicationType.includes('Disability') && (
                <div>
                  <label className="block text-navy font-semibold mb-1">
                    UDID / Medical Certificate No. <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={disabilityUdid}
                    onChange={(e) => setDisabilityUdid(e.target.value)}
                    placeholder="e.g. UDID-DL-109283"
                    className="w-full px-3 py-2 border rounded text-navy"
                  />
                </div>
              )}

              {applicationType.includes('Agricultural') && (
                <>
                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Khasra / Khatauni Plot Number <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={khasraNumber}
                      onChange={(e) => setKhasraNumber(e.target.value)}
                      placeholder="e.g. Khasra 42/14"
                      className="w-full px-3 py-2 border rounded text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-navy font-semibold mb-1">
                      Cultivable Land Area (Acres) <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="e.g. 2.5 Acres"
                      className="w-full px-3 py-2 border rounded text-navy"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-navy font-semibold mb-1">
                  Declared Annual Family Income (INR) <span className="text-status-error">*</span>
                </label>
                <input
                  type="number"
                  value={annualFamilyIncome}
                  onChange={(e) => setAnnualFamilyIncome(e.target.value)}
                  placeholder="e.g. 180000"
                  className={`w-full px-3 py-2 border rounded text-navy ${errors.annualFamilyIncome ? 'border-status-error' : ''}`}
                />
                <p className="text-[11px] text-ink-secondary mt-1">
                  Must match the certified amount on your revenue income certificate.
                </p>
                {errors.annualFamilyIncome && <p className="text-status-error text-[11px] mt-1">{errors.annualFamilyIncome}</p>}
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Bank Account Number <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="e.g. 987654321012"
                  className={`w-full px-3 py-2 border rounded text-navy ${errors.bankAccountNumber ? 'border-status-error' : ''}`}
                />
                {errors.bankAccountNumber && <p className="text-status-error text-[11px] mt-1">{errors.bankAccountNumber}</p>}
              </div>

              <div>
                <label className="block text-navy font-semibold mb-1">
                  Bank IFSC Code <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0004521"
                  className={`w-full px-3 py-2 border rounded text-navy uppercase ${errors.bankIfscCode ? 'border-status-error' : ''}`}
                />
                {errors.bankIfscCode && <p className="text-status-error text-[11px] mt-1">{errors.bankIfscCode}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold text-white hover:bg-[#2558C4] transition-all shadow-sm cursor-pointer select-none"
            >
              <span>Continue to Upload Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Upload Documents */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-surface-card p-6 rounded border border-surface-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-border">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Step 2: Upload Supporting Documents
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Allowed file types: PDF, JPG, PNG (Max 5MB per file).
                </p>
              </div>

              {/* Quick Fill Shortcut */}
              <button
                type="button"
                onClick={handleAttachAllDemoSamples}
                className="px-3 py-1 rounded text-xs font-semibold bg-royal-light text-royal hover:bg-royal hover:text-white border border-royal/30 transition-colors"
              >
                + Auto-fill Supporting Documents (Quick Test)
              </button>
            </div>

            {/* Checklist of required documents */}
            <div className="space-y-3">
              {requiredCategories.map((cat) => {
                const uploaded = uploadedFiles[cat.key];
                return (
                  <div
                    key={cat.key}
                    className={`p-4 rounded border transition-colors ${
                      uploaded 
                        ? 'bg-status-success-bg/20 border-status-success/30' 
                        : cat.mandatory 
                          ? 'bg-status-warning-bg/20 border-status-warning/30'
                          : 'bg-surface-bg border-surface-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-navy">{cat.label}</span>
                          {cat.mandatory ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-800">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-200 text-slate-700">
                              Optional
                            </span>
                          )}
                          {uploaded ? (
                            <span className="text-[11px] font-semibold text-status-success flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Attached
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-status-warning flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Missing
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-secondary">{cat.description}</p>
                      </div>

                      {/* Upload or Attached File Display */}
                      <div className="flex items-center gap-2">
                        {uploaded ? (
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-surface-border text-xs">
                            <FileCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
                            <span className="font-medium text-navy truncate max-w-[160px]">{uploaded.name}</span>
                            <span className="text-[10px] text-ink-secondary">({Math.round(uploaded.size / 1024)} KB)</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(cat.key)}
                              className="text-ink-secondary hover:text-status-error p-0.5"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-3 py-1.5 rounded text-xs font-semibold bg-white border border-surface-border text-navy hover:border-royal hover:text-royal transition-colors">
                              <span>Choose File</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.svg"
                                onChange={(e) => handleFileSelect(cat.key, e)}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAttachDemoSample(cat.key)}
                              className="text-[11px] text-royal underline hover:text-royal-hover"
                            >
                              Sample
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-ink-secondary">
              <strong>Upload Guidelines:</strong> Please upload clear, legible copies of official certificates in PDF, JPG, or PNG format. Ensure document details match the applicant information provided in Step 1.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold bg-white border border-surface-border hover:bg-slate-50 text-navy"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step 1</span>
            </button>

            <button
              type="button"
              onClick={() => { setStep(3); window.scrollTo(0, 0); }}
              style={{ backgroundColor: '#2F6FED', color: '#FFFFFF' }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold text-white hover:bg-[#2558C4] transition-all shadow-sm cursor-pointer select-none"
            >
              <span>Continue to Review &amp; Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review and Submit */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-surface-card p-6 rounded border border-surface-border shadow-sm space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy pb-2 border-b border-surface-border">
              Step 3: Review Application Before Submission
            </h2>

            {/* Applicant Information Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-navy uppercase tracking-wider">
                  1. Applicant Details
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-royal font-semibold hover:underline"
                >
                  Edit Details
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs bg-surface-bg p-4 rounded border border-surface-border">
                <div>
                  <dt className="text-ink-secondary">Full Name</dt>
                  <dd className="font-semibold text-navy mt-0.5">{applicantName}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Email</dt>
                  <dd className="font-semibold text-navy mt-0.5">{applicantEmail}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Social Category</dt>
                  <dd className="font-semibold text-navy mt-0.5">{category}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Service Applied</dt>
                  <dd className="font-semibold text-navy mt-0.5">{applicationType}</dd>
                </div>
                <div>
                  <dt className="text-ink-secondary">Declared Annual Family Income</dt>
                  <dd className="font-semibold text-navy mt-0.5">
                    Rs. {Number(annualFamilyIncome).toLocaleString('en-IN')}
                  </dd>
                </div>
                {businessName && (
                  <div>
                    <dt className="text-ink-secondary">Business / Trade Name</dt>
                    <dd className="font-semibold text-navy mt-0.5">{businessName}</dd>
                  </div>
                )}
                {dob && (
                  <div>
                    <dt className="text-ink-secondary">Date of Birth</dt>
                    <dd className="font-semibold text-navy mt-0.5">{dob}</dd>
                  </div>
                )}
                {disabilityUdid && (
                  <div>
                    <dt className="text-ink-secondary">UDID / Disability ID</dt>
                    <dd className="font-semibold text-navy mt-0.5">{disabilityUdid}</dd>
                  </div>
                )}
                {khasraNumber && (
                  <div>
                    <dt className="text-ink-secondary">Khasra / Plot Number</dt>
                    <dd className="font-semibold text-navy mt-0.5">{khasraNumber} ({landArea})</dd>
                  </div>
                )}
                {academicInstitution && (
                  <div>
                    <dt className="text-ink-secondary">Institution &amp; Roll No</dt>
                    <dd className="font-semibold text-navy mt-0.5">{academicInstitution} ({rollNumber})</dd>
                  </div>
                )}
                <div>
                  <dt className="text-ink-secondary">Bank Account &amp; IFSC</dt>
                  <dd className="font-semibold text-navy mt-0.5">{bankAccountNumber} ({bankIfscCode})</dd>
                </div>
              </dl>
            </div>

            {/* Attached Documents Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-navy uppercase tracking-wider">
                  2. Attached Supporting Documents ({Object.keys(uploadedFiles).length})
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-royal font-semibold hover:underline"
                >
                  Manage Documents
                </button>
              </div>

              <div className="space-y-2">
                {requiredCategories.map((cat) => {
                  const uploaded = uploadedFiles[cat.key];
                  return (
                    <div
                      key={cat.key}
                      className="p-3 rounded bg-surface-bg border border-surface-border text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-navy">{cat.label}</span>
                      {uploaded ? (
                        <span className="font-semibold text-status-success flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{uploaded.name} ({Math.round(uploaded.size / 1024)} KB)</span>
                        </span>
                      ) : (
                        <span className="text-ink-secondary italic">Not attached</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Declaration box */}
            <div className="p-4 rounded bg-royal-light border border-royal/30 text-xs text-navy space-y-1">
              <span className="font-bold text-royal block">Declaration:</span>
              <p className="text-ink-secondary leading-relaxed">
                I confirm that the entered details are authentic. I understand the system will read document fields and compare them against my application to assist the authorised reviewing officer.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold bg-white border border-surface-border hover:bg-slate-50 text-navy"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Uploads</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              style={{ backgroundColor: submitting ? '#94A3B8' : '#2F6FED', color: '#FFFFFF' }}
              className="inline-flex items-center gap-2 px-8 py-3 rounded text-xs font-bold text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#2558C4] cursor-pointer select-none"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Application...' : 'Submit Application'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
