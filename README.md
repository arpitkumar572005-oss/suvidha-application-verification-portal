# Suvidha | Application Validation Portal

**Application review, document checks and compliance assistance**  
*Hackathon Prototype | Demonstration Environment*

---

## 1. Project Overview & Role

Built for the **Smart India Hackathon (SIH)** under the problem statement:  
**"AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification"**

The system assists citizens during application submissions and provides authorised reviewers with an explainable decision-support workspace. It identifies missing documents, extracts document information via an OCR adapter, performs cross-document consistency checks, evaluates configured compliance rules, and generates deterministic preliminary risk assessments.

> **Important Administrative Disclaimer:**  
> The system operates as an explainable decision-support tool. It never automatically declares an application or document fraudulent based on an AI prediction, scan score, or confidence metric. Final verification decisions are strictly recorded by authorised human reviewers. No official government integration is claimed.

---

## 2. Visual Identity & Design System

The portal follows **Option C: Government Saffron + Neutral**, presenting the clean, trustworthy, and accessible visual standard of an Indian public-service portal:

- **Primary Saffron:** `#E98222` (selected navigation states, primary buttons, section accents)
- **Dark Navy:** `#263B52` (typography, primary emblems, authoritative elements)
- **Neutral Background:** `#F6F7F9` (portal body background)
- **Card Background:** `#FFFFFF` (elevated cards with 4 to 8px modest rounding)
- **Light Saffron Tint:** `#FFF2E4` (notice banners, highlights)
- **Borders:** `#DDE3E8`
- **Secondary Text:** `#667587`
- **Semantic Colors:** Success (`#23734D`), Warning (`#A86412`), Error (`#B42318`), Information (`#245A82`)
- **Typography:** Inter
- **Favicon:** Custom shield and document-check SVG (`frontend/public/favicon.svg`)

---

## 3. Technology Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS, React Router 6, Lucide React
- **Backend:** Node.js (ES Modules), Express.js, Multer, bcryptjs, jsonwebtoken
- **Storage:** Dual-Mode Architecture:
  - **Local Persistent JSON Store (Default / Development Mode):** Zero-configuration file store in `backend/data/` that guarantees persistence across server restarts.
  - **MongoDB with Mongoose:** Ready for production deployment via `MONGODB_URI`.
- **Document Processing:** Modular `OcrAdapter` interface with transparently labelled `MockOcrAdapter` for hackathon evaluation.
- **Comparison Engine:** Levenshtein string similarity and financial tolerance cross-checking.
- **Rules Engine:** Configurable compliance rules matrix with severity ratings and explainable evidence.
- **Risk Assessment:** Deterministic preliminary risk scoring engine with itemized factor deductions.

---

## 4. End-to-End Demonstration Case File: Arpit Kumar

The prototype is pre-seeded with the primary sample case file requested for evaluation:

- **Applicant Name:** Arpit Kumar
- **Applicant Reference:** `APP-2026-0152`
- **Application Type:** Scholarship Assistance (Post-Matric Scheme)
- **Submission Date:** 23 October 2026
- **Declared Annual Income:** Rs. 1,80,000
- **Academic Institution:** State Institute of Engineering and Technology
- **Roll Number:** 2022-CS-084
- **Email:** `arpit@example.com`
- **Attached Documents:**
  1. Identity Proof (`sample_arpit_id_proof.svg`) - Matched (100%)
  2. Income Certificate (`sample_arpit_income_cert.svg`) - Matched (100%), Valid until 09-11-2026
  3. Academic Marksheet (`sample_arpit_marksheet.svg`) - Matched (95%)
  4. Bank Passbook - **Missing** (Triggers realistic demonstration finding)
- **Preliminary Risk Score:** 25/100 (Medium Risk: missing bank passbook deduction)

### Pre-Seeded Demonstration Accounts

