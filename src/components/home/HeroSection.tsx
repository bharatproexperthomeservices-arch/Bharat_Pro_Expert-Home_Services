import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  MapPin, 
  Sparkles, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Star,
  CheckCircle2
} from 'lucide-react';

// EXACT 6 CATEGORIES REQUESTED: SOFA, CARPET, KITCHEN, APARTMENT, MATTRESS, BATHROOM
export interface UltraSlideItem {
  id: string;
  tabLabel: string;
  tabIcon: string;
  title: string;
  hindiTitle: string;
  subtitle: string;
  badge: string;
  priceFrom: number;
  originalPrice: number;
  image: string;
  fallbackImage: string;
  categoryTargetId: string;
  features: string[];
}

const ULTRA_SLIDES: UltraSlideItem[] = [
  {
    id: 'sofa',
    tabLabel: 'Sofa',
    tabIcon: '🛋️',
    title: 'Sofa Deep Cleaning & Fabric Shampooing',
    hindiTitle: 'सोफा डीप क्लीनिंग और शैम्पू धुलाई',
    subtitle: 'Industrial injection-extraction machine, Diversey foam & 100% allergen & stain removal',
    badge: 'Popular • 4.9 ★',
    priceFrom: 1499,
    originalPrice: 2499,
    image: '/assets/images/sofa_deep_cleaning_1790693680475.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=2000&q=95&auto=format&fit=crop',
    categoryTargetId: 'sofa-shampooing',
    features: ['German Machine Shampoo', 'Stain & Odor Neutralizer', 'Fabric Brightening']
  },
  {
    id: 'carpet',
    tabLabel: 'Carpet',
    tabIcon: '🧶',
    title: 'Carpet Deep Extraction & Machine Wash',
    hindiTitle: 'कारपेट और रग्स की गहरी धुलाई',
    subtitle: 'Deep fiber suction, stubborn dirt extraction, anti-microbial hygiene & fast drying',
    badge: 'High Demand • 4.8 ★',
    priceFrom: 999,
    originalPrice: 1799,
    image: '/assets/images/carpet_cleaning_1790693701155.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=2000&q=95&auto=format&fit=crop',
    categoryTargetId: 'sofa-shampooing',
    features: ['High-Power Vacuum Extraction', 'Pet Odor Elimination', 'Safe for All Fibers']
  },
  {
    id: 'kitchen',
    tabLabel: 'Kitchen',
    tabIcon: '🍳',
    title: 'Kitchen Deep Degreasing & Chimney Cleaning',
    hindiTitle: 'रसोई और चिमनी की गहरी सफाई',
    subtitle: 'Tough oil degreasing, chimney baffle filter descaling, slab sanitization & appliances polish',
    badge: 'Special Offer • 4.9 ★',
    priceFrom: 1499,
    originalPrice: 2299,
    image: '/assets/images/kitchen_deep_cleaning_1790693647667.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2000&q=95&auto=format&fit=crop',
    categoryTargetId: 'kitchen-cleaning',
    features: ['Chimney Degreasing', 'Tile & Grout Restoration', 'Oil Stains Cleared']
  },
  {
    id: 'apartment',
    tabLabel: 'Apartment',
    tabIcon: '🏢',
    title: 'Full Apartment & Home Deep Cleaning (1-4 BHK)',
    hindiTitle: 'पूरे अपार्टमेंट और घर की 360° सफाई',
    subtitle: '360° deep home sanitization: bedrooms, kitchen, washrooms, balcony wash & glass polish',
    badge: 'Best Seller • 4.9 ★',
    priceFrom: 2499,
    originalPrice: 3899,
    image: '/assets/images/full_home_deep_cleaning_1790693627652.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2000&q=95&auto=format&fit=crop',
    categoryTargetId: 'full-home-cleaning',
    features: ['All Rooms & Kitchen', 'Single-Disc Floor Scrub', 'Hospital-Grade Disinfection']
  },
  {
    id: 'mattress',
    tabLabel: 'Mattress',
    tabIcon: '🛏️',
    title: 'Mattress UV Sanitization & Dust Mite Removal',
    hindiTitle: 'गद्दे (Mattress) की यूवी सैनिटाइजेशन',
    subtitle: 'Deep HEPA suction, UV-C germicidal sterilization, stain treatment & allergen barrier defense',
    badge: 'Hygiene Plus • 4.9 ★',
    priceFrom: 999,
    originalPrice: 1699,
    image: '/assets/images/mattress_cleaning_hd_1791291736955.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=2000&q=95&auto=format&fit=crop',
    categoryTargetId: 'sofa-shampooing',
    features: ['UV-C Germicidal Light', '99.9% Dust Mite Extraction', 'Sweat & Odor Neutralized']
  },
  {
    id: 'bathroom',
    tabLabel: 'Bathroom',
    tabIcon: '🚿',
    title: 'Bathroom Descaling & Germicidal Sanitization',
    hindiTitle: 'बाथरूम डीप क्लीनिंग और टाइल डीस्केलिंग',
    subtitle: 'Hard water scale removal, chrome tap restoration, shower glass polish & 99.9% germ kill',
    badge: 'Top Rated • 4.9 ★',
    priceFrom: 1499,
    originalPrice: 2399,
    image: '/assets/images/bathroom_deep_cleaning_1790693663269.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=2000&q=95&auto=format&fit=crop',
    categoryTargetId: 'bathroom-cleaning',
    features: ['Hard Water Descaling', 'Chrome & Mirror Polish', 'Tiles Scrubbed Clean']
  }
];

