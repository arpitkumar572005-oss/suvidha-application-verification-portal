# Viva Voce & Presentation Preparation Guide

This document equips you with everything needed to present the Suvidha portal confidently to examiners, hackathon judges, and senior software architects.

---

## 1. The 2-Minute Project Introduction (Elevator Pitch)

> "Good morning, respected judges and examiners.
>
> Today, we present **Suvidha**, an Application Validation, Document Authentication, and Regulatory Compliance Verification platform built to solve one of the biggest bottlenecks in public service delivery: the manual, error-prone verification of citizen applications and certificates.
>
> In welfare and scholarship schemes, citizens submit applications with identity cards, income certificates, marksheets, and bank passbooks. Reviewing officers face backlogs, undetected name discrepancies, expired certificates, and missing attachments.
>
> Our solution provides an end-to-end e-governance platform with two primary interfaces:
> First, a **Citizen Portal** featuring a 3-step structured application wizard where applicants can upload documents and instantly receive explainable status updates and specific re-upload notices.
> Second, an **Officer Verification Desk** that acts as an explainable decision-support tool. When an application is submitted, our automated pipeline processes document scans through an extensible OCR adapter, performs cross-field fuzzy string comparison using Levenshtein distance, checks statutory compliance rules, and generates an itemized, explainable preliminary assessment.
>
> **Most importantly**, Suvidha adheres strictly to administrative fairness: the system **never** automatically declares an application fraudulent or rejected based solely on an AI score. It highlights the facts, identifies discrepancies, and provides authorized human reviewers with the exact evidence needed to approve, reject, or request re-upload.
>
> The system is fully functional, built with React, Node.js, Express, and an intelligent dual-mode persistence architecture supporting both MongoDB and zero-config local storage. We are eager to walk you through a live demonstration."

---

## 2. 30 Technical Viva Questions and Answers

### Section A: Architecture & Tech Stack (Q1 – Q6)

#### Q1: What is the architectural pattern of the Suvidha portal?
**Answer:**
Suvidha is architected as a **Three-Tier Service-Oriented Web Application**:
1. **Presentation Layer:** React 18 Single Page Application built with Vite and Tailwind CSS.
2. **Application / Business Logic Layer:** RESTful API built in Node.js with Express.js (ES Modules). It encapsulates business logic into specialized services: `verificationPipeline`, `ocrAdapter`, `comparisonEngine`, `complianceRulesEngine`, and `riskScoringEngine`.
3. **Data / Storage Layer:** A dual-mode persistence adapter (`backend/src/storage/db.js`) supporting MongoDB via Mongoose or falling back to an asynchronous local JSON store (`backend/src/storage/jsonStore.js`).

#### Q2: Why did you choose React with Vite instead of Next.js or plain HTML/JS?
**Answer:**
Vite provides sub-second Hot Module Replacement (HMR) and optimized Rollup production builds. React 18 allows declarative state management and component reusability (such as `StatusBadge`, `Badges`, and the `DocumentUploadModal`). An SPA architecture separates frontend presentation from the backend REST API, allowing future integration with mobile apps or other government microservices.

#### Q3: How is data persisted when MongoDB is not running on the examiner's machine?
**Answer:**
In `backend/src/storage/db.js`, the `initStorage()` function inspects `config.storageMode` (default: `'auto'`). It attempts to connect to MongoDB with a 1.5-second timeout. If MongoDB is offline, it gracefully catches the error and instantiates `JsonStore` (`backend/src/storage/jsonStore.js`). `JsonStore` manages human-readable JSON files in `backend/data/` and provides asynchronous methods matching Mongoose queries (`find`, `findOne`, `create`, `findByIdAndUpdate`), guaranteeing persistence with zero external setup.

#### Q4: How are file uploads handled on the backend?
**Answer:**
File uploads are handled by Multer (`backend/src/middleware/upload.js`). The middleware enforces a `5MB` size limit (`config.maxFileSizeMb * 1024 * 1024`), validates allowed MIME types (`application/pdf`, `image/jpeg`, `image/png`), and renames files to randomized UUIDv4 strings before storing them in `backend/uploads/`. This prevents path traversal attacks and accidental filename collisions.

