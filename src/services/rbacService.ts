import { RbacRoleType, RbacPermissionAction, EmployeeAccount } from '../types';

export interface RoleDefinition {
  type: RbacRoleType;
  title: string;
  department: string;
  description: string;
  badgeColor: string;
  permissions: RbacPermissionAction[];
}

export const RBAC_ROLES: Record<RbacRoleType, RoleDefinition> = {
  SUPER_ADMIN: {
    type: 'SUPER_ADMIN',
    title: 'Super Admin',
    department: 'Executive Governance',
    description: 'Full unconstrained platform authority, AI developer execution, deployment and kill switch controls.',
    badgeColor: 'bg-red-600 text-white',
    permissions: [
      'view', 'create', 'edit', 'delete', 'archive', 'restore', 
      'approve', 'reject', 'payout', 'refund', 'dispatch', 
      'manage_users', 'manage_permissions', 'manage_integrations', 
      'run_ai_tasks', 'deploy', 'rollback', 'configure_automation'
    ]
  },
  OPERATIONS_DIRECTOR: {
    type: 'OPERATIONS_DIRECTOR',
    title: 'Operations Director',
    department: 'Operations',
    description: 'Oversees nationwide booking floor, hub performance, dispatch SLA and operational exceptions.',
    badgeColor: 'bg-blue-700 text-white',
    permissions: [
      'view', 'create', 'edit', 'approve', 'reject', 'dispatch', 
      'configure_automation', 'archive'
    ]
  },
  LIVE_DISPATCH_COMMANDER: {
    type: 'LIVE_DISPATCH_COMMANDER',
    title: 'Live Dispatch Commander',
    department: 'Operations & Dispatch',
    description: 'Manages real-time booking floor, manual override dispatch, atomic assignments and emergency reassignments.',
    badgeColor: 'bg-indigo-600 text-white',
    permissions: ['view', 'edit', 'dispatch', 'configure_automation']
  },
  LOCAL_HUB_LEAD: {
    type: 'LOCAL_HUB_LEAD',
    title: 'Local Hub Operations Lead',
    department: 'Hub Operations',
    description: 'Manages city/sector-specific physical hubs, partner check-ins, local stock and territory boundaries.',
    badgeColor: 'bg-sky-600 text-white',
    permissions: ['view', 'create', 'edit', 'dispatch']
  },
  QUALITY_SOP_OFFICER: {
    type: 'QUALITY_SOP_OFFICER',
    title: 'Quality & SOP Officer',
    department: 'Quality Assurance',
    description: 'Reviews job before/after proof images, enforces hospital-grade Diversey hygiene SOPs, and conducts training.',
    badgeColor: 'bg-emerald-700 text-white',
    permissions: ['view', 'edit', 'approve', 'reject']
  },
  CATALOGUE_CONTENT_LEAD: {
    type: 'CATALOGUE_CONTENT_LEAD',
    title: 'Catalogue & Content Lead',
    department: 'Product & Marketing',
    description: 'Authoritative owner of service rates, step specifications, inclusions/exclusions, photos and promotional tags.',
    badgeColor: 'bg-purple-700 text-white',
    permissions: ['view', 'create', 'edit', 'archive', 'restore']
  },
  FINANCE_ACCOUNTS_OFFICER: {
    type: 'FINANCE_ACCOUNTS_OFFICER',
    title: 'Finance & Accounts Officer',
    department: 'Finance',
    description: 'Calculates platform commission, audits Razorpay settlements, authorizes payouts, and reviews refund cases.',
    badgeColor: 'bg-emerald-600 text-white',
    permissions: ['view', 'edit', 'payout', 'refund']
  },
  CRM_CUSTOMER_OPS_LEAD: {
    type: 'CRM_CUSTOMER_OPS_LEAD',
    title: 'CRM & Customer Operations Lead',
    department: 'Customer Relationship',
    description: 'Manages customer ledgers, VIP clients, grievance resolution, review moderation and direct communications.',
    badgeColor: 'bg-amber-600 text-white',
    permissions: ['view', 'edit', 'refund']
  },
  PARTNER_FLEET_MANAGER: {
    type: 'PARTNER_FLEET_MANAGER',
    title: 'Partner / Fleet Manager',
    department: 'Fleet Operations',
    description: 'Vets technician identities, verifies police NOCs/Aadhaar/PAN, approves partners, and manages suspensions.',
    badgeColor: 'bg-teal-700 text-white',
    permissions: ['view', 'create', 'edit', 'approve', 'reject', 'archive']
  },
  REPORTS_ANALYTICS_MANAGER: {
    type: 'REPORTS_ANALYTICS_MANAGER',
    title: 'Reports & Analytics Manager',
    department: 'Business Intelligence',
    description: 'Generates city-wise GMV, fleet retention, customer repeat rate, cancellation audits and operational exports.',
    badgeColor: 'bg-slate-700 text-white',
    permissions: ['view']
  },
  SECURITY_AUDIT_ADMIN: {
    type: 'SECURITY_AUDIT_ADMIN',
    title: 'Security & Audit Administrator',
    department: 'Governance & Compliance',
    description: 'Monitors immutable activity logs, AI Developer task plans, authorization anomalies and session security.',
    badgeColor: 'bg-neutral-800 text-white',
    permissions: ['view', 'manage_users', 'manage_permissions', 'rollback']
  }
};

const STORAGE_EMPLOYEES_KEY = 'bharat_pro_employees_v1';

export const INITIAL_EMPLOYEES: EmployeeAccount[] = [
  {
    id: 'emp-001',
    name: 'Bharat Pro Owner',
    email: 'bharatproexperthomeservices@gmail.com',
    phone: '+91 8920252647',
    role: 'SUPER_ADMIN',
    roleTitle: 'Super Administrator / Owner',
    status: 'ACTIVE',
    assignedCity: 'All India',
    assignedModules: ['ALL'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-30T10:00:00Z'
  },
  {
    id: 'emp-002',
    name: 'Rajesh Sharma',
    email: 'ops.director@bharatproexpert.com',
    phone: '+91 9811023456',
    role: 'OPERATIONS_DIRECTOR',
    roleTitle: 'Operations Director (NCR & North)',
    status: 'ACTIVE',
    assignedCity: 'Delhi NCR & Gurugram',
    assignedModules: ['OPERATIONS', 'DISPATCH', 'HUBS', 'PARTNERS'],
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-09-30T10:00:00Z'
  },
  {
    id: 'emp-003',
    name: 'Pooja Verma',
    email: 'finance.lead@bharatproexpert.com',
    phone: '+91 9871145678',
    role: 'FINANCE_ACCOUNTS_OFFICER',
    roleTitle: 'Chief Accounts Officer',
    status: 'ACTIVE',
    assignedCity: 'Gurugram HQ',
    assignedModules: ['FINANCE', 'SETTLEMENTS', 'REFUNDS'],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-09-30T10:00:00Z'
  }
];

export const getEmployeesList = (): EmployeeAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_EMPLOYEES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_EMPLOYEES;
  } catch {
    return INITIAL_EMPLOYEES;
  }
};

export const saveEmployeesList = (employees: EmployeeAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(employees));
  } catch (e) {
    console.error('Failed to save employees to local storage', e);
  }
};

export const hasPermission = (
  role: RbacRoleType, 
  action: RbacPermissionAction
): boolean => {
  if (role === 'SUPER_ADMIN') return true;
  const def = RBAC_ROLES[role];
  if (!def) return false;
  return def.permissions.includes(action);
};
