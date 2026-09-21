import React, { useState } from 'react';
import { Bot, Sparkles, Send, ArrowRight, ShieldCheck } from 'lucide-react';
import { INITIAL_SERVICES, BUMPER_OFFERS } from '../data';
import { CleaningService } from '../types';

interface AiAssistantProps {
  onSelectService: (service: CleaningService) => void;
  onSelectOffer: (minTier: number) => void;
}

export const AiAssistantBar: React.FC<AiAssistantProps> = ({
  onSelectService,
  onSelectOffer
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; actionService?: CleaningService; actionOffer?: number }>>([
    {
      sender: 'ai',
      text: 'Namaste! I am Bharat Pro AI. Ask me anything about home cleaning, pricing, bumper offers (₹2,999/₹4,999/₹5,999 tiers), or service duration in Hindi or English.'
    }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    const lower = userText.toLowerCase();
    setQuery('');
    setIsExpanded(true);

    const newMsgs = [...messages, { sender: 'user' as const, text: userText }];

    // Intelligent query resolution
    let reply = '';
    let matchedSrv: CleaningService | undefined;
    let matchedOffer: number | undefined;

    if (lower.includes('sofa') || lower.includes('couch')) {
      matchedSrv = INITIAL_SERVICES.find(s => s.id === 'srv-sofa-3plus2');
      reply = `For sofas, our 7-stage deep shampooing with motorized injection extraction starts at ₹2,999. If you book this ₹2,999+ package, you also get a FREE 25x50 Carpet Deep Cleaning under Bumper Offer 1!`;
    } else if (lower.includes('bathroom') || lower.includes('toilet') || lower.includes('washroom')) {
      if (lower.includes('classic')) {
        matchedSrv = INITIAL_SERVICES.find(s => s.id === 'srv-bath-classic');
      } else if (lower.includes('move') || lower.includes('vacant')) {
        matchedSrv = INITIAL_SERVICES.find(s => s.id === 'srv-bath-movein');
      } else {
        matchedSrv = INITIAL_SERVICES.find(s => s.id === 'srv-bath-intense') || INITIAL_SERVICES.find(s => s.id === 'srv-bath-classic');
      }
      reply = `We provide 3 specialized Bathroom Cleaning packages:
1. Classic Bathroom Cleaning: ₹300 (standard tile scrubbing, washbasin, toilet bowl disinfection & mirror shine)
2. Intense Hard-Water Bathroom Deep Cleaning: ₹350 (limescale descaling for tiles, glass partitions, taps & WC)
3. Move-in Bathroom Deep Cleaning: ₹450 (complete top-to-bottom turnkey restoration for new moves)`;
    } else if (lower.includes('kitchen') || lower.includes('chimney') || lower.includes('grease')) {
      matchedSrv = INITIAL_SERVICES.find(s => s.id === 'srv-kitchen-modular');
      reply = `Our Modular Kitchen Deep Degreasing (₹2,499) dismantles chimney baffle filters, dissolves stubborn grease from gas hobs, countertops, and tiles.`;
    } else if (lower.includes('offer') || lower.includes('bumper') || lower.includes('free') || lower.includes('discount')) {
      reply = `🎁 We currently run 3 active Bumper Offers: 
1. Book ₹2,999+ → FREE 25x50 Carpet Deep Cleaning
2. Book ₹4,999+ → FREE 50x100 Luxury Carpet Cleaning
3. Book ₹5,999+ → FREE Full Bed Mattress Deep Cleaning (worth ₹1,699)!`;
      matchedOffer = 2999;
    } else if (lower.includes('otp') || lower.includes('safety') || lower.includes('security')) {
      reply = `🔒 Bharat Pro implements a mandatory Dual-OTP verification system: 1. A 4-digit Start OTP is sent to you to start the job timer when the technician arrives. 2. A Completion OTP is required when the technician finishes work before payment.`;
    } else {
      matchedSrv = INITIAL_SERVICES[3]; // Full Home
      reply = `Bharat Pro delivers certified home cleaning across Gurugram, Delhi NCR, Noida, Mumbai & Bengaluru with trained partners, German equipment, and mandatory OTP security. You can inspect our 3 BHK Full Home Deep Cleaning below.`;
    }

    setMessages([
      ...newMsgs,
      {
        sender: 'ai',
        text: reply,
        actionService: matchedSrv,
        actionOffer: matchedOffer
      }
    ]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      {/* Search Input Pill */}
      <form onSubmit={handleAsk} className="relative flex items-center">
        <div className="absolute left-4 flex items-center gap-2 pointer-events-none text-[#B8892E]">
          <Bot className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Ask AI</span>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything: 'Sofa cleaning cost in Gurugram', 'Tell me about Bumper Offers'..."
          className="w-full pl-12 sm:pl-24 pr-24 py-4 rounded-full liquid-glass bg-white/80 border border-white/60 focus:border-[#B8892E] shadow-lg text-sm sm:text-base outline-none transition-all placeholder:text-[#8E8E93]"
        />
        <button
          type="submit"
          className="absolute right-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          <span>Ask</span>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Expanded Conversation Pane */}
      {isExpanded && (
        <div className="mt-3 p-4 rounded-3xl liquid-glass bg-white/95 border border-white/60 shadow-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B8892E] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Bharat Pro AI Knowledge Agent
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] underline"
            >
              Minimize
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs sm:text-sm ${
                    m.sender === 'user'
                      ? 'bg-[#1C1C1E] text-white rounded-tr-none'
                      : 'bg-[#F2F2F7] text-[#1C1C1E] rounded-tl-none border border-black/5'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  {m.actionService && (
                    <button
                      onClick={() => onSelectService(m.actionService!)}
                      className="mt-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>View &amp; Book {m.actionService.name}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {m.actionOffer && (
                    <button
                      onClick={() => onSelectOffer(m.actionOffer!)}
                      className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#E07B1A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Unlock Bumper Offer ₹{m.actionOffer}+</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
