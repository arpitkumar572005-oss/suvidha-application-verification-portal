# Dashboard Module-by-Module Explanation

This document provides a comprehensive technical breakdown of every dashboard page, tab, module, card, table, button, and interactive component in the Suvidha portal.

---

## 1. Master Module Summary Table

| Dashboard Module | Purpose | Primary User Actions | Frontend File | Backend Function / API | Data Source | AI / Algorithmic Model | Actual Working Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Top Navigation & Role Switcher** | Global navigation, active portal view indicator, and instant role switching. | Click "Portal View", select role, click logo/links, click Sign Out. | `frontend/src/components/layout/Header.jsx` | `POST /api/auth/login` (via `switchDemoRole`) | `backend/data/users.json` or MongoDB | None | **Fully Functional** |
| **Portal Sign-In Page** | Authenticates users and provides quick-fill demo profiles. | Enter credentials or click pre-configured profile button, submit login form. | `frontend/src/pages/SignInPage.jsx` | `POST /api/auth/login`, `GET /api/auth/demo-accounts` | `backend/data/users.json` or MongoDB | None (bcryptjs password verify) | **Fully Functional** |
| **Applicant Dashboard** | Displays citizen welcome banner, quick stats, and list of submitted applications. | Click "Start New Application", click "Refresh list", click table row to view details. | `frontend/src/pages/ApplicantDashboardPage.jsx` | `GET /api/applications` | `backend/data/applications.json` | None | **Fully Functional** |
| **New Application Wizard (Step 1: Details)** | Collects applicant profile, scheme parameters, family income, and bank DBT details. | Enter form fields, select scheme category, click "Continue to Upload Documents". | `frontend/src/pages/NewApplicationPage.jsx` | None (Client state validation) | React component state | None | **Fully Functional** |
| **New Application Wizard (Step 2: Uploads)** | Displays required document checklist, file upload inputs, and quick sample filler. | Click "Choose File", click "Auto-fill Supporting Documents", remove file, click "Continue". | `frontend/src/pages/NewApplicationPage.jsx` | None (Staged in component state) | Client memory / synthetic Blobs | None | **Fully Functional** |
| **New Application Wizard (Step 3: Review & Submit)** | Previews all entered details and documents before permanent submission. | Click "Back to Step 2", click "Submit Application Now". | `frontend/src/pages/NewApplicationPage.jsx` | `POST /api/applications`, `POST /api/applications/:id/documents`, `POST /api/applications/:id/submit` | `backend/data/applications.json`, `backend/data/documents.json` | Simulated OCR extraction + Comparison Engine + Scoring Engine | **Fully Functional** |
| **Application Submission Receipt** | Displays generated reference number, application summary, and navigation shortcuts. | Click "Go to My Applications Dashboard", click "View Submitted Dossier". | `frontend/src/pages/NewApplicationPage.jsx` | Stored application response from backend | Local state / Backend response | None | **Fully Functional** |
| **Citizen Application Dossier Page** | Complete view of applicant declarations, uploaded files, findings, and review notes. | Switch tabs (Overview, Documents, Extracted, Findings, Activity), upload replacement scan. | `frontend/src/pages/ApplicationDetailsPage.jsx` | `GET /api/applications/:id`, `POST /api/applications/:id/documents` | Stored JSON/Mongo records | Levenshtein Comparison & Risk Engine | **Fully Functional** |
| **Document Upload Modal** | Dedicated pop-up to upload or replace a certificate scan. | Select document category, drag-and-drop or browse file, click "Confirm & Upload". | `frontend/src/components/documents/DocumentUploadModal.jsx` | `POST /api/applications/:applicationId/documents` | Multer disk storage + `documents.json` | `MockOcrAdapter.processDocument()` | **Fully Functional** |
| **Reviewer Dashboard (Review Queue)** | Displays queue of submitted citizen applications with live search and status filters. | Type in search input, select status filter dropdown, click "Open Workspace" button. | `frontend/src/pages/ReviewerDashboardPage.jsx` | `GET /api/applications?status=&search=` | `backend/data/applications.json` | Real-time queue queries | **Fully Functional** |
| **Reviewer Workspace: Section 1 (Applicant Info)** | Displays structured card of applicant personal, academic, and financial declarations. | Read-only inspection of applicant claims. | `frontend/src/pages/VerificationWorkspacePage.jsx` | `GET /api/applications/:id/verification-workspace` | `backend/data/applications.json` | None | **Fully Functional** |
| **Reviewer Workspace: Section 2 (Uploaded Documents)** | Interactive document tabs, scan preview, and extracted field table. | Click document category tab, click "Open Full Resolution Scan". | `frontend/src/pages/VerificationWorkspacePage.jsx` | `GET /api/applications/:id/verification-workspace`, `GET /api/documents/:id/file` | `backend/uploads/*`, `documents.json` | Automated Scan Extraction (`MockOcrAdapter`) | **Fully Functional** |
| **Reviewer Workspace: Section 3 (Verification Findings)** | Clear summary table (Required documents, Personal details, Expiry dates, Authenticity checks). | Review row-by-row match statuses and plain-English discrepancy explanations. | `frontend/src/pages/VerificationWorkspacePage.jsx` | `latestRun` from `verificationRuns.json` | `verificationRuns.json` | Levenshtein Distance Matrix + Risk Engine | **Fully Functional** |
| **Reviewer Workspace: Section 4 (Decision Panel)** | Decision buttons (Approve, Request Re-upload, Refer for Manual Verification, Reject) with notes. | Select decision, check documents needing re-upload (if applicable), enter reason, click "Confirm & Save". | `frontend/src/pages/VerificationWorkspacePage.jsx` | `POST /api/applications/:id/reviews` | `applications.json`, `auditEvents.json` | None | **Fully Functional** |
| **Compliance Rules Matrix Page** | Administrative grid displaying statutory verification policies and severity levels. | Click rule toggle button to switch active/disabled status, click "Reload". | `frontend/src/pages/ComplianceRulesPage.jsx` | `GET /api/compliance-rules`, `PATCH /api/compliance-rules/:id/toggle` | `complianceRules.json` | `ComplianceRulesEngine` | **Fully Functional** |
| **System Audit Log Page** | Security event log with zero-PII guarantee, actor roles, and outcome badges. | Search by actor/reference, filter by role, filter by action, click "Refresh Logs". | `frontend/src/pages/AuditLogPage.jsx` | `GET /api/audit-events?actorRole=&action=&search=` | `auditEvents.json` | None | **Fully Functional** |

