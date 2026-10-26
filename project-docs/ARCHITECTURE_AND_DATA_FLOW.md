# Application Architecture and Data Flow

This document details the complete end-to-end architecture, entity relationships, database schemas, and data flow pipelines of the Suvidha portal.

---

## 1. System Architecture Overview

The system follows a clean **Three-Tier Service-Oriented Architecture (SOA)** with strict separation of concerns:

```mermaid
flowchart TD
    subgraph Tier1 ["Tier 1: Presentation Layer (React SPA)"]
        UI_Home["Home Page"]
        UI_Citizen["Citizen Portal & Wizard"]
        UI_Reviewer["Reviewer Desk & Workspace"]
        UI_Compliance["Compliance Rules Matrix"]
        UI_Audit["Security Audit Log"]
        API_Client["API Client (Axios-like fetch)"]
        Auth_Context["AuthContext & JWT Store"]
    end

    subgraph Tier2 ["Tier 2: Application / API Layer (Express.js)"]
        Router["Express Router (/api/*)"]
        Auth_MW["Auth Middleware (JWT verify)"]
        Upload_MW["Upload Middleware (Multer 5MB)"]
        
        subgraph Controllers ["Controllers"]
            App_Ctrl["applicationController"]
            Doc_Ctrl["documentController"]
            Ver_Ctrl["verificationController"]
            Comp_Ctrl["complianceRulesController"]
            Audit_Ctrl["auditController"]
            Auth_Ctrl["authController"]
        end

        subgraph CoreEngines ["Business Intelligence Engines"]
            Pipeline["Verification Pipeline"]
            OCR["OCR Ingestion Adapter"]
            CompEngine["Comparison Engine (Levenshtein)"]
            RulesEngine["Compliance Policy Matrix"]
            RiskEngine["Additive Risk Scoring Engine"]
            AuditService["Audit Trail Service"]
        end
    end

    subgraph Tier3 ["Tier 3: Persistence Layer"]
        StorageSwitcher["Dual-Mode Storage Adapter (db.js)"]
        JSONStore["Local JSON Store (backend/data/*.json)"]
        MongoDB["MongoDB + Mongoose (Production URI)"]
        FileStore["Disk Storage (backend/uploads/*)"]
    end

    UI_Citizen --> API_Client
    UI_Reviewer --> API_Client
    UI_Compliance --> API_Client
    UI_Audit --> API_Client
    API_Client -->|HTTP + Bearer Token| Router

    Router --> Auth_MW
    Router --> Upload_MW
    Auth_MW --> Controllers
    Upload_MW --> Controllers

    Controllers --> CoreEngines
    CoreEngines --> StorageSwitcher
    Controllers --> StorageSwitcher
    Upload_MW --> FileStore

    StorageSwitcher -->|Auto Fallback| JSONStore
    StorageSwitcher -->|If Online| MongoDB
```

---

## 2. Database Entities and Data Models