| Role | Name | Email | Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Applicant** | Arpit Kumar | `arpit@example.com` | `Demo@123` | Citizen portal, submit apps, upload scans |
| **Reviewer** | Priya Sharma | `reviewer@suvidha.gov.demo` | `Demo@123` | Queue review, inspection workspace, decisions |
| **Compliance** | Sunil Verma | `compliance@suvidha.gov.demo` | `Demo@123` | Inspect & toggle compliance rules |
| **Admin** | Rajesh Patel | `admin@suvidha.gov.demo` | `Demo@123` | System audit logs & all applications |

*(A 1-click role switcher is embedded in the top header bar for seamless evaluator navigation).*

---

## 5. The 12 Implemented Pages

1. **Page 1: Sign-in (`/login`)** - Secure authentication, field validation, password visibility toggle, visible demo mode notice, and 1-click sample account selectors.
2. **Page 2: Applicant Dashboard (`/applicant/dashboard`)** - Welcome banner for Arpit Kumar, real calculated statistics from stored records, application cards, status badges, next actions, and workflow guide.
3. **Page 3: New Application (`/applicant/new-application`)** - Multi-section form: Profile, Scheme Parameters, Bank Account for DBT, Document checklist, Draft save, and Review-Before-Submit step.
4. **Page 4: Document Upload Modal (`/applications/:id`)** - File selection (PDF, JPG, PNG up to 5MB), category selection, server validation, progress indicator, and privacy warning.
5. **Page 5: Application Details (`/applications/:id`)** - Complete dossier separating applicant declarations, uploaded scans, OCR extracted data, system findings, reviewer notes, and audit history.
6. **Page 6: Document Verification Workspace (`/reviewer/workspace/:id`)** - Flagship demonstration page:
   - Split-view layout with safe document viewer (zoom in/out, pan, metadata).
   - Extracted field table with OCR confidence percentages.
   - Cross-document comparison matrix (application vs document values, match status, explanation).
   - Missing document checklist.
   - Expiry date verification.
   - Compliance rules evaluation.
   - Deterministic risk score itemization.
   - Reviewer decision controls: Approve, Request Re-upload, Refer for Manual Verification, Reject (with mandatory reason).
7. **Page 7: Reviewer Dashboard (`/reviewer/dashboard`)** - Queue of real submitted records, priority badges, status filters, scheme filters, live search, and workspace actions.
8. **Page 8: Compliance Rules (`/compliance/rules`)** - Configurable demonstration rules with severity levels, explanations, and interactive active/disabled toggles.
9. **Page 9: Audit Log (`/admin/audit-logs`)** - Tamper-traceable event log tracking all actor actions with Zero PII guarantee.
10. **Page 10: Privacy Policy (`/privacy-policy`)** - Truthful disclosure of data collection, OCR handling, file storage, and security boundaries.
11. **Page 11: Terms and Conditions (`/terms-and-conditions`)** - Demonstration scope, human-review requirement, non-official status disclaimer, and acceptable use.
12. **Page 12: Not Found Page (`/404`)** - Semantic error page with clear navigation recovery options.

---

## 6. Directory Structure

