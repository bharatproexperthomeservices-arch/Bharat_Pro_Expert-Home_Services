import React, { useState } from 'react';
import { WHATSAPP_NUMBER } from '../data';
import { MessageCircle, X, Send, Bot, Sparkles, PhoneCall } from 'lucide-react';

export const WhatsAppFloatingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inquiryText, setInquiryText] = useState(
    "Namaste Bharat Pro Expert, I want to inquire about Deep Cleaning services & Bumper Offers."
  );

  const handleSendToWhatsApp = () => {
    const encoded = encodeURIComponent(inquiryText);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded Quick Chat Card */}
      {isOpen && (
        <div 
          id="whatsapp-chat-popup"
          className="mb-4 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-black/10 overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Top Bar with Brand Avatar */}
          <div className="bg-[#128C7E] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white border border-white/30">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <span>Bharat Pro WhatsApp AI</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                </h4>
                <p className="text-[11px] text-white/80">
                  Instant Booking &bull; Free WhatsApp Dispatch
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-[#ECE5DD] space-y-3 min-h-[160px] text-xs">
            {/* System Agent Bubble */}
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-[#1C1C1E]">
              <p className="font-semibold text-[#128C7E] text-[11px] mb-1">Bharat Pro AI Assistant</p>
              <p>
                Namaste! 🙏 You can book complete sofa, bathroom, or full home deep cleaning directly over WhatsApp without downloading an app.
              </p>
              <span className="block text-[9px] text-[#8E8E93] text-right mt-1">Just now</span>
            </div>

            {/* Input & Launch */}
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-[#48484A] mb-1">
                Your Inquiry Message
              </label>
              <textarea
                rows={2}
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-[#D1D1D6] text-xs outline-none focus:border-[#128C7E]"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-white border-t border-[#E5E5EA] flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#8E8E93] font-mono">
              wa.me/{WHATSAPP_NUMBER}
            </span>
            <button
              type="button"
              id="whatsapp-direct-send-btn"
              onClick={handleSendToWhatsApp}
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Chat on WhatsApp</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        id="whatsapp-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative"
        title="Chat on WhatsApp (Free)"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
      </button>
    </div>
  );
};
