import { getStore } from '../storage/db.js';
import { AuditService } from '../services/audit/auditService.js';

export async function getComplianceRules(req, res) {
  try {
    const store = getStore();
    const rules = await store.complianceRules.find();
    return res.json({
      notice: 'Sample Demonstration Rules for Hackathon Evaluation. Not Official Government Regulations.',
      rules
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch compliance rules.' });
  }
}

export async function toggleRule(req, res) {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const store = getStore();
    const rule = await store.complianceRules.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Not Found', message: 'Compliance rule not found.' });
    }

    const updated = await store.complianceRules.findByIdAndUpdate(id, {
      enabled: Boolean(enabled)
    });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `Rule Status Changed: ${rule.name}`,
      targetType: 'ComplianceRule',
      targetReference: rule.ruleCode,
      details: `Changed enabled state to ${Boolean(enabled)}.`,
      outcome: 'Success'
    });

    return res.json({
      message: `Rule ${rule.name} is now ${Boolean(enabled) ? 'enabled' : 'disabled'}.`,
      rule: updated
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update rule state.' });
  }
}

export async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { name, description, severity } = req.body;

    const store = getStore();
    const rule = await store.complianceRules.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Not Found', message: 'Compliance rule not found.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (severity) updates.severity = severity;

    const updated = await store.complianceRules.findByIdAndUpdate(id, updates);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `Rule Modified: ${rule.name}`,
      targetType: 'ComplianceRule',
      targetReference: rule.ruleCode,
      details: `Updated parameters for ${rule.ruleCode}.`,
      outcome: 'Success'
    });

    return res.json({
      message: 'Rule updated successfully.',
      rule: updated
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update rule.' });
  }
}

export async function getComplianceOverview(req, res) {
  try {
    const store = getStore();
    const applications = await store.applications.find();
    const violations = store.complianceViolations ? await store.complianceViolations.find() : [];
    const allEvents = await store.auditEvents.find({ actorRole: 'compliance' });

    const awaitingAudit = applications.filter(a => 
      a.complianceStatus === 'Pending' || a.priority === 'High' || a.status === 'Submitted'
    ).length;
    const inAudit = applications.filter(a => a.complianceStatus === 'Under Audit').length;
    const violationsCount = violations.filter(v => v.status !== 'Closed' && v.status !== 'Resolved').length;
    const returnedForRecheck = applications.filter(a => 
      a.complianceStatus === 'Recheck Required' || a.status === 'Recheck Required' || a.status === 'Re-upload Requested'
    ).length;
    const escalated = applications.filter(a => 
      a.complianceStatus === 'Escalated' || a.status === 'Escalated' || violations.some(v => v.status === 'Escalated')
    ).length;
    const cleared = applications.filter(a => a.complianceStatus === 'Cleared' || a.status === 'Verified').length;

    const recentActions = allEvents.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    return res.json({
      awaitingAudit,
      inAudit,
      openViolations: violationsCount,
      returnedForRecheck,
      escalated,
      cleared,
      metrics: {
        awaitingAudit,
        inAudit,
        violationsCount,
        returnedForRecheck,
        escalated,
        cleared,
        totalMonitored: applications.length
      },
      recentActions
    });
  } catch (err) {
    console.error('getComplianceOverview error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve compliance overview.' });
  }
}

