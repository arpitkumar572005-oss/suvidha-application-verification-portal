import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { login, register, getCurrentUser, getDemoAccounts, updateProfile } from '../controllers/authController.js';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  submitApplication,
  deleteApplication,
  withdrawApplication,
  getApplicationTimeline
} from '../controllers/applicationController.js';
import {
  uploadDocument,
  getDocuments,
  getDocumentFile,
  deleteDocument
} from '../controllers/documentController.js';
import {
  triggerVerification,
  getVerificationDetails,
  recordReviewDecision,
  addReviewerComment
} from '../controllers/verificationController.js';
import {
  getComplianceRules,
  toggleRule,
  updateRule,
  getComplianceOverview,
  getComplianceQueue,
  getComplianceAuditDetails,
  recordComplianceDecision,
  getComplianceViolations,
  updateComplianceViolation,
  getComplianceReports
} from '../controllers/complianceRulesController.js';
import {
  getAuditEvents,
  getAdminOverview,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  getReviewerAssignments,
  assignReviewer,
  getAdminServices,
  updateAdminService,
  getSystemHealth,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/auditController.js';

const router = Router();

// Health & System Info
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'Suvidha | Application Validation Portal',
    environment: 'Production Standard | National e-Governance Service',
    timestamp: new Date().toISOString()
  });
});

// Authentication & Profile
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authenticate, getCurrentUser);
router.patch('/auth/profile', authenticate, updateProfile);
router.get('/auth/demo-accounts', getDemoAccounts);

// In-app Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);
router.post('/notifications/mark-all-read', authenticate, markAllNotificationsRead);

// Applications
router.get('/applications', authenticate, getApplications);
router.post('/applications', authenticate, authorize('applicant', 'admin'), createApplication);
router.get('/applications/:id', authenticate, getApplicationById);
router.patch('/applications/:id', authenticate, updateApplication);
router.delete('/applications/:id', authenticate, authorize('applicant', 'admin'), deleteApplication);
router.post('/applications/:id/submit', authenticate, authorize('applicant', 'admin'), submitApplication);
router.post('/applications/:id/withdraw', authenticate, authorize('applicant', 'admin'), withdrawApplication);
router.get('/applications/:id/timeline', authenticate, getApplicationTimeline);

// Documents
router.post('/applications/:id/documents', authenticate, uploadMiddleware.single('file'), uploadDocument);
router.get('/applications/:id/documents', authenticate, getDocuments);
router.get('/documents/:id/file', authenticate, getDocumentFile);
router.delete('/documents/:id', authenticate, deleteDocument);

// Verification & Review Workspace
router.post('/applications/:id/verification-runs', authenticate, authorize('applicant', 'reviewer', 'compliance', 'admin'), triggerVerification);
router.get('/applications/:id/verification-workspace', authenticate, authorize('reviewer', 'compliance', 'admin'), getVerificationDetails);
router.post('/applications/:id/reviews', authenticate, authorize('reviewer', 'admin'), recordReviewDecision);
router.post('/applications/:id/comments', authenticate, authorize('reviewer', 'compliance', 'admin'), addReviewerComment);

// Compliance Directorate Routes
router.get('/compliance/overview', authenticate, authorize('compliance', 'admin'), getComplianceOverview);
router.get('/compliance/queue', authenticate, authorize('compliance', 'admin'), getComplianceQueue);
router.get('/compliance/audit/:id', authenticate, authorize('compliance', 'admin'), getComplianceAuditDetails);
router.post('/compliance/decision/:id', authenticate, authorize('compliance', 'admin'), recordComplianceDecision);
router.get('/compliance/violations', authenticate, authorize('compliance', 'admin'), getComplianceViolations);
router.patch('/compliance/violations/:id', authenticate, authorize('compliance', 'admin'), updateComplianceViolation);
router.get('/compliance/reports', authenticate, authorize('compliance', 'admin'), getComplianceReports);
router.get('/compliance-rules', authenticate, getComplianceRules);
router.patch('/compliance-rules/:id/toggle', authenticate, authorize('compliance', 'admin'), toggleRule);
router.patch('/compliance-rules/:id', authenticate, authorize('compliance', 'admin'), updateRule);

// Admin Control Center Routes
router.get('/admin/overview', authenticate, authorize('admin'), getAdminOverview);
router.get('/admin/users', authenticate, authorize('admin'), getAdminUsers);
router.post('/admin/users', authenticate, authorize('admin'), createAdminUser);
router.patch('/admin/users/:id', authenticate, authorize('admin'), updateAdminUser);
router.post('/admin/users/:id/reset-password', authenticate, authorize('admin'), resetAdminUserPassword);
router.get('/admin/assignments', authenticate, authorize('admin'), getReviewerAssignments);
router.post('/admin/assignments', authenticate, authorize('admin'), assignReviewer);
router.get('/admin/services', authenticate, authorize('admin'), getAdminServices);
router.patch('/admin/services/:id', authenticate, authorize('admin'), updateAdminService);
router.get('/admin/system-health', authenticate, authorize('admin'), getSystemHealth);

// Audit Events
router.get('/audit-events', authenticate, authorize('admin', 'compliance', 'reviewer'), getAuditEvents);

export default router;