#### Q5: How is authentication and role-based access control (RBAC) implemented?
**Answer:**
Authentication is stateless and token-based using `jsonwebtoken` (JWT) and `bcryptjs` (`backend/src/middleware/auth.js`).
- Passwords are encrypted with bcrypt (salt rounds: 10).
- Upon successful login, the server issues a signed JWT token valid for 24 hours containing user ID, email, and role.
- Protected routes use the `authenticate` middleware to verify Bearer tokens.
- The `authorize(...roles)` middleware restricts sensitive endpoints (e.g. only `reviewer`, `compliance`, or `admin` can access the review workspace or record decisions).

#### Q6: How does the 1-click Portal View Switcher work without logging out?
**Answer:**
In `frontend/src/context/AuthContext.jsx`, the `switchDemoRole(targetRole)` function searches the pre-seeded accounts returned by `GET /api/auth/demo-accounts`, logs in with the pre-configured password (`Demo@123`), updates the stored JWT in `localStorage`, updates React context state, and redirects the user to that role's primary dashboard.

---

### Section B: AI, Algorithms & Verification Engines (Q7 – Q15)

#### Q7: Does the system use a live cloud AI or LLM API?
**Answer:**
No. The system consciously avoids external cloud LLM APIs (such as OpenAI or Google Cloud) to maintain citizen privacy, prevent transmission of sensitive data outside the application boundary, and avoid unexpected API outages or rate limits. Instead, all processing is performed locally using modular engineering engines: an extensible OCR adapter, a Levenshtein string matching algorithm, a compliance rules engine, and an additive risk scoring model.

#### Q8: How is the OCR document extraction implemented?
**Answer:**
OCR extraction is built using the **Adapter Design Pattern** in `backend/src/services/ocr/ocrAdapter.js`. The current implementation, `MockOcrAdapter`, simulates structured extraction (document number, applicant name, dates, income, confidence) based on the document category and simulated file properties. This cleanly decouples file ingestion from the extraction algorithm. To connect an on-premise neural engine like Tesseract or PaddleOCR, only `ocrAdapter.js` needs to be updated, with zero changes required to the frontend, controllers, or database schemas.

#### Q9: What algorithm is used to compare applicant names with document scans?
**Answer:**
We implemented the dynamic programming **Levenshtein Distance Matrix Algorithm** (`calculateStringSimilarity` in `backend/src/services/comparison/comparisonEngine.js`). It computes the minimum number of single-character edits (insertions, deletions, substitutions) required to transform string $s_1$ into string $s_2$. The similarity ratio is calculated as:
$$\text{Similarity} = \frac{\max(|s_1|, |s_2|) - \text{Distance}}{\max(|s_1|, |s_2|)}$$

#### Q10: How does the comparison engine distinguish minor typos from real mismatches?
**Answer:**
- **Exact Match ($1.0$):** `Matched` (100% confidence).
- **Fuzzy Match ($0.85 \le \text{Similarity} < 1.0$):** `Matched` with an explanation noting minor character divergence (such as abbreviated initials or minor transliteration differences).
- **Mismatch ($\text{Similarity} < 0.85$):** `Mismatch detected`, highlighting both values and the exact percentage.
- **Missing File:** `Unable to compare`.

#### Q11: What compliance rules are evaluated by the rules engine?
**Answer:**
`ComplianceRulesEngine` in `backend/src/services/rules/complianceRulesEngine.js` evaluates 5 core statutory rules:
1. `RULE_MANDATORY_DOCS` (High Severity): Checks if Identity Proof and Income Certificate are attached.
2. `RULE_DOC_VALIDITY` (High Severity): Checks if the income certificate's expiry date is greater than the current date.
3. `RULE_NAME_CONSISTENCY` (Medium Severity): Ensures applicant name matches across all uploaded certificates.
4. `RULE_INCOME_CEILING` (Medium Severity): Verifies that family income is below the scheme ceiling of Rs. 2,50,000.
5. `RULE_REQUIRED_FIELDS` (Low Severity): Checks for bank account and IFSC presence.

#### Q12: How can a compliance officer disable a rule, and what happens when they do?
**Answer:**
On the `/compliance/rules` page, the compliance officer clicks the toggle switch next to a rule. This sends a `PATCH /api/compliance-rules/:id/toggle` request. The backend updates the rule's `enabled` field to `false` in storage and records an audit log. On subsequent verification runs, `verificationPipeline.js` skips any disabled rules, so they no longer generate warnings or affect risk scores.

