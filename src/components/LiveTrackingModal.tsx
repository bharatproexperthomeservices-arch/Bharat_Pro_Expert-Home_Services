import React, { useState, useEffect } from 'react';
import { Booking, CustomerInvoice } from '../types';
import { updateBookingStatusWithOtp, subscribeToBooking } from '../services/dbService';
import { generateCustomerInvoice } from '../services/settlementService';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  User, 
  Star, 
  Download, 
  X, 
  Navigation, 
  FileText, 
  Check, 
  ArrowRight,
  MessageCircle,
  AlertCircle
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoice, setInvoice] = useState<CustomerInvoice | null>(null);

  // Real-time listener
  useEffect(() => {
    const unsubscribe = subscribeToBooking(initialBooking.id, (updatedBooking) => {
      if (updatedBooking) {
        setBooking(updatedBooking);
        onBookingUpdated?.(updatedBooking);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [initialBooking.id]);

  // Status index for progress bar
  const pipeline = [
    { key: 'CONFIRMED', label: 'Booking Confirmed' },
    { key: 'ASSIGNED', label: 'Pro Assigned' },
    { key: 'ON_THE_WAY', label: 'On The Way' },
    { key: 'ARRIVED', label: 'Arrived' },
    { key: 'IN_PROGRESS', label: 'Cleaning Started' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const getPipelineIndex = (status: Booking['status']) => {
    if (status === 'SEARCHING_PROFESSIONAL' || status === 'PENDING' || status === 'ASSIGNMENT_PENDING' || status === 'PAYMENT_CONFIRMED') return 0;
    if (status === 'ASSIGNED' || status === 'CONFIRMED' || status === 'PARTNER_ASSIGNED' || status === 'ACCEPTED' || status === 'PARTNER_ACCEPTED') return 1;
    if (status === 'ON_THE_WAY' || status === 'PARTNER_ON_THE_WAY') return 2;
    if (status === 'ARRIVED') return 3;
    if (status === 'IN_PROGRESS' || status === 'STARTED') return 4;
    if (status === 'COMPLETED' || status === 'SETTLED') return 5;
    return 0;
  };

  const currentIdx = getPipelineIndex(booking.status);

  const handleOpenInvoice = () => {
    const inv = generateCustomerInvoice(booking);
    setInvoice(inv);
    setShowInvoiceModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] overflow-hidden relative my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col font-['Inter',sans-serif]"
      >
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0B2A4A] text-white flex items-center justify-center">
              <Navigation className="w-4 h-4 text-[#F5A400]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B2A4A]">Live Pro Tracking</h3>
              <span className="text-[11px] text-gray-500 font-mono">#{booking.bookingNumber || booking.id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-[#0B2A4A] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Status Pipeline */}
          <div className="p-4 rounded-xl bg-[#EEF7FD] border border-[#D0E7F9]">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#0B2A4A] mb-3">
              <span>Status: <strong className="text-[#2FA84F] uppercase">{pipeline[currentIdx].label}</strong></span>
              <span>ETA: ~15 mins arrival</span>
            </div>

            {/* Pipeline Step Tracker */}
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-[#2FA84F] -translate-y-1/2 z-0 transition-all duration-300"
                style={{ width: `${(currentIdx / (pipeline.length - 1)) * 100}%` }}
              ></div>

              {pipeline.map((step, idx) => {
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isPassed ? 'bg-[#2FA84F] text-white' : 'bg-gray-200 text-gray-500'
                    } ${isCurrent ? 'ring-4 ring-[#2FA84F]/20' : ''}`}>
                      {isPassed ? '✓' : idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between text-[9px] text-gray-500 font-medium mt-2">
              <span>Confirmed</span>
              <span>Assigned</span>
              <span>On Way</span>
              <span>Arrived</span>
              <span>Started</span>
              <span>Done</span>
            </div>
          </div>

          {/* Assigned Professional Card or Truthful Waiting State */}
          {booking.assignedPartnerId ? (
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-[#0B2A4A] text-white flex items-center justify-center font-bold text-base border-2 border-[#2FA84F]">
                    {booking.assignedPartnerName?.charAt(0) || 'P'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2FA84F] border-2 border-white flex items-center justify-center text-[8px] text-white">
                    ✓
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#0B2A4A]">{booking.assignedPartnerName}</h4>
                    <span className="text-[10px] font-bold bg-[#EBF8EE] text-[#2FA84F] px-2 py-0.5 rounded-full">
                      Verified Pro ✓
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{booking.partnerRating || '4.88'}</span>
                    </span>
                    <span>&bull;</span>
                    <span>Diversey Taski Certified</span>
                  </div>
                </div>
              </div>

              {booking.assignedPartnerPhone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${booking.assignedPartnerPhone}`}
                    className="px-3.5 py-1.5 rounded-full bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Pro</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-1">
              <span className="font-bold text-[#0B2A4A] block text-sm">
                Your booking is confirmed. Our team is assigning a professional to your booking.
              </span>
              <p className="text-gray-600">
                Admin dispatch is reviewing certified specialists in your hub sector. Your assigned professional details, photo, and direct phone link will appear here as soon as assigned.
              </p>
            </div>
          )}

          {/* OTP Verification & Safety Box */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B2A4A] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F5A400]" />
                <span>Dual OTP Gate (Customer Safety)</span>
              </span>
              <span className="text-[10px] text-amber-900 font-semibold">Share only when pro arrives</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Start Job OTP</span>
                <span className="text-xl font-mono font-black text-[#0B2A4A] tracking-widest">{booking.startOtp}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Completion OTP</span>
                <span className="text-xl font-mono font-black text-[#2FA84F] tracking-widest">{booking.completionOtp}</span>
              </div>
            </div>
          </div>

          {/* Service & Location Summary */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Service:</span>
              <span className="font-bold text-[#0B2A4A]">{booking.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date &amp; Slot:</span>
              <span className="font-bold text-[#0B2A4A]">{booking.date} at {booking.timeSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Address:</span>
              <span className="font-bold text-[#0B2A4A] text-right truncate max-w-[280px]">{booking.address.street}, {booking.address.city}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-extrabold text-[#2FA84F] text-sm">₹{booking.totalAmount.toLocaleString('en-IN')} ({booking.paymentStatus})</span>
            </div>
          </div>

          {/* Official Tax Invoice Download Button */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Need official bill for GST claim?</span>
            <button
              onClick={handleOpenInvoice}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#0B2A4A] text-[#0B2A4A] font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-50 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official GST Invoice</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Need help? <a href="tel:+918920252647" className="font-bold text-[#0B2A4A] hover:underline">Customer Support</a>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0B2A4A] hover:bg-[#071E36] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Tracking
          </button>
        </div>

        {/* INVOICE MODAL */}
        {showInvoiceModal && invoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <div>
                  <h3 className="font-bold text-base text-[#0B2A4A]">Bharat Pro Expert Tax Invoice</h3>
                  <span className="text-[11px] text-gray-500">GSTIN: {invoice.companyGstin} &bull; SAC: {invoice.sacCode}</span>
                </div>
                <button onClick={() => setShowInvoiceModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Number:</span>
                  <span className="font-mono font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking Reference:</span>
                  <span className="font-mono font-bold">#{invoice.bookingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-bold">{invoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxable Value:</span>
                  <span>₹{invoice.taxableAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CGST (2.5%):</span>
                  <span>₹{invoice.cgst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SGST (2.5%):</span>
                  <span>₹{invoice.sgst}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm text-[#0B2A4A]">
                  <span>Total Paid:</span>
                  <span>₹{invoice.totalPaid}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold cursor-pointer"
                >
                  Print / Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingModal;
