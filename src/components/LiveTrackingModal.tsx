import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { updateBookingStatusWithOtp, subscribeToBooking } from '../services/dbService';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  User, 
  Star, 
  Download, 
  X, 
  MessageSquare,
  Navigation,
  FileText,
  Sparkles,
  Calendar,
  Check,
  Radio,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface LiveTrackingModalProps {
  booking: Booking;
  onClose: () => void;
  onBookingUpdated?: (updated: Booking) => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  booking: initialBooking,
  onClose,
  onBookingUpdated
}) => {
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [showFullReceipt, setShowFullReceipt] = useState(false);
  const [justAssignedAnimation, setJustAssignedAnimation] = useState(false);

  // REAL-TIME AUTO-UPDATE (Firestore Listener + LocalStorage Event + Fallback Polling)
  useEffect(() => {
    const unsubscribe = subscribeToBooking(initialBooking.id, (updatedBooking) => {
      if (updatedBooking) {
        // Trigger highlight if professional was just assigned
        if (!booking.assignedPartnerId && updatedBooking.assignedPartnerId) {
          setJustAssignedAnimation(true);
          setTimeout(() => setJustAssignedAnimation(false), 3000);
        }
        setBooking(updatedBooking);
        onBookingUpdated?.(updatedBooking);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [initialBooking.id]);

  const isSearching = !booking.assignedPartnerId || 
    booking.status === 'SEARCHING_PROFESSIONAL' || 
    booking.status === 'PENDING';

  // Status index for progress bar
  const pipeline = [
    { key: 'SEARCHING_PROFESSIONAL', label: 'Searching Professional' },
    { key: 'ASSIGNED', label: 'Professional Assigned' },
    { key: 'ON_THE_WAY', label: 'On The Way' },
    { key: 'IN_PROGRESS', label: 'Service In Progress' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const getPipelineIndex = (status: Booking['status']) => {
    if (status === 'SEARCHING_PROFESSIONAL' || status === 'PENDING') return 0;
    if (status === 'ASSIGNED' || status === 'CONFIRMED' || status === 'PARTNER_ASSIGNED' || status === 'ACCEPTED') return 1;
    if (status === 'ON_THE_WAY' || status === 'PARTNER_ON_THE_WAY' || status === 'ARRIVED') return 2;
    if (status === 'IN_PROGRESS' || status === 'STARTED') return 3;
    if (status === 'COMPLETED') return 4;
    return 0;
  };

  const currentIdx = getPipelineIndex(booking.status);

  // Partner or Customer triggers OTP simulation verification
  const handleVerifyStartOtp = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await updateBookingStatusWithOtp(booking.id, 'IN_PROGRESS', enteredOtp);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to start job.');
      } else if (res.booking) {
        setBooking(res.booking);
        onBookingUpdated?.(res.booking);
        setSuccessMsg('Job successfully started! Service timer is now running.');
        setEnteredOtp('');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCompletionOtp = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await updateBookingStatusWithOtp(booking.id, 'COMPLETED', enteredOtp);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to complete job.');
      } else if (res.booking) {
        setBooking(res.booking);
        onBookingUpdated?.(res.booking);
        setSuccessMsg('Job completed successfully! Final tax invoice generated.');
        setEnteredOtp('');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    const invoiceText = `
========================================
BHARAT PRO EXPERT HOME SERVICES
TAX INVOICE & SERVICE SUMMARY
========================================
Invoice Number: INV-${booking.bookingNumber}
Date: ${new Date(booking.createdAt).toLocaleDateString('en-IN')}
Status: ${booking.status}

CUSTOMER DETAILS:
Name: ${booking.customerName}
Phone: ${booking.customerPhone}
Email: ${booking.customerEmail}
Address: ${booking.address.street}, ${booking.address.sector}, ${booking.address.city}

SERVICE EXECUTED:
1. ${booking.serviceName} - ₹${booking.basePrice}
${(booking.selectedAddons || []).map(a => `   + Add-on: ${a.name} - ₹${a.price}`).join('\n')}
${booking.unlockedBumperOffer ? `   🎁 Unlocked Bumper Offer: ${booking.unlockedBumperOffer} (₹0.00)` : ''}

FINANCIAL BREAKDOWN:
Base & Add-ons: ₹{booking.basePrice + (booking.addonsPrice || 0)}
Taxes (GST 18%): ₹${booking.taxesGst}
Platform Convenience Fee: ₹${booking.convenienceFee}
Discount: -₹${booking.discount}
----------------------------------------
TOTAL PAID: ₹${booking.totalAmount} (INR)
Payment Method: ${booking.paymentMethod}
Transaction ID: ${booking.transactionId || 'TXN_BPE_' + booking.bookingNumber}
Partner Assigned: ${booking.assignedPartnerName || 'Assigned by Bharat Pro Dispatch Hub'}
========================================
Thank you for choosing Bharat Pro Expert!
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([invoiceText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice_${booking.bookingNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const partnerCleanPhone = (booking.assignedPartnerPhone || '').replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div 
        id="live-tracking-modal-card"
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-white/60 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F8F9FB]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/5 text-[#1C1C1E]">
                #{booking.bookingNumber}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isSearching 
                  ? 'bg-amber-100 text-amber-900 animate-pulse border border-amber-300'
                  : booking.status === 'COMPLETED' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : booking.status === 'IN_PROGRESS' || booking.status === 'STARTED'
                  ? 'bg-purple-100 text-purple-900 animate-pulse'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isSearching ? 'SEARCHING ON HUB' : booking.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-[#1C1C1E] mt-1">
              {booking.serviceName}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 max-h-[78vh] overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. STATE A: "FINDING THE BEST PROFESSIONAL ON HUB" (Apple Design) */}
          {/* ================================================================= */}
          {isSearching ? (
            <div className="space-y-6 text-center">
              {/* Confirmed Banner */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Booking Confirmed ✓</span>
              </div>

              {/* Apple-style Radar & Pulse Animation */}
              <div className="relative py-6 flex items-center justify-center">
                {/* Ripple concentric rings */}
                <div className="absolute w-44 h-44 rounded-full border border-[#D4A24E]/20 animate-ping opacity-30" />
                <div className="absolute w-36 h-36 rounded-full border-2 border-[#D4A24E]/30 animate-pulse" />
                <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-[#D4A24E]/15 to-[#B8892E]/10 blur-sm" />
                
                {/* Center Hub Core */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] border-2 border-[#D4A24E] shadow-xl flex items-center justify-center text-white">
                  <Sparkles className="w-8 h-8 text-[#F9D976] animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>

              {/* Primary Headings specified in prompt */}
              <div className="space-y-2 max-w-lg mx-auto">
                <h4 className="text-xl sm:text-2xl font-black font-['Outfit'] text-[#1C1C1E] tracking-tight">
                  Finding the best professional on Hub
                </h4>
                <p className="text-xs sm:text-sm text-[#636366] leading-relaxed">
                  Our team is matching your booking with an available professional. Please wait while our team assigns a professional to your booking.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F2F7] text-[11px] text-[#8E8E93] font-medium mt-1">
                  <Radio className="w-3 h-3 text-[#B8892E] animate-pulse" />
                  <span>Real-time dispatch hub active &bull; No automatic matching</span>
                </div>
              </div>

              {/* Order Snapshot Card */}
              <div className="p-5 rounded-3xl bg-[#F8F9FB] border border-[#E5E5EA] text-left space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E5EA]">
                  <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Booking ID</span>
                  <span className="font-mono text-xs font-bold text-[#1C1C1E]">#{booking.bookingNumber}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8E8E93] block text-[11px]">Service</span>
                    <span className="font-bold text-[#1C1C1E]">{booking.serviceName}</span>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] block text-[11px]">Schedule</span>
                    <span className="font-bold text-[#1C1C1E]">{booking.date} &bull; {booking.timeSlot}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#8E8E93] block text-[11px]">Location</span>
                    <span className="font-semibold text-[#1C1C1E] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#B8892E] shrink-0" />
                      {booking.address.street}, {booking.address.sector}, {booking.address.city}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E5EA] flex justify-between items-center text-xs">
                  <span className="text-[#8E8E93]">Total Amount:</span>
                  <span className="font-black text-sm text-[#1C1C1E]">
                    ₹{booking.totalAmount} <span className="text-xs font-normal text-[#8E8E93]">({booking.paymentMethod})</span>
                  </span>
                </div>
              </div>

              {/* Helpful assurance info */}
              <div className="p-4 rounded-2xl bg-[#FFF9F2] border border-[#F0D5AA] text-left text-xs text-[#8A5816] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D4A24E]" />
                  Bharat Pro Quality Guarantee
                </p>
                <p className="text-[11px] leading-relaxed text-[#7A4E12]">
                  We manually review technician ratings, equipment standards, and vaccination records before confirming assignment. You will see your expert&apos;s photo and contact details here immediately once approved.
                </p>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* 2. STATE B: "PROFESSIONAL ASSIGNED" (Apple Design)                */
            /* ================================================================= */
            <div className={`space-y-6 transition-all ${justAssignedAnimation ? 'animate-bounce' : ''}`}>
              {/* Confirmed Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-900">
                      Your professional has been assigned
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Your professional is on the way &bull; Verified Bharat Pro Expert
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-1 rounded bg-white text-emerald-800 shadow-xs">
                  READY
                </span>
              </div>

              {/* High-Fidelity Apple Card for Assigned Professional */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-lg space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Professional Photo */}
                    <div className="relative">
                      {booking.assignedPartnerAvatar ? (
                        <img 
                          src={booking.assignedPartnerAvatar} 
                          alt={booking.assignedPartnerName} 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4A24E] shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] text-white flex items-center justify-center font-bold text-xl border-2 border-[#D4A24E]">
                          <User className="w-8 h-8 text-[#F9D976]" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs" title="Verified Expert">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Partner Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#1C1C1E]">
                          {booking.assignedPartnerName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Active Lead
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#8E8E93]">
                        <span className="flex items-center gap-1 font-bold text-[#B8892E] bg-[#FFF8F0] px-2 py-0.5 rounded-md border border-[#F0D5AA]">
                          <Star className="w-3.5 h-3.5 fill-[#B8892E]" /> {booking.partnerRating || 4.85}
                        </span>
                        <span>&bull;</span>
                        <span className="font-medium text-[#48484A]">
                          {booking.partnerCompletedJobs || 340}+ Completed Jobs
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono text-[#8E8E93]">
                          ID: BPE-{booking.assignedPartnerId || 'P1024'}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-1.5">
                        <span className="font-semibold text-[#1C1C1E]">{booking.serviceName}</span>
                        <span>&bull;</span>
                        <span>{booking.assignedHubName || (booking.address.city + ' Hub')}</span>
                        {booking.assignedAt && (
                          <>
                            <span>&bull;</span>
                            <span>Assigned {new Date(booking.assignedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Apple-Style Quick Action Buttons (Call, Chat, Track, View) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#F2F2F7]">
                  {/* Call Button */}
                  <a
                    href={`tel:${booking.assignedPartnerPhone || '+918920252647'}`}
                    className="p-2.5 rounded-2xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Call Expert</span>
                  </a>

                  {/* Chat / WhatsApp Button */}
                  <a
                    href={`https://wa.me/${partnerCleanPhone || '918920252647'}?text=${encodeURIComponent(`Hi ${booking.assignedPartnerName}, I am contacting regarding my Bharat Pro booking #${booking.bookingNumber} for ${booking.serviceName}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Track Professional Button */}
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="p-2.5 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#B8892E]" />
                    <span>{showMap ? 'Hide Route' : 'Track Live'}</span>
                  </button>

                  {/* View Booking / Receipt Button */}
                  <button
                    type="button"
                    onClick={() => setShowFullReceipt(!showFullReceipt)}
                    className="p-2.5 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>{showFullReceipt ? 'Hide Details' : 'View Booking'}</span>
                  </button>
                </div>
              </div>

              {/* MANDATORY DUAL OTP CARD (Bharat Pro Verification Terminal) */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1C1C1E] to-[#2C2C2E] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8892E]/20 rounded-full blur-2xl" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs uppercase tracking-wider text-[#D4A24E] font-bold">
                      {booking.status === 'IN_PROGRESS' || booking.status === 'STARTED'
                        ? 'Job In Progress &bull; Completion OTP'
                        : 'Share With Expert Upon Arrival'}
                    </span>
                    <h4 className="text-lg font-bold font-['Outfit']">
                      {booking.status === 'IN_PROGRESS' || booking.status === 'STARTED'
                        ? 'Service Completion Code'
                        : 'Start Service OTP'}
                    </h4>
                    <p className="text-xs text-white/70">
                      {booking.status === 'IN_PROGRESS' || booking.status === 'STARTED'
                        ? 'Share this code once the deep cleaning has been thoroughly inspected.'
                        : 'Your expert requires this 4-digit code to start the official German equipment.'}
                    </p>
                  </div>

                  {/* OTP Digits */}
                  <div className="bg-white/10 backdrop-blur-md border border-[#D4A24E]/40 px-6 py-3 rounded-2xl text-center shrink-0">
                    <span className="text-3xl font-black font-mono tracking-widest text-[#F9D976]">
                      {booking.status === 'IN_PROGRESS' || booking.status === 'STARTED'
                        ? booking.completionOtp
                        : booking.startOtp}
                    </span>
                    <span className="block text-[10px] text-white/70 mt-1 uppercase font-semibold">
                      Secured OTP
                    </span>
                  </div>
                </div>
              </div>

              {/* Technician Simulation Verification Terminal */}
              {(booking.status === 'ASSIGNED' || 
                booking.status === 'CONFIRMED' || 
                booking.status === 'PARTNER_ASSIGNED' || 
                booking.status === 'ON_THE_WAY' || 
                booking.status === 'ARRIVED' || 
                booking.status === 'IN_PROGRESS' || 
                booking.status === 'STARTED') && (
                <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#B8892E]" />
                      Partner OTP Verification Terminal
                    </h5>
                    <span className="text-[11px] text-[#8E8E93]">
                      {booking.status === 'IN_PROGRESS' || booking.status === 'STARTED' ? 'Verify Completion' : 'Verify Start'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder={booking.status === 'IN_PROGRESS' || booking.status === 'STARTED' ? `Enter Completion OTP (${booking.completionOtp})` : `Enter Start OTP (${booking.startOtp})`}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-[#D1D1D6] font-mono text-sm outline-none text-center font-bold text-[#1C1C1E]"
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={booking.status === 'IN_PROGRESS' || booking.status === 'STARTED' ? handleVerifyCompletionOtp : handleVerifyStartOtp}
                      className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] text-white font-bold text-xs hover:bg-black transition-all"
                    >
                      {loading ? 'Verifying...' : booking.status === 'IN_PROGRESS' || booking.status === 'STARTED' ? 'Finish Job' : 'Start Job'}
                    </button>
                  </div>
                </div>
              )}

              {/* Service Milestones Pipeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-3">
                  Live Service Milestones
                </h4>
                <div className="space-y-2">
                  {pipeline.map((item, idx) => {
                    const isPassed = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div 
                        key={item.key}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          isCurrent 
                            ? 'border-[#B8892E] bg-[#D4A24E]/5 shadow-sm font-bold text-[#1C1C1E]' 
                            : isPassed 
                            ? 'border-emerald-200 bg-emerald-50/50 text-[#1C1C1E]' 
                            : 'border-transparent opacity-40 text-[#8E8E93]'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isPassed ? 'bg-[#1F8A3B] text-white' : 'bg-[#E5E5EA] text-[#8E8E93]'
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className="text-xs sm:text-sm">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google Maps Live Route Tracking (Toggleable) */}
              {showMap && (
                <div className="rounded-3xl overflow-hidden border border-[#E5E5EA] bg-[#F2F2F7]">
                  <div className="p-3 bg-white border-b border-[#E5E5EA] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1F8A3B]" />
                      Customer Location: {booking.address.sector}, {booking.address.city}
                    </span>
                    <span className="text-[11px] text-[#8E8E93]">
                      {booking.status === 'COMPLETED' ? 'Job Completed' : 'Partner En Route'}
                    </span>
                  </div>
                  <iframe
                    title="Technician live tracking route"
                    src={`https://maps.google.com/maps?q=${booking.address.lat || 28.4595},${booking.address.lng || 77.0266}&z=14&output=embed`}
                    className="w-full h-48 border-0"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Expandable Full Booking Breakdown */}
              {showFullReceipt && (
                <div className="p-4 rounded-3xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-2">
                  <h5 className="font-bold text-[#1C1C1E] uppercase tracking-wider text-[11px]">
                    Detailed Order Breakdown
                  </h5>
                  <div className="flex justify-between text-[#48484A]">
                    <span>Base Service ({booking.serviceName})</span>
                    <span>₹{booking.basePrice}</span>
                  </div>
                  {(booking.selectedAddons || []).map(a => (
                    <div key={a.id} className="flex justify-between text-[#48484A]">
                      <span>+ {a.name}</span>
                      <span>₹{a.price}</span>
                    </div>
                  ))}
                  {booking.taxesGst > 0 && (
                    <div className="flex justify-between text-[#8E8E93]">
                      <span>GST (18%)</span>
                      <span>₹{booking.taxesGst}</span>
                    </div>
                  )}
                  {booking.convenienceFee > 0 && (
                    <div className="flex justify-between text-[#8E8E93]">
                      <span>Convenience &amp; Safety Fee</span>
                      <span>₹{booking.convenienceFee}</span>
                    </div>
                  )}
                  {booking.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Savings</span>
                      <span>-₹{booking.discount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#E5E5EA] flex justify-between font-black text-sm text-[#1C1C1E]">
                    <span>Total Amount</span>
                    <span>₹{booking.totalAmount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5EA] bg-[#F8F9FB] flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="px-4 py-2.5 rounded-xl border border-[#D1D1D6] hover:bg-white text-[#1C1C1E] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Tax Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#1C1C1E] text-white text-xs sm:text-sm font-bold hover:bg-black transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
