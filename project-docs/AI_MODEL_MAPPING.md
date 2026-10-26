# AI Model and API Mapping Report

This document transparently maps all artificial intelligence, machine learning, and algorithmic verification components present in the Suvidha codebase.

---

## 1. Executive Summary & Integrity Disclosure

In accordance with academic integrity and engineering honesty standards:
- **No external third-party commercial LLM or proprietary cloud AI APIs (such as OpenAI GPT-4, Google Gemini Pro API, AWS Textract, or Azure Document Intelligence) are actively called by the live application.**
- **No cloud API keys are required or exposed.** All processing runs locally within the node server boundary.
- Document intelligence and validation are driven by **four internal deterministic engineering engines**:
  1. An extensible **OCR Ingestion Adapter** (`MockOcrAdapter`) simulating structured field extraction from document scans.
  2. A mathematical **Levenshtein Distance Matrix Algorithm** for cross-field identity and financial string comparison.
  3. A configurable **Statutory Compliance Rules Engine** executing rule matrix evaluations.
  4. An explainable **Additive Risk Assessment Engine** calculating prioritized verification scores.

---

## 2. Detailed Component-by-Component Mapping

### Component 1: Document Scan Ingestion Engine (OCR Adapter)

| Property | Actual Value in Codebase |
| :--- | :--- |
| **Model / Component Name** | `MockOcrAdapter` (Extensible Adapter Pattern) |
| **Provider / Source** | Internal rule-based document analysis engine |
| **Model Version** | Version `1.0.0` (Modular Adapter Interface) |
| **Source File** | `backend/src/services/ocr/ocrAdapter.js` |
| **Where Initialized / Called** | Initialized by factory `getOcrAdapter()` in `ocrAdapter.js` (line 119); invoked in `verificationPipeline.js` (line 21) and `documentController.js` (line 50). |
| **API Endpoint / SDK Used** | Pure Node.js class implementation. No external SDK or network call. |
| **Inference Location** | **100% Local execution.** Runs inside the Express Node.js process. |
| **Input** | `fileInfo` object (`originalFileName`, `mimeType`, `documentCategory`) and `context` object (`applicantName`, `annualFamilyIncome`, `rollNumber`, `bankAccountNumber`, `bankIfscCode`). |
| **Preprocessing** | Filename string inspection (`.includes('mismatch')`, `.includes('expired')`) to simulate diverse document conditions (such as expired revenue certificates or typos). |
| **Output** | Structured JSON object containing: `documentNumber`, `fullName`, `dateOfBirth`, `issueDate`, `expiryDate`, `annualIncome`, `issuingAuthority`, `rawText`, `confidence` (percentage), `isMock: true`, `provider`, and `extractionDate`. |
| **Postprocessing** | Extracted fields are persisted into the `extractedData` subdocument of the `Document` schema in `backend/data/documents.json`. |
| **Implementation Classification** | **Architectural Adapter Simulation.** Built to demonstrate the exact data contracts required for on-premise production engines (e.g. Tesseract OCR, PaddleOCR, or EasyOCR) without requiring heavy Python / C++ dependencies on the evaluation machine. |
| **API Keys Configured** | None required. No `.env` API keys needed. |

---

### Component 2: Cross-Document String Comparison Engine

| Property | Actual Value in Codebase |
| :--- | :--- |
| **Model / Algorithm Name** | Dynamic Programming Levenshtein Distance Matrix Algorithm (`calculateStringSimilarity`) |
| **Algorithm Type** | Classical Computational Linguistics / Approximate String Matching |
| **Source File** | `backend/src/services/comparison/comparisonEngine.js` (lines 7–34) |
| **Where Initialized / Called** | Instantiated as `new ComparisonEngine()` in `verificationPipeline.js` (line 50); invoked via `comparisonEngine.compare(application, documents)`. |
| **Inference Location** | **100% Local execution.** |
| **Mathematical Formulation** | 
$$\text{similarity}(s_1, s_2) = \frac{\max(|s_1|, |s_2|) - \text{LevenshteinDistance}(s_1, s_2)}{\max(|s_1|, |s_2|)}$$
| **Input** | Form values declared by applicant (Name, Income, Roll Number, Account Number) and extracted values from uploaded document scans. |
| **Threshold Logic** |
- **Exact Match ($1.0$):** `Status: Matched` (100% confidence).
- **Fuzzy Match ($0.85 \le \text{sim} < 1.0$):** `Status: Matched` with explanation noting minor character divergence (e.g. initials, honorifics, or minor transliteration differences).
- **Mismatch ($\text{sim} < 0.85$):** `Status: Mismatch detected` with exact percentage and discrepancy explanation.
- **Missing Document:** `Status: Unable to compare`. |
| **Output** | Array of comparison findings rendered in the Verification Workspace summary table. |
| **Implementation Classification** | **Fully Genuine, Functional Algorithmic Implementation.** |

