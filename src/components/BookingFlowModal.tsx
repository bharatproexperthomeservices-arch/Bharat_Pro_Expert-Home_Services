import React, { useState, useEffect } from 'react';
import { CleaningService, ServiceAddon, Booking, HubLocation } from '../types';
import { BUMPER_OFFERS, INITIAL_HUBS, WHATSAPP_NUMBER } from '../data';
import { useAuth } from '../context/AuthContext';
import { createNewBooking, getAllHubs } from '../services/dbService';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Gift, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Banknote,
  X,
  Phone,
  User,
  CheckCircle2,
  Tag,
  Compass,
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface BookingFlowModalProps {
  service: CleaningService | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
  onRequireAuth: () => void;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  service,
  onClose,
  onBookingSuccess,
  onRequireAuth
}) => {
  const { user, profile } = useAuth();
  
  // Available Hubs (Dynamic from Database & LocalStorage)
  const [availableHubs, setAvailableHubs] = useState<HubLocation[]>(INITIAL_HUBS);

  // Steps: 1: Add-ons & Schedule -> 2: Address & Location -> 3: Billing & Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAddons, setSelectedAddons] = useState<ServiceAddon[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('9 AM - 12 PM');
  
  // Address & Hub selection
  const [selectedHub, setSelectedHub] = useState<HubLocation>(INITIAL_HUBS[0]);
  const [selectedSector, setSelectedSector] = useState(INITIAL_HUBS[0].coveredSectors[0]);
  const [streetAddress, setStreetAddress] = useState('');
  const [pincode, setPincode] = useState('122002');
  const [phone, setPhone] = useState(profile?.phone || '8920252647');
  const [name, setName] = useState(profile?.name || '');

  // Live Geolocation / Geography Coordinates
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState<string | null>(null);
  
  // Coupons & Payment
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'PAY_AFTER_SERVICE'>('UPI');
  const [loading, setLoading] = useState(false);

  // Load latest hubs from DB / Storage
  useEffect(() => {
    const fetchHubs = async () => {
      const hubsList = await getAllHubs();
      if (hubsList && hubsList.length > 0) {
        setAvailableHubs(hubsList);
        setSelectedHub(hubsList[0]);
        if (hubsList[0].coveredSectors && hubsList[0].coveredSectors.length > 0) {
          setSelectedSector(hubsList[0].coveredSectors[0]);
        }
      }
    };
    fetchHubs();

    // Listen for real-time hub updates from Admin
    const handleHubsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAvailableHubs(e.detail);
      }
    };
    window.addEventListener('bharatpro_hubs_updated', handleHubsUpdated);
    return () => window.removeEventListener('bharatpro_hubs_updated', handleHubsUpdated);
  }, []);

  // Set default phone & name when profile loads
  useEffect(() => {
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.name) setName(profile.name);
  }, [profile]);

  if (!service) return null;

  // Toggle add-on
  const toggleAddon = (addon: ServiceAddon) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Live Geolocation Auto-Detection
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setGeoStatusMsg('Detecting precise GPS satellites...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGeoCoords({ lat: latitude, lng: longitude, accuracy });
        setGeoStatusMsg(`Locked: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (±${Math.round(accuracy)}m)`);

        try {
          // Free Nominatim reverse geocode
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (resp.ok) {
            const data = await resp.json();
            const addr = data.address || {};
            const road = addr.road || addr.residential || addr.suburb || '';
            const neighbourhood = addr.neighbourhood || addr.suburb || addr.city_district || '';
            const detectedCity = addr.city || addr.town || addr.state_district || addr.county || '';
            const detectedPincode = addr.postcode || '';

            if (road || neighbourhood) {
              setStreetAddress(prev => prev || `${road}${neighbourhood ? ', ' + neighbourhood : ''}`);
            }
            if (detectedPincode) {
              setPincode(detectedPincode);
            }

            // Find matching Hub for detected city or nearest
            if (detectedCity) {
              const matchedHub = availableHubs.find(h => 
                h.city.toLowerCase().includes(detectedCity.toLowerCase()) ||
                detectedCity.toLowerCase().includes(h.city.toLowerCase())
              );
              if (matchedHub) {
                setSelectedHub(matchedHub);
                if (matchedHub.coveredSectors.length > 0) {
                  setSelectedSector(matchedHub.coveredSectors[0]);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Reverse geocoding notice:', e);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        setGeoStatusMsg('GPS permission denied or timeout. You can enter address manually.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Math Calculations
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const rawSubtotal = service.basePrice + addonsTotal;
  const taxesGst = Math.round(rawSubtotal * 0.18);
  const convenienceFee = 49;
  const grossBeforeDiscount = rawSubtotal + taxesGst + convenienceFee;
  const netTotal = Math.max(0, grossBeforeDiscount - discountAmount);

  // Auto detect Bumper Offer
  const unlockedOffer = [...BUMPER_OFFERS]
    .reverse()
    .find(offer => rawSubtotal >= offer.tierMinAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'BHARAT500' || clean === 'PRO500') {
      setDiscountAmount(500);
      setCouponMessage('🎉 Promo code applied! ₹500 Discount unlocked.');
    } else if (clean === 'FIRST15') {
      const disc = Math.round(rawSubtotal * 0.15);
      setDiscountAmount(disc);
      setCouponMessage(`🎉 15% First-time discount applied! Saved ₹${disc}`);
    } else {
      setCouponMessage('Invalid coupon code. Try "BHARAT500" or "FIRST15"');
    }
  };

  const handleConfirmBooking = async () => {
    if (!streetAddress) {
      alert('Please enter your house, flat, or street address.');
      setStep(2);
      return;
    }
    if (!name) {
      alert('Please enter your name.');
      setStep(2);
      return;
    }
    if (!phone) {
      alert('Please enter your mobile number.');
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const bookingId = 'bpe_bk_' + Math.random().toString(36).substring(2, 9);
      const bookingNumber = 'BPE-' + Math.floor(100000 + Math.random() * 900000);
      const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();

      // Use GPS coordinates if detected, otherwise Hub coordinates
      const finalLat = geoCoords?.lat ?? selectedHub.lat;
      const finalLng = geoCoords?.lng ?? selectedHub.lng;

      const newBookingRecord: Booking = {
        id: bookingId,
        bookingNumber,
        customerId: user?.uid || profile?.uid || 'guest_' + Math.random().toString(36).substring(2, 7),
        customerName: name,
        customerPhone: phone,
        customerEmail: user?.email || profile?.email || 'bharatproexpert@gmail.com',
        serviceId: service.id,
        serviceName: service.name,
        categoryName: service.categoryName,
        date: selectedDate,
        timeSlot: selectedSlot,
        assignedHubId: selectedHub.id,
        address: {
          street: streetAddress,
          sector: selectedSector || 'Central Area',
          city: selectedHub.city,
          state: selectedHub.state,
          pincode: pincode || '122002',
          lat: finalLat,
          lng: finalLng
        },
        selectedAddons,
        basePrice: service.basePrice,
        addonsPrice: addonsTotal,
        taxesGst,
        convenienceFee,
        discount: discountAmount,
        totalAmount: netTotal,
        appliedCoupon: discountAmount > 0 ? couponCode : undefined,
        unlockedBumperOffer: unlockedOffer ? unlockedOffer.freeItemDescription : undefined,
        priceSnapshot: {
          basePrice: service.basePrice,
          referencePrice: service.referencePrice || Math.round(service.basePrice / 0.85),
          customerSavings: (service.referencePrice || Math.round(service.basePrice / 0.85)) - service.basePrice,
          discountPct: service.discountPct || 15,
          pricingMode: service.pricingMode || 'REFERENCE_PERCENT',
          priceVersion: 'v1.0.0',
          addonsPrice: addonsTotal,
          taxesGst,
          convenienceFee,
          discount: discountAmount,
          totalAmount: netTotal,
          capturedAt: new Date().toISOString()
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'PAY_AFTER_SERVICE' ? 'PENDING' : 'PAID',
        transactionId: 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        startOtp,
        completionOtp,
        status: 'SEARCHING_PROFESSIONAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const created = await createNewBooking(newBookingRecord);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      onClose();
      onBookingSuccess(created);
    } catch (err) {
      console.error('Booking failed:', err);
      alert('Failed to place booking. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xl overflow-y-auto">
      {/* iOS Water 3D Liquid Glass Card */}
      <div 
        id="booking-flow-card"
        className="w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/80 ring-1 ring-black/5 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* iOS Water Gradient Shimmer Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] flex items-center justify-between bg-gradient-to-r from-white via-[#F8F9FB] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#B8892E]/20 to-[#D4A24E]/10 border border-[#B8892E]/30 flex items-center justify-center text-[#B8892E] font-black text-sm shadow-xs">
              {step}/3
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#1C1C1E]">
                {step === 1 && '1. Add-Ons & Cleaning Slot'}
                {step === 2 && '2. Live Location & Service Address'}
                {step === 3 && '3. Summary & Payment'}
              </h3>
              <p className="text-xs text-[#8E8E93] truncate max-w-xs sm:max-w-md">
                {service.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[72vh] overflow-y-auto space-y-6">
          
          {/* STEP 1: ADDONS & SCHEDULE */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Optional Add-Ons */}
              {service.addons && service.addons.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-3">
                    Recommended Add-ons for this Cleaning
                  </label>
                  <div className="space-y-2.5">
                    {service.addons.map((addon) => {
                      const isSelected = selectedAddons.some(a => a.id === addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-50/70 border-[#B8892E] shadow-xs'
                              : 'bg-white/80 border-[#E5E5EA] hover:border-[#B8892E]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                              isSelected ? 'bg-[#B8892E] border-[#B8892E] text-white' : 'border-[#D1D1D6]'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm font-bold text-[#1C1C1E] block">
                                {addon.name}
                              </span>
                              {addon.description && (
                                <span className="text-[11px] text-[#8E8E93]">
                                  {addon.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-[#1C1C1E]">
                            +₹{addon.price}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date & Slot Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B8892E]" />
                    <span>Select Date</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#B8892E]" />
                    <span>Select Time Slot</span>
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                  >
                    <option value="8 AM - 10 AM">8 AM - 10 AM (Morning Early)</option>
                    <option value="10 AM - 1 PM">10 AM - 1 PM (Prime Morning)</option>
                    <option value="1 PM - 4 PM">1 PM - 4 PM (Afternoon)</option>
                    <option value="4 PM - 7 PM">4 PM - 7 PM (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Unlocked Offer Badge */}
              {unlockedOffer && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-[#E07B1A] tracking-wider block">
                      🎉 {unlockedOffer.badge} UNLOCKED!
                    </span>
                    <p className="text-xs font-semibold text-[#1C1C1E]">
                      {unlockedOffer.freeItemDescription} (₹{unlockedOffer.freeItemValue} value) added to order!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: LIVE GEOLOCATION & ADDRESS */}
          {step === 2 && (
            <div className="space-y-4">
              
              {/* iOS Water 3D Live GPS Auto-Detect Button */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-amber-50/50 border border-blue-200/80 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-[#1C1C1E] flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      Live GPS Geographic Location
                    </span>
                    <p className="text-[11px] text-[#636366]">
                      Automatically capture your exact latitude, longitude, and street address.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectLiveLocation}
                    disabled={detectingLocation}
                    className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        <span>Detect My Location</span>
                      </>
                    )}
                  </button>
                </div>

                {geoStatusMsg && (
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 py-1.5 px-3 rounded-lg flex items-center gap-1.5 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{geoStatusMsg}</span>
                  </div>
                )}
              </div>

              {/* Hub & Sector Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                    Operating Hub / Region
                  </label>
                  <select
                    value={selectedHub.id}
                    onChange={(e) => {
                      const h = availableHubs.find(x => x.id === e.target.value) || availableHubs[0];
                      setSelectedHub(h);
                      if (h.coveredSectors && h.coveredSectors.length > 0) {
                        setSelectedSector(h.coveredSectors[0]);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-xs sm:text-sm outline-none font-medium"
                  >
                    {availableHubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.city} ({h.name} &bull; {h.serviceRadiusKm}km)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                    Sector / Locality
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-xs sm:text-sm outline-none font-medium"
                  >
                    {(selectedHub.coveredSectors || ['Sector 1', 'Main Market', 'Central Area']).map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Complete Street Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                  House / Flat / Street / Landmark
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-[#8E8E93]" />
                  <textarea
                    rows={2}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. Flat 602, Tower B, Palm Springs Residency, Near Galleria Market"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-[#8E8E93]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikramaditya Sharma"
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                    WhatsApp &amp; Contact Mobile
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-[#8E8E93]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="8920252647"
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Pincode & Dispatch Info */}
              <div className="flex items-center justify-between text-xs text-[#8E8E93] p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Hub Coverage Area</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-[#1C1C1E]">
                  <span>Pincode:</span>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-16 px-1.5 py-0.5 rounded bg-white border border-[#D1D1D6] text-xs text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BILLING & PAYMENT */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Order Summary Card */}
              <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-[#1C1C1E]">{service.name}</h4>
                    <span className="text-xs text-[#8E8E93]">
                      {selectedDate} &bull; {selectedSlot}
                    </span>
                    <p className="text-[11px] text-[#636366] mt-0.5">
                      {streetAddress}, {selectedSector}, {selectedHub.city}
                    </p>
                  </div>
                  <span className="font-black text-sm text-[#1C1C1E]">
                    ₹{service.basePrice}
                  </span>
                </div>

                {selectedAddons.map(addon => (
                  <div key={addon.id} className="flex justify-between text-xs text-[#636366]">
                    <span>+ {addon.name}</span>
                    <span>₹{addon.price}</span>
                  </div>
                ))}

                {/* Promo Code Form */}
                <form onSubmit={handleApplyCoupon} className="pt-2 border-t border-[#E5E5EA] flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon Code (e.g. BHARAT500)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#D1D1D6] text-xs font-mono uppercase font-bold outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold hover:bg-black"
                  >
                    Apply
                  </button>
                </form>
                {couponMessage && (
                  <p className="text-[11px] font-bold text-emerald-700">{couponMessage}</p>
                )}

                {/* Financial Breakdown */}
                <div className="pt-2 border-t border-[#E5E5EA] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#8E8E93]">
                    <span>Subtotal</span>
                    <span>₹{rawSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-[#8E8E93]">
                    <span>GST (18%)</span>
                    <span>₹{taxesGst}</span>
                  </div>
                  <div className="flex justify-between text-[#8E8E93]">
                    <span>Convenience &amp; Hub Safety Fee</span>
                    <span>₹{convenienceFee}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount Coupon</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base font-black text-[#1C1C1E] pt-2 border-t border-[#E5E5EA]">
                    <span>Total Amount Payable</span>
                    <span className="text-[#B8892E]">₹{netTotal}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-2">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'border-[#B8892E] bg-amber-50/70 shadow-xs'
                        : 'border-[#E5E5EA] bg-white hover:bg-[#F8F9FB]'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#1C1C1E]">Instant UPI</span>
                    <span className="text-[10px] text-[#8E8E93]">GPay, PhonePe, Paytm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAY_AFTER_SERVICE')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'PAY_AFTER_SERVICE'
                        ? 'border-[#B8892E] bg-amber-50/70 shadow-xs'
                        : 'border-[#E5E5EA] bg-white hover:bg-[#F8F9FB]'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#1C1C1E]">Pay After Service</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Recommended</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'border-[#B8892E] bg-amber-50/70 shadow-xs'
                        : 'border-[#E5E5EA] bg-white hover:bg-[#F8F9FB]'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#1C1C1E]">Cards &amp; Netbanking</span>
                    <span className="text-[10px] text-[#8E8E93]">Debit / Credit</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 border-t border-[#E5E5EA] bg-[#F8F9FB] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#D1D1D6] hover:bg-[#F2F2F7] text-xs font-bold text-[#1C1C1E] transition-all cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="px-6 py-2.5 rounded-2xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F9D976]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmBooking}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <span>Confirm Booking (₹{netTotal})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