The persistence layer supports both **MongoDB with Mongoose** and a **persistent JSON store** in `backend/data/`. All six collections share identical schemas:

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ APPLICATION : submits
    USER ||--o{ AUDIT_EVENT : triggers
    APPLICATION ||--o{ DOCUMENT : contains
    APPLICATION ||--o{ VERIFICATION_RUN : evaluates
    APPLICATION ||--o{ AUDIT_EVENT : targets
    COMPLIANCE_RULE ||--o{ VERIFICATION_RUN : configures

    USER {
        string _id PK
        string name
        string email UK
        string password
        string role "applicant | reviewer | compliance | admin"
        string organization
        string phone
        string createdAt
    }

    APPLICATION {
        string _id PK
        string referenceNumber UK "APP-2026-XXXX"
        string applicantId FK
        string applicantName
        string applicantEmail
        string applicationType
        number annualFamilyIncome
        string category
        string bankAccountNumber
        string bankIfscCode
        string status "Draft | Submitted | Under Review | Verified | Re-upload Requested | Rejected | Manual Review Required"
        string priority "Normal | High"
        string submissionDate
        array reviewerComments
        array requestedReuploadDocs
        object reviewDecision
    }

    DOCUMENT {
        string _id PK
        string applicationId FK
        string applicantId FK
        string documentCategory "Identity Proof | Income Certificate | Marksheet | Passbook"
        string originalFileName
        string storedFileName "UUID.ext"
        number fileSize
        string mimeType
        string filePath
        string uploadTimestamp
        object extractedData
        string status "Uploaded | Processed | Flagged | Replaced"
    }

    VERIFICATION_RUN {
        string _id PK
        string applicationId FK
        string runTimestamp
        string runBy
        string status
        number preliminaryRiskScore
        string riskLevel "Low Risk | Medium Risk | High Risk"
        array scoringBreakdown
        array crossDocumentComparisons
        array ruleResults
        array missingDocuments
        array authenticityIndicators
        array suggestedNextActions
    }

    COMPLIANCE_RULE {
        string _id PK
        string ruleCode UK "RULE_MANDATORY_DOCS"
        string name
        string description
        string category
        string severity "High | Medium | Low"
        boolean enabled
        string version
    }

    AUDIT_EVENT {
        string _id PK
        string timestamp
        string actorId FK
        string actorName
        string actorRole
        string action
        string targetType
        string targetReference
        string details
        string outcome "Success | Warning | Failure"
        string ipAddress
    }
```

---

## 3. End-to-End Data Flow Pipelines

### Pipeline A: Citizen Application Submission & Automated Screening

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen (Arpit Kumar)
    participant UI as NewApplicationPage.jsx
    participant API as applicationController.js
    participant Upload as documentController.js
    participant Pipeline as verificationPipeline.js
    participant OCR as ocrAdapter.js
    participant Comp as comparisonEngine.js
    participant Rules as complianceRulesEngine.js
    participant Risk as riskScoringEngine.js
    participant DB as Storage (JSON/MongoDB)
    participant Audit as auditService.js

    Citizen->>UI: Fills Step 1 (Details) + Attaches Step 2 (Files)
    Citizen->>UI: Clicks "Submit Application Now"
    UI->>API: POST /api/applications (creates draft)
    API->>DB: INSERT into applications.json (APP-2026-XXXX)
    
    loop For each attached document
        UI->>Upload: POST /api/applications/:id/documents (multipart)
        Upload->>OCR: processDocument(fileInfo, context)
        OCR-->>Upload: returns extractedData
        Upload->>DB: INSERT into documents.json
        Upload->>Audit: log("Document Uploaded")
    end

    UI->>API: POST /api/applications/:id/submit
    API->>Pipeline: runVerificationPipeline(applicationId)
    
    Pipeline->>Comp: compare(application, documents)
    Comp-->>Pipeline: crossDocumentComparisons (Levenshtein similarity)

    Pipeline->>Rules: evaluate(application, documents)
    Rules-->>Pipeline: ruleResults (Pass / Flagged)

    Pipeline->>Risk: calculateAssessment(findings)
    Risk-->>Pipeline: score, riskLevel, itemized breakdown

    Pipeline->>DB: INSERT into verificationRuns.json
    Pipeline->>DB: UPDATE application status='Under Review', priority='High'/'Normal'
    Pipeline->>Audit: log("Verification Pipeline Executed")

    API-->>UI: 200 OK (Receipt reference & confirmation)
    UI-->>Citizen: Displays Confirmation Receipt
```

---

### Pipeline B: Reviewer Adjudication & Decision Recording

```mermaid
sequenceDiagram
    autonumber
    actor Reviewer as Verification Officer (Priya Sharma)
    participant UI as VerificationWorkspacePage.jsx
    participant API as verificationController.js
    participant DB as Storage (JSON/MongoDB)
    participant Audit as auditService.js
    actor Citizen as Citizen (Arpit Kumar)

    Reviewer->>UI: Opens /reviewer/workspace/:id
    UI->>API: GET /api/applications/:id/verification-workspace
    API->>DB: SELECT application, documents, latestVerificationRun
    API-->>UI: Returns complete dossier
    UI-->>Reviewer: Renders 4 sections (Info, Documents, Summary Table, Decision)

    alt Decision: Request Re-upload
        Reviewer->>UI: Selects "Request Re-upload" + checks ["Bank Passbook"]
        Reviewer->>UI: Enters officer remarks + clicks "Confirm & Save"
        UI->>API: POST /api/applications/:id/reviews
        API->>DB: UPDATE application status='Re-upload Requested', requestedReuploadDocs=['Bank Passbook']
        API->>Audit: log("Reviewer Decision: Request Re-upload")
        API-->>UI: 200 OK (Decision saved)
        Citizen->>UI: Citizen refreshes /applicant/dashboard
        UI-->>Citizen: Status: "Action Required: Please upload missing Bank Passbook"
    else Decision: Approve
        Reviewer->>UI: Selects "Approve" + enters approval remarks
        UI->>API: POST /api/applications/:id/reviews
        API->>DB: UPDATE application status='Verified'
        API->>Audit: log("Reviewer Decision: Approve")
        API-->>UI: 200 OK
        Citizen->>UI: Status shows "Verified" (Green badge)
    end
```

---

## 4. Data Lifecycle: CRUD Operations Matrix

| Entity | Created At | Read At | Updated At | Deleted At |
| :--- | :--- | :--- | :--- | :--- |
| **User** | Seed script (`seedData.js`) or `POST /api/auth/register`. | `POST /api/auth/login`, `GET /api/auth/me`. | Profile updates. | Admin user management (protected). |
| **Application** | `POST /api/applications` (`createApplication`). | `GET /api/applications`, `GET /api/applications/:id`, `GET /.../verification-workspace`. | `PATCH /api/applications/:id` (draft edits), `submitApplication`, `recordReviewDecision` (status, comments, decision). | Never hard-deleted in production; marked inactive for statutory audit. |
| **Document** | `POST /api/applications/:id/documents` (`uploadDocument`). | `GET /api/applications/:id/documents`, `GET /api/documents/:id/file`. | Marked `status: 'Replaced'` when applicant uploads a newer certificate. | `DELETE /api/documents/:id` (removes disk file and unlinks from store). |
| **Verification Run** | `runVerificationPipeline()` invoked automatically on submission, upload, or manual trigger. | `getVerificationDetails()`, `getApplicationById()`. | Append-only; new run created each time to preserve historical evaluation lineage. | Never deleted; immutable verification record. |
| **Compliance Rule** | Seed script (`seedData.js`). | `GET /api/compliance-rules`, `ComplianceRulesEngine.evaluate()`. | `PATCH /api/compliance-rules/:id/toggle` (enabled true/false), `PATCH /api/compliance-rules/:id`. | Protected; system rules cannot be removed. |
| **Audit Event** | `AuditService.log()` on every system event. | `GET /api/audit-events` (`getAuditEvents`). | **Immutable.** Never updated. | **Append-only.** Never deleted. |
