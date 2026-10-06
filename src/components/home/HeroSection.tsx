import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Star,
  Shield,
  Clock,
  Lock,
  BadgeCheck,
  TrendingUp,
  Flame,
  Users,
} from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES, CatalogItem } from '../../data/masterCatalogData';

interface HeroSectionProps {
  selectedLocation: string;
  onOpenLocationModal: () => void;
  onSelectServiceItem: (item: CatalogItem) => void;
  onOpenBookNow: () => void;
}

const ALL_SERVICES = MASTER_CATALOG_CATEGORIES.flatMap((category) =>
  category.items.map((item) => ({
    serviceId: item.id,
    categoryId: category.id,
    categoryName: category.name,
    name: item.name,
    description: item.description,
    price: item.offerPrice,
    originalPrice: item.originalPrice,
    discount: Math.round(
      ((item.originalPrice - item.offerPrice) / item.originalPrice) * 100
    ),
    duration: item.duration,
    image: item.imageUrl,
    rating: item.rating,
    reviewCount: item.reviewCount,
    popular: item.popular || false,
    originalItem: item,
  }))
);

const HERO_SLIDES = [
  ...ALL_SERVICES.filter((s) => s.popular),
  ...ALL_SERVICES.filter((s) => !s.popular),
];

const QUICK_CATEGORIES = MASTER_CATALOG_CATEGORIES.map((cat) => ({
  id: cat.id,
  name: cat.name,
  count: cat.items.length,
}));

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedLocation,
  onOpenLocationModal,
  onSelectServiceItem,
  onOpenBookNow,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleId = useRef(0);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const createRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleId.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 800);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return ALL_SERVICES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  const handleSlideClick = (
    e: React.MouseEvent<HTMLDivElement>,
    slideItem: (typeof HERO_SLIDES)[0]
  ) => {
    createRipple(e);
    onSelectServiceItem(slideItem.originalItem);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      onSelectServiceItem(searchResults[0].originalItem);
      setSearchQuery('');
      setIsSearchFocused(false);
    } else {
      onOpenBookNow();
    }
  };

  const goToCategory = (categoryId: string) => {
    const firstIndex = HERO_SLIDES.findIndex((s) => s.categoryId === categoryId);
    if (firstIndex >= 0) setCurrentSlide(firstIndex);
  };

  if (HERO_SLIDES.length === 0) return null;

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="relative w-full">

      <div
        className="relative w-full h-[640px] sm:h-[720px] lg:h-[780px] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-white/10">
          <div
            className="h-full bg-white transition-all ease-linear"
            style={{
              width: `${((currentSlide + 1) / HERO_SLIDES.length) * 100}%`,
              transitionDuration: '3500ms',
            }}
          />
        </div>

        {/* Slides */}
        {HERO_SLIDES.map((s, index) => (
          <div
            key={s.serviceId}
            onClick={(e) => handleSlideClick(e, s)}
            className={
              'absolute inset-0 cursor-pointer transition-all duration-1000 ease-out ' +
              (index === currentSlide
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-105 z-0')
            }
          >
            <img
              src={s.image}
              alt={s.name}
              className="w-full h-full object-cover"
              loading={index < 3 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            {ripples.map((r) => (
              <span
                key={r.id}
                className="absolute rounded-full bg-white/40 pointer-events-none animate-ping"
                style={{
                  left: r.x - 40,
                  top: r.y - 40,
                  width: 80,
                  height: 80,
                }}
              />
            ))}
          </div>
        ))}

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-30 px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div
              className="flex items-center gap-3 bg-white/15 backdrop-blur-2xl border border-white/25 rounded-full px-4 py-2.5 shadow-lg hover:bg-white/25 hover:scale-105 transition-all duration-300 cursor-pointer"
              style={{ animation: 'slideDown 0.6s ease-out' }}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-black">B</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-black text-sm leading-none">
                  Bharat Pro Expert
                </div>
                <div className="text-white/70 text-[10px] font-semibold mt-0.5">
                  Home Services
                </div>
              </div>
            </div>
            <div
              className="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur-2xl border border-white/25 rounded-full px-4 py-2.5 shadow-lg hover:bg-white/25 transition-all duration-300"
              style={{ animation: 'slideDown 0.8s ease-out' }}
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Verified & Insured</span>
            </div>
          </div>
        </div>

        {/* Live activity */}
        <div
          className="absolute top-24 left-6 sm:left-12 z-30 hidden md:block"
          style={{ animation: 'fadeInLeft 0.8s ease-out' }}
        >
          <div className="bg-white/15 backdrop-blur-2xl border border-white/25 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2 floating">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">
              {20 + (currentSlide % 15)} bookings happening now
            </span>
          </div>
        </div>

        {/* Category pills */}
        <div
          className="absolute top-24 right-6 sm:right-12 z-30 hidden lg:block"
          style={{ animation: 'fadeInRight 0.8s ease-out' }}
        >
          <div className="flex flex-col gap-2">
            {QUICK_CATEGORIES.slice(0, 4).map((cat, i) => (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToCategory(cat.id);
                }}
                className="bg-white/15 backdrop-blur-2xl border border-white/25 rounded-full px-3.5 py-2 shadow-lg flex items-center gap-2 text-left active:scale-95 hover:bg-white/30 hover:translate-x-1 transition-all duration-300"
                style={{
                  animation: 'slideDown 0.5s ease-out',
                  animationDelay: `${0.2 + i * 0.1}s`,
                  animationFillMode: 'both',
                }}
              >
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  {cat.name} ({cat.count})
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              </button>
            ))}
          </div>
        </div>

        {/* Slide counter */}
        <div
          className="absolute top-20 right-6 sm:right-12 z-30 bg-white/15 backdrop-blur-2xl border border-white/25 rounded-full px-3.5 py-2 shadow-lg"
          style={{ animation: 'fadeIn 0.6s ease-out' }}
        >
          <span className="text-xs font-black text-white tracking-wider">
            {String(currentSlide + 1).padStart(2, '0')} /{' '}
            {String(HERO_SLIDES.length).padStart(2, '0')}
          </span>
        </div>

        {/* Slide content */}
        <div className="absolute inset-0 z-20 flex items-end pb-44 sm:pb-52 pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
            <div className="max-w-2xl pointer-events-auto">

              {/* Badge */}
              <div
                key={`badge-${currentSlide}`}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-4 py-1.5 mb-4 shadow-lg"
                style={{ animation: 'fadeInUp 0.6s ease-out' }}
              >
                {slide.popular ? (
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-[10px] font-black text-white tracking-widest uppercase">
                  {slide.categoryName}
                </span>
              </div>

              {/* Title */}
              <h1
                key={`title-${currentSlide}`}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-3 tracking-tight drop-shadow-2xl"
                style={{ animation: 'fadeInUp 0.7s ease-out' }}
              >
                {slide.name}
              </h1>

              {/* Description */}
              <p
                key={`sub-${currentSlide}`}
                className="text-base sm:text-lg lg:text-xl text-white/90 font-medium mb-4 max-w-xl"
                style={{ animation: 'fadeInUp 0.85s ease-out' }}
              >
                {slide.description}
              </p>

              {/* Duration + Rating */}
              <div
                className="flex items-center gap-3 mb-6 flex-wrap"
                style={{ animation: 'fadeInUp 1s ease-out' }}
              >
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xl border border-white/25 rounded-full px-3 py-1.5 hover:bg-white/25 transition-all duration-300">
                  <Clock className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-xs font-bold text-white">{slide.duration}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xl border border-white/25 rounded-full px-3 py-1.5 hover:bg-white/25 transition-all duration-300">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    {slide.rating} ({slide.reviewCount}+)
                  </span>
                </div>
                {slide.popular && (
                  <div className="flex items-center gap-1.5 bg-orange-500/30 backdrop-blur-xl border border-orange-400/50 rounded-full px-3 py-1.5 animate-pulse">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-200" />
                    <span className="text-xs font-bold text-white">Trending</span>
                  </div>
                )}
              </div>

              {/* Price + Book Now */}
              <div
                className="flex items-center gap-3 flex-wrap"
                style={{ animation: 'fadeInUp 1.15s ease-out' }}
              >
                <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl px-5 py-3 shadow-lg hover:bg-white/25 transition-all duration-300">
                  <div className="text-[10px] text-white/70 font-bold uppercase tracking-wider line-through">
                    ₹{slide.originalPrice}
                  </div>
                  <div className="text-3xl font-black text-white leading-none">
                    ₹{slide.price}
                  </div>
                  <div className="text-[10px] text-emerald-300 font-bold mt-1">
                    {slide.discount}% OFF
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectServiceItem(slide.originalItem);
                  }}
                  className="bg-white hover:bg-white/95 text-[#0a1a2f] px-7 py-4 rounded-2xl font-black text-base flex items-center gap-2 shadow-2xl transition-all duration-300 active:scale-95 hover:scale-105 pulse-glow"
                >
                  Book Now ₹{slide.price}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-[175px] sm:bottom-[185px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 max-w-[80%] overflow-hidden">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(index);
              }}
              className={
                'transition-all duration-500 rounded-full shrink-0 ' +
                (index === currentSlide
                  ? 'w-7 h-2 bg-white shadow-lg'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70')
              }
              aria-label={'Go to slide ' + (index + 1)}
            />
          ))}
        </div>

        {/* Prev / Next */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/15 hover:bg-white/30 backdrop-blur-2xl rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 hover:scale-110 transition-all duration-300"
          aria-label="Previous"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((currentSlide + 1) % HERO_SLIDES.length);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/15 hover:bg-white/30 backdrop-blur-2xl rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 hover:scale-110 transition-all duration-300"
          aria-label="Next"
        >
          <ChevronDown className="w-5 h-5 -rotate-90" />
        </button>

        {/* Search dock */}
        <div
          className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-30 px-4 sm:px-6 lg:px-12"
          style={{ animation: 'fadeInUp 1s ease-out' }}
        >
          <div className="max-w-5xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white/95 backdrop-blur-2xl rounded-3xl sm:rounded-full p-2 sm:p-2.5 shadow-2xl border border-white/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 hover:shadow-3xl transition-all duration-300"
            >
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl sm:rounded-full hover:bg-slate-100 text-xs sm:text-sm font-bold text-[#08213F] shrink-0 text-left active:scale-95 transition-all duration-300"
              >
                <MapPin className="w-4 h-4 text-[#08213F] shrink-0" />
                <span className="truncate max-w-[130px]">{selectedLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              <div className="hidden sm:block w-px h-8 bg-slate-200 shrink-0" />

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

                {isSearchFocused && searchResults.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    style={{ animation: 'slideDown 0.3s ease-out' }}
                  >
                    <div className="p-2 px-3 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Matching Services
                    </div>
                    {searchResults.map((item, i) => (
                      <button
                        key={item.serviceId}
                        type="button"
                        onClick={() => {
                          onSelectServiceItem(item.originalItem);
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50 flex items-center justify-between gap-3 border-t border-slate-100 transition-colors duration-200"
                        style={{
                          animation: 'fadeInUp 0.3s ease-out',
                          animationDelay: `${i * 0.05}s`,
                          animationFillMode: 'both',
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {item.name}
                            </h5>
                            <span className="text-[10px] text-slate-500 truncate">
                              {item.categoryName} • {item.duration}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#08213F] shrink-0">
                          ₹{item.price}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-8 py-3 rounded-2xl sm:rounded-full bg-[#062040] hover:bg-[#04162C] text-white text-sm font-bold flex items-center justify-center gap-2 shrink-0 active:scale-95 hover:scale-105 transition-all duration-300"
              >
                <span>Book Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Trust strip — English */}
      <div className="relative w-full bg-white border-b border-slate-100 py-5 px-4 sm:px-6 lg:px-12 shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-300 cursor-pointer active:scale-95 group"
            style={{ animation: 'fadeInUp 0.6s ease-out' }}
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[#08213F] text-xs sm:text-sm leading-tight">
                Verified Professionals
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                Background Checked
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-300 cursor-pointer active:scale-95 group"
            style={{ animation: 'fadeInUp 0.8s ease-out' }}
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <BadgeCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[#08213F] text-xs sm:text-sm leading-tight">
                Transparent Pricing
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                No Hidden Charges
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-300 cursor-pointer active:scale-95 group"
            style={{ animation: 'fadeInUp 1s ease-out' }}
          >
            <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[#08213F] text-xs sm:text-sm leading-tight">
                Real-time Tracking
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                Live Updates
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-300 cursor-pointer active:scale-95 group"
            style={{ animation: 'fadeInUp 1.2s ease-out' }}
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[#08213F] text-xs sm:text-sm leading-tight">
                Secure Payments
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                Multiple Options
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HeroSection;