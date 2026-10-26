import bcrypt from 'bcryptjs';
import { getStore } from '../storage/db.js';
import { signToken } from '../middleware/auth.js';
import { AuditService } from '../services/audit/auditService.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
    }

    const store = getStore();
    const user = await store.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid Credentials', message: 'Incorrect email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid Credentials', message: 'Incorrect email or password.' });
    }

    const token = signToken(user);
    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: user._id || user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'User Sign In',
      targetType: 'User Session',
      targetReference: user.email,
      outcome: 'Success'
    });

    return res.json({
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization || '',
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'An internal error occurred during sign in.' });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 6 characters.' });
    }

    const store = getStore();
    const existing = await store.users.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await store.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'applicant', // Registration defaults to applicant
      phone: phone || '',
      organization: 'General Applicant'
    });

    const token = signToken(newUser);
    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: newUser._id || newUser.id,
      actorName: newUser.name,
      actorRole: 'applicant',
      action: 'Applicant Registered',
      targetType: 'User Account',
      targetReference: newUser.email,
      outcome: 'Success'
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'An internal error occurred during registration.' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const store = getStore();
    const user = await store.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User record not found.' });
    }

    return res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization || '',
      phone: user.phone || ''
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve profile.' });
  }
}

export async function updateProfile(req, res) {
  try {
    const store = getStore();
    const user = await store.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User record not found.' });
    }

    const { name, phone, organization, currentPassword, newPassword } = req.body;
    const updates = {};

    if (name && name.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (organization !== undefined) updates.organization = organization.trim();

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Validation Error', message: 'Current password is required to set a new password.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Validation Error', message: 'New password must be at least 6 characters.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Current password does not match.' });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await store.users.findByIdAndUpdate(user._id || user.id, updates);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: user._id || user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'Profile Updated',
      targetType: 'User Account',
      targetReference: user.email,
      details: newPassword ? 'Contact details and password updated.' : 'Contact profile details updated.',
      outcome: 'Success'
    });

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        organization: updatedUser.organization || '',
        phone: updatedUser.phone || ''
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update profile.' });
  }
}

export async function getDemoAccounts(req, res) {
  // Returns safe demonstration account credentials for the prototype
  return res.json({
    description: 'Hackathon Demonstration Accounts (Click to auto-fill sign-in)',
    accounts: [
      {
        role: 'applicant',
        roleTitle: 'Applicant (Sample Citizen)',
        name: 'Arpit Kumar',
        email: 'arpit@example.com',
        passwordHint: 'Demo@123',
        description: 'Demonstration applicant with pending Scholarship Assistance application APP-2026-0152.'
      },
      {
        role: 'reviewer',
        roleTitle: 'Verification Officer (Reviewer)',
        name: 'Priya Sharma',
        email: 'reviewer@suvidha.gov.demo',
        passwordHint: 'Demo@123',
        description: 'Authorised document review officer with access to the verification workspace.'
      },
      {
        role: 'compliance',
        roleTitle: 'Compliance Officer',
        name: 'Sunil Verma',
        email: 'compliance@suvidha.gov.demo',
        passwordHint: 'Demo@123',
        description: 'Manages compliance rules and inspects validation policies.'
      },
      {
        role: 'admin',
        roleTitle: 'System Administrator',
        name: 'Rajesh Patel',
        email: 'admin@suvidha.gov.demo',
        passwordHint: 'Demo@123',
        description: 'System-level access to audit logs, configuration, and all applications.'
      }
    ]
  });
}
