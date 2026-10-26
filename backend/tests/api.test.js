import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app, startServer } from '../src/server.js';
import { getStore } from '../src/storage/db.js';
import {
  ComparisonEngine,
  RequiredDocumentValidator,
  PersonalDetailsMatcher,
  DocumentExpiryValidator,
  AcademicDetailsValidator,
  CrossDocumentComparisonEngine,
  VerificationFindingsService
} from '../src/services/comparison/comparisonEngine.js';
import { ComplianceRulesEngine } from '../src/services/rules/complianceRulesEngine.js';
import { RiskScoringEngine } from '../src/services/scoring/riskScoringEngine.js';

let server;
const TEST_PORT = 5055;
const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

before(async () => {
  server = await startServer(TEST_PORT);
});

after(async () => {
  if (server && server.close) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/health returns healthy status and portal identity', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.match(data.product, /Suvidha/);
});

test('GET /api/auth/demo-accounts returns sample demo credentials', async () => {
  const res = await fetch(`${baseUrl}/api/auth/demo-accounts`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.accounts));
  const arpit = data.accounts.find(a => a.email === 'arpit@example.com');
  assert.ok(arpit);
  assert.equal(arpit.name, 'Arpit Kumar');
});

test('POST /api/auth/login succeeds for sample applicant Arpit Kumar', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arpit@example.com', password: 'Demo@123' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  assert.equal(data.user.name, 'Arpit Kumar');
  assert.equal(data.user.role, 'applicant');
});

test('POST /api/auth/login fails for invalid password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arpit@example.com', password: 'WrongPassword' })
  });

  assert.equal(res.status, 401);
});

