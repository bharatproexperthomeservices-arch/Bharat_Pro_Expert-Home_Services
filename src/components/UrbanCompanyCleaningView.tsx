import React, { useState } from 'react';
import { CleaningService, CleaningCategory } from '../types';
import { 
  Star, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Minus, 
  Check, 
  ChevronRight, 
  Info, 
  PlayCircle, 
  MapPin, 
  ShoppingBag, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  ThumbsUp,
  Award,
  ArrowRight
} from 'lucide-react';

interface CartItem {
  service: CleaningService;
  quantity: number;
}

interface UrbanCompanyCleaningViewProps {
  categories: CleaningCategory[];
  services: CleaningService[];
  selectedCity: string;
  onSelectServiceDetails: (service: CleaningService) => void;
  onProceedToBooking: (service: CleaningService, additionalItems?: CleaningService[]) => void;
}

export const UrbanCompanyCleaningView: React.FC<UrbanCompanyCleaningViewProps> = ({
  categories,
  services,
  selectedCity,
  onSelectServiceDetails,
  onProceedToBooking
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('bathroom-cleaning');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('all');
  const [cart, setCart] = useState<{ [serviceId: string]: number }>({});

  // Subcategory filters per main category
  const subCategoryFilters: { [key: string]: { id: string; label: string }[] } = {
    'bathroom-cleaning': [
      { id: 'all', label: 'All Bathroom (7)' },
      { id: 'intense', label: 'Intense Descaling' },
      { id: 'classic', label: 'Classic Wash' },
      { id: 'movein', label: 'Move-in Spec' }
    ],
    'sofa-carpet-living': [
      { id: 'all', label: 'All Upholstery (19)' },
      { id: 'sofa', label: 'Fabric & Leather Sofa' },
      { id: 'mattress', label: 'Mattress Sanitizing' },
      { id: 'carpet', label: 'Carpet Wet Wash' }
    ],
    'kitchen-cleaning': [
      { id: 'all', label: 'All Kitchen (15)' },
      { id: 'chimney', label: 'Chimney & Stove' },
      { id: 'complete', label: 'Full Kitchen Deep' },
      { id: 'cabinets', label: 'Inside Cabinets' }
    ],
    'full-home-cleaning': [
      { id: 'all', label: 'All Full Home (6)' },
      { id: 'furnished', label: 'Furnished Apartment' },
      { id: 'unfurnished', label: 'Unfurnished / Move-in' },
      { id: 'villa', label: 'Villa & Duplex' }
    ]
  };

  const currentCategory = categories.find(c => c.id === activeCategoryId) || categories[0];
  
  // Filter services by active category & subfilter
  const currentServices = services.filter(srv => {
    if (srv.categoryId !== activeCategoryId) return false;
    if (activeSubFilter === 'all') return true;
    const nameLower = srv.name.toLowerCase();
    const descLower = srv.shortDesc.toLowerCase();
    if (activeSubFilter === 'intense') return nameLower.includes('intense') || descLower.includes('intense');
    if (activeSubFilter === 'classic') return nameLower.includes('classic') || descLower.includes('standard');
    if (activeSubFilter === 'sofa') return nameLower.includes('sofa') || nameLower.includes('recliner');
    if (activeSubFilter === 'mattress') return nameLower.includes('mattress');
    if (activeSubFilter === 'carpet') return nameLower.includes('carpet') || nameLower.includes('rug');
    if (activeSubFilter === 'chimney') return nameLower.includes('chimney') || nameLower.includes('stove');
    if (activeSubFilter === 'complete') return nameLower.includes('complete') || nameLower.includes('deep');
    if (activeSubFilter === 'furnished') return nameLower.includes('furnished') && !nameLower.includes('unfurnished');
    if (activeSubFilter === 'unfurnished') return nameLower.includes('unfurnished');
    if (activeSubFilter === 'villa') return nameLower.includes('villa') || nameLower.includes('duplex');
    return true;
  });

  const handleAddToCart = (serviceId: string) => {
    setCart(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (serviceId: string) => {
    setCart(prev => {
      const current = prev[serviceId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: current - 1 };
    });
  };

  // Cart summary calculations
  const cartEntries = Object.entries(cart);
  const cartItemsCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);
  const cartServices = cartEntries.map(([id, qty]) => {
    const srv = services.find(s => s.id === id);
    return { service: srv!, quantity: qty };
  }).filter(item => Boolean(item.service));

  const cartSubtotal = cartServices.reduce((sum, item) => sum + (item.service.basePrice * item.quantity), 0);
  const cartReferenceTotal = cartServices.reduce((sum, item) => sum + (item.service.referencePrice * item.quantity), 0);
  const totalSavings = cartReferenceTotal - cartSubtotal;

  const handleCheckout = () => {
    if (cartServices.length === 0) return;
    const primaryService = cartServices[0].service;
    const additionalServices = cartServices.slice(1).map(c => c.service);
    onProceedToBooking(primaryService, additionalServices);
  };

  return (
    <div className="w-full bg-[#F5F5F7] min-h-screen pb-24">
      {/* 1. URBAN COMPANY HERO STRIP & CLEANING CATEGORIES BAR */}
      <div className="bg-white border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#B8892E]">
                Bharat Pro Expert Cleaning
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-[#1C1C1E] mt-0.5">
                Professional Home Cleaning Services in {selectedCity}
              </h1>
              <p className="text-xs sm:text-sm text-[#636366] mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1 font-bold text-[#1C1C1E]">
                  <Star className="w-3.5 h-3.5 fill-[#B8892E] text-[#B8892E]" /> 4.84
                </span>
                <span>&bull;</span>
                <span>Over 145,000+ homes deep cleaned</span>
                <span>&bull;</span>
                <span className="text-emerald-700 font-semibold">Hospital-grade Diversey chemicals</span>
              </p>
            </div>

            {/* Quality Guarantee Mini Card */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] self-start md:self-auto">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#B8892E]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#1C1C1E] block">100% Service Guarantee</span>
                <span className="text-[#8E8E93]">Free re-clean if unsatisfied within 24h</span>
              </div>
            </div>
          </div>

          {/* UC-Style Main Category Tabs */}
          <div className="flex items-center gap-2 sm:gap-4 mt-6 overflow-x-auto pb-2 scrollbar-none border-t border-[#F2F2F7] pt-4">
            {categories.map(cat => {
              const isSelected = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setActiveSubFilter('all');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1C1E] text-white shadow-md'
                      : 'bg-[#F2F2F7] text-[#48484A] hover:bg-[#E5E5EA]'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN MARKETPLACE SPLIT VIEW (Sidebar + Service Cards + Right Cart) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Vertical Sub-Navigation (Urban Company Style) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
            <div className="p-4 rounded-3xl bg-white border border-[#E5E5EA] shadow-2xs space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] px-3 py-2">
                Select Sub-service
              </h3>
              {(subCategoryFilters[activeCategoryId] || [
                { id: 'all', label: 'All Services' }
              ]).map(sub => {
                const isActive = activeSubFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubFilter(sub.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#FFF8F0] text-[#B8892E] border border-[#B8892E]/30 font-extrabold'
                        : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#B8892E]" />}
                  </button>
                );
              })}
            </div>

            {/* UC Promise Box */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-2xs space-y-3">
              <h4 className="font-bold text-xs text-[#1C1C1E] uppercase tracking-wider">
                The Bharat Pro Standard
              </h4>
              <ul className="text-xs text-[#636366] space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Diversey Taski R2, R6 &amp; Ecolab certified solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>German Kärcher single-disc scrubbing machine</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Background verified, police-cleared personnel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Transparent post-inspection payment</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Center Column: Urban Company Service Items List */}
          <div className="lg:col-span-6 space-y-4">
            {/* Header of Active Section */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA]">
              <div>
                <h2 className="text-lg sm:text-xl font-black font-['Outfit'] text-[#1C1C1E]">
                  {currentCategory.name}
                </h2>
                <p className="text-xs text-[#8E8E93]">
                  {currentServices.length} vetted service packages available
                </p>
              </div>

              {/* Mobile Subcategory selector */}
              <div className="lg:hidden">
                <select
                  value={activeSubFilter}
                  onChange={(e) => setActiveSubFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold text-[#1C1C1E] outline-none"
                >
                  {(subCategoryFilters[activeCategoryId] || [{ id: 'all', label: 'All Services' }]).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Service Cards (Classic Urban Company Card Layout) */}
            <div className="space-y-4">
              {currentServices.map(srv => {
                const qty = cart[srv.id] || 0;
                return (
                  <div
                    key={srv.id}
                    id={`uc-service-${srv.id}`}
                    className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row justify-between gap-5"
                  >
                    {/* Left Details */}
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <h3 className="text-base font-bold font-['Outfit'] text-[#1C1C1E] leading-snug">
                          {srv.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#8E8E93]">
                          <span className="flex items-center gap-1 font-bold text-[#1C1C1E]">
                            <Star className="w-3.5 h-3.5 fill-[#B8892E] text-[#B8892E]" /> {srv.rating}
                          </span>
                          <span>&bull;</span>
                          <span>({srv.reviewCount} reviews)</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {srv.estimatedMinutes} mins
                          </span>
                        </div>
                      </div>

                      {/* Pricing with 15% discount tag */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-lg font-black text-[#1C1C1E]">
                          ₹{srv.basePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs line-through text-[#8E8E93]">
                          ₹{srv.referencePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          15% OFF
                        </span>
                      </div>

                      {/* Bulleted Realistic Inclusions */}
                      <div className="pt-2 border-t border-[#F2F2F7]">
                        <ul className="text-xs text-[#636366] space-y-1">
                          {srv.inclusions.slice(0, 3).map((inc, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#B8892E] font-bold">&bull;</span>
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* View Details Link */}
                      <button
                        type="button"
                        onClick={() => onSelectServiceDetails(srv)}
                        className="text-xs font-bold text-[#B8892E] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <span>View details &amp; equipment SOP</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Right Image & UC-Style Add Button */}
                    <div className="sm:w-36 flex flex-col items-center justify-between shrink-0">
                      <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-neutral-100 border border-[#E5E5EA]">
                        <img
                          src={srv.imageUrl}
                          alt={srv.name}
                          className="w-full h-full object-cover"
                        />
                        {srv.popular && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#1C1C1E]/80 backdrop-blur-md text-[9px] font-bold text-white tracking-wide uppercase">
                            Bestseller
                          </span>
                        )}
                      </div>

                      {/* Urban Company Signature Square "+ Add" / "[-] [qty] [+]" button */}
                      <div className="w-full mt-2.5">
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(srv.id)}
                            className="w-full py-2 px-3 rounded-xl bg-white border border-[#D1D1D6] hover:border-[#1C1C1E] text-xs font-bold text-[#1C1C1E] shadow-2xs hover:bg-[#F8F9FB] flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#B8892E]" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="w-full py-1.5 px-3 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold shadow-xs flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(srv.id)}
                              className="p-1 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-sm">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(srv.id)}
                              className="p-1 hover:text-[#F9D976] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Desktop Sticky Cart (Urban Company Style) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F2F2F7]">
                <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#B8892E]" />
                  <span>Cart ({cartItemsCount})</span>
                </h3>
                {cartItemsCount > 0 && (
                  <button
                    onClick={() => setCart({})}
                    className="text-[11px] text-[#8E8E93] hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cartItemsCount === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mx-auto text-[#8E8E93]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-[#1C1C1E]">Your Cart is Empty</h4>
                  <p className="text-[11px] text-[#8E8E93] max-w-[200px] mx-auto">
                    Select cleaning services to view itemized pricing &amp; book a slot.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Itemized List */}
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {cartServices.map(({ service: srv, quantity }) => (
                      <div key={srv.id} className="flex justify-between items-center text-xs">
                        <div className="max-w-[140px]">
                          <span className="font-bold text-[#1C1C1E] block truncate">{srv.name}</span>
                          <span className="text-[10px] text-[#8E8E93]">₹{srv.basePrice} each</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 border border-[#D1D1D6] rounded-lg px-1.5 py-0.5">
                            <button onClick={() => handleRemoveFromCart(srv.id)} className="text-xs hover:text-red-600">-</button>
                            <span className="font-mono text-xs font-bold px-1">{quantity}</span>
                            <button onClick={() => handleAddToCart(srv.id)} className="text-xs hover:text-emerald-600">+</button>
                          </div>
                          <span className="font-bold text-xs text-[#1C1C1E]">
                            ₹{srv.basePrice * quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Savings Banner */}
                  {totalSavings > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>You save ₹{totalSavings} with Bharat Pro 15% guarantee</span>
                    </div>
                  )}

                  {/* Bill Summary */}
                  <div className="pt-3 border-t border-[#F2F2F7] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#8E8E93]">
                      <span>Item Total</span>
                      <span>₹{cartSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-[#8E8E93]">
                      <span>Taxes &amp; GST (18%)</span>
                      <span>₹{Math.round(cartSubtotal * 0.18)}</span>
                    </div>
                    <div className="flex justify-between text-[#8E8E93]">
                      <span>Hub Dispatch &amp; Safety Fee</span>
                      <span className="text-emerald-700 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[#1C1C1E] pt-2 border-t border-[#F2F2F7]">
                      <span>To Pay</span>
                      <span>₹{cartSubtotal + Math.round(cartSubtotal * 0.18)}</span>
                    </div>
                  </div>

                  {/* Proceed CTA Button */}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="w-full py-3 px-4 rounded-2xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <span>Proceed to Slot &amp; Address</span>
                    <ArrowRight className="w-4 h-4 text-[#F9D976]" />
                  </button>

                  <p className="text-[10px] text-center text-[#8E8E93]">
                    Pay online or after service completion
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. URBAN COMPANY COMPARISON SECTION: BHARAT PRO VS LOCAL MAID */}
        <section className="mt-16 pt-12 border-t border-[#E5E5EA]">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#B8892E]">
              Why Choose Professional Deep Cleaning?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-[#1C1C1E]">
              Bharat Pro Expert vs. Local Cleaners
            </h2>
            <p className="text-xs sm:text-sm text-[#636366]">
              See why over 145,000 households trust our certified technicians with German machinery
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-2xs">
            <div className="grid grid-cols-12 bg-[#F8F9FB] p-4 text-xs font-bold text-[#1C1C1E] border-b border-[#E5E5EA]">
              <div className="col-span-6 sm:col-span-5">Feature &amp; Standard</div>
              <div className="col-span-3 sm:col-span-3 text-center text-[#B8892E] font-black">Bharat Pro Expert</div>
              <div className="col-span-3 sm:col-span-4 text-center text-[#8E8E93]">Local Maid / Vendor</div>
            </div>

            <div className="divide-y divide-[#F2F2F7] text-xs">
              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-6 sm:col-span-5 font-bold text-[#1C1C1E]">
                  Chemicals Used
                </div>
                <div className="col-span-3 sm:col-span-3 text-center font-semibold text-emerald-800 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Diversey Taski &amp; Ecolab
                </div>
                <div className="col-span-3 sm:col-span-4 text-center text-[#8E8E93]">
                  Harsh Acid &amp; Detergent
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-6 sm:col-span-5 font-bold text-[#1C1C1E]">
                  Machinery &amp; Extraction
                </div>
                <div className="col-span-3 sm:col-span-3 text-center font-semibold text-emerald-800 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Kärcher Single-Disc &amp; Wet Vac
                </div>
                <div className="col-span-3 sm:col-span-4 text-center text-[#8E8E93]">
                  Hand Wiper &amp; Cotton Rag
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-6 sm:col-span-5 font-bold text-[#1C1C1E]">
                  Background &amp; Police Check
                </div>
                <div className="col-span-3 sm:col-span-3 text-center font-semibold text-emerald-800 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> 100% Aadhaar &amp; Police Verified
                </div>
                <div className="col-span-3 sm:col-span-4 text-center text-[#8E8E93]">
                  Unverified Unknown
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-6 sm:col-span-5 font-bold text-[#1C1C1E]">
                  Satisfaction &amp; Rework Guarantee
                </div>
                <div className="col-span-3 sm:col-span-3 text-center font-semibold text-emerald-800 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Free Rework within 24h
                </div>
                <div className="col-span-3 sm:col-span-4 text-center text-[#8E8E93]">
                  No Guarantee
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-6 sm:col-span-5 font-bold text-[#1C1C1E]">
                  Pricing Transparency
                </div>
                <div className="col-span-3 sm:col-span-3 text-center font-semibold text-emerald-800 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> 15% Below Market Fixed Rates
                </div>
                <div className="col-span-3 sm:col-span-4 text-center text-[#8E8E93]">
                  Haggling &amp; Hidden Charges
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. REALISTIC URBAN COMPANY FAQ SECTION */}
        <section className="mt-16 pt-12 border-t border-[#E5E5EA] max-w-4xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#B8892E]">
              Everything You Need to Know
            </span>
            <h2 className="text-2xl font-black font-['Outfit'] text-[#1C1C1E]">
              Frequently Asked Cleaning Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Do I need to provide any buckets, mops, or cleaning chemicals?",
                a: "No. Our certified professionals arrive fully equipped with German Kärcher industrial wet-and-dry vacuum machines, single-disc scrubbing machines, microfiber towels, and Diversey Taski R2/R6 solutions. You only need to provide power sockets and water access."
              },
              {
                q: "How does the dispatch and professional assignment work?",
                a: "Once you place a booking, your request is routed to our central Hub. Our team reviews your exact requirements, coordinates with the nearest certified specialist, and assigns the verified professional. You will receive real-time updates and full technician details on your screen."
              },
              {
                q: "Are the chemicals safe for children, seniors, and pets?",
                a: "Yes. We exclusively use neutral-pH hospital-grade formulations (Diversey Taski series) that are chlorine-free and safe for indoor environments. Bathrooms and kitchens are thoroughly rinsed and dried."
              },
              {
                q: "Can I inspect the service before making the payment?",
                a: "Absolutely. We encourage full customer walkthroughs upon completion. Payment can be settled via UPI, Card, or Cash after you are completely satisfied with the cleanliness."
              }
            ].map((faq, i) => (
              <details
                key={i}
                className="group p-5 rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] ring-1 ring-black/5 cursor-pointer transition-all hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)]"
              >
                <summary className="font-bold text-xs sm:text-sm text-[#1C1C1E] flex items-center justify-between list-none">
                  <span>{faq.q}</span>
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-xs text-[#636366] mt-3 leading-relaxed border-t border-[#F2F2F7] pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          {/* iOS Water 3D Help & Contact Card */}
          <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/90 via-[#F8F9FB]/90 to-amber-50/50 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] ring-1 ring-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-[#B8892E] text-[10px] font-black tracking-widest uppercase inline-block">
                Dedicated Support Concierge
              </span>
              <h3 className="text-lg font-black font-['Outfit'] text-[#1C1C1E]">
                Need Custom Cleaning or Have Questions?
              </h3>
              <p className="text-xs text-[#636366] max-w-md">
                Reach our cleaning supervisor directly for customized apartment packages, commercial spaces, or immediate booking inquiries.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-[#1C1C1E]">
                <span>📧 <a href="mailto:bharatproexpert@gmail.com" className="hover:underline text-amber-700">bharatproexpert@gmail.com</a></span>
                <span>📞 <a href="tel:+918920252647" className="hover:underline text-emerald-700">+91 8920252647</a></span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="tel:+918920252647"
                className="py-2.5 px-4 rounded-2xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Call +91 8920252647</span>
              </a>
              <a
                href="https://wa.me/918920252647?text=Hi%20Bharat%20Pro%2C%20I%20need%20assistance%20with%20cleaning%20services"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* 5. MOBILE BOTTOM STICKY BAR (Urban Company Mobile Experience) */}
      {cartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur-md border-t border-[#E5E5EA] shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-[#1C1C1E]">
                ₹{cartSubtotal}
              </span>
              <span className="text-[10px] text-[#8E8E93]">({cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'})</span>
            </div>
            {totalSavings > 0 && (
              <span className="text-[10px] text-emerald-700 font-bold block">
                Saved ₹{totalSavings} with 15% discount
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="py-2.5 px-5 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold shadow-md flex items-center gap-2 active:scale-95"
          >
            <span>View Cart &amp; Book</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F9D976]" />
          </button>
        </div>
      )}
    </div>
  );
};
