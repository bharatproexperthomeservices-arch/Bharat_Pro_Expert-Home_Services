import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Booking, HubLocation } from '../types';
import { CLEANING_20_CATEGORIES, CleaningCategoryDetail } from '../cleaningCategoriesData';
import { createNewBooking, getAllHubs, getAllBookings } from '../services/dbService';
import confetti from 'canvas-confetti';
import { 
  Phone, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Tag, 
  Compass, 
  Navigation, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  User,
  LogOut,
  Calendar,
  CreditCard,
  Banknote,
  Search,
  Bell,
  Menu,
  Check,
  X,
  ExternalLink,
  Layers,
  ArrowRight,
  Shield,
  Play,
  Pause,
  Volume2,
  VolumeX,
  HelpCircle,
  Info,
  Star
} from 'lucide-react';

interface CustomerApkViewProps {
  onOpenAdmin: () => void;
  onOpenPartner: () => void;
  onOpenAuth: (role?: 'customer' | 'partner') => void;
  onTrackBooking: (booking: Booking) => void;
  onToggleCatalog?: () => void;
}

interface ServicePackage {
  name: string;
  price: number;
}

export interface ApkService {
  id: string;
  n: string;
  e: string;
  c: string;
  pk: [string, number][];
  inc: string[];
  detail: CleaningCategoryDetail;
}

const ID_ALIASES: Record<string, string> = {
  bath: 'bathroom-cleaning',
  sofa: 'sofa-cleaning',
  home: 'full-home-deep-cleaning',
  kit: 'kitchen-cleaning',
  car: 'carpet-cleaning',
  mat: 'mattress-cleaning',
  tank: 'water-tank-cleaning',
  win: 'window-cleaning'
};

const resolveCategoryId = (id: string): string => ID_ALIASES[id] || id;

const SV: ApkService[] = CLEANING_20_CATEGORIES.map(cat => ({
  id: cat.id,
  n: cat.name,
  e: cat.emoji,
  c: cat.bgColor,
  pk: cat.packages.map(p => [p.label, p.price] as [string, number]),
  inc: cat.inclusions,
  detail: cat
}));

const SLOTS = ['8 – 10 AM', '10 AM – 12 PM', '12 – 2 PM', '2 – 4 PM', '4 – 6 PM', '6 – 8 PM'];
const CITIES = ['Gurgaon', 'Gurugram', 'South Delhi', 'Noida', 'Faridabad', 'Ghaziabad', 'Mumbai', 'Bengaluru'];

interface CartItem {
  s: string; // service id
  p: number; // package index
  q: number; // quantity
}

