import { getStore } from '../storage/db.js';
import { runVerificationPipeline } from '../services/verification/verificationPipeline.js';
import { AuditService } from '../services/audit/auditService.js';

export async function triggerVerification(req, res) {
  try {
    const id = req.params.id || req.params.applicationId;
    const store = getStore();
    const application = await store.applications.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && application.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to run verification on this application.' });
    }

    const verificationRun = await runVerificationPipeline(id, {
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role
    });

    return res.json({
      message: 'Verification pipeline completed.',
      verificationRun
    });
  } catch (err) {
    console.error('triggerVerification error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to run verification pipeline.' });
  }
}

export async function getVerificationDetails(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const application = await store.applications.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    const documents = await store.documents.find({ applicationId: id });
    const runs = await store.verificationRuns.find({ applicationId: id });
    const latestRun = runs.length > 0
      ? runs.sort((a, b) => new Date(b.runTimestamp) - new Date(a.runTimestamp))[0]
      : null;

    return res.json({
      application,
      documents,
      latestRun
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to load verification workspace.' });
  }
}

export async function recordReviewDecision(req, res) {
  try {
    const { id } = req.params;
    const { decision, reason, requestedDocs, comment } = req.body;

    if (!decision) {
      return res.status(400).json({ error: 'Validation Error', message: 'Decision type is required.' });
    }

    const validDecisions = ['Approve', 'Reject', 'Request Re-upload', 'Refer for Manual Verification'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid decision. Allowed: ${validDecisions.join(', ')}`
      });
    }

    if (decision === 'Reject' && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A clear official reason is mandatory when recording a rejection decision.'
      });
    }

    if (decision === 'Request Re-upload' && (!requestedDocs || requestedDocs.length === 0)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please specify at least one document category required for re-upload.'
      });
    }

    const store = getStore();
    const application = await store.applications.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    const now = new Date().toISOString();
    let updatedStatus = application.status;

    if (decision === 'Approve') {
      updatedStatus = 'Verified';
    } else if (decision === 'Reject') {
      updatedStatus = 'Rejected';
    } else if (decision === 'Request Re-upload') {
      updatedStatus = 'Re-upload Requested';
    } else if (decision === 'Refer for Manual Verification') {
      updatedStatus = 'Manual Review Required';
    }

    // Add comment record
    const newComment = {
      reviewerName: req.user.name,
      reviewerId: req.user.id,
      comment: comment || reason || `Recorded decision: ${decision}`,
      timestamp: now,
      action: decision
    };

    const existingComments = application.reviewerComments || [];
    const updatedComments = [...existingComments, newComment];

    const updates = {
      status: updatedStatus,
      reviewerComments: updatedComments,
      reviewDecision: {
        decision,
        reason: reason || '',
        reviewerName: req.user.name,
        reviewerId: req.user.id,
        timestamp: now
      }
    };

    if (decision === 'Request Re-upload') {
      updates.requestedReuploadDocs = requestedDocs;
    }

    const updatedApp = await store.applications.findByIdAndUpdate(id, updates);

    // Record audit event
    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `Reviewer Decision: ${decision}`,
      targetType: 'Application',
      targetReference: application.referenceNumber,
      details: `Decision: ${decision}. Outcome status: ${updatedStatus}. Reason/Notes: ${reason || comment || 'N/A'}.`,
      outcome: 'Success'
    });

    return res.json({
      message: `Decision successfully recorded: ${decision}.`,
      application: updatedApp
    });
  } catch (err) {
    console.error('recordReviewDecision error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to record review decision.' });
  }
}

export async function addReviewerComment(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'Comment text cannot be empty.' });
    }

    const store = getStore();
    const application = await store.applications.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    const now = new Date().toISOString();
    const newComment = {
      reviewerName: req.user.name,
      reviewerId: req.user.id,
      comment: comment.trim(),
      timestamp: now,
      action: 'Note'
    };

    const existingComments = application.reviewerComments || [];
    const updated = await store.applications.findByIdAndUpdate(id, {
      reviewerComments: [...existingComments, newComment]
    });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'Reviewer Note Added',
      targetType: 'Application',
      targetReference: application.referenceNumber,
      details: comment.trim(),
      outcome: 'Success'
    });

    return res.json({
      message: 'Comment added successfully.',
      comments: updated.reviewerComments
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to add reviewer comment.' });
  }
}
