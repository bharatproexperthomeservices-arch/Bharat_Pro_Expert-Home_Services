import React from 'react';
import { X, Phone, MessageSquare, Mail, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <HelpCircle className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit']">Help &amp; Support</h3>
              <p className="text-xs text-blue-200">We are here to assist you with your bookings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-['Inter',sans-serif]">
          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Bharat%20Pro%20Expert%2C%20I%20need%20help%20with%20my%20cleaning%20booking.`}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-start gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 block">WhatsApp Support</span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block font-medium">Instant Live Chat</span>
                <span className="text-[10px] text-emerald-600 font-mono mt-1 block">Replies in ~2 mins</span>
              </div>
            </a>

            <a
              href="tel:8920252647"
              className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-start gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-950 block">Customer Helpline</span>
                <span className="text-[11px] text-blue-700 mt-0.5 block font-medium">8920252647</span>
                <span className="text-[10px] text-blue-600 font-mono mt-1 block">Toll-free / Direct</span>
              </div>
            </a>
          </div>

          {/* Operating Hours */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-slate-700">
              <span className="font-bold text-slate-900">Support Hours: </span>
              8:00 AM – 9:00 PM (Monday to Sunday, 365 Days)
            </div>
          </div>

          {/* Email Support */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-slate-700">
              <span className="font-bold text-slate-900">Official Support: </span>
              <a href="mailto:support@bharatproexpert.com" className="text-blue-700 hover:underline font-medium">
                support@bharatproexpert.com
              </a>
            </div>
          </div>

          {/* FAQs */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Frequently Asked Questions
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">How do I track my assigned professional?</span>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  Go to "My Account" or "Track Booking" to see real-time updates and contact your verified professional.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Can I reschedule or cancel a booking?</span>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  Yes, free rescheduling is available up to 2 hours prior to the booked slot time via WhatsApp or your account portal.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Are the chemicals and equipment hospital-grade?</span>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  Yes, 100% genuine Diversey &amp; Taski hospital-grade eco-certified chemicals and single-use microfiber pads are provided.
                </p>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium text-[11px]">
              Bharat Pro 100% Satisfaction Guarantee with free rework within 24 hours if not satisfied.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
