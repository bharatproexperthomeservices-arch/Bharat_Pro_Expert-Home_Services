import React from 'react';
import { X, ShieldCheck, Award, Users, CheckCircle2, Sparkles } from 'lucide-react';
import { BharatProLogo } from '../BharatProLogo';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookNow: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  onOpenBookNow
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] font-['Inter',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <BharatProLogo size="sm" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">About Bharat Pro Expert</h3>
              <p className="text-[11px] text-slate-500">India&apos;s premier hospital-grade cleaning service network</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-2">
            <h4 className="text-base font-bold text-[#0B2A4A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Redefining Home &amp; Commercial Hygiene in India</span>
            </h4>
            <p className="text-slate-600 text-xs">
              Bharat Pro Expert was founded to eliminate sub-standard, unverified home cleaning and replace it with transparent pricing, German machine standards, and 100% background-verified professionals across Delhi-NCR, Mumbai, Bengaluru and key tier-1/tier-2 hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-2xl font-black text-[#0B2A4A]">50,000+</span>
              <span className="text-[11px] text-slate-500 block font-semibold">Homes Sanitized</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-2xl font-black text-emerald-600">4.9 ★</span>
              <span className="text-[11px] text-slate-500 block font-semibold">Customer Rating</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-2xl font-black text-blue-600">100%</span>
              <span className="text-[11px] text-slate-500 block font-semibold">Verified Crew</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Why Bharat Pro Expert?</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Hospital-grade Diversey chemicals:</strong> 100% acid-free, baby-safe, pet-safe formulations that preserve your Italian marble, chrome fixtures, and upholstery colors.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>High-tech German extraction:</strong> Industrial Kärcher pressure washers and single-disc rotary scrubbers for 3x deeper extraction than conventional maid cleaning.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No hidden charges or surprise extras:</strong> Upfront locked prices with live OTP start and completion verification.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ISO 9001:2015 Quality Certified</span>
            <button
              onClick={() => {
                onClose();
                onOpenBookNow();
              }}
              className="px-5 py-2.5 rounded-full bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-all"
            >
              Book Service Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
