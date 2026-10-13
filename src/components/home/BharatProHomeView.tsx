import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { FeatureStrip } from './FeatureStrip';
import { OurCleaningServicesSection } from './OurCleaningServicesSection';
import { PremiumHomeSections } from './PremiumHomeSections';
import { ServiceCatalogGrid, CartItem } from './ServiceCatalogGrid';
import { FloatingCartBar } from './FloatingCartBar';
import { IndiaLocationDetectionModal } from '../location/IndiaLocationDetectionModal';
import { TrackBookingModal } from './TrackBookingModal';
import { CategoryDetailModal } from './CategoryDetailModal';
import { AboutUsModal } from './AboutUsModal';
import { HowItWorksModal } from './HowItWorksModal';
import { LocationsModal } from './LocationsModal';
import { BlogModal } from './BlogModal';
import { Footer } from '../Footer';
import { 
  MASTER_CATALOG_CATEGORIES, 
  CatalogCategory, 
  CatalogItem,
  catalogItemToCleaningService 
} from '../../data/masterCatalogData';
import { CleaningService, Booking } from '../../types';
import './DevicePreview.css';

interface BharatProHomeViewProps {
  user: any;
  profile: any;
  myBookings: Booking[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onProceedToBooking: (service: CleaningService) => void;
  onTrackBooking: (booking: Booking) => void;
  onOpenAuth: (role?: 'customer' | 'partner') => void;
  onOpenCustomerDashboard: () => void;
  onOpenAdmin: () => void;
  onOpenPartner: () => void;
  onOpenHelp: () => void;
}

export const BharatProHomeView: React.FC<BharatProHomeViewProps> = ({
  user,
  profile,
  myBookings,
  selectedCity,
  onSelectCity,
  onProceedToBooking,
  onTrackBooking,
  onOpenAuth,
  onOpenCustomerDashboard,
  onOpenAdmin,
  onOpenPartner,
  onOpenHelp
}) => {
  const [activeNav, setActiveNav] = useState('home');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [trackBookingModalOpen, setTrackBookingModalOpen] = useState(false);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<CatalogCategory | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [howItWorksModalOpen, setHowItWorksModalOpen] = useState(false);
  const [locationsModalOpen, setLocationsModalOpen] = useState(false);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [devicePreviewMode, setDevicePreviewMode] = useState<'website' | 'tablet' | 'mobile'>('website');
  const [devicePreviewEnabled] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('devicePreview') === '1'
  );

