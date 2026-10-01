import React, { useEffect, useState } from 'react';
import type { AdminModuleTab } from '../AdminDashboard';

export interface AdminSidebarCounts {
  bookings: number;
  unassigned: number;
  pendingPartners: number;
}

// Header title + subtitle for every screen
export const ADMIN_TAB_META: Record<AdminModuleTab, { title: string; subtitle: string }> = {
  OVERVIEW: { title: 'Executive Dashboard', subtitle: 'One command center • live operational state • drill-down' },
  LIVE_OPS: { title: 'Live Operations', subtitle: 'Real-time bookings, status changes and exceptions' },
  BOOKINGS: { title: 'Bookings', subtitle: 'Every booking with price snapshot, status and assignment' },
  DISPATCH: { title: 'Auto Dispatch', subtitle: 'Route jobs to the correct hub and eligible partner' },
  HUBS: { title: 'Hubs & India Map', subtitle: 'Hub coverage, capacity and map view' },
  HUB_MAP: { title: 'Hubs & India Map', subtitle: 'Hub coverage, capacity and map view' },
  PARTNERS: { title: 'Partner Management', subtitle: 'Onboarding • approval • documents • availability • performance' },
  CATALOGUE: { title: 'Master Catalogue', subtitle: 'Services, categories, images and pricing' },
  PRICING: { title: 'Pricing Engine', subtitle: 'Reference pricing and commission rules' },
  COUPONS: { title: 'Coupons & Offers', subtitle: 'Coupons, campaigns and bumper offers' },
  QUALITY: { title: 'Quality / SOP / Training', subtitle: 'SOP, training and quality checks' },
  INVENTORY: { title: 'Inventory / Cleaning Kits', subtitle: 'Kits, supplies and stock' },
  CUSTOMERS: { title: 'Customers', subtitle: 'Customers • ledger • booking history • reviews • complaints' },
  FINANCE: { title: 'Finance', subtitle: 'Revenue • transactions • settlements • payouts • refunds' },
  CMS: { title: 'CMS / Pages', subtitle: 'Website pages, banners, media and SEO' },
  GOVERNANCE: { title: 'Governance & System', subtitle: 'Employees • RBAC • audit • security • reports • backups' },
  AI_DEVELOPER: { title: 'AI Developer', subtitle: 'Your in-panel developer: command → understand → inspect → build → verify' },
  AUTOMATION: { title: 'Automation Agent', subtitle: 'Rules • queue • actions • exceptions • reports' },
  AI_QUEUE: { title: 'AI Task Queue', subtitle: 'Every AI task with status and history' }
};

type Item = {
  id: string;
  label: string;
  tab: AdminModuleTab;          // screen opened on click
  also?: AdminModuleTab[];      // other tabs that keep this item highlighted
  badge?: 'unassigned' | 'pending';
};

const GROUPS: { title: string | null; items: Item[] }[] = [
  {
    title: null,
    items: [
      { id: 'dashboard', label: 'Dashboard', tab: 'OVERVIEW' },
      { id: 'live', label: 'Live Operations', tab: 'LIVE_OPS' }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { id: 'bookings', label: 'Bookings', tab: 'BOOKINGS' },
      { id: 'dispatch', label: 'Auto Dispatch', tab: 'DISPATCH', badge: 'unassigned' },
      { id: 'hubs', label: 'Hubs & India Map', tab: 'HUBS', also: ['HUB_MAP'] }
    ]
  },
  {
    title: 'PARTNERS',
    items: [
      { id: 'partner-mgmt', label: 'Partner Management', tab: 'PARTNERS' },
      { id: 'partner-approval', label: 'Partner Approval', tab: 'PARTNERS', badge: 'pending' }
    ]
  },
  {
    title: 'SERVICES',
    items: [
      { id: 'catalogue', label: 'Master Catalogue', tab: 'CATALOGUE' },
      { id: 'pricing', label: 'Pricing Engine', tab: 'PRICING' },
      { id: 'coupons', label: 'Coupons & Offers', tab: 'COUPONS' }
    ]
  },
  {
    title: 'QUALITY',
    items: [
      { id: 'quality', label: 'Quality / SOP / Training', tab: 'QUALITY' },
      { id: 'inventory', label: 'Inventory / Cleaning Kits', tab: 'INVENTORY' }
    ]
  },
  {
    title: 'CRM',
    items: [
      { id: 'customers', label: 'Customers', tab: 'CUSTOMERS' },
      { id: 'reviews', label: 'Reviews / Complaints', tab: 'CUSTOMERS' }
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { id: 'revenue', label: 'Revenue / Transactions', tab: 'FINANCE' },
      { id: 'settlements', label: 'Settlements / Payouts', tab: 'FINANCE' },
      { id: 'refunds', label: 'Refunds', tab: 'FINANCE' }
    ]
  },
  {
    title: 'WEBSITE',
    items: [
      { id: 'cms', label: 'CMS / Pages', tab: 'CMS' },
      { id: 'media', label: 'Media / SEO', tab: 'CMS' }
    ]
  },
  {
    title: 'GOVERNANCE',
    items: [
      { id: 'rbac', label: 'Employees / RBAC', tab: 'GOVERNANCE' },
      { id: 'audit', label: 'Audit / Security', tab: 'GOVERNANCE' },
      { id: 'reports', label: 'Reports / Notifications', tab: 'GOVERNANCE' }
    ]
  },
  {
    title: 'AI & AUTOMATION',
    items: [
      { id: 'ai-dev', label: 'AI Developer', tab: 'AI_DEVELOPER' },
      { id: 'automation', label: 'Automation Agent', tab: 'AUTOMATION' },
      { id: 'ai-queue', label: 'AI Task Queue', tab: 'AI_QUEUE' }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings / Integrations', tab: 'GOVERNANCE' },
      { id: 'backups', label: 'Backups / Health', tab: 'GOVERNANCE' }
    ]
  }
];

const ALL_ITEMS = GROUPS.flatMap(g => g.items);
const matches = (item: Item, tab: AdminModuleTab) => item.tab === tab || (item.also || []).includes(tab);

interface AdminSidebarProps {
  activeTab: AdminModuleTab;
  onChange: (tab: AdminModuleTab) => void;
  counts: AdminSidebarCounts;
  open: boolean;          // mobile drawer
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onChange, counts, open, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>(
    (ALL_ITEMS.find(i => matches(i, activeTab)) || ALL_ITEMS[0]).id
  );

  // Keep highlight in sync when another part of the app switches the tab
  useEffect(() => {
    const current = ALL_ITEMS.find(i => i.id === selectedId);
    if (!current || !matches(current, activeTab)) {
      const first = ALL_ITEMS.find(i => matches(i, activeTab));
      if (first) setSelectedId(first.id);
    }
  }, [activeTab]);

  const badgeValue = (b?: 'unassigned' | 'pending') => {
    if (b === 'unassigned') return counts.unassigned;
    if (b === 'pending') return counts.pendingPartners;
    return 0;
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B1220] text-slate-300 flex flex-col overflow-y-auto transform transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-blue-900/40">
            BP
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-white tracking-wide leading-tight">BHARAT PRO EXPERT</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Admin Command Center</p>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-6 space-y-1">
          {GROUPS.map((group, gi) => (
            <div key={gi} className="pt-2">
              {group.title && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.14em] text-slate-500">
                  {group.title}
                </p>
              )}
              {group.items.map(item => {
                const isActive = selectedId === item.id;
                const n = badgeValue(item.badge);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      onChange(item.tab);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-md'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {n > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shrink-0">
                        {n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;