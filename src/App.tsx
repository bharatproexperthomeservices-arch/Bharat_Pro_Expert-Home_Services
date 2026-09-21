import React, { useState, useEffect } from 'react';
import { BharatProLogo } from './components/BharatProLogo';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { BumperOfferBanner } from './components/BumperOfferBanner';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { BookingFlowModal } from './components/BookingFlowModal';
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { WhatsAppFloatingWidget } from './components/WhatsAppFloatingWidget';
import { AiAssistantBar } from './components/AiAssistantBar';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SERVICES, 
  INITIAL_HUBS, 
  BUMPER_OFFERS,
  WHATSAPP_NUMBER 
} from './data';
import { CleaningCategory, CleaningService, Booking } from './types';
import { initializeDatabaseDefaults, getAllBookings } from './services/dbService';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  User, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Award, 
  Flame, 
  PlayCircle,
  FileCheck,
  ChevronRight,
  LogOut,
  LayoutDashboard
} from 'lucide-react';

function AppContent() {
  const { user, profile, signOut, role, switchRole } = useAuth();

  // App Navigation & Modals
  const [isAdminView, setIsAdminView] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalDefaultRole, setAuthModalDefaultRole] = useState<'customer' | 'partner'>('customer');
  
  // Selected City & Hub
  const [selectedCity, setSelectedCity] = useState('Gurugram');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<CleaningService | null>(null);
  const [bookingService, setBookingService] = useState<CleaningService | null>(null);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<Booking | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Seed defaults on first load
  useEffect(() => {
    initializeDatabaseDefaults();
  }, []);

  // Load user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      const bks = await getAllBookings(user?.uid || profile?.uid);
      setMyBookings(bks);
    };
    fetchBookings();
  }, [user, profile, activeTrackingBooking]);

  const handleOpenAuth = (targetRole: 'customer' | 'partner' = 'customer') => {
    setAuthModalDefaultRole(targetRole);
    setAuthModalOpen(true);
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    setMyBookings([newBooking, ...myBookings]);
    setActiveTrackingBooking(newBooking);
  };

  const filteredServices = INITIAL_SERVICES.filter(srv => {
    if (activeCategory === 'all') return true;
    return srv.categoryId === activeCategory;
  });

  if (isAdminView) {
    return <AdminDashboard onBackToCustomerSite={() => setIsAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1C1C1E] flex flex-col font-['Plus_Jakarta_Sans']">
      {/* 1. STICKY LIQUID GLASS HEADER */}
      <header className="sticky top-0 z-30 liquid-glass bg-white/85 border-b border-white/60 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 sm:gap-6">
          <BharatProLogo size="md" variant="horizontal" />
          
          {/* City / Hub Selector */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-semibold text-[#1C1C1E]">
            <MapPin className="w-3.5 h-3.5 text-[#E07B1A]" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent border-0 outline-none cursor-pointer pr-1"
            >
              <option value="Gurugram">Gurugram (Cyber / Golf Course)</option>
              <option value="New Delhi">South Delhi &amp; NCR</option>
              <option value="Noida">Noida &amp; Indirapuram</option>
              <option value="Mumbai">Mumbai Western &amp; BKC</option>
              <option value="Bengaluru">Bengaluru Tech Hub</option>
            </select>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Admin Switch */}
          <button
            onClick={() => setIsAdminView(true)}
            className="px-3 py-1.5 rounded-xl border border-dashed border-[#B8892E] hover:bg-[#B8892E]/5 text-[11px] font-bold text-[#B8892E] flex items-center gap-1.5 transition-all"
            title="Switch to Admin Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </button>

          {/* User Account / Sign In */}
          {user || profile ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  if (myBookings.length > 0) {
                    setActiveTrackingBooking(myBookings[0]);
                  } else {
                    alert('You have no active orders yet.');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5 shadow-sm hover:bg-[#F2F2F7]"
              >
                <Clock className="w-3.5 h-3.5 text-[#B8892E]" />
                <span>My Bookings ({myBookings.length})</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-[#E5E5EA]">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-8 h-8 rounded-full object-cover border border-black/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center text-xs font-bold">
                    {profile?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-xs font-semibold text-[#1C1C1E] hidden sm:inline max-w-[100px] truncate">
                  {profile?.name || user?.displayName || 'Customer'}
                </span>
                <button
                  onClick={signOut}
                  className="p-1.5 text-[#8E8E93] hover:text-red-600 rounded-lg hover:bg-black/5"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-expert-login-btn"
                onClick={() => handleOpenAuth('partner')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-[#1C1C1E] hover:bg-black/5 transition-all hidden sm:inline-block"
              >
                Join as Expert
              </button>
              <button
                id="header-google-login-btn"
                onClick={() => handleOpenAuth('customer')}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION WITH LIQUID GLASS AMBIENCE */}
      <section className="relative pt-8 pb-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8892E]/10 border border-[#B8892E]/20 text-[#B8892E] text-xs font-bold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bharat Pro Certified &bull; 15% Below Market Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-['Outfit'] tracking-tight text-[#1C1C1E] leading-tight">
            Professional Home Cleaning &amp; Deep Cleaning
          </h1>

          <p className="text-sm sm:text-base text-[#636366] max-w-2xl mx-auto leading-relaxed">
            Specialized Sofa Shampooing, Bathroom Hard-water Descaling, Modular Kitchen Degreasing &amp; Turnkey 3 BHK Deep Cleaning with certified German injection extraction machines.
          </p>

          {/* AI Search Bar Integration */}
          <AiAssistantBar
            onSelectService={(srv) => setSelectedService(srv)}
            onSelectOffer={(tier) => {
              const matched = INITIAL_SERVICES.find(s => s.basePrice >= tier) || INITIAL_SERVICES[0];
              setSelectedService(matched);
            }}
          />
        </div>

        {/* 3. BUMPER OFFERS AUTO-ADVANCING BANNER (10s Loop) */}
        <div className="mt-8">
          <BumperOfferBanner
            onSelectOffer={(minTier) => {
              const matched = INITIAL_SERVICES.find(s => s.basePrice >= minTier) || INITIAL_SERVICES[0];
              setSelectedService(matched);
            }}
          />
        </div>
      </section>

      {/* 4. SEPARATE CLEANING CATEGORIES GRID */}
      <section className="py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#1C1C1E]">
              Dedicated Cleaning Verticals
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93]">
              Every category is fully separate with distinct equipment, certified technicians, and SOPs
            </p>
          </div>
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              activeCategory === 'all' 
                ? 'bg-[#1C1C1E] text-white' 
                : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Show All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {INITIAL_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border ${
                  isSelected 
                    ? 'ring-2 ring-[#B8892E] border-transparent shadow-xl scale-[1.02]' 
                    : 'border-black/5 hover:border-[#B8892E]/40 hover:shadow-lg'
                }`}
              >
                <div className="h-32 sm:h-40 w-full overflow-hidden bg-black/10">
                  <img
                    src={cat.heroImage}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                </div>
                
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-xs sm:text-sm font-bold font-['Outfit'] leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-white/70 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. SERVICE CATALOGUE CARDS (With Real Before/After & 10s Demo badge) */}
      <section className="py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#1C1C1E]">
              Featured Cleaning Packages ({filteredServices.length})
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93]">
              15% savings compared to standard market benchmark in {selectedCity}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              id={`service-card-${srv.id}`}
              className="rounded-3xl liquid-glass bg-white/90 border border-white/70 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Image & Video badge */}
              <div className="relative h-48 w-full overflow-hidden bg-black/5">
                <img
                  src={srv.imageUrl}
                  alt={srv.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1C1C1E]/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5 text-[#E07B1A]" />
                  <span>{srv.demoVideoBadge}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#F9D976] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#F9D976]" /> {srv.rating} ({srv.reviewCount})
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{srv.estimatedMinutes}m
                  </span>
                </div>
              </div>

              {/* Service Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#B8892E]">
                    {srv.categoryName}
                  </span>
                  <h3 className="text-base font-bold font-['Outfit'] text-[#1C1C1E] mt-0.5 leading-snug">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-[#636366] mt-1.5 line-clamp-2">
                    {srv.shortDesc}
                  </p>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-3 border-t border-[#E5E5EA] flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-[#1C1C1E]">
                        ₹{srv.basePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs line-through text-[#8E8E93]">
                        ₹{srv.competitorPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1F8A3B]">
                      15% Lower Cost
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedService(srv)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-[#48484A] hover:bg-black/5 transition-all"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      id={`card-book-btn-${srv.id}`}
                      onClick={() => setBookingService(srv)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. REFERRAL PROGRAM & MANDATORY TRUST ASSURANCE */}
      <section className="py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl p-6 sm:p-8 liquid-glass-gold border border-[#B8892E]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-[#1F8A3B] text-white text-xs font-bold uppercase tracking-wider">
              Refer &amp; Earn ₹500
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#1C1C1E]">
              Invite Friends &amp; Receive ₹500 Direct Wallet Credit
            </h3>
            <p className="text-xs sm:text-sm text-[#636366]">
              Share your personal Bharat Pro referral code. When your friend completes their first sofa or home deep clean, both of you unlock ₹500 credit immediately.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E5EA] text-center shadow-sm shrink-0 w-full sm:w-auto">
            <span className="text-[11px] text-[#8E8E93] uppercase font-bold block mb-1">
              Your Referral Code
            </span>
            <span className="text-xl font-black font-mono tracking-widest text-[#B8892E] px-4 py-1.5 rounded-xl bg-[#F8F9FB] border border-dashed border-[#B8892E] block">
              {profile?.referralCode || 'BPRO-HERO'}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block mt-1.5">
              ₹100 Signup Bonus Active
            </span>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="mt-auto bg-[#1C1C1E] text-white py-12 px-4 sm:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <BharatProLogo size="md" variant="horizontal" theme="dark" />
            <p className="text-xs text-white/70 leading-relaxed">
              India&apos;s most reliable home cleaning marketplace with mandatory Start &amp; Completion OTP verification, official WhatsApp alerts, and German extraction tech.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#D4A24E] uppercase tracking-wider mb-3 font-['Outfit']">
              Service Verticals
            </h4>
            <ul className="space-y-1.5 text-xs text-white/70">
              <li>Sofa Deep Shampooing</li>
              <li>Bathroom Hard-water Descaling</li>
              <li>Modular Kitchen Degreasing</li>
              <li>Persian Carpet Washing</li>
              <li>King Mattress UV Clean</li>
              <li>3 BHK Turnkey Deep Cleaning</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#D4A24E] uppercase tracking-wider mb-3 font-['Outfit']">
              Live Operating Hubs
            </h4>
            <ul className="space-y-1.5 text-xs text-white/70">
              <li>Gurugram (Cyber City &amp; Golf Course)</li>
              <li>South Delhi &amp; Saket</li>
              <li>Noida Sector 62 &amp; Indirapuram</li>
              <li>Mumbai Western Suburbs &amp; BKC</li>
              <li>Bengaluru Koramangala &amp; HSR</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#D4A24E] uppercase tracking-wider mb-3 font-['Outfit']">
              Support &amp; WhatsApp
            </h4>
            <p className="text-xs text-white/70">
              Instant assistance and live booking over WhatsApp:
            </p>
            <p className="text-sm font-bold text-[#25D366] font-mono mt-1">
              +{WHATSAPP_NUMBER}
            </p>
            <button
              onClick={() => setIsAdminView(true)}
              className="mt-4 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all block text-center"
            >
              Staff &amp; Admin 2FA Portal
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-2">
          <span>&copy; {new Date().getFullYear()} Bharat Pro Expert Home Services TM. All rights reserved.</span>
          <span>Certified Quality Standard &bull; Free Tier Firebase &bull; Dual-OTP Security</span>
        </div>
      </footer>

      {/* Floating WhatsApp Widget */}
      <WhatsAppFloatingWidget />

      {/* MODALS */}
      <AuthModal
        isOpen={authModalOpen}
        defaultRole={authModalDefaultRole}
        onClose={() => setAuthModalOpen(false)}
      />

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBookNow={(srv) => {
          setSelectedService(null);
          setBookingService(srv);
        }}
      />

      <BookingFlowModal
        service={bookingService}
        onClose={() => setBookingService(null)}
        onBookingSuccess={handleBookingSuccess}
        onRequireAuth={() => setAuthModalOpen(true)}
      />

      {activeTrackingBooking && (
        <LiveTrackingModal
          booking={activeTrackingBooking}
          onClose={() => setActiveTrackingBooking(null)}
          onBookingUpdated={(upd) => {
            setActiveTrackingBooking(upd);
            setMyBookings(prev => prev.map(b => b.id === upd.id ? upd : b));
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
