import React from 'react';
import { X, MapPin, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { BharatProLogo } from '../BharatProLogo';

interface LocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (cityName: string) => void;
}

export const LocationsModal: React.FC<LocationsModalProps> = ({
  isOpen,
  onClose,
  onSelectCity
}) => {
  if (!isOpen) return null;

  const hubs = [
    { city: 'Gurugram', state: 'Haryana', hubs: 3, coverage: 'DLF CyberCity, Golf Course Road, Sohna Road, Sector 14-57' },
    { city: 'Delhi NCR', state: 'Delhi', hubs: 4, coverage: 'South Delhi, Saket, Hauz Khas, Dwarka, Rohini, Vasant Kunj' },
    { city: 'Noida', state: 'Uttar Pradesh', hubs: 2, coverage: 'Sector 50, Sector 62, Sector 137, Greater Noida Expressway' },
    { city: 'Mumbai', state: 'Maharashtra', hubs: 4, coverage: 'Bandra, Andheri, Powai, Juhu, BKC, Thane, Navi Mumbai' },
    { city: 'Pune', state: 'Maharashtra', hubs: 3, coverage: 'Kothrud, Viman Nagar, Hinjawadi, Baner, Wakad' },
    { city: 'Bengaluru', state: 'Karnataka', hubs: 5, coverage: 'Indiranagar, Koramangala, Whitefield, HSR Layout, Bellandur, Electronic City' },
    { city: 'Hyderabad', state: 'Telangana', hubs: 4, coverage: 'HITEC City, Gachibowli, Madhapur, Jubilee Hills, Banjara Hills' },
    { city: 'Chennai', state: 'Tamil Nadu', hubs: 3, coverage: 'OMR, Anna Nagar, T. Nagar, Adyar, Velachery' },
    { city: 'Kolkata', state: 'West Bengal', hubs: 3, coverage: 'Salt Lake Sector V, New Town, Park Street, Ballygunge' },
    { city: 'Patna', state: 'Bihar', hubs: 2, coverage: 'Boring Road, Kankarbagh, Bailey Road, Patliputra Colony, Danapur' },
    { city: 'Ranchi', state: 'Jharkhand', hubs: 2, coverage: 'Main Road, Lalpur, Doranda, Harmu Housing Colony, Morabadi' },
    { city: 'Lucknow', state: 'Uttar Pradesh', hubs: 3, coverage: 'Gomti Nagar, Hazratganj, Aliganj, Indira Nagar' },
    { city: 'Jaipur', state: 'Rajasthan', hubs: 3, coverage: 'Malviya Nagar, Vaishali Nagar, Mansarovar, C-Scheme' },
    { city: 'Ahmedabad', state: 'Gujarat', hubs: 3, coverage: 'SG Highway, Prahlad Nagar, Bodakdev, Satellite, Vastrapur' },
    { city: 'Chandigarh', state: 'Chandigarh', hubs: 2, coverage: 'Sector 1-60, Mohali, Panchkula (Tricity Coverage)' }
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
              <h3 className="text-sm font-bold text-slate-900">Service Coverage Hubs</h3>
              <p className="text-[11px] text-slate-500">Live operational dispatch centers across India</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-500">
            Bharat Pro Expert operates localized micro-fulfillment hubs equipped with single-disc scrubbers, extraction pumps and inventory reserves to guarantee prompt arrival within your chosen time window.
          </p>

          <div className="space-y-2.5 pt-2">
            {hubs.map((h) => (
              <div
                key={h.city}
                onClick={() => {
                  onSelectCity(`${h.city}, ${h.state}`);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-2xs group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0B2A4A] group-hover:text-blue-700">
                      {h.city}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {h.state}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {h.hubs} Active Hubs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {h.coverage}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
