import { getStore } from '../../storage/db.js';
import { getOcrAdapter } from '../ocr/ocrAdapter.js';
import { ComparisonEngine, VerificationFindingsService } from '../comparison/comparisonEngine.js';
import { ComplianceRulesEngine } from '../rules/complianceRulesEngine.js';
import { RiskScoringEngine } from '../scoring/riskScoringEngine.js';
import { AuditService } from '../audit/auditService.js';

export function getServiceDocumentRequirements(applicationType = '') {
  const type = (applicationType || '').toLowerCase();

  if (type.includes('trade')) {
    return [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Proprietor Aadhaar / PAN / Voter ID', mandatory: true },
      { key: 'Business Premise Proof', label: 'Business Premise Proof', description: 'Rent Agreement, Property Tax Receipt or Ownership Deed', mandatory: true },
      { key: 'Fire & Safety NOC', label: 'Fire & Safety NOC', description: 'Fire Department No-Objection Certificate', mandatory: true },
      { key: 'GST Registration Certificate', label: 'GST / Udyam Certificate', description: 'GSTIN registration or MSME Udyam Certificate', mandatory: false }
    ];
  }

  if (type.includes('welfare') || type.includes('livelihood')) {
    return [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar Card or Voter ID of family head', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', description: 'Revenue department certificate or BPL survey certificate', mandatory: true },
      { key: 'Ration Card', label: 'Ration Card', description: 'National Food Security (NFSA) / BPL Ration Card copy', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Passbook front page with Account Number & IFSC for DBT', mandatory: false }
    ];
  }

  if (type.includes('senior') || type.includes('pension')) {
    return [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar Card showing full date of birth', mandatory: true },
      { key: 'Age Proof Certificate', label: 'Age Proof Certificate', description: 'Birth Certificate, Voter ID, or School Leaving Certificate (60+ yrs)', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Savings bank passbook for direct monthly pension disbursement', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', description: 'Income or non-taxpayer declaration certificate', mandatory: false }
    ];
  }

  if (type.includes('disability')) {
    return [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar Card or National ID', mandatory: true },
      { key: 'Disability Certificate', label: 'Disability Certificate', description: 'Unique Disability ID (UDID) or Chief Medical Officer Report (40%+)', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Direct Benefit Transfer (DBT) bank passbook', mandatory: true },
      { key: 'Income Certificate', label: 'Income Certificate', description: 'Family income certificate for eligibility slab', mandatory: false }
    ];
  }

  if (type.includes('caste') || type.includes('domicile')) {
    return [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Applicant Aadhaar or Government ID', mandatory: true },
      { key: 'Domicile Certificate', label: 'Domicile / Residence Proof', description: 'Proof of continuous state residence (10+ years) or PRC', mandatory: true },
      { key: 'Father Caste Certificate', label: 'Father Caste Certificate', description: 'Paternal lineage caste certificate or school record', mandatory: true },
      { key: 'Land Revenue Record', label: 'Land Revenue Record', description: 'Ancestral land Khasra / Khatauni document', mandatory: false }
    ];
  }

  if (type.includes('agri') || type.includes('kisan')) {
    return [
      { key: 'Identity Proof', label: 'Identity Proof', description: 'Farmer Aadhaar Card', mandatory: true },
      { key: 'Land Ownership Record', label: 'Land Ownership Record', description: 'Record of Rights (RoR / 7-12 / Khasra-Khatauni)', mandatory: true },
      { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Active Kisan Credit Card (KCC) or savings passbook with IFSC', mandatory: true },
      { key: 'Crop Sowing Certificate', label: 'Crop Sowing Certificate', description: 'Village Revenue Officer / Patwari certified crop record', mandatory: false }
    ];
  }

  // Default: Scholarship Assistance
  return [
    { key: 'Identity Proof', label: 'Identity Proof', description: 'Aadhaar, Voter ID, or Passport (Demo scan)', mandatory: true },
    { key: 'Income Certificate', label: 'Income Certificate', description: 'Revenue department certificate issued within 12 months', mandatory: true },
    { key: 'Academic Marksheet', label: 'Academic Marksheet', description: 'Latest semester grade report or enrollment certificate', mandatory: true },
    { key: 'Bank Passbook', label: 'Bank Passbook', description: 'Passbook front page with Account Number & IFSC', mandatory: false }
  ];
}

export async function runVerificationPipeline(applicationId, triggerActor = {}) {
  const store = getStore();
  const application = await store.applications.findById(applicationId);
  if (!application) {
    throw new Error(`Application with id ${applicationId} not found.`);
  }

  const documents = await store.documents.find({ applicationId });

  // Stage 1 & 2: Process any unprocessed documents through OCR adapter
  const ocrAdapter = getOcrAdapter();
  for (const doc of documents) {
    if (!doc.extractedData || !doc.extractedData.fullName) {
      const extracted = await ocrAdapter.processDocument(
        {
          originalFileName: doc.originalFileName,
          mimeType: doc.mimeType,
          documentCategory: doc.documentCategory,
          filePath: doc.filePath
        },
        {
          applicantName: application.applicantName,
          annualFamilyIncome: application.annualFamilyIncome,
          rollNumber: application.rollNumber,
          bankAccountNumber: application.bankAccountNumber,
          bankIfscCode: application.bankIfscCode
        }
      );
      doc.extractedData = extracted;
      doc.status = 'Processed';
      await store.documents.findByIdAndUpdate(doc._id || doc.id, {
        extractedData: extracted,
        status: 'Processed'
      });
    }
  }

  // Check for missing mandatory documents tailored to the application service type
  const requirements = getServiceDocumentRequirements(application.applicationType);

  // Stage 3: Compliance rules evaluation
  const rulesEngine = new ComplianceRulesEngine(store.complianceRules);
  const ruleResults = await rulesEngine.evaluate(application, documents);

  // Stage 4: Complete Document Validation Engine
  const findingsService = new VerificationFindingsService();
  const findings = findingsService.generateFindings(application, documents, requirements, ruleResults);

  const crossDocumentComparisons = findings.crossDocumentComparisons;
  const missingDocuments = findings.missingDocuments;

  // Stage 5: Preliminary risk assessment
  const scoringEngine = new RiskScoringEngine();
  const riskAssessment = scoringEngine.calculateAssessment({
    application,
    documents,
    crossDocumentComparisons,
    ruleResults,
    missingDocuments
  });

  // Create verification run record
  const runRecord = await store.verificationRuns.create({
    applicationId,
    runTimestamp: new Date().toISOString(),
    runBy: triggerActor.actorName || 'System Automated Pipeline',
    status: 'Completed',
    preliminaryRiskScore: riskAssessment.preliminaryRiskScore,
    riskLevel: riskAssessment.riskLevel,
    scoringBreakdown: riskAssessment.scoringBreakdown,
    crossDocumentComparisons,
    ruleResults,
    missingDocuments,
    verificationSummary: findings.verificationSummary,
    requiredDocFindings: findings.requiredDocFindings,
    documentCards: findings.documentCards,
    expiryFindings: findings.expiryFindings,
    authenticityIndicators: riskAssessment.authenticityIndicators,
    suggestedNextActions: riskAssessment.suggestedNextActions
  });

  // Update application priority if risk score is elevated or mismatches found
  const hasMismatches = crossDocumentComparisons.some(c => c.status === 'Mismatch detected');
  const hasFlags = ruleResults.some(r => r.status === 'Flagged');
  const newPriority = (hasMismatches || hasFlags || riskAssessment.preliminaryRiskScore >= 50) ? 'High' : 'Normal';

  // If application is newly submitted, transition to 'Under Review' or 'Manual Review Required'
  let newStatus = application.status;
  if (application.status === 'Submitted') {
    newStatus = hasMismatches ? 'Under Review' : 'Under Review';
  }

  await store.applications.findByIdAndUpdate(applicationId, {
    priority: newPriority,
    status: newStatus
  });

  // Log audit event
  const auditService = new AuditService(store.auditEvents);
  await auditService.log({
    actorId: triggerActor.actorId || 'system-verifier',
    actorName: triggerActor.actorName || 'Automated Pipeline Engine',
    actorRole: triggerActor.actorRole || 'system',
    action: 'Verification Pipeline Executed',
    targetType: 'Application',
    targetReference: application.referenceNumber,
    details: `Generated preliminary risk score: ${riskAssessment.preliminaryRiskScore} (${riskAssessment.riskLevel}). Found ${crossDocumentComparisons.filter(c => c.status === 'Mismatch detected').length} mismatches and ${missingDocuments.length} missing docs.`,
    outcome: 'Success'
  });

  return runRecord;
}