---

## 2. In-Depth Module Explanations

### Module 1: Top Navigation Bar and Portal View Switcher
- **File:** `frontend/src/components/layout/Header.jsx`
- **Purpose:** Serves as the primary header and accessibility bar. It identifies the portal as the *National Application & Document Authentication Portal* and provides a 1-click **Portal View Switcher** dropdown.
- **When Opened:** Reads the currently logged-in user from `AuthContext`. If no user is logged in, displays "Citizen".
- **User Actions:**
  - Clicking the **Portal View** button toggles a menu containing 4 roles:
    1. *Citizen / Applicant Portal* (`applicant`)
    2. *Verification Officer Desk* (`reviewer`)
    3. *Compliance Directorate* (`compliance`)
    4. *System Administration* (`admin`)
  - Selecting any role triggers `switchDemoRole(targetRole)` in `frontend/src/context/AuthContext.jsx`, which automatically authenticates using pre-seeded credentials (`Demo@123`) and redirects to that role's primary dashboard.
  - Clicking the **Sign Out** button invokes `logout()` in `AuthContext`, removes `suvidha_token` from `localStorage`, and redirects to `/`.
- **Data Flow:** `Header.jsx` → `useAuth()` → `api.login()` → `POST /api/auth/login` → Server returns JWT → Stored in `localStorage`.

---

### Module 2: Applicant Dashboard (`/applicant/dashboard`)
- **File:** `frontend/src/pages/ApplicantDashboardPage.jsx`
- **Purpose:** Gives citizens a single clear view of their submitted applications, their current review status, and the immediate next action required.
- **When Opened:** Executes `loadData()` inside a `useEffect` hook, calling `api.getApplications()`.
- **Components & Cards:**
  1. **Welcome Card:** Displays "Welcome back, {user.name}" (defaults to Arpit Kumar) with a prominent orange button: **"Start New Application"** linking to `/applicant/new-application`.
  2. **My Applications Table:** Displays:
     - *Reference Number:* Monospace link to `/applications/{id}` (e.g. `APP-2026-0152`).
     - *Service Name:* Name of the scheme (e.g. "Scholarship Assistance (Post-Matric Scheme)").
     - *Submission Date:* Formatted Indian local date string.
     - *Current Status:* Rendered with `StatusBadge` (colors: green for Verified, amber for Re-upload Requested / Under Review, red for Rejected).
     - *Required Next Action:* Dynamic human-readable text generated by `getStatusExplanation(app)`. For example, if status is `Re-upload Requested`, it displays: *"Please upload the missing Bank Passbook."*
     - *Open Details Link:* Right arrow button linking to `/applications/{id}`.
