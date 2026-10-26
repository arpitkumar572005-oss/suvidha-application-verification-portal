import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  FileEdit,
  Eye
} from 'lucide-react';

export function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'Verified':
    case 'Approved':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#DCFCE7] text-[#15803D] border border-[#15803D]/20 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Verified</span>
        </span>
      );

    case 'Action Required':
    case 'Re-upload Requested':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/30 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Action Required</span>
        </span>
      );

    case 'Under Review':
    case 'Reviewer Assigned':
    case 'Compliance Review':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#DBEAFE] text-[#2563EB] border border-[#2563EB]/25 ${sizeClasses}`}>
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );

    case 'Manual Review Required':
    case 'Recheck Required':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/30 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{status === 'Recheck Required' ? 'Recheck Required' : 'Manual Review'}</span>
        </span>
      );

    case 'Submitted':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] text-[#64748B] border border-[#64748B]/25 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Submitted</span>
        </span>
      );

    case 'Rejected':
    case 'Escalated':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/25 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );

    case 'Withdrawn':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] text-[#64748B] border border-[#64748B]/30 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Withdrawn</span>
        </span>
      );

    case 'Draft':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] text-[#64748B] border border-[#64748B]/30 ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Draft</span>
        </span>
      );
  }
}

export default StatusBadge;
