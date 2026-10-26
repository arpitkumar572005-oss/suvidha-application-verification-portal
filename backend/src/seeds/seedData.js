import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { getStore } from '../storage/db.js';

export async function seedDatabase() {
  const store = getStore();

  // Ensure auxiliary tables (services, notifications, complianceViolations) are seeded
  if (store.services) {
    const existingServices = await store.services.find();
    if (!existingServices || existingServices.length === 0) {
      await seedStandardServices(store);
    }
  }

  if (store.complianceViolations) {
    const existingViolations = await store.complianceViolations.find();
    if (!existingViolations || existingViolations.length === 0) {
      await seedStandardViolations(store);
    }
  }

  if (store.notifications) {
    const existingNotifs = await store.notifications.find();
    if (!existingNotifs || existingNotifs.length === 0) {
      await seedStandardNotifications(store);
    }
  }

  // Check if users already seeded
  const existingUsers = await store.users.find();
  if (existingUsers && existingUsers.length > 0) {
    console.log('[Seed] Database already contains records. Skipping user re-seed.');
    return;
  }

  console.log('[Seed] Initializing demonstration database with sample data...');

  // Ensure uploads directory exists
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  // Common demo password
  const demoHashedPassword = await bcrypt.hash('Demo@123', 10);

  // 1. Seed Users
  const arpit = await store.users.create({
    _id: 'user-arpit-kumar-01',
    name: 'Arpit Kumar',
    email: 'arpit@example.com',
    password: demoHashedPassword,
    role: 'applicant',
    phone: '+91 98765 43210',
    organization: 'State Institute of Engineering and Technology'
  });

  const reviewer = await store.users.create({
    _id: 'user-priya-sharma-02',
    name: 'Priya Sharma',
    email: 'reviewer@suvidha.gov.demo',
    password: demoHashedPassword,
    role: 'reviewer',
    phone: '+91 98765 00001',
    organization: 'Department of Higher Education & Welfare Services'
  });

  const compliance = await store.users.create({
    _id: 'user-sunil-verma-03',
    name: 'Sunil Verma',
    email: 'compliance@suvidha.gov.demo',
    password: demoHashedPassword,
    role: 'compliance',
    phone: '+91 98765 00002',
    organization: 'Compliance & Regulatory Standards Directorate'
  });

  const admin = await store.users.create({
    _id: 'user-rajesh-patel-04',
    name: 'Rajesh Patel',
    email: 'admin@suvidha.gov.demo',
    password: demoHashedPassword,
    role: 'admin',
    phone: '+91 98765 00003',
    organization: 'National e-Governance Demonstration Lab'
  });

  // 2. Seed Compliance Rules
  const sampleRules = [
    {
      ruleCode: 'RULE_MANDATORY_DOCS',
      name: 'Mandatory Supporting Documents Checklist',
      category: 'Document Presence',
      severity: 'High',
      enabled: true,
      version: '1.2',
      isSampleRule: true,
      description: 'Verifies that Identity Proof and Income Certificate are attached to the application.'
    },
    {
      ruleCode: 'RULE_DOC_VALIDITY',
      name: 'Document Validity and Expiration Assessment',
      category: 'Validity Period',
      severity: 'High',
      enabled: true,
      version: '1.1',
      isSampleRule: true,
      description: 'Checks that income certificate has not passed its recorded validity expiry date.'
    },
    {
      ruleCode: 'RULE_NAME_CONSISTENCY',
      name: 'Cross-Document Identity Consistency',
      category: 'Identity Verification',
      severity: 'Medium',
      enabled: true,
      version: '1.0',
      isSampleRule: true,
      description: 'Checks that the applicant name matches across all provided documents.'
    },
    {
      ruleCode: 'RULE_INCOME_CEILING',
      name: 'Assistance Scheme Income Ceiling Rule',
      category: 'Financial Eligibility',
      severity: 'Medium',
      enabled: true,
      version: '1.0',
      isSampleRule: true,
      description: 'Verifies that declared and certified annual family income is within demo assistance scheme limits (Rs. 2,50,000).'
    },
    {
      ruleCode: 'RULE_REQUIRED_FIELDS',
      name: 'Application Form Completeness',
      category: 'Form Integrity',
      severity: 'Low',
      enabled: true,
      version: '1.0',
      isSampleRule: true,
      description: 'Ensures essential fields including reference number, contact details, and bank account info are present.'
    }
  ];

  for (const rule of sampleRules) {
    await store.complianceRules.create(rule);
  }

  // Helper to create synthetic sample file on disk
  const createSampleFile = (fileName, title, textContent) => {
    const filePath = path.join(config.uploadDir, fileName);
    if (!fs.existsSync(filePath)) {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100" fill="#FFFFFF">
        <rect width="800" height="1100" fill="#FFFFFF" stroke="#DDE3E8" stroke-width="2"/>
        <rect x="40" y="40" width="720" height="100" rx="4" fill="#FFF2E4" stroke="#E98222" stroke-width="1.5"/>
        <text x="400" y="80" font-family="sans-serif" font-size="20" font-weight="bold" fill="#263B52" text-anchor="middle">SUVIDHA HACKATHON DEMONSTRATION RECORD</text>
        <text x="400" y="115" font-family="sans-serif" font-size="14" fill="#667587" text-anchor="middle">${title}</text>
        <line x1="40" y1="160" x2="760" y2="160" stroke="#DDE3E8" stroke-width="1"/>
        <text x="60" y="220" font-family="monospace" font-size="14" fill="#263B52">${textContent.replace(/\n/g, '<tspan x="60" dy="25">')}</text>
        <rect x="40" y="1000" width="720" height="60" rx="4" fill="#F6F7F9"/>
        <text x="400" y="1035" font-family="sans-serif" font-size="12" fill="#667587" text-anchor="middle">Official Demo Copy - For Demonstration &amp; Verification Pipeline Evaluation Only</text>
      </svg>`;
      fs.writeFileSync(filePath, svgContent, 'utf-8');
    }
    return filePath;
  };

  // Create sample files
  const arpitAadhaarFile = 'sample_arpit_id_proof.svg';
  const arpitAadhaarPath = createSampleFile(
    arpitAadhaarFile,
    'GOVERNMENT OF INDIA - DEMONSTRATION IDENTITY CARD',
    'Document Type: Aadhaar Card (Demo Copy)\nCard Number: XXXX-XXXX-4819\nFull Name: Arpit Kumar\nDate of Birth: 14-05-2003\nGender: Male\nAddress: Sector 14, Vikas Nagar, Lucknow, UP 226022\nIssuing Authority: UIDAI Demonstration Services'
  );

  const arpitIncomeFile = 'sample_arpit_income_cert.svg';
  const arpitIncomePath = createSampleFile(
    arpitIncomeFile,
    'OFFICE OF THE TEHSILDAR - INCOME CERTIFICATE',
    'Certificate Ref: INC/2025/REV/89201\nApplicant Name: Arpit Kumar\nFather Name: Shri S. Kumar\nAnnual Family Income: Rs. 1,80,000 (One Lakh Eighty Thousand Only)\nDate of Issue: 10-11-2025\nValid Until: 09-11-2026\nIssuing Officer: Executive Tehsildar, District Revenue Office'
  );

  const arpitMarksheetFile = 'sample_arpit_marksheet.svg';
  const arpitMarksheetPath = createSampleFile(
    arpitMarksheetFile,
    'STATE TECHNICAL UNIVERSITY - GRADE CARD',
    'Student Name: Arpit Kumar\nRoll Number: 2022-CS-084\nInstitution: State Institute of Engineering and Technology\nCourse: B.Tech Computer Science and Engineering\nAcademic Session: 2024-2025\nOverall CGPA: 8.65 / 10.0\nStatus: Passed with Distinction'
  );

  // 3. Seed Arpit Kumar's Primary Application
  const arpitApp = await store.applications.create({
    _id: 'app-arpit-2026-0152',
    referenceNumber: 'APP-2026-0152',
    applicantId: arpit._id || arpit.id,
    applicantName: 'Arpit Kumar',
    applicantEmail: 'arpit@example.com',
    applicationType: 'Scholarship Assistance',
    academicInstitution: 'State Institute of Engineering and Technology',
    rollNumber: '2022-CS-084',
    annualFamilyIncome: 180000,
    category: 'General',
    bankAccountNumber: '987654321012',
    bankIfscCode: 'SBIN0004521',
    status: 'Under Review',
    priority: 'Normal',
    submissionDate: '2026-10-23T10:30:00.000Z',
    notes: 'Submitted for Post-Matric Merit-cum-Means Scholarship Scheme 2026-27.',
    reviewerComments: [
      {
        reviewerName: 'Priya Sharma',
        reviewerId: reviewer._id || reviewer.id,
        comment: 'Initial automated screening completed. Applicant name matches across ID and Income certificates. Bank passbook document is required before final sign-off.',
        timestamp: '2026-10-23T11:15:00.000Z',
        action: 'Note'
      }
    ],
    requestedReuploadDocs: ['Bank Passbook']
  });

  // Attach Arpit's documents
  const doc1 = await store.documents.create({
    _id: 'doc-arpit-id-01',
    applicationId: arpitApp._id || arpitApp.id,
    applicantId: arpit._id || arpit.id,
    documentCategory: 'Identity Proof',
    originalFileName: 'Aadhaar_Card_ArpitKumar_Demo.png',
    storedFileName: arpitAadhaarFile,
    fileSize: 48290,
    mimeType: 'image/svg+xml',
    filePath: arpitAadhaarPath,
    uploadTimestamp: '2026-10-23T10:20:00.000Z',
    status: 'Processed',
    extractedData: {
      documentNumber: 'XXXX-XXXX-4819',
      fullName: 'Arpit Kumar',
      dateOfBirth: '2003-05-14',
      issueDate: '2021-08-12',
      expiryDate: 'N/A (Permanent)',
      annualIncome: null,
      issuingAuthority: 'Unique Identification Authority of India (Demonstration Copy)',
      rawText: 'GOVERNMENT OF INDIA\nDEMO IDENTITY CARD\nName: Arpit Kumar\nDOB: 14/05/2003\nAadhaar: XXXX-XXXX-4819',
      confidence: 94.8,
      isMock: true,
      provider: 'Rule-based Document Analyzer [Demo Adapter]',
      extractionDate: '2026-10-23T10:21:00.000Z'
    }
  });

  const doc2 = await store.documents.create({
    _id: 'doc-arpit-income-02',
    applicationId: arpitApp._id || arpitApp.id,
    applicantId: arpit._id || arpit.id,
    documentCategory: 'Income Certificate',
    originalFileName: 'Income_Certificate_2025_Arpit.pdf',
    storedFileName: arpitIncomeFile,
    fileSize: 64100,
    mimeType: 'image/svg+xml',
    filePath: arpitIncomePath,
    uploadTimestamp: '2026-10-23T10:22:00.000Z',
    status: 'Processed',
    extractedData: {
      documentNumber: 'INC/2025/REV/89201',
      fullName: 'Arpit Kumar',
      dateOfBirth: null,
      issueDate: '2025-11-10',
      expiryDate: '2026-11-09',
      annualIncome: 180000,
      issuingAuthority: 'Tehsildar Office, District Revenue Department',
      rawText: 'OFFICE OF THE TEHSILDAR\nINCOME CERTIFICATE (DEMO)\nRef: INC/2025/REV/89201\nCertified that annual income of Arpit Kumar is Rs. 180000\nValid up to: 2026-11-09',
      confidence: 91.2,
      isMock: true,
      provider: 'Rule-based Document Analyzer [Demo Adapter]',
      extractionDate: '2026-10-23T10:22:30.000Z'
    }
  });

  const doc3 = await store.documents.create({
    _id: 'doc-arpit-marksheet-03',
    applicationId: arpitApp._id || arpitApp.id,
    applicantId: arpit._id || arpit.id,
    documentCategory: 'Academic Marksheet',
    originalFileName: 'Semester6_GradeSheet_Arpit.pdf',
    storedFileName: arpitMarksheetFile,
    fileSize: 52300,
    mimeType: 'image/svg+xml',
    filePath: arpitMarksheetPath,
    uploadTimestamp: '2026-10-23T10:24:00.000Z',
    status: 'Processed',
    extractedData: {
      documentNumber: 'MRK-2025-CS-889',
      fullName: 'Arpit Kumar',
      dateOfBirth: null,
      issueDate: '2025-06-20',
      expiryDate: 'N/A',
      annualIncome: null,
      issuingAuthority: 'State Technical University Examination Board',
      rawText: 'STATE TECHNICAL UNIVERSITY\nOFFICIAL GRADE REPORT\nStudent Name: Arpit Kumar\nRoll No: 2022-CS-084\nCGPA: 8.65',
      confidence: 88.5,
      isMock: true,
      provider: 'Rule-based Document Analyzer [Demo Adapter]',
      extractionDate: '2026-10-23T10:24:20.000Z'
    }
  });

  // Seed initial VerificationRun for Arpit
  await store.verificationRuns.create({
    applicationId: arpitApp._id || arpitApp.id,
    runTimestamp: '2026-10-23T10:31:00.000Z',
    runBy: 'System Automated Pipeline',
    status: 'Completed',
    preliminaryRiskScore: 25,
    riskLevel: 'Medium Risk',
    scoringBreakdown: [
      {
        factor: 'Baseline Profile Assessment',
        impact: 0,
        description: 'Standard starting baseline for newly ingested applications.'
      },
      {
        factor: 'Missing Supporting Documents (1)',
        impact: 25,
        description: 'Missing required attachments: Bank Passbook. Cannot verify account disbursement details without bank passbook copy.'
      }
    ],
    crossDocumentComparisons: [
      {
        field: 'Applicant Name vs Identity Proof',
        applicationValue: 'Arpit Kumar',
        documentValue: 'Arpit Kumar',
        documentCategory: 'Identity Proof',
        status: 'Matched',
        explanation: 'Name on the identity document is an exact character match with the application form.',
        confidence: 100
      },
      {
        field: 'Annual Family Income',
        applicationValue: 'Rs. 1,80,000',
        documentValue: 'Rs. 1,80,000',
        documentCategory: 'Income Certificate',
        status: 'Matched',
        explanation: 'Declared annual income matches the amount stated on the official revenue income certificate.',
        confidence: 100
      },
      {
        field: 'Academic Roll Number',
        applicationValue: '2022-CS-084',
        documentValue: '2022-CS-084',
        documentCategory: 'Academic Marksheet',
        status: 'Matched',
        explanation: 'Academic roll number matches mark sheet record.',
        confidence: 95
      }
    ],
    ruleResults: [
      {
        ruleId: 'RULE_MANDATORY_DOCS',
        ruleName: 'Mandatory Supporting Documents Checklist',
        severity: 'High',
        status: 'Pass',
        evidence: 'Identity Proof and Income Certificate are both present in document attachments.',
        explanation: 'Both mandatory supporting documents have been uploaded and ingested successfully.'
      },
      {
        ruleId: 'RULE_DOC_VALIDITY',
        ruleName: 'Document Validity and Expiration Assessment',
        severity: 'High',
        status: 'Pass',
        evidence: 'Certificate is valid until 2026-11-09.',
        explanation: 'Income certificate validity date is within the acceptable time window.'
      },
      {
        ruleId: 'RULE_NAME_CONSISTENCY',
        ruleName: 'Cross-Document Identity Consistency',
        severity: 'Medium',
        status: 'Pass',
        evidence: 'Application name "Arpit Kumar" matches identity document name "Arpit Kumar".',
        explanation: 'Applicant name is identical across primary identity records.'
      },
      {
        ruleId: 'RULE_INCOME_CEILING',
        ruleName: 'Assistance Scheme Income Ceiling Rule',
        severity: 'Medium',
        status: 'Pass',
        evidence: 'Declared annual income of Rs. 1,80,000 is within demo limit of Rs. 2,50,000.',
        explanation: 'Financial eligibility criteria satisfied for demo assistance program.'
      },
      {
        ruleId: 'RULE_REQUIRED_FIELDS',
        ruleName: 'Application Form Completeness',
        severity: 'Low',
        status: 'Pass',
        evidence: 'All required mandatory application form fields are populated.',
        explanation: 'Form data completeness requirements are fully satisfied.'
      }
    ],
    missingDocuments: ['Bank Passbook'],
    authenticityIndicators: [
      {
        indicator: 'Identity Proof - File Structure Integrity',
        status: 'Passed',
        details: 'File size (48 KB) is within expected resolution envelope.'
      },
      {
        indicator: 'Income Certificate - File Structure Integrity',
        status: 'Passed',
        details: 'File size (64 KB) is within expected resolution envelope.'
      }
    ],
    suggestedNextActions: [
      'Request applicant to upload missing documents: Bank Passbook.',
      'Check bank account IFSC details once passbook is supplied.'
    ]
  });

  // 4. Seed Additional Applications for Reviewer Dashboard & Filtering
  await store.applications.create({
    referenceNumber: 'APP-2026-0148',
    applicantId: 'user-priya-nair-05',
    applicantName: 'Priya Nair',
    applicantEmail: 'priya.nair@example.com',
    applicationType: 'Welfare Grant',
    academicInstitution: 'N/A',
    rollNumber: '',
    annualFamilyIncome: 120000,
    category: 'OBC',
    bankAccountNumber: '112233445566',
    bankIfscCode: 'BARB0VISHAL',
    status: 'Verified',
    priority: 'Normal',
    submissionDate: '2026-10-21T09:00:00.000Z',
    notes: 'National Family Welfare Assistance application.',
    reviewerComments: [
      {
        reviewerName: 'Priya Sharma',
        reviewerId: reviewer._id || reviewer.id,
        comment: 'All documents verified against district registry. Clean match on income and identity.',
        timestamp: '2026-10-22T14:30:00.000Z',
        action: 'Approve'
      }
    ],
    reviewDecision: {
      decision: 'Approve',
      reason: 'All eligibility conditions satisfied with 100% field consistency across ID and income certificates.',
      reviewerName: 'Priya Sharma',
      reviewerId: reviewer._id || reviewer.id,
      timestamp: '2026-10-22T14:30:00.000Z'
    }
  });

  await store.applications.create({
    referenceNumber: 'APP-2026-0150',
    applicantId: 'user-rohan-sharma-06',
    applicantName: 'Rohan Sharma',
    applicantEmail: 'rohan.sharma@example.com',
    applicationType: 'Trade License',
    academicInstitution: 'N/A',
    rollNumber: '',
    annualFamilyIncome: 350000,
    category: 'General',
    bankAccountNumber: '445566778899',
    bankIfscCode: 'HDFC0001824',
    status: 'Re-upload Requested',
    priority: 'High',
    submissionDate: '2026-10-22T11:45:00.000Z',
    notes: 'Municipal Trade Establishment Registration.',
    requestedReuploadDocs: ['Income Certificate'],
    reviewerComments: [
      {
        reviewerName: 'Priya Sharma',
        reviewerId: reviewer._id || reviewer.id,
        comment: 'Attached income certificate expired on 14-01-2024. Please re-upload an unexpired revenue certificate issued within the past 12 months.',
        timestamp: '2026-10-22T16:00:00.000Z',
        action: 'Request Re-upload'
      }
    ]
  });

  await store.applications.create({
    referenceNumber: 'APP-2026-0155',
    applicantId: 'user-ananya-patel-07',
    applicantName: 'Ananya Patel',
    applicantEmail: 'ananya.patel@example.com',
    applicationType: 'Scholarship Assistance',
    academicInstitution: 'Government Girls Polytechnic',
    rollNumber: '2023-EC-019',
    annualFamilyIncome: 140000,
    category: 'SC',
    bankAccountNumber: '556677889900',
    bankIfscCode: 'CNRB0002910',
    status: 'Under Review',
    priority: 'High',
    submissionDate: '2026-10-23T14:10:00.000Z',
    notes: 'Diploma Technical Scholarship Application.',
    reviewerComments: [
      {
        reviewerName: 'Priya Sharma',
        reviewerId: reviewer._id || reviewer.id,
        comment: 'Discrepancy detected: Application states Rs. 1,40,000 but income certificate states Rs. 2,30,000. Under administrative review.',
        timestamp: '2026-10-23T15:00:00.000Z',
        action: 'Note'
      }
    ]
  });

  await store.applications.create({
    referenceNumber: 'APP-2026-0159',
    applicantId: 'user-vikram-singh-08',
    applicantName: 'Vikram Singh',
    applicantEmail: 'vikram.singh@example.com',
    applicationType: 'Scholarship Assistance',
    academicInstitution: 'Central Agricultural University',
    rollNumber: '2024-AG-041',
    annualFamilyIncome: 195000,
    category: 'ST',
    bankAccountNumber: '667788990011',
    bankIfscCode: 'ICIC0000104',
    status: 'Submitted',
    priority: 'Normal',
    submissionDate: '2026-10-23T16:40:00.000Z',
    notes: 'New submission pending initial verification queue.',
    reviewerComments: []
  });

  // 5. Seed Audit Events
  const sampleAuditEvents = [
    {
      actorId: arpit._id || arpit.id,
      actorName: 'Arpit Kumar',
      actorRole: 'applicant',
      action: 'Application Submitted',
      targetType: 'Application',
      targetReference: 'APP-2026-0152',
      details: 'Created Scholarship Assistance application (APP-2026-0152) with declared income Rs. 1,80,000.',
      outcome: 'Success',
      timestamp: '2026-10-23T10:30:00.000Z'
    },
    {
      actorId: arpit._id || arpit.id,
      actorName: 'Arpit Kumar',
      actorRole: 'applicant',
      action: 'Document Uploaded',
      targetType: 'Document',
      targetReference: 'APP-2026-0152',
      details: 'Uploaded Identity Proof (Aadhaar_Card_ArpitKumar_Demo.png, 48 KB). Processed via OCR Adapter.',
      outcome: 'Success',
      timestamp: '2026-10-23T10:20:00.000Z'
    },
    {
      actorId: arpit._id || arpit.id,
      actorName: 'Arpit Kumar',
      actorRole: 'applicant',
      action: 'Document Uploaded',
      targetType: 'Document',
      targetReference: 'APP-2026-0152',
      details: 'Uploaded Income Certificate (Income_Certificate_2025_Arpit.pdf, 64 KB). Processed via OCR Adapter.',
      outcome: 'Success',
      timestamp: '2026-10-23T10:22:00.000Z'
    },
    {
      actorId: 'system-pipeline',
      actorName: 'Automated Pipeline Engine',
      actorRole: 'system',
      action: 'Verification Pipeline Executed',
      targetType: 'Application',
      targetReference: 'APP-2026-0152',
      details: 'Generated preliminary risk score: 25 (Medium Risk). Found 0 mismatches and 1 missing doc (Bank Passbook).',
      outcome: 'Success',
      timestamp: '2026-10-23T10:31:00.000Z'
    },
    {
      actorId: reviewer._id || reviewer.id,
      actorName: 'Priya Sharma',
      actorRole: 'reviewer',
      action: 'Reviewer Note Added',
      targetType: 'Application',
      targetReference: 'APP-2026-0152',
      details: 'Initial automated screening completed. Bank passbook document is required before final sign-off.',
      outcome: 'Success',
      timestamp: '2026-10-23T11:15:00.000Z'
    },
    {
      actorId: reviewer._id || reviewer.id,
      actorName: 'Priya Sharma',
      actorRole: 'reviewer',
      action: 'Reviewer Decision: Request Re-upload',
      targetType: 'Application',
      targetReference: 'APP-2026-0150',
      details: 'Decision: Request Re-upload. Requested: Income Certificate. Reason: Certificate expired on 14-01-2024.',
      outcome: 'Success',
      timestamp: '2026-10-22T16:00:00.000Z'
    },
    {
      actorId: reviewer._id || reviewer.id,
      actorName: 'Priya Sharma',
      actorRole: 'reviewer',
      action: 'Reviewer Decision: Approve',
      targetType: 'Application',
      targetReference: 'APP-2026-0148',
      details: 'Decision: Approve. Reason: All eligibility conditions satisfied with 100% field consistency.',
      outcome: 'Success',
      timestamp: '2026-10-22T14:30:00.000Z'
    }
  ];

  for (const evt of sampleAuditEvents) {
    await store.auditEvents.create(evt);
  }

  console.log('[Seed] Database initialization complete! Sample profile Arpit Kumar (APP-2026-0152) is ready.');
}

export async function seedStandardServices(store) {
  const services = [
    {
      code: 'SRV-SCHOLARSHIP',
      name: 'Scholarship Assistance',
      category: 'Education & Welfare',
      description: 'Higher education merit-cum-means financial grant for eligible undergraduate and postgraduate students.',
      eligibility: 'Annual family income below Rs. 2,50,000. Minimum 60% marks in previous examination.',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'Identity Proof (Aadhaar / Voter ID)', mandatory: true },
        { key: 'Income Certificate', label: 'Income Certificate (Revenue Department)', mandatory: true },
        { key: 'Academic Marksheet', label: 'Academic Marksheet / Transcript', mandatory: true },
        { key: 'Bank Passbook', label: 'Bank Passbook (DBT Active)', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.2'
    },
    {
      code: 'SRV-INCOME-CERT',
      name: 'Income Certificate',
      category: 'Revenue & Land Records',
      description: 'Statutory certificate issued by Executive Magistrate / Tehsildar certifying annual household income.',
      eligibility: 'State permanent resident or domicile. Verification by local revenue inspector / Patwari.',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Ration Card', label: 'Ration Card or BPL Survey Record', mandatory: true },
        { key: 'Income Certificate', label: 'Previous Assessment / Salary Slip', mandatory: true },
        { key: 'Bank Passbook', label: 'Bank Statement / Passbook', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.0'
    },
    {
      code: 'SRV-CASTE-CERT',
      name: 'Caste Certificate',
      category: 'Social Justice & Empowerment',
      description: 'Official certification of social reservation category (SC, ST, OBC) based on lineage documentation.',
      eligibility: 'Proof of ancestral state domicile and paternal caste documentation.',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
        { key: 'Father Caste Certificate', label: 'Paternal Blood Relative Caste Certificate', mandatory: true },
        { key: 'Domicile Certificate', label: 'Continuous Domicile Proof (10+ Years)', mandatory: true },
        { key: 'Land Revenue Record', label: 'Ancestral Land Record / Khatauni', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.1'
    },
    {
      code: 'SRV-DOMICILE-CERT',
      name: 'Domicile Certificate',
      category: 'General Administration',
      description: 'Certificate verifying continuous legal residence in the state for administrative and reservation quotas.',
      eligibility: 'Minimum 10 years continuous residence or state birth record.',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'Applicant Identity Proof', mandatory: true },
        { key: 'Domicile Certificate', label: 'Electricity / Water Bill (Continuous 3 Yrs)', mandatory: true },
        { key: 'Academic Marksheet', label: 'School Leaving Certificate / Marksheet', mandatory: true },
        { key: 'Land Revenue Record', label: 'Property Tax / RoR Record', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.0'
    },
    {
      code: 'SRV-TRADE-LICENSE',
      name: 'Trade License & Premise NOC',
      category: 'Urban Local Bodies',
      description: 'Municipal operational license for commercial establishments, retail counters, and service offices.',
      eligibility: 'Compliant business premise with required fire and safety clearance.',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'Proprietor Identity Proof', mandatory: true },
        { key: 'Business Premise Proof', label: 'Rent Deed or Property Tax Receipt', mandatory: true },
        { key: 'Fire & Safety NOC', label: 'Fire Safety Clearance Certificate', mandatory: true },
        { key: 'GST Registration Certificate', label: 'GSTIN / Udyam MSME Certificate', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.3'
    },
    {
      code: 'SRV-SENIOR-PENSION',
      name: 'Senior Citizen Pension Scheme',
      category: 'Social Security',
      description: 'Monthly DBT assistance for citizens aged 60 and above belonging to vulnerable economic strata.',
      eligibility: 'Age 60 years or above. Family income below statutory ceiling.',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'Aadhaar Card (Showing Full DOB)', mandatory: true },
        { key: 'Age Proof Certificate', label: 'School Leaving / Birth Certificate / Voter ID', mandatory: true },
        { key: 'Bank Passbook', label: 'Individual Savings Passbook (Active DBT)', mandatory: true },
        { key: 'Income Certificate', label: 'Non-Taxpayer Declaration / Income Proof', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.0'
    },
    {
      code: 'SRV-DISABILITY-ASST',
      name: 'Disability Welfare Assistance',
      category: 'Empowerment of Persons with Disabilities',
      description: 'Financial allowance and assistive device facilitation for certified persons with benchmark disabilities.',
      eligibility: 'Valid Unique Disability ID (UDID) or CMO certificate indicating 40%+ disability.',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'National ID / Aadhaar', mandatory: true },
        { key: 'Disability Certificate', label: 'UDID Card or CMO Medical Board Certificate', mandatory: true },
        { key: 'Bank Passbook', label: 'Savings Bank Account Passbook', mandatory: true },
        { key: 'Income Certificate', label: 'Family Income Certificate', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.0'
    },
    {
      code: 'SRV-KISAN-LAND',
      name: 'Kisan Agriculture Land Record Support',
      category: 'Agriculture & Farmers Welfare',
      description: 'Farmer subsidy and PM-KISAN DBT benefit enablement through digital land ownership verification.',
      eligibility: 'Cultivable land ownership recorded in state revenue records (Khasra / Khatauni).',
      requiredDocuments: [
        { key: 'Identity Proof', label: 'Farmer Aadhaar Card', mandatory: true },
        { key: 'Land Ownership Record', label: 'Record of Rights (RoR / 7-12 / Khasra-Khatauni)', mandatory: true },
        { key: 'Bank Passbook', label: 'Kisan Credit Card (KCC) or Bank Passbook', mandatory: true },
        { key: 'Crop Sowing Certificate', label: 'Patwari / Village Revenue Officer Sowing Record', mandatory: false }
      ],
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMB: 5,
      enabled: true,
      version: '1.0'
    }
  ];

  for (const s of services) {
    await store.services.create(s);
  }
}

export async function seedStandardViolations(store) {
  const violations = [
    {
      violationCode: 'VIOL-2026-001',
      category: 'Process Adherence',
      applicationId: 'app-arpit-2026-0152',
      applicationRef: 'APP-2026-0152',
      relatedRule: 'RULE_MANDATORY_DOCS',
      severity: 'High',
      status: 'Open',
      evidenceRef: 'Mandatory Income Certificate expired on 13-10-2026.',
      remarks: 'Referred to compliance audit queue for supervisory review.',
      assignedOfficer: 'Sunil Verma'
    },
    {
      violationCode: 'VIOL-2026-002',
      category: 'Identity Consistency',
      applicationId: 'app-sample-pension-02',
      applicationRef: 'APP-2026-0150',
      relatedRule: 'RULE_DOC_VALIDITY',
      severity: 'Medium',
      status: 'Awaiting Recheck',
      evidenceRef: 'Income certificate validity lapsed beyond 12-month limit.',
      remarks: 'Returned to reviewer for mandatory citizen re-upload.',
      assignedOfficer: 'Sunil Verma'
    }
  ];

  for (const v of violations) {
    await store.complianceViolations.create(v);
  }
}

export async function seedStandardNotifications(store) {
  const notifs = [
    {
      userId: 'user-arpit-kumar-01',
      role: 'applicant',
      title: 'Application Received',
      message: 'Your application APP-2026-0152 for Scholarship Assistance is under preliminary review.',
      type: 'info',
      link: '/applications/app-arpit-2026-0152',
      read: false
    },
    {
      userId: 'user-arpit-kumar-01',
      role: 'applicant',
      title: 'Action Required',
      message: 'Please review verification findings. A replacement document may be requested.',
      type: 'action_required',
      link: '/applicant/dashboard',
      read: false
    },
    {
      userId: 'user-priya-sharma-02',
      role: 'reviewer',
      title: 'New Applications Assigned',
      message: 'Applications are awaiting your document verification and eligibility determination.',
      type: 'info',
      link: '/reviewer/dashboard',
      read: false
    },
    {
      userId: 'user-sunil-verma-03',
      role: 'compliance',
      title: 'Compliance Audit Required',
      message: 'Supervisory regulatory compliance review cases are pending audit.',
      type: 'warning',
      link: '/compliance/dashboard',
      read: false
    },
    {
      userId: 'user-rajesh-patel-04',
      role: 'admin',
      title: 'System Health Optimal',
      message: 'All services, OCR worker processes, and persistent data stores are operating normally.',
      type: 'success',
      link: '/admin/dashboard',
      read: true
    }
  ];

  for (const n of notifs) {
    await store.notifications.create(n);
  }
}
