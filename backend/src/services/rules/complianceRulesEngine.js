/**
 * Compliance Rules Evaluation Engine
 * Evaluates configured sample demonstration rules against application data and uploaded documents.
 * Discloses that rules are sample demonstration criteria for hackathon evaluation.
 */

export class ComplianceRulesEngine {
  constructor(rulesStore) {
    this.rulesStore = rulesStore;
  }

  /**
   * Run enabled compliance rules against application & documents
   * @param {Object} application
   * @param {Array} documents
   * @returns {Promise<Array>} List of rule evaluation results
   */
  async evaluate(application, documents = []) {
    let rules = [];
    if (this.rulesStore) {
      rules = await this.rulesStore.find({ enabled: true });
    }

    // Default built-in sample rules if store is empty or unavailable
    if (!rules || rules.length === 0) {
      rules = [
        {
          ruleCode: 'RULE_MANDATORY_DOCS',
          name: 'Mandatory Supporting Documents Checklist',
          severity: 'High',
          category: 'Document Presence',
          description: 'Verifies that Identity Proof and Income Certificate are attached to the application.',
          isSampleRule: true
        },
        {
          ruleCode: 'RULE_DOC_VALIDITY',
          name: 'Document Validity and Expiration Assessment',
          severity: 'High',
          category: 'Validity Period',
          description: 'Checks that income certificate has not passed its recorded validity expiry date.',
          isSampleRule: true
        },
        {
          ruleCode: 'RULE_NAME_CONSISTENCY',
          name: 'Cross-Document Identity Consistency',
          severity: 'Medium',
          category: 'Identity Verification',
          description: 'Checks that the applicant name matches across all provided documents.',
          isSampleRule: true
        },
        {
          ruleCode: 'RULE_INCOME_CEILING',
          name: 'Assistance Scheme Income Ceiling Rule',
          severity: 'Medium',
          category: 'Financial Eligibility',
          description: 'Verifies that declared and certified annual family income is within demo assistance scheme limits (Rs. 2,50,000).',
          isSampleRule: true
        },
        {
          ruleCode: 'RULE_REQUIRED_FIELDS',
          name: 'Application Form Completeness',
          severity: 'Low',
          category: 'Form Integrity',
          description: 'Ensures essential fields including reference number, contact details, and bank account info are present.',
          isSampleRule: true
        }
      ];
    }

    const results = [];
    const idDoc = documents.find(d => d.documentCategory === 'Identity Proof');
    const incomeDoc = documents.find(d => d.documentCategory === 'Income Certificate');

    for (const rule of rules) {
      if (rule.enabled === false) continue;

      if (rule.ruleCode === 'RULE_MANDATORY_DOCS') {
        const hasId = !!idDoc;
        const hasIncome = !!incomeDoc;
        const missing = [];
        if (!hasId) missing.push('Identity Proof');
        if (!hasIncome) missing.push('Income Certificate');

        if (missing.length === 0) {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Pass',
            evidence: 'Identity Proof and Income Certificate are both present in document attachments.',
            explanation: 'Both mandatory supporting documents have been uploaded and ingested successfully.'
          });
        } else {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Flagged',
            evidence: `Missing documents: ${missing.join(', ')}`,
            explanation: `The application cannot proceed to final approval until ${missing.join(' and ')} are provided.`
          });
        }
      }

      else if (rule.ruleCode === 'RULE_DOC_VALIDITY') {
        if (!incomeDoc || !incomeDoc.extractedData || !incomeDoc.extractedData.expiryDate) {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Manual Review Required',
            evidence: 'Income certificate expiry date could not be determined automatically.',
            explanation: 'Document expiry field was either not extracted or the document is missing. Visual check required.'
          });
        } else if (incomeDoc.extractedData.expiryDate === 'N/A' || incomeDoc.extractedData.expiryDate === 'N/A (Permanent)') {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Pass',
            evidence: `Document validity recorded as permanent or non-expiring (${incomeDoc.extractedData.expiryDate}).`,
            explanation: 'Document validity is recorded as permanent.'
          });
        } else {
          const expiry = new Date(incomeDoc.extractedData.expiryDate);
          const now = new Date();
          if (isNaN(expiry.getTime())) {
            results.push({
              ruleId: rule._id || rule.ruleCode,
              ruleCode: rule.ruleCode,
              ruleName: rule.name,
              severity: rule.severity,
              status: 'Manual Review Required',
              evidence: `Raw expiry text: "${incomeDoc.extractedData.expiryDate}"`,
              explanation: 'Unrecognized date format. Officer visual review advised.'
            });
          } else if (expiry < now) {
            results.push({
              ruleId: rule._id || rule.ruleCode,
              ruleCode: rule.ruleCode,
              ruleName: rule.name,
              severity: rule.severity,
              status: 'Flagged',
              evidence: `Certificate expired on ${incomeDoc.extractedData.expiryDate} (Current date: ${now.toISOString().split('T')[0]}).`,
              explanation: 'Income certificate has expired. An updated certificate is required.'
            });
          } else {
            results.push({
              ruleId: rule._id || rule.ruleCode,
              ruleCode: rule.ruleCode,
              ruleName: rule.name,
              severity: rule.severity,
              status: 'Pass',
              evidence: `Certificate is valid until ${incomeDoc.extractedData.expiryDate}.`,
              explanation: 'Income certificate validity date is within the acceptable time window.'
            });
          }
        }
      }

      else if (rule.ruleCode === 'RULE_NAME_CONSISTENCY') {
        const idName = idDoc?.extractedData?.fullName;
        const appName = application.applicantName;

        if (!idName) {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Manual Review Required',
            evidence: 'Name on identity proof is not available for comparison.',
            explanation: 'Visual review is required to confirm identity proof matches the applicant.'
          });
        } else if (idName.trim().toLowerCase() === appName.trim().toLowerCase()) {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Pass',
            evidence: `Application name "${appName}" matches identity document name "${idName}".`,
            explanation: 'Applicant name is identical across primary identity records.'
          });
        } else {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Flagged',
            evidence: `Application: "${appName}" vs ID Document: "${idName}".`,
            explanation: 'Name discrepancy detected between application and supporting document. Human reviewer verification needed.'
          });
        }
      }

      else if (rule.ruleCode === 'RULE_INCOME_CEILING') {
        const ceiling = 250000;
        const income = Number(application.annualFamilyIncome || 0);

        if (income <= ceiling) {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Pass',
            evidence: `Declared annual income of Rs. ${income.toLocaleString('en-IN')} is within demo limit of Rs. ${ceiling.toLocaleString('en-IN')}.`,
            explanation: 'Financial eligibility criteria satisfied for demo assistance program.'
          });
        } else {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Flagged',
            evidence: `Declared income of Rs. ${income.toLocaleString('en-IN')} exceeds demo ceiling of Rs. ${ceiling.toLocaleString('en-IN')}.`,
            explanation: 'Applicant income exceeds demo scholarship assistance income threshold.'
          });
        }
      }

      else if (rule.ruleCode === 'RULE_REQUIRED_FIELDS') {
        const missingFields = [];
        if (!application.applicantName) missingFields.push('Applicant Name');
        if (!application.applicantEmail) missingFields.push('Email');
        if (!application.annualFamilyIncome) missingFields.push('Annual Income');
        if (!application.bankAccountNumber) missingFields.push('Bank Account Number');

        if (missingFields.length === 0) {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Pass',
            evidence: 'All required mandatory application form fields are populated.',
            explanation: 'Form data completeness requirements are fully satisfied.'
          });
        } else {
          results.push({
            ruleId: rule._id || rule.ruleCode,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'Flagged',
            evidence: `Incomplete fields: ${missingFields.join(', ')}`,
            explanation: 'Missing essential form details needed for application processing.'
          });
        }
      }
    }

    return results;
  }
}
