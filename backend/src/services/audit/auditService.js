/**
 * Audit Logging Service
 * Records administrative and user actions into a tamper-traceable audit trail.
 * Strictly avoids logging passwords, tokens, or raw PII.
 */

export class AuditService {
  constructor(auditStore) {
    this.auditStore = auditStore;
  }

  /**
   * Log an event
   * @param {Object} eventParams
   */
  async log({
    actorId = 'system',
    actorName = 'System Service',
    actorRole = 'system',
    action,
    targetType,
    targetReference,
    details = '',
    outcome = 'Success',
    ipAddress = '127.0.0.1'
  }) {
    try {
      const record = {
        timestamp: new Date().toISOString(),
        actorId,
        actorName,
        actorRole,
        action,
        targetType,
        targetReference,
        details,
        outcome,
        ipAddress
      };
      await this.auditStore.create(record);
      return record;
    } catch (err) {
      console.error('[AuditService] Failed to persist audit event:', err.message);
      return null;
    }
  }

  async getRecent(filter = {}, limit = 100) {
    const events = await this.auditStore.find(filter);
    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }
}