export async function getComplianceQueue(req, res) {
  try {
    const store = getStore();
    const { status, risk, search } = req.query;
    let applications = await store.applications.find();
    const allRuns = await store.verificationRuns.find();

    const queue = applications.map(app => {
      const appId = app._id || app.id;
      const appRuns = allRuns.filter(r => r.applicationId === appId);
      const latestRun = appRuns.length > 0 
        ? appRuns.sort((a,b) => new Date(b.runTimestamp) - new Date(a.runTimestamp))[0] 
        : null;

      const riskLevel = latestRun?.riskLevel || (app.priority === 'High' ? 'High Risk' : 'Medium Risk');
      const score = latestRun?.preliminaryRiskScore || 0;
      const missingChecks = latestRun?.missingDocuments || [];
      const unresolvedMismatches = latestRun?.crossDocumentComparisons?.filter(c => (c.result || c.status) === 'FAIL' || c.status === 'Mismatch detected') || [];

      return {
        id: appId,
        referenceNumber: app.referenceNumber,
        applicantName: app.applicantName,
        applicationType: app.applicationType,
        submissionDate: app.submissionDate,
        reviewerDecision: app.reviewDecision?.decision || 'Pending Reviewer Sign-off',
        reviewerName: app.reviewDecision?.reviewerName || app.assignedReviewerName || 'Not Assigned',
        complianceStatus: app.complianceStatus || 'Pending',
        riskLevel,
        preliminaryRiskScore: score,
        mandatoryChecksCompleted: missingChecks.length === 0,
        unresolvedFindingsCount: unresolvedMismatches.length + missingChecks.length,
        priority: app.priority
      };
    });

    let filtered = queue;
    if (status && status !== 'All') {
      filtered = filtered.filter(item => item.complianceStatus === status);
    }
    if (risk && risk !== 'All') {
      filtered = filtered.filter(item => item.riskLevel.toLowerCase().includes(risk.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.referenceNumber.toLowerCase().includes(q) || 
        item.applicantName.toLowerCase().includes(q) ||
        item.applicationType.toLowerCase().includes(q)
      );
    }

    return res.json({ queue: filtered });
  } catch (err) {
    console.error('getComplianceQueue error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve compliance queue.' });
  }
}

export async function getComplianceAuditDetails(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const application = await store.applications.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application record not found.' });
    }

    const appId = application._id || application.id;
    const documents = await store.documents.find({ applicationId: appId });
    const runs = await store.verificationRuns.find({ applicationId: appId });
    const latestRun = runs.length > 0 ? runs.sort((a,b) => new Date(b.runTimestamp) - new Date(a.runTimestamp))[0] : null;
    const rules = await store.complianceRules.find({ enabled: true });
    const violations = store.complianceViolations ? await store.complianceViolations.find({ applicationId: appId }) : [];
    const auditEvents = await store.auditEvents.find({ targetReference: application.referenceNumber });

    return res.json({
      application,
      documents,
      latestRun,
      rules,
      violations,
      auditHistory: auditEvents.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)),
      prescribedChecklist: [
        { name: 'Identity Proof Authenticity Scan', mandatory: true, status: documents.some(d => d.documentCategory.includes('Identity')) ? 'Present' : 'Missing' },
        { name: 'Income Validity Threshold Verification', mandatory: true, status: latestRun?.ruleResults?.some(r => r.ruleCode === 'RULE_INCOME_CEILING' && r.status === 'Pass') ? 'Compliant' : 'Requires Review' },
        { name: 'Cross-Document Identity Consistency Check', mandatory: true, status: latestRun?.crossDocumentComparisons?.some(c => c.field.includes('Name') && (c.result === 'PASS' || c.status === 'Matched')) ? 'Matched' : 'Discrepancy' }
      ]
    });
  } catch (err) {
    console.error('getComplianceAuditDetails error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve audit details.' });
  }
}

export async function recordComplianceDecision(req, res) {
  try {
    const { id } = req.params;
    const { decision, remarks, ruleCode, evidenceRef } = req.body;
    const store = getStore();
    const application = await store.applications.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (!decision || !remarks) {
      return res.status(400).json({ error: 'Validation Error', message: 'Official decision and remarks are mandatory for compliance records.' });
    }

    let nextComplianceStatus = 'Cleared';
    let nextAppStatus = application.status;

    if (decision === 'Compliance Cleared') {
      nextComplianceStatus = 'Cleared';
    } else if (decision === 'Clarification Required' || decision === 'Return for Recheck') {
      nextComplianceStatus = 'Recheck Required';
      nextAppStatus = 'Recheck Required';
    } else if (decision === 'Escalate Case') {
      nextComplianceStatus = 'Escalated';
      nextAppStatus = 'Escalated';
    } else if (decision === 'Flag Rule Violation') {
      nextComplianceStatus = 'Violation Flagged';
    }

    const decisionRecord = {
      decision,
      remarks,
      officerName: req.user.name,
      officerId: req.user.id,
      timestamp: new Date().toISOString(),
      evidenceRef: evidenceRef || ''
    };

    const updated = await store.applications.findByIdAndUpdate(id, {
      complianceStatus: nextComplianceStatus,
      complianceDecision: decisionRecord,
      status: nextAppStatus
    });

    // If violation flagged or escalated, create violation record
    if ((decision === 'Flag Rule Violation' || decision === 'Escalate Case') && store.complianceViolations) {
      const vCode = `VIOL-2026-${Math.floor(100 + Math.random() * 900)}`;
      await store.complianceViolations.create({
        violationCode: vCode,
        category: decision === 'Escalate Case' ? 'Supervisory Escalation' : 'Rule Violation',
        applicationId: application._id || application.id,
        applicationRef: application.referenceNumber,
        relatedRule: ruleCode || 'RULE_MANDATORY_DOCS',
        severity: decision === 'Escalate Case' ? 'Critical' : 'High',
        status: 'Open',
        evidenceRef: evidenceRef || remarks,
        remarks,
        assignedOfficer: req.user.name
      });
    }

    // Log audit event
    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'compliance',
      action: `Compliance Decision: ${decision}`,
      targetType: 'Application',
      targetReference: application.referenceNumber,
      details: remarks,
      outcome: 'Success'
    });

    // Notify reviewer and applicant if recheck is needed
    if (store.notifications) {
      if (decision === 'Return for Recheck' || decision === 'Clarification Required') {
        await store.notifications.create({
          userId: application.applicantId,
          role: 'applicant',
          title: 'Compliance Clarification Requested',
          message: `Compliance Directorate requested clarification on ${application.referenceNumber}: ${remarks}`,
          type: 'action_required',
          link: `/applications/${application._id || application.id}`
        });
      }
    }

    return res.json({
      message: `Compliance decision '${decision}' has been formally recorded.`,
      application: updated
    });
  } catch (err) {
    console.error('recordComplianceDecision error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to record compliance decision.' });
  }
}

