import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  Sparkles, 
  ChevronDown, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES, CatalogItem } from '../../data/masterCatalogData';

interface HeroSectionProps {
  selectedLocation: string;
  onOpenLocationModal: () => void;
  onSelectServiceItem: (item: CatalogItem) => void;
  onOpenBookNow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedLocation,
  onOpenLocationModal,
  onSelectServiceItem,
  onOpenBookNow
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Flat list of all services across all categories for instant search
  const allItems = React.useMemo(() => {
    return MASTER_CATALOG_CATEGORIES.flatMap(cat => cat.items);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allItems]);

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
    <div className="relative overflow-hidden bg-slate-50 min-h-[520px] sm:min-h-[580px] lg:min-h-[620px] flex items-center justify-center font-['Inter',sans-serif]">
      {/* Background Image: Sunlit Bright Luxury Modern Living Room matching reference image */}
      <div 
        className="absolute inset-0 bg-cover bg-center sm:bg-right scale-100 transition-transform duration-700"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=90')`
        }}
      />
      {/* Light subtle gradient overlay ensuring text on left is 100% crisp and readable while daylight photo shines */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/30 sm:to-transparent pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <div className="flex flex-col justify-between">
          
          {/* TOP ROW: Headline on left, Floating 10% OFF card on right */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            
            {/* Left Column: Trust pill, Title, Subtitle */}
            <div className="max-w-2xl space-y-4 text-left">
              
              {/* Trust Badge matching reference image */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                <span>Trusted Home Cleaning Services</span>
              </div>

              {/* Main Heading matching reference image */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#08213F] tracking-tight leading-[1.08]">
                Bharat Pro Expert
              </h1>

              {/* Subheading matching reference image */}
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0A2540] tracking-tight">
                Professional. Reliable. Premium.
              </p>
            </div>

            {/* Right Column: Floating 10% OFF Promotional Badge matching reference image */}
            <div className="self-end lg:self-start">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(8,33,63,0.12)] border border-slate-100/90 text-left min-w-[220px] max-w-[260px] animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
                    <MapPin className="w-4 h-4 text-blue-700" />
                  </span>
                  <div>
                    <div className="text-base sm:text-lg font-black text-[#08213F] leading-tight">
                      Get 10% OFF
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Your First Booking
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-black text-blue-700 tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>CLEANING</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM ROW: Integrated Search & Location Dock matching reference image */}
          <div className="mt-8 sm:mt-12 max-w-4xl w-full">
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-[0_14px_45px_rgba(8,33,63,0.14)] border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative z-20"
            >
              {/* 1. Dynamic Location Selector */}
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-full hover:bg-slate-50 text-xs sm:text-sm font-bold text-[#08213F] transition-colors cursor-pointer shrink-0 text-left"
              >
                <MapPin className="w-4 h-4 text-[#08213F] shrink-0" />
                <span className="truncate max-w-[150px]">{selectedLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-8 bg-slate-200 shrink-0" />

              {/* 2. Service Search Input */}
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

                {/* Live Search Suggestions Dropdown */}
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in zoom-in-95 duration-100 divide-y divide-slate-100">
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
                            <span className="text-[10px] text-slate-500">{item.categoryName} &bull; ⏱️ {item.duration}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#08213F] block">₹{item.offerPrice}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Offer price</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Book Now Button */}
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
    </div>
  );
};
