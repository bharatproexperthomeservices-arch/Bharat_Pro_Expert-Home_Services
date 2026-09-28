import React, { useState } from 'react';
import { 
  ComplaintTicket, 
  AuditLogEntry, 
  RBACRoleRecord, 
  Booking, 
  Partner, 
  HubLocation 
} from '../../types';
import { 
  INITIAL_COMPLAINTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_RBAC_ROLES 
} from '../../data';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  BarChart3, 
  Bell, 
  Sliders, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Smartphone, 
  TrendingUp, 
  DollarSign, 
  UserCheck, 
  Key,
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AdminGovernanceAndAuditProps {
  bookings: Booking[];
  partners: Partner[];
  hubs: HubLocation[];
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const AdminGovernanceAndAudit: React.FC<AdminGovernanceAndAuditProps> = ({
  bookings,
  partners,
  hubs,
  onAuditLog
}) => {
  const [activeTab, setActiveTab] = useState<'RBAC' | 'AUDIT_LOGS' | 'COMPLAINTS' | 'NOTIFICATIONS' | 'SETTINGS' | 'BI_REPORTS'>('RBAC');
  const [complaints, setComplaints] = useState<ComplaintTicket[]>(INITIAL_COMPLAINTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [roles, setRoles] = useState<RBACRoleRecord[]>(INITIAL_RBAC_ROLES);

  // Settings state
  const [defaultDiscountPct, setDefaultDiscountPct] = useState<number>(15);
  const [cancellationCutoffHours, setCancellationCutoffHours] = useState<number>(2);
  const [platformFee, setPlatformFee] = useState<number>(49);
  const [gstPct, setGstPct] = useState<number>(18);
  const [autoDispatchTimeout, setAutoDispatchTimeout] = useState<number>(60);
  const [emergencyLock, setEmergencyLock] = useState<boolean>(false);

  // Resolution of a complaint
  const handleResolveComplaint = (ticketId: string, resolution: 'REWORK_SCHEDULED' | 'REFUND_APPROVED' | 'RESOLVED') => {
    const updated = complaints.map(c => {
      if (c.id === ticketId) {
        return {
          ...c,
          status: resolution,
          resolutionNotes: `Action taken by Quality Lead: ${resolution}. Customer notified.`
        };
      }
      return c;
    });
    setComplaints(updated);
    onAuditLog?.('RESOLVE_COMPLAINT', ticketId, `Resolved complaint with outcome: ${resolution}`);
    alert(`Complaint #${ticketId} status updated to ${resolution}.`);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onAuditLog?.('UPDATE_SYSTEM_SETTINGS', 'global-config', `Updated discount to ${defaultDiscountPct}%, timeout to ${autoDispatchTimeout}s`);
    alert("Operational Settings saved successfully to master configuration!");
  };

  // Mock Notification Log
  const notificationLogs = [
    { id: 'notif-1', channel: 'WHATSAPP', recipient: '+91 98765 43210', template: 'BOOKING_CONFIRMATION', status: 'DELIVERED', time: '10 mins ago' },
    { id: 'notif-2', channel: 'SMS', recipient: '+91 94310 88291', template: 'PARTNER_DISPATCH_OFFER', status: 'DELIVERED', time: '15 mins ago' },
    { id: 'notif-3', channel: 'WHATSAPP', recipient: '+91 98350 11223', template: 'ARRIVAL_OTP_GENERATED', status: 'DELIVERED', time: '35 mins ago' },
    { id: 'notif-4', channel: 'PUSH', recipient: 'Technician App', template: 'NEW_JOB_AVAILABLE', status: 'SENT', time: '40 mins ago' }
  ];

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Modules 17-22 &bull; Governance &amp; Security
            </span>
            <span className="text-xs text-[#8E8E93]">11 RBAC Roles &bull; Immutable Audit &bull; SLAs</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Platform Governance, Security &amp; Compliance Center
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Granular access controls for 11 distinct administrative roles, immutable tamper-proof changelogs, 
            customer complaint rework SLAs, notification gateways, and system-wide operational policies.
          </p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { id: 'RBAC', label: `Roles & RBAC (${roles.length})`, icon: Key },
          { id: 'AUDIT_LOGS', label: `Immutable Audit Center (${auditLogs.length})`, icon: Database },
          { id: 'COMPLAINTS', label: `Reviews & Complaints (${complaints.length})`, icon: MessageSquare },
          { id: 'NOTIFICATIONS', label: 'Notification Gateway', icon: Bell },
          { id: 'BI_REPORTS', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'SETTINGS', label: 'Operational Settings', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F2F2F7] text-[#48484A] border border-[#E5E5EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 11 RBAC ROLES */}
      {activeTab === 'RBAC' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#1C1C1E]">
                11 Master Role Definitions &amp; Action-Level Permissions
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Strict segregation of duties across Super Admin, Dispatch, Finance, Quality, and Hub Managers.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              2FA ENFORCED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.role} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-[10px] font-bold text-[#1C1C1E]">
                      {r.role}
                    </span>
                    <h4 className="text-sm font-bold text-[#1C1C1E] mt-1">{r.title}</h4>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700">{r.userCount} Users</span>
                </div>

                <p className="text-xs text-[#8E8E93] leading-relaxed">{r.description}</p>

                <div>
                  <span className="text-[10px] font-bold text-[#48484A] uppercase block mb-1">
                    Granted Permissions:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((perm, pIdx) => (
                      <span key={pIdx} className="px-2 py-0.5 rounded bg-[#F2F2F7] text-[10px] font-mono text-[#1C1C1E]">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: IMMUTABLE AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#1C1C1E]">
                Immutable System Audit Trail &amp; Ledger
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Section 22 requirement: Every pricing change, dispatch override, hub modification, or financial remittance is permanently recorded.
              </p>
            </div>
            <span className="text-xs text-[#8E8E93] font-mono">{auditLogs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5EA] text-[#8E8E93] bg-[#F8F9FB]">
                  <th className="p-3.5 font-semibold">Action</th>
                  <th className="p-3.5 font-semibold">User &bull; Role</th>
                  <th className="p-3.5 font-semibold">Entity Target</th>
                  <th className="p-3.5 font-semibold">Details</th>
                  <th className="p-3.5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F7]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8F9FB]">
                    <td className="p-3.5 font-mono font-bold text-[#B8892E]">{log.action}</td>
                    <td className="p-3.5 font-medium text-[#1C1C1E]">
                      {log.actor} <span className="text-[#8E8E93] font-mono text-[10px]">({log.actorRole})</span>
                    </td>
                    <td className="p-3.5 font-mono text-indigo-700">{log.targetId}</td>
                    <td className="p-3.5 text-[#48484A] max-w-md truncate">{log.details}</td>
                    <td className="p-3.5 text-right font-mono text-[#8E8E93]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEWS & COMPLAINTS */}
      {activeTab === 'COMPLAINTS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#1C1C1E]">
                Customer Complaint Escalation &amp; 24-Hour Rework SLA Queue
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Guaranteed quality commitment: Any cleaning deficiency triggers immediate free technician revisit or refund.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              {complaints.filter(c => c.status === 'OPEN').length} Open Tickets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((ticket) => (
              <div key={ticket.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-[10px] font-bold text-[#1C1C1E]">
                      TICKET #{ticket.id} &bull; {ticket.bookingNumber}
                    </span>
                    <h4 className="text-sm font-bold text-[#1C1C1E] mt-1">{ticket.issueType}</h4>
                    <p className="text-xs text-[#8E8E93]">{ticket.customerName} ({ticket.customerPhone})</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ticket.status === 'OPEN'
                      ? 'bg-rose-100 text-rose-800'
                      : ticket.status === 'REWORK_SCHEDULED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-1">
                  <p className="text-[#1C1C1E] italic">"{ticket.resolutionNotes || 'Customer resolution pending'}"</p>
                  <div className="flex justify-between pt-1 border-t border-[#E5E5EA] text-[11px]">
                    <span className="text-[#8E8E93]">Assigned Hub:</span>
                    <span className="font-semibold text-indigo-700">{ticket.hubName}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8E8E93]">Serviced By:</span>
                    <span className="font-semibold text-[#1C1C1E]">{ticket.partnerName}</span>
                  </div>
                </div>

                {ticket.status === 'OPEN' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#F2F2F7]">
                    <button
                      onClick={() => handleResolveComplaint(ticket.id, 'REWORK_SCHEDULED')}
                      className="flex-1 py-2 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold"
                    >
                      Dispatch Free Rework
                    </button>
                    <button
                      onClick={() => handleResolveComplaint(ticket.id, 'REFUND_APPROVED')}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold"
                    >
                      Issue Refund
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS GATEWAY */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-[#1C1C1E]">
                Automated Transactional Notification Dispatcher
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Multi-channel communication logs across WhatsApp Business API, transactional SMS, and technician push alerts.
              </p>
            </div>
            <button
              onClick={() => alert("Simulation sent: WhatsApp booking OTP message dispatched to test number.")}
              className="px-3.5 py-2 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold"
            >
              Test Notification
            </button>
          </div>

          <div className="divide-y divide-[#F2F2F7]">
            {notificationLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-[10px] font-bold text-[#1C1C1E]">
                    {log.channel}
                  </span>
                  <div>
                    <span className="font-bold text-[#1C1C1E] block">{log.template}</span>
                    <span className="text-[#8E8E93]">{log.recipient} &bull; {log.time}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BI REPORTS */}
      {activeTab === 'BI_REPORTS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Gross Merchandise Value (GMV)</span>
            <h3 className="text-2xl font-black text-[#1C1C1E] font-['Outfit']">₹12,48,900</h3>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% this month
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Hub Capacity Utilization</span>
            <h3 className="text-2xl font-black text-indigo-700 font-['Outfit']">78.4%</h3>
            <span className="text-xs text-[#8E8E93]">Optimal operating range across 3 Patna Hubs</span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Customer Complaint Ratio</span>
            <h3 className="text-2xl font-black text-emerald-600 font-['Outfit']">0.68%</h3>
            <span className="text-xs text-emerald-700 font-semibold">Far below 1.5% SLA ceiling</span>
          </div>
        </div>
      )}

      {/* TAB 6: OPERATIONAL SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
            <div>
              <h4 className="text-base font-bold text-[#1C1C1E]">
                Master Marketplace Configuration &amp; Financial Parameters
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Control default customer discounts, statutory GST, platform fees, and auto-dispatch timeouts.
              </p>
            </div>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white font-bold text-xs"
            >
              Save Operational Config
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1C1C1E] mb-1">
                Default Customer Discount (%)
              </label>
              <input
                type="number"
                value={defaultDiscountPct}
                onChange={(e) => setDefaultDiscountPct(parseInt(e.target.value) || 15)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] font-mono text-[#1C1C1E] outline-none"
              />
              <span className="text-[10px] text-[#8E8E93] mt-1 block">Default transparent 15% discount benchmark</span>
            </div>

            <div>
              <label className="block font-semibold text-[#1C1C1E] mb-1">
                Dispatch Offer Timeout (Seconds)
              </label>
              <input
                type="number"
                value={autoDispatchTimeout}
                onChange={(e) => setAutoDispatchTimeout(parseInt(e.target.value) || 60)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] font-mono text-[#1C1C1E] outline-none"
              />
              <span className="text-[10px] text-[#8E8E93] mt-1 block">Roll forward to next ranked partner</span>
            </div>

            <div>
              <label className="block font-semibold text-[#1C1C1E] mb-1">
                Platform Convenience Fee (₹)
              </label>
              <input
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(parseInt(e.target.value) || 49)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] font-mono text-[#1C1C1E] outline-none"
              />
              <span className="text-[10px] text-[#8E8E93] mt-1 block">Added to final bill snapshot</span>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
