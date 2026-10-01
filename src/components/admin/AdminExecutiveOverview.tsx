import React from 'react';
import { Booking, Partner } from '../../types';
import type { AdminModuleTab } from '../AdminDashboard';
import {
  getAgentStatus,
  getAutomationRules,
  getAutomationRuns
} from '../../services/automationAgentService';

interface AdminExecutiveOverviewProps {
  bookings: Booking[];
  partners: Partner[];
  unassignedCount: number;
  pendingPartnersCount: number;
  onNavigate: (tab: AdminModuleTab) => void;
}

const ACTIVE_STATUSES = [
  'ASSIGNED', 'PARTNER_ASSIGNED', 'PARTNER_ACCEPTED', 'ACCEPTED',
  'PARTNER_ON_THE_WAY', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'IN_PROGRESS'
];
const ACCEPTED_STATUSES = ['PARTNER_ACCEPTED', 'ACCEPTED'];
const CANCELLED_STATUSES = ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PARTNER', 'CANCELLED_BY_ADMIN'];

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export const AdminExecutiveOverview: React.FC<AdminExecutiveOverviewProps> = ({
  bookings,
  partners,
  unassignedCount,
  pendingPartnersCount,
  onNavigate
}) => {
  const todayStr = new Date().toDateString();
  const todaysBookings = bookings.filter(b => new Date(b.createdAt || b.date).toDateString() === todayStr).length;
  const activeJobs = bookings.filter(b => ACTIVE_STATUSES.includes(b.status as string)).length;
  const revenue = bookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Automation data (read from the app's automation service)
  const agent = getAgentStatus();
  const rules = getAutomationRules();
  const runs = getAutomationRuns();
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const automationActions24h = runs.filter(r => new Date(r.startedAt).getTime() >= dayAgo).length;

  const kpis: { label: string; value: string; bar: string; tab: AdminModuleTab }[] = [
    { label: "Today's Bookings", value: String(todaysBookings), bar: 'bg-[#2563EB]', tab: 'BOOKINGS' },
    { label: 'Active Jobs', value: String(activeJobs), bar: 'bg-[#10B981]', tab: 'LIVE_OPS' },
    { label: 'Unassigned', value: String(unassignedCount), bar: 'bg-[#EF4444]', tab: 'DISPATCH' },
    { label: 'Revenue', value: inr(revenue), bar: 'bg-[#7C3AED]', tab: 'FINANCE' },
    { label: 'Partner Approvals', value: String(pendingPartnersCount), bar: 'bg-[#F59E0B]', tab: 'PARTNERS' },
    { label: 'Automation Actions (24h)', value: String(automationActions24h), bar: 'bg-[#0D9488]', tab: 'AUTOMATION' }
  ];

  const liveRows: { label: string; count: number; dot: string; tab: AdminModuleTab }[] = [
    { label: 'New booking received (awaiting assignment)', count: unassignedCount, dot: 'bg-[#2563EB]', tab: 'DISPATCH' },
    { label: 'Partner accepted job', count: bookings.filter(b => ACCEPTED_STATUSES.includes(b.status as string)).length, dot: 'bg-[#10B981]', tab: 'LIVE_OPS' },
    { label: 'Cancellation detected', count: bookings.filter(b => CANCELLED_STATUSES.includes(b.status as string)).length, dot: 'bg-[#EF4444]', tab: 'BOOKINGS' },
    { label: 'Automation reassignment', count: runs.filter(r => r.eventType === 'booking.reassigned').length, dot: 'bg-[#7C3AED]', tab: 'AUTOMATION' },
    { label: 'Payment confirmed', count: bookings.filter(b => b.paymentStatus === 'PAID').length, dot: 'bg-[#0D9488]', tab: 'FINANCE' }
  ];

  const ruleEnabled = (id: string) => {
    const r = rules.find(x => x.id === id);
    return r ? r.enabled : false;
  };
  const agentRows: { label: string; enabled: boolean }[] = [
    { label: 'Booking routing', enabled: ruleEnabled('rule-new-booking') },
    { label: 'Cancellation recovery', enabled: ruleEnabled('rule-cancellation-recovery') },
    { label: 'Partner reassignment', enabled: ruleEnabled('rule-partner-reassignment') },
    { label: 'Hub coverage checks', enabled: ruleEnabled('rule-hub-coverage') },
    { label: 'Offline work reporting', enabled: ruleEnabled('rule-offline-reporting') }
  ];

  const infoCards: { n: string; color: string; title: string; text: string }[] = [
    { n: '1', color: 'bg-[#2563EB]', title: 'KPI tap', text: 'Opens the exact live records behind the number. No fake counters.' },
    { n: '2', color: 'bg-[#10B981]', title: 'Live operations', text: 'Shows real-time events, status changes and exceptions.' },
    { n: '3', color: 'bg-[#7C3AED]', title: 'Automation report', text: 'Shows what the Automation Agent did while you were logged out or unavailable.' }
  ];

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(k => (
          <button
            key={k.label}
            onClick={() => onNavigate(k.tab)}
            className="text-left rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className={`h-1.5 ${k.bar}`} />
            <div className="p-4">
              <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 leading-none">{k.value}</p>
              <p className="mt-2 text-[10px] font-bold tracking-wider text-emerald-600">LIVE</p>
            </div>
          </button>
        ))}
      </div>

      {/* Live operations + Automation status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-extrabold tracking-wider text-slate-900">LIVE OPERATIONS</h3>
          <div className="mt-4 divide-y divide-slate-100">
            {liveRows.map(row => (
              <div key={row.label} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.dot}`} />
                  <span className="text-[12px] text-slate-700 truncate">{row.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px] font-bold text-slate-900">{row.count}</span>
                  <button
                    onClick={() => onNavigate(row.tab)}
                    className="text-[10px] font-extrabold tracking-wider text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    OPEN
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-extrabold tracking-wider text-slate-900">AUTOMATION AGENT STATUS</h3>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span
              className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold text-white ${
                agent.isOnline ? 'bg-[#10B981]' : 'bg-slate-500'
              }`}
            >
              {agent.isOnline ? 'ONLINE' : 'PAUSED'}
            </span>
            <span className="text-[11px] text-slate-500">
              Runs inside this app (browser storage). Real 24x7 server worker is not connected yet.
            </span>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {agentRows.map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5">
                <span className="text-[12px] text-slate-700">{row.label}</span>
                <span
                  className={`px-4 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-white ${
                    row.enabled ? 'bg-[#2563EB]' : 'bg-slate-400'
                  }`}
                >
                  {row.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {infoCards.map(c => (
          <div key={c.n} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-extrabold ${c.color}`}>
                {c.n}
              </span>
              <p className="text-[13px] font-extrabold text-slate-900">{c.title}</p>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminExecutiveOverview;