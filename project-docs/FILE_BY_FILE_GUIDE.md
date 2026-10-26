# Complete File-by-File Guide

This guide provides a comprehensive directory tree and simple, plain-English explanations for every source code file in the Suvidha project.

---

## 1. Complete Project Directory Tree

```
suvidha-portal/
├── README.md                      # Project documentation and hackathon case file
├── package.json                   # Root monorepo workspace scripts
├── start-portal.ps1               # PowerShell one-click launcher for frontend + backend
│
├── backend/                       # Node.js + Express REST API Backend
│   ├── .env                       # Active runtime environment variables
│   ├── .env.example               # Example template for environment configuration
│   ├── package.json               # Backend dependencies and test scripts
│   ├── data/                      # Local JSON Store (Zero-config persistence)
│   │   ├── applications.json      # Stored citizen application dossiers
│   │   ├── auditEvents.json       # Stored tamper-traceable audit events
│   │   ├── complianceRules.json   # Stored statutory verification rules
│   │   ├── documents.json         # Stored document records and extracted OCR fields
│   │   ├── users.json             # Stored user profiles with bcrypt hashes
│   │   └── verificationRuns.json  # Stored verification run outcomes
│   ├── uploads/                   # Stored physical file uploads (UUID filenames)
│   ├── src/                       # Backend Source Code
│   │   ├── server.js              # Express app initialization and HTTP server start
│   │   ├── config/
│   │   │   └── index.js           # Centralized configuration loaded from .env
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification and RBAC role authorization
│   │   │   └── upload.js          # Multer disk upload with file type/size filter
│   │   ├── routes/
│   │   │   └── api.js             # Express router defining all /api/* routes
│   │   ├── controllers/
│   │   │   ├── applicationController.js # Handles application creation, retrieval, submission
│   │   │   ├── auditController.js       # Handles querying of audit event logs
│   │   │   ├── authController.js        # Handles user login, registration, demo accounts
│   │   │   ├── complianceRulesController.js # Handles listing and toggling compliance rules
│   │   │   ├── documentController.js    # Handles file upload, download, and auto-verification
│   │   │   └── verificationController.js# Handles workspace data and reviewer decisions
│   │   ├── services/
│   │   │   ├── audit/
│   │   │   │   └── auditService.js      # Zero-PII event logging service
│   │   │   ├── comparison/
│   │   │   │   └── comparisonEngine.js  # Levenshtein string distance similarity engine
│   │   │   ├── ocr/
│   │   │   │   └── ocrAdapter.js        # Extensible OCR ingestion adapter interface
│   │   │   ├── rules/
│   │   │   │   └── complianceRulesEngine.js # Compliance rule evaluation engine
│   │   │   ├── scoring/
│   │   │   │   └── riskScoringEngine.js # Explainable additive risk calculation engine
│   │   │   └── verification/
│   │   │       └── verificationPipeline.js # Orchestrates Stages 1-5 verification workflow
│   │   ├── seeds/
│   │   │   └── seedData.js              # Seeds initial case file (Arpit Kumar APP-2026-0152)
│   │   └── storage/
│   │       ├── db.js                    # Dual-mode storage adapter (MongoDB vs JSON store)
│   │       └── jsonStore.js             # Mongoose-like async querying layer over JSON files
│   └── tests/
│       ├── api.test.js            # End-to-end integration tests for REST API routes
│       └── engines.test.js        # Unit tests for comparison and scoring algorithms
│
└── frontend/                      # React 18 + Vite Single Page Application
    ├── index.html                 # HTML entry point with title and fonts
    ├── package.json               # Frontend dependencies and build scripts
    ├── postcss.config.js          # PostCSS configuration for Tailwind CSS
    ├── tailwind.config.js         # Government Saffron + Neutral design tokens
    ├── vite.config.js             # Vite config with /api proxy to localhost:5000
    ├── public/
    │   └── favicon.svg            # Custom government portal shield SVG icon
    └── src/                       # Frontend React Source Code
        ├── App.jsx                # Router setup, route definitions, role protection
        ├── index.css              # Global Tailwind CSS imports and baseline styling
        ├── main.jsx               # React DOM root render entry point
        ├── api/
        │   └── client.js          # Unified HTTP client handling auth tokens and API calls
        ├── context/
        │   └── AuthContext.jsx    # Authentication provider, user state, and role switcher
        ├── components/
        │   ├── common/
        │   │   ├── Badges.jsx     # Priority, Risk, and Severity visual badge components
        │   │   └── StatusBadge.jsx# Application status badge (Verified, Under Review, etc.)
        │   ├── documents/
        │   │   └── DocumentUploadModal.jsx # Modal dialog for uploading/replacing scans
        │   └── layout/
        │       ├── Header.jsx     # Official top utility bar and 1-click portal view switcher
        │       └── Footer.jsx     # Official e-Governance standard footer
        └── pages/
            ├── ApplicantDashboardPage.jsx  # Citizen application dashboard and actions
            ├── ApplicationDetailsPage.jsx  # Detailed dossier view with tabbed sections
            ├── AuditLogPage.jsx            # Security event trail with search and role filters
            ├── ComplianceRulesPage.jsx     # Policy rules matrix with active/disabled toggles
            ├── HomePage.jsx                # Public landing page with role navigation
            ├── NewApplicationPage.jsx      # 3-step application creation wizard
            ├── NotFoundPage.jsx            # 404 error page with safe redirection
            ├── PrivacyPolicyPage.jsx       # Citizen data protection and DPDP disclosures
            ├── ReviewerDashboardPage.jsx   # Officer queue with live search and status filters
            ├── SignInPage.jsx              # Sign-in form with pre-configured demo profiles
            ├── TermsAndConditionsPage.jsx  # Administrative service terms and guidelines
            └── VerificationWorkspacePage.jsx# Flagship 4-section decision workspace
```

