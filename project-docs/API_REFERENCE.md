# Complete API Reference & Route Documentation

All backend routes are prefixed with `/api`. This document lists every endpoint, supported HTTP methods, request parameters, response bodies, and the corresponding frontend client functions.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 POST `/api/auth/login`
- **Purpose:** Authenticates a user and issues a JWT token.
- **Frontend Function:** `api.login(credentials)` in `frontend/src/api/client.js`.
- **Controller:** `login` in `backend/src/controllers/authController.js`.
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "arpit@example.com",
    "password": "Demo@123"
  }
  ```
- **Response Format (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "user-arpit-kumar-01",
      "name": "Arpit Kumar",
      "email": "arpit@example.com",
      "role": "applicant",
      "organization": "State Institute of Engineering and Technology"
    }
  }
  ```
- **Error Codes:** `400 Bad Request` (missing fields), `401 Unauthorized` (invalid credentials).

---

### 1.2 GET `/api/auth/demo-accounts`
- **Purpose:** Returns the list of pre-seeded accounts for 1-click evaluation.
- **Frontend Function:** `api.getDemoAccounts()`.
- **Controller:** `getDemoAccounts` in `backend/src/controllers/authController.js`.
- **Response Format (200 OK):**
  ```json
  {
    "accounts": [
      {
        "name": "Arpit Kumar",
        "email": "arpit@example.com",
        "role": "applicant",
        "description": "Applicant / Citizen demo account"
      },
      {
        "name": "Priya Sharma",
        "email": "reviewer@suvidha.gov.demo",
        "role": "reviewer",
        "description": "Verification Officer demo account"
      }
    ]
  }
  ```

---

### 1.3 GET `/api/auth/me`
- **Purpose:** Validates the active Bearer token and returns the current user profile.
- **Frontend Function:** `api.getCurrentUser()`.
- **Controller:** `getCurrentUser` in `backend/src/controllers/authController.js`.
- **Request Headers:** `Authorization: Bearer <token>`
- **Response Format (200 OK):** Returns user object.

---

## 2. Application Endpoints (`/api/applications`)

### 2.1 GET `/api/applications`
- **Purpose:** Lists applications. Scoped automatically by role:
  - If role is `applicant`, returns only their own applications.
  - If role is `reviewer`, `compliance`, or `admin`, returns all applications.
- **Frontend Function:** `api.getApplications(params)` (called by `ApplicantDashboardPage.jsx` and `ReviewerDashboardPage.jsx`).
- **Controller:** `getApplications` in `backend/src/controllers/applicationController.js`.
- **Query Parameters:**
  - `status` (string, optional): e.g. `Under Review`, `Verified`, `All`.
  - `search` (string, optional): Search term matching applicant name or reference.
- **Response Format (200 OK):**
  ```json
  {
    "applications": [
      {
        "_id": "app-arpit-2026-0152",
        "referenceNumber": "APP-2026-0152",
        "applicantName": "Arpit Kumar",
        "applicantEmail": "arpit@example.com",
        "applicationType": "Scholarship Assistance (Post-Matric Scheme)",
        "annualFamilyIncome": 180000,
        "status": "Under Review",
        "priority": "Normal",
        "submissionDate": "2026-10-23T10:30:00.000Z",
        "requestedReuploadDocs": []
      }
    ],
    "count": 1
  }
  ```

---

### 2.2 GET `/api/applications/:id`
- **Purpose:** Fetches a complete application dossier including documents, latest verification run, and audit events.
- **Frontend Function:** `api.getApplicationById(id)` in `ApplicationDetailsPage.jsx`.
- **Controller:** `getApplicationById` in `backend/src/controllers/applicationController.js`.
- **Response Format (200 OK):**
  ```json
  {
    "application": { ... },
    "documents": [ ... ],
    "latestVerification": { ... },
    "auditEvents": [ ... ]
  }
  ```

---

### 2.3 POST `/api/applications`
- **Purpose:** Creates a new draft application and generates a unique reference number.
- **Frontend Function:** `api.createApplication(payload)` in `NewApplicationPage.jsx`.
- **Controller:** `createApplication` in `backend/src/controllers/applicationController.js`.
- **Request Body:**
  ```json
  {
    "applicantName": "Arpit Kumar",
    "applicantEmail": "arpit@example.com",
    "applicationType": "Scholarship Assistance (Post-Matric Scheme)",
    "annualFamilyIncome": 180000,
    "academicInstitution": "State Institute of Engineering and Technology",
    "rollNumber": "2022-CS-084",
    "bankAccountNumber": "987654321012",
    "bankIfscCode": "PUNB0123400"
  }
  ```
- **Response Format (201 Created):**
  ```json
  {
    "application": {
      "_id": "app-uuid",
      "referenceNumber": "APP-2026-0153",
      "status": "Draft",
      ...
    },
    "message": "Application draft created."
  }
  ```

---

### 2.4 POST `/api/applications/:id/submit`
- **Purpose:** Formally transitions an application from `Draft` to `Submitted` and automatically executes the automated verification pipeline.
- **Frontend Function:** `api.submitApplication(id)`.
- **Controller:** `submitApplication` in `backend/src/controllers/applicationController.js`.
- **Response Format (200 OK):** Returns updated application and verification summary.

---

## 3. Document Endpoints (`/api/applications/:id/documents` & `/api/documents`)

