import { getStore } from '../storage/db.js';
import { AuditService } from '../services/audit/auditService.js';
import { runVerificationPipeline, getServiceDocumentRequirements } from '../services/verification/verificationPipeline.js';

function generateReferenceNumber() {
  const year = 2026;
  const rand = Math.floor(100 + Math.random() * 900);
  return `APP-${year}-0${rand}`;
}

export async function getApplications(req, res) {
  try {
    const store = getStore();
    const { status, type, search } = req.query;

    let query = {};
    if (req.user.role === 'applicant') {
      query.applicantId = req.user.id;
    }

    let applications = await store.applications.find(query);

    // Apply in-memory search and filters if specified
    if (status && status !== 'All') {
      applications = applications.filter(app => app.status === status);
    }
    if (type && type !== 'All') {
      applications = applications.filter(app => app.applicationType === type);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      applications = applications.filter(app => 
        (app.referenceNumber && app.referenceNumber.toLowerCase().includes(q)) ||
        (app.applicantName && app.applicantName.toLowerCase().includes(q)) ||
        (app.applicantEmail && app.applicantEmail.toLowerCase().includes(q))
      );
    }

    // Enrich applications with verification findings and missing documents
    const allRuns = await store.verificationRuns.find();
    const allDocs = await store.documents.find();

    const enrichedApplications = applications.map(app => {
      const appId = app._id || app.id;
      const appRuns = allRuns.filter(r => r.applicationId === appId);
      const latestRun = appRuns.length > 0 ? appRuns.sort((a,b) => new Date(b.runTimestamp) - new Date(a.runTimestamp))[0] : null;
      const appDocs = allDocs.filter(d => d.applicationId === appId);
      
      const requirements = getServiceDocumentRequirements(app.applicationType);
      const expectedMandatory = requirements.filter(r => r.mandatory).map(r => r.key);
      const uploaded = appDocs.map(d => d.documentCategory);
      const missing = (app.requestedReuploadDocs && app.requestedReuploadDocs.length > 0)
        ? app.requestedReuploadDocs
        : (latestRun?.missingDocuments || expectedMandatory.filter(c => !uploaded.includes(c)));

      let preliminaryFindings = 'All details consistent';
      if (missing && missing.length > 0) {
        preliminaryFindings = `Missing: ${missing.join(', ')}`;
      } else if (latestRun?.crossDocumentComparisons?.some(c => c.status === 'Mismatch detected')) {
        const mismatch = latestRun.crossDocumentComparisons.find(c => c.status === 'Mismatch detected');
        preliminaryFindings = `Mismatch: ${mismatch.field}`;
      } else if (latestRun?.ruleResults?.some(r => r.status === 'Flagged')) {
        const flag = latestRun.ruleResults.find(r => r.status === 'Flagged');
        preliminaryFindings = `Flag: ${flag.ruleName}`;
      } else if (app.status === 'Verified') {
        preliminaryFindings = 'All checks verified';
      }

      return {
        ...app,
        missingDocuments: missing || [],
        preliminaryFindings
      };
    });

    // Calculate metrics
    const allForMetrics = await store.applications.find(req.user.role === 'applicant' ? { applicantId: req.user.id } : {});
    const metrics = {
      total: allForMetrics.length,
      submitted: allForMetrics.filter(a => a.status === 'Submitted').length,
      underReview: allForMetrics.filter(a => a.status === 'Under Review' || a.status === 'Manual Review Required').length,
      verified: allForMetrics.filter(a => a.status === 'Verified').length,
      reuploadRequested: allForMetrics.filter(a => a.status === 'Re-upload Requested').length,
      rejected: allForMetrics.filter(a => a.status === 'Rejected').length,
      draft: allForMetrics.filter(a => a.status === 'Draft').length
    };

    return res.json({
      applications: enrichedApplications,
      metrics
    });
  } catch (err) {
    console.error('getApplications error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve applications.' });
  }
}

