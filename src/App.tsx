import React, { useState, useEffect } from 'react';
import { BharatProLogo } from './components/BharatProLogo';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { BookingFlowModal } from './components/BookingFlowModal';
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { WhatsAppFloatingWidget } from './components/WhatsAppFloatingWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { PartnerDashboard } from './components/PartnerDashboard';
import { UrbanCompanyCleaningView } from './components/UrbanCompanyCleaningView';
import { CustomerApkView } from './components/CustomerApkView';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SERVICES, 
  WHATSAPP_NUMBER 
} from './data';
import { CleaningService, Booking } from './types';
import { initializeDatabaseDefaults, getAllBookings } from './services/dbService';
import { 
  Search, 
  MapPin, 
  Clock, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Briefcase,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

function AppContent() {
  const { user, profile, signOut } = useAuth();

  // Navigation & Modals
  const [isAdminView, setIsAdminView] = useState(false);
  const [isPartnerView, setIsPartnerView] = useState(false);
  const [customerViewMode, setCustomerViewMode] = useState<'apk' | 'catalog'>('apk');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalDefaultRole, setAuthModalDefaultRole] = useState<'customer' | 'partner'>('customer');
  
  // Selected City & Hub
  const [selectedCity, setSelectedCity] = useState('Gurugram');
  const [selectedService, setSelectedService] = useState<CleaningService | null>(null);
  const [bookingService, setBookingService] = useState<CleaningService | null>(null);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<Booking | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

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
    setBookingService(null);
    setMyBookings(prev => [newBooking, ...prev]);
    setActiveTrackingBooking(newBooking);
  };

  // Filter services by search if user types
  const displayedServices = searchQuery.trim()
    ? INITIAL_SERVICES.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : INITIAL_SERVICES;

  if (isAdminView) {
    return <AdminDashboard onBackToCustomerSite={() => setIsAdminView(false)} />;
  }

  if (isPartnerView) {
    return <PartnerDashboard onBackToCustomerSite={() => setIsPartnerView(false)} />;
  }

  // Primary Customer Experience: Native-feel Customer APK App (Same to same as requested)
  if (customerViewMode === 'apk') {
    return (
      <div className="relative">
        <CustomerApkView
          onOpenAdmin={() => setIsAdminView(true)}
          onOpenPartner={() => setIsPartnerView(true)}
          onOpenAuth={(role) => handleOpenAuth(role)}
          onTrackBooking={(bk) => setActiveTrackingBooking(bk)}
          onToggleCatalog={() => setCustomerViewMode('catalog')}
        />

        <WhatsAppFloatingWidget />

        <AuthModal
          isOpen={authModalOpen}
          defaultRole={authModalDefaultRole}
          onClose={() => setAuthModalOpen(false)}
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1C1C1E] flex flex-col font-['Plus_Jakarta_Sans']">
      
      {/* 1. URBAN COMPANY CLEAN WHITE STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E5EA] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & City Selector */}
          <div className="flex items-center gap-4 sm:gap-6">
            <BharatProLogo size="md" variant="horizontal" />

            {/* Urban Company Style Location Box */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] hover:border-[#D1D1D6] transition-all cursor-pointer">
              <MapPin className="w-3.5 h-3.5 text-[#B8892E]" />
              <div className="text-left">
                <span className="text-[10px] text-[#8E8E93] uppercase font-bold block leading-none">Serving in</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs font-bold text-[#1C1C1E] cursor-pointer pr-1"
                >
                  <option value="Gurugram">Gurugram (Cyber / Golf Course)</option>
                  <option value="New Delhi">South Delhi &amp; Saket</option>
                  <option value="Noida">Noida Sector 62 &amp; NCR</option>
                  <option value="Mumbai">Mumbai Western &amp; BKC</option>
                  <option value="Bengaluru">Bengaluru Tech Hub</option>
                </select>
              </div>
            </div>
          </div>

          {/* Urban Company Search Bar (In-Header) */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for 'bathroom cleaning', 'sofa shampoo', 'kitchen deep clean'..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] focus:bg-white text-xs font-medium text-[#1C1C1E] outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8E8E93] hover:text-[#1C1C1E]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Switch to APK Mode */}
            <button
              onClick={() => setCustomerViewMode('apk')}
              className="px-3 py-1.5 rounded-xl bg-[#0b3ba8] text-white hover:bg-blue-800 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Switch to Customer APK App"
            >
              <span>📱 Customer APK App</span>
            </button>

            {/* Partner Portal Switch */}
            <button
              onClick={() => setIsPartnerView(true)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E5EA] hover:bg-[#F2F2F7] text-[11px] font-bold text-[#1C1C1E] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Switch to Partner / Professional Dashboard"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#B8892E]" />
              <span className="hidden sm:inline">Partner Portal</span>
            </button>

            {/* Admin Switch */}
            <button
              onClick={() => setIsAdminView(true)}
              className="px-3 py-1.5 rounded-xl border border-dashed border-[#B8892E] hover:bg-[#B8892E]/5 text-[11px] font-bold text-[#B8892E] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Switch to Admin Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Dashboard</span>
            </button>

            {/* User Account / Sign In */}
            {user || profile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (myBookings.length > 0) {
                      setActiveTrackingBooking(myBookings[0]);
                    } else {
                      alert('You have no active orders yet.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5 shadow-2xs hover:bg-[#F2F2F7] cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-[#B8892E]" />
                  <span>My Bookings ({myBookings.length})</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-[#E5E5EA]">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-7 h-7 rounded-full object-cover border border-black/10"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center text-xs font-bold">
                      {profile?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    className="p-1.5 text-[#8E8E93] hover:text-red-600 rounded-lg hover:bg-black/5 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="header-google-login-btn"
                  onClick={() => handleOpenAuth('customer')}
                  className="px-4 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#F9D976]" />
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="p-3 border-t border-[#F2F2F7] md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for bathroom, sofa, kitchen..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F2F2F7] text-xs font-medium text-[#1C1C1E] outline-none"
            />
          </div>
        </div>
      </header>

      {/* 2. CORE URBAN COMPANY CLEANING EXPERIENCE */}
      <main className="flex-1">
        <UrbanCompanyCleaningView
          categories={INITIAL_CATEGORIES}
          services={displayedServices}
          selectedCity={selectedCity}
          onSelectServiceDetails={(srv) => setSelectedService(srv)}
          onProceedToBooking={(primaryService) => setBookingService(primaryService)}
        />
      </main>

      {/* 3. URBAN COMPANY STYLE FOOTER */}
      <footer className="bg-[#1C1C1E] text-white py-12 px-4 sm:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <BharatProLogo size="md" variant="horizontal" theme="dark" />
            <p className="text-xs text-white/70 leading-relaxed">
              India&apos;s specialized professional cleaning marketplace. Powered by Diversey hospital-grade chemicals, German extraction machines, and verified background-checked experts.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Quality Assurance Guarantee</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#D4A24E] uppercase tracking-wider mb-3">
              Cleaning Verticals
            </h4>
            <ul className="space-y-1.5 text-xs text-white/70">
              <li>Bathroom Intense &amp; Classic Descaling</li>
              <li>Fabric &amp; Leather Sofa Shampooing</li>
              <li>Modular Kitchen &amp; Chimney Degreasing</li>
              <li>Furnished &amp; Unfurnished Full Home Cleaning</li>
              <li>Mattress Anti-Dust Mite UV Treatment</li>
              <li>Floor Scrubbing with Single-Disc Machine</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#D4A24E] uppercase tracking-wider mb-3">
              Active Hubs
            </h4>
            <ul className="space-y-1.5 text-xs text-white/70">
              <li>Gurugram (Cyber City, Sector 56, Golf Course)</li>
              <li>South Delhi (Saket, Hauz Khas, Greater Kailash)</li>
              <li>Noida (Sector 62, Indirapuram, Expressway)</li>
              <li>Mumbai (BKC, Andheri, Bandra, Powai)</li>
              <li>Bengaluru (Koramangala, HSR, Indiranagar)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#D4A24E] uppercase tracking-wider mb-3">
              Direct Contact &amp; Support
            </h4>
            <div className="space-y-1.5 text-xs text-white/80">
              <p>
                <span className="text-white/50 block text-[10px] uppercase font-bold">Email Support:</span>
                <a href="mailto:bharatproexpert@gmail.com" className="text-amber-300 hover:underline font-mono">
                  bharatproexpert@gmail.com
                </a>
              </p>
              <p>
                <span className="text-white/50 block text-[10px] uppercase font-bold">Customer Helpline / WhatsApp:</span>
                <a href="tel:+918920252647" className="text-[#25D366] font-bold font-mono text-sm hover:underline block">
                  +91 8920252647
                </a>
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsAdminView(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
              >
                Admin Console
              </button>
              <button
                onClick={() => setIsPartnerView(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
              >
                Partner Console
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-2">
          <span>&copy; {new Date().getFullYear()} Bharat Pro Expert Home Services. All rights reserved.</span>
          <span>Urban Company Style Pure Cleaning Platform &bull; Real Dual OTP Verification &bull; Manual Hub Dispatch</span>
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
