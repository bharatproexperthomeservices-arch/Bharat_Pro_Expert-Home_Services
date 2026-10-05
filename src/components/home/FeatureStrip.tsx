import React from 'react';
import { ShieldCheck, ClipboardCheck, Headphones, CalendarCheck } from 'lucide-react';

export const FeatureStrip: React.FC = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#08213F]" />,
      title: 'Verified Professionals',
      subtitle: 'Background Checked'
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-[#08213F]" />,
      title: 'Transparent Pricing',
      subtitle: 'No Hidden Charges'
    },
    {
      icon: <Headphones className="w-6 h-6 text-[#08213F]" />,
      title: 'Real-time Tracking',
      subtitle: 'Live Updates'
    },
    {
      icon: <CalendarCheck className="w-6 h-6 text-[#08213F]" />,
      title: 'Secure Payments',
      subtitle: 'Multiple Options'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 relative z-20 font-['Inter',sans-serif]">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgba(8,33,63,0.06)] border border-slate-100 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat) => (
          <div 
            key={feat.title}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50/70 border border-blue-100 flex items-center justify-center shrink-0">
              {feat.icon}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#08213F] leading-snug">
                {feat.title}
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {feat.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