---

### Component 3: Regulatory Compliance Verification Rules Engine

| Property | Actual Value in Codebase |
| :--- | :--- |
| **Model / Engine Name** | `ComplianceRulesEngine` |
| **Engine Type** | Deterministic Expert System / Policy Rule Evaluation Engine |
| **Source File** | `backend/src/services/rules/complianceRulesEngine.js` |
| **Where Initialized / Called** | `verificationPipeline.js` (line 54); instantiated with `store.complianceRules`. |
| **Inference Location** | **100% Local execution.** |
| **Evaluated Rules** |
1. `RULE_MANDATORY_DOCS` (Document presence: Identity Proof & Income Certificate).
2. `RULE_DOC_VALIDITY` (Temporal validity: Checks if certificate expiry date has elapsed against `Date.now()`).
3. `RULE_NAME_CONSISTENCY` (Cross-check: Ensures applicant name is consistent across all uploaded files).
4. `RULE_INCOME_CEILING` (Financial threshold: Compares declared/extracted income against scheme maximum of Rs. 2,50,000).
5. `RULE_REQUIRED_FIELDS` (Form completeness: Ensures IFSC, bank account, and contact info are non-empty). |
| **Output** | Array of rule evaluation results (`Pass`, `Flagged`, or `Manual Review Required`) with evidence and administrative explanations. |
| **Implementation Classification** | **Fully Genuine, Functional Algorithmic Implementation.** |

---

### Component 4: Explainable Decision-Support Risk Assessment Engine

| Property | Actual Value in Codebase |
| :--- | :--- |
| **Model / Engine Name** | `RiskScoringEngine` |
| **Engine Type** | Additive Deductive Scoring Engine (Deterministic Linear Penalty Model) |
| **Source File** | `backend/src/services/scoring/riskScoringEngine.js` |
| **Where Initialized / Called** | `verificationPipeline.js` (line 58); invoked via `scoringEngine.calculateAssessment()`. |
| **Inference Location** | **100% Local execution.** |
| **Mathematical Penalty Formulation** |
$$\text{Score} = \min\left(100, \sum \text{Penalties}\right)$$
- Baseline profile: $0$
- Missing required document: $+25$ per missing document
- Name discrepancy detected: $+25$
- Income discrepancy detected: $+20$
- High-severity rule flag: $+25$
- Medium-severity rule flag: $+15$
- Low OCR scan confidence (<70%): $+10$
- Valid unexpired file structure: $0$ |
| **Risk Level Bands** |
- **Low Risk:** Score $0 - 24$
- **Medium Risk:** Score $25 - 54$
- **High Risk:** Score $55 - 100$
- **Insufficient Information:** No documents attached |
| **Output** | Object containing `preliminaryRiskScore`, `riskLevel`, itemized `scoringBreakdown` array, `suggestedNextActions` array, and `authenticityIndicators`. |
| **Legal & Administrative Constraint** | **Never Declares Fraud.** The engine strictly provides advisory prioritization for the reviewer queue. All approval, re-upload, and rejection decisions require human reviewer signature. |
| **Implementation Classification** | **Fully Genuine, Functional Algorithmic Implementation.** |

---

## 3. How to Connect a Production OCR / LLM Engine (Future Integration Path)

Because the project implements the **Adapter Pattern** in `backend/src/services/ocr/ocrAdapter.js`, connecting a real production OCR model (such as Tesseract, AWS Textract, or an on-premise vision LLM) requires modifying only that single file:

```javascript
// Example Production Tesseract Integration Pattern
import { createWorker } from 'tesseract.js';

export class TesseractOcrAdapter {
  constructor() {
    this.providerName = 'Tesseract.js Neural OCR Engine';
  }

  async processDocument(fileInfo, context = {}) {
    const worker = await createWorker('eng+hin');
    const ret = await worker.recognize(fileInfo.filePath);
    await worker.terminate();

    // Parse extracted text for regex patterns (DOB, Income, Certificate No.)
    return parseTextToStructuredFields(ret.data.text, ret.data.confidence);
  }
}
```
No frontend changes, controller rewrites, or database schema modifications are required to swap the underlying intelligence engine.