---

## 2. Which Files to Read for Each Module

If you or another developer want to understand a specific feature, read these corresponding files:

| Feature / Module | Frontend Files to Read | Backend Files to Read |
| :--- | :--- | :--- |
| **Authentication & Role Switching** | `frontend/src/context/AuthContext.jsx`<br>`frontend/src/components/layout/Header.jsx`<br>`frontend/src/pages/SignInPage.jsx` | `backend/src/middleware/auth.js`<br>`backend/src/controllers/authController.js` |
| **Citizen Application Wizard** | `frontend/src/pages/NewApplicationPage.jsx` | `backend/src/controllers/applicationController.js`<br>`backend/src/controllers/documentController.js` |
| **Citizen Application Dashboard** | `frontend/src/pages/ApplicantDashboardPage.jsx`<br>`frontend/src/pages/ApplicationDetailsPage.jsx` | `backend/src/controllers/applicationController.js` |
| **Document Upload & Storage** | `frontend/src/components/documents/DocumentUploadModal.jsx` | `backend/src/middleware/upload.js`<br>`backend/src/controllers/documentController.js` |
| **OCR Scan Extraction** | `frontend/src/pages/VerificationWorkspacePage.jsx` (Section 2) | `backend/src/services/ocr/ocrAdapter.js` |
| **Cross-Document Field Matching** | `frontend/src/pages/VerificationWorkspacePage.jsx` (Section 3) | `backend/src/services/comparison/comparisonEngine.js` |
| **Compliance Rules Evaluation** | `frontend/src/pages/ComplianceRulesPage.jsx` | `backend/src/services/rules/complianceRulesEngine.js`<br>`backend/src/controllers/complianceRulesController.js` |
| **Explainable Risk Scoring** | `frontend/src/pages/VerificationWorkspacePage.jsx` (Section 3)<br>`frontend/src/components/common/Badges.jsx` | `backend/src/services/scoring/riskScoringEngine.js` |
| **Verification Officer Decisions** | `frontend/src/pages/VerificationWorkspacePage.jsx` (Section 4)<br>`frontend/src/pages/ReviewerDashboardPage.jsx` | `backend/src/controllers/verificationController.js` |
| **Security Audit Trail** | `frontend/src/pages/AuditLogPage.jsx` | `backend/src/services/audit/auditService.js`<br>`backend/src/controllers/auditController.js` |
| **Dual-Mode Persistence** | None (Abstracted behind API) | `backend/src/storage/db.js`<br>`backend/src/storage/jsonStore.js` |

---

## 3. Core Source Files Explained in Simple Language

### Backend Core Files

