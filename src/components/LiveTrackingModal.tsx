import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { updateBookingStatusWithOtp, subscribeToBooking } from '../services/dbService';
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
    if (status === 'SEARCHING_PROFESSIONAL' || status === 'PENDING') return 0;
    if (status === 'ASSIGNED' || status === 'CONFIRMED' || status === 'PARTNER_ASSIGNED' || status === 'ACCEPTED') return 1;
    if (status === 'ON_THE_WAY' || status === 'PARTNER_ON_THE_WAY') return 2;
    if (status === 'ARRIVED') return 3;
    if (status === 'IN_PROGRESS' || status === 'STARTED') return 4;
    if (status === 'COMPLETED') return 5;
    return 0;
  };

  const currentIdx = getPipelineIndex(booking.status);

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
        setSuccessMsg('Job successfully started! Cleaning is now in progress.');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateStatus = async (targetStatus: Booking['status']) => {
    setLoading(true);
    try {
      const res = await updateBookingStatusWithOtp(booking.id, targetStatus, booking.startOtp);
      if (res.booking) {
        setBooking(res.booking);
        onBookingUpdated?.(res.booking);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

          {/* Assigned Professional Card */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt="Assigned Pro"
                  className="w-12 h-12 rounded-full object-cover border border-[#2FA84F]"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2FA84F] border-2 border-white flex items-center justify-center text-[8px] text-white">
                  ✓
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#0B2A4A]">Rakesh Kumar (Lead Specialist)</h4>
                  <span className="text-[10px] font-bold bg-[#EBF8EE] text-[#2FA84F] px-2 py-0.5 rounded-full">
                    Aadhaar Verified
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>4.94 (340+ homes)</span>
                  </span>
                  <span>&bull;</span>
                  <span>Diversey Certified Specialist</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:+918920252647"
                className="px-3.5 py-1.5 rounded-full bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Pro</span>
              </a>
            </div>
          </div>

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
              <span className="text-gray-500">Total Payable:</span>
              <span className="font-extrabold text-[#2FA84F] text-sm">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Simulation Controls for testing */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Progress demo:</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => handleSimulateStatus('ON_THE_WAY')} 
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#0B2A4A] rounded cursor-pointer"
              >
                On Way
              </button>
              <button 
                onClick={() => handleSimulateStatus('ARRIVED')} 
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#0B2A4A] rounded cursor-pointer"
              >
                Arrived
              </button>
              <button 
                onClick={() => handleSimulateStatus('IN_PROGRESS')} 
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#0B2A4A] rounded cursor-pointer"
              >
                Started
              </button>
              <button 
                onClick={() => handleSimulateStatus('COMPLETED')} 
                className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold cursor-pointer"
              >
                Complete
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Need urgent help? <a href="tel:+919876543210" className="font-bold text-[#0B2A4A] hover:underline">Call Helpline</a>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0B2A4A] hover:bg-[#071E36] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
};
