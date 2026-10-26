# Project Overview: Suvidha Application Validation Portal

## 1. Project Purpose and Problem Solved

### The Problem
In government public service delivery and citizen scholarship / welfare schemes, administrative departments process thousands of citizen applications accompanied by supporting certificates (Identity Proof, Income Certificates, Academic Marksheets, and Bank Passbooks). Verification officers face severe operational bottlenecks:
- **Manual document checking** is slow, error-prone, and causes long turnaround delays for citizens.
- **Inconsistencies go undetected**, such as minor or major name discrepancies between the application form and the certificate, expired validity dates, or income limits exceeding scheme ceilings.
- **Missing documents** lead to late rejections rather than immediate, explainable re-upload requests.
- **Risks of opaque automated systems:** Many AI prototypes claim to predict "fraud" automatically with a black-box percentage, which is legally dangerous, untrustworthy, and violates administrative fairness principles.

### The Solution: Suvidha Portal
**Suvidha** is an AI-powered Application Validation, Document Authentication, and Regulatory Compliance Verification platform designed for transparent, explainable public-service delivery.
- It assists **citizens** by allowing them to fill out standardized applications, attach supporting documents, and receive clear status updates and specific re-upload notices.
- It assists **authorized reviewing officers** through an explainable Decision-Support Workspace that performs automated scan extraction (OCR), cross-field consistency matching, and rule-based compliance checks.
- **Zero Black-Box Fraud Labeling:** The system produces explainable preliminary assessments with itemized deductions. It **never** autonomously marks an application fraudulent or rejected based solely on an AI score; all final decisions are recorded by an authorized human reviewer.

---

## 2. Target Users and Main Use Cases

| User Role | Persona in System | Main Use Cases |
| :--- | :--- | :--- |
| **Citizen / Applicant** | Arpit Kumar (`arpit@example.com`) | 1. Submit welfare and scholarship applications.<br>2. Upload and replace supporting certificates (PDF, JPG, PNG up to 5MB).<br>3. Track application status, review progress, and read officer remarks.<br>4. Respond to re-upload requests for missing or blurry certificates. |
| **Verification Officer / Reviewer** | Priya Sharma (`reviewer@suvidha.gov.demo`) | 1. Access the pending applications review queue with search and status filtering.<br>2. Inspect applicant dossier in the 4-section Verification Workspace.<br>3. Review side-by-side document scans and extracted data.<br>4. Inspect cross-field comparisons, rule evaluations, and preliminary risk indicators.<br>5. Record binding official decisions: *Approve*, *Request Re-upload*, *Refer for Manual Verification*, or *Reject* (with mandatory reasons). |
| **Compliance Officer** | Sunil Verma (`compliance@suvidha.gov.demo`) | 1. Inspect active regulatory compliance rules.<br>2. Monitor rule severity ratings (High, Medium, Low) and verification criteria.<br>3. Dynamically toggle verification rules on or off to test policy adjustments. |
| **System Administrator** | Rajesh Patel (`admin@suvidha.gov.demo`) | 1. Inspect tamper-traceable audit event logs with Zero-PII protection.<br>2. Filter audit trails by actor role, action type, or application reference.<br>3. Monitor end-to-end system activity and operational health. |

---

## 3. Complete List of Features and Modules

### A. Authentication & Role Management Module
- **JWT-based Authentication:** Token generation with 24-hour expiration (`backend/src/middleware/auth.js`).
- **Password Security:** Salted hashing with `bcryptjs` (cost factor 10).
- **Role-Based Access Control (RBAC):** Middleware authorization protecting applicant, reviewer, compliance, and admin endpoints.
- **Portal View Switcher:** 1-click header switcher allowing instant role evaluation without manual logout/login cycles.

### B. Citizen Application Module
- **Step-by-Step Application Wizard:** 3-step structured form covering Personal Details, Supporting Document Checklist, and Review-Before-Submit preview (`frontend/src/pages/NewApplicationPage.jsx`).
- **Dynamic Reference Generation:** Backend-generated standardized reference numbers (e.g. `APP-2026-0152`).
- **Applicant Dashboard:** Real-time summary table displaying reference, service title, submission date, status badge, and human-readable next actions (`frontend/src/pages/ApplicantDashboardPage.jsx`).
- **Dossier Overview Page:** Complete tabbed view separating application fields, uploaded documents, OCR extracted details, verification findings, and reviewer note history (`frontend/src/pages/ApplicationDetailsPage.jsx`).

### C. Document Ingestion & Storage Module
- **Multi-Format Ingestion:** Accepts PDF, JPG, PNG, and SVG scans up to 5MB (`backend/src/middleware/upload.js`).
- **Safe Server Storage:** Randomizes internal filenames using UUIDv4 (`backend/uploads/`) to prevent path traversal and direct URL harvesting.
- **Document Re-upload Handling:** Uploading a replacement certificate automatically retires the prior scan and updates review queue checklists.

### D. Automated Document Analysis Engine (OCR Adapter)
- **Modular Adapter Architecture:** Separates file ingestion from OCR extraction logic (`backend/src/services/ocr/ocrAdapter.js`).
- **Structured Field Extraction:** Extracts document numbers, full names, dates of birth, issue dates, expiry dates, income values, and issuing authorities.

