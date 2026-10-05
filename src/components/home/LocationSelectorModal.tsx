import React, { useState } from 'react';
import { MapPin, Search, Compass, CheckCircle2, X, ChevronRight } from 'lucide-react';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectLocation: (locationStr: string, coords?: { lat: number; lng: number }) => void;
}

const POPULAR_HUBS = [
  { city: 'Gurugram', state: 'Haryana', desc: 'Cyber City, Golf Course Road, Sector 56, Sohna Rd', lat: 28.4595, lng: 77.0266 },
  { city: 'South Delhi', state: 'Delhi NCR', desc: 'Saket, Hauz Khas, GK 1 & 2, Vasant Kunj', lat: 28.5355, lng: 77.2185 },
  { city: 'Noida', state: 'Uttar Pradesh', desc: 'Sector 62, Sector 50, Sector 137, Expressway', lat: 28.5355, lng: 77.3910 },
  { city: 'Central Delhi', state: 'Delhi NCR', desc: 'Connaught Place, Karol Bagh, Rajendra Nagar', lat: 28.6139, lng: 77.2090 },
  { city: 'Mumbai', state: 'Maharashtra', desc: 'Bandra, Andheri, Powai, Juhu, BKC', lat: 19.0760, lng: 72.8777 },
  { city: 'Bengaluru', state: 'Karnataka', desc: 'Indiranagar, Koramangala, Whitefield, HSR Layout', lat: 12.9716, lng: 77.5946 },
  { city: 'Patna', state: 'Bihar', desc: 'Boring Road, Kankarbagh, Bailey Road, Patliputra', lat: 25.5941, lng: 85.1376 },
  { city: 'Ranchi', state: 'Jharkhand', desc: 'Main Road, Lalpur, Doranda, Harmu', lat: 23.3441, lng: 85.3096 }
];

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // OpenStreetMap Reverse Geocoding
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await resp.json();
          const city = data.address?.city || data.address?.town || data.address?.suburb || 'Gurugram';
          const state = data.address?.state || 'Haryana';
          const display = `${city}, ${state}`;
          onSelectLocation(display, { lat: latitude, lng: longitude });
          setDetectingGps(false);
          onClose();
        } catch {
          // Fallback to nearest hub
          onSelectLocation('Gurugram, Haryana', { lat: latitude, lng: longitude });
          setDetectingGps(false);
          onClose();
        }
      },
      (err) => {
        setDetectingGps(false);
        setGpsError('Location permission was denied. Please select your city from the list below.');
      },
      { timeout: 8000 }
    );
  };

  const filteredHubs = POPULAR_HUBS.filter(h => 
    h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] font-['Inter',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Service Location</h3>
              <p className="text-[11px] text-slate-500">Pick your city or auto-detect with GPS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Auto Detect Button */}
        <div className="p-4 px-6 border-b border-slate-100">
          <button
            onClick={handleDetectGps}
            disabled={detectingGps}
            className="w-full py-3 px-4 rounded-xl border border-blue-600 bg-blue-50/60 hover:bg-blue-100/70 text-blue-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Compass className={`w-4 h-4 text-blue-600 ${detectingGps ? 'animate-spin' : ''}`} />
            <span>{detectingGps ? 'Detecting Your GPS Location...' : 'Use Current Location (GPS Auto)'}</span>
          </button>
          {gpsError && (
            <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
              {gpsError}
            </p>
          )}
        </div>

        {/* Search Input */}
        <div className="p-4 px-6 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search city, sector or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </div>
        </div>

        {/* Cities List */}
        <div className="p-4 px-6 overflow-y-auto space-y-2 flex-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Available Service Hubs
          </span>
          {filteredHubs.map((hub) => {
            const isSelected = selectedCity.toLowerCase().includes(hub.city.toLowerCase());
            return (
              <div
                key={hub.city}
                onClick={() => {
                  onSelectLocation(`${hub.city}, ${hub.state}`, { lat: hub.lat, lng: hub.lng });
                  onClose();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/70' 
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{hub.city}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {hub.state}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{hub.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