#### Q13: How is the Preliminary Risk Score calculated?
**Answer:**
`RiskScoringEngine` (`backend/src/services/scoring/riskScoringEngine.js`) uses an **additive deduction model** ranging from 0 to 100:
- Baseline starting score: 0
- Missing mandatory document: $+25$ points each
- Cross-document name mismatch: $+25$ points
- Income discrepancy: $+20$ points
- High severity rule flag: $+25$ points
- Medium severity rule flag: $+15$ points
- Low OCR confidence (<70%): $+10$ points
The final score is clamped between 0 and 100 and mapped into: Low Risk (0–24), Medium Risk (25–54), and High Risk (55–100).

#### Q14: Why does the system never declare an application fraudulent automatically?
**Answer:**
In administrative law and ethical AI governance, automated statistical models cannot be used as sole evidence of guilt or fraud. Low scan quality, folded paper, minor spelling differences, or regional transliterations can easily cause an OCR mismatch. Declaring fraud automatically would lead to wrongful rejections. Instead, Suvidha treats automated scores purely as **advisory decision-support** to prioritize the queue. Every approval, rejection, or re-upload request must be signed off by a human reviewing officer.

#### Q15: How does the system handle an application where no documents are uploaded?
**Answer:**
In `RiskScoringEngine.js`, if `documents.length === 0`, the engine does not assign a numerical score. Instead, it explicitly returns `Risk Level: Insufficient information` and suggests waiting for citizen uploads. An application cannot be evaluated without evidence.

---

### Section C: Workflow & Case File Arpit Kumar (Q16 – Q22)

#### Q16: What is the primary demonstration case file seeded in the project?
**Answer:**
The system is pre-seeded with applicant **Arpit Kumar** (`APP-2026-0152`), applying for *Scholarship Assistance (Post-Matric Scheme)* with a declared income of Rs. 1,80,000.
His dossier contains:
1. Identity Proof (`sample_arpit_id_proof.svg`) - Matched (100%)
2. Income Certificate (`sample_arpit_income_cert.svg`) - Matched (100%), Valid until Nov 2026
3. Academic Marksheet (`sample_arpit_marksheet.svg`) - Matched
4. Bank Passbook - **Missing**

#### Q17: What findings does the verification pipeline generate for Arpit Kumar?
**Answer:**
1. Missing Document: *Bank Passbook*.
2. Preliminary Risk Score: `25/100` (`Medium Risk`), solely due to the missing bank passbook.
3. The Verification Summary Table marks "Required documents" as Incomplete, "Personal details" as Match, "Expiry dates" as Valid, and "Authenticity checks" as No indicators found.
4. Suggested Next Action: *"Request applicant to upload missing documents: Bank Passbook."*

#### Q18: What actions can a reviewing officer take in the Verification Workspace?
**Answer:**
In `VerificationWorkspacePage.jsx` (Section 4), the officer has 4 actions:
1. **Approve:** Updates status to `Verified`.
2. **Request Re-upload:** Displays a checklist where the officer selects `Bank Passbook` and enters a note. Updates status to `Re-upload Requested`.
3. **Refer for Manual Verification:** Updates status to `Manual Review Required` for on-site field verification.
4. **Reject:** Requires a mandatory official reason. Updates status to `Rejected`.

#### Q19: What does the applicant see after the reviewer requests a re-upload?
**Answer:**
When Arpit Kumar opens his `/applicant/dashboard`, his status badge updates to `Action Required` (amber), and the explanation dynamically reads:
*"Action Required: Please upload the missing Bank Passbook."*
He can click into the application, open the **Document Upload Modal**, select "Bank Passbook", and upload the file.

#### Q20: What happens behind the scenes when an applicant uploads a replacement document?
**Answer:**
In `documentController.js`:
1. Multer stores the new file.
2. Any prior document of that category is marked `status: 'Replaced'`.
3. The new document is processed through `ocrAdapter`.
4. If that category was in `requestedReuploadDocs`, it is removed. If no requested documents remain, status returns to `Under Review`.
5. `runVerificationPipeline()` is automatically re-executed, updating findings and recalculating the risk score.
6. An audit event is recorded.

#### Q21: What happens if an applicant enters an annual income of Rs. 3,00,000?
**Answer:**
The `RULE_INCOME_CEILING` rule evaluates against the Rs. 2,50,000 threshold. It flags the application with severity `Medium`, adds 15 points to the risk score, and displays an advisory flag: *"Income Rs. 3,00,000 exceeds scheme eligibility ceiling of Rs. 2,50,000."*

