// server/logic/auditLogger.js

let auditLogs = [];

export function logAction({ actor, action, targetType, targetId, before = null, after = null, reason = '', timestamp = null }) {
  if (!actor || !action || !targetType || !targetId) {
    throw new Error('Audit log entry missing mandatory fields (actor, action, targetType, targetId)');
  }

  const logEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actor,
    action,
    targetType,
    targetId,
    before,
    after,
    reason: reason || 'N/A',
    timestamp: timestamp || new Date().toISOString()
  };

  auditLogs.unshift(logEntry);
  return logEntry;
}

export function getAuditLogs(filters = {}) {
  let result = [...auditLogs];

  if (filters.actor) {
    result = result.filter(log => log.actor.toLowerCase().includes(filters.actor.toLowerCase()));
  }
  if (filters.action) {
    result = result.filter(log => log.action === filters.action);
  }
  if (filters.targetType) {
    result = result.filter(log => log.targetType === filters.targetType);
  }
  if (filters.targetId) {
    result = result.filter(log => log.targetId === filters.targetId);
  }
  if (filters.startDate) {
    result = result.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    result = result.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
  }

  return result;
}

export function clearAuditLogsForTesting() {
  auditLogs = [];
}
