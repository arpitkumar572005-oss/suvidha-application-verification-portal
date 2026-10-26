import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { JsonStore } from './jsonStore.js';

let activeStore = null;
let isMongoConnected = false;

// Mongoose Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['applicant', 'reviewer', 'compliance', 'admin'], default: 'applicant' },
  organization: { type: String, default: '' },
  phone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

const ApplicationSchema = new mongoose.Schema({
  referenceNumber: { type: String, required: true, unique: true },
  applicantId: { type: String, required: true },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  applicationType: { type: String, required: true },
  academicInstitution: { type: String, default: '' },
  rollNumber: { type: String, default: '' },
  businessName: { type: String, default: '' },
  tradeCategory: { type: String, default: '' },
  dob: { type: String, default: '' },
  fatherName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  address: { type: String, default: '' },
  gender: { type: String, default: '' },
  marksObtained: { type: Number, default: null },
  maximumMarks: { type: Number, default: null },
  course: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  disabilityUdid: { type: String, default: '' },
  landArea: { type: String, default: '' },
  khasraNumber: { type: String, default: '' },
  annualFamilyIncome: { type: Number, required: true },
  category: { type: String, default: 'General' },
  bankAccountNumber: { type: String, default: '' },
  bankIfscCode: { type: String, default: '' },
  status: { 
    type: String, 
    enum: [
      'Draft', 
      'Submitted', 
      'Under Review', 
      'Reviewer Assigned',
      'Action Required', 
      'Re-upload Requested', 
      'Resubmitted',
      'Compliance Review',
      'Recheck Required',
      'Escalated',
      'Verified', 
      'Approved',
      'Rejected', 
      'Withdrawal Requested',
      'Withdrawn',
      'Manual Review Required'
    ], 
    default: 'Draft' 
  },
  priority: { type: String, enum: ['Normal', 'High'], default: 'Normal' },
  assignedReviewerId: { type: String, default: '' },
  assignedReviewerName: { type: String, default: '' },
  assignmentDate: { type: String, default: '' },
  complianceStatus: { 
    type: String, 
    enum: ['Pending', 'Under Audit', 'Cleared', 'Recheck Required', 'Escalated', 'Violation Flagged'], 
    default: 'Pending' 
  },
  complianceDecision: mongoose.Schema.Types.Mixed,
  withdrawalReason: { type: String, default: '' },
  personalDetails: mongoose.Schema.Types.Mixed,
  submissionDate: { type: String, default: null },
  notes: { type: String, default: '' },
  reviewerComments: [{
    reviewerName: String,
    reviewerId: String,
    comment: String,
    timestamp: String,
    action: String
  }],
  requestedReuploadDocs: [{ type: String }],
  reviewDecision: {
    decision: String,
    reason: String,
    reviewerName: String,
    reviewerId: String,
    timestamp: String
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

const DocumentSchema = new mongoose.Schema({
  applicationId: { type: String, required: true },
  applicantId: { type: String, required: true },
  documentCategory: { 
    type: String, 
    enum: [
      'Identity Proof',
      'Income Certificate',
      'Academic Marksheet',
      'Bank Passbook',
      'Business Premise Proof',
      'Fire & Safety NOC',
      'GST Registration Certificate',
      'Ration Card',
      'Age Proof Certificate',
      'Disability Certificate',
      'Domicile Certificate',
      'Father Caste Certificate',
      'Land Revenue Record',
      'Land Ownership Record',
      'Crop Sowing Certificate',
      'Other Supporting Document'
    ],
    required: true 
  },
  originalFileName: { type: String, required: true },
  storedFileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadTimestamp: { type: String, default: () => new Date().toISOString() },
  extractedData: {
    documentNumber: String,
    fullName: String,
    fatherName: String,
    motherName: String,
    dateOfBirth: String,
    address: String,
    gender: String,
    rollNumber: String,
    institutionName: String,
    course: String,
    academicYear: String,
    marksObtained: Number,
    maximumMarks: Number,
    percentage: Number,
    passingStatus: String,
    issueDate: String,
    expiryDate: String,
    validityStatus: String,
    annualIncome: Number,
    issuingAuthority: String,
    rawText: String,
    confidence: Number,
    isMock: Boolean,
    provider: String,
    extractionDate: String,
    fields: mongoose.Schema.Types.Mixed
  },
  status: { type: String, enum: ['Uploaded', 'Processed', 'Flagged', 'Replaced'], default: 'Uploaded' }
});

const VerificationRunSchema = new mongoose.Schema({
  applicationId: { type: String, required: true },
  runTimestamp: { type: String, default: () => new Date().toISOString() },
  runBy: { type: String, default: 'System Automated Pipeline' },
  status: { type: String, enum: ['Completed', 'Failed', 'Partial'], default: 'Completed' },
  preliminaryRiskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Insufficient information'], default: 'Insufficient information' },
  scoringBreakdown: [{
    factor: String,
    impact: Number,
    description: String
  }],
  crossDocumentComparisons: [{
    field: String,
    applicationValue: String,
    documentValue: String,
    documentCategory: String,
    status: { type: String, enum: ['Matched', 'Mismatch detected', 'Unable to compare'] },
    result: { type: String },
    explanation: String,
    confidence: Number,
    isRelevant: Boolean
  }],
  ruleResults: [{
    ruleId: String,
    ruleName: String,
    severity: String,
    status: { type: String, enum: ['Pass', 'Flagged', 'Manual Review Required'] },
    evidence: String,
    explanation: String
  }],
  missingDocuments: [{ type: String }],
  authenticityIndicators: [{
    indicator: String,
    status: String,
    details: String
  }],
  suggestedNextActions: [{ type: String }],
  verificationSummary: mongoose.Schema.Types.Mixed,
  requiredDocFindings: [mongoose.Schema.Types.Mixed],
  documentCards: [mongoose.Schema.Types.Mixed]
});

const ComplianceRuleSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  enabled: { type: Boolean, default: true },
  version: { type: String, default: '1.0' },
  isSampleRule: { type: Boolean, default: true },
  thresholds: mongoose.Schema.Types.Mixed,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const AuditEventSchema = new mongoose.Schema({
  timestamp: { type: String, default: () => new Date().toISOString() },
  actorId: { type: String, required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetReference: { type: String, required: true },
  details: { type: String, default: '' },
  outcome: { type: String, enum: ['Success', 'Warning', 'Failure'], default: 'Success' },
  ipAddress: { type: String, default: '127.0.0.1' }
});

const ServiceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  eligibility: { type: String, default: '' },
  requiredDocuments: [mongoose.Schema.Types.Mixed],
  acceptedFormats: [{ type: String }],
  maxFileSizeMB: { type: Number, default: 5 },
  enabled: { type: Boolean, default: true },
  version: { type: String, default: '1.0' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const ComplianceViolationSchema = new mongoose.Schema({
  violationCode: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  applicationId: { type: String, required: true },
  applicationRef: { type: String, required: true },
  relatedRule: { type: String, required: true },
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  status: { 
    type: String, 
    enum: ['Open', 'Under Investigation', 'Awaiting Recheck', 'Resolved', 'Escalated', 'Closed'], 
    default: 'Open' 
  },
  evidenceRef: { type: String, default: '' },
  remarks: { type: String, default: '' },
  assignedOfficer: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, default: '' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'action_required', 'success'], default: 'info' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export async function initStorage() {
  if (config.storageMode === 'mongodb') {
    try {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 2000 });
      isMongoConnected = true;
      console.log(`[Storage] Connected to MongoDB at ${config.mongodbUri}`);
      activeStore = {
        mode: 'mongodb',
        users: mongoose.model('User', UserSchema),
        applications: mongoose.model('Application', ApplicationSchema),
        documents: mongoose.model('Document', DocumentSchema),
        verificationRuns: mongoose.model('VerificationRun', VerificationRunSchema),
        complianceRules: mongoose.model('ComplianceRule', ComplianceRuleSchema),
        auditEvents: mongoose.model('AuditEvent', AuditEventSchema),
        services: mongoose.model('Service', ServiceSchema),
        complianceViolations: mongoose.model('ComplianceViolation', ComplianceViolationSchema),
        notifications: mongoose.model('Notification', NotificationSchema),
      };
      return activeStore;
    } catch (err) {
      console.error(`[Storage] MongoDB connection failed: ${err.message}`);
      throw err;
    }
  }

  if (config.storageMode === 'auto') {
    try {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 1500 });
      isMongoConnected = true;
      console.log(`[Storage] Connected to MongoDB at ${config.mongodbUri}`);
      activeStore = {
        mode: 'mongodb',
        users: mongoose.model('User', UserSchema),
        applications: mongoose.model('Application', ApplicationSchema),
        documents: mongoose.model('Document', DocumentSchema),
        verificationRuns: mongoose.model('VerificationRun', VerificationRunSchema),
        complianceRules: mongoose.model('ComplianceRule', ComplianceRuleSchema),
        auditEvents: mongoose.model('AuditEvent', AuditEventSchema),
        services: mongoose.model('Service', ServiceSchema),
        complianceViolations: mongoose.model('ComplianceViolation', ComplianceViolationSchema),
        notifications: mongoose.model('Notification', NotificationSchema),
      };
      return activeStore;
    } catch (err) {
      console.log(`[Storage] MongoDB offline or not found (${err.message}). Using persistent local JSON store (Development Mode).`);
    }
  }

  // Fallback persistent JSON store
  const jsonStore = new JsonStore();
  activeStore = {
    mode: 'json-store',
    users: jsonStore.users,
    applications: jsonStore.applications,
    documents: jsonStore.documents,
    verificationRuns: jsonStore.verificationRuns,
    complianceRules: jsonStore.complianceRules,
    auditEvents: jsonStore.auditEvents,
    services: jsonStore.services,
    complianceViolations: jsonStore.complianceViolations,
    notifications: jsonStore.notifications,
  };
  return activeStore;
}

export function getStore() {
  if (!activeStore) {
    const jsonStore = new JsonStore();
    activeStore = {
      mode: 'json-store',
      users: jsonStore.users,
      applications: jsonStore.applications,
      documents: jsonStore.documents,
      verificationRuns: jsonStore.verificationRuns,
      complianceRules: jsonStore.complianceRules,
      auditEvents: jsonStore.auditEvents,
      services: jsonStore.services,
      complianceViolations: jsonStore.complianceViolations,
      notifications: jsonStore.notifications,
    };
  }
  return activeStore;
}