### E. Cross-Field Comparison Engine
- **Fuzzy String Matching:** Calculates Levenshtein string distance similarity to detect minor typos versus major discrepancies (`backend/src/services/comparison/comparisonEngine.js`).
- **Deterministic Field Checks:** Compares declared name against Identity Proof, income amount against Income Certificate, student roll number against Marksheet, and bank account against Passbook.

### F. Compliance Rules Evaluation Engine
- **Policy Verification Matrix:** Evaluates 5 core statutory compliance rules (`backend/src/services/rules/complianceRulesEngine.js`):
  1. `RULE_MANDATORY_DOCS` (Document presence)
  2. `RULE_DOC_VALIDITY` (Expiration check)
  3. `RULE_NAME_CONSISTENCY` (Cross-document consistency)
  4. `RULE_INCOME_CEILING` (Financial limit check)
  5. `RULE_REQUIRED_FIELDS` (Form completeness)
- **Rule Management:** Interactive toggles allow compliance officers to activate or deactivate rules in real time (`frontend/src/pages/ComplianceRulesPage.jsx`).

### G. Decision-Support Risk Assessment Engine
- **Transparent Additive Scoring:** Calculates an explainable score from 0 to 100 based on observable deductions (missing documents: +25 each, name discrepancy: +25, income discrepancy: +20, flagged rules: +10 to +25) (`backend/src/services/scoring/riskScoringEngine.js`).
- **Risk Categorization:** Low Risk (<25), Medium Risk (25-54), High Risk (>=55).
- **Explainability First:** Provides itemized breakdown descriptions and suggested reviewer actions.

### H. Verification Officer Workspace
- **Single-Screen Officer Desk:** Organizes review into four clear sections:
  1. *Applicant Information*
  2. *Uploaded Documents & Scan Viewer*
  3. *Verification Summary Table* (Required documents, Personal details, Expiry dates, Authenticity checks)
  4. *Reviewer Decision Panel* (Approve, Request Re-upload, Refer for Manual Verification, Reject)
- **Review History & Notes:** Displays previous review notes and logs every official decision into the database.

### I. Security Audit Logging Module
- **Tamper-Traceable Trail:** Records all logins, submissions, automated verification runs, rule toggles, and reviewer decisions (`backend/src/services/audit/auditService.js`).
- **Zero-PII Privacy Protection:** Passwords, auth tokens, and raw confidential identifiers are stripped prior to storage.
- **Administrative Audit Table:** Real-time search and filtering by actor role and action type (`frontend/src/pages/AuditLogPage.jsx`).

---

## 4. What Is Implemented vs What Is a Mock / Simulation

To maintain complete engineering honesty and academic rigor, the table below specifies the exact implementation status of each system capability:

| Capability | Actual Implementation Status | Where in Code | Technical Details |
| :--- | :--- | :--- | :--- |
| **REST API Server** | **Fully Functional & Real** | `backend/src/server.js` | Express.js running on port 5000 with CORS, JSON body parser, and centralized error handling. |
| **Frontend Single Page App** | **Fully Functional & Real** | `frontend/src/App.jsx` | React 18 + Vite running on port 3000 with React Router 6, Tailwind CSS, and protected route guards. |
| **Database & Persistence** | **Fully Functional Dual-Mode** | `backend/src/storage/db.js`, `jsonStore.js` | Supports MongoDB when available; automatically falls back to persistent local JSON files in `backend/data/*.json` with CRUD operations. |
| **File Upload & Disk Storage** | **Fully Functional & Real** | `backend/src/middleware/upload.js` | Multer disk storage, UUIDv4 renaming, file-type filtering (PDF, JPG, PNG), 5MB size limit. |
| **Authentication & RBAC** | **Fully Functional & Real** | `backend/src/middleware/auth.js` | JWT Bearer token generation, bcrypt password hashing, role enforcement (`applicant`, `reviewer`, `compliance`, `admin`). |
| **Cross-Document Comparison** | **Fully Functional Algorithm** | `backend/src/services/comparison/comparisonEngine.js` | Real Levenshtein distance matrix algorithm calculates string similarity percentages and detects mismatches. |
| **Compliance Rules Engine** | **Fully Functional & Real** | `backend/src/services/rules/complianceRulesEngine.js` | Real evaluation logic checks document presence, expiry dates, income ceiling thresholds, and form completeness. |
| **Risk Scoring Engine** | **Fully Functional Algorithm** | `backend/src/services/scoring/riskScoringEngine.js` | Real mathematical calculation summing penalty weights into a 0–100 score with explainable breakdown. |
| **Audit Logging** | **Fully Functional & Real** | `backend/src/services/audit/auditService.js` | Real append-only event logging with timestamp, actor, target, action, and outcome. |
| **OCR Document Extraction** | **Simulated Adapter (`MockOcrAdapter`)** | `backend/src/services/ocr/ocrAdapter.js` | Uses an extensible Adapter pattern. It simulates realistic text extraction from document metadata and filenames rather than running a heavy neural network like Tesseract or AWS Textract locally. |
| **External Government DB Verification** | **Simulated / Not Connected** | `backend/src/services/comparison/comparisonEngine.js` | Authenticity checks inspect file metadata and structural integrity. No live external government databases (e.g. UIDAI, DigiLocker, or State Revenue APIs) are interfaced. |
