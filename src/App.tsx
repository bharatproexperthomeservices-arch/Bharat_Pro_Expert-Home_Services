import React, { useState, useEffect } from 'react';
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
import { BharatProHomeView } from './components/home/BharatProHomeView';
import { CustomerDashboardModal } from './components/CustomerDashboardModal';
import { HelpSupportModal } from './components/HelpSupportModal';
import { INITIAL_SERVICES } from './data';
import { CleaningService, Booking } from './types';
import { initializeDatabaseDefaults, getAllBookings, getAllServices } from './services/dbService';
import { 
  getAdminSession, 
  isOwnerEmail, 
  clearAdminSession 
} from './services/adminAuthService';

function AppContent() {
  const { user, profile, signOut } = useAuth();

  // Navigation & View Mode: Default to modern responsive website UI/UX
  const [isAdminView, setIsAdminView] = useState(false);
  const [isPartnerView, setIsPartnerView] = useState(false);
  const [customerViewMode, setCustomerViewMode] = useState<'website' | 'apk'>('website');
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

  // Load user bookings and listen to real-time booking creations
  useEffect(() => {
    const fetchBookings = async () => {
      const custId = user?.uid || profile?.uid;
      const phone = user?.phoneNumber || profile?.phone || localStorage.getItem('bharat_pro_last_customer_phone') || undefined;
      const bks = await getAllBookings(custId, phone);
      setMyBookings(bks);
    };
    fetchBookings();

    const handleBookingUpdated = (e: any) => {
      if (e.detail?.booking) {
        setMyBookings(prev => {
          const existing = prev.findIndex(b => b.id === e.detail.booking.id);
          if (existing !== -1) {
            const copy = [...prev];
            copy[existing] = e.detail.booking;
            return copy;
          }
          return [e.detail.booking, ...prev];
        });
      } else {
        fetchBookings();
      }
    };

    window.addEventListener('bharatpro_booking_updated', handleBookingUpdated);
    return () => window.removeEventListener('bharatpro_booking_updated', handleBookingUpdated);
  }, [user, profile]);

  const handleOpenAuth = (targetRole: 'customer' | 'partner' = 'customer') => {
    setAuthModalDefaultRole(targetRole);
    setAuthModalOpen(true);
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    setBookingService(null);
    setMyBookings(prev => {
      const remaining = prev.filter(b => b.id !== newBooking.id);
      return [newBooking, ...remaining];
    });
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
          onToggleCatalog={() => setCustomerViewMode('website')}
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

  // Modern Responsive Website UI/UX (Bharat Pro Expert Master Home Screen)
  return (
    <div className="relative min-h-screen bg-[#F8F9FB] flex flex-col font-['Inter',sans-serif]">
      <BharatProHomeView
        user={user}
        profile={profile}
        myBookings={myBookings}
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        onProceedToBooking={(service) => setBookingService(service)}
        onTrackBooking={(booking) => setActiveTrackingBooking(booking)}
        onOpenAuth={(role) => handleOpenAuth(role)}
        onOpenCustomerDashboard={() => setCustomerDashboardOpen(true)}
        onOpenAdmin={() => {
          window.location.hash = '#admin-gateway';
          setIsAdminView(true);
        }}
        onOpenPartner={() => {
          window.location.hash = '#partner';
          setIsPartnerView(true);
        }}
        onOpenHelp={() => setHelpModalOpen(true)}
        onToggleMobileView={() => setCustomerViewMode('apk')}
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
