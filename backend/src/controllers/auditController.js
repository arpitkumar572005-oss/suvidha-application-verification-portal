import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getStore } from '../storage/db.js';
import { AuditService } from '../services/audit/auditService.js';
import { config } from '../config/index.js';

export async function getAuditEvents(req, res) {
  try {
    const store = getStore();
    const { action, actorRole, search } = req.query;

    let events = await store.auditEvents.find();

    if (action && action !== 'All') {
      events = events.filter(e => e.action.toLowerCase().includes(action.toLowerCase()));
    }

    if (actorRole && actorRole !== 'All') {
      events = events.filter(e => e.actorRole === actorRole);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      events = events.filter(e => 
        (e.targetReference && e.targetReference.toLowerCase().includes(q)) ||
        (e.actorName && e.actorName.toLowerCase().includes(q)) ||
        (e.action && e.action.toLowerCase().includes(q)) ||
        (e.details && e.details.toLowerCase().includes(q))
      );
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      events: events.slice(0, 150)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve audit events.' });
  }
}

export async function getAdminOverview(req, res) {
  try {
    const store = getStore();
    const users = await store.users.find();
    const applications = await store.applications.find();
    const auditEvents = await store.auditEvents.find();

    const totalUsers = users.length;
    const totalApplications = applications.length;
    const awaitingAssignment = applications.filter(a => !a.assignedReviewerId && a.status !== 'Draft' && a.status !== 'Withdrawn').length;
    const underReview = applications.filter(a => a.status === 'Under Review' || a.status === 'Reviewer Assigned' || a.status === 'Manual Review Required').length;
    const awaitingCompliance = applications.filter(a => a.complianceStatus === 'Pending' || a.complianceStatus === 'Under Audit').length;
    const completed = applications.filter(a => a.status === 'Verified' || a.status === 'Approved' || a.status === 'Rejected').length;

    const recentActivity = auditEvents.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

    const byRole = {
      applicant: users.filter(u => u.role === 'applicant').length,
      reviewer: users.filter(u => u.role === 'reviewer').length,
      compliance: users.filter(u => u.role === 'compliance').length,
      admin: users.filter(u => u.role === 'admin').length,
    };

    return res.json({
      metrics: {
        totalUsers,
        totalApplications,
        awaitingAssignment,
        underReview,
        awaitingCompliance,
        completed
      },
      users: {
        total: totalUsers,
        byRole
      },
      applications: {
        total: totalApplications,
        unassigned: awaitingAssignment,
        underReview,
        awaitingCompliance,
        completed
      },
      recentActivity
    });
  } catch (err) {
    console.error('getAdminOverview error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve admin overview.' });
  }
}

export async function getAdminUsers(req, res) {
  try {
    const store = getStore();
    const { role, search } = req.query;
    let users = await store.users.find();

    if (role && role !== 'All') {
      users = users.filter(u => u.role === role);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      users = users.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.organization && u.organization.toLowerCase().includes(q))
      );
    }

    const safeUsers = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      organization: u.organization || '',
      phone: u.phone || '',
      isActive: u.isActive !== false,
      lastLogin: u.lastLogin || u.updatedAt || u.createdAt,
      createdAt: u.createdAt
    }));

    return res.json({ users: safeUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve users.' });
  }
}

export async function createAdminUser(req, res) {
  try {
    const store = getStore();
    const { name, email, password, role, organization, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name, email, password, and role are required.' });
    }

    const existing = await store.users.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await store.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      organization: organization || '',
      phone: phone || '',
      isActive: true
    });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'admin',
      action: `User Created: ${role.toUpperCase()}`,
      targetType: 'User Account',
      targetReference: newUser.email,
      details: `Created new ${role} account for ${name}.`,
      outcome: 'Success'
    });

    return res.status(201).json({
      message: `User account for ${name} (${role}) created successfully.`,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to create user.' });
  }
}

export async function updateAdminUser(req, res) {
  try {
    const { id } = req.params;
    const { role, isActive, organization, phone, name } = req.body;
    const store = getStore();
    const user = await store.users.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (organization !== undefined) updates.organization = organization;
    if (phone !== undefined) updates.phone = phone;
    if (name) updates.name = name;

    const updated = await store.users.findByIdAndUpdate(id, updates);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'admin',
      action: `User Account Updated: ${user.email}`,
      targetType: 'User Account',
      targetReference: user.email,
      details: `Updated attributes: ${Object.keys(updates).join(', ')}.`,
      outcome: 'Success'
    });

    return res.json({
      message: `Account for ${user.email} updated successfully.`,
      user: {
        id: updated._id || updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
        organization: updated.organization
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update user.' });
  }
}

export async function resetAdminUserPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const store = getStore();
    const user = await store.users.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    const passwordToSet = newPassword || 'Demo@123';
    const hashedPassword = await bcrypt.hash(passwordToSet, 10);
    await store.users.findByIdAndUpdate(id, { password: hashedPassword });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'admin',
      action: `Password Reset: ${user.email}`,
      targetType: 'User Account',
      targetReference: user.email,
      details: 'Administrator initiated secure password reset.',
      outcome: 'Success'
    });

    return res.json({
      message: `Password for ${user.email} has been reset successfully.`,
      defaultPasswordHint: passwordToSet === 'Demo@123' ? 'Demo@123' : 'Custom password set'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to reset password.' });
  }
}

