import React, { useState, useEffect } from 'react';
import { BUMPER_OFFERS } from '../data';
import { Sparkles, Gift, ArrowRight, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';

interface BumperOfferBannerProps {
  onSelectOffer: (minTier: number) => void;
}

export const BumperOfferBanner: React.FC<BumperOfferBannerProps> = ({ onSelectOffer }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance every 10 seconds per specification
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BUMPER_OFFERS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const offer = BUMPER_OFFERS[currentSlide];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl liquid-glass border border-[#E0B050]/40 shadow-xl bg-gradient-to-r from-[#1C1C1E] via-[#2A261F] to-[#1C1C1E] text-white p-6 sm:p-8">
      {/* Decorative ambient lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-40 bg-[#D4A24E]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-60 h-30 bg-[#E07B1A]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left info */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E07B1A] text-white text-xs font-black uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{offer.badge} &bull; AUTO-APPLIED</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-['Outfit'] tracking-tight text-white leading-tight">
            {offer.headline}
          </h3>

          <p className="text-sm sm:text-base text-[#D4A24E] font-medium flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#E07B1A] shrink-0" />
            <span>{offer.freeItemDescription}</span>
          </p>

          <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
            <ShieldCheck className="w-4 h-4 text-[#1F8A3B]" />
            <span>100% Free Automatic Add-on &bull; Certified German Injection Technology</span>
          </div>
        </div>

        {/* Right Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full md:w-auto">
          <button
            type="button"
            id={`bumper-offer-cta-${offer.id}`}
            onClick={() => onSelectOffer(offer.tierMinAmount)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#B8892E] via-[#D4A24E] to-[#B8892E] hover:from-[#D4A24E] hover:to-[#B8892E] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span>Book to Unlock Free Gift</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Slide Navigation Dots & Arrows */}
      <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {BUMPER_OFFERS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index 
                  ? 'w-8 bg-[#D4A24E]' 
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              title={`Slide ${index + 1}`}
            />
          ))}
          <span className="text-[11px] text-[#8E8E93] ml-2 font-mono">
            Auto-advances every 10s
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + BUMPER_OFFERS.length) % BUMPER_OFFERS.length)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % BUMPER_OFFERS.length)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
