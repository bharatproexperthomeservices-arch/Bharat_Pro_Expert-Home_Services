import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  Plus, 
  Search, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Sliders,
  Mail,
  Phone,
  MapPin,
  Trash2
} from 'lucide-react';
import { EmployeeAccount, RbacRoleType, RbacPermissionAction } from '../../types';
import { 
  RBAC_ROLES, 
  getEmployeesList, 
  saveEmployeesList, 
  hasPermission 
} from '../../services/rbacService';
import { logImmutableAudit } from '../../services/auditService';

export const AdminEmployeesRbacTab: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeAccount[]>(getEmployeesList());
  const [selectedRole, setSelectedRole] = useState<RbacRoleType>('SUPER_ADMIN');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<EmployeeAccount>>({
    name: '',
    email: '',
    phone: '',
    role: 'OPERATIONS_DIRECTOR',
    status: 'ACTIVE',
    assignedCity: 'Gurugram'
  });

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) return;

    const account: EmployeeAccount = {
      id: `emp-${Date.now().toString().slice(-4)}`,
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone || '',
      role: newEmployee.role as RbacRoleType,
      roleTitle: RBAC_ROLES[newEmployee.role as RbacRoleType]?.title || 'Staff',
      status: 'ACTIVE',
      assignedCity: newEmployee.assignedCity || 'Gurugram',
      assignedModules: [newEmployee.role === 'SUPER_ADMIN' ? 'ALL' : 'OPERATIONS'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [account, ...employees];
    setEmployees(updated);
    saveEmployeesList(updated);
    setModalOpen(false);
    setNewEmployee({ name: '', email: '', phone: '', role: 'OPERATIONS_DIRECTOR', status: 'ACTIVE', assignedCity: 'Gurugram' });

    logImmutableAudit({
      actor: 'Super Admin',
      actorEmail: 'bharatproexperthomeservices@gmail.com',
      role: 'SUPER_ADMIN',
      action: 'EMPLOYEE_ONBOARDED',
      module: 'GOVERNANCE',
      recordId: account.id,
      result: 'SUCCESS',
      reason: `Created ${account.name} with role ${account.role}`
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const next = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = employees.map(e => e.id === id ? { ...e, status: next as any } : e);
    setEmployees(updated);
    saveEmployeesList(updated);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="bg-[#0F172A] text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Employees &bull; 11-Role RBAC Governance
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Granular server-side role-based access control, least privilege enforcement, and staff directory.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Employee</span>
        </button>
      </div>

      {/* 11 Roles Horizontal Matrix Preview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            11 Discrete Operational Roles Matrix
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Zero Client-Side Trust &bull; Enforced Server-Side
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {Object.values(RBAC_ROLES).map(role => (
            <button
              key={role.type}
              onClick={() => setSelectedRole(role.type)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer text-xs space-y-1 ${
                selectedRole === role.type
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
              }`}
            >
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase inline-block ${role.badgeColor}`}>
                {role.title.slice(0, 14)}
              </span>
              <p className="text-[11px] font-bold text-slate-900 truncate mt-1">{role.title}</p>
              <span className="text-[10px] text-slate-500 block truncate">{role.department}</span>
            </button>
          ))}
        </div>

        {/* Selected Role Permissions Inspector */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">
              Permissions for {RBAC_ROLES[selectedRole]?.title} ({RBAC_ROLES[selectedRole]?.permissions.length} actions authorized)
            </span>
            <span className="text-slate-500 text-[11px]">{RBAC_ROLES[selectedRole]?.description}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {RBAC_ROLES[selectedRole]?.permissions.map(perm => (
              <span key={perm} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-bold text-blue-800">
                ✓ {perm}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-800">
            Registered Internal Staff Directory ({filteredEmployees.length})
          </span>

          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              className="bg-transparent outline-none text-xs w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] text-slate-500 font-semibold">
                <th className="p-3.5">Employee Name &amp; Contact</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Operational City / Hub</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{emp.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{emp.email} &bull; {emp.phone}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block">{emp.roleTitle}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{emp.role}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-slate-700">{emp.assignedCity}</span>
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggleStatus(emp.id, emp.status)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition cursor-pointer"
                    >
                      {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Onboard Employee &bull; Assign RBAC</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newEmployee.name}
                  onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Vikram Singh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmployee.email}
                  onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))}
                  placeholder="vikram.singh@bharatproexpert.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Mobile Phone</label>
                <input
                  type="text"
                  value={newEmployee.phone}
                  onChange={e => setNewEmployee(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 9811000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Operational Role</label>
                <select
                  value={newEmployee.role}
                  onChange={e => setNewEmployee(p => ({ ...p, role: e.target.value as RbacRoleType }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold"
                >
                  {Object.values(RBAC_ROLES).map(r => (
                    <option key={r.type} value={r.type}>{r.title} ({r.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Territory / City</label>
                <select
                  value={newEmployee.assignedCity}
                  onChange={e => setNewEmployee(p => ({ ...p, assignedCity: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                >
                  <option value="All India HQ">All India HQ</option>
                  <option value="Gurugram">Gurugram (Cyber City &amp; Golf Course)</option>
                  <option value="Delhi NCR">Delhi NCR &amp; South Delhi</option>
                  <option value="Patna">Patna (Bihar Hubs)</option>
                  <option value="Ranchi">Ranchi (Jharkhand Hubs)</option>
                  <option value="Mumbai">Mumbai (Western &amp; Central)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Grant RBAC &amp; Save Employee
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployeesRbacTab;
