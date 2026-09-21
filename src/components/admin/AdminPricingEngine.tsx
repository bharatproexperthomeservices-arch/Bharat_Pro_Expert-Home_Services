import React, { useState } from 'react';
import { CleaningService } from '../../types';
import { updateServicePricing } from '../../services/dbService';
import { 
  Percent, 
  Calculator, 
  Sparkles, 
  Save, 
  Check, 
  AlertCircle, 
  Sliders, 
  TrendingDown, 
  Layers, 
  RefreshCw,
  Info
} from 'lucide-react';

interface AdminPricingEngineProps {
  services: CleaningService[];
  onServiceUpdated: () => void;
}

export const AdminPricingEngine: React.FC<AdminPricingEngineProps> = ({
  services,
  onServiceUpdated
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [discountPct, setDiscountPct] = useState<number>(15);
  const [pricingMode, setPricingMode] = useState<'REFERENCE_PERCENT' | 'MANUAL'>('REFERENCE_PERCENT');
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [referencePrice, setReferencePrice] = useState<number>(0);
  const [convenienceFee, setConvenienceFee] = useState<number>(49);
  const [gstPct, setGstPct] = useState<number>(18);
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Bulk discount state
  const [bulkDiscountPct, setBulkDiscountPct] = useState<number>(15);
  const [bulkCategory, setBulkCategory] = useState<string>('ALL');
  const [bulkSaving, setBulkSaving] = useState<boolean>(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Simulator state
  const [simBenchmark, setSimBenchmark] = useState<number>(1599);
  const [simDiscount, setSimDiscount] = useState<number>(15);

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];

  // Sync state when selected service changes
  React.useEffect(() => {
    if (selectedService) {
      setReferencePrice(selectedService.referencePrice || Math.round(selectedService.basePrice / 0.85));
      setDiscountPct(selectedService.discountPct || 15);
      setPricingMode(selectedService.pricingMode || 'REFERENCE_PERCENT');
      setManualPrice(selectedService.basePrice);
    }
  }, [selectedServiceId]);

  // Derived calculations for selected service
  const calculatedBpePrice = Math.round(referencePrice * (1 - discountPct / 100));
  const effectiveBasePrice = pricingMode === 'REFERENCE_PERCENT' ? calculatedBpePrice : manualPrice;
  const effectiveSurgePrice = Math.round(effectiveBasePrice * surgeMultiplier);
  const customerSavingsAmount = Math.max(0, referencePrice - effectiveSurgePrice);
  const estGstAmount = Math.round(effectiveSurgePrice * (gstPct / 100));
  const customerFinalGross = effectiveSurgePrice + estGstAmount + convenienceFee;
  const partnerPayoutEst = Math.round(effectiveSurgePrice * 0.80); // 80% to partner
  const platformRevenueEst = effectiveSurgePrice - partnerPayoutEst + convenienceFee;

  // Simulator math
  const simCalculatedPrice = Math.round(simBenchmark * (1 - simDiscount / 100));
  const simSavings = simBenchmark - simCalculatedPrice;

  // Save single service pricing
  const handleSaveServicePricing = async () => {
    if (!selectedService) return;
    setIsSaving(true);
    try {
      await updateServicePricing(selectedService.id, {
        referencePrice,
        discountPct,
        pricingMode,
        basePrice: effectiveBasePrice,
        competitorPrice: referencePrice,
        manualPrice: pricingMode === 'MANUAL' ? manualPrice : undefined
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onServiceUpdated();
    } catch (e) {
      console.error('Failed to update pricing', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Apply bulk category discount
  const handleBulkApplyDiscount = async () => {
    setBulkSaving(true);
    setBulkSuccessMsg(null);
    try {
      const targets = services.filter(s => bulkCategory === 'ALL' || s.categoryId === bulkCategory);
      for (const srv of targets) {
        const ref = srv.referencePrice || Math.round(srv.basePrice / 0.85);
        const newPrice = Math.round(ref * (1 - bulkDiscountPct / 100));
        await updateServicePricing(srv.id, {
          discountPct: bulkDiscountPct,
          referencePrice: ref,
          basePrice: newPrice,
          competitorPrice: ref,
          pricingMode: 'REFERENCE_PERCENT'
        });
      }
      setBulkSuccessMsg(`Applied ${bulkDiscountPct}% discount across ${targets.length} services!`);
      setTimeout(() => setBulkSuccessMsg(null), 4000);
      onServiceUpdated();
    } catch (e) {
      console.error('Bulk update error', e);
    } finally {
      setBulkSaving(false);
    }
  };

  const categories = [
    { id: 'ALL', name: 'All Cleaning Categories' },
    { id: 'bathroom-cleaning', name: 'Bathroom Cleaning' },
    { id: 'kitchen-cleaning', name: 'Kitchen Cleaning' },
    { id: 'full-home-cleaning', name: 'Full Home Cleaning' },
    { id: 'sofa-carpet-cleaning', name: 'Living, Sofa & Carpet' },
  ];

  return (
    <div className="space-y-6" id="admin-pricing-engine">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1C1C1E] to-[#2C2C2E] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E07B1A] text-white text-[10px] font-bold tracking-wider uppercase">
              Pricing Engine v1.0
            </span>
            <span className="text-xs text-neutral-400">Rule: Benchmark × 0.85 = Bharat Pro Customer Price</span>
          </div>
          <h2 className="text-xl font-bold font-['Outfit'] text-[#F8F9FB]">
            Master Pricing &amp; Transparent Discount Controller
          </h2>
          <p className="text-xs text-neutral-300 max-w-2xl">
            Customer prices are never hardcoded. Manage reference benchmark prices, formula-driven 15% discount rules, and manual overrides with instant storefront sync.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
            <span className="text-[10px] text-neutral-400 block uppercase font-bold">Standard Formula</span>
            <span className="text-sm font-black text-emerald-400">15% Savings</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
            <span className="text-[10px] text-neutral-400 block uppercase font-bold">GST Standard</span>
            <span className="text-sm font-black text-amber-400">18% ITC</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Configurator & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Service Level Price Configurator (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#E07B1A]" />
                <h3 className="text-base font-bold text-[#1C1C1E]">
                  Service Price Configuration
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-[#F2F2F7] px-2.5 py-1 rounded-lg text-[#48484A]">
                {services.length} Total Services
              </span>
            </div>

            {/* Service Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#48484A]">Select Cleaning Service to Edit</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E07B1A]"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.categoryName}] {s.name} - Current: ₹{s.basePrice}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Mode Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#48484A]">Calculation Strategy</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPricingMode('REFERENCE_PERCENT')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    pricingMode === 'REFERENCE_PERCENT'
                      ? 'border-[#E07B1A] bg-[#FFF8F0] shadow-sm'
                      : 'border-[#E5E5EA] bg-[#F8F9FB] hover:border-[#D1D1D6]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1C1E]">Formula Mode</span>
                    <Percent className="w-4 h-4 text-[#E07B1A]" />
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-1">
                    Reference × (1 - {discountPct}%) = ₹{calculatedBpePrice}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingMode('MANUAL')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    pricingMode === 'MANUAL'
                      ? 'border-[#E07B1A] bg-[#FFF8F0] shadow-sm'
                      : 'border-[#E5E5EA] bg-[#F8F9FB] hover:border-[#D1D1D6]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1C1E]">Manual Override</span>
                    <Sliders className="w-4 h-4 text-[#1C1C1E]" />
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-1">
                    Explicit price: ₹{manualPrice}
                  </p>
                </button>
              </div>
            </div>

            {/* Price Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#48484A] flex items-center justify-between">
                  <span>Market Benchmark Price</span>
                  <span className="text-[10px] text-[#8E8E93]">Reference Baseline</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E8E93]">₹</span>
                  <input
                    type="number"
                    value={referencePrice}
                    onChange={(e) => setReferencePrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs font-bold text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E07B1A]"
                  />
                </div>
              </div>

              {pricingMode === 'REFERENCE_PERCENT' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#48484A] flex items-center justify-between">
                    <span>Discount to Customer (%)</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Recommended: 15%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={discountPct}
                      onChange={(e) => setDiscountPct(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs font-bold text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E07B1A]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E8E93]">%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#48484A] flex items-center justify-between">
                    <span>Manual Target Price</span>
                    <span className="text-[10px] text-amber-600 font-bold">Override</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E8E93]">₹</span>
                    <input
                      type="number"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs font-bold text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E07B1A]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Surge & Fee Adjusters */}
            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-3">
              <span className="text-xs font-bold text-[#1C1C1E] block">Multipliers &amp; Platform Controls</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#8E8E93] block">Surge Multiplier</label>
                  <select
                    value={surgeMultiplier}
                    onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold text-[#1C1C1E]"
                  >
                    <option value={1.0}>1.0x (Normal)</option>
                    <option value={1.1}>1.1x (Peak Day)</option>
                    <option value={1.15}>1.15x (Weekend High)</option>
                    <option value={1.25}>1.25x (Festival Surge)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8E8E93] block">Platform Fee</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#8E8E93]">₹</span>
                    <input
                      type="number"
                      value={convenienceFee}
                      onChange={(e) => setConvenienceFee(Number(e.target.value))}
                      className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold text-[#1C1C1E]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#8E8E93] block">GST Rate (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      value={gstPct}
                      onChange={(e) => setGstPct(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold text-[#1C1C1E]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Customer Breakdown Preview */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">Calculated Bharat Pro Price:</span>
                <span className="text-lg font-black text-emerald-700">₹{effectiveSurgePrice}</span>
              </div>
              <div className="flex justify-between text-emerald-800 text-[11px]">
                <span>Customer Savings vs Benchmark (₹{referencePrice}):</span>
                <span className="font-bold">₹{customerSavingsAmount} ({Math.round((customerSavingsAmount / (referencePrice || 1)) * 100)}% off)</span>
              </div>
              <div className="flex justify-between text-emerald-800 text-[11px]">
                <span>Est. Customer Checkout (incl. ₹{estGstAmount} GST + ₹{convenienceFee} fee):</span>
                <span className="font-semibold text-emerald-950">₹{customerFinalGross}</span>
              </div>
              <div className="flex justify-between text-neutral-600 text-[11px] pt-1 border-t border-emerald-200/60">
                <span>Partner Payout (80%): ₹{partnerPayoutEst}</span>
                <span>Platform Take: ₹{platformRevenueEst}</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <Check className="w-4 h-4" /> Price published to Storefront &amp; Database!
                </div>
              ) : (
                <span className="text-[11px] text-[#8E8E93]">Changes reflect instantly in customer app</span>
              )}
              <button
                type="button"
                onClick={handleSaveServicePricing}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#E07B1A] hover:bg-[#c96c14] text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save &amp; Update Service Price</span>
              </button>
            </div>
          </div>

          {/* Bulk Category Pricing Rule */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#2C2C2E]" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Bulk Category Pricing Discount Rule
              </h3>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Apply a blanket discount formula against benchmark baseline prices across an entire cleaning department.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#48484A] font-bold block mb-1">Target Department</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-semibold"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#48484A] font-bold block mb-1">Discount %</label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={40}
                    value={bulkDiscountPct}
                    onChange={(e) => setBulkDiscountPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E8E93]">%</span>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleBulkApplyDiscount}
                  disabled={bulkSaving}
                  className="w-full py-2 px-3 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {bulkSaving ? 'Updating...' : `Apply Bulk ${bulkDiscountPct}%`}
                </button>
              </div>
            </div>

            {bulkSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4" /> {bulkSuccessMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Simulator & Guidelines (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-time Pricing Simulator Box */}
          <div className="p-6 rounded-3xl bg-[#FFF8F0] border border-[#E0B050] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#E07B1A]" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Interactive Pricing Simulator
              </h3>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Input any competitor / market benchmark to verify customer savings and margins.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#48484A] block mb-1">
                  Market Benchmark Reference (₹)
                </label>
                <input
                  type="number"
                  value={simBenchmark}
                  onChange={(e) => setSimBenchmark(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-sm font-bold text-[#1C1C1E]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-[#48484A] mb-1">
                  <span>Target Discount %</span>
                  <span className="text-[#E07B1A]">{simDiscount}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={35}
                  step={1}
                  value={simDiscount}
                  onChange={(e) => setSimDiscount(Number(e.target.value))}
                  className="w-full accent-[#E07B1A]"
                />
              </div>
            </div>

            {/* Results Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E0B050] space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8E8E93]">Benchmark Baseline:</span>
                <span className="font-bold text-[#1C1C1E]">₹{simBenchmark}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8E8E93]">Transparent Discount:</span>
                <span className="font-bold text-emerald-600">-{simDiscount}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8E8E93]">Customer Savings:</span>
                <span className="font-bold text-[#1F8A3B]">₹{simSavings} Saved</span>
              </div>
              <div className="pt-2 border-t border-[#E5E5EA] flex justify-between items-center">
                <span className="text-xs font-bold text-[#1C1C1E]">Bharat Pro Price:</span>
                <span className="text-xl font-black text-[#E07B1A]">₹{simCalculatedPrice}</span>
              </div>
            </div>
          </div>

          {/* Core Specification Rules Checklist */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3.5">
            <h4 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">
              Pricing Specification Rules
            </h4>
            <div className="space-y-2.5 text-xs text-[#48484A]">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>15% Discount Rule:</strong> Reference Price × 0.85 = Bharat Pro customer price.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Transparent Badge:</strong> Customer card renders strikethrough benchmark with green savings badge.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Hardcoding:</strong> Prices are dynamic and fetched from Firestore/Master DB.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Frozen Snapshot:</strong> Once booked, price is frozen in booking snapshot preventing discrepancies.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
