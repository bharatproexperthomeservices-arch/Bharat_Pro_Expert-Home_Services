import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  ChevronDown, 
  ArrowRight,
  Star
} from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES, CatalogItem } from '../../data/masterCatalogData';

interface HeroSectionProps {
  selectedLocation: string;
  onOpenLocationModal: () => void;
  onSelectServiceItem: (item: CatalogItem) => void;
  onOpenBookNow: () => void;
}

/* ============================================================
   Ultra Luxury HD स्लाइड — घर के अंदर के कमरे
   हर 3.5 सेकंड में अपने आप बदलेगी
   ============================================================ */
const HERO_SLIDES = [
  {
    id: 'living-room',
    categoryId: 'sofa-shampooing',
    categoryName: 'सोफा शैम्पूइंग',
    title: 'शानदार लिविंग रूम',
    subtitle: 'गहरी सफाई से सोफे की चमक वापस',
    startingPrice: 549,
    badge: 'सबसे लोकप्रिय',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=95&auto=format&fit=crop'
  },
  {
    id: 'luxury-kitchen',
    categoryId: 'kitchen-cleaning',
    categoryName: 'रसोई डीप क्लीनिंग',
    title: 'आधुनिक रसोई',
    subtitle: 'चिकनाई मुक्त, चमकती रसोई',
    startingPrice: 499,
    badge: 'ऑफर',
    image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1920&q=95&auto=format&fit=crop'
  },
  {
    id: 'spa-bathroom',
    categoryId: 'bathroom-cleaning',
    categoryName: 'बाथरूम डीप क्लीनिंग',
    title: 'स्पा जैसा बाथरूम',
    subtitle: 'कीटाणु मुक्त, चमकता बाथरूम',
    startingPrice: 399,
    badge: 'टॉप रेटेड',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=95&auto=format&fit=crop'
  },
  {
    id: 'luxury-bedroom',
    categoryId: 'carpet-mattress',
    categoryName: 'गद्दा और कालीन',
    title: 'आरामदायक बेडरूम',
    subtitle: 'एलर्जी मुक्त, ताज़ा नींद',
    startingPrice: 499,
    badge: 'हॉट',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=95&auto=format&fit=crop'
  },
  {
    id: 'luxury-dining',
    categoryId: 'chair-cleaning',
    categoryName: 'कुर्सी डीप क्लीनिंग',
    title: 'शानदार डाइनिंग एरिया',
    subtitle: 'कुर्सियों की गहरी धुलाई',
    startingPrice: 599,
    badge: 'नया',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1920&q=95&auto=format&fit=crop'
  },
  {
    id: 'luxury-home',
    categoryId: 'full-home-cleaning',
    categoryName: 'पूरा घर सफाई',
    title: 'पूरे घर की चमक',
    subtitle: '360° गहरी सफाई',
    startingPrice: 1999,
    badge: 'प्रीमियम',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=95&auto=format&fit=crop'
  },
  {
    id: 'luxury-windows',
    categoryId: 'glass-window',
    categoryName: 'काँच और खिड़की',
    title: 'चमकती खिड़कियाँ',
    subtitle: 'स्ट्रीक-फ्री काँच',
    startingPrice: 399,
    badge: 'जरूरी',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=95&auto=format&fit=crop'
  }
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedLocation,
  onOpenLocationModal,
  onSelectServiceItem,
  onOpenBookNow
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  /* ============ ऑटो-स्लाइड — हर 3.5 सेकंड ============ */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  /* सभी सेवाएँ — खोज के लिए */
  const allItems = useMemo(() => {
    return MASTER_CATALOG_CATEGORIES.flatMap(cat => cat.items);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allItems]);

  /* स्लाइड पर क्लिक करने पर बुकिंग */
  const handleSlideClick = (slide: typeof HERO_SLIDES[0]) => {
    const category = MASTER_CATALOG_CATEGORIES.find(c => c.id === slide.categoryId);
    if (category && category.items.length > 0) {
      onSelectServiceItem(category.items[0]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      onSelectServiceItem(searchResults[0]);
      setSearchQuery('');
      setIsSearchFocused(false);
    } else {
      onOpenBookNow();
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0a1a2f] font-['Inter',sans-serif]">

      {/* ================================================
          ULTRA LUXURY HD स्लाइडर — पूरी चौड़ाई
          ================================================ */}
      <div className="relative h-[600px] sm:h-[680px] lg:h-[720px] w-full">

        {/* सभी स्लाइड्स — एक के ऊपर एक */}
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => handleSlideClick(slide)}
            className={`absolute inset-0 cursor-pointer transition-all duration-1000 ease-in-out ${
              index === currentSlide 
                ? 'opacity-100 scale-100 z-10' 
                : 'opacity-0 scale-105 z-0'
            }`}
          >
            {/* HD चित्र — बिना blur, बिना extra brightness */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />

            {/* हल्का gradient — सिर्फ टेक्स्ट पढ़ने के लिए बाएँ से */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
          </div>
        ))}

        {/* ================================================
            स्लाइड सामग्री — ऊपर तैरती हुई
            ================================================ */}
        <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
            <div className="max-w-2xl pointer-events-auto">

              {/* बैज */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 mb-5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  {HERO_SLIDES[currentSlide].badge}
                </span>
              </div>

              {/* शीर्षक */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 tracking-tight drop-shadow-2xl">
                {HERO_SLIDES[currentSlide].title}
              </h1>

              {/* उपशीर्षक */}
              <p className="text-lg sm:text-xl lg:text-2xl text-white/95 font-medium mb-6 drop-shadow-lg">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>

              {/* मूल्य + बुक करें बटन */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl px-5 py-3">
                  <div className="text-[11px] text-white/80 font-medium">शुरू होता है</div>
                  <div className="text-2xl font-black text-white">
                    ₹{HERO_SLIDES[currentSlide].startingPrice} से
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSlideClick(HERO_SLIDES[currentSlide]);
                  }}
                  className="bg-gradient-to-r from-[#00A86B] to-[#008f5b] hover:from-[#008f5b] hover:to-[#006b44] text-white px-7 py-4 rounded-2xl font-bold text-base flex items-center gap-2 shadow-2xl transition-all active:scale-95"
                >
                  अभी बुक करें
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================
            नीचे स्लाइड बिंदु
            ================================================ */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(index);
              }}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'w-8 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* बाएँ/दाएँ नेविगेशन तीर */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border border-white/20"
          aria-label="Previous slide"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 rotate-90" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((currentSlide + 1) % HERO_SLIDES.length);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border border-white/20"
          aria-label="Next slide"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 -rotate-90" />
        </button>

        {/* ================================================
            नीचे तैरती खोज पट्टी
            ================================================ */}
        <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 z-30 px-4 sm:px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              {/* शहर चयनकर्ता */}
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-full hover:bg-slate-50 text-xs sm:text-sm font-bold text-[#08213F] transition-colors cursor-pointer shrink-0 text-left"
              >
                <MapPin className="w-4 h-4 text-[#08213F] shrink-0" />
                <span className="truncate max-w-[140px]">{selectedLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {/* विभाजक */}
              <div className="hidden sm:block w-px h-8 bg-slate-200 shrink-0" />

              {/* खोज बॉक्स */}
              <div className="relative flex-1 flex items-center px-3">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  placeholder="Search cleaning services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                />

                {/* खोज सुझाव */}
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100">
                    <div className="p-2 px-3 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Matching Cleaning Services
                    </div>
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectServiceItem(item);
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="p-3 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between transition-colors gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 leading-tight">{item.name}</h5>
                            <span className="text-[10px] text-slate-500">
                              {item.categoryName} &bull; {item.duration}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#08213F] block">₹{item.offerPrice}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Offer</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Book Now बटन */}
              <button
                type="submit"
                className="px-8 py-3 rounded-full bg-[#062040] hover:bg-[#04162C] text-white text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <span>Book Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* ================================================
          नीचे विश्वास पट्टी
          ================================================ */}
      <div className="bg-white border-t border-slate-100 py-5 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🛡️', title: 'सत्यापित पेशेवर', sub: 'पृष्ठभूमि जाँची' },
            { icon: '📋', title: 'पारदर्शी मूल्य', sub: 'कोई छिपा शुल्क नहीं' },
            { icon: '📡', title: 'लाइव ट्रैकिंग', sub: 'वास्तविक समय अपडेट' },
            { icon: '🔒', title: 'सुरक्षित भुगतान', sub: 'कई विकल्प' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-[#08213F] flex items-center justify-center text-lg flex-shrink-0">
                {t.icon}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[#08213F] text-xs sm:text-sm leading-tight">{t.title}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HeroSection;