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
import { HelpSupportModal } from './components/HelpSupportModal';
import { Footer } from './components/Footer';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SERVICES, 
  WHATSAPP_NUMBER 
} from './data';
import { CleaningService, Booking } from './types';
import { initializeDatabaseDefaults, getAllBookings, getAllServices } from './services/dbService';
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
  ArrowRight,
  HelpCircle
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
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  // Selected City & Hub
  const [selectedCity, setSelectedCity] = useState('Gurugram');
  const [selectedService, setSelectedService] = useState<CleaningService | null>(null);
  const [bookingService, setBookingService] = useState<CleaningService | null>(null);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<Booking | null>(null);
  const [liveServices, setLiveServices] = useState<CleaningService[]>(INITIAL_SERVICES);

  // Load and sync live services from database
  useEffect(() => {
    const fetchServices = async () => {
      const srvs = await getAllServices();
      if (srvs && srvs.length > 0) {
        setLiveServices(srvs);
      }
    };
    fetchServices();

    const handleServicesUpdated = (e: any) => {
      if (e.detail?.services) {
        setLiveServices(e.detail.services);
      } else {
        fetchServices();
      }
    };
    window.addEventListener('bharatpro_services_updated', handleServicesUpdated);
    return () => window.removeEventListener('bharatpro_services_updated', handleServicesUpdated);
  }, []);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Check URL routes & hashes for secure direct access (#admin-gateway, #partner)
  useEffect(() => {
    const handleRouteCheck = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (hash === '#admin-gateway' || hash === '#bpe-admin' || path === '/bpe-admin-gateway') {
        setIsAdminView(true);
        setIsPartnerView(false);
      } else if (hash === '#partner' || path === '/partner') {
        setIsPartnerView(true);
        setIsAdminView(false);
      }
    };

    handleRouteCheck();
    window.addEventListener('hashchange', handleRouteCheck);
    window.addEventListener('popstate', handleRouteCheck);

    // Keyboard shortcut for administrator: Ctrl+Shift+A (or Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.location.hash = '#admin-gateway';
        setIsAdminView(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleRouteCheck);
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const handleExitAdmin = () => {
    if (window.location.hash.includes('admin')) {
      window.location.hash = '';
    }
    setIsAdminView(false);
  };

  const handleExitPartner = () => {
    if (window.location.hash.includes('partner')) {
      window.location.hash = '';
    }
    setIsPartnerView(false);
  };

  if (isAdminView) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLoginGate
          onAuthorized={() => setIsAdminAuthenticated(true)}
          onBackToCustomerSite={handleExitAdmin}
        />
      );
    }

    return (
      <AdminDashboard 
        onBackToCustomerSite={handleExitAdmin} 
        onSignOut={() => {
          clearAdminSession();
          setIsAdminAuthenticated(false);
          handleExitAdmin();
        }}
      />
    );
  }

  if (isPartnerView) {
    return <PartnerDashboard onBackToCustomerSite={handleExitPartner} />;
  }

  // Native-feel Mobile APK View (Default Original View)
  if (customerViewMode === 'apk') {
    return (
      <div className="relative">
        <CustomerApkView
          onOpenAdmin={() => {
            window.location.hash = '#admin-gateway';
            setIsAdminView(true);
          }}
          onOpenPartner={() => {
            window.location.hash = '#partner';
            setIsPartnerView(true);
          }}
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
      {/* Top Announcement Bar - Clean & Professional without phone numbers */}
      <div className="bg-[#071321] text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              ISO Certified
            </span>
            <span className="text-blue-100 font-medium hidden sm:inline">
              100% Hospital-Grade Diversey &amp; Taski sanitization standards across Delhi-NCR, Mumbai &amp; Bengaluru
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <button
              onClick={() => setCustomerViewMode('apk')}
              className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
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
              className="cursor-pointer transition-transform hover:opacity-95"
              title="Bharat Pro Expert"
            >
              <BharatProLogo size="md" />
            </button>

            {/* City Selector */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs font-semibold text-[#1C1C1E]">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
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
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Mobile App View</span>
            </button>

            <button
              onClick={() => setHelpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-xs font-semibold text-[#1C1C1E] transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Help &amp; Support</span>
            </button>

            {/* User Account / Login */}
            {user || profile ? (
              <button
                onClick={() => setCustomerDashboardOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">{profile?.name || user?.displayName || 'My Account'}</span>
                {myBookings.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            ) : (
              <button
                onClick={() => handleOpenAuth('customer')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              >
                Login
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
        services={liveServices}
        selectedCity={selectedCity}
        onSelectServiceDetails={(srv) => setSelectedService(srv)}
        onProceedToBooking={(srv) => setBookingService(srv)}
      />

      {/* Professional Footer */}
      <Footer 
        onOpenPartner={() => {
          window.location.hash = '#partner';
          setIsPartnerView(true);
        }} 
        onOpenAdmin={() => {
          window.location.hash = '#admin-gateway';
          setIsAdminView(true);
        }}
        onOpenHelp={() => setHelpModalOpen(true)} 
      />

      {/* Floating WhatsApp Widget */}
      <WhatsAppFloatingWidget />

      {/* Help & Support Modal */}
      <HelpSupportModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

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