#### `backend/src/server.js`
The entry point of the backend. It initializes Express, sets up CORS to accept frontend requests, enables JSON body parsing, mounts all REST API routes at `/api`, attaches centralized error handling, and calls `startServer()`. When started directly, it checks storage and seeds sample data before listening on port 5000.

#### `backend/src/storage/db.js`
The central storage manager. It attempts to connect to MongoDB if a connection string is provided. If MongoDB is offline, it automatically falls back to `JsonStore` without crashing. It exposes `getStore()` which provides Mongoose-like collection objects (`users`, `applications`, `documents`, `verificationRuns`, `complianceRules`, `auditEvents`).

#### `backend/src/storage/jsonStore.js`
A lightweight, zero-dependency persistence layer. It stores data as human-readable JSON files inside `backend/data/`. It implements standard asynchronous database methods (`find`, `findOne`, `findById`, `create`, `findByIdAndUpdate`) so the rest of the application code remains identical whether running on MongoDB or local files.

#### `backend/src/middleware/auth.js`
Contains two essential security functions:
1. `signToken(user)`: Encodes the user's ID, name, email, and role into a cryptographically signed JWT token valid for 24 hours.
2. `authenticate(req, res, next)`: Reads the `Authorization: Bearer <token>` header, verifies the signature, and attaches `req.user`.
3. `authorize(...roles)`: Reusable middleware ensuring only designated roles (e.g. `reviewer`, `admin`) can access sensitive endpoints.

#### `backend/src/middleware/upload.js`
Configures Multer for document attachments. It enforces a strict 5MB limit, accepts only valid MIME types (PDF, JPG, PNG), and renames files to randomized UUIDs so users cannot overwrite existing files or execute path traversal attacks.

#### `backend/src/services/verification/verificationPipeline.js`
The central conductor of the automated verification workflow. When invoked for an application:
1. Calls the OCR adapter to extract text from any unanalyzed documents.
2. Runs `ComparisonEngine` to compare declared form data with extracted document fields.
3. Runs `ComplianceRulesEngine` to evaluate statutory compliance rules.
4. Runs `RiskScoringEngine` to compute an explainable score.
5. Saves a new record in `verificationRuns.json`.
6. Updates the application's priority (promotes to `High` if mismatches or missing documents exist) and status to `Under Review`.
7. Records an audit event.

#### `backend/src/services/comparison/comparisonEngine.js`
Implements the Levenshtein distance matrix string similarity algorithm. It compares:
- Declared Name vs Identity Proof
- Declared Income vs Income Certificate
- Declared Roll Number vs Academic Marksheet
- Declared Bank Account vs Bank Passbook
It marks each check as `Matched`, `Mismatch detected`, or `Unable to compare`, and provides a plain-English explanation.

#### `backend/src/services/scoring/riskScoringEngine.js`
Calculates an explainable preliminary risk score from 0 to 100 using a deterministic deduction formula. It adds 25 points per missing document, 25 points for name discrepancies, 20 points for income mismatches, and 15–25 points for flagged compliance rules. It maps scores into Low, Medium, and High risk bands.

#### `backend/src/services/audit/auditService.js`
A security logging utility. Every time a citizen submits an application, an officer makes a decision, or a rule is toggled, it appends an audit event with timestamp, actor name, action, and target. It ensures no passwords, tokens, or raw confidential data are ever logged.

---

### Frontend Core Files

#### `frontend/src/api/client.js`
The single unified API client for the frontend. It reads the JWT token from `localStorage` (`suvidha_token`), attaches it to every request in the `Authorization: Bearer` header, formats request bodies, and provides clean JavaScript helper methods (`api.getApplications()`, `api.uploadDocument()`, etc.).

#### `frontend/src/context/AuthContext.jsx`
Provides authentication state to the entire React application using React Context. It maintains the current `user` object, verifies the stored token on page refresh, and implements `login()`, `logout()`, and `switchDemoRole(targetRole)`.

#### `frontend/src/App.jsx`
Defines all 12 client-side routes. It wraps sensitive routes inside `<ProtectedRoute allowedRoles={[...]}>`, ensuring citizens cannot view the reviewer desk and reviewers are guided to their appropriate workspace.

#### `frontend/src/pages/VerificationWorkspacePage.jsx`
The primary reviewer screen. It displays the applicant's claims, document scans with an embedded viewer, extracted OCR values, the four-row Verification Summary Table, explainable risk score deductions, and the four official decision buttons.