export interface HeroSectionProps {
  selectedLocation?: string;
  onOpenLocationModal?: () => void;
  onSelectServiceItem?: (service: any) => void;
  onOpenBookNow?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedLocation = 'Delhi NCR',
  onOpenLocationModal,
  onOpenBookNow
}) => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // 6-second auto slide with pause on hover
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ULTRA_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const goTo = (index: number) => setCurrent(index);
  const goPrev = () => setCurrent((prev) => (prev - 1 + ULTRA_SLIDES.length) % ULTRA_SLIDES.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % ULTRA_SLIDES.length);

  // Touch Swipe for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      goNext();
    } else if (diff < -50) {
      goPrev();
    }
    touchStartXRef.current = null;
  };

  const handleBookSlide = (slide: UltraSlideItem) => {
    const el = document.getElementById(slide.categoryTargetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onOpenBookNow) {
      onOpenBookNow();
    }
  };

  return (
    <div 
      className="relative w-full h-[540px] sm:h-[600px] md:h-[650px] lg:h-[720px] overflow-hidden bg-slate-950 select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ================= 6 ULTRA HD BACKGROUND SLIDES ================= */}
      {ULTRA_SLIDES.map((slide, idx) => {
        const isActive = idx === current;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Real HD Image with Ken-Burns Animation */}
            <img
              src={slide.image}
              alt={slide.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== slide.fallbackImage) {
                  target.src = slide.fallbackImage;
                }
              }}
              className={`w-full h-full object-cover transition-transform duration-6000 ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />

            {/* Premium Multi-Layer Gradient Overlays for Maximum Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

            {/* Slide Text Content Container */}
            <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-10 md:px-16 lg:px-24 max-w-5xl z-10">
              
              {/* Badges / Chips */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-3 sm:mb-4">
                {/* Location Chip */}
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={onOpenLocationModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all border border-white/25 cursor-pointer shadow-sm active:scale-95"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Serving {selectedLocation}</span>
                    <span className="text-[10px] text-amber-300 underline font-medium ml-0.5">Change</span>
                  </button>
                )}

                {/* 10% OFF Promo Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-extrabold backdrop-blur-md shadow-sm border border-emerald-400/50">
                  <Tag className="w-3 h-3 text-white" />
                  <span>Flat 10% OFF • Code: BHARAT10</span>
                </div>

                {/* Slide Rating Badge */}
                <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-sm">
                  <Star className="w-3 h-3 fill-slate-950" />
                  <span>{slide.badge}</span>
                </div>
              </div>

              {/* Hindi Category Subtitle */}
              <p className="text-amber-400 font-bold text-xs sm:text-sm tracking-wide mb-1">
                {slide.hindiTitle}
              </p>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] mb-3 drop-shadow-xl max-w-3xl">
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-slate-200 font-medium mb-5 sm:mb-6 drop-shadow-md max-w-2xl leading-relaxed">
                {slide.subtitle}
              </p>

              {/* Key Features Chips */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-6 sm:mb-8">
                {slide.features.map((feat, fIdx) => (
                  <div 
                    key={fIdx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons & Pricing */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleBookSlide(slide)}
                  className="bg-gradient-to-r from-[#00A86B] to-[#008f5b] hover:from-[#008f5b] hover:to-[#007349] text-white font-black text-sm sm:text-base px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 cursor-pointer active:scale-95 group"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Book Now / अभी बुक करें</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                  <span className="text-[11px] text-slate-300 font-medium">Starts from:</span>
                  <span className="text-lg sm:text-xl font-black text-white">₹{slide.priceFrom}</span>
                  <span className="text-xs text-slate-400 line-through">₹{slide.originalPrice}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    10% OFF
                  </span>
                </div>
              </div>

            </div>
          </div>
        );
      })}

      {/* ================= TOP INTERACTIVE CATEGORY TABS ================= */}
      {/* Allows instant one-click switching directly to Sofa, Carpet, Kitchen, Apartment, Mattress, Bathroom */}
      <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-3 sm:px-6">
        <div className="flex items-center justify-center gap-1 sm:gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-lg p-1.5 rounded-2xl border border-white/15 shadow-2xl overflow-x-auto no-scrollbar">
          {ULTRA_SLIDES.map((item, idx) => {
            const isSelected = idx === current;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(idx)}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-white text-[#08213F] shadow-lg scale-102 font-black'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{item.tabIcon}</span>
                <span>{item.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Left Arrow Navigation */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Right Arrow Navigation */}
      <button
        type="button"
        onClick={goNext}
        aria-label="Next slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* ================= BOTTOM CONTROLS & PROGRESS INDICATOR ================= */}
      <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md py-2 px-4 rounded-full border border-white/15">
        <span className="text-[11px] font-mono font-bold text-amber-400">
          {current + 1} / {ULTRA_SLIDES.length}
        </span>
        <div className="h-3 w-px bg-white/20" />
        <div className="flex items-center gap-1.5">
          {ULTRA_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === current 
                  ? 'bg-amber-400 w-8 shadow-sm' 
                  : 'bg-white/40 w-2 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
