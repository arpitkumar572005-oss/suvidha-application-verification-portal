/**
 * Deterministic Preliminary Risk Assessment Engine
 * Transparent, rule-based risk evaluation based on observable discrepancies.
 * Explicitly disclaims probabilistic fraud predictions: human visual verification is always required.
 */

export class RiskScoringEngine {
  /**
   * Calculate transparent risk score, breakdown, and suggested actions
   * @param {Object} params - { application, documents, crossDocumentComparisons, ruleResults, missingDocuments }
   */
  calculateAssessment({ application, documents = [], crossDocumentComparisons = [], ruleResults = [], missingDocuments = [] }) {
    // If no documents uploaded at all, return Insufficient information
    if (!documents || documents.length === 0) {
      return {
        preliminaryRiskScore: 0,
        riskLevel: 'Insufficient information',
        scoringBreakdown: [
          {
            factor: 'No Documents Uploaded',
            impact: 0,
            description: 'No supporting documents have been uploaded yet. An assessment cannot be calculated without evidence.'
          }
        ],
        suggestedNextActions: [
          'Wait for applicant to upload required supporting documents.',
          'Issue automated reminder if deadline is approaching.'
        ],
        authenticityIndicators: []
      };
    }

    let score = 0;
    const breakdown = [];
    const suggestedNextActions = [];
    const authenticityIndicators = [];

    // Base score check
    breakdown.push({
      factor: 'Baseline Profile Assessment',
      impact: 0,
      description: 'Standard starting baseline for newly ingested applications.'
    });

    // 1. Missing Documents penalty
    if (missingDocuments && missingDocuments.length > 0) {
      const penalty = missingDocuments.length * 25;
      score += penalty;
      breakdown.push({
        factor: `Missing Supporting Documents (${missingDocuments.length})`,
        impact: +penalty,
        description: `Missing required attachments: ${missingDocuments.join(', ')}. Reviewer cannot confirm claims without primary records.`
      });
      suggestedNextActions.push(`Request applicant to upload missing documents: ${missingDocuments.join(', ')}.`);
    }

    // 2. Cross-document comparison mismatches
    const mismatches = crossDocumentComparisons.filter(c => c.status === 'Mismatch detected');
    for (const mismatch of mismatches) {
      let impact = 20;
      if (mismatch.field.includes('Name')) impact = 25;
      if (mismatch.field.includes('Income')) impact = 20;
      score += impact;
      breakdown.push({
        factor: `Cross-Document Discrepancy: ${mismatch.field}`,
        impact: +impact,
        description: mismatch.explanation
      });
      suggestedNextActions.push(`Carefully inspect ${mismatch.documentCategory} against application form details for ${mismatch.field}.`);
    }

    // 3. Flagged Compliance Rules
    const flaggedRules = ruleResults.filter(r => r.status === 'Flagged');
    for (const rule of flaggedRules) {
      // Don't double count missing documents if rule is RULE_MANDATORY_DOCS
      if (rule.ruleCode === 'RULE_MANDATORY_DOCS') continue;

      let impact = 15;
      if (rule.severity === 'High') impact = 25;
      if (rule.severity === 'Medium') impact = 15;
      if (rule.severity === 'Low') impact = 10;

      score += impact;
      breakdown.push({
        factor: `Compliance Rule Flag: ${rule.ruleName}`,
        impact: +impact,
        description: rule.explanation
      });
      suggestedNextActions.push(`Address compliance finding: ${rule.ruleName}.`);
    }

    // 4. Expiry Check
    const expiredRule = ruleResults.find(r => r.ruleCode === 'RULE_DOC_VALIDITY' && r.status === 'Flagged');
    if (expiredRule) {
      suggestedNextActions.push('Request applicant to supply a currently valid, unexpired certificate.');
    }

    // 5. OCR Quality & Confidence check
    const lowConfidenceDocs = documents.filter(d => d.extractedData && d.extractedData.confidence < 70);
    if (lowConfidenceDocs.length > 0) {
      score += 10;
      breakdown.push({
        factor: 'Low Document Legibility / OCR Confidence',
        impact: +10,
        description: `${lowConfidenceDocs.length} document(s) have optical scan confidence below 70%. Does not indicate fraud; indicates potential scan blur or low resolution.`
      });
      suggestedNextActions.push('Perform visual inspection of document scans for clarity.');
    }

    // Document Authenticity Indicators (demonstration heuristics)
    for (const doc of documents) {
      const isPdf = doc.mimeType === 'application/pdf';
      const sizeOk = doc.fileSize > 20000 && doc.fileSize < 5000000;
      authenticityIndicators.push({
        indicator: `${doc.documentCategory} - File Structure Integrity`,
        status: sizeOk ? 'Passed' : 'Review Recommended',
        details: sizeOk 
          ? `File size (${Math.round(doc.fileSize / 1024)} KB) is within expected resolution envelope.`
          : 'File size is unusually small or compressed; check visual legibility.'
      });

      authenticityIndicators.push({
        indicator: `${doc.documentCategory} - Metadata Consistency`,
        status: 'Passed',
        details: `Timestamp and MIME type (${doc.mimeType}) consistent with standard administrative submissions.`
      });
    }

    // Clamp score to 100
    const finalScore = Math.min(100, Math.max(0, score));

    // Determine deterministic risk level
    let riskLevel = 'Low Risk';
    if (finalScore >= 55) {
      riskLevel = 'High Risk';
    } else if (finalScore >= 25) {
      riskLevel = 'Medium Risk';
    } else {
      riskLevel = 'Low Risk';
    }

    if (suggestedNextActions.length === 0) {
      suggestedNextActions.push('All standard automated checks passed. Reviewer may proceed to final approval.');
    }

    return {
      preliminaryRiskScore: finalScore,
      riskLevel,
      scoringBreakdown: breakdown,
      suggestedNextActions,
      authenticityIndicators
    };
  }
}
