import React from 'react';
import { X, Calendar, UserCheck, ShieldCheck, Smile, ArrowRight } from 'lucide-react';
import { BharatProLogo } from '../BharatProLogo';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookNow: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onOpenBookNow
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '01',
      title: 'Pick Service & Select Time Slot',
      desc: 'Choose from Full House, Kitchen, Sofa, Bathroom or AC deep clean. Select a convenient date and arrival window.',
      icon: <Calendar className="w-5 h-5 text-blue-600" />
    },
    {
      step: '02',
      title: 'Expert Matching & Dispatch',
      desc: 'Our dispatch engine assigns the highest-rated background-verified specialist in your local hub. You receive live SMS & WhatsApp tracking.',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />
    },
    {
      step: '03',
      title: 'Hospital-Grade Deep Cleaning',
      desc: 'Specialists arrive in uniform with full German Kärcher machines and Diversey Taski chemicals. Job starts with an OTP verification.',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />
    },
    {
      step: '04',
      title: 'Inspect & Confirm Satisfaction',
      desc: 'Inspect the immaculate sparkling clean home. Provide completion OTP with 100% Free Re-clean guarantee. All bookings are confirmed with secure 100% online payment (UPI, Cards, NetBanking).',
      icon: <Smile className="w-5 h-5 text-amber-600" />
    }
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
              <h3 className="text-sm font-bold text-slate-900">How Bharat Pro Expert Works</h3>
              <p className="text-[11px] text-slate-500">Simple, verified 4-step home service delivery</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((st) => (
              <div 
                key={st.step}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    {st.icon}
                  </div>
                  <span className="font-mono text-xs font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                    Step {st.step}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {st.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-4">
            <div>
              <h5 className="text-xs font-bold text-emerald-950">100% Satisfaction or Free Re-service</h5>
              <p className="text-[11px] text-emerald-800">If any designated corner is not cleaned to standard, we re-clean within 24 hours.</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenBookNow();
              }}
              className="px-5 py-2.5 rounded-full bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-all shrink-0"
            >
              Book Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