export async function getComplianceViolations(req, res) {
  try {
    const store = getStore();
    const { status, severity } = req.query;
    let violations = store.complianceViolations ? await store.complianceViolations.find() : [];

    if (status && status !== 'All') {
      violations = violations.filter(v => v.status === status);
    }
    if (severity && severity !== 'All') {
      violations = violations.filter(v => v.severity === severity);
    }

    return res.json({ violations: violations.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve compliance violations.' });
  }
}

export async function updateComplianceViolation(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const store = getStore();

    if (!store.complianceViolations) {
      return res.status(404).json({ error: 'Not Found', message: 'Violations store not active.' });
    }

    const violation = await store.complianceViolations.findById(id);
    if (!violation) {
      return res.status(404).json({ error: 'Not Found', message: 'Violation record not found.' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (remarks) updates.remarks = remarks;

    const updated = await store.complianceViolations.findByIdAndUpdate(id, updates);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'compliance',
      action: `Violation ${violation.violationCode} Updated`,
      targetType: 'ComplianceViolation',
      targetReference: violation.violationCode,
      details: `Status transitioned to ${status}. ${remarks || ''}`,
      outcome: 'Success'
    });

    return res.json({
      message: `Violation ${violation.violationCode} status updated to ${status}.`,
      violation: updated
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update violation.' });
  }
}

export async function getComplianceReports(req, res) {
  try {
    const store = getStore();
    const applications = await store.applications.find();
    const violations = store.complianceViolations ? await store.complianceViolations.find() : [];
    const runs = await store.verificationRuns.find();

    const totalApps = applications.length || 1;
    const clearedCount = applications.filter(a => a.complianceStatus === 'Cleared' || a.status === 'Verified').length;
    const complianceRate = Math.round((clearedCount / totalApps) * 100);

    // Common omissions
    const omissionCounts = {};
    for (const r of runs) {
      if (r.missingDocuments) {
        for (const doc of r.missingDocuments) {
          omissionCounts[doc] = (omissionCounts[doc] || 0) + 1;
        }
      }
    }
    const commonOmissions = Object.keys(omissionCounts).map(doc => ({
      documentName: doc,
      omissionCount: omissionCounts[doc],
      percentage: Math.round((omissionCounts[doc] / totalApps) * 100)
    })).sort((a,b) => b.omissionCount - a.omissionCount);

    return res.json({
      complianceRate,
      clearedApplications: clearedCount,
      totalAudited: applications.length,
      commonOmissions,
      violationDistribution: {
        critical: violations.filter(v => v.severity === 'Critical').length,
        high: violations.filter(v => v.severity === 'High').length,
        medium: violations.filter(v => v.severity === 'Medium').length,
        low: violations.filter(v => v.severity === 'Low').length
      },
      reviewerAdherenceScore: 94,
      avgProcessingDays: 2.4
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to generate compliance reports.' });
  }
}