export async function getReviewerAssignments(req, res) {
  try {
    const store = getStore();
    const applications = await store.applications.find();
    const reviewers = await store.users.find({ role: 'reviewer' });

    // Reviewer workloads
    const reviewersWithWorkload = reviewers.map(r => {
      const rId = r._id || r.id;
      const assignedCount = applications.filter(a => a.assignedReviewerId === rId && a.status !== 'Verified' && a.status !== 'Approved' && a.status !== 'Rejected').length;
      const completedCount = applications.filter(a => a.assignedReviewerId === rId && (a.status === 'Verified' || a.status === 'Approved' || a.status === 'Rejected')).length;
      return {
        id: rId,
        name: r.name,
        email: r.email,
        organization: r.organization,
        activeWorkload: assignedCount,
        completedReviews: completedCount
      };
    });

    // Unassigned applications
    const unassignedApplications = applications.filter(a => 
      !a.assignedReviewerId && a.status !== 'Draft' && a.status !== 'Withdrawn'
    ).map(a => ({
      id: a._id || a.id,
      referenceNumber: a.referenceNumber,
      applicantName: a.applicantName,
      applicationType: a.applicationType,
      submissionDate: a.submissionDate,
      priority: a.priority,
      status: a.status
    }));

    return res.json({
      reviewers: reviewersWithWorkload,
      unassignedApplications
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve reviewer assignments.' });
  }
}

export async function assignReviewer(req, res) {
  try {
    const { applicationId, reviewerId } = req.body;
    const store = getStore();

    const application = await store.applications.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    const reviewer = await store.users.findById(reviewerId);
    if (!reviewer) {
      return res.status(404).json({ error: 'Not Found', message: 'Reviewer officer not found.' });
    }

    const now = new Date().toISOString();
    const updated = await store.applications.findByIdAndUpdate(applicationId, {
      assignedReviewerId: reviewer._id || reviewer.id,
      assignedReviewerName: reviewer.name,
      assignmentDate: now,
      status: application.status === 'Submitted' ? 'Under Review' : application.status
    });

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'admin',
      action: 'Reviewer Assigned',
      targetType: 'Application',
      targetReference: application.referenceNumber,
      details: `Assigned application to reviewer ${reviewer.name} (${reviewer.email}).`,
      outcome: 'Success'
    });

    // Send notification to reviewer
    if (store.notifications) {
      await store.notifications.create({
        userId: reviewer._id || reviewer.id,
        role: 'reviewer',
        title: 'New Review Assigned',
        message: `Application ${application.referenceNumber} (${application.applicationType}) has been assigned to you.`,
        type: 'info',
        link: `/reviewer/workspace/${application._id || application.id}`
      });
    }

    return res.json({
      message: `Application ${application.referenceNumber} successfully assigned to ${reviewer.name}.`,
      application: updated
    });
  } catch (err) {
    console.error('assignReviewer error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to assign reviewer.' });
  }
}

export async function getAdminServices(req, res) {
  try {
    const store = getStore();
    const services = store.services ? await store.services.find() : [];
    return res.json({ services });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve services.' });
  }
}

export async function updateAdminService(req, res) {
  try {
    const { id } = req.params;
    const { name, category, description, eligibility, enabled, maxFileSizeMB, requiredDocuments } = req.body;
    const store = getStore();

    if (!store.services) {
      return res.status(500).json({ error: 'Server Error', message: 'Services store not active.' });
    }

    const service = await store.services.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Not Found', message: 'Service not found.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (eligibility !== undefined) updates.eligibility = eligibility;
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    if (maxFileSizeMB !== undefined) updates.maxFileSizeMB = Number(maxFileSizeMB);
    if (requiredDocuments) updates.requiredDocuments = requiredDocuments;

    const updated = await store.services.findByIdAndUpdate(id, updates);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'admin',
      action: `Service Configuration Updated: ${service.code}`,
      targetType: 'ServiceDefinition',
      targetReference: service.code,
      details: `Updated settings for ${service.name}.`,
      outcome: 'Success'
    });

    return res.json({
      message: `Service ${service.name} configuration updated successfully.`,
      service: updated
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update service.' });
  }
}

export async function getSystemHealth(req, res) {
  try {
    const store = getStore();
    const uploadsExist = fs.existsSync(config.uploadDir);
    let uploadCount = 0;
    if (uploadsExist) {
      try {
        uploadCount = fs.readdirSync(config.uploadDir).length;
      } catch (e) {}
    }

    const memoryUsage = process.memoryUsage();

    return res.json({
      status: 'healthy',
      mode: store.mode,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      ocrEngine: {
        provider: 'Tesseract OCR + PDF Parser Engine',
        status: 'Operational',
        supportedFormats: ['application/pdf', 'image/jpeg', 'image/png']
      },
      fileStorage: {
        uploadDirectory: config.uploadDir,
        activeFiles: uploadCount,
        status: uploadsExist ? 'Available & Writable' : 'Initializing'
      },
      systemResources: {
        rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        platform: process.platform,
        nodeVersion: process.version
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to check system health.' });
  }
}

export async function getNotifications(req, res) {
  try {
    const store = getStore();
    if (!store.notifications) {
      return res.json({ notifications: [] });
    }

    const allNotifs = await store.notifications.find();
    // Filter for current user or their role
    const userNotifs = allNotifs.filter(n => 
      n.userId === req.user.id || (n.role && n.role === req.user.role)
    ).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ notifications: userNotifs });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve notifications.' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    if (store.notifications) {
      await store.notifications.findByIdAndUpdate(id, { read: true });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update notification.' });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const store = getStore();
    if (store.notifications) {
      const allNotifs = await store.notifications.find();
      for (const n of allNotifs) {
        if (n.userId === req.user.id || n.role === req.user.role) {
          await store.notifications.findByIdAndUpdate(n._id || n.id, { read: true });
        }
      }
    }
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update notifications.' });
  }
}
