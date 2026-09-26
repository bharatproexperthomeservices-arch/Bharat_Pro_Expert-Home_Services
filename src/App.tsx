import React, { useState, useEffect } from 'react';
import { BharatProLogo } from './components/BharatProLogo';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { BookingFlowModal } from './components/BookingFlowModal';
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { WhatsAppFloatingWidget } from './components/WhatsAppFloatingWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginGate } from './components/AdminLoginGate';
import { PartnerDashboard } from './components/PartnerDashboard';
import { CustomerApkView } from './components/CustomerApkView';
import { UrbanCompanyCleaningView } from './components/UrbanCompanyCleaningView';
import { CustomerDashboardModal } from './components/CustomerDashboardModal';
import { BumperOfferBanner } from './components/BumperOfferBanner';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SERVICES, 
  WHATSAPP_NUMBER 
} from './data';
import { CleaningService, Booking } from './types';
import { initializeDatabaseDefaults, getAllBookings } from './services/dbService';
import { 
  getAdminSession, 
  isOwnerEmail, 
  clearAdminSession 
} from './services/adminAuthService';
import { 
  Sparkles, 
  User, 
  ShieldCheck, 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Smartphone,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

function AppContent() {
  const { user, profile, signOut } = useAuth();

  // Navigation & Modals: default to 'apk' (The original deployed app)
  const [isAdminView, setIsAdminView] = useState(false);
  const [isPartnerView, setIsPartnerView] = useState(false);
  const [customerViewMode, setCustomerViewMode] = useState<'apk' | 'catalog'>('apk');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalDefaultRole, setAuthModalDefaultRole] = useState<'customer' | 'partner'>('customer');
  const [customerDashboardOpen, setCustomerDashboardOpen] = useState(false);
  
  // Selected City & Hub
  const [selectedCity, setSelectedCity] = useState('Gurugram');
  const [selectedService, setSelectedService] = useState<CleaningService | null>(null);
  const [bookingService, setBookingService] = useState<CleaningService | null>(null);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<Booking | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Check admin session
  useEffect(() => {
    const session = getAdminSession();
    if (session && isOwnerEmail(session.email)) {
      setIsAdminAuthenticated(true);
    } else {
      setIsAdminAuthenticated(false);
    }
  }, [isAdminView]);

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

  if (isAdminView) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLoginGate
          onAuthorized={() => setIsAdminAuthenticated(true)}
          onBackToCustomerSite={() => setIsAdminView(false)}
        />
      );
    }

    return (
      <AdminDashboard 
        onBackToCustomerSite={() => setIsAdminView(false)} 
        onSignOut={() => {
          clearAdminSession();
          setIsAdminAuthenticated(false);
          setIsAdminView(false);
        }}
      />
    );
  }

  if (isPartnerView) {
    return <PartnerDashboard onBackToCustomerSite={() => setIsPartnerView(false)} />;
  }

  // Native-feel Mobile APK View (Default Original View)
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

  // Web Marketplace View
  return (
    <div className="relative min-h-screen bg-[#F8F9FB] flex flex-col font-['Inter',sans-serif]">
      {/* Top Announcement Bar */}
      <div className="bg-[#1C1C1E] text-white text-xs py-2 px-4 border-b border-[#2C2C2E]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#B8892E] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Festive Offer
            </span>
            <span className="text-[#D4A24E] font-medium hidden sm:inline">
              Flat 15% Savings automatically applied to all Diversey Hospital-Grade Sanitization services!
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#8E8E93] text-[11px]">
            <a href="tel:8920252647" className="hover:text-white transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#B8892E]" />
              <span>24/7 Helpline: 8920252647</span>
            </a>
            <button
              onClick={() => setCustomerViewMode('apk')}
              className="text-[#B8892E] hover:text-[#D4A24E] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Smartphone className="w-3 h-3" />
              <span>📱 Switch to App View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCustomerViewMode('apk')}
              className="cursor-pointer"
              title="Bharat Pro Expert"
            >
              <BharatProLogo size="md" variant="horizontal" />
            </button>

            {/* City Selector */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs font-semibold text-[#1C1C1E]">
              <MapPin className="w-3.5 h-3.5 text-[#B8892E]" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-xs font-bold text-[#1C1C1E]"
              >
                <option value="Gurugram">Gurugram (Cyber City, Golf Course Rd)</option>
                <option value="Delhi NCR">South Delhi &amp; Saket</option>
                <option value="Noida">Noida (Sector 62, 50, 137)</option>
                <option value="Mumbai">Mumbai (Bandra, Andheri, Powai)</option>
                <option value="Bengaluru">Bengaluru (Indiranagar, Whitefield)</option>
              </select>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCustomerViewMode('apk')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-xs font-bold text-[#1C1C1E] transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#B8892E]" />
              <span>Mobile App View</span>
            </button>

            <button
              onClick={() => setIsPartnerView(true)}
              className="px-3 py-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-xs font-semibold text-[#1C1C1E] transition-all cursor-pointer"
            >
              Partner Portal
            </button>

            <button
              onClick={() => setIsAdminView(true)}
              className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-xs font-bold text-amber-900 transition-all cursor-pointer"
            >
              Admin Desk
            </button>

            {/* User Account / Login */}
            {user || profile ? (
              <button
                onClick={() => setCustomerDashboardOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold hover:bg-[#2C2C2E] transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#B8892E]" />
                <span className="hidden sm:inline">{profile?.name || user?.displayName || 'My Account'}</span>
                {myBookings.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#1F8A3B]" />
                )}
              </button>
            ) : (
              <button
                onClick={() => handleOpenAuth('customer')}
                className="px-4 py-2 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold hover:bg-[#2C2C2E] transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bumper Offer Banner Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <BumperOfferBanner onSelectOffer={() => {
          const first = INITIAL_SERVICES[0];
          setSelectedService(first);
        }} />
      </div>

      {/* Urban Company Cleaning Marketplace View */}
      <UrbanCompanyCleaningView
        categories={INITIAL_CATEGORIES}
        services={INITIAL_SERVICES}
        selectedCity={selectedCity}
        onSelectServiceDetails={(srv) => setSelectedService(srv)}
        onProceedToBooking={(srv) => setBookingService(srv)}
      />

      {/* Floating WhatsApp Widget */}
      <WhatsAppFloatingWidget />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        defaultRole={authModalDefaultRole}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Service Details Modal */}
      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBookNow={(srv) => {
          setSelectedService(null);
          setBookingService(srv);
        }}
      />

      {/* Booking Checkout Flow */}
      <BookingFlowModal
        service={bookingService}
        onClose={() => setBookingService(null)}
        onBookingSuccess={handleBookingSuccess}
        onRequireAuth={() => handleOpenAuth('customer')}
      />

      {/* Real-Time Live Tracking Modal */}
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

      {/* Customer Account & Bookings Dashboard Modal */}
      <CustomerDashboardModal
        isOpen={customerDashboardOpen}
        onClose={() => setCustomerDashboardOpen(false)}
        user={user}
        profile={profile}
        onSignOut={signOut}
        myBookings={myBookings}
        onTrackBooking={(bk) => {
          setCustomerDashboardOpen(false);
          setActiveTrackingBooking(bk);
        }}
      />
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
