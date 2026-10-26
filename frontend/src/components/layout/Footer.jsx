import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Info } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-surface-border bg-white text-ink-secondary text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Portal Identification */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-navy text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-navy">Suvidha Portal</span>
            </div>
            <p className="text-ink-secondary leading-relaxed max-w-md">
              National Application Validation, Document Authentication and Regulatory Compliance Verification System. Designed for transparent and secure citizen service delivery.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-muted border border-surface-border text-navy text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-royal" />
              <span>National e-Governance Delivery Standards Compliant</span>
            </div>
          </div>

          {/* Column 2: Plain English Overview */}
          <div className="space-y-2">
            <div className="font-semibold text-navy text-xs uppercase tracking-wider">Features</div>
            <ul className="space-y-1.5 text-ink-secondary">
              <li>Submit Application and Documents</li>
              <li>Read Information from Documents</li>
              <li>Compare Application Details</li>
              <li>Check Compliance Rules</li>
              <li>Authorised Human Review</li>
            </ul>
          </div>

          {/* Column 3: Secondary Links */}
          <div className="space-y-2">
            <div className="font-semibold text-navy text-xs uppercase tracking-wider">Information &amp; Terms</div>
            <ul className="space-y-1.5">
              <li>
                <a href="/#how-it-works" className="hover:text-royal hover:underline transition-colors">
                  How Verification Works
                </a>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-royal hover:underline transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-royal hover:underline transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link to="/compliance/rules" className="hover:text-royal hover:underline transition-colors">
                  Compliance Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-muted">
          <div>
            &copy; 2026 Suvidha Portal. All rights reserved. Government of India Standards Compliant.
          </div>
          <div className="text-center sm:text-right">
            Secured by 256-bit SSL encryption. Verifications are subject to administrative guidelines.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
