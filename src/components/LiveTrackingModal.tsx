import React, { useState } from 'react';
import { Booking } from '../types';
import { updateBookingStatusWithOtp } from '../services/dbService';
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
  FileText
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

  // Status index for progress bar
  const pipeline = [
    { key: 'CONFIRMED', label: 'Booking Confirmed' },
    { key: 'PARTNER_ASSIGNED', label: 'Partner Assigned' },
    { key: 'PARTNER_ON_THE_WAY', label: 'On The Way' },
    { key: 'IN_PROGRESS', label: 'Service In Progress' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const currentIdx = pipeline.findIndex(p => p.key === booking.status);

  // Technician / Partner or Customer triggers OTP simulation verification
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
        setSuccessMsg('Job completed successfully! Final invoice generated.');
        setEnteredOtp('');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    // Generate text/PDF receipt
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
${booking.selectedAddons.map(a => `   + Add-on: ${a.name} - ₹${a.price}`).join('\n')}
${booking.unlockedBumperOffer ? `   🎁 Unlocked Bumper Offer: ${booking.unlockedBumperOffer} (₹0.00)` : ''}

FINANCIAL BREAKDOWN:
Base & Add-ons: ₹${booking.basePrice + booking.addonsPrice}
Taxes (GST 18%): ₹${booking.taxesGst}
Platform Convenience Fee: ₹${booking.convenienceFee}
Discount: -₹${booking.discount}
----------------------------------------
TOTAL PAID: ₹${booking.totalAmount} (INR)
Payment Method: ${booking.paymentMethod}
Transaction ID: ${booking.transactionId || 'N/A'}
Partner Assigned: ${booking.assignedPartnerName || 'Bharat Pro Certified Team'}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div 
        id="live-tracking-modal-card"
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-white/60 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F8F9FB]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/5 text-[#1C1C1E]">
                #{booking.bookingNumber}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                booking.status === 'COMPLETED' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : booking.status === 'IN_PROGRESS'
                  ? 'bg-amber-100 text-amber-900 animate-pulse'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {booking.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-[#1C1C1E] mt-1">
              {booking.serviceName}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MANDATORY OTP DISPLAY BOX (Bharat Pro High Security Verification) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1C1C1E] to-[#2C2C2E] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8892E]/20 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs uppercase tracking-wider text-[#D4A24E] font-bold">
                  {booking.status === 'IN_PROGRESS' ? 'Service In Progress' : 'Share with Technician Upon Arrival'}
                </span>
                <h4 className="text-lg font-bold font-['Outfit']">
                  {booking.status === 'IN_PROGRESS' ? 'Job Completion OTP' : 'Start Job OTP'}
                </h4>
                <p className="text-xs text-white/70">
                  {booking.status === 'IN_PROGRESS' 
                    ? 'Give this to the expert once the deep cleaning is finished.' 
                    : 'The partner requires this 4-digit code to start the service timer.'}
                </p>
              </div>

              {/* OTP Pill */}
              <div className="bg-white/10 backdrop-blur-md border border-[#D4A24E]/40 px-6 py-3 rounded-2xl text-center">
                <span className="text-3xl font-black font-mono tracking-widest text-[#F9D976]">
                  {booking.status === 'IN_PROGRESS' ? booking.completionOtp : booking.startOtp}
                </span>
                <span className="block text-[10px] text-white/70 mt-1 uppercase font-semibold">
                  Secured OTP
                </span>
              </div>
            </div>
          </div>

          {/* Partner & Technician interactive OTP verification tool */}
          {(booking.status === 'CONFIRMED' || booking.status === 'PARTNER_ASSIGNED' || booking.status === 'IN_PROGRESS') && (
            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#B8892E]" />
                  Partner Verification Terminal
                </h5>
                <span className="text-[11px] text-[#8E8E93]">
                  {booking.status === 'IN_PROGRESS' ? 'Verify Completion' : 'Verify Start'}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder={booking.status === 'IN_PROGRESS' ? `Enter Completion OTP (${booking.completionOtp})` : `Enter Start OTP (${booking.startOtp})`}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-[#D1D1D6] font-mono text-sm outline-none text-center font-bold"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={booking.status === 'IN_PROGRESS' ? handleVerifyCompletionOtp : handleVerifyStartOtp}
                  className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] text-white font-bold text-xs hover:bg-black transition-all"
                >
                  {loading ? 'Verifying...' : booking.status === 'IN_PROGRESS' ? 'Finish Job' : 'Start Job'}
                </button>
              </div>
            </div>
          )}

          {/* Real Status Pipeline Visual */}
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
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isCurrent 
                        ? 'border-[#B8892E] bg-[#D4A24E]/5 shadow-sm font-bold' 
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

          {/* Assigned Partner Card */}
          <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#B8892E]/10 flex items-center justify-center text-[#B8892E] font-bold">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#8E8E93]">Assigned Lead Technician</p>
                <h4 className="text-sm font-bold text-[#1C1C1E]">
                  {booking.assignedPartnerName || 'Bharat Pro Central Expert Crew'}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8E8E93]">
                  <span className="flex items-center gap-1 font-semibold text-[#B8892E]">
                    <Star className="w-3.5 h-3.5 fill-[#B8892E]" /> 4.92 Rating
                  </span>
                  <span>&bull;</span>
                  <span>Police Verified &amp; Vaccinated</span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${booking.assignedPartnerPhone || '+919876543210'}`}
              className="p-3 rounded-2xl bg-white border border-[#E5E5EA] hover:bg-black/5 text-[#1C1C1E] shadow-sm transition-all"
              title="Call Technician"
            >
              <Phone className="w-4 h-4 text-[#1F8A3B]" />
            </a>
          </div>

          {/* Embedded Google Maps Live Route Tracking */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E5EA] bg-[#F2F2F7]">
            <div className="p-3 bg-white border-b border-[#E5E5EA] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1F8A3B]" />
                Customer Location: {booking.address.sector}, {booking.address.city}
              </span>
              <span className="text-[11px] text-[#8E8E93]">
                {booking.status === 'COMPLETED' ? 'Service Completed Here' : 'Partner Arrived In Sector'}
              </span>
            </div>
            <iframe
              title="Technician tracking route"
              src={`https://maps.google.com/maps?q=${booking.address.lat},${booking.address.lng}&z=14&output=embed`}
              className="w-full h-44 border-0"
              loading="lazy"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5EA] bg-[#F8F9FB] flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="px-4 py-2.5 rounded-xl border border-[#D1D1D6] hover:bg-white text-[#1C1C1E] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Invoice</span>
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
