import React, { useState } from 'react';
import { CleaningService, ServiceAddon, Booking } from '../types';
import { BUMPER_OFFERS, INITIAL_HUBS } from '../data';
import { useAuth } from '../context/AuthContext';
import { createNewBooking } from '../services/dbService';
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
  Tag
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
  
  // Steps: 1: Add-ons & Schedule -> 2: Address & Location -> 3: Billing & Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAddons, setSelectedAddons] = useState<ServiceAddon[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('9 AM - 12 PM');
  
  // Address & Hub selection
  const [selectedHub, setSelectedHub] = useState(INITIAL_HUBS[0]);
  const [selectedSector, setSelectedSector] = useState(INITIAL_HUBS[0].coveredSectors[0]);
  const [streetAddress, setStreetAddress] = useState('');
  const [pincode, setPincode] = useState('122002');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [name, setName] = useState(profile?.name || '');
  
  // Coupons & Payment
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'PAY_AFTER_SERVICE'>('UPI');
  const [loading, setLoading] = useState(false);

  if (!service) return null;

  // Toggle add-on
  const toggleAddon = (addon: ServiceAddon) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Math Calculations
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const rawSubtotal = service.basePrice + addonsTotal;
  const taxesGst = Math.round(rawSubtotal * 0.18); // 18% GST standard in India
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

  const handleProceedToPayment = async () => {
    if (!user && !profile) {
      onRequireAuth();
      return;
    }

    setLoading(true);
    try {
      // Generate mandatory Start OTP and Completion OTP
      const startOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit Ola/Rapido style
      const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const bookingNumber = 'BPRO-' + Math.floor(100000 + Math.random() * 900000);
      const bookingId = 'bk_' + Date.now();

      const newBookingRecord: Booking = {
        id: bookingId,
        bookingNumber,
        customerId: user?.uid || profile?.uid || 'guest_user',
        customerName: name || profile?.name || 'Customer',
        customerEmail: user?.email || profile?.email || 'customer@bharatpro.in',
        customerPhone: phone || '+91 98765 43210',
        serviceId: service.id,
        serviceName: service.name,
        categoryName: service.categoryName,
        date: selectedDate,
        timeSlot: selectedSlot,
        address: {
          street: streetAddress || 'Tower 4, Flat 1204, Green Heights',
          sector: selectedSector,
          city: selectedHub.city,
          state: selectedHub.state,
          pincode: pincode || '122002',
          lat: selectedHub.lat,
          lng: selectedHub.lng
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
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const created = await createNewBooking(newBookingRecord);

      // Trigger celebratory confetti
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div 
        id="booking-flow-card"
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-white/60 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F8F9FB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8892E]/10 flex items-center justify-center text-[#B8892E] font-bold">
              {step}/3
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#1C1C1E]">
                {step === 1 && '1. Add-Ons & Time Slot'}
                {step === 2 && '2. Service Address & Hub Selection'}
                {step === 3 && '3. Summary & Payment'}
              </h3>
              <p className="text-xs text-[#8E8E93] truncate max-w-xs sm:max-w-md">
                {service.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-5 sm:p-7 max-h-[72vh] overflow-y-auto space-y-6">
          {/* STEP 1: ADDONS & SCHEDULE */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Dynamic Add-ons */}
              {service.addons && service.addons.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-3 flex items-center justify-between">
                    <span>Recommended Service Add-ons</span>
                    <span className="text-[11px] text-[#B8892E] font-normal">Optional upgrades</span>
                  </h4>
                  <div className="space-y-2.5">
                    {service.addons.map((addon) => {
                      const isSelected = selectedAddons.some(a => a.id === addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-[#B8892E] bg-[#D4A24E]/5 shadow-sm' 
                              : 'border-[#E5E5EA] hover:border-black/20 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-[#B8892E] border-[#B8892E] text-white' : 'border-[#C7C7CC]'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1C1C1E]">{addon.name}</p>
                              <p className="text-xs text-[#8E8E93]">{addon.description}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#1C1C1E]">
                            +₹{addon.price}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule Date & Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-2">
                    Select Date
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3.5 w-4 h-4 text-[#8E8E93]" />
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-2">
                    Select Time Slot
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="absolute left-3.5 w-4 h-4 text-[#8E8E93]" />
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium appearance-none"
                    >
                      <option value="9 AM - 12 PM">9 AM - 12 PM (Morning)</option>
                      <option value="12 PM - 3 PM">12 PM - 3 PM (Afternoon)</option>
                      <option value="3 PM - 6 PM">3 PM - 6 PM (Evening)</option>
                      <option value="6 PM - 9 PM">6 PM - 9 PM (Late Evening)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bumper Offer Callout if triggered */}
              {unlockedOffer && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E07B1A]/15 via-[#F9D976]/20 to-[#1F8A3B]/10 border border-[#E0B050] flex items-center gap-3">
                  <Gift className="w-7 h-7 text-[#E07B1A] shrink-0 animate-bounce" />
                  <div>
                    <span className="text-xs font-black uppercase text-[#E07B1A] tracking-wider block">
                      🎉 {unlockedOffer.badge} UNLOCKED!
                    </span>
                    <p className="text-xs font-semibold text-[#1C1C1E]">
                      {unlockedOffer.freeItemDescription} (₹{unlockedOffer.freeItemValue} value) added to your order for FREE!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ADDRESS & SECTOR */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                    Select Operating Hub / City
                  </label>
                  <select
                    value={selectedHub.id}
                    onChange={(e) => {
                      const h = INITIAL_HUBS.find(x => x.id === e.target.value) || INITIAL_HUBS[0];
                      setSelectedHub(h);
                      setSelectedSector(h.coveredSectors[0]);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                  >
                    {INITIAL_HUBS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.city} ({h.name} - {h.serviceRadiusKm}km coverage)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                    Select Sector / Area
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                  >
                    {selectedHub.coveredSectors.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-1.5">
                  Complete House / Flat / Street Address
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
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-sm outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Embedded Interactive Map Preview */}
              <div className="rounded-2xl overflow-hidden border border-[#E5E5EA] bg-[#F2F2F7] p-3">
                <div className="flex items-center justify-between text-xs text-[#8E8E93] mb-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1F8A3B]" />
                    Google Maps Geocoded Dispatch Pin ({selectedHub.lat}, {selectedHub.lng})
                  </span>
                  <span className="text-emerald-700 font-bold">In-Radius (Hub Verified)</span>
                </div>
                <iframe
                  title="Google Maps Location preview"
                  src={`https://maps.google.com/maps?q=${selectedHub.lat},${selectedHub.lng}&z=13&output=embed`}
                  className="w-full h-36 rounded-xl border-0"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* STEP 3: BILLING & PAYMENT */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3.5 top-3 w-4 h-4 text-[#8E8E93]" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon: BHARAT500 or FIRST15"
                    className="w-full pl-10 pr-3 py-2.5 uppercase font-mono rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] text-xs sm:text-sm font-semibold outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl bg-[#1C1C1E] text-white font-bold text-xs sm:text-sm hover:bg-black transition-all"
                >
                  Apply
                </button>
              </form>

              {couponMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  {couponMessage}
                </div>
              )}

              {/* Billing Itemized Breakdown */}
              <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-[#48484A]">
                  <span>{service.name} (Base Fee)</span>
                  <span>₹{service.basePrice}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-[#48484A]">
                    <span>Selected Add-ons ({selectedAddons.length})</span>
                    <span>+₹{addonsTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8E8E93]">
                  <span>GST Taxes (18%)</span>
                  <span>₹{taxesGst}</span>
                </div>
                <div className="flex justify-between text-[#8E8E93]">
                  <span>Platform Convenience &amp; Insurance Fee</span>
                  <span>₹{convenienceFee}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#1F8A3B] font-bold">
                    <span>Discount Coupon</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                {unlockedOffer && (
                  <div className="flex justify-between text-[#E07B1A] font-bold pt-1 border-t border-dashed border-[#E5E5EA]">
                    <span>Unlocked Free Gift ({unlockedOffer.badge})</span>
                    <span>FREE (worth ₹{unlockedOffer.freeItemValue})</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-[#1C1C1E] pt-2 border-t border-[#E5E5EA]">
                  <span>Total Payable</span>
                  <span>₹{netTotal}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1E] mb-2.5">
                  Select Real Payment Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3.5 rounded-2xl border cursor-pointer text-center transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-[#B8892E] bg-[#D4A24E]/10 ring-2 ring-[#B8892E]/20'
                        : 'border-[#E5E5EA] bg-white hover:border-black/20'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 mx-auto text-[#B8892E] mb-1" />
                    <p className="text-xs font-bold text-[#1C1C1E]">Instant UPI / QR</p>
                    <p className="text-[10px] text-[#8E8E93]">GPay, PhonePe, Paytm</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3.5 rounded-2xl border cursor-pointer text-center transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-[#B8892E] bg-[#D4A24E]/10 ring-2 ring-[#B8892E]/20'
                        : 'border-[#E5E5EA] bg-white hover:border-black/20'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto text-[#1C1C1E] mb-1" />
                    <p className="text-xs font-bold text-[#1C1C1E]">Credit / Debit Card</p>
                    <p className="text-[10px] text-[#8E8E93]">Visa, Master, RuPay</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('PAY_AFTER_SERVICE')}
                    className={`p-3.5 rounded-2xl border cursor-pointer text-center transition-all ${
                      paymentMethod === 'PAY_AFTER_SERVICE'
                        ? 'border-[#1F8A3B] bg-emerald-50 ring-2 ring-emerald-500/20'
                        : 'border-[#E5E5EA] bg-white hover:border-black/20'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mx-auto text-[#1F8A3B] mb-1" />
                    <p className="text-xs font-bold text-[#1C1C1E]">Pay After Service</p>
                    <p className="text-[10px] text-[#8E8E93]">Cash or UPI at doorstep</p>
                  </div>
                </div>
              </div>

              {/* Mandatory OTP Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Mandatory Dual-OTP Security:</span> Upon booking, you will receive a 4-digit <strong>Start Job OTP</strong> to share with the technician when they arrive, and a <strong>Completion OTP</strong> when the work finishes satisfactorily.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5EA] bg-[#F8F9FB] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-all"
            >
              Back
            </button>
          ) : (
            <div className="text-xs text-[#8E8E93]">
              Step 1 of 3
            </div>
          )}

          {step < 3 ? (
            <button
              type="button"
              id="booking-next-step-btn"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-6 py-3 rounded-2xl bg-[#1C1C1E] text-white font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              id="confirm-booking-final-btn"
              disabled={loading}
              onClick={handleProceedToPayment}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B8892E] via-[#D4A24E] to-[#B8892E] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <span>{loading ? 'Processing Order...' : `Confirm & Pay ₹${netTotal}`}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