export const CustomerApkView: React.FC<CustomerApkViewProps> = ({
  onOpenAdmin,
  onOpenPartner,
  onOpenAuth,
  onTrackBooking,
  onToggleCatalog
}) => {
  const { user, profile, signOut } = useAuth();

  // Navigation View: 'home' | 'sv' | 'cart' | 'addr' | 'slot' | 'pay' | 'bk' | 'off' | 'pf'
  const [view, setView] = useState<'home' | 'sv' | 'cart' | 'addr' | 'slot' | 'pay' | 'bk' | 'off' | 'pf'>('home');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('bath');
  
  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('bpe_cart_v3');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Selected City & Address State
  const [city, setCity] = useState<string>(() => localStorage.getItem('bpe_city_v3') || 'Gurgaon');
  const [address, setAddress] = useState({
    type: 'Home',
    line: '',
    house: '',
    lm: '',
    pin: '122002',
    city: 'Gurgaon',
    lat: 28.4595,
    lng: 77.0266
  });

  // GPS Geolocation status
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Slot Selection
  const [slotDateIdx, setSlotDateIdx] = useState(0);
  const [slotTimeIdx, setSlotTimeIdx] = useState<number>(-1);

  // Payment & Coupon
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [coupon, setCoupon] = useState<string>('');
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Customer Bookings
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Available Hubs
  const [hubs, setHubs] = useState<HubLocation[]>([]);

  // Before/After Sliders State (0-100)
  const [sliderBath, setSliderBath] = useState(50);
  const [sliderSofa, setSliderSofa] = useState(50);
  const [sliderKit, setSliderKit] = useState(50);
  const [sliderFloor, setSliderFloor] = useState(50);
  const [detailSlider, setDetailSlider] = useState(50);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'popular' | 'deep' | 'furniture' | 'specialized'>('all');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Sync cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('bpe_cart_v3', JSON.stringify(cart));
  }, [cart]);

  // Load bookings and hubs
  useEffect(() => {
    const loadInit = async () => {
      try {
        const bks = await getAllBookings(user?.uid || profile?.uid);
        setCustomerBookings(bks);
        const hList = await getAllHubs();
        setHubs(hList);
      } catch (e) {
        console.warn('Error loading APK data:', e);
      }
    };
    loadInit();
  }, [user, profile, view]);

  // Service lookup
  const getService = (id: string) => {
    const resolved = resolveCategoryId(id);
    return SV.find(s => s.id === resolved) || SV[0];
  };

  // Quantity helper
  const getQty = (sId: string, pIdx: number) => {
    const item = cart.find(x => x.s === sId && x.p === pIdx);
    return item ? item.q : 0;
  };

  const setQty = (sId: string, pIdx: number, delta: number) => {
    setCart(prev => {
      let updated = [...prev];
      const existing = updated.find(x => x.s === sId && x.p === pIdx);
      if (!existing) {
        if (delta > 0) {
          updated.push({ s: sId, p: pIdx, q: delta });
        }
      } else {
        existing.q += delta;
        if (existing.q <= 0) {
          updated = updated.filter(x => !(x.s === sId && x.p === pIdx));
        }
      }
      return updated;
    });
  };

  // Cart Totals
  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const s = getService(item.s);
      const pkg = s.pk[item.p];
      return sum + (pkg ? pkg[1] * item.q : 0);
    }, 0);

    let discount = 0;
    if (coupon === 'FIRST10') {
      discount = Math.min(150, Math.round(subtotal * 0.10));
    } else if (coupon === 'BHARAT500' && subtotal >= 1000) {
      discount = 500;
    } else if (coupon === 'COMBO200' && subtotal >= 600) {
      discount = 200;
    }

    const net = Math.max(0, subtotal - discount);
    const count = cart.reduce((sum, item) => sum + item.q, 0);

    return { subtotal, discount, total: net, count };
  };

  const tot = calculateTotal();

  // Apply Coupon
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (code === 'FIRST10') {
      setCoupon('FIRST10');
      setCouponFeedback('🎉 10% First Booking discount applied (up to ₹150)!');
      showToast('Coupon FIRST10 applied!');
    } else if (code === 'BHARAT500') {
      setCoupon('BHARAT500');
      setCouponFeedback('🎉 ₹500 Mega Discount applied on orders ₹1000+!');
      showToast('Coupon BHARAT500 applied!');
    } else if (code === 'COMBO200') {
      setCoupon('COMBO200');
      setCouponFeedback('🎉 ₹200 Combo Discount applied!');
      showToast('Coupon COMBO200 applied!');
    } else {
      setCouponFeedback('Invalid coupon code. Try FIRST10, BHARAT500, or COMBO200');
      showToast('Invalid Coupon');
    }
  };

  // GPS Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this browser.');
      return;
    }

    setDetectingGps(true);
    setGpsMessage('Acquiring precise satellite GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setAddress(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));

        setGpsMessage(`GPS Locked: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (±${Math.round(accuracy)}m)`);
        showToast('📍 Location Captured via GPS!');

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (resp.ok) {
            const data = await resp.json();
            const addr = data.address || {};
            const road = addr.road || addr.residential || addr.suburb || '';
            const detectedCity = addr.city || addr.town || addr.state_district || 'Gurgaon';
            const detectedPin = addr.postcode || '122002';

            setAddress(prev => ({
              ...prev,
              line: road || prev.line || data.display_name.split(',')[0],
              city: detectedCity,
              pin: detectedPin
            }));
            setCity(detectedCity);
            localStorage.setItem('bpe_city_v3', detectedCity);
          }
        } catch (e) {
          console.warn('Reverse geocoding err:', e);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        console.warn('GPS error:', err);
        setDetectingGps(false);
        setGpsMessage('GPS permission denied. Please enter address manually.');
        showToast('Could not access GPS');
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
    );
  };

  // Proceed to book from cart
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('Your cart is empty');
      return;
    }
    setView('addr');
    window.scrollTo(0, 0);
  };

  // Confirm booking
  const handleConfirmOrder = async () => {
    if (!address.house && !address.line) {
      showToast('Please enter your house or street address');
      setView('addr');
      return;
    }

    if (slotTimeIdx < 0) {
      showToast('Please select a time slot');
      setView('slot');
      return;
    }

    setBookingLoading(true);

    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + slotDateIdx);
      const dateStr = targetDate.toISOString().split('T')[0];
      const slotStr = SLOTS[slotTimeIdx];

      // Identify main service from cart
      const primaryItem = cart[0];
      const primaryService = getService(primaryItem.s);
      const pkg = primaryService.pk[primaryItem.p];

      // Match Hub
      const matchedHub = hubs.find(h => 
        h.city.toLowerCase().includes(address.city.toLowerCase()) ||
        address.city.toLowerCase().includes(h.city.toLowerCase())
      ) || (hubs.length > 0 ? hubs[0] : {
        id: 'hub_gurgaon_central',
        name: 'Gurgaon DLF CyberCity Hub',
        city: 'Gurugram',
        state: 'Haryana',
        lat: 28.4900,
        lng: 77.0850,
        serviceRadiusKm: 25,
        coveredSectors: ['DLF Phase 1-5', 'Sushant Lok', 'Golf Course Road'],
        address: 'Sector 25, Gurugram',
        contactPhone: '+91 8920252647',
        managerName: 'Operations Lead',
        operatingHours: '07:00 - 21:00',
        activePartnersCount: 18,
        createdAt: new Date().toISOString()
      });

      const bookingId = 'bpe_apk_' + Math.random().toString(36).substring(2, 9);
      const bookingNumber = 'BPE-' + Math.floor(100000 + Math.random() * 900000);
      const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();

      const newBookingRecord: Booking = {
        id: bookingId,
        bookingNumber,
        customerId: user?.uid || profile?.uid || 'guest_' + Math.random().toString(36).substring(2, 7),
        customerName: profile?.name || user?.displayName || 'Customer',
        customerPhone: profile?.phone || '8920252647',
        customerEmail: user?.email || profile?.email || 'bharatproexpert@gmail.com',
        serviceId: primaryService.id,
        serviceName: `${primaryService.n} (${pkg ? pkg[0] : 'Standard'})`,
        categoryName: primaryService.n,
        date: dateStr,
        timeSlot: slotStr,
        assignedHubId: matchedHub.id,
        address: {
          street: `${address.house ? address.house + ', ' : ''}${address.line}${address.lm ? ' (Near ' + address.lm + ')' : ''}`,
          sector: address.type + ' Area',
          city: address.city || city,
          state: 'Haryana',
          pincode: address.pin || '122002',
          lat: address.lat,
          lng: address.lng
        },
        selectedAddons: [],
        basePrice: tot.subtotal,
        addonsPrice: 0,
        taxesGst: 0,
        convenienceFee: 0,
        discount: tot.discount,
        totalAmount: tot.total,
        appliedCoupon: coupon || undefined,
        priceSnapshot: {
          basePrice: tot.subtotal,
          referencePrice: Math.round(tot.subtotal / 0.85),
          customerSavings: tot.discount,
          discountPct: 15,
          pricingMode: 'REFERENCE_PERCENT',
          priceVersion: 'apk-v1.0.0',
          addonsPrice: 0,
          taxesGst: 0,
          convenienceFee: 0,
          discount: tot.discount,
          totalAmount: tot.total,
          capturedAt: new Date().toISOString()
        },
        paymentMethod: paymentMethod === 'cash' ? 'PAY_AFTER_SERVICE' : 'UPI',
        paymentStatus: paymentMethod === 'cash' ? 'PENDING' : 'PAID',
        transactionId: 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        startOtp,
        completionOtp,
        status: 'SEARCHING_PROFESSIONAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const created = await createNewBooking(newBookingRecord);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      // Clear cart & update bookings
      setCart([]);
      localStorage.removeItem('bpe_cart_v3');
      setCustomerBookings(prev => [created, ...prev]);

      showToast('🎉 Booking Confirmed! Finding Best Pro...');
      setBookingLoading(false);

      // Directly open real-time live tracking
      onTrackBooking(created);
      setView('bk');
    } catch (e) {
      console.error('Failed to create APK booking:', e);
      showToast('Failed to create booking. Please retry.');
      setBookingLoading(false);
    }
  };

  // Filtered Services for Search & Category Tabs
  const filteredServices = SV.filter(s => {
    const matchesSearch = !searchFilter || 
      s.n.toLowerCase().includes(searchFilter.toLowerCase()) || 
      s.detail.tagline.toLowerCase().includes(searchFilter.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeCategoryFilter === 'popular') {
      return ['bathroom-cleaning', 'full-home-deep-cleaning', 'sofa-cleaning', 'kitchen-cleaning'].includes(s.id);
    }
    if (activeCategoryFilter === 'deep') {
      return ['full-home-deep-cleaning', 'bathroom-cleaning', 'kitchen-cleaning', 'move-in-cleaning', 'move-out-cleaning', 'floor-cleaning'].includes(s.id);
    }
    if (activeCategoryFilter === 'furniture') {
      return ['sofa-cleaning', 'carpet-cleaning', 'mattress-cleaning', 'room-cleaning'].includes(s.id);
    }
    if (activeCategoryFilter === 'specialized') {
      return ['water-tank-cleaning', 'appliance-cleaning', 'balcony-cleaning', 'window-cleaning', 'glass-cleaning', 'door-cleaning', 'special-cleaning', 'commercial-cleaning'].includes(s.id);
    }
    return true;
  });

  // Greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const customerFirstName = (profile?.name || user?.displayName || '').split(' ')[0];

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827] font-['Inter',sans-serif] pb-28 antialiased selection:bg-[#0b3ba8]/20 selection:text-[#0b3ba8]">
      
      {/* Top Bar for Admin & Partner Portals Toggle */}
      <div className="bg-[#0b3ba8] text-white text-xs px-4 py-2 flex items-center justify-between border-b border-blue-900 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-wide font-['Outfit'] text-sm">BharatProExpert</span>
          <span className="hidden sm:inline-block bg-blue-800 text-[10px] px-2 py-0.5 rounded font-mono">
            APK / Web App
          </span>
          <span className="text-blue-200 text-[11px] hidden md:inline">
            Helpline: 8920252647
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleCatalog && (
            <button
              onClick={onToggleCatalog}
              className="px-2.5 py-1 rounded bg-blue-900 hover:bg-blue-800 text-blue-100 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Desktop Catalog
            </button>
          )}
          <button
            onClick={onOpenPartner}
            className="px-2.5 py-1 rounded bg-blue-800 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
          >
            Partner Portal
          </button>
          <button
            onClick={onOpenAdmin}
            className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
          >
            Admin Panel
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-[1000px] mx-auto p-4 sm:p-6 space-y-5">

        {/* -------------------- 1. HOME VIEW -------------------- */}
        {view === 'home' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header with Greeting & Search */}
            <div className="flex justify-between items-center gap-3">
              <button 
                onClick={() => setDrawerOpen(true)}
                className="text-2xl cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition-colors border-0 bg-transparent"
                title="Open Menu"
                aria-label="Open Navigation Menu"
              >
                ☰
              </button>
              <div className="flex-1">
                <div className="text-[#6b7280] text-xs font-medium">
                  {greeting}{customerFirstName ? `, ${customerFirstName}` : ''} 👋
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
                  How can we help you today?
                </h1>
              </div>
              <button 
                onClick={() => setNotificationModalOpen(true)}
                className="text-2xl cursor-pointer relative p-1 border-0 bg-transparent"
                title="Offers & Alerts"
                aria-label="View Offers and Alerts"
              >
                🔔
                <b className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#e11d48] rounded-full animate-pulse" />
              </button>
              <div 
                onClick={() => setView('pf')}
                className="w-10 h-10 rounded-full bg-[#0b3ba8] text-white font-bold grid place-items-center cursor-pointer shadow-xs"
              >
                {customerFirstName ? customerFirstName[0].toUpperCase() : '👤'}
              </div>
            </div>

            {/* Search Bar + City Selector */}
            <div className="bg-white rounded-2xl p-2.5 px-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex items-center gap-3">
              <span className="text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search for a service…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full border-0 p-0 text-sm focus:outline-none bg-transparent"
              />
              <div 
                onClick={() => {
                  const next = prompt(`Select your city:\n${CITIES.join(', ')}`, city);
                  if (next) {
                    setCity(next);
                    localStorage.setItem('bpe_city_v3', next);
                  }
                }}
                className="whitespace-nowrap font-bold text-xs sm:text-sm text-[#0b3ba8] border-l border-[#e5e7eb] pl-3 cursor-pointer select-none"
              >
                📍 {city} ▾
              </div>
            </div>

            {/* Hero Card - Most Booked */}
            <div className="rounded-2xl p-5 bg-gradient-to-r from-white via-[#f4f7fb] to-[#dbe7f3] shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4 items-center overflow-hidden">
              <div>
                <span className="bg-[#eaf0ff] text-[#0b3ba8] text-[11px] font-bold px-2 py-0.5 rounded tracking-wide inline-block">
                  MOST BOOKED
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-2 mb-1 leading-tight">
                  Bathroom<br />Deep Cleaning
                </h3>
                <div className="text-[#0b3ba8] font-bold text-sm mb-3">
                  Starting at ₹349
                </div>
                <div className="flex gap-4 text-[11px] text-[#6b7280] mb-4">
                  <span className="text-center w-16">
                    <i className="block not-italic text-xl">👷</i>
                    Expert Cleaners
                  </span>
                  <span className="text-center w-16">
                    <i className="block not-italic text-xl">🧴</i>
                    Safe Products
                  </span>
                  <span className="text-center w-16">
                    <i className="block not-italic text-xl">✅</i>
                    Satisfaction Guaranteed
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedServiceId('bath');
                    setView('sv');
                    window.scrollTo(0, 0);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0b3ba8] hover:bg-blue-800 text-white font-bold text-sm cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Book Now →
                </button>
              </div>
              <div className="relative h-44 sm:h-52 rounded-xl overflow-hidden shadow-inner hidden md:block border border-blue-100">
                <img 
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80" 
                  alt="Bathroom Deep Cleaning Professional" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#0b3ba8] text-[10px] font-black px-2.5 py-1 rounded-md shadow-xs">
                  ✨ 100% Descaled Mirror Finish
                </div>
              </div>
            </div>

            {/* Services Grid & Category Filters */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <h2 className="text-lg font-extrabold text-[#111827]">Our Cleaning Services</h2>
                  <p className="text-xs text-[#6b7280]">20 specialized hospital-grade cleaning categories</p>
                </div>
                <span 
                  onClick={() => { setActiveCategoryFilter('all'); setSearchFilter(''); }}
                  className="text-xs text-[#0b3ba8] font-bold cursor-pointer hover:underline"
                >
                  View All (20) →
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
                {[
                  { id: 'all', label: 'All Services (20)' },
                  { id: 'popular', label: '⭐ Most Popular' },
                  { id: 'deep', label: '🏠 Deep Cleaning' },
                  { id: 'furniture', label: '🛋️ Furniture & Fabric' },
                  { id: 'specialized', label: '✨ Specialized Care' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategoryFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap cursor-pointer transition-all ${
                      activeCategoryFilter === tab.id
                        ? 'bg-[#0b3ba8] text-white shadow-xs'
                        : 'bg-white border border-[#e5e7eb] text-[#4b5563] hover:border-[#0b3ba8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredServices.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setView('sv');
                      window.scrollTo(0, 0);
                    }}
                    className="group bg-white rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.07)] border border-[#e5e7eb] overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all active:scale-98 flex flex-col justify-between"
                  >
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                      <img 
                        src={s.detail.heroImage} 
                        alt={s.n}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Rating & Badge */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        {s.detail.badge && (
                          <span className="text-[9px] bg-[#0b3ba8] text-white font-extrabold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                            {s.detail.badge}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        ★ {s.detail.rating}
                      </div>

                      <div className="absolute bottom-1.5 left-2 text-white flex items-center gap-1">
                        <span className="text-base select-none">{s.e}</span>
                        <span className="text-[10px] text-gray-200 font-medium">{s.detail.duration}</span>
                      </div>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#111827] line-clamp-1 leading-tight group-hover:text-[#0b3ba8] transition-colors">
                          {s.n}
                        </p>
                        <p className="text-[10px] text-[#6b7280] line-clamp-1 mt-0.5">
                          {s.detail.tagline}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-[#6b7280] block -mb-0.5">Starting at</span>
                          <span className="text-xs sm:text-sm font-extrabold text-[#0b3ba8]">
                            ₹{s.pk[0][1]}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#0b3ba8] bg-[#eaf0ff] px-2 py-1 rounded-lg group-hover:bg-[#0b3ba8] group-hover:text-white transition-colors">
                          Book →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Points Strip */}
            <div className="bg-white rounded-2xl p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-[#111827]">
              <div className="flex items-center gap-2">
                <span>🛡️</span> Verified &amp; Trained Experts
              </div>
              <div className="flex items-center gap-2">
                <span>⏱️</span> On-time Service
              </div>
              <div className="flex items-center gap-2">
                <span>🏷️</span> Affordable Pricing
              </div>
              <div className="flex items-center gap-2">
                <span>✅</span> Satisfaction Guaranteed
              </div>
            </div>

            {/* Before & After Interactive Sliders */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#111827]">
                    See the Real Difference (Before &amp; After)
                  </h2>
                  <p className="text-xs text-[#6b7280]">Drag the divider left or right to inspect actual cleaning results</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Bathroom Tile Descaling */}
                <div className="bg-white rounded-2xl p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                  <div className="relative h-40 rounded-xl overflow-hidden shadow-xs border border-slate-200 select-none">
                    <img 
                      src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" 
                      alt="Bathroom After" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderBath}% 0 0)` }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80" 
                        alt="Bathroom Before" 
                        className="w-full h-full object-cover filter contrast-125 brightness-90" 
                      />
                    </div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md pointer-events-none"
                      style={{ left: `${sliderBath}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-white text-[#0b3ba8] shadow-md flex items-center justify-center text-[10px] font-black">
                        ↔
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderBath}
                      onChange={(e) => setSliderBath(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-10"
                      aria-label="Bathroom comparison slider"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] bg-black/75 text-white px-1.5 py-0.5 rounded font-bold">
                      Before
                    </span>
                    <span className="absolute bottom-2 right-2 text-[9px] bg-emerald-600/90 text-white px-1.5 py-0.5 rounded font-bold">
                      After
                    </span>
                  </div>
                  <div className="pt-2 px-1">
                    <b className="text-xs text-[#111827] block">Bathroom Tile Descaling</b>
                    <span className="text-[10px] text-[#6b7280]">Removed 100% hard water calcium scale</span>
                  </div>
                </div>

                {/* 2. Sofa Shampoo Extraction */}
                <div className="bg-white rounded-2xl p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                  <div className="relative h-40 rounded-xl overflow-hidden shadow-xs border border-slate-200 select-none">
                    <img 
                      src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80" 
                      alt="Sofa After" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderSofa}% 0 0)` }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80" 
                        alt="Sofa Before" 
                        className="w-full h-full object-cover filter contrast-110 brightness-85" 
                      />
                    </div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md pointer-events-none"
                      style={{ left: `${sliderSofa}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-white text-[#0b3ba8] shadow-md flex items-center justify-center text-[10px] font-black">
                        ↔
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderSofa}
                      onChange={(e) => setSliderSofa(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-10"
                      aria-label="Sofa comparison slider"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] bg-black/75 text-white px-1.5 py-0.5 rounded font-bold">
                      Before
                    </span>
                    <span className="absolute bottom-2 right-2 text-[9px] bg-emerald-600/90 text-white px-1.5 py-0.5 rounded font-bold">
                      After
                    </span>
                  </div>
                  <div className="pt-2 px-1">
                    <b className="text-xs text-[#111827] block">Sofa Fabric Extraction</b>
                    <span className="text-[10px] text-[#6b7280]">Restored original vibrancy &amp; hygiene</span>
                  </div>
                </div>

                {/* 3. Kitchen Chimney Degreasing */}
                <div className="bg-white rounded-2xl p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                  <div className="relative h-40 rounded-xl overflow-hidden shadow-xs border border-slate-200 select-none">
                    <img 
                      src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80" 
                      alt="Kitchen After" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderKit}% 0 0)` }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80" 
                        alt="Kitchen Before" 
                        className="w-full h-full object-cover filter contrast-125 brightness-80" 
                      />
                    </div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md pointer-events-none"
                      style={{ left: `${sliderKit}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-white text-[#0b3ba8] shadow-md flex items-center justify-center text-[10px] font-black">
                        ↔
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderKit}
                      onChange={(e) => setSliderKit(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-10"
                      aria-label="Kitchen comparison slider"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] bg-black/75 text-white px-1.5 py-0.5 rounded font-bold">
                      Before
                    </span>
                    <span className="absolute bottom-2 right-2 text-[9px] bg-emerald-600/90 text-white px-1.5 py-0.5 rounded font-bold">
                      After
                    </span>
                  </div>
                  <div className="pt-2 px-1">
                    <b className="text-xs text-[#111827] block">Kitchen Degreasing</b>
                    <span className="text-[10px] text-[#6b7280]">Dissolved thick burnt oil &amp; soot</span>
                  </div>
                </div>

                {/* 4. Floor Marble Buffing */}
                <div className="bg-white rounded-2xl p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                  <div className="relative h-40 rounded-xl overflow-hidden shadow-xs border border-slate-200 select-none">
                    <img 
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" 
                      alt="Floor After" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderFloor}% 0 0)` }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80" 
                        alt="Floor Before" 
                        className="w-full h-full object-cover filter contrast-110 brightness-75" 
                      />
                    </div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md pointer-events-none"
                      style={{ left: `${sliderFloor}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-white text-[#0b3ba8] shadow-md flex items-center justify-center text-[10px] font-black">
                        ↔
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderFloor}
                      onChange={(e) => setSliderFloor(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-10"
                      aria-label="Floor comparison slider"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] bg-black/75 text-white px-1.5 py-0.5 rounded font-bold">
                      Before
                    </span>
                    <span className="absolute bottom-2 right-2 text-[9px] bg-emerald-600/90 text-white px-1.5 py-0.5 rounded font-bold">
                      After
                    </span>
                  </div>
                  <div className="pt-2 px-1">
                    <b className="text-xs text-[#111827] block">Marble Floor Buffing</b>
                    <span className="text-[10px] text-[#6b7280]">Single-disc deep diamond scrub shine</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Offers */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-[#111827]">Best Offers for You</h2>
                <span 
                  onClick={() => setView('off')}
                  className="text-xs text-[#0b3ba8] font-semibold cursor-pointer"
                >
                  View All →
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                  <span className="bg-[#fff3dc] text-[#b45309] text-[11px] font-bold px-2 py-0.5 rounded">
                    COMBO OFFER
                  </span>
                  <h4 className="text-base font-bold text-[#111827] mt-2 mb-1">
                    Bathroom + Sofa Cleaning
                  </h4>
                  <div className="text-[#16a34a] font-bold text-sm mb-3">
                    Save ₹200 (Auto Discount)
                  </div>
                  <button
                    onClick={() => {
                      setQty('bath', 0, 1);
                      setQty('sofa', 0, 1);
                      handleApplyCoupon('COMBO200');
                      setView('cart');
                      window.scrollTo(0, 0);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#0b3ba8] text-[#0b3ba8] font-bold text-xs hover:bg-[#eaf0ff] cursor-pointer"
                  >
                    Book Combo →
                  </button>
                </div>

                <div className="rounded-2xl p-4 bg-[#eaf0ff] shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-blue-200">
                  <span className="bg-[#0b3ba8] text-white text-[11px] font-bold px-2 py-0.5 rounded">
                    FIRST BOOKING
                  </span>
                  <h4 className="text-base font-bold text-[#111827] mt-2 mb-1">
                    Get 10% OFF on First Booking
                  </h4>
                  <p className="text-xs text-[#6b7280] mb-3">
                    Use code <b>FIRST10</b> (save up to ₹150)
                  </p>
                  <button
                    onClick={() => {
                      handleApplyCoupon('FIRST10');
                      setSelectedServiceId('bath');
                      setView('sv');
                      window.scrollTo(0, 0);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0b3ba8] text-white font-bold text-xs hover:bg-blue-800 cursor-pointer shadow-sm"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Testimonials */}
            <div>
              <h2 className="text-lg font-bold text-[#111827] mb-3">
                What Our Customers Say
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e11d48] text-white font-bold grid place-items-center shrink-0">
                    N
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <b className="text-sm">Neha Sharma</b>
                      <span className="text-[#f5a623] text-xs">★★★★★</span>
                    </div>
                    <p className="text-xs text-[#111827] mt-1 mb-1 leading-relaxed">
                      Very professional service. Diversey chemicals were used and the bathroom was descaled perfectly. Highly recommended!
                    </p>
                    <span className="text-[11px] text-[#6b7280]">Sushant Lok, Gurgaon</span>
                  </div>
                </div>

                <div className="bg-[#eaf0ff] rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-blue-200 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-[#111827]">
                      <span className="text-[#f5a623]">★</span> 4.8 / 5
                    </div>
                    <div className="text-xs text-[#6b7280] font-medium mt-0.5">
                      From 2,350+ verified bookings
                    </div>
                  </div>
                  <div className="text-3xl select-none">
                    ⭐
                  </div>
                </div>
              </div>
            </div>

            {/* Home FAQ / Why Bharat Pro Expert Accordion */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-2">
              <h3 className="text-base font-extrabold text-[#111827] mb-2 flex items-center gap-2">
                <span>🛡️</span> Frequently Asked Questions &amp; Safety Standard
              </h3>
              {[
                { q: 'How does Bharat Pro Expert ensure quality and safety?', a: 'All cleaning professionals are 100% police verified, background-checked, and trained in German SOPs. We only use authentic Diversey Taski R1-R9 eco-safe hospital-grade chemicals.' },
                { q: 'What is your cancellation and refund policy?', a: 'Free cancellation up to 2 hours before your scheduled appointment slot. 100% instant refund back to your payment source, no questions asked.' },
                { q: 'How does the Start OTP and Completion OTP work?', a: 'When the technician arrives, share the 4-digit Start OTP to begin service. Only provide the Completion OTP after you have thoroughly inspected the work and are completely satisfied.' },
                { q: 'Are there any hidden visit or travel charges?', a: 'Zero hidden charges. Inspection and visit charges are completely FREE. What you see is what you pay.' }
              ].map((faq, i) => (
                <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setActiveFaqIndex(activeFaqIndex === i ? null : i)}
                    className="w-full text-left px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-[#111827] flex justify-between items-center transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-[#0b3ba8] text-base">{activeFaqIndex === i ? '−' : '+'}</span>
                  </button>
                  {activeFaqIndex === i && (
                    <div className="p-3 text-xs text-[#4b5563] bg-white leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Contact Footnote */}
            <div className="text-center pt-4 text-xs text-[#6b7280] space-y-1">
              <p>
                © BharatProExpert.com · Phone: <b>8920252647</b> · Email: <b>bharatproexpert@gmail.com</b>
              </p>
              <p className="text-[11px]">
                Terms · Privacy · Refund Guarantee · 100% Verified Cleaners
              </p>
            </div>
          </div>
        )}

        {/* -------------------- 2. SERVICE DETAIL VIEW -------------------- */}
        {view === 'sv' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span 
                onClick={() => { setView('home'); window.scrollTo(0, 0); }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0b3ba8] cursor-pointer hover:underline py-1"
              >
                ← Back to all services
              </span>
              <span className="text-[11px] text-[#6b7280]">
                Hospital-grade Taski chemicals
              </span>
            </div>

            {(() => {
              const currentSvc = getService(selectedServiceId);
              const cat = currentSvc.detail;
              return (
                <>
                  {/* Service Hero Header Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {cat.badge && (
                          <span className="bg-[#0b3ba8] text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                            {cat.badge}
                          </span>
                        )}
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          ✓ 100% Police Verified Staff
                        </span>
                        <span className="bg-blue-50 text-[#0b3ba8] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                          ⏱ {cat.duration}
                        </span>
                      </div>

                      <h1 className="text-xl sm:text-2xl font-black text-[#111827] flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </h1>
                      <p className="text-xs sm:text-sm text-[#4b5563] mt-1 max-w-xl">
                        {cat.tagline}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-[#6b7280] mt-2 font-medium">
                        <span className="text-amber-500 font-bold">★ {cat.rating} ({cat.reviewCount}+ verified ratings)</span>
                        <span>&bull;</span>
                        <span>Diversey Taski R1-R9 SOPs</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-[#6b7280] block">Starting from</span>
                      <div className="text-2xl font-black text-[#0b3ba8]">
                        ₹{cat.startingPrice}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        Includes 15% discount
                      </span>
                    </div>
                  </div>

                  {/* Dual Media Section: 10s Video + Before & After Interactive Slider */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. 10s Looping Video Player */}
                    <div className="bg-white rounded-2xl p-3 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                      <div className="flex items-center justify-between mb-2">
                        <b className="text-xs text-[#111827] flex items-center gap-1.5">
                          <span>🎥</span> Real Service Demo (10s Looping)
                        </b>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Live Demo
                        </span>
                      </div>

                      <div className="relative rounded-xl overflow-hidden shadow-xs bg-slate-950 aspect-video flex items-center justify-center">
                        <video
                          key={cat.videoUrl}
                          src={cat.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          {cat.duration} &bull; German Kärcher tech
                        </div>
                      </div>
                    </div>

                    {/* 2. Interactive Before & After Slider */}
                    <div className="bg-white rounded-2xl p-3 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                      <div className="flex items-center justify-between mb-2">
                        <b className="text-xs text-[#111827] flex items-center gap-1.5">
                          <span>✨</span> Real Transformation (Drag ↔)
                        </b>
                        <span className="text-[10px] text-[#0b3ba8] font-semibold">
                          Interactive comparison
                        </span>
                      </div>

                      <div className="relative rounded-xl overflow-hidden shadow-xs bg-slate-100 aspect-video select-none border border-slate-200">
                        {/* After Image */}
                        <img 
                          src={cat.afterImage} 
                          alt="After cleaning service" 
                          className="absolute inset-0 w-full h-full object-cover" 
                        />
                        {/* Before Image with Clip-path */}
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - detailSlider}% 0 0)` }}
                        >
                          <img 
                            src={cat.beforeImage} 
                            alt="Before cleaning service" 
                            className="w-full h-full object-cover filter contrast-125 brightness-90" 
                          />
                        </div>
                        {/* Draggable Divider Handle */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-md pointer-events-none"
                          style={{ left: `${detailSlider}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-white text-[#0b3ba8] shadow-md flex items-center justify-center text-xs font-black">
                            ↔
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={detailSlider}
                          onChange={(e) => setDetailSlider(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-10"
                          aria-label="Service Before and After slider"
                        />
                        <span className="absolute bottom-2 left-2 text-[9px] bg-black/75 text-white px-2 py-0.5 rounded font-bold">
                          Before
                        </span>
                        <span className="absolute bottom-2 right-2 text-[9px] bg-emerald-600/90 text-white px-2 py-0.5 rounded font-bold">
                          After Deep Clean
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Packages Selection (Matching Property Details: BHK, Bathrooms, Seats, etc.) */}
                  <div>
                    <div className="flex items-center justify-between mt-2 mb-2">
                      <h3 className="text-base font-extrabold text-[#111827]">
                        Choose Package ({cat.propertyUnitLabel})
                      </h3>
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        15% Off Included
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
                      {cat.packages.map((pkg, idx) => {
                        const count = getQty(currentSvc.id, idx);
                        return (
                          <div key={idx} className="py-3 flex items-start sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <b className="text-sm font-bold text-[#111827]">{pkg.label}</b>
                                {pkg.popular && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded uppercase">
                                    Most Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6b7280] mt-0.5">
                                {pkg.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-base font-black text-[#0b3ba8]">
                                  ₹{pkg.price}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{pkg.referencePrice}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Save ₹{pkg.referencePrice - pkg.price}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 pt-1 sm:pt-0">
                              {count > 0 ? (
                                <div className="flex items-center gap-2.5 border-1.5 border-[#0b3ba8] rounded-xl text-[#0b3ba8] font-bold px-3 py-1.5 text-sm select-none">
                                  <span 
                                    onClick={() => setQty(currentSvc.id, idx, -1)}
                                    className="cursor-pointer text-lg font-black hover:opacity-75"
                                  >
                                    −
                                  </span>
                                  <span>{count}</span>
                                  <span 
                                    onClick={() => setQty(currentSvc.id, idx, 1)}
                                    className="cursor-pointer text-lg font-black hover:opacity-75"
                                  >
                                    +
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setQty(currentSvc.id, idx, 1);
                                    showToast(`Added ${pkg.label} to cart!`);
                                  }}
                                  className="px-5 py-2 rounded-xl border-1.5 border-[#0b3ba8] bg-[#eaf0ff] hover:bg-[#0b3ba8] hover:text-white text-[#0b3ba8] font-bold text-xs cursor-pointer shadow-xs transition-colors"
                                >
                                  Add +
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Specialized Add-ons for this Category */}
                  {cat.addons && cat.addons.length > 0 && (
                    <div>
                      <h3 className="text-base font-extrabold text-[#111827] mt-3 mb-2 flex items-center justify-between">
                        <span>Specialized Cleaning Add-ons</span>
                        <span className="text-[11px] text-[#6b7280]">Optional add-on care</span>
                      </h3>
                      <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
                        {cat.addons.map((add) => (
                          <div key={add.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                            <div>
                              <b className="text-xs font-bold text-[#111827] block">{add.name}</b>
                              <span className="text-[11px] text-[#6b7280]">{add.description}</span>
                              <div className="text-xs font-extrabold text-[#0b3ba8] mt-0.5">
                                +₹{add.price}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setQty(currentSvc.id, 0, 1);
                                showToast(`Added package & ${add.name}!`);
                              }}
                              className="px-3.5 py-1.5 rounded-xl border border-[#0b3ba8] text-[#0b3ba8] hover:bg-[#0b3ba8] hover:text-white font-bold text-xs cursor-pointer transition-colors"
                            >
                              + Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What is Included and What is Not Included */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-2">
                      <b className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                        <span>✅</span> What is Included in this Service
                      </b>
                      <div className="space-y-1.5 text-xs text-[#374151]">
                        {cat.inclusions.map((inc, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-2">
                      <b className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                        <span>❌</span> What is Excluded
                      </b>
                      <div className="space-y-1.5 text-xs text-[#4b5563]">
                        {cat.exclusions.map((exc, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold shrink-0">✗</span>
                            <span>{exc}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-[#6b7280]">
                        Civil masonry and exterior facade climbing are not included for worker safety.
                      </div>
                    </div>
                  </div>

                  {/* Safety & Cancellation Guarantees */}
                  <div className="bg-[#eaf0ff] rounded-2xl p-4 border border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <b className="text-[#0b3ba8] block mb-1">🛡️ Safety &amp; Diversey Chemicals</b>
                      <p className="text-[#374151] leading-relaxed">
                        {cat.safety}
                      </p>
                    </div>
                    <div>
                      <b className="text-[#0b3ba8] block mb-1">↩️ Cancellation &amp; 100% Refund Policy</b>
                      <p className="text-[#374151] leading-relaxed">
                        {cat.cancellationPolicy}
                      </p>
                    </div>
                  </div>

                  {/* Category Specific FAQs */}
                  {cat.faqs && cat.faqs.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-2">
                      <h4 className="text-sm font-extrabold text-[#111827] mb-1">
                        Frequently Asked Questions about {cat.name}
                      </h4>
                      {cat.faqs.map((faq, i) => (
                        <div key={i} className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                          <div className="p-3 bg-slate-50 font-bold text-[#111827]">
                            Q: {faq.q}
                          </div>
                          <div className="p-3 bg-white text-[#4b5563] border-t border-slate-100 leading-relaxed">
                            {faq.a}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Frequently Added Together Recommendations */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                    <h3 className="text-sm font-extrabold text-[#111827] mb-2.5">
                      Frequently Added Together
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SV.filter(x => x.id !== currentSvc.id).slice(0, 2).map((other) => (
                        <div key={other.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{other.e}</span>
                            <div>
                              <b className="text-xs text-[#111827] block">{other.n}</b>
                              <span className="text-xs font-black text-[#0b3ba8]">₹{other.pk[0][1]}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setQty(other.id, 0, 1);
                              showToast(`Added ${other.n} to cart!`);
                            }}
                            className="px-3 py-1 rounded-lg border border-[#0b3ba8] text-[#0b3ba8] bg-white hover:bg-[#0b3ba8] hover:text-white font-bold text-xs cursor-pointer transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* -------------------- 3. CART VIEW -------------------- */}
        {view === 'cart' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <span 
              onClick={() => { setView('home'); window.scrollTo(0, 0); }}
              className="inline-block text-xs font-bold text-[#0b3ba8] cursor-pointer hover:underline"
            >
              ← Add more services
            </span>

            <h2 className="text-xl font-bold text-[#111827]">
              Your Cart ({tot.count} items)
            </h2>

            {cart.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                <div className="text-5xl mb-3">🛒</div>
                <p className="text-sm text-[#6b7280] mb-4">
                  Your cart is empty. Pick a cleaning service to get started.
                </p>
                <button
                  onClick={() => setView('home')}
                  className="px-5 py-2.5 rounded-xl bg-[#0b3ba8] text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
                >
                  Browse Services
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
                  {cart.map((item, idx) => {
                    const s = getService(item.s);
                    const pkg = s.pk[item.p];
                    if (!pkg) return null;
                    return (
                      <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{s.e}</span>
                          <div>
                            <b className="text-sm text-[#111827] block">{s.n}</b>
                            <span className="text-xs text-[#6b7280]">
                              {pkg[0]} &bull; ₹{pkg[1]} each
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-1.5 border-[#0b3ba8] rounded-xl text-[#0b3ba8] font-bold px-2.5 py-1 text-xs select-none">
                          <span 
                            onClick={() => setQty(item.s, item.p, -1)}
                            className="cursor-pointer text-base font-black hover:opacity-75"
                          >
                            −
                          </span>
                          <span>{item.q}</span>
                          <span 
                            onClick={() => setQty(item.s, item.p, 1)}
                            className="cursor-pointer text-base font-black hover:opacity-75"
                          >
                            +
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code Input */}
                <h3 className="text-base font-bold text-[#111827] mt-3 mb-1">
                  Coupon Code
                </h3>
                <div className="bg-white rounded-2xl p-3 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (try FIRST10, BHARAT500)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-mono uppercase font-bold focus:outline-[#0b3ba8]"
                  />
                  <button
                    onClick={() => handleApplyCoupon()}
                    className="px-4 py-2 rounded-xl bg-[#0b3ba8] text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponFeedback && (
                  <p className="text-xs font-bold text-[#16a34a] pl-1">
                    {couponFeedback}
                  </p>
                )}

                {/* Bill Summary */}
                <h3 className="text-base font-bold text-[#111827] mt-3 mb-1">
                  Payment Summary
                </h3>
                <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6b7280]">
                    <span>Item Total</span>
                    <span>₹{tot.subtotal}</span>
                  </div>
                  {tot.discount > 0 && (
                    <div className="flex justify-between text-[#16a34a] font-bold">
                      <span>Coupon Discount ({coupon})</span>
                      <span>−₹{tot.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#6b7280]">
                    <span>Visit &amp; Inspection Fee</span>
                    <span className="text-[#16a34a] font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[#111827] pt-2 border-t border-dashed border-[#e5e7eb]">
                    <span>Total (incl. taxes)</span>
                    <span className="text-[#0b3ba8]">₹{tot.total}</span>
                  </div>
                  {tot.discount > 0 && (
                    <p className="text-[11px] text-[#16a34a] font-semibold pt-1">
                      🎉 You are saving ₹{tot.discount} on this cleaning booking!
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-xl bg-[#0b3ba8] hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98"
                >
                  Proceed to book &bull; ₹{tot.total}
                </button>
              </>
            )}
          </div>
        )}

        {/* -------------------- 4. ADDRESS & GPS VIEW -------------------- */}
        {view === 'addr' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <span 
              onClick={() => { setView('cart'); window.scrollTo(0, 0); }}
              className="inline-block text-xs font-bold text-[#0b3ba8] cursor-pointer hover:underline"
            >
              ← Back to cart
            </span>

            <h2 className="text-xl font-bold text-[#111827]">
              Where do you need the service?
            </h2>

            {/* GPS Auto-Detect Button */}
            <button
              onClick={handleDetectLocation}
              disabled={detectingGps}
              className="w-full py-3 rounded-xl border-1.5 border-[#0b3ba8] bg-white text-[#0b3ba8] font-bold text-xs hover:bg-[#eaf0ff] cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Compass className="w-4 h-4 text-[#0b3ba8]" />
              <span>{detectingGps ? 'Detecting GPS Satellite...' : '📍 Use my current location (GPS Auto)'}</span>
            </button>

            {gpsMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gpsMessage}</span>
              </div>
            )}

            {/* Address Form Card */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111827] block mb-1">
                  Search location / Street / Society
                </label>
                <input
                  type="text"
                  placeholder="e.g. DLF CyberCity, Golf Course Road, Sector 56"
                  value={address.line}
                  onChange={(e) => setAddress(prev => ({ ...prev, line: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-xl p-2.5 text-xs focus:outline-[#0b3ba8]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111827] block mb-1">
                  House / Flat no. &amp; Building *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Tower B, Palm Springs"
                  value={address.house}
                  onChange={(e) => setAddress(prev => ({ ...prev, house: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-xl p-2.5 text-xs focus:outline-[#0b3ba8]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111827] block mb-1">
                  Landmark (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Station / Central Park"
                  value={address.lm}
                  onChange={(e) => setAddress(prev => ({ ...prev, lm: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-xl p-2.5 text-xs focus:outline-[#0b3ba8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111827] block mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={address.pin}
                    onChange={(e) => setAddress(prev => ({ ...prev, pin: e.target.value }))}
                    className="w-full border border-[#e5e7eb] rounded-xl p-2.5 text-xs focus:outline-[#0b3ba8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111827] block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full border border-[#e5e7eb] rounded-xl p-2.5 text-xs focus:outline-[#0b3ba8]"
                  />
                </div>
              </div>

              {/* Address Type Chips */}
              <div className="pt-2">
                <label className="text-xs font-bold text-[#111827] block mb-1.5">
                  Save address as
                </label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddress(prev => ({ ...prev, type: tag }))}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                        address.type === tag
                          ? 'border-[#0b3ba8] bg-[#eaf0ff] text-[#0b3ba8]'
                          : 'border-[#e5e7eb] bg-white text-[#6b7280]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!address.house && !address.line) {
                  showToast('Please enter your house and street address');
                  return;
                }
                setView('slot');
                window.scrollTo(0, 0);
              }}
              className="w-full py-3.5 rounded-xl bg-[#0b3ba8] hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98"
            >
              Save address &amp; select slot
            </button>
          </div>
        )}

        {/* -------------------- 5. SLOT SELECTION VIEW -------------------- */}
        {view === 'slot' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <span 
              onClick={() => { setView('addr'); window.scrollTo(0, 0); }}
              className="inline-block text-xs font-bold text-[#0b3ba8] cursor-pointer hover:underline"
            >
              ← Back to address
            </span>

            <h2 className="text-xl font-bold text-[#111827]">
              Select date &amp; time
            </h2>

            {/* Date Chips Carousel */}
            <div className="overflow-x-auto whitespace-nowrap pb-2 flex gap-2">
              {[...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const isSelected = slotDateIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => { setSlotDateIdx(i); setSlotTimeIdx(-1); }}
                    className={`px-4 py-2 rounded-2xl border text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                      isSelected
                        ? 'border-[#0b3ba8] bg-[#eaf0ff] text-[#0b3ba8] font-bold shadow-xs'
                        : 'border-[#e5e7eb] bg-white text-[#111827] hover:border-gray-400'
                    }`}
                  >
                    <b className="block text-sm">
                      {i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </b>
                    <span>{d.getDate()} {d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Chips */}
            <h3 className="text-base font-bold text-[#111827] mt-3 mb-2">
              Start time
            </h3>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s, i) => {
                const nowHour = new Date().getHours();
                const slotHour = [8, 10, 12, 14, 16, 18][i];
                const isPast = slotDateIdx === 0 && slotHour <= nowHour;
                const isSelected = slotTimeIdx === i;
                const isFastFilling = (slotDateIdx * 7 + i) % 3 === 1;

                return (
                  <button
                    key={i}
                    disabled={isPast}
                    onClick={() => setSlotTimeIdx(i)}
                    className={`px-4 py-2 rounded-2xl border text-xs font-semibold transition-all ${
                      isPast
                        ? 'opacity-40 pointer-events-none line-through border-gray-200 bg-gray-100 text-gray-400'
                        : isSelected
                        ? 'border-[#0b3ba8] bg-[#eaf0ff] text-[#0b3ba8] font-bold shadow-xs'
                        : 'border-[#e5e7eb] bg-white text-[#111827] hover:border-[#0b3ba8]'
                    }`}
                  >
                    {s} {isFastFilling && !isPast ? '🔥' : ''}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#6b7280]">
              🔥 Fast filling slots &bull; Cleaning experts arrive with full German Kärcher equipment
            </div>

            <button
              onClick={() => {
                if (slotTimeIdx < 0) {
                  showToast('Please choose a time slot');
                  return;
                }
                setView('pay');
                window.scrollTo(0, 0);
              }}
              className="w-full py-3.5 rounded-xl bg-[#0b3ba8] hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 mt-4"
            >
              Continue to payment
            </button>
          </div>
        )}

        {/* -------------------- 6. PAYMENT VIEW -------------------- */}
        {view === 'pay' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <span 
              onClick={() => { setView('slot'); window.scrollTo(0, 0); }}
              className="inline-block text-xs font-bold text-[#0b3ba8] cursor-pointer hover:underline"
            >
              ← Back to slot
            </span>

            <h2 className="text-xl font-bold text-[#111827]">
              Payment &amp; Final Review
            </h2>

            {/* Schedule & Address Card */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-1">
              {(() => {
                const targetD = new Date();
                targetD.setDate(targetD.getDate() + slotDateIdx);
                return (
                  <>
                    <b className="text-sm text-[#111827] block">
                      {targetD.toDateString()} &bull; {SLOTS[slotTimeIdx]}
                    </b>
                    <p className="text-xs text-[#6b7280]">
                      {address.type}: {address.house ? address.house + ', ' : ''}{address.line}, {address.city}
                    </p>
                  </>
                );
              })()}
            </div>

            {/* Payment Method Selector */}
            <h3 className="text-base font-bold text-[#111827] mt-3 mb-2">
              Choose Payment method
            </h3>
            <div className="space-y-2">
              <div 
                onClick={() => setPaymentMethod('cash')}
                className={`bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(15,23,42,0.07)] cursor-pointer border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'cash' ? 'border-[#0b3ba8] bg-[#eaf0ff]' : 'border-transparent hover:border-[#e5e7eb]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💵</span>
                  <div>
                    <b className="text-sm text-[#111827] block">Pay after service</b>
                    <span className="text-xs text-[#6b7280]">Cash or UPI directly to professional after job completion</span>
                  </div>
                </div>
                {paymentMethod === 'cash' && <span className="text-[#0b3ba8] font-bold text-sm">✓ Selected</span>}
              </div>

              <div 
                onClick={() => setPaymentMethod('online')}
                className={`bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(15,23,42,0.07)] cursor-pointer border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'online' ? 'border-[#0b3ba8] bg-[#eaf0ff]' : 'border-transparent hover:border-[#e5e7eb]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <b className="text-sm text-[#111827] block">UPI / Cards / Netbanking</b>
                    <span className="text-xs text-[#6b7280]">GPay, PhonePe, Paytm, or Credit/Debit Card</span>
                  </div>
                </div>
                {paymentMethod === 'online' && <span className="text-[#0b3ba8] font-bold text-sm">✓ Selected</span>}
              </div>
            </div>

            {/* Amount Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-2 text-xs">
              <div className="flex justify-between text-[#6b7280]">
                <span>Total Services Price</span>
                <span>₹{tot.subtotal}</span>
              </div>
              {tot.discount > 0 && (
                <div className="flex justify-between text-[#16a34a] font-bold">
                  <span>Discount ({coupon})</span>
                  <span>−₹{tot.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#111827] pt-2 border-t border-dashed border-[#e5e7eb]">
                <span>Total Amount to Pay</span>
                <span className="text-[#0b3ba8]">₹{tot.total}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={bookingLoading}
              className="w-full py-3.5 rounded-xl bg-[#0b3ba8] hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {bookingLoading ? 'Securing Professional...' : `Confirm Booking &bull; ₹${tot.total}`}
            </button>
          </div>
        )}

        {/* -------------------- 7. MY BOOKINGS VIEW -------------------- */}
        {view === 'bk' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#111827]">
                My Bookings &amp; Live Tracking
              </h2>
              <button 
                onClick={() => setView('home')}
                className="text-xs text-[#0b3ba8] font-bold hover:underline"
              >
                + New Service
              </button>
            </div>

            {customerBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb]">
                <div className="text-5xl mb-2">📋</div>
                <p className="text-sm text-[#6b7280] mb-3">No active bookings found.</p>
                <button
                  onClick={() => setView('home')}
                  className="px-4 py-2 rounded-xl bg-[#0b3ba8] text-white text-xs font-bold"
                >
                  Book a Cleaning Service
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {customerBookings.map((bk) => (
                  <div
                    key={bk.id}
                    className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-[#6b7280]">
                          #{bk.bookingNumber}
                        </span>
                        <h4 className="text-sm font-bold text-[#111827]">
                          {bk.serviceName}
                        </h4>
                        <span className="text-xs text-[#6b7280]">
                          📅 {bk.date} &bull; ⏱️ {bk.timeSlot}
                        </span>
                      </div>

                      {/* Status Pill */}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        bk.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bk.status === 'SEARCHING_PROFESSIONAL'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {bk.status === 'SEARCHING_PROFESSIONAL' && '🔍 Finding Professional'}
                        {bk.status === 'ASSIGNED' && '👤 Partner Assigned'}
                        {bk.status === 'ACCEPTED' && '✓ Partner Accepted'}
                        {bk.status === 'ON_THE_WAY' && '🛵 On The Way'}
                        {bk.status === 'ARRIVED' && '📍 Arrived at Location'}
                        {bk.status === 'STARTED' && '⚡ Cleaning In Progress'}
                        {bk.status === 'COMPLETED' && '🎉 Job Completed'}
                      </span>
                    </div>

                    {/* Partner Info if Assigned */}
                    {bk.assignedPartnerName ? (
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#111827] block">
                            Assigned Partner: {bk.assignedPartnerName}
                          </span>
                          <span className="text-[#6b7280]">
                            Phone: {bk.assignedPartnerPhone || '8920252647'}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <a
                            href={`tel:${bk.assignedPartnerPhone || '+918920252647'}`}
                            className="p-1.5 rounded-lg bg-[#0b3ba8] text-white hover:bg-blue-800"
                            title="Call Partner"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        Admin Dispatch is assigning the highest rated specialist in your hub.
                      </div>
                    )}

                    {/* Start OTP & Total */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e5e7eb]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#6b7280]">Start OTP:</span>
                        <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                          {bk.startOtp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111827]">₹{bk.totalAmount}</span>
                        <button
                          onClick={() => onTrackBooking(bk)}
                          className="px-3 py-1 rounded-xl bg-[#0b3ba8] text-white font-bold text-xs hover:bg-blue-800 cursor-pointer shadow-xs"
                        >
                          Track Live &bull; GPS
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------- 8. OFFERS VIEW -------------------- */}
        {view === 'off' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <span 
              onClick={() => { setView('home'); window.scrollTo(0, 0); }}
              className="inline-block text-xs font-bold text-[#0b3ba8] cursor-pointer hover:underline"
            >
              ← Back to home
            </span>

            <h2 className="text-xl font-bold text-[#111827]">
              Offers &amp; Coupons
            </h2>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <span className="bg-[#0b3ba8] text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    FIRST10
                  </span>
                  <h4 className="text-sm font-bold text-[#111827] mt-1">
                    10% OFF on First Booking
                  </h4>
                  <p className="text-xs text-[#6b7280]">
                    Save up to ₹150 on any bathroom, sofa, or kitchen service.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleApplyCoupon('FIRST10');
                    setView('sv');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[#0b3ba8] text-[#0b3ba8] font-bold text-xs hover:bg-[#eaf0ff] cursor-pointer"
                >
                  Apply
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <span className="bg-[#b45309] text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    BHARAT500
                  </span>
                  <h4 className="text-sm font-bold text-[#111827] mt-1">
                    Flat ₹500 OFF on Full Home
                  </h4>
                  <p className="text-xs text-[#6b7280]">
                    Valid on order totals of ₹1000 and above.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleApplyCoupon('BHARAT500');
                    setView('sv');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[#0b3ba8] text-[#0b3ba8] font-bold text-xs hover:bg-[#eaf0ff] cursor-pointer"
                >
                  Apply
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <span className="bg-[#16a34a] text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    COMBO200
                  </span>
                  <h4 className="text-sm font-bold text-[#111827] mt-1">
                    ₹200 Instant Combo Savings
                  </h4>
                  <p className="text-xs text-[#6b7280]">
                    Book 2 or more cleaning services together.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleApplyCoupon('COMBO200');
                    setView('sv');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[#0b3ba8] text-[#0b3ba8] font-bold text-xs hover:bg-[#eaf0ff] cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 9. PROFILE & SETTINGS VIEW -------------------- */}
        {view === 'pf' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <span 
              onClick={() => { setView('home'); window.scrollTo(0, 0); }}
              className="inline-block text-xs font-bold text-[#0b3ba8] cursor-pointer hover:underline"
            >
              ← Back to home
            </span>

            <h2 className="text-xl font-bold text-[#111827]">
              Customer Account
            </h2>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0b3ba8] text-white font-extrabold text-2xl grid place-items-center">
                {customerFirstName ? customerFirstName[0].toUpperCase() : '👤'}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#111827]">
                  {profile?.name || user?.displayName || 'Customer'}
                </h3>
                <p className="text-xs text-[#6b7280]">
                  📞 {profile?.phone || '8920252647'}
                </p>
                <p className="text-xs text-[#6b7280]">
                  📧 {user?.email || profile?.email || 'bharatproexpert@gmail.com'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(15,23,42,0.07)] border border-[#e5e7eb] divide-y divide-[#e5e7eb] overflow-hidden text-xs font-bold text-[#111827]">
              <div 
                onClick={() => setView('bk')}
                className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">📋 My Bookings &amp; OTP</span>
                <span>→</span>
              </div>
              <div 
                onClick={() => setView('off')}
                className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">🏷️ Coupons &amp; Offers</span>
                <span>→</span>
              </div>
              <div 
                onClick={onOpenPartner}
                className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 text-[#0b3ba8]"
              >
                <span className="flex items-center gap-2">🛵 Partner Portal (Field Ops)</span>
                <span>→</span>
              </div>
              <div 
                onClick={onOpenAdmin}
                className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 text-amber-800"
              >
                <span className="flex items-center gap-2">🛡️ Admin Control Panel</span>
                <span>→</span>
              </div>
            </div>

            {/* Support Footnote */}
            <div className="bg-[#eaf0ff] rounded-2xl p-4 border border-blue-200 text-xs space-y-1">
              <span className="font-bold text-[#0b3ba8] block">Direct Customer Helpline</span>
              <p className="text-[#6b7280]">
                Phone: <a href="tel:8920252647" className="font-bold text-[#111827] hover:underline">8920252647</a>
              </p>
              <p className="text-[#6b7280]">
                WhatsApp: <a href="https://wa.me/918920252647" target="_blank" rel="noreferrer" className="font-bold text-emerald-700 hover:underline">+91 8920252647</a>
              </p>
              <p className="text-[#6b7280]">
                Email: <a href="mailto:bharatproexpert@gmail.com" className="font-bold text-[#111827] hover:underline">bharatproexpert@gmail.com</a>
              </p>
            </div>

            {/* Sign in / Sign out */}
            {user ? (
              <button
                onClick={() => signOut()}
                className="w-full py-3 rounded-xl border border-red-300 text-red-700 bg-white font-bold text-xs hover:bg-red-50 cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('customer')}
                className="w-full py-3 rounded-xl bg-[#0b3ba8] text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
              >
                Login / Register with Mobile OTP
              </button>
            )}
          </div>
        )}

      </main>

      {/* Floating Cart Bar (if items in cart and on home or sv) */}
      {tot.count > 0 && (view === 'home' || view === 'sv') && (
        <div 
          onClick={() => { setView('cart'); window.scrollTo(0, 0); }}
          className="fixed left-3 right-3 bottom-20 max-w-[976px] mx-auto bg-[#0b3ba8] text-white rounded-2xl p-3 px-4 flex justify-between items-center shadow-xl z-30 cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-extrabold text-xs px-2 py-0.5 rounded-full">
              {tot.count}
            </span>
            <span className="text-xs sm:text-sm font-semibold">
              Item{tot.count > 1 ? 's' : ''} added &bull; <b>₹{tot.total}</b>
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
            <span>View Cart</span>
            <span>→</span>
          </div>
        </div>
      )}

      {/* -------------------- FIXED BOTTOM APK NAVIGATION BAR -------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] flex justify-around items-center py-2 px-1 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        
        {/* 1. Home */}
        <button
          onClick={() => { setView('home'); window.scrollTo(0, 0); }}
          className={`flex-1 text-center py-1 cursor-pointer transition-colors ${
            view === 'home' ? 'text-[#0b3ba8] font-bold' : 'text-[#6b7280]'
          }`}
        >
          <i className="block not-italic text-lg">🏠</i>
          <span className="text-[10px] block">Home</span>
        </button>

        {/* 2. Bookings */}
        <button
          onClick={() => { setView('bk'); window.scrollTo(0, 0); }}
          className={`flex-1 text-center py-1 cursor-pointer relative transition-colors ${
            view === 'bk' ? 'text-[#0b3ba8] font-bold' : 'text-[#6b7280]'
          }`}
        >
          <i className="block not-italic text-lg">📋</i>
          <span className="text-[10px] block">Bookings</span>
          {customerBookings.length > 0 && (
            <span className="absolute top-1 right-1/4 w-2 h-2 bg-[#e11d48] rounded-full" />
          )}
        </button>

        {/* 3. Center Raised Book / Cart Button */}
        <div className="-mt-7">
          <button
            onClick={() => {
              if (cart.length > 0) {
                setView('cart');
              } else {
                setView('sv');
              }
              window.scrollTo(0, 0);
            }}
            className="w-14 h-14 rounded-full bg-[#0b3ba8] text-white font-bold text-xs grid place-items-center shadow-[0_4px_14px_rgba(11,59,168,0.4)] cursor-pointer active:scale-95 transition-transform"
          >
            {tot.count > 0 ? (
              <div className="text-center leading-tight">
                <span className="block text-sm">🛒</span>
                <span className="text-[10px] font-black">{tot.count}</span>
              </div>
            ) : (
              <span className="text-xs font-bold">Book</span>
            )}
          </button>
        </div>

        {/* 4. Offers */}
        <button
          onClick={() => { setView('off'); window.scrollTo(0, 0); }}
          className={`flex-1 text-center py-1 cursor-pointer transition-colors ${
            view === 'off' ? 'text-[#0b3ba8] font-bold' : 'text-[#6b7280]'
          }`}
        >
          <i className="block not-italic text-lg">🏷️</i>
          <span className="text-[10px] block">Offers</span>
        </button>

        {/* 5. Account / Profile */}
        <button
          onClick={() => { setView('pf'); window.scrollTo(0, 0); }}
          className={`flex-1 text-center py-1 cursor-pointer transition-colors ${
            view === 'pf' ? 'text-[#0b3ba8] font-bold' : 'text-[#6b7280]'
          }`}
        >
          <i className="block not-italic text-lg">👤</i>
          <span className="text-[10px] block">Account</span>
        </button>
      </nav>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 bg-[#111827] text-white py-2 px-4 rounded-full text-xs font-bold shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {toastMessage}
        </div>
      )}

      {/* -------------------- 6. HAMBURGER SIDE NAVIGATION DRAWER -------------------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div 
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="bg-[#0b3ba8] text-white p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black font-['Outfit']">Bharat Pro Expert</h2>
                  <p className="text-xs text-blue-200 mt-0.5">Trusted Home Cleaning Services</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 text-white grid place-items-center text-sm font-bold cursor-pointer hover:bg-white/30"
                  aria-label="Close Menu"
                >
                  ✕
                </button>
              </div>

              {/* User quick status */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0b3ba8] text-white font-bold grid place-items-center">
                  {customerFirstName ? customerFirstName[0].toUpperCase() : '👤'}
                </div>
                <div>
                  <b className="text-xs text-[#111827] block">
                    {profile?.name || user?.displayName || 'Guest Customer'}
                  </b>
                  <span className="text-[11px] text-[#6b7280]">
                    {user?.phoneNumber || user?.email || 'Logged in via Mobile'}
                  </span>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="p-3 space-y-1 text-xs font-semibold text-[#111827]">
                <button
                  onClick={() => { setView('home'); setDrawerOpen(false); window.scrollTo(0,0); }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">🏠</span>
                  <span>Home &amp; Services</span>
                </button>

                <button
                  onClick={() => { setView('bk'); setDrawerOpen(false); window.scrollTo(0,0); }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">📋</span>
                  <span>My Bookings &amp; Live Tracking</span>
                </button>

                <button
                  onClick={() => { setView('off'); setDrawerOpen(false); window.scrollTo(0,0); }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">🏷️</span>
                  <span>Best Offers &amp; Promo Codes</span>
                </button>

                <button
                  onClick={() => { setView('pf'); setDrawerOpen(false); window.scrollTo(0,0); }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">👤</span>
                  <span>My Profile &amp; Addresses</span>
                </button>

                <div className="pt-2 pb-1 border-t border-slate-200 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Support &amp; Portals</span>
                </div>

                <a
                  href="tel:8920252647"
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 cursor-pointer text-[#0b3ba8]"
                >
                  <span className="text-lg">📞</span>
                  <span>Helpline: 8920252647</span>
                </a>

                <a
                  href="https://wa.me/918920252647"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-700 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">💬</span>
                  <span>WhatsApp Support</span>
                </a>

                <button
                  onClick={() => { onOpenPartner(); setDrawerOpen(false); }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 text-[#0b3ba8] flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">💼</span>
                  <span>Partner Service Portal</span>
                </button>

                <button
                  onClick={() => { onOpenAdmin(); setDrawerOpen(false); }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50 text-amber-800 flex items-center gap-3 cursor-pointer font-bold"
                >
                  <span className="text-lg">⚙️</span>
                  <span>Admin Control Center</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-[#6b7280]">
              <p className="font-bold text-[#111827]">Bharat Pro Expert &bull; Gurgaon</p>
              <p>100% Police Verified &bull; Diversey Taski SOPs</p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 7. NOTIFICATIONS & OFFERS MODAL -------------------- */}
      {notificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            onClick={() => setNotificationModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="text-base font-extrabold text-[#111827]">Active Promo Alerts</h3>
              </div>
              <button 
                onClick={() => setNotificationModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-gray-500 grid place-items-center text-xs font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-[#eaf0ff] rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="bg-[#0b3ba8] text-white text-[9px] font-black px-1.5 py-0.5 rounded">NEW USER</span>
                  <b className="text-xs text-[#111827] block mt-1">10% OFF with FIRST10</b>
                  <span className="text-[10px] text-[#6b7280]">Save up to ₹150 instantly</span>
                </div>
                <button
                  onClick={() => {
                    handleApplyCoupon('FIRST10');
                    setNotificationModalOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#0b3ba8] text-white text-xs font-bold hover:bg-blue-800"
                >
                  Apply
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">FULL HOME</span>
                  <b className="text-xs text-[#111827] block mt-1">Flat ₹500 OFF (BHARAT500)</b>
                  <span className="text-[10px] text-[#6b7280]">Valid on orders ₹1000+</span>
                </div>
                <button
                  onClick={() => {
                    handleApplyCoupon('BHARAT500');
                    setNotificationModalOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                >
                  Apply
                </button>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">COMBO DEAL</span>
                  <b className="text-xs text-[#111827] block mt-1">₹200 OFF on Bath + Sofa</b>
                  <span className="text-[10px] text-[#6b7280]">Use code COMBO200</span>
                </div>
                <button
                  onClick={() => {
                    handleApplyCoupon('COMBO200');
                    setNotificationModalOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Apply
                </button>
              </div>
            </div>

            <button
              onClick={() => setNotificationModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#111827] font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