- **Data Source:** Real persisted records returned by `backend/src/controllers/applicationController.js` scoped to the authenticated user ID (`req.user.id`).

---

### Module 3: New Application Wizard (`/applicant/new-application`)
- **File:** `frontend/src/pages/NewApplicationPage.jsx`
- **Purpose:** Guides citizens through a 3-step structured application workflow with real-time field validation, document attachment, and review prior to submission.
- **Workflow Steps:**
  - **Step 1: Applicant Details**
    - Accepts: Full Name, Email Address, Phone Number, Application Type / Scheme Category, Declared Annual Family Income, Academic Institution, Student Roll Number, Bank Account Number, and IFSC Code.
    - Button: *"Continue to Upload Documents"* (validates mandatory fields before proceeding to Step 2).
  - **Step 2: Upload Supporting Documents**
    - Displays an itemized checklist of required documents:
      1. *Identity Proof* (Aadhaar / Voter ID / Passport) [Mandatory]
      2. *Income Certificate* (Revenue Department Record) [Mandatory]
      3. *Academic Marksheet* (Semester Grade Report) [Optional / Scheme-dependent]
      4. *Bank Passbook* (First Page Account Scan) [Optional / DBT-dependent]
    - Each row shows an attachment status badge (*Missing* in amber, *Attached* in green with file size and remove button).
    - **Quick Shortcut Button:** `"+ Auto-fill Supporting Documents (Quick Test)"` automatically stages authentic sample files (`sample_arpit_id_proof.svg`, `sample_arpit_income_cert.svg`, etc.) so evaluators can test the entire pipeline in seconds.
    - Buttons: *"Back to Step 1"* and *"Continue to Review & Submit"*.
  - **Step 3: Review Application Before Submission**
    - Read-only summary cards displaying all entered personal and financial details.
    - Document attachment summary.
    - Button: *"Submit Application Now"* triggers `handleFinalSubmit()`.
- **What Happens on Submission (`handleFinalSubmit`):**
  1. Sends `POST /api/applications` with the form details. Backend generates reference `APP-2026-XXXX` and creates a Draft record.
  2. Loops through attached files, sending `POST /api/applications/:id/documents` for each file.
  3. Sends `POST /api/applications/:id/submit`, which triggers `runVerificationPipeline(appId)` on the backend.
  4. Renders the **Confirmation Receipt** screen showing the reference number, summary, and dashboard shortcuts.

---

### Module 4: Reviewer Applications Queue (`/reviewer/dashboard`)
- **File:** `frontend/src/pages/ReviewerDashboardPage.jsx`
- **Purpose:** The central operational dashboard for verification officers to triage, search, and inspect pending citizen applications.
- **When Opened:** Calls `api.getApplications({ status, search })` and populates the table.
- **Key Features & Controls:**
  - **Search Input Form:** Accepts applicant name or application reference string. Submitting triggers real-time query filtering on the backend.
  - **Filter by Status Dropdown:** Filters by `All`, `Under Review`, `Submitted`, `Re-upload Requested`, `Verified`, or `Rejected`.
  - **Applications Table:**
    - *Reference & Priority:* Displays reference number and priority badge (`High` in rose or `Normal` in slate). Priority is automatically promoted to `High` by the pipeline if mismatches or missing documents are detected.
    - *Applicant Details:* Name and email.
    - *Scheme / Service:* Application type and declared income.
    - *Submission Date:* Timestamp of formal submission.
    - *Missing Documents:* Red badge if documents are missing, or green check if complete.
    - *Preliminary Findings:* Summary text (e.g. *"Discrepancy in applicant name"*, *"Income exceeds limit"*, or *"All details consistent"*).
    - *Status Badge:* Official administrative status.
    - *Open Workspace Button:* Saffron button navigating directly to `/reviewer/workspace/{id}`.