export async function getApplicationById(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const application = await store.applications.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    // Check ownership for applicants
    if (req.user.role === 'applicant' && application.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to view this application.' });
    }

    // Fetch related documents
    const documents = await store.documents.find({ applicationId: application._id || application.id });

    // Fetch latest verification run
    const runs = await store.verificationRuns.find({ applicationId: application._id || application.id });
    const latestVerification = runs.length > 0
      ? runs.sort((a, b) => new Date(b.runTimestamp) - new Date(a.runTimestamp))[0]
      : null;

    // Fetch audit activity for this application
    const auditEvents = await store.auditEvents.find({ targetReference: application.referenceNumber });
    auditEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      application,
      documents,
      latestVerification,
      auditEvents
    });
  } catch (err) {
    console.error('getApplicationById error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve application details.' });
  }
}

export async function createApplication(req, res) {
  try {
    const store = getStore();
    const {
      applicationType,
      academicInstitution,
      rollNumber,
      annualFamilyIncome,
      category,
      bankAccountNumber,
      bankIfscCode,
      notes,
      isDraft
    } = req.body;

    if (!applicationType) {
      return res.status(400).json({ error: 'Validation Error', message: 'Application type is required.' });
    }

    const referenceNumber = generateReferenceNumber();
    const now = new Date().toISOString();

    const application = await store.applications.create({
      referenceNumber,
      applicantId: req.user.id,
      applicantName: req.user.name,
      applicantEmail: req.user.email,
      applicationType: applicationType.trim(),
      academicInstitution: academicInstitution || '',
      rollNumber: rollNumber || '',
      businessName: req.body.businessName || '',
      tradeCategory: req.body.tradeCategory || '',
      dob: req.body.dob || '',
      fatherName: req.body.fatherName || '',
      motherName: req.body.motherName || '',
      address: req.body.address || '',
      gender: req.body.gender || '',
      marksObtained: req.body.marksObtained !== undefined && req.body.marksObtained !== '' ? Number(req.body.marksObtained) : null,
      maximumMarks: req.body.maximumMarks !== undefined && req.body.maximumMarks !== '' ? Number(req.body.maximumMarks) : null,
      course: req.body.course || '',
      academicYear: req.body.academicYear || '',
      disabilityUdid: req.body.disabilityUdid || '',
      landArea: req.body.landArea || '',
      khasraNumber: req.body.khasraNumber || '',
      annualFamilyIncome: Number(annualFamilyIncome) || 0,
      category: category || 'General',
      bankAccountNumber: bankAccountNumber || '',
      bankIfscCode: bankIfscCode || '',
      notes: notes || '',
      status: isDraft ? 'Draft' : 'Submitted',
      priority: 'Normal',
      submissionDate: isDraft ? null : now,
      reviewerComments: [],
      requestedReuploadDocs: []
    });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: isDraft ? 'Draft Application Saved' : 'Application Submitted',
      targetType: 'Application',
      targetReference: referenceNumber,
      details: `Created ${applicationType} application (${referenceNumber}) with declared income Rs. ${annualFamilyIncome || 0}.`,
      outcome: 'Success'
    });

    // If submitted directly, run initial automated verification
    if (!isDraft) {
      await runVerificationPipeline(application._id || application.id, {
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role
      });
    }

    return res.status(201).json({
      application,
      message: isDraft ? 'Draft application saved successfully.' : 'Application submitted successfully.'
    });
  } catch (err) {
    console.error('createApplication error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to create application.' });
  }
}