### 3.1 POST `/api/applications/:applicationId/documents`
- **Purpose:** Uploads a supporting document scan (PDF, JPG, PNG up to 5MB), processes it through the OCR adapter, stores the file, and automatically refreshes verification findings.
- **Frontend Function:** `api.uploadDocument(applicationId, formData)`.
- **Controller:** `uploadDocument` in `backend/src/controllers/documentController.js`.
- **Request Headers:** `Content-Type: multipart/form-data`
- **Form Data Fields:**
  - `file`: Binary file stream (max 5MB).
  - `documentCategory`: String (`Identity Proof`, `Income Certificate`, `Academic Marksheet`, `Bank Passbook`, or `Other Supporting Document`).
- **Response Format (201 Created):**
  ```json
  {
    "document": {
      "_id": "doc-uuid",
      "documentCategory": "Income Certificate",
      "originalFileName": "Income_Certificate_2025_Arpit.pdf",
      "fileSize": 184320,
      "mimeType": "application/pdf",
      "status": "Processed",
      "extractedData": {
        "documentNumber": "INC/2025/REV/89201",
        "fullName": "Arpit Kumar",
        "annualIncome": 180000,
        "expiryDate": "2026-11-09",
        "confidence": 91.2
      }
    },
    "message": "Document uploaded and analyzed successfully."
  }
  ```

---

### 3.2 GET `/api/documents/:id/file`
- **Purpose:** Streams the original uploaded document scan for reviewer inspection with proper MIME headers.
- **Frontend Function:** Direct link rendered in `VerificationWorkspacePage.jsx` ("Open Full Resolution Scan").
- **Controller:** `getDocumentFile` in `backend/src/controllers/documentController.js`.

---

## 4. Reviewer & Verification Endpoints

### 4.1 GET `/api/applications/:id/verification-workspace`
- **Purpose:** Retrieves all data needed by the 4-section Verification Workspace (application claims, uploaded scans, extracted fields, latest verification findings, and past notes).
- **Frontend Function:** `api.getVerificationWorkspace(id)` in `VerificationWorkspacePage.jsx`.
- **Controller:** `getVerificationDetails` in `backend/src/controllers/verificationController.js`.
- **Access Control:** Restricted to `reviewer`, `compliance`, and `admin` roles.

---

### 4.2 POST `/api/applications/:id/reviews`
- **Purpose:** Records an official, auditable decision by a reviewing officer.
- **Frontend Function:** `api.recordReviewDecision(id, decisionData)`.
- **Controller:** `recordReviewDecision` in `backend/src/controllers/verificationController.js`.
- **Request Body Examples:**
  - **Approval:**
    ```json
    {
      "decision": "Approve",
      "comment": "All documents verified. Approved for scholarship sanction."
    }
    ```
  - **Request Re-upload (Checks mandatory requestedDocs):**
    ```json
    {
      "decision": "Request Re-upload",
      "requestedDocs": ["Bank Passbook"],
      "comment": "Bank passbook page is missing. Please upload."
    }
    ```
  - **Rejection (Requires mandatory reason):**
    ```json
    {
      "decision": "Reject",
      "reason": "Income certificate exceeds the scheme ceiling of Rs. 2,50,000."
    }
    ```
- **Response Format (200 OK):** Returns updated application object and success confirmation.

---

## 5. Compliance Rules Endpoints (`/api/compliance-rules`)

### 5.1 GET `/api/compliance-rules`
- **Purpose:** Returns the complete matrix of statutory compliance rules and their current enabled/disabled state.
- **Frontend Function:** `api.getComplianceRules()` in `ComplianceRulesPage.jsx`.
- **Controller:** `getComplianceRules` in `backend/src/controllers/complianceRulesController.js`.

---

### 5.2 PATCH `/api/compliance-rules/:id/toggle`
- **Purpose:** Toggles a compliance rule on or off.
- **Frontend Function:** `api.toggleRule(id, enabled)`.
- **Controller:** `toggleRule` in `backend/src/controllers/complianceRulesController.js`.
- **Request Body:** `{ "enabled": false }`
- **Response Format (200 OK):**
  ```json
  {
    "message": "Rule 'RULE_DOC_VALIDITY' has been disabled.",
    "rule": { ... }
  }
  ```

---

## 6. Audit Logging Endpoints (`/api/audit-events`)

### 6.1 GET `/api/audit-events`
- **Purpose:** Queries the immutable security audit trail with optional filtering.
- **Frontend Function:** `api.getAuditEvents(params)` in `AuditLogPage.jsx`.
- **Controller:** `getAuditEvents` in `backend/src/controllers/auditController.js`.
- **Query Parameters:**
  - `actorRole` (string, optional): e.g. `reviewer`, `applicant`.
  - `action` (string, optional): Filter by action keyword.
  - `search` (string, optional): Keyword search matching actor name, target, or details.
- **Response Format (200 OK):**
  ```json
  {
    "events": [
      {
        "_id": "audit-uuid",
        "timestamp": "2026-10-24T06:55:00.000Z",
        "actorName": "Priya Sharma",
        "actorRole": "reviewer",
        "action": "Reviewer Decision: Request Re-upload",
        "targetType": "Application",
        "targetReference": "APP-2026-0152",
        "details": "Requested documents: Bank Passbook",
        "outcome": "Success"
      }
    ],
    "count": 1
  }
  ```

---

## 7. System Health Endpoint (`/api/health`)

### 7.1 GET `/api/health`
- **Purpose:** System heartbeat and identity verification.
- **Frontend Function:** `api.getHealth()`.
- **Response Format (200 OK):**
  ```json
  {
    "status": "healthy",
    "product": "Suvidha | Application Validation Portal",
    "environment": "Production Standard | National e-Governance Service",
    "timestamp": "2026-10-24T06:54:16.994Z"
  }
  ```
