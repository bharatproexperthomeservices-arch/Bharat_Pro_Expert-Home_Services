import React, { useState } from 'react';
import { CleaningService } from '../types';
import { 
  Star, 
  Clock, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Leaf, 
  AlertCircle,
  Calendar,
  MapPin,
  IndianRupee,
  Play
} from 'lucide-react';

interface ServiceDetailModalProps {
  service: CleaningService | null;
  onClose: () => void;
  onBookNow: (service: CleaningService) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookNow
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inclusions' | 'process'>('overview');

  if (!service) return null;

  const basePrice = service.basePrice;
  const refPrice = service.referencePrice || Math.round(basePrice * 1.18);
  const savings = refPrice - basePrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] overflow-hidden relative my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col font-['Inter',sans-serif]"
      >
        {/* Header Bar */}
        <div className="p-4 px-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2FA84F] bg-[#EBF8EE] px-2.5 py-0.5 rounded-full">
              {service.categoryName || 'Home Cleaning'}
            </span>
            <span className="text-xs text-gray-400 font-semibold">•</span>
            <span className="text-xs text-gray-500 font-medium">BharatProExpert Certified</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-[#0B2A4A] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Hero Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-6 relative h-52 sm:h-60 rounded-xl overflow-hidden bg-gray-100 shadow-xs border border-gray-100">
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-[#2FA84F] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                15% OFF
              </span>
            </div>

            <div className="md:col-span-6 space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2A4A] leading-tight">
                {service.name}
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {service.shortDesc || service.detailedDesc}
              </p>

              {/* Rating & Duration */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2.5 py-1 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{service.rating || '4.8'}</span>
                  <span className="text-gray-400 font-normal">({service.reviewCount || 42} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>~{service.estimatedMinutes || 120} mins</span>
                </div>
              </div>

              {/* Price Card */}
              <div className="p-3.5 rounded-xl bg-[#EEF7FD] border border-[#D0E7F9] flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#0B2A4A]">₹{basePrice.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-400 line-through">₹{refPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#2FA84F]">Save ₹{savings.toLocaleString('en-IN')} (Direct Benchmark Price)</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Pay After Inspection</span>
                  <span className="text-[11px] font-bold text-[#0B2A4A]">Zero Advance Needed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#E2E8F0] gap-6 text-xs font-bold text-[#0B2A4A]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 transition-all cursor-pointer ${
                activeTab === 'overview' 
                  ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' 
                  : 'text-gray-400 hover:text-[#0B2A4A]'
              }`}
            >
              Overview &amp; Standards
            </button>
            <button
              onClick={() => setActiveTab('inclusions')}
              className={`pb-2 transition-all cursor-pointer ${
                activeTab === 'inclusions' 
                  ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' 
                  : 'text-gray-400 hover:text-[#0B2A4A]'
              }`}
            >
              What&apos;s Included &amp; Excluded
            </button>
            <button
              onClick={() => setActiveTab('process')}
              className={`pb-2 transition-all cursor-pointer ${
                activeTab === 'process' 
                  ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' 
                  : 'text-gray-400 hover:text-[#0B2A4A]'
              }`}
            >
              Step-by-Step SOP
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
              <p>
                {service.detailedDesc || 'Our certified BharatProExpert deep cleaning professionals deploy hospital-grade Diversey chemicals and German extraction equipment. Every corner is descaled, scrubbed, and sanitized with zero harsh acidic fumes.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
                  <Leaf className="w-4 h-4 text-[#2FA84F]" />
                  <div className="font-bold text-[#0B2A4A]">Diversey Solutions</div>
                  <div className="text-[11px] text-gray-500">100% infant &amp; pet safe formulations.</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
                  <ShieldCheck className="w-4 h-4 text-[#0B2A4A]" />
                  <div className="font-bold text-[#0B2A4A]">7-Point Police Check</div>
                  <div className="text-[11px] text-gray-500">Aadhaar verified &amp; uniformed pros.</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
                  <Sparkles className="w-4 h-4 text-[#F5A400]" />
                  <div className="font-bold text-[#0B2A4A]">48-Hour Re-Clean</div>
                  <div className="text-[11px] text-gray-500">Free touch-up if any spot is missed.</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Inclusions & Exclusions */}
          {activeTab === 'inclusions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#EBF8EE] border border-[#C6ECD2] space-y-2">
                <h4 className="text-xs font-bold text-[#2FA84F] uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>What&apos;s Included</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-[#0B2A4A]">
                  {(service.inclusions && service.inclusions.length > 0 ? service.inclusions : [
                    'Intense tile descaling with rotary scrubbing machine',
                    'Hard-water stain removal on taps, shower & basins',
                    'Mirror buffing & glass streak-free squeegee wash',
                    'Floor scrubbing & hospital-grade surface sanitization',
                    'Cobweb removal and ceiling fixtures dusting'
                  ]).map((inc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#2FA84F] font-bold">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <span>What&apos;s Excluded</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {(service.exclusions && service.exclusions.length > 0 ? service.exclusions : [
                    'Wall paint peeling or seepage touch-ups',
                    'Exterior facade high-rise window cleaning without balcony',
                    'Furniture structural carpentry repairs'
                  ]).map((exc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-gray-400 font-bold">✕</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Process SOP */}
          {activeTab === 'process' && (
            <div className="space-y-3">
              {(service.steps && service.steps.length > 0 ? service.steps : [
                { order: 1, title: 'Dry Inspection & Dusting', description: 'Complete dry vacuuming and inspection of hard-water accumulation.', estimatedMinutes: 20 },
                { order: 2, title: 'Diversey Chemical Application', description: 'Application of Diversey specialized cleaning agents for grease/scale breakdown.', estimatedMinutes: 40 },
                { order: 3, title: 'Single-Disc Machine Scrubbing', description: 'Mechanical rotary buffing and high-pressure steam/suction extraction.', estimatedMinutes: 40 },
                { order: 4, title: 'Final Glass Buffing & Customer Inspection', description: 'Crystal shine buffing and joint walkthrough before payment collection.', estimatedMinutes: 20 }
              ]).map((step) => (
                <div key={step.order} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <div className="w-7 h-7 rounded-full bg-[#0B2A4A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {step.order}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B2A4A]">{step.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{step.description}</div>
                  </div>
                  <div className="ml-auto text-[10px] text-gray-400 font-semibold shrink-0">
                    {step.estimatedMinutes} mins
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-xs text-gray-500">Total All-Inclusive Price</div>
            <div className="text-xl font-black text-[#0B2A4A]">₹{basePrice.toLocaleString('en-IN')}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-gray-300 text-xs font-bold text-[#0B2A4A] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookNow(service);
              }}
              className="px-6 py-2.5 rounded-full bg-[#0B2A4A] hover:bg-[#071E36] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Proceed to Booking</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F5A400]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