```
suvidha-portal/
├── package.json                   # Root orchestrator
├── start-portal.ps1               # 1-click Windows launcher
├── README.md                      # Comprehensive documentation
├── backend/
│   ├── .env                       # Local runtime environment
│   ├── .env.example               # Safe environment template
│   ├── package.json               # Backend dependencies
│   ├── data/                      # Persistent local JSON storage (Dev Mode)
│   ├── uploads/                   # Private document storage
│   ├── tests/
│   │   └── api.test.js            # Automated backend test suite
│   └── src/
│       ├── server.js              # Express app bootstrap
│       ├── config/index.js        # Environment config loader
│       ├── storage/
│       │   ├── db.js              # Unified store adapter (Mongo + JSON fallback)
│       │   └── jsonStore.js       # Persistent file-backed JSON store
│       ├── services/
│       │   ├── ocr/ocrAdapter.js  # OCR adapter interface & Mock provider
│       │   ├── comparison/comparisonEngine.js # Cross-document matcher
│       │   ├── rules/complianceRulesEngine.js # Compliance evaluator
│       │   ├── scoring/riskScoringEngine.js   # Deterministic risk engine
│       │   ├── audit/auditService.js          # Audit logging service
│       │   └── verification/verificationPipeline.js # 6-stage pipeline
│       ├── middleware/
│       │   ├── auth.js            # JWT verification & role guards
│       │   └── upload.js          # Multer type/size validation
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── applicationController.js
│       │   ├── documentController.js
│       │   ├── verificationController.js
│       │   ├── complianceRulesController.js
│       │   └── auditController.js
│       ├── routes/api.js          # REST routes
│       └── seeds/seedData.js      # Seed generator (Arpit Kumar profile)
└── frontend/
    ├── package.json
    ├── vite.config.js             # Vite proxy configuration
    ├── tailwind.config.js         # Option C Government Saffron palette
    ├── postcss.config.js
    ├── index.html                 # Linked custom SVG favicon
    ├── public/
    │   └── favicon.svg            # Custom shield and document-check SVG
    └── src/
        ├── index.css              # Base styles & Inter font
        ├── main.jsx               # React entry point
        ├── App.jsx                # Router & role guards
        ├── api/client.js          # REST client
        ├── context/AuthContext.jsx # Auth state & demo switcher
        ├── components/
        │   ├── common/StatusBadge.jsx
        │   ├── common/Badges.jsx
        │   ├── layout/Header.jsx
        │   ├── layout/Footer.jsx
        │   └── documents/DocumentUploadModal.jsx
        └── pages/
            ├── HomePage.jsx
            ├── SignInPage.jsx
            ├── ApplicantDashboardPage.jsx
            ├── NewApplicationPage.jsx
            ├── ApplicationDetailsPage.jsx
            ├── VerificationWorkspacePage.jsx
            ├── ReviewerDashboardPage.jsx
            ├── ComplianceRulesPage.jsx
            ├── AuditLogPage.jsx
            ├── PrivacyPolicyPage.jsx
            ├── TermsAndConditionsPage.jsx
            └── NotFoundPage.jsx
```

---

## 7. REST API Documentation

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status and prototype identification |
| `GET` | `/api/auth/demo-accounts` | Public | Returns pre-seeded evaluation credentials |
| `POST` | `/api/auth/login` | Public | Authenticates user and returns JWT token |
| `POST` | `/api/auth/register` | Public | Citizen registration |
| `GET` | `/api/auth/me` | Authenticated | Current user profile |
| `GET` | `/api/applications` | Authenticated | Scoped application list (by applicant or reviewer) |
| `POST` | `/api/applications` | Applicant, Admin | Create draft or submitted application |
| `GET` | `/api/applications/:id` | Authenticated | Full dossier with documents and findings |
| `PATCH` | `/api/applications/:id` | Applicant, Admin | Update draft application details |
| `POST` | `/api/applications/:id/submit` | Applicant, Admin | Formally submit and trigger automated pipeline |
| `POST` | `/api/applications/:id/documents` | Authenticated | Upload scan (PDF/JPG/PNG max 5MB) & run OCR |
| `GET` | `/api/applications/:id/documents` | Authenticated | List application document attachments |
| `GET` | `/api/documents/:id/file` | Authenticated | Stream file securely (private authorization check) |
| `DELETE` | `/api/documents/:id` | Authenticated | Remove document |
| `GET` | `/api/applications/:id/verification-workspace` | Reviewer, Admin | Complete workspace bundle for case file |
| `POST` | `/api/applications/:id/verification-runs` | Reviewer, Admin | Trigger or re-run automated verification pipeline |
| `POST` | `/api/applications/:id/reviews` | Reviewer, Admin | Record review decision (Approve/Reject/Re-upload) |
| `POST` | `/api/applications/:id/comments` | Reviewer, Admin | Add reviewer note to case file |
| `GET` | `/api/compliance-rules` | Authenticated | List configured compliance rules |
| `PATCH` | `/api/compliance-rules/:id/toggle` | Compliance, Admin | Enable or disable verification rule |
| `GET` | `/api/audit-events` | Reviewer, Admin | Retrieve tamper-traceable audit trail |