#### Q22: What happens if an applicant uploads an expired income certificate?
**Answer:**
`RULE_DOC_VALIDITY` checks the certificate's `expiryDate`. If expired, it flags the rule with severity `High`, adds 25 points to the risk score, and marks Row 3 of the Summary Table as `Expired`. The system prompts the reviewer to request an unexpired certificate.

---

### Section D: Security, Privacy & Audit (Q23 – Q26)

#### Q23: How does Suvidha ensure citizen data privacy (DPDP Act compliance)?
**Answer:**
1. **Zero Third-Party Cloud Leaks:** All document processing occurs locally inside the application boundary.
2. **Streamed File Access:** Uploaded documents are stored with random UUID filenames. They are never exposed via a public static web directory. They can only be accessed through `/api/documents/:id/file`, which requires an authenticated JWT token and verifies ownership.
3. **Zero-PII Audit Logs:** The audit service (`auditService.js`) logs metadata (action, timestamp, actor ID) but explicitly strips passwords, tokens, and raw personal identifiers.

#### Q24: What information is recorded in the System Audit Log?
**Answer:**
The audit log records:
- `timestamp`: ISO 8601 date-time string.
- `actorId`, `actorName`, `actorRole`: Identity of the user performing the action.
- `action`: Specific action (e.g. *Sign In*, *Submit Application*, *Document Uploaded*, *Reviewer Decision: Approve*, *Rule Toggled*).
- `targetType` & `targetReference`: Target entity (e.g. `Application` / `APP-2026-0152`).
- `outcome`: `Success`, `Warning`, or `Failure`.

#### Q25: Can an applicant view another applicant's documents?
**Answer:**
No. In `documentController.js` and `applicationController.js`, an authorization check verifies:
```javascript
if (req.user.role === 'applicant' && application.applicantId !== req.user.id) {
  return res.status(403).json({ error: 'Forbidden', message: 'Not authorized.' });
}
```
An applicant can only view applications and files where `applicantId === req.user.id`.

#### Q26: How are passwords protected against data breaches?
**Answer:**
Passwords are never stored in plain text. They are hashed using `bcryptjs` with a cost factor (salt rounds) of 10 (`backend/src/controllers/authController.js` and `seedData.js`). During login, `bcrypt.compare()` compares the plain text input with the stored hash using constant-time comparison to prevent timing attacks.

---

### Section E: Code Quality, Limitations & Future Scope (Q27 – Q30)

#### Q27: What automated tests exist in the codebase?
**Answer:**
The test suite in `backend/tests/api.test.js` and `backend/tests/engines.test.js` tests 8 critical capabilities:
1. Health endpoint status and identity.
2. Demo credentials retrieval.
3. Successful bcrypt login for Arpit Kumar.
4. Invalid password rejection.
5. Applicant role data scoping.
6. Reviewer workspace retrieval.
7. Levenshtein comparison accuracy for matching vs mismatching names.
8. Risk scoring engine deduction math and explainability.

#### Q28: What are the current architectural limitations of the project?
**Answer:**
1. **Simulated OCR Engine:** The current `MockOcrAdapter` simulates text extraction based on file category and simulated attributes rather than running an on-premise neural OCR network (such as Tesseract or PaddleOCR).
2. **Local Disk Storage:** Document files are stored on the local server disk (`backend/uploads/`) rather than an encrypted object store (such as MinIO or S3).
3. **No Direct Government Database Integration:** Authenticity checks inspect file metadata and structural integrity, as the prototype does not interface with production UIDAI or DigiLocker government APIs.

#### Q29: How would you scale this system to handle 100,000 applications per day?
**Answer:**
1. **Asynchronous Message Queue:** Decouple document upload from OCR extraction using Redis / BullMQ or Apache Kafka. When a document is uploaded, a background worker pool runs OCR and comparisons asynchronously without blocking the web server.
2. **Cluster & Load Balancing:** Run multiple Express application instances behind an Nginx or AWS ALB reverse proxy.
3. **Object Storage:** Store document files in S3 or MinIO with server-side AES-256 encryption.
4. **Database Indexing:** Ensure MongoDB indexes on `applicantId`, `referenceNumber`, and `status`.

#### Q30: If you could add one feature next, what would it be?
**Answer:**
An **Automated Document Tampering / Forgery Detector** that checks for copy-paste artifacts, font inconsistencies, and metadata tampering (e.g. using Error Level Analysis or an on-premise convolutional neural network) to flag physically altered certificate scans before they reach the reviewer.
