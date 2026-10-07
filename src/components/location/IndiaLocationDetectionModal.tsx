import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Compass, 
  Building2, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Globe2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  MASTER_ALL_INDIA_REGIONS, 
  OPERATIONAL_BPE_HUBS, 
  ResolvedCustomerLocation, 
  getRealDeviceGps, 
  reverseGeocodeCoordinates, 
  searchIndiaLocations,
  getCachedUserCoordinates,
  getCachedGeocodeResult
} from '../../services/indiaLocationHierarchy';

interface IndiaLocationDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationResolved: (location: ResolvedCustomerLocation) => void;
  currentLocationName?: string;
  isMandatoryInitialPrompt?: boolean;
}

export const IndiaLocationDetectionModal: React.FC<IndiaLocationDetectionModalProps> = ({
  isOpen,
  onClose,
  onLocationResolved,
  currentLocationName,
  isMandatoryInitialPrompt = false
}) => {
  const [mode, setMode] = useState<'prompt' | 'detecting' | 'manual' | 'resolved' | 'outside_india'>('prompt');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedData, setResolvedData] = useState<ResolvedCustomerLocation | null>(null);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('All');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setMode('prompt');
      setGpsError(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Trigger Real Device GPS with memoization & cached coordinates support
  const handleStartRealGps = async (forceRefresh: boolean = false) => {
    setGpsError(null);

    // 0. Check for cached coordinates to provide instant response without network wait
    const cachedCoords = !forceRefresh ? getCachedUserCoordinates() : null;
    if (cachedCoords) {
      const cachedGeocode = getCachedGeocodeResult(cachedCoords.latitude, cachedCoords.longitude);
      if (cachedGeocode) {
        setLiveCoords({
          lat: cachedCoords.latitude,
          lng: cachedCoords.longitude,
          accuracy: Math.round(cachedCoords.accuracy)
        });
        setResolvedData(cachedGeocode);
        setMode(cachedGeocode.isIndia ? 'resolved' : 'outside_india');
        return;
      }
    }

    setMode('detecting');

    try {
      // 1. Browser Geolocation API
      const coords = await getRealDeviceGps({ allowCached: !forceRefresh });
      setLiveCoords({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: Math.round(coords.accuracy)
      });

      // 2. Reverse Geocoding with Memoization (instant if in memory/localStorage cache)
      const resolved = await reverseGeocodeCoordinates(
        coords.latitude,
        coords.longitude,
        coords.accuracy,
        forceRefresh
      );

      // 3. Country Validation
      if (!resolved.isIndia) {
        setResolvedData(resolved);
        setMode('outside_india');
        return;
      }

      setResolvedData(resolved);
      setMode('resolved');
    } catch (err: any) {
      setGpsError(err.message || 'Unable to access device location. Please allow browser location access or enter your city manually.');
      setMode('manual');
    }
  };

  const handleApplyResolved = (loc: ResolvedCustomerLocation) => {
    // Persist to local storage
    try {
      localStorage.setItem('bpe_customer_location_v1', JSON.stringify(loc));
    } catch {}
    onLocationResolved(loc);
    onClose();
  };

  const handleSelectManualCity = (item: ReturnType<typeof searchIndiaLocations>[0]) => {
    const fakeResolved: ResolvedCustomerLocation = {
      country: 'India',
      isIndia: true,
      state: item.state,
      district: item.district || item.city,
      city: item.city,
      latitude: item.approxLat,
      longitude: item.approxLng,
      accuracy: 50,
      timestamp: Date.now(),
      formattedAddress: `${item.city}, ${item.state}, India`,
      serviceable: true,
      serviceTier: 'TIER_1_EXPRESS',
      nearestHub: {
        id: 'hub_assigned',
        name: `BPE ${item.city} Hub`,
        city: item.city,
        state: item.state,
        distanceKm: 4.5,
        estimatedArrivalMins: 35
      }
    };
    handleApplyResolved(fakeResolved);
  };

  const searchResults = searchIndiaLocations(searchQuery);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 font-['Inter',sans-serif]">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Bharat Pro Expert • Location
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Pan-India Administrative Service Coverage
              </p>
            </div>
          </div>

          {!isMandatoryInitialPrompt && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* MODE 1: PROMPT SCREEN (Exact Layout Requested) */}
          {mode === 'prompt' && (
            <div className="space-y-6 text-center py-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 mx-auto">
                <Navigation className="w-3.5 h-3.5" />
                <span>GPS AUTO-DETECTION</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                  <span>📍 FINDING YOUR LOCATION</span>
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Allow device location access to automatically configure your address and verify real-time hub availability.
                </p>
              </div>

              {/* Requirement Bullet List */}
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 text-left space-y-2.5 max-w-md mx-auto">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Allow location access to find:
                </p>
                <div className="space-y-2 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your current address</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Available cleaning services</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Nearest Bharat Pro Expert Hub</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Available professionals</span>
                  </div>
                </div>
              </div>

              {/* Primary Buttons */}
              <div className="space-y-3 pt-2 max-w-md mx-auto">
                <button
                  onClick={handleStartRealGps}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>[ Use My Current Location ]</span>
                </button>

                <button
                  onClick={() => setMode('manual')}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>[ Enter Address Manually ]</span>
                </button>
              </div>

              {currentLocationName && (
                <p className="text-[11px] text-slate-400">
                  Currently active: <strong className="text-slate-700">{currentLocationName}</strong>
                </p>
              )}
            </div>
          )}

          {/* MODE 2: DETECTING GPS SCANNER */}
          {mode === 'detecting' && (
            <div className="py-8 text-center space-y-5">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-blue-500/30 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xl">
                  <Compass className="w-7 h-7 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Connecting to Device GPS...
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Capturing precision coordinates & reverse geocoding via Indian Administrative Grid.
                </p>
              </div>

              {liveCoords && (
                <div className="inline-block px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-mono">
                  Lat: {liveCoords.lat.toFixed(5)}° N • Lng: {liveCoords.lng.toFixed(5)}° E (±{liveCoords.accuracy}m)
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setMode('manual')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Taking too long? Enter address manually
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: RESOLVED LOCATION SUMMARY */}
          {mode === 'resolved' && resolvedData && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real Location Successfully Locked</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="font-semibold text-sm text-slate-900">
                    📍 {resolvedData.city}, {resolvedData.state}
                  </div>
                  {resolvedData.locality && (
                    <div className="text-slate-600">
                      Area: <span className="font-medium">{resolvedData.locality}</span>
                    </div>
                  )}
                  {resolvedData.pincode && (
                    <div className="text-slate-600">
                      PIN Code: <span className="font-semibold text-slate-900">{resolvedData.pincode}</span>
                    </div>
                  )}
                  <div className="text-[11px] font-mono text-slate-500 pt-1">
                    GPS: {resolvedData.latitude.toFixed(4)}° N, {resolvedData.longitude.toFixed(4)}° E (Acc: ±{resolvedData.accuracy}m)
                  </div>
                </div>
              </div>

              {/* Administrative Hierarchy Breadcrumb */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Administrative Hierarchy:
                </div>
                <div className="flex items-center flex-wrap gap-1 font-medium">
                  <span className="text-blue-700 font-bold">India</span>
                  <span>→</span>
                  <span className="text-slate-800">{resolvedData.state}</span>
                  <span>→</span>
                  <span className="text-slate-800">{resolvedData.district}</span>
                  <span>→</span>
                  <span className="text-slate-800">{resolvedData.city}</span>
                </div>
              </div>

              {/* Nearest Operational Hub Card */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    Nearest BPE Hub: {resolvedData.nearestHub.name}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Distance: <strong>{resolvedData.nearestHub.distanceKm} km</strong></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Est. Arrival: <strong>~{resolvedData.nearestHub.estimatedArrivalMins} mins</strong>
                  </span>
                </div>
              </div>

              {/* Confirm & Set Location Button */}
              <button
                onClick={() => handleApplyResolved(resolvedData)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Confirm Location & View Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setMode('manual')}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center"
              >
                Change or pick a different city manually
              </button>
            </div>
          )}

          {/* MODE 4: OUTSIDE INDIA VALIDATION ERROR */}
          {mode === 'outside_india' && resolvedData && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Location Outside Service Region
                </h3>
                <p className="text-xs text-rose-600 font-semibold max-w-sm mx-auto bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  Currently Bharat Pro Expert is available only in India.
                </p>
                <p className="text-[11px] text-slate-500">
                  Detected coordinates: {resolvedData.latitude.toFixed(2)}°, {resolvedData.longitude.toFixed(2)}° ({resolvedData.country})
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setMode('manual')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Select an Indian Service City Manually
                </button>
              </div>
            </div>
          )}

          {/* MODE 5: MANUAL SEARCH ACROSS ALL 28 STATES + 8 UTs */}
          {mode === 'manual' && (
            <div className="space-y-4">
              {gpsError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">GPS Note: </span>
                    {gpsError}
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search city, district, state or pincode in India..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* Re-trigger GPS button */}
              <button
                onClick={handleStartRealGps}
                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200/60 transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Retry Automatic GPS Location</span>
              </button>

              {/* Filter by major State or View All */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {['All', 'Delhi', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Bihar', 'West Bengal'].map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedStateFilter(st);
                      if (st !== 'All') setSearchQuery(st);
                      else setSearchQuery('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                      selectedStateFilter === st 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Search Results / Hub List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {searchQuery.trim().length >= 2 ? (
                  searchResults.length > 0 ? (
                    searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectManualCity(item)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            {item.city}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.state} {item.isUnionTerritory ? '(Union Territory)' : 'State'}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          Select →
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching city found in India. Try searching another district or state.
                    </div>
                  )
                ) : (
                  /* Default Popular BPE Operational Hubs */
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Direct BPE Operational Hubs:
                    </p>
                    {OPERATIONAL_BPE_HUBS.map(hub => (
                      <div
                        key={hub.id}
                        onClick={() => handleSelectManualCity({
                          state: hub.state,
                          city: hub.city,
                          displayName: `${hub.city}, ${hub.state}`,
                          isUnionTerritory: false,
                          approxLat: hub.lat,
                          approxLng: hub.lng
                        })}
                        className="p-3 rounded-xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{hub.city}</span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {hub.state}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">{hub.name} • {hub.radiusKm} km radius</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Express Dispatch
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
