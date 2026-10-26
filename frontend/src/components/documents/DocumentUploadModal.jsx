import React, { useState } from 'react';
import { api } from '../../api/client';
import { 
  UploadCloud, 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  FileCheck,
  ShieldAlert
} from 'lucide-react';

export function DocumentUploadModal({ applicationId, isOpen, onClose, onUploadSuccess, preselectedCategory }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentCategory, setDocumentCategory] = useState(preselectedCategory || 'Identity Proof');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError('');
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB size limit. Please choose a smaller document scan.');
      setSelectedFile(null);
      return;
    }

    // Check extensions
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png', '.svg'].includes(ext)) {
      setError('Invalid file type. Only PDF, JPG, PNG, or SVG are allowed.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    if (!documentCategory) {
      setError('Please specify the document category.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentCategory', documentCategory);

      await api.uploadDocument(applicationId, formData);
      setSuccess(true);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
        setSelectedFile(null);
        setSuccess(false);
        setUploading(false);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-lg shadow-xl border border-surface-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-bg">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-royal" />
            <h3 className="font-bold text-navy text-sm">Upload Supporting Document</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-ink-secondary hover:text-navy hover:bg-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document Upload Guidelines */}
        <div className="px-6 py-3 bg-royal-light/60 border-b border-royal/20 flex items-start gap-2.5 text-xs text-navy">
          <ShieldAlert className="w-4 h-4 text-royal shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-royal">Document Upload Instructions</span>
            <span>Please ensure the document scan is clear and all numbers and names are completely legible. Maximum file size is 5MB.</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-status-error-bg border border-status-error/30 text-xs text-status-error flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-status-success-bg border border-status-success/30 text-xs text-status-success flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Document uploaded and passed through OCR extraction pipeline successfully!</span>
            </div>
          )}

          {/* Category Dropdown */}
          <div>
            <label htmlFor="modalDocumentCategory" className="block text-xs font-semibold text-navy mb-1">
              Document Category <span className="text-status-error">*</span>
            </label>
            <select
              id="modalDocumentCategory"
              value={documentCategory}
              onChange={(e) => setDocumentCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-navy text-xs"
            >
              <option value="Identity Proof">Identity Proof (Aadhaar / Voter ID / Passport)</option>
              <option value="Income Certificate">Income Certificate (Official Revenue Record)</option>
              <option value="Academic Marksheet">Academic Marksheet / University Record</option>
              <option value="Bank Passbook">Bank Account Passbook (First Page Scan)</option>
              <option value="Business Premise Proof">Business Premise Proof (Rent Deed / Tax Receipt)</option>
              <option value="Fire & Safety NOC">Fire & Safety NOC Certificate</option>
              <option value="GST Registration Certificate">GST / Udyam MSME Certificate</option>
              <option value="Ration Card">Ration Card (NFSA / BPL Card)</option>
              <option value="Age Proof Certificate">Age Proof Certificate (60+ yrs Proof)</option>
              <option value="Disability Certificate">Disability Certificate (UDID / CMO Report)</option>
              <option value="Domicile Certificate">Domicile / Residence Certificate (PRC)</option>
              <option value="Father Caste Certificate">Father Caste Certificate (Lineage Record)</option>
              <option value="Land Revenue Record">Land Revenue Record (Khasra / Khatauni)</option>
              <option value="Land Ownership Record">Land Ownership Record (Record of Rights RoR / 7-12)</option>
              <option value="Crop Sowing Certificate">Crop Sowing Certificate (Girdhawari Report)</option>
              <option value="Other Supporting Document">Other Supporting Document</option>
            </select>
          </div>

          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-navy mb-1">
              Select Scanned Document File <span className="text-status-error">*</span>
            </label>
            <div className="border-2 border-dashed border-surface-border rounded-lg p-6 text-center hover:border-royal hover:bg-royal-light/20 transition-colors">
              <input
                type="file"
                id="file-upload-input"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.svg"
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-royal mb-2" />
                <span className="text-xs font-semibold text-navy hover:underline">
                  Click to select file from your computer
                </span>
                <span className="text-[11px] text-ink-secondary mt-1">
                  Supported: PDF, JPG, PNG (Max size: 5MB)
                </span>
              </label>

              {selectedFile && (
                <div className="mt-4 p-3 bg-white border border-surface-border rounded-md flex items-center justify-between text-xs text-left">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-royal shrink-0" />
                    <span className="font-semibold text-navy truncate">{selectedFile.name}</span>
                    <span className="text-ink-secondary text-[11px]">
                      ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-ink-secondary hover:text-status-error p-1"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-surface-border">
            <button
              type="button"
              disabled={uploading}
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold text-ink-primary hover:bg-surface-bg border border-surface-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              style={{
                backgroundColor: (uploading || !selectedFile) ? '#94A3B8' : '#2F6FED',
                color: '#FFFFFF'
              }}
              className="px-5 py-2 rounded-md text-xs font-bold text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer hover:brightness-110 select-none"
            >
              {uploading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing &amp; Ingesting...</span>
                </>
              ) : (
                <span>Upload &amp; Analyze</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