  // Automatically trigger location prompt on website open if not already set
  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem('bpe_customer_location_v1');
      if (!savedLoc) {
        // First visit: show real location detection prompt
        setLocationModalOpen(true);
      } else {
        const parsed = JSON.parse(savedLoc);
        if (parsed.city && parsed.state) {
          onSelectCity(`${parsed.city}, ${parsed.state}`);
        }
      }
    } catch {}
  }, []);

  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('bpe_home_cart_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bpe_home_cart_v1', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Cart Handlers
  const handleAddItem = (item: CatalogItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter(c => c.item.id !== itemId);
      }
      return prev.map(c => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('bpe_home_cart_v1');
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    const primaryCartItem = cart[0].item;
    const cleaningService = catalogItemToCleaningService(primaryCartItem);
    // If multiple items, attach them as addons
    if (cart.length > 1) {
      cleaningService.addons = cart.slice(1).map(c => ({
        id: c.item.id,
        name: `${c.item.name} (${c.quantity}x)`,
        price: c.item.offerPrice * c.quantity,
        description: c.item.description
      }));
    }
    onProceedToBooking(cleaningService);
  };

  const handleScrollToCatalogue = () => {
    const el = document.getElementById('our-cleaning-services') || document.getElementById('service-catalogue-sections');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    const el = document.getElementById(categoryId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const catEl = document.getElementById('service-catalogue-sections');
      if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectDirectService = (item: CatalogItem) => {
    const service = catalogItemToCleaningService(item);
    onProceedToBooking(service);
  };

  const handleBookDirectFromCard = (cardId: string) => {
    const targetCat = MASTER_CATALOG_CATEGORIES.find(c => c.id === cardId);
    if (targetCat && targetCat.items.length > 0) {
      handleSelectDirectService(targetCat.items[0]);
    } else {
      handleSelectCategory(cardId);
    }
  };

  const handleNavigate = (sectionId: string) => {
    setActiveNav(sectionId);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (sectionId === 'services') {
      const el = document.getElementById('our-cleaning-services') || document.getElementById('service-catalogue-sections');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (sectionId === 'about') {
      setAboutModalOpen(true);
    } else if (sectionId === 'locations') {
      setLocationsModalOpen(true);
    } else if (sectionId === 'how-it-works') {
      setHowItWorksModalOpen(true);
    } else if (sectionId === 'blog') {
      setBlogModalOpen(true);
    }
  };

  if (devicePreviewEnabled) {
    const previewUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '/';
    const previewWidth = devicePreviewMode === 'website' ? '100%' : devicePreviewMode === 'tablet' ? '820px' : '390px';

    return (
      <main className="bpe-device-preview-page">
        <div className="bpe-device-preview-toolbar">
          <div className="bpe-device-preview-heading">
            <strong>Responsive preview</strong>
            <span>Check the same website in three viewport sizes</span>
          </div>
          <div className="bpe-device-preview-options" role="group" aria-label="Preview size">
            {(['website', 'tablet', 'mobile'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={devicePreviewMode === mode}
                className={devicePreviewMode === mode ? 'is-active' : ''}
                onClick={() => setDevicePreviewMode(mode)}
              >
                {mode === 'website' ? 'Website' : mode === 'tablet' ? 'Tablet' : 'Mobile'}
              </button>
            ))}
          </div>
          <a className="bpe-device-preview-exit" href={previewUrl}>Exit preview</a>
        </div>
        <div className="bpe-device-preview-stage">
          <iframe
            title={`Bharat Pro Expert ${devicePreviewMode} preview`}
            src={previewUrl}
            className={`bpe-device-preview-frame bpe-device-preview-frame--${devicePreviewMode}`}
            style={{ width: previewWidth }}
          />
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F8F9FB] flex flex-col font-['Inter',sans-serif] text-slate-800">
      
      {/* 1. Header / Navigation */}
      <Header
        activeNav={activeNav}
        onNavigate={handleNavigate}
        selectedCity={selectedCity}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        onOpenTrackBookingModal={() => setTrackBookingModalOpen(true)}
        onOpenBookNow={handleScrollToCatalogue}
        onOpenAuth={() => onOpenAuth('customer')}
        onOpenCustomerDashboard={onOpenCustomerDashboard}
        onOpenHelp={onOpenHelp}
        user={user}
        profile={profile}
        bookingsCount={myBookings.length}
      />

      {/* 2. Hero Section */}
      <HeroSection
        selectedLocation={selectedCity}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        onSelectServiceItem={handleSelectDirectService}
        onOpenBookNow={handleScrollToCatalogue}
      />

      {/* 3. Trust & Feature Strip */}
      <FeatureStrip />

      {/* 4. Our Cleaning Services (4 Large Category Cards) */}
      <OurCleaningServicesSection
        onSelectCategory={handleSelectCategory}
        onViewAll={handleScrollToCatalogue}
        onBookDirect={handleBookDirectFromCard}
      />

      {/* 5. Complete Service Catalogue (5-Column Desktop Grid for all 10 Categories) */}
      <ServiceCatalogGrid
        cart={cart}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onOpenCategoryModal={(cat) => setSelectedCategoryModal(cat)}
        onItemClick={handleSelectDirectService}
      />

      {/* 6. Full-page luxury sections: packages, pricing, benefits, steps, reviews, areas and FAQs */}
      <PremiumHomeSections
        onBookNow={handleScrollToCatalogue}
        onOpenLocations={() => setLocationsModalOpen(true)}
      />

      {/* 7. Floating Cart Bar (Appears when items are in cart) */}
      <FloatingCartBar
        cart={cart}
        onProceedToCheckout={handleProceedToCheckout}
        onClearCart={handleClearCart}
      />

      {/* 8. Footer */}
      <Footer
        onOpenPartner={onOpenPartner}
        onOpenAdmin={onOpenAdmin}
        onOpenHelp={onOpenHelp}
      />

      {/* Interactive Modals */}
      <IndiaLocationDetectionModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocationName={selectedCity}
        onLocationResolved={(loc) => {
          onSelectCity(`${loc.city}, ${loc.state}`);
        }}
      />

      <TrackBookingModal
        isOpen={trackBookingModalOpen}
        onClose={() => setTrackBookingModalOpen(false)}
        onOpenLiveTrackingModal={(bk) => onTrackBooking(bk)}
      />

      <CategoryDetailModal
        category={selectedCategoryModal}
        onClose={() => setSelectedCategoryModal(null)}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        cart={cart}
      />

      <AboutUsModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        onOpenBookNow={() => {
          setAboutModalOpen(false);
          handleScrollToCatalogue();
        }}
      />

      <HowItWorksModal
        isOpen={howItWorksModalOpen}
        onClose={() => setHowItWorksModalOpen(false)}
        onOpenBookNow={() => {
          setHowItWorksModalOpen(false);
          handleScrollToCatalogue();
        }}
      />

      <LocationsModal
        isOpen={locationsModalOpen}
        onClose={() => setLocationsModalOpen(false)}
        onSelectCity={(city) => onSelectCity(city)}
      />

      <BlogModal
        isOpen={blogModalOpen}
        onClose={() => setBlogModalOpen(false)}
        onOpenBookNow={() => {
          setBlogModalOpen(false);
          handleScrollToCatalogue();
        }}
      />

    </div>
  );
};

export default BharatProHomeView;