test('GET /api/applications returns scoped records for authenticated applicant', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arpit@example.com', password: 'Demo@123' })
  });
  const { token, user } = await loginRes.json();

  const res = await fetch(`${baseUrl}/api/applications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.applications));
  for (const item of data.applications) {
    assert.equal(item.applicantId, user.id);
  }
});

test('Reviewer login and verification workspace retrieval', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reviewer@suvidha.gov.demo', password: 'Demo@123' })
  });
  const { token } = await loginRes.json();

  const store = getStore();
  const arpitApp = await store.applications.findOne({ referenceNumber: 'APP-2026-0152' });
  assert.ok(arpitApp);

  const res = await fetch(`${baseUrl}/api/applications/${arpitApp._id || arpitApp.id}/verification-workspace`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.application.referenceNumber, 'APP-2026-0152');
  assert.ok(Array.isArray(data.documents));
  assert.ok(data.latestRun);
  assert.equal(data.latestRun.riskLevel, 'Medium Risk');
});

test('ComparisonEngine accurately identifies matching and mismatching fields', () => {
  const engine = new ComparisonEngine();
  const sampleApp = {
    applicantName: 'Arpit Kumar',
    annualFamilyIncome: 180000,
    academicInstitution: 'SIET',
    rollNumber: '2022-CS-084'
  };

  const sampleDocs = [
    {
      documentCategory: 'Identity Proof',
      extractedData: { fullName: 'Arpit Kumar' }
    },
    {
      documentCategory: 'Income Certificate',
      extractedData: { annualIncome: 240000 }
    }
  ];

  const findings = engine.compare(sampleApp, sampleDocs);
  const nameFinding = findings.find(f => f.field.includes('Name'));
  const incomeFinding = findings.find(f => f.field.includes('Income'));

  assert.equal(nameFinding.status, 'Matched');
  assert.equal(incomeFinding.status, 'Mismatch detected');
});

test('RiskScoringEngine calculates explainable score and does not claim fraud', () => {
  const scoring = new RiskScoringEngine();
  const assessment = scoring.calculateAssessment({
    application: { applicantName: 'Arpit Kumar' },
    documents: [
      { documentCategory: 'Identity Proof', mimeType: 'image/svg+xml', fileSize: 50000 }
    ],
    crossDocumentComparisons: [
      { field: 'Annual Family Income', status: 'Mismatch detected', explanation: 'Declared income differs from certificate.' }
    ],
    ruleResults: [],
    missingDocuments: ['Income Certificate']
  });

  assert.ok(assessment.preliminaryRiskScore > 0);
  assert.ok(assessment.scoringBreakdown.length > 0);
  assert.ok(assessment.suggestedNextActions.length > 0);
  const fraudMention = assessment.suggestedNextActions.some(a => a.toLowerCase().includes('fraud'));
  assert.equal(fraudMention, false);
});

// ========================================================
// Document Validation Engine Specification Tests (12 Test Scenarios)
// ========================================================

test('Validation Engine: 1. All required documents uploaded and details match', () => {
  const service = new VerificationFindingsService();
  const app = {
    applicationType: 'Scholarship Assistance',
    applicantName: 'Arpit Kumar',
    dob: '2003-05-14',
    address: 'Flat 402, Civil Lines, New Delhi 110054',
    annualFamilyIncome: 180000,
    rollNumber: '2022-CS-084',
    academicInstitution: 'SIET'
  };

  const docs = [
    {
      documentCategory: 'Identity Proof',
      originalFileName: 'Aadhaar_Card.pdf',
      extractedData: {
        fullName: 'Arpit Kumar',
        dateOfBirth: '2003-05-14',
        address: 'Flat 402, Civil Lines, New Delhi 110054',
        rawText: 'Name: Arpit Kumar DOB: 14/05/2003',
        confidence: 95
      }
    },
    {
      documentCategory: 'Income Certificate',
      originalFileName: 'Income_Cert.pdf',
      extractedData: {
        annualIncome: 180000,
        issueDate: '2025-06-01',
        expiryDate: '2027-05-31',
        rawText: 'Income: 180000',
        confidence: 92
      }
    },
    {
      documentCategory: 'Academic Marksheet',
      originalFileName: 'Semester_Marksheet.pdf',
      extractedData: {
        fullName: 'Arpit Kumar',
        rollNumber: '2022-CS-084',
        institutionName: 'SIET',
        marksObtained: 486,
        maximumMarks: 600,
        rawText: 'Roll: 2022-CS-084 SIET',
        confidence: 90
      }
    }
  ];

  const reqs = [
    { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
    { key: 'Income Certificate', label: 'Income Certificate', mandatory: true },
    { key: 'Academic Marksheet', label: 'Academic Marksheet', mandatory: true },
    { key: 'Bank Passbook', label: 'Bank Passbook', mandatory: false }
  ];

  const result = service.generateFindings(app, docs, reqs);
  assert.equal(result.missingDocuments.length, 0);
  assert.equal(result.verificationSummary.failedChecks, 0);
  assert.ok(result.verificationSummary.passedChecks >= 3);
});

test('Validation Engine: 2. A required document is missing', () => {
  const validator = new RequiredDocumentValidator();
  const app = { applicationType: 'Family Welfare & Livelihood Grant' };
  const docs = [
    {
      documentCategory: 'Identity Proof',
      originalFileName: 'Aadhaar.pdf',
      extractedData: { rawText: 'Aadhaar copy', confidence: 90 }
    }
  ];
  const reqs = [
    { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
    { key: 'Income Certificate', label: 'Income Certificate', mandatory: true },
    { key: 'Bank Passbook', label: 'Bank Passbook', mandatory: false }
  ];

  const findings = validator.validate(app, docs, reqs);
  const incomeFinding = findings.find(f => f.documentCategory === 'Income Certificate');
  const passbookFinding = findings.find(f => f.documentCategory === 'Bank Passbook');

  assert.equal(incomeFinding.status, 'MISSING');
  assert.match(incomeFinding.reason, /Income Certificate is required but has not been uploaded/);
  // Optional document must not be marked as missing
  assert.equal(passbookFinding.status, 'OPTIONAL');
  assert.notEqual(passbookFinding.status, 'MISSING');
});

test("Validation Engine: 3. Applicant name matches but father's name differs", () => {
  const matcher = new PersonalDetailsMatcher();
  const app = {
    applicantName: 'Arpit Kumar',
    fatherName: 'Rajesh Kumar'
  };
  const docs = [
    {
      documentCategory: 'Identity Proof',
      extractedData: {
        fullName: 'Arpit Kumar',
        fatherName: 'Suresh Kumar',
        confidence: 95
      }
    }
  ];

  const findings = matcher.match(app, docs);
  const nameCheck = findings.find(f => f.field === 'Applicant Name');
  const fatherCheck = findings.find(f => f.field === "Father's Name");

  assert.equal(nameCheck.result, 'PASS');
  assert.equal(fatherCheck.result, 'FAIL');
  assert.equal(fatherCheck.status, 'Mismatch detected');
  assert.match(fatherCheck.explanation, /Father's name differs/);
});

test('Validation Engine: 4. Date of birth differs between form and document', () => {
  const matcher = new PersonalDetailsMatcher();
  const app = {
    applicantName: 'Arpit Kumar',
    dob: '2003-05-14'
  };
  const docs = [
    {
      documentCategory: 'Identity Proof',
      extractedData: {
        fullName: 'Arpit Kumar',
        dateOfBirth: '2001-11-20',
        confidence: 95
      }
    }
  ];

  const findings = matcher.match(app, docs);
  const dobCheck = findings.find(f => f.field === 'Date of Birth');

  assert.equal(dobCheck.result, 'FAIL');
  assert.equal(dobCheck.status, 'Mismatch detected');
  assert.match(dobCheck.explanation, /Date of birth differs between the application and identity document/);
});

test('Validation Engine: 5. Address differs', () => {
  const matcher = new PersonalDetailsMatcher();
  const app = {
    applicantName: 'Arpit Kumar',
    address: 'Flat 402, Civil Lines, New Delhi 110054'
  };
  const docs = [
    {
      documentCategory: 'Identity Proof',
      extractedData: {
        fullName: 'Arpit Kumar',
        address: 'Sector 14, Gomti Nagar, Lucknow 226010',
        confidence: 90
      }
    }
  ];

  const findings = matcher.match(app, docs);
  const addrCheck = findings.find(f => f.field === 'Residential Address');

  assert.equal(addrCheck.result, 'FAIL');
  assert.equal(addrCheck.status, 'Mismatch detected');
  assert.match(addrCheck.explanation, /Address postal PIN code differs|differs/);
});

test('Validation Engine: 6. Income certificate has expired', () => {
  const validator = new DocumentExpiryValidator();
  const docs = [
    {
      documentCategory: 'Income Certificate',
      originalFileName: 'Expired_Income_Cert.pdf',
      extractedData: {
        issueDate: '2022-01-15',
        expiryDate: '2023-01-14',
        annualIncome: 120000
      }
    }
  ];

  const findings = validator.validate(docs);
  const incomeExpiry = findings.find(f => f.documentCategory === 'Income Certificate');

  assert.equal(incomeExpiry.result, 'FAIL');
  assert.equal(incomeExpiry.status, 'Mismatch detected');
  assert.match(incomeExpiry.explanation, /expired on 2023-01-14\. A currently valid certificate is required/);
});

test('Validation Engine: 7. License has a future expiry date', () => {
  const validator = new DocumentExpiryValidator();
  const docs = [
    {
      documentCategory: 'Municipal Trade License',
      originalFileName: 'Active_Trade_License.pdf',
      extractedData: {
        issueDate: '2025-01-01',
        expiryDate: '2030-12-31'
      }
    }
  ];

  const findings = validator.validate(docs);
  const licenseExpiry = findings.find(f => f.documentCategory === 'Municipal Trade License');

  assert.equal(licenseExpiry.result, 'PASS');
  assert.equal(licenseExpiry.status, 'Matched');
  assert.match(licenseExpiry.explanation, /valid and active through 2030-12-31/);
});

test('Validation Engine: 8. A marksheet has a different roll number', () => {
  const validator = new AcademicDetailsValidator();
  const app = {
    applicantName: 'Arpit Kumar',
    rollNumber: '2022-CS-084'
  };
  const marksheetDoc = {
    documentCategory: 'Academic Marksheet',
    extractedData: {
      fullName: 'Arpit Kumar',
      rollNumber: '2020-ME-011',
      rawText: 'Roll: 2020-ME-011'
    }
  };

  const findings = validator.validate(app, marksheetDoc);
  const rollCheck = findings.find(f => f.field === 'Academic Roll Number');

  assert.equal(rollCheck.result, 'FAIL');
  assert.equal(rollCheck.status, 'Mismatch detected');
  assert.match(rollCheck.explanation, /Roll number on marksheet does not match application/);
});

test('Validation Engine: 9. Marks in the application differ from the marksheet', () => {
  const validator = new AcademicDetailsValidator();
  const app = {
    applicantName: 'Arpit Kumar',
    rollNumber: '2022-CS-084',
    marksObtained: 550,
    maximumMarks: 600
  };
  const marksheetDoc = {
    documentCategory: 'Academic Marksheet',
    extractedData: {
      fullName: 'Arpit Kumar',
      rollNumber: '2022-CS-084',
      marksObtained: 486,
      maximumMarks: 600,
      rawText: 'Marks: 486 / 600 Percentage: 81.0%'
    }
  };

  const findings = validator.validate(app, marksheetDoc);
  const marksCheck = findings.find(f => f.field === 'Marks Obtained');

  assert.equal(marksCheck.result, 'FAIL');
  assert.equal(marksCheck.status, 'Mismatch detected');
  assert.match(marksCheck.explanation, /Marks obtained on the marksheet do not match the application/);
  // Verify percentage calculation
  assert.match(marksCheck.documentValue, /81%/);
});

test('Validation Engine: 10. A document does not contain an expiry date and no expiry is required', () => {
  const validator = new DocumentExpiryValidator();
  const docs = [
    {
      documentCategory: 'Academic Marksheet',
      originalFileName: 'Marksheet.pdf',
      extractedData: {
        issueDate: '2025-06-20',
        expiryDate: 'N/A'
      }
    },
    {
      documentCategory: 'Identity Proof',
      originalFileName: 'Aadhaar.pdf',
      extractedData: {
        issueDate: '2020-01-10',
        expiryDate: 'N/A (Permanent)'
      }
    }
  ];

  const findings = validator.validate(docs);
  const marksheetCheck = findings.find(f => f.documentCategory === 'Academic Marksheet');
  const aadhaarCheck = findings.find(f => f.documentCategory === 'Identity Proof');

  assert.equal(marksheetCheck.requiresExpiry, false);
  assert.equal(marksheetCheck.result, 'PASS');
  assert.match(marksheetCheck.explanation, /permanent official record\. No expiry date is required/);

  assert.equal(aadhaarCheck.requiresExpiry, false);
  assert.equal(aadhaarCheck.result, 'PASS');
});

test('Validation Engine: 11. OCR cannot read a required field', () => {
  const validator = new RequiredDocumentValidator();
  const app = { applicationType: 'Scholarship Assistance' };
  const docs = [
    {
      documentCategory: 'Identity Proof',
      originalFileName: 'Corrupted_Scan.png',
      extractedData: {
        rawText: '',
        confidence: 15.0
      }
    }
  ];
  const reqs = [
    { key: 'Identity Proof', label: 'Identity Proof', mandatory: true }
  ];

  const findings = validator.validate(app, docs, reqs);
  const idFinding = findings.find(f => f.documentCategory === 'Identity Proof');

  assert.equal(idFinding.status, 'REVIEW REQUIRED');
  assert.match(idFinding.reason, /unreadable or has extremely low scan clarity/);
});

test('Validation Engine: 12. The same verification is run repeatedly without duplicate findings', () => {
  const service = new VerificationFindingsService();
  const app = {
    applicationType: 'Scholarship Assistance',
    applicantName: 'Arpit Kumar',
    annualFamilyIncome: 180000,
    rollNumber: '2022-CS-084'
  };
  const docs = [
    {
      documentCategory: 'Identity Proof',
      originalFileName: 'Aadhaar.pdf',
      extractedData: { fullName: 'Arpit Kumar', confidence: 95 }
    },
    {
      documentCategory: 'Income Certificate',
      originalFileName: 'Income.pdf',
      extractedData: { annualIncome: 180000, expiryDate: '2027-01-01', confidence: 92 }
    }
  ];
  const reqs = [
    { key: 'Identity Proof', label: 'Identity Proof', mandatory: true },
    { key: 'Income Certificate', label: 'Income Certificate', mandatory: true }
  ];

  const run1 = service.generateFindings(app, docs, reqs);
  const run2 = service.generateFindings(app, docs, reqs);

  assert.equal(run1.crossDocumentComparisons.length, run2.crossDocumentComparisons.length);
  assert.equal(run1.documentCards.length, run2.documentCards.length);
  assert.equal(run1.verificationSummary.passedChecks, run2.verificationSummary.passedChecks);
  assert.equal(run1.verificationSummary.failedChecks, run2.verificationSummary.failedChecks);
});

