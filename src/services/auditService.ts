import { ImmutableAuditLog, RbacRoleType } from '../types';
import { db, collection, setDoc, doc, getDocs } from '../firebase-config';

const STORAGE_AUDIT_KEY = 'bharat_pro_immutable_audit_v1';

const INITIAL_AUDIT_LOGS: ImmutableAuditLog[] = [
  {
    id: 'audit-001',
    actor: 'Bharat Pro Owner',
    actorEmail: 'bharatproexperthomeservices@gmail.com',
    role: 'SUPER_ADMIN',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    ipAddress: '103.21.124.8',
    action: 'SYSTEM_BOOTSTRAP',
    module: 'GOVERNANCE',
    result: 'SUCCESS',
    reason: 'Initial security baseline verification and hub synchronization'
  },
  {
    id: 'audit-002',
    actor: 'Automation Agent',
    actorEmail: 'agent@bharatproexpert.internal',
    role: 'AUTOMATION_AGENT',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    action: 'AUTO_DISPATCH_BROADCAST',
    module: 'DISPATCH',
    recordId: 'BP-1042',
    result: 'SUCCESS',
    reason: 'Matched 3 approved partners within 12km radius of DLF Phase 5 Gurugram',
    automationId: 'auto-run-001'
  },
  {
    id: 'audit-003',
    actor: 'Automation Agent',
    actorEmail: 'agent@bharatproexpert.internal',
    role: 'AUTOMATION_AGENT',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: 'ATOMIC_ASSIGNMENT_LOCK',
    module: 'OPERATIONS',
    recordId: 'BP-1042',
    result: 'SUCCESS',
    reason: 'Partner P-208 (Amit Kumar) accepted first. Atomic server lock acquired.',
    automationId: 'auto-run-002'
  }
];

export const logImmutableAudit = async (entry: Omit<ImmutableAuditLog, 'id' | 'timestamp'>): Promise<ImmutableAuditLog> => {
  const fullLog: ImmutableAuditLog = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
    const existing: ImmutableAuditLog[] = raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
    const updated = [fullLog, ...existing].slice(0, 500); // retain last 500
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(updated));

    // Async persist to Firestore audit_logs collection
    try {
      await setDoc(doc(db, 'audit_logs', fullLog.id), fullLog);
    } catch (e) {
      console.warn('Audit cloud sync deferred:', e);
    }
  } catch (err) {
    console.error('Failed to write immutable audit log', err);
  }

  return fullLog;
};

export const getImmutableAuditLogs = async (): Promise<ImmutableAuditLog[]> => {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
};
