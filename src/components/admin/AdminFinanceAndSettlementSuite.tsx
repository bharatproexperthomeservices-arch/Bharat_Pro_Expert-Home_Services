import React, { useState, useEffect } from 'react';
import { 
  Booking, 
  Partner, 
  Settlement, 
  SettlementConfiguration, 
  CustomerInvoice,
  FinancialAuditLog,
  DisputeRecord 
} from '../../types';
import { 
  getSettlementConfig, 
  updateSettlementConfig, 
  getAllSettlements, 
  createOrGetSettlement,
  processSettlementPayout,
  markSettlementManualPaid,
  getCompanyLedger,
  getAllFinancialAudits,
  getAllDisputes,
  resolveDispute,
  generateCustomerInvoice,
  getPartnerBankAccount,
  getPartnerKYC
} from '../../services/settlementService';
import { 
  Receipt, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Sliders, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  ArrowUpRight, 
  FileText, 
  Eye, 
  Lock, 
  AlertTriangle,
  Building,
  Check,
  X
} from 'lucide-react';

interface AdminFinanceAndSettlementSuiteProps {
  bookings: Booking[];
  partners: Partner[];
  onAuditLog?: (module: string, action: string, details: string) => void;
}

export const AdminFinanceAndSettlementSuite: React.FC<AdminFinanceAndSettlementSuiteProps> = ({
  bookings,
  partners,
  onAuditLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'SETTLEMENTS' | 'SETTINGS' | 'LEDGER' | 'DISPUTES' | 'AUDIT'>('SETTLEMENTS');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [config, setConfig] = useState<SettlementConfiguration | null>(null);
  const [companyLedger, setCompanyLedger] = useState<any[]>([]);
  const [audits, setAudits] = useState<FinancialAuditLog[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Manual UTR Modal
  const [selectedSettlementForManual, setSelectedSettlementForManual] = useState<Settlement | null>(null);
  const [manualUtrInput, setManualUtrInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);

  // Settings form state
  const [gstRatePct, setGstRatePct] = useState(5);
  const [gstMode, setGstMode] = useState<'INCLUSIVE' | 'EXCLUSIVE'>('INCLUSIVE');
  const [commissionPct, setCommissionPct] = useState(15);
  const [commissionBase, setCommissionBase] = useState<'GROSS' | 'NET_BEFORE_TAX'>('GROSS');
  const [platformFee, setPlatformFee] = useState(10);
  const [holdHours, setHoldHours] = useState(24);
  const [minPayout, setMinPayout] = useState(100);
  const [payoutEnabled, setPayoutEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load settlements and financial state
  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const [cfg, setts, cLedger, faudits, disps] = await Promise.all([
        getSettlementConfig(),
        getAllSettlements(),
        getCompanyLedger(),
        getAllFinancialAudits(),
        getAllDisputes()
      ]);

      setConfig(cfg);
      setGstRatePct(Math.round(cfg.gstRate * 100));
      setGstMode(cfg.gstMode);
      setCommissionPct(Math.round(cfg.commissionRate * 100));
      setCommissionBase(cfg.commissionBase);
      setPlatformFee(cfg.platformFeeAmount);
      setHoldHours(cfg.settlementHoldPeriodHours);
      setMinPayout(cfg.minimumPayoutAmount);
      setPayoutEnabled(cfg.payoutEnabled);

      setCompanyLedger(cLedger);
      setAudits(faudits);
      setDisputes(disps);

      // Auto-evaluate completed bookings into settlements
      const updatedList = [...setts];
      for (const b of bookings.filter(b => b.status === 'COMPLETED')) {
        const partner = partners.find(p => p.id === (b.completedByPartnerId || b.assignedPartnerId)) || null;
        if (partner && !updatedList.some(s => s.bookingId === b.id)) {
          const bank = await getPartnerBankAccount(partner.id);
          const kyc = await getPartnerKYC(partner.id);
          const newSett = await createOrGetSettlement(b, partner, bank, kyc, disps);
          updatedList.unshift(newSett);
        }
      }

      setSettlements(updatedList);
    } catch (e) {
      console.warn('Error loading financial suite data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [bookings.length]);

  // Aggregate Key Financial Metrics
  const totalCustomerCollections = bookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const totalGrossCompleted = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // Total GST Collected (5% default)
  const totalGstCollected = settlements.reduce((sum, s) => sum + s.taxAmount, 0);
  const totalCommissionEarned = settlements.reduce((sum, s) => sum + s.companyCommission, 0);
  const totalPlatformFees = settlements.reduce((sum, s) => sum + s.platformFee, 0);
  const totalPartnerPayable = settlements.reduce((sum, s) => sum + s.partnerPayableAmount, 0);
  const totalPaidOut = settlements.filter(s => s.status === 'SUCCESS').reduce((sum, s) => sum + s.partnerPayableAmount, 0);
  const pendingSettlementAmount = settlements.filter(s => s.status !== 'SUCCESS').reduce((sum, s) => sum + s.partnerPayableAmount, 0);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await updateSettlementConfig({
        gstRate: gstRatePct / 100,
        gstMode,
        commissionRate: commissionPct / 100,
        commissionBase,
        platformFeeAmount: platformFee,
        settlementHoldPeriodHours: holdHours,
        minimumPayoutAmount: minPayout,
        payoutEnabled
      });
      setConfig(updated);
      setActionSuccess('Settlement Configuration updated and financial audit entry created.');
      onAuditLog?.('FINANCE', 'UPDATE_SETTINGS', `Updated GST to ${gstRatePct}%, Commission to ${commissionPct}%, Platform fee to ₹${platformFee}`);
      loadFinancialData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Automated Payout Trigger
  const handleTriggerPayout = async (settlementId: string) => {
    setActionError(null);
    setActionSuccess(null);
    const res = await processSettlementPayout(settlementId);
    if (!res.success) {
      setActionError(res.error || 'Payout rejected');
    } else {
      setActionSuccess(`Settlement ${settlementId} paid out! Ref: ${res.settlement?.payoutReference}`);
    }
    loadFinancialData();
  };

  // Handle Manual Bank Transfer Confirmation
  const handleManualPaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlementForManual) return;
    setActionError(null);
    setActionSuccess(null);

    const res = await markSettlementManualPaid(selectedSettlementForManual.id, manualUtrInput);
    if (!res.success) {
      setActionError(res.error || 'Verification failed');
    } else {
      setActionSuccess(`Settlement ${selectedSettlementForManual.id} successfully verified with UTR ${manualUtrInput}`);
      setSelectedSettlementForManual(null);
      setManualUtrInput('');
      loadFinancialData();
    }
  };

  // Filtered settlements
  const filteredSettlements = settlements.filter(s => {
    const matchesSearch = !searchQuery || 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.partnerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#062A49] text-white text-[10px] font-bold tracking-wider uppercase">
              Financial Engine
            </span>
            <span className="text-xs text-[#8E8E93]">GST (5%), Commission (15%) &amp; Partner Settlement Engine</span>
          </div>
          <h3 className="text-xl font-bold font-['Outfit'] text-[#1C1C1E] mt-1">
            Settlement Calculation &amp; Partner Ledgers
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFinancialData}
            className="p-2.5 rounded-2xl bg-white border border-[#E5E5EA] hover:bg-[#F2F2F7] text-[#1C1C1E] flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Engine</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-amber-800 font-bold hover:underline shrink-0">Dismiss</button>
        </div>
      )}

      {/* Key Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
          <span className="text-xs text-[#8E8E93] font-medium">Customer Collections (PAID)</span>
          <p className="text-2xl font-black text-[#1C1C1E]">₹{totalCustomerCollections.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-emerald-700 font-semibold block">Verified Gateway Receipts</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
          <span className="text-xs text-[#8E8E93] font-medium">GST Collected (5%)</span>
          <p className="text-2xl font-black text-amber-600">₹{totalGstCollected.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-[#8E8E93] block">Tax Component (Mode: {config?.gstMode || 'INCLUSIVE'})</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
          <span className="text-xs text-[#8E8E93] font-medium">Company Revenue (15% + Fee)</span>
          <p className="text-2xl font-black text-[#062A49]">
            ₹{(totalCommissionEarned + totalPlatformFees).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-[#8E8E93] block">Commission: ₹{totalCommissionEarned} | Platform: ₹{totalPlatformFees}</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
          <span className="text-xs text-[#8E8E93] font-medium">Partner Payouts Executed</span>
          <p className="text-2xl font-black text-emerald-700">₹{totalPaidOut.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-[#8E8E93] block">Pending Payouts: ₹{pendingSettlementAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E5EA] pb-2">
        {[
          { key: 'SETTLEMENTS', label: 'Partner Settlements', count: settlements.length },
          { key: 'SETTINGS', label: 'Settlement Settings & Rates' },
          { key: 'LEDGER', label: 'Company Ledger Entries' },
          { key: 'DISPUTES', label: 'Disputes & Holds', count: disputes.filter(d => d.status === 'DISPUTE_OPEN').length },
          { key: 'AUDIT', label: 'Financial Audit Logs', count: audits.length }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === t.key
                ? 'bg-[#062A49] text-white shadow-sm'
                : 'bg-white border border-[#E5E5EA] text-[#48484A] hover:bg-[#F2F2F7]'
            }`}
          >
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-300 text-amber-950 text-[10px]">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ==================== SUB-TAB 1: SETTLEMENTS PIPELINE ==================== */}
      {activeSubTab === 'SETTLEMENTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Settlement ID, Partner, Booking..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E5E5EA] text-xs focus:outline-none focus:border-[#062A49]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[#8E8E93]" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved (Ready for Payout)</option>
                <option value="SUCCESS">Settled (Paid Out)</option>
                <option value="PAYOUT_ON_HOLD">On Hold</option>
                <option value="PAYOUT_FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5EA] text-[#8E8E93] bg-[#F8F9FB]">
                    <th className="p-3.5 font-bold">Settlement ID</th>
                    <th className="p-3.5 font-bold">Booking #</th>
                    <th className="p-3.5 font-bold">Partner</th>
                    <th className="p-3.5 font-bold text-right">Customer Paid</th>
                    <th className="p-3.5 font-bold text-right">5% GST</th>
                    <th className="p-3.5 font-bold text-right">15% Comm.</th>
                    <th className="p-3.5 font-bold text-right">Platform Fee</th>
                    <th className="p-3.5 font-bold text-right">Partner Payable</th>
                    <th className="p-3.5 font-bold text-center">Status</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7]">
                  {filteredSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[#8E8E93]">
                        No settlements found. Completed jobs automatically generate audited settlement records here.
                      </td>
                    </tr>
                  ) : (
                    filteredSettlements.map(s => {
                      const associatedBooking = bookings.find(b => b.id === s.bookingId);
                      return (
                        <tr key={s.id} className="hover:bg-[#F8F9FB] transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#062A49]">{s.id}</td>
                          <td className="p-3.5 font-mono font-semibold text-[#1C1C1E]">#{s.bookingNumber}</td>
                          <td className="p-3.5 font-medium text-[#1C1C1E]">
                            <span className="block font-bold">{s.partnerName}</span>
                            <span className="text-[10px] text-[#8E8E93] font-mono">ID: {s.partnerId}</span>
                          </td>
                          <td className="p-3.5 text-right font-black text-[#1C1C1E]">₹{s.customerPaidAmount}</td>
                          <td className="p-3.5 text-right font-semibold text-amber-700">−₹{s.taxAmount}</td>
                          <td className="p-3.5 text-right font-semibold text-[#062A49]">−₹{s.companyCommission}</td>
                          <td className="p-3.5 text-right font-semibold text-[#8E8E93]">−₹{s.platformFee}</td>
                          <td className="p-3.5 text-right font-black text-emerald-700 text-sm">₹{s.partnerPayableAmount}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              s.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'APPROVED'
                                ? 'bg-blue-100 text-blue-800'
                                : s.status === 'PAYOUT_ON_HOLD'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}>
                              {s.status === 'SUCCESS' ? '✓ SETTLED' : s.status}
                            </span>
                            {s.payoutReference && (
                              <span className="block text-[9px] font-mono text-gray-500 mt-0.5">
                                Ref: {s.payoutReference}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            {s.status !== 'SUCCESS' && (
                              <>
                                <button
                                  onClick={() => handleTriggerPayout(s.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#062A49] text-white font-bold text-[11px] hover:bg-opacity-90 cursor-pointer"
                                  title="Attempt Gateway Payout"
                                >
                                  Pay Gateway
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSettlementForManual(s);
                                    setManualUtrInput('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 cursor-pointer"
                                  title="Mark Manual Bank UTR Transfer"
                                >
                                  Bank UTR
                                </button>
                              </>
                            )}

                            {associatedBooking && (
                              <button
                                onClick={() => setSelectedInvoice(generateCustomerInvoice(associatedBooking, config || undefined))}
                                className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5EA] text-[#1C1C1E] font-bold text-[11px] hover:bg-[#F2F2F7] cursor-pointer"
                                title="View Customer GST Invoice"
                              >
                                Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: SETTLEMENT SETTINGS ==================== */}
      {activeSubTab === 'SETTINGS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 shadow-sm space-y-6 max-w-4xl">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5EA]">
            <Sliders className="w-5 h-5 text-[#062A49]" />
            <div>
              <h4 className="font-bold text-base text-[#1C1C1E]">Authoritative Settlement Configuration</h4>
              <p className="text-xs text-[#8E8E93]">Changes are audit-logged and dynamically govern all future settlements without rebuilding code.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                  GST Rate Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={gstRatePct}
                  onChange={e => setGstRatePct(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E]"
                  required
                />
                <span className="text-[11px] text-[#8E8E93] mt-0.5 block">Standard Indian Home Services GST: 5%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                  GST Mode
                </label>
                <select
                  value={gstMode}
                  onChange={e => setGstMode(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E]"
                >
                  <option value="INCLUSIVE">INCLUSIVE (Tax included in customer shown price)</option>
                  <option value="EXCLUSIVE">EXCLUSIVE (Tax added on top of base price)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                  Company Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={commissionPct}
                  onChange={e => setCommissionPct(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E]"
                  required
                />
                <span className="text-[11px] text-[#8E8E93] mt-0.5 block">Default Bharat Pro Commission: 15%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                  Commission Base
                </label>
                <select
                  value={commissionBase}
                  onChange={e => setCommissionBase(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E]"
                >
                  <option value="GROSS">GROSS (Calculated on full customer payment)</option>
                  <option value="NET_BEFORE_TAX">NET_BEFORE_TAX (Calculated after subtracting GST)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                  Platform Safety &amp; Tech Fee (₹)
                </label>
                <input
                  type="number"
                  value={platformFee}
                  onChange={e => setPlatformFee(parseInt(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E]"
                  required
                />
                <span className="text-[11px] text-[#8E8E93] mt-0.5 block">Standard: ₹10 per eligible completed booking</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                  Settlement Hold Window (Hours)
                </label>
                <input
                  type="number"
                  value={holdHours}
                  onChange={e => setHoldHours(parseInt(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E]"
                  required
                />
                <span className="text-[11px] text-[#8E8E93] mt-0.5 block">Window for customer dispute reporting before auto-payout</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#E5E5EA]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payoutEnabled}
                  onChange={e => setPayoutEnabled(e.target.checked)}
                  className="rounded text-[#062A49] focus:ring-[#062A49]"
                />
                <span className="text-xs font-bold text-[#1C1C1E]">Enable Automated Partner Settlement Dispatches</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-[#062A49] text-white font-bold text-xs hover:bg-opacity-90 cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingSettings ? 'Saving & Auditing...' : 'Save Settlement Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== SUB-TAB 3: COMPANY LEDGER ==================== */}
      {activeSubTab === 'LEDGER' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#1C1C1E]">Audited Company Double-Entry Ledger</h4>
            <span className="text-xs text-[#8E8E93]">Immutable Financial Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5EA] text-[#8E8E93] bg-[#F8F9FB]">
                  <th className="p-3 font-semibold">Entry ID</th>
                  <th className="p-3 font-semibold">Booking #</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Description</th>
                  <th className="p-3 font-semibold text-right">Amount</th>
                  <th className="p-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F7]">
                {companyLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[#8E8E93]">
                      No company ledger entries yet. Completed jobs and payouts post immutable entries here.
                    </td>
                  </tr>
                ) : (
                  companyLedger.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-[#F8F9FB]">
                      <td className="p-3 font-mono font-bold text-[#1C1C1E]">{entry.id}</td>
                      <td className="p-3 font-mono font-bold text-[#062A49]">#{entry.bookingNumber}</td>
                      <td className="p-3 font-bold text-[#1C1C1E]">{entry.type}</td>
                      <td className="p-3 text-[#48484A]">{entry.description}</td>
                      <td className="p-3 text-right font-black text-emerald-700">₹{entry.amount}</td>
                      <td className="p-3 text-right text-[#8E8E93] font-mono text-[10px]">{entry.createdAt.slice(0, 19).replace('T', ' ')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 4: DISPUTES & HOLDS ==================== */}
      {activeSubTab === 'DISPUTES' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-sm text-[#1C1C1E]">Disputes &amp; Settlement Protection</h4>

          {disputes.length === 0 ? (
            <div className="p-8 text-center bg-[#F8F9FB] rounded-2xl border border-[#E5E5EA] space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h5 className="font-bold text-[#1C1C1E]">Zero Active Disputes</h5>
              <p className="text-xs text-[#8E8E93]">No customer quality complaints or billing holds active.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F2F2F7]">
              {disputes.map(d => (
                <div key={d.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#062A49]">#{d.bookingNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#1C1C1E] font-medium mt-1">Reason: {d.reason}</p>
                    <span className="text-[10px] text-[#8E8E93]">Customer: {d.customerName} &bull; Partner: {d.partnerName}</span>
                  </div>

                  {d.status === 'DISPUTE_OPEN' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await resolveDispute(d.id, 'RELEASE_SETTLEMENT', 'Verified by admin audit - work completed satisfactorily.');
                          loadFinancialData();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        Release Settlement
                      </button>
                      <button
                        onClick={async () => {
                          await resolveDispute(d.id, 'REFUND_CUSTOMER', 'Quality deficiency confirmed, partial refund issued.', 150);
                          loadFinancialData();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer"
                      >
                        Approve Refund (Hold Payout)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 5: AUDIT LOGS ==================== */}
      {activeSubTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-sm text-[#1C1C1E]">Financial &amp; Configuration Audit Trail</h4>
          <div className="divide-y divide-[#F2F2F7] text-xs">
            {audits.length === 0 ? (
              <p className="text-center text-[#8E8E93] py-4">No audit logs recorded yet.</p>
            ) : (
              audits.map(a => (
                <div key={a.id} className="py-3 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#062A49]">{a.action}</span>
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-bold">
                        {a.entityType}
                      </span>
                    </div>
                    {a.reason && <p className="text-[#48484A] text-[11px] mt-0.5">{a.reason}</p>}
                    <span className="text-[10px] text-[#8E8E93]">By: {a.actor} ({a.actorRole})</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8E8E93]">{a.timestamp.slice(0, 19).replace('T', ' ')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: MANUAL BANK UTR VERIFICATION ==================== */}
      {selectedSettlementForManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="font-bold text-base text-[#1C1C1E]">Confirm Bank Settlement (UTR)</h3>
              <button 
                onClick={() => setSelectedSettlementForManual(null)} 
                className="p-1 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-[#E5E5EA] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">Settlement ID:</span>
                <span className="font-mono font-bold text-[#1C1C1E]">{selectedSettlementForManual.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">Partner:</span>
                <span className="font-bold text-[#1C1C1E]">{selectedSettlementForManual.partnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">Payable Amount:</span>
                <span className="font-black text-emerald-700 text-sm">₹{selectedSettlementForManual.partnerPayableAmount}</span>
              </div>
            </div>

            <form onSubmit={handleManualPaidSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR1234567890 or CMS98765"
                  value={manualUtrInput}
                  onChange={e => setManualUtrInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E5EA] text-xs font-mono font-bold text-[#1C1C1E] uppercase"
                />
                <span className="text-[11px] text-[#8E8E93] mt-1 block">
                  Verify the transfer in your bank portal before confirming here.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSettlementForManual(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Verify &amp; Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: CUSTOMER GST TAX INVOICE ==================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-start border-b border-[#E5E5EA] pb-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  Tax Invoice
                </span>
                <h3 className="text-xl font-bold font-['Outfit'] text-[#062A49] mt-1">
                  {selectedInvoice.companyName}
                </h3>
                <p className="text-xs text-[#8E8E93]">GSTIN: {selectedInvoice.companyGstin} &bull; PAN: {selectedInvoice.companyPan}</p>
                <p className="text-xs text-[#8E8E93]">SAC Code: {selectedInvoice.sacCode} (Deep Cleaning &amp; Sanitation Services)</p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)} 
                className="p-1 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Bill To & Invoice Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-1">
                <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Billed To Customer</span>
                <span className="font-bold text-[#1C1C1E] block">{selectedInvoice.customerName}</span>
                <span className="text-[#48484A] block">{selectedInvoice.customerPhone}</span>
                <span className="text-[#8E8E93] block">{selectedInvoice.customerAddress}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-1 text-right">
                <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Invoice Details</span>
                <span className="font-mono font-bold text-[#062A49] block">#{selectedInvoice.invoiceNumber}</span>
                <span className="text-[#8E8E93] block">Booking: #{selectedInvoice.bookingNumber}</span>
                <span className="text-[#8E8E93] block">Date: {selectedInvoice.bookingDate}</span>
                <span className="text-emerald-700 font-bold block">Status: PAID ({selectedInvoice.paymentMethod})</span>
              </div>
            </div>

            {/* Service & Tax Line Items */}
            <div className="rounded-2xl border border-[#E5E5EA] overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F8F9FB] text-[#8E8E93] border-b border-[#E5E5EA]">
                  <tr>
                    <th className="p-3 font-semibold">Service Description</th>
                    <th className="p-3 font-semibold text-right">Taxable Value</th>
                    <th className="p-3 font-semibold text-right">CGST (2.5%)</th>
                    <th className="p-3 font-semibold text-right">SGST (2.5%)</th>
                    <th className="p-3 font-semibold text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7]">
                  <tr>
                    <td className="p-3 font-medium text-[#1C1C1E]">{selectedInvoice.serviceName}</td>
                    <td className="p-3 text-right text-[#1C1C1E]">₹{selectedInvoice.taxableAmount}</td>
                    <td className="p-3 text-right text-[#1C1C1E]">₹{selectedInvoice.cgst}</td>
                    <td className="p-3 text-right text-[#1C1C1E]">₹{selectedInvoice.sgst}</td>
                    <td className="p-3 text-right font-black text-[#1C1C1E]">₹{selectedInvoice.totalPaid}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[#8E8E93]">Computer-generated official tax invoice. No signature required.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#062A49] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-opacity-90 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinanceAndSettlementSuite;
