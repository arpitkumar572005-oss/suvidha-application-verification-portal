import path from 'path';
import fs from 'fs';
import { getStore } from '../storage/db.js';
import { getOcrAdapter } from '../services/ocr/ocrAdapter.js';
import { AuditService } from '../services/audit/auditService.js';
import { runVerificationPipeline } from '../services/verification/verificationPipeline.js';

export async function uploadDocument(req, res) {
  try {
    const applicationId = req.params.applicationId || req.params.id;
    const { documentCategory } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Validation Error', message: 'No document file was uploaded.' });
    }

    if (!documentCategory) {
      // Remove temporary uploaded file if validation fails
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Validation Error', message: 'Document category is required.' });
    }

    const store = getStore();
    const application = await store.applications.findById(applicationId);
    if (!application) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    // Authorization: only applicant owner, reviewer, or admin
    if (req.user.role === 'applicant' && application.applicantId !== req.user.id) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to upload documents for this application.' });
    }

    // Check if a document with this category already exists -> mark older as replaced
    const existingSameCat = await store.documents.find({ applicationId, documentCategory });
    for (const oldDoc of existingSameCat) {
      await store.documents.findByIdAndUpdate(oldDoc._id || oldDoc.id, { status: 'Replaced' });
    }

    // Run OCR adapter
    const ocrAdapter = getOcrAdapter();
    const extractedData = await ocrAdapter.processDocument(
      {
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        documentCategory,
        filePath: req.file.path
      },
      {
        applicantName: application.applicantName,
        annualFamilyIncome: application.annualFamilyIncome,
        rollNumber: application.rollNumber,
        bankAccountNumber: application.bankAccountNumber,
        bankIfscCode: application.bankIfscCode
      }
    );

    // Create document record
    const docRecord = await store.documents.create({
      applicationId,
      applicantId: application.applicantId,
      documentCategory,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      extractedData,
      status: 'Processed'
    });

    // If re-upload was requested, update requestedReuploadDocs list
    if (application.requestedReuploadDocs && application.requestedReuploadDocs.includes(documentCategory)) {
      const remainingRequested = application.requestedReuploadDocs.filter(cat => cat !== documentCategory);
      await store.applications.findByIdAndUpdate(applicationId, {
        requestedReuploadDocs: remainingRequested,
        status: remainingRequested.length === 0 ? 'Under Review' : 'Re-upload Requested'
      });
    }

    // Log audit event
    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'Document Uploaded',
      targetType: 'Document',
      targetReference: application.referenceNumber,
      details: `Uploaded ${documentCategory} (${req.file.originalname}, ${Math.round(req.file.size / 1024)} KB). Processed via OCR Adapter.`,
      outcome: 'Success'
    });

    // Automatically re-run verification pipeline to update findings
    try {
      await runVerificationPipeline(applicationId, {
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role
      });
    } catch (verErr) {
      console.warn('Auto-verification run notice:', verErr.message);
    }

    return res.status(201).json({
      document: docRecord,
      message: 'Document uploaded and analyzed successfully.'
    });
  } catch (err) {
    console.error('uploadDocument error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to upload document.' });
  }
}

export async function getDocuments(req, res) {
  try {
    const applicationId = req.params.applicationId || req.params.id;
    const store = getStore();
    const application = await store.applications.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && application.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to view documents for this application.' });
    }

    const documents = await store.documents.find({ applicationId });
    return res.json({ documents });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve documents.' });
  }
}

export async function getDocumentFile(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const document = await store.documents.findById(id);

    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Document not found.' });
    }

    const application = await store.applications.findById(document.applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Associated application not found.' });
    }

    // Authorization check
    if (req.user.role === 'applicant' && application.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to access this document.' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'Not Found', message: 'File is not present on storage server.' });
    }

    // Set safe download / preview headers
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalFileName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const readStream = fs.createReadStream(document.filePath);
    readStream.pipe(res);
  } catch (err) {
    console.error('getDocumentFile error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to stream document file.' });
  }
}

export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const store = getStore();
    const document = await store.documents.findById(id);

    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Document record not found.' });
    }

    const application = await store.applications.findById(document.applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: 'Associated application not found.' });
    }

    if (req.user.role === 'applicant' && application.applicantId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to delete this document.' });
    }

    // Delete file from disk if exists
    if (fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (e) {
        console.warn('Failed to delete physical file:', e.message);
      }
    }

    await store.documents.findByIdAndDelete(id);

    const auditService = new AuditService(store.auditEvents);
    await auditService.log({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'Document Deleted',
      targetType: 'Document',
      targetReference: application.referenceNumber,
      details: `Removed ${document.documentCategory} (${document.originalFileName}).`,
      outcome: 'Success'
    });

    return res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('deleteDocument error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to delete document.' });
  }
}
