import React, { useState } from 'react';
import { CustomerUser, CMSPageContent, CouponRule, HubLocation } from '../../types';
import { INITIAL_CUSTOMERS, INITIAL_CMS_PAGES, INITIAL_COUPONS } from '../../data';
import { 
  Users, 
  Globe, 
  Tag, 
  Search, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Eye, 
  Send, 
  AlertCircle, 
  Sparkles,
  Layers,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Percent
} from 'lucide-react';

interface AdminCustomerAndCMSProps {
  hubs: HubLocation[];
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const AdminCustomerAndCMS: React.FC<AdminCustomerAndCMSProps> = ({
  hubs,
  onAuditLog
}) => {
  const [activeTab, setActiveTab] = useState<'CMS' | 'CUSTOMERS' | 'COUPONS'>('CMS');
  const [cmsPages, setCmsPages] = useState<CMSPageContent[]>(INITIAL_CMS_PAGES);
  const [customers, setCustomers] = useState<CustomerUser[]>(INITIAL_CUSTOMERS);
  const [coupons, setCoupons] = useState<CouponRule[]>(INITIAL_COUPONS);

  // CMS state
  const homePage = cmsPages[0] || {
    id: 'cms-home',
    slug: 'home-portal',
    title: 'Customer Home & Search Portal',
    heroHeadline: 'India’s Premier Cleaning Services, Executed by Certified Professionals.',
    heroSubheadline: 'Hospital-grade Diversey chemicals, German Kärcher machinery, 15% transparent pricing advantage.',
    announcementBanner: 'Now live across Patna, Gurugram, Delhi NCR, and Noida with 60-minute express booking!',
    seoTitle: 'Bharat Pro Expert | Professional Home Cleaning',
    seoDescription: 'Verified home cleaning services',
    status: 'PUBLISHED' as const,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Admin'
  };

  const [heroTitle, setHeroTitle] = useState(homePage.heroHeadline || '');
  const [heroSubtitle, setHeroSubtitle] = useState(homePage.heroSubheadline || '');
  const [announcement, setAnnouncement] = useState(homePage.announcementBanner || '');
  const [cmsStatus, setCmsStatus] = useState(homePage.status || 'PUBLISHED');

  // Customer search
  const [custSearch, setCustSearch] = useState('');
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch) ||
    c.email.toLowerCase().includes(custSearch.toLowerCase())
  );

  // Handle Save CMS
  const handleSaveCMS = (newStatus: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED') => {
    const updated = cmsPages.map(p => {
      if (p.id === homePage.id || p.slug === homePage.slug) {
        return {
          ...p,
          heroHeadline: heroTitle,
          heroSubheadline: heroSubtitle,
          announcementBanner: announcement,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });

    setCmsPages(updated);
    setCmsStatus(newStatus);
    onAuditLog?.('UPDATE_CMS', 'homepage', `Updated homepage CMS content to status: ${newStatus}`);
    alert(`Website CMS Homepage successfully saved as ${newStatus}!`);
  };

  // Handle Toggle Coupon
  const handleToggleCoupon = (couponId: string) => {
    const updated = coupons.map(c => {
      if (c.id === couponId) {
        return { ...c, active: !c.active };
      }
      return c;
    });
    setCoupons(updated);
    onAuditLog?.('TOGGLE_COUPON', couponId, `Toggled coupon active state`);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 13, 14, 16 &bull; CRM, CMS &amp; Offers
            </span>
            <span className="text-xs text-[#8E8E93]">Content Governance &amp; Customer Growth</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Website CMS, Customer CRM &amp; Promotional Engine
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Govern public website text through Draft &rarr; Review &rarr; Published approval gates. 
            View customer directories with lifetime value, and manage geo-restricted promotional vouchers.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { id: 'CMS', label: 'Website CMS & Content Governance', icon: Globe },
          { id: 'CUSTOMERS', label: `Customer CRM (${customers.length} Profiles)`, icon: Users },
          { id: 'COUPONS', label: `Coupons & Offers (${coupons.length} Active)`, icon: Tag }
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

      {/* TAB 1: WEBSITE CMS */}
      {activeTab === 'CMS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5EA] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#1C1C1E]">
                  Homepage Banner &amp; Announcements (CMS Editor)
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  cmsStatus === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : cmsStatus === 'APPROVED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {cmsStatus}
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Multi-stage workflow: Draft &rarr; In Review &rarr; Approved &rarr; Published.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveCMS('DRAFT')}
                className="px-3.5 py-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSaveCMS('PUBLISHED')}
                className="px-4 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5 text-[#D4A24E]" />
                <span>Publish Live to Website</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1C1C1E] mb-1">
                Website Hero Display Headline
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] focus:border-[#B8892E] font-semibold text-[#1C1C1E] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1C1C1E] mb-1">
                Hero Supporting Subtitle &amp; Value Proposition
              </label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] focus:border-[#B8892E] text-[#48484A] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1C1C1E] mb-1">
                Top Announcement Marquee Banner (City &amp; Launch Alerts)
              </label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] focus:border-[#B8892E] text-[#1C1C1E] outline-none"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-2">
            <span className="text-[10px] font-mono text-[#D4A24E] uppercase font-bold">
              Live Customer Website Preview
            </span>
            <div className="p-2 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold">
              📢 {announcement}
            </div>
            <h2 className="text-lg font-black font-['Outfit'] mt-2">{heroTitle}</h2>
            <p className="text-xs text-neutral-400">{heroSubtitle}</p>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER CRM */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                placeholder="Search customer name, phone, email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
              />
            </div>
            <span className="text-xs text-[#8E8E93]">
              {filteredCustomers.length} Registered Customer Accounts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.map((cust) => (
              <div key={cust.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1C1E]">{cust.name}</h4>
                    <p className="text-xs text-[#8E8E93] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {cust.phone} &bull; {cust.email}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs">
                  <div>
                    <span className="text-[10px] text-[#8E8E93] block">Lifetime Bookings</span>
                    <span className="font-bold text-[#1C1C1E] block mt-0.5">{cust.totalBookings} Completed</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8E8E93] block">Lifetime Spend</span>
                    <span className="font-black text-[#1F8A3B] block mt-0.5">
                      ₹{cust.totalSpend.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8E8E93] block">Wallet Balance</span>
                    <span className="font-bold text-[#B8892E] block mt-0.5">₹{cust.walletBalance}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#8E8E93] font-bold uppercase block mb-1">
                    Saved Addresses ({cust.savedAddresses?.length || 0}):
                  </span>
                  <div className="space-y-1">
                    {cust.savedAddresses?.map((addr: any, aIdx: number) => (
                      <div key={aIdx} className="text-xs text-[#48484A] flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#B8892E] shrink-0" />
                        <span className="font-bold">{addr.label || addr.tag || 'Address'}:</span>
                        <span className="truncate">{addr.houseNumber || addr.address || ''}, {addr.sector || ''} {addr.city || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS & OFFERS */}
      {activeTab === 'COUPONS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#1C1C1E]">
                Active Discount Codes &amp; Promotional Campaign Vouchers
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Supports fixed rupee discounts or percentage caps with category/hub restrictions.
              </p>
            </div>
            <button
              onClick={() => {
                const code = window.prompt("Enter Coupon Code (e.g. PATNA200):");
                if (!code) return;
                const newCoupon: CouponRule = {
                  id: `cpn-${Date.now()}`,
                  code: code.toUpperCase(),
                  description: 'Special Launch Discount',
                  discountType: 'FLAT',
                  discountValue: 200,
                  minOrderAmount: 999,
                  maxDiscountAmount: 200,
                  applicableCategoryIds: ['all'],
                  applicableHubIds: ['all'],
                  validTill: '2026-12-31',
                  maxUses: 1000,
                  usedCount: 0,
                  active: true
                };
                setCoupons([newCoupon, ...coupons]);
                alert(`Coupon ${code.toUpperCase()} activated!`);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A24E]" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((cpn) => (
              <div key={cpn.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#D4A24E]/10 text-[#B8892E] font-mono font-black text-sm border border-[#D4A24E]/30">
                      {cpn.code}
                    </span>
                    <span className="text-xs text-[#8E8E93]">{cpn.description}</span>
                  </div>

                  <button
                    onClick={() => handleToggleCoupon(cpn.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cpn.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {cpn.active ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Discount Value:</span>
                    <span className="font-bold text-[#1C1C1E]">
                      {cpn.discountType === 'PERCENT' ? `${cpn.discountValue}% OFF` : `₹${cpn.discountValue} FLAT OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Minimum Order:</span>
                    <span className="font-mono text-[#1C1C1E]">₹{cpn.minOrderAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Total Redemptions:</span>
                    <span className="font-bold text-indigo-700">{cpn.usedCount} times redeemed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