---

### Module 5: Verification Workspace (`/reviewer/workspace/:id`)
- **File:** `frontend/src/pages/VerificationWorkspacePage.jsx`
- **Purpose:** The flagship decision-support interface. It consolidates all information required for an officer to make an informed, auditable decision without switching screens.
- **Four Distinct Sections:**
  1. **Section 1: Applicant Information:**
     - Displays full name, email, social category, declared income (formatted in Indian Rupees), institution name, roll number, bank account number, and IFSC code.
  2. **Section 2: Uploaded Documents & Scan Viewer:**
     - Tab bar listing all attached documents (`Identity Proof`, `Income Certificate`, etc.).
     - Left column: Document scan preview with zoom in/out, file size indicator, and link to *"Open Full Resolution Scan"*.
     - Right column: **"Read Information from Document"** card labeled with badge `Automated Scan Extraction`. Displays extracted document number, extracted name, income, issue date, expiry date, issuing authority, and OCR confidence percentage.
  3. **Section 3: Verification Findings (Summary Table):**
     - Row 1: **Required documents** (Result: *Complete* or *Incomplete*, with explanation of missing items).
     - Row 2: **Personal details** (Result: *Match*, *Mismatch*, or *Unable to compare*, with character discrepancy explanation).
     - Row 3: **Expiry dates** (Result: *Valid*, *Expired*, or *Unable to determine*).
     - Row 4: **Authenticity checks** (Result: *No indicators found*, confirming file structure integrity).
     - Secondary card: **Preliminary Assessment** displaying the explainable risk score (e.g. `Medium Risk (25/100)`) with clear notice that this score is advisory and does not replace officer examination.
  4. **Section 4: Reviewer Decision Panel:**
     - Four distinct action buttons:
       - **Approve:** Updates status to `Verified`.
       - **Request Re-upload:** Displays a multi-select checklist of documents to request (e.g. *Bank Passbook*, *Identity Proof*). Updates status to `Re-upload Requested`.
       - **Refer for Manual Verification:** Updates status to `Manual Review Required` for on-ground physical inspection.
       - **Reject:** Prompts for mandatory rejection reason. Updates status to `Rejected`.
     - Clicking **"Confirm & Save Decision"** sends `POST /api/applications/:id/reviews`, updates database records, logs an audit event, and refreshes the view.
     - **Previous Review Notes:** Lists the chronological history of all comments and actions recorded by reviewers on this file.

---

### Module 6: Compliance Rules Matrix (`/compliance/rules`)
- **File:** `frontend/src/pages/ComplianceRulesPage.jsx`
- **Purpose:** Allows compliance officers to review and manage the automated verification rules executed during pipeline ingestion.
- **When Opened:** Calls `api.getComplianceRules()` which fetches from `backend/data/complianceRules.json` or MongoDB.
- **Interactive Controls:**
  - **Rule Cards:** Displays Rule Code (e.g. `RULE_MANDATORY_DOCS`), Version, Severity Badge (`High`, `Medium`, `Low`), Category, and Description.
  - **Active / Disabled Toggle Button:** Clicking the toggle calls `api.toggleRule(ruleId, !enabled)`. The backend updates the rule's `enabled` boolean property, persists it, logs an audit event, and immediately returns the updated state.
  - Subsequent verification runs on applications respect these toggles (e.g. disabling `RULE_DOC_VALIDITY` will stop flagging expired certificates).

---

### Module 7: Security Audit Log (`/admin/audit-logs`)
- **File:** `frontend/src/pages/AuditLogPage.jsx`
- **Purpose:** Provides administrators and evaluators with a complete, tamper-traceable record of every system event.
- **When Opened:** Calls `api.getAuditEvents()` and renders a responsive event table.
- **Privacy Guarantee:** Displays the **Zero PII Privacy Policy** banner explaining that passwords, tokens, and raw confidential identifiers are stripped prior to storage.
- **Interactive Controls:**
  - **Search Input:** Searches actor names, reference numbers, or action descriptions.
  - **Filter by Role:** `All`, `applicant`, `reviewer`, `compliance`, `admin`, `system`.
  - **Filter by Action:** `All`, `Sign In`, `Submit Application`, `Document Upload`, `Verification Pipeline`, `Reviewer Decision`, `Rule Toggle`.
  - **Refresh Logs Button:** Reloads the event stream.