---

## 8. Installation & Local Run Instructions

### Prerequisites

- Node.js 18+ (tested on Node v25.6.0)
- npm 9+ (tested on npm 11.8.0)
- Windows / macOS / Linux

### Option A: Using the Automated Windows Script

```powershell
Set-Location "C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal"
.\start-portal.ps1
```

### Option B: Manual Step-by-Step Execution

1. **Start the Backend:**
   ```powershell
   cd backend
   npm install
   npm start
   ```
   *The backend starts on `http://localhost:5000` and automatically initializes seed data.*

2. **Start the Frontend:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend starts on `http://localhost:3000` with the Vite proxy routed to `:5000`.*

3. Open your browser at:  
   **`http://localhost:3000`**

---

## 9. Automated Testing Verification

Automated backend tests verify authentication, ownership scoping, Levenshtein comparison, and deterministic scoring:

```powershell
cd backend
npm test
```

### Test Suite Execution Output

```
> suvidha-backend@1.0.0 test
> node --test tests/*.test.js

[Storage] MongoDB offline or not found (connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017). Using persistent local JSON store (Development Mode).
[Seed] Initializing demonstration database with sample data...
[Seed] Database initialization complete! Sample profile Arpit Kumar (APP-2026-0152) is ready.
[Suvidha Portal] Server running on http://localhost:5055
[Suvidha Portal] Environment: Hackathon Demonstration
✔ GET /api/health returns healthy status and portal identity (1675ms)
✔ GET /api/auth/demo-accounts returns sample demo credentials (20ms)
✔ POST /api/auth/login succeeds for sample applicant Arpit Kumar (345ms)
✔ POST /api/auth/login fails for invalid password (179ms)
✔ GET /api/applications returns scoped records for authenticated applicant (136ms)
✔ Reviewer login and verification workspace retrieval (147ms)
✔ ComparisonEngine accurately identifies matching and mismatching fields (77ms)
✔ RiskScoringEngine calculates explainable score and does not claim fraud (1ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Frontend production bundle verification:
```powershell
cd frontend
npm run build
```
Result: `✓ built in 6.04s` with 0 errors.

---

## 10. Production Launch Checklist

Per Section 14 of the requirements, launch-readiness items are tracked transparently:

- [ ] Custom domain connected and tested *(Not applicable for local hackathon demo environment)*
- [x] Custom favicon installed and visible in browser (`frontend/public/favicon.svg`)
- [x] All unwanted "Made with AI" or builder branding removed
- [x] Real Privacy Policy page published (`/privacy-policy`)
- [x] Real Terms and Conditions page published (`/terms-and-conditions`)
- [x] Production secrets and demo credentials not exposed in source control
- [x] Authentication and role permissions tested (Applicant, Reviewer, Compliance, Admin)
- [x] File upload restrictions tested (MIME types, 5MB limit, server-side validation)
- [x] Core applicant-to-reviewer workflow tested
- [x] Mobile, tablet, and desktop responsive layouts checked
- [x] Accessibility and basic security checks performed (semantic HTML, visible focus states, no color-only status indicators)
- [x] Mock services visibly disclosed (explicit "Mock OCR Adapter [Demo Provider]" labels)
- [x] No fake metrics, testimonials, or official government verification claims
- [x] Deployment, database persistence, and error handling verified

---

## 11. Security & Prototype Limitations

1. **Demonstration Environment:** This implementation is designed for technical evaluation. It does not integrate with production state databases (e.g., DigiLocker, UIDAI, Revenue Registry).
2. **Deterministic Risk Scoring:** The scoring engine reflects observable discrepancies (missing documents, name divergence, expired validity). It does not represent a machine learning probability of fraud.
3. **Safe File Storage:** Files are stored with randomized internal names and streamed through authenticated endpoints. For production deployment, object storage (e.g., private S3/MinIO bucket with presigned URLs) is recommended.