export async function updateApplication(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const existing = await store.applications.findById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && existing.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to edit this application.' });
    }

    // Only allow editing draft or re-upload requested applications
    if (existing.status !== 'Draft' && existing.status !== 'Re-upload Requested' && req.user.role === 'applicant') {
      return res.status(400).json({
        error: 'Invalid Action',
        message: 'Submitted applications cannot be modified unless re-upload has been formally requested by a reviewer.'
      });
    }

    const updates = {};
    const allowedFields = [
      'applicationType', 'academicInstitution', 'rollNumber', 
      'annualFamilyIncome', 'category', 'bankAccountNumber', 
      'bankIfscCode', 'notes'
    ];

    for (const f of allowedFields) {
      if (req.body[f] !== undefined) {
        updates[f] = req.body[f];
      }
    }

    const updated = await store.applications.findByIdAndUpdate(id, updates);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'Application Details Updated',
      targetType: 'Application',
      targetReference: existing.referenceNumber,
      details: 'Updated applicant profile details.',
      outcome: 'Success'
    });

    return res.json({
      application: updated,
      message: 'Application updated successfully.'
    });
  } catch (err) {
    console.error('updateApplication error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update application.' });
  }
}

export async function submitApplication(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const existing = await store.applications.findById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && existing.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to submit this application.' });
    }

    const updated = await store.applications.findByIdAndUpdate(id, {
      status: 'Submitted',
      submissionDate: new Date().toISOString()
    });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'Application Formally Submitted',
      targetType: 'Application',
      targetReference: existing.referenceNumber,
      details: 'Applicant confirmed and submitted application for review.',
      outcome: 'Success'
    });

    // Run verification pipeline
    const verificationResult = await runVerificationPipeline(id, {
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role
    });

    return res.json({
      application: updated,
      verificationResult,
      message: 'Application submitted and preliminary verification completed.'
    });
  } catch (err) {
    console.error('submitApplication error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to submit application.' });
  }
}

export async function deleteApplication(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const existing = await store.applications.findById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && existing.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to delete this application.' });
    }

    // Only allow permanent deletion of draft applications (Section 4.C)
    if (existing.status !== 'Draft' && req.user.role !== 'admin') {
      return res.status(400).json({
        error: 'Invalid Operation',
        message: 'Permanent deletion is restricted to draft applications only. To cancel a submitted application, please request a withdrawal.'
      });
    }

    // Delete associated documents
    const docs = await store.documents.find({ applicationId: existing._id || existing.id });
    for (const d of docs) {
      await store.documents.findByIdAndDelete(d._id || d.id);
    }

    // Delete application
    await store.applications.findByIdAndDelete(id);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'Draft Application Deleted',
      targetType: 'Application',
      targetReference: existing.referenceNumber,
      details: 'Draft application and pending files removed permanently.',
      outcome: 'Success'
    });

    return res.json({
      success: true,
      message: `Draft application ${existing.referenceNumber} has been permanently deleted.`
    });
  } catch (err) {
    console.error('deleteApplication error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to delete application.' });
  }
}

export async function withdrawApplication(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const store = getStore();
    const existing = await store.applications.findById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && existing.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to withdraw this application.' });
    }

    if (['Verified', 'Approved', 'Rejected', 'Withdrawn'].includes(existing.status)) {
      return res.status(400).json({
        error: 'Invalid Operation',
        message: `Application cannot be withdrawn as it is already ${existing.status}.`
      });
    }

    const updated = await store.applications.findByIdAndUpdate(id, {
      status: 'Withdrawn',
      withdrawalReason: reason || 'Applicant requested formal withdrawal of application.'
    });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'Application Withdrawn',
      targetType: 'Application',
      targetReference: existing.referenceNumber,
      details: reason ? `Withdrawal reason: ${reason}` : 'Application withdrawn by citizen.',
      outcome: 'Success'
    });

    return res.json({
      application: updated,
      message: `Application ${existing.referenceNumber} has been successfully withdrawn.`
    });
  } catch (err) {
    console.error('withdrawApplication error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to withdraw application.' });
  }
}

