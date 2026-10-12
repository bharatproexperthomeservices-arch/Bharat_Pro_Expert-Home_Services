import React from 'react';
import { X, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
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

  const highlights = [
    { title: 'Clear service details', description: 'Review package inclusions and exclusions before choosing a service.' },
    { title: 'Package-based pricing', description: 'Compare available options and check the displayed price before checkout.' },
    { title: 'Online booking', description: 'Select a service and follow the booking steps to confirm your request.' }
  ];

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
              <p className="text-[11px] text-slate-500">Home cleaning and service bookings</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close about dialog"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-2">
            <h4 className="text-base font-bold text-[#0B2A4A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>A clearer way to book home cleaning</span>
            </h4>
            <p className="text-slate-600 text-xs">
              Explore available cleaning packages, compare service details and prices, and book online. Service availability, timings and final price depend on the selected package and location.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {highlights.map((item) => (
              <div key={item.title} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold text-[#0B2A4A] block">{item.title}</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Before you book</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Check what is included in the package and note any exclusions that matter for your home.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Choose a service that matches the surface, room size and cleaning requirement.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Review the total shown during checkout and contact support if a service detail is unclear.</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Need help? Use the Help &amp; Support option.</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBookNow();
              }}
              className="px-5 py-2.5 rounded-full bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-all"
            >
              Explore Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