export async function getApplicationTimeline(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const existing = await store.applications.findById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && existing.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to track this application.' });
    }

    // Build timeline milestones based on actual data
    const timeline = [];

    // Milestone 1: Draft Created
    timeline.push({
      stage: 'Draft Created',
      title: 'Application Created',
      description: 'Initial draft form populated and saved in portal storage.',
      timestamp: existing.createdAt,
      completed: true
    });

    // Milestone 2: Submission
    if (existing.submissionDate || existing.status !== 'Draft') {
      timeline.push({
        stage: 'Application Submitted',
        title: 'Formally Submitted',
        description: 'Citizen affirmed declaration and submitted certificates for regulatory review.',
        timestamp: existing.submissionDate || existing.createdAt,
        completed: true
      });
    } else {
      timeline.push({
        stage: 'Application Submitted',
        title: 'Pending Submission',
        description: 'Application is currently in draft status. Submit to initiate processing.',
        timestamp: null,
        completed: false
      });
    }

    // Milestone 3: Initial Automated Validation
    const runs = await store.verificationRuns.find({ applicationId: existing._id || existing.id });
    if (runs && runs.length > 0) {
      const firstRun = runs.sort((a,b) => new Date(a.runTimestamp) - new Date(b.runTimestamp))[0];
      timeline.push({
        stage: 'Initial Validation',
        title: 'Automated Rule Checks Run',
        description: 'Document extraction and preliminary compliance rule analysis completed.',
        timestamp: firstRun.runTimestamp,
        completed: true
      });
    } else if (existing.status !== 'Draft') {
      timeline.push({
        stage: 'Initial Validation',
        title: 'Validation Scheduled',
        description: 'Queued for automated extraction and rule consistency screening.',
        timestamp: null,
        completed: false
      });
    }

    // Milestone 4: Reviewer Assignment & Document Review
    if (existing.assignedReviewerName || ['Under Review', 'Verified', 'Approved', 'Rejected', 'Re-upload Requested'].includes(existing.status)) {
      timeline.push({
        stage: 'Document Review',
        title: 'Officer Examination',
        description: existing.assignedReviewerName 
          ? `Assigned to ${existing.assignedReviewerName} for documentary verification.` 
          : 'Under official verification review.',
        timestamp: existing.assignmentDate || existing.updatedAt,
        completed: ['Verified', 'Approved', 'Rejected', 'Re-upload Requested'].includes(existing.status)
      });
    }

    // Milestone 5: Action Required (if applicable)
    if (existing.status === 'Re-upload Requested' || existing.status === 'Action Required') {
      timeline.push({
        stage: 'Action Required',
        title: 'Document Clarification Requested',
        description: existing.requestedReuploadDocs?.length > 0 
          ? `Please re-upload: ${existing.requestedReuploadDocs.join(', ')}.` 
          : 'Reviewer requested replacement certificate scans.',
        timestamp: existing.updatedAt,
        completed: false,
        isWarning: true
      });
    }

    // Milestone 6: Final Decision
    if (['Verified', 'Approved', 'Rejected', 'Withdrawn'].includes(existing.status)) {
      const isApproved = existing.status === 'Verified' || existing.status === 'Approved';
      const isWithdrawn = existing.status === 'Withdrawn';
      timeline.push({
        stage: 'Final Decision',
        title: isWithdrawn ? 'Application Withdrawn' : isApproved ? 'Application Approved' : 'Review Decision Recorded',
        description: isWithdrawn 
          ? (existing.withdrawalReason || 'Application formally withdrawn at applicant request.') 
          : isApproved 
          ? 'Application successfully verified and approved.' 
          : (existing.reviewDecision?.reason || 'Application was not approved based on recorded findings.'),
        timestamp: existing.updatedAt,
        completed: true
      });
    }

    return res.json({
      application: {
        id: existing._id || existing.id,
        referenceNumber: existing.referenceNumber,
        applicationType: existing.applicationType,
        status: existing.status,
        submissionDate: existing.submissionDate,
        updatedAt: existing.updatedAt
      },
      timeline
    });
  } catch (err) {
    console.error('getApplicationTimeline error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve application timeline.' });
  }
}
