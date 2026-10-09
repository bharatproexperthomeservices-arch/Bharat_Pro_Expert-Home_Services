import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CleaningService, ServiceAddon, Booking, HubLocation } from '../types';
import { BUMPER_OFFERS, INITIAL_HUBS } from '../data';
import { useAuth } from '../context/AuthContext';
import { createNewBooking, getAllHubs } from '../services/dbService';
import { loadRazorpayScript } from '../services/razorpayService';
import { reverseGeocodeCoordinates, calculateHaversineKm } from '../services/indiaLocationHierarchy';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Gift, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  X,
  Phone,
  User,
  CheckCircle2,
  Tag,
  Compass,
  Navigation,
  Loader2,
  AlertCircle,
} from 'lucide-react';

/* ---------- SAFE FALLBACK (white screen rokne ke liye) ---------- */
const FALLBACK_HUB: HubLocation = {
  id: 'hub-default',
  code: 'BPE-000',
  name: 'Default Hub',
  state: 'India',
  city: 'Delhi',
  district: 'Delhi',
  address: 'Delhi, India',
  coveredSectors: [],
  pincodes: [],
  serviceRadiusKm: 30,
  contactPhone: '+91 92660 23301',
  managerName: 'Operations',
  operatingHours: '07:30 - 21:00',
  status: 'ACTIVE',
  active: true,
  capacity: {
    maxJobsPerHour: 15, maxJobsPerDay: 100, partnerCapacity: 30,
    peakCapacity: 120, bookingBufferMinutes: 20,
    travelBufferMinutes: 20, emergencyCapacity: 15,
  },
  dispatchPriority: 'PRIMARY',
};

const SAFE_HUBS: HubLocation[] = (() => {
  try {
    if (Array.isArray(INITIAL_HUBS) && INITIAL_HUBS.length > 0) return INITIAL_HUBS;
  } catch {}
  return [FALLBACK_HUB];
})();

const SAFE_OFFERS: any[] = (() => {
  try {
    if (Array.isArray(BUMPER_OFFERS)) return BUMPER_OFFERS;
  } catch {}
  return [];
})();

interface BookingFlowModalProps {
  service: CleaningService | null;
  selectedCity?: string;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
  onRequireAuth: () => void;
  onTrackBooking?: (booking: Booking) => void;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  service,
  selectedCity,
  onClose,
  onBookingSuccess,
  onRequireAuth,
  onTrackBooking
}) => {
  const auth = useAuth?.() as any;
  const user = auth?.user ?? null;
  const profile = auth?.profile ?? null;
  
  // Available Hubs (Dynamic from Database & LocalStorage)
  const [availableHubs, setAvailableHubs] = useState<HubLocation[]>(SAFE_HUBS);

  // Steps: 1: Add-ons & Schedule -> 2: Address & Location -> 3: Billing & Payment -> 4: Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Configuration tailored to service
  const isFullHome = service ? /home|house|villa/i.test(service.name) : true;
  const isBathroom = service ? /bath/i.test(service.name) : false;
  const isSofa = service ? /sofa|couch|carpet/i.test(service.name) : false;

  const [serviceConfig, setServiceConfig] = useState<string>(
    isFullHome ? '2 BHK' : isBathroom ? '2 Bathrooms' : isSofa ? '3 Seater' : 'Standard'
  );

  const [selectedAddons, setSelectedAddons] = useState<ServiceAddon[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('10 AM - 1 PM');
  
  // Real Indian Address Hierarchy Details (Read directly from detected GPS / saved location)
  const [flatOrHouseNo, setFlatOrHouseNo] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.flatOrTower || '';
      }
    } catch {}
    return '';
  });

  const [buildingOrStreet, setBuildingOrStreet] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.buildingOrStreet || parsed.sector || '';
      }
    } catch {}
    return '';
  });

  const [streetAddress, setStreetAddress] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.formattedAddress || parsed.buildingOrStreet || '';
      }
    } catch {}
    return '';
  });

  const [customerCity, setCustomerCity] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.city) return parsed.city;
      }
    } catch {}
    if (selectedCity) return selectedCity.split(',')[0].trim();
    return '';
  });

  const [customerState, setCustomerState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.state) return parsed.state;
      }
    } catch {}
    if (selectedCity && selectedCity.includes(',')) return selectedCity.split(',')[1].trim();
    return '';
  });

  // Address & Nearest Hub Selection (Based on real GPS coordinates or selected city)
  const [selectedHub, setSelectedHub] = useState<HubLocation>(() => {
    // 1. Try reading saved real location
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          let closest = SAFE_HUBS[0] || FALLBACK_HUB;
          let minDist = 999999;
          for (const h of SAFE_HUBS) {
            if (h && h.lat && h.lng) {
              const d = calculateHaversineKm(parsed.latitude, parsed.longitude, h.lat, h.lng);
              if (typeof d === 'number' && d < minDist) {
                minDist = d;
                closest = h;
              }
            }
          }
          if (minDist <= 50) return closest;

          // If more than 50km from existing hub, create dynamic hub for real city
          if (parsed.city) {
            const citySafe = String(parsed.city);
            return {
              ...FALLBACK_HUB,
              id: `hub-${citySafe.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              code: `BPE-${citySafe.toUpperCase().slice(0, 3)}-01`,
              name: `${citySafe} Express Hub`,
              state: parsed.state || 'India',
              city: citySafe,
              district: parsed.district || citySafe,
              address: `${parsed.locality || citySafe}, ${parsed.state || ''}`,
              coveredSectors: [parsed.locality, parsed.sector, 'City Central'].filter(Boolean) as string[],
              pincodes: [parsed.pincode].filter(Boolean) as string[],
              lat: parsed.latitude,
              lng: parsed.longitude,
            };
          }
        }
      }
    } catch {}

    // 2. Try matching selectedCity
    if (selectedCity) {
      const clean = selectedCity.toLowerCase().split(',')[0].trim();
      const match = SAFE_HUBS.find(h => 
        h && h.city && (
          h.city.toLowerCase() === clean ||
          h.city.toLowerCase().includes(clean) ||
          clean.includes(h.city.toLowerCase()) ||
          (clean.includes('gurgaon') && h.city.toLowerCase().includes('gurugram')) ||
          (clean.includes('gurugram') && h.city.toLowerCase().includes('gurgaon'))
        )
      );
      if (match) return match;
    }

    return SAFE_HUBS[0] || FALLBACK_HUB;
  });

  const [selectedSector, setSelectedSector] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.locality || parsed.sector) return parsed.locality || parsed.sector;
      }
    } catch {}
    return SAFE_HUBS[0]?.coveredSectors?.[0] || '';
  });

  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pincode) return parsed.pincode;
      }
    } catch {}
    return '';
  });

  // User contact details — NO random hardcoded phone number!
  const [name, setName] = useState<string>(() => {
    return profile?.name || user?.displayName || localStorage.getItem('bharat_pro_last_customer_name') || '';
  });

  const [phone, setPhone] = useState<string>(() => {
    return (profile as any)?.phone || (user as any)?.phoneNumber || localStorage.getItem('bharat_pro_last_customer_phone') || '';
  });

  const [email, setEmail] = useState<string>(() => {
    return profile?.email || user?.email || '';
  });

  const [confirmedBookingRecord, setConfirmedBookingRecord] = useState<Booking | null>(null);

  // Live Geolocation / Geography Coordinates
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState<string | null>(null);
  
  // Coupons: strictly 10% discount with BHARAT10
  const [couponCode, setCouponCode] = useState('BHARAT10');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>('🎉 BHARAT10 applied! 10% discount unlocked.');
  const [isCouponApplied, setIsCouponApplied] = useState(true);

  // Payment method: Strictly Online (No COD)
  const [paymentMethod] = useState<'UPI / Cards / Netbanking'>('UPI / Cards / Netbanking');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ name?: boolean; phone?: boolean; street?: boolean }>({});

  // Standard Add-ons
  const STANDARD_ADDONS: ServiceAddon[] = [
    { id: 'add-fridge', name: 'Fridge Deep Clean', price: 249, description: 'Interior sanitize & odor neutralizer', icon: '❄️' },
    { id: 'add-chimney', name: 'Chimney Degreasing', price: 449, description: 'Baffle filter descaling & oil removal', icon: '🍳' },
    { id: 'add-fan', name: 'Ceiling Fan Detail', price: 99, description: 'Blades & motor wipe with polish', icon: '🌀' },
    { id: 'add-balcony', name: 'Balcony Jet Wash', price: 299, description: 'Railing & floor machine wash', icon: '🌿' },
    { id: 'add-bathroom', name: 'Extra Bathroom Clean', price: 599, description: 'Tile descaling & germicidal sanitize', icon: '🚿' },
    { id: 'add-window', name: 'Glass Window Cleaning', price: 299, description: 'Streak-free crystal squeegee finish', icon: '🪟' },
  ];

  // Sync selectedCity to matching hub on mount or city change
  useEffect(() => {
    if (selectedCity && availableHubs.length > 0) {
      const match = availableHubs.find(h => h && h.city && h.city.toLowerCase() === selectedCity.toLowerCase());
      if (match) {
        setSelectedHub(prev => (prev?.id === match.id ? prev : match));
        if (match.coveredSectors && match.coveredSectors.length > 0) {
          setSelectedSector(match.coveredSectors[0]);
        }
      }
    }
  }, [selectedCity, availableHubs]);

  // Load latest hubs from DB / Storage
  useEffect(() => {
    let cancelled = false;
    const fetchHubs = async () => {
      try {
        const hubsList = await getAllHubs();
        if (cancelled) return;
        if (hubsList && hubsList.length > 0) {
          setAvailableHubs(hubsList);
          if (selectedCity) {
            const match = hubsList.find((h: HubLocation) => h && h.city && h.city.toLowerCase() === selectedCity.toLowerCase());
            if (match) {
              setSelectedHub(match);
              if (match.coveredSectors && match.coveredSectors.length > 0) setSelectedSector(match.coveredSectors[0]);
              return;
            }
          }
          setSelectedHub(prev => (prev?.id ? prev : hubsList[0]));
          if (hubsList[0]?.coveredSectors?.length > 0) {
            setSelectedSector(hubsList[0].coveredSectors[0]);
          }
        }
      } catch (err) {
        console.warn('getAllHubs failed:', err);
      }
    };
    fetchHubs();

    const handleHubsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAvailableHubs(e.detail);
      }
    };
    window.addEventListener('bharatpro_hubs_updated', handleHubsUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('bharatpro_hubs_updated', handleHubsUpdated);
    };
  }, [selectedCity]);

  // Sync service changes & cart add-ons
  useEffect(() => {
    if (service) {
      if (Array.isArray(service.addons) && service.addons.length > 0) {
        setSelectedAddons(service.addons);
      } else {
        setSelectedAddons([]);
      }
      const isFull = /home|house|villa/i.test(service.name);
      const isBath = /bath/i.test(service.name);
      const isSof = /sofa|couch|carpet/i.test(service.name);
      setServiceConfig(isFull ? '2 BHK' : isBath ? '2 Bathrooms' : isSof ? '3 Seater' : 'Standard');
      setStep(1);
      setErrorBanner(null);
    }
  }, [service]);

  // Set default phone & name when profile or user state updates
  useEffect(() => {
    if ((profile as any)?.phone && !phone) setPhone((profile as any).phone);
    if (profile?.name && !name) setName(profile.name);
    if (profile?.email && !email) setEmail(profile.email);
    else if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);

  // Calculate Subtotal & Math
  const addonsTotal = (selectedAddons || []).reduce((sum, a) => sum + (Number(a?.price) || 0), 0);
  const rawSubtotal = (Number(service?.basePrice) || 0) + addonsTotal;
  const taxesGst = Math.round(rawSubtotal * 0.18);
  const convenienceFee = 49;
  const grossBeforeDiscount = rawSubtotal + taxesGst + convenienceFee;

  // Auto calculate 10% discount when coupon is applied
  useEffect(() => {
    if (isCouponApplied && rawSubtotal > 0) {
      const disc = Math.round(rawSubtotal * 0.10);
      setDiscountAmount(disc);
    } else {
      setDiscountAmount(0);
    }
  }, [rawSubtotal, isCouponApplied]);

  const netTotal = Math.max(0, grossBeforeDiscount - discountAmount);

  // Auto detect Bumper Offer (SAFE)
  const unlockedOffer = useMemo(() => {
    try {
      return [...SAFE_OFFERS].reverse().find(offer => 
        offer && typeof offer.tierMinAmount === 'number' && rawSubtotal >= offer.tierMinAmount
      );
    } catch {
      return undefined;
    }
  }, [rawSubtotal]);

  // NOTE: yahan se early return hata diya. Hooks ke baad hi return hona chahiye (warna React error 310).

  // Toggle add-on
  const toggleAddon = (addon: ServiceAddon) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Live Geolocation Auto-Detection using real GPS & Reverse Geocoding
  const handleDetectLiveLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrorBanner('Geolocation is not supported by your browser. Please enter your address manually.');
      return;
    }

    setDetectingLocation(true);
    setGeoStatusMsg('Detecting precise GPS coordinates from device...');
    setErrorBanner(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          setGeoCoords({ lat: latitude, lng: longitude, accuracy });

          let resolved: any = null;
          try {
            resolved = await reverseGeocodeCoordinates(latitude, longitude, accuracy);
          } catch (e) {
            console.warn('Reverse geocode error:', e);
          }

          if (resolved) {
            setGeoStatusMsg(`Locked: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (±${Math.round(accuracy)}m) • ${resolved.city}, ${resolved.state}`);
            
            if (resolved.city) setCustomerCity(resolved.city);
            if (resolved.state) setCustomerState(resolved.state);
            if (resolved.pincode) setPincode(resolved.pincode);
            
            if (resolved.locality || resolved.sector) {
              setSelectedSector(resolved.locality || resolved.sector || '');
            }

            if (resolved.buildingOrStreet) {
              setBuildingOrStreet(resolved.buildingOrStreet);
            } else if (resolved.sector) {
              setBuildingOrStreet(resolved.sector);
            }

            if (resolved.flatOrTower) {
              setFlatOrHouseNo(resolved.flatOrTower);
            }

            // Sync to streetAddress for backward-compatibility
            const fullStreet = [
              resolved.flatOrTower,
              resolved.buildingOrStreet || resolved.sector
            ].filter(Boolean).join(', ');
            if (fullStreet) {
              setStreetAddress(fullStreet);
            }

            // Find closest hub geographically by Haversine formula
            let closestHub = availableHubs[0] || FALLBACK_HUB;
            let minDistance = 999999;
            for (const h of availableHubs) {
              if (h && h.lat && h.lng) {
                const dist = calculateHaversineKm(latitude, longitude, h.lat, h.lng);
                if (typeof dist === 'number' && dist < minDistance) {
                  minDistance = dist;
                  closestHub = h;
                }
              }
            }

            if (minDistance <= 45 && closestHub) {
              setSelectedHub(closestHub);
            } else {
              // Create dynamic hub for customer's actual city & state
              const citySafe = String(resolved.city);
              const dynamicHub: HubLocation = {
                ...FALLBACK_HUB,
                id: `hub-${citySafe.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                code: `BPE-${citySafe.toUpperCase().slice(0, 3)}-01`,
                name: `${citySafe} Direct Express Hub`,
                state: resolved.state,
                city: citySafe,
                district: resolved.district || citySafe,
                address: `${resolved.locality || citySafe}, ${resolved.state} ${resolved.pincode || ''}`,
                coveredSectors: [resolved.locality, resolved.sector, 'City Central'].filter(Boolean) as string[],
                pincodes: [resolved.pincode].filter(Boolean) as string[],
                lat: latitude,
                lng: longitude,
              };
              setAvailableHubs(prev => [dynamicHub, ...prev.filter(x => x.id !== dynamicHub.id)]);
              setSelectedHub(dynamicHub);
            }

            // Save to localStorage for seamless persistence
            try {
              localStorage.setItem('bpe_customer_location_v1', JSON.stringify(resolved));
            } catch {}
          }
        } catch (e) {
          console.warn('GPS processing error:', e);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        setGeoStatusMsg('GPS permission denied or timeout. You can enter address manually.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [availableHubs]);

  // Auto-detect location when reaching Step 2 if not yet locked
  useEffect(() => {
    if (step === 2 && !geoCoords && !detectingLocation) {
      handleDetectLiveLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Coupon handler (Strictly 10% Discount)
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = (couponCode || '').trim().toUpperCase();
    const validCodes = ['BHARAT10', 'PRO10', 'FIRST10', 'CLEAN10', 'SAVE10'];
    if (validCodes.includes(clean) || clean.includes('10')) {
      setIsCouponApplied(true);
      const disc = Math.round(rawSubtotal * 0.10);
      setDiscountAmount(disc);
      setCouponMessage(`🎉 10% Discount applied! Saved ₹${disc}`);
      setErrorBanner(null);
    } else {
      setIsCouponApplied(false);
      setDiscountAmount(0);
      setCouponMessage(null);
      setErrorBanner('Invalid coupon code. Use "BHARAT10" to get 10% OFF on all bookings.');
    }
  };

  // Step 1 to Step 2 Validation
  const handleContinueFromStep1 = () => {
    if (!user && !profile) {
      setErrorBanner('🔒 Login required: Please sign in or register with your mobile/email to book.');
      onRequireAuth();
      return;
    }
    if (!selectedDate) {
      setErrorBanner('Please select a preferred service date.');
      return;
    }
    if (!selectedSlot) {
      setErrorBanner('Please select a time slot.');
      return;
    }
    setErrorBanner(null);
    setStep(2);
  };

  // Step 2 to Step 3 Validation
  const handleContinueFromStep2 = () => {
    if (!user && !profile) {
      setErrorBanner('🔒 Login required: Please sign in or register with your mobile/email to book.');
      onRequireAuth();
      return;
    }
    const errs: { name?: boolean; phone?: boolean; street?: boolean } = {};
    if (!name.trim()) errs.name = true;
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = true;
    if (!flatOrHouseNo.trim() || !buildingOrStreet.trim()) errs.street = true;
    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) {
      setErrorBanner('Please fill name, 10-digit phone number, and complete address.');
      return;
    }
    setErrorBanner(null);
    setStep(3);
  };

  // Step 3: Payment + Booking
  const handlePayAndConfirm = async () => {
    if (!service) return;
    if (!user && !profile) {
      setErrorBanner('🔒 Login required: Please sign in to book.');
      onRequireAuth();
      return;
    }
    setLoading(true);
    setErrorBanner(null);

    try {
      const sdkOk = await loadRazorpayScript();
      if (!sdkOk || typeof (window as any).Razorpay !== 'function') {
        throw new Error('Razorpay SDK failed to load. Check internet connection and retry.');
      }

      // Create a complete booking record with a stable ID before opening checkout.
      const now = new Date().toISOString();
      const bookingId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `bpe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const addonsTotal = selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
      const bookingDraft: Booking = {
        id: bookingId,
        bookingNumber: `BPE-${Date.now().toString().slice(-8)}`,
        customerId: String((user as any)?.uid || (profile as any)?.id || ''),
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        serviceId: service.id,
        serviceName: service.name,
        categoryName: 'Cleaning',
        date: selectedDate,
        timeSlot: selectedSlot,
        address: {
          street: [flatOrHouseNo, buildingOrStreet, streetAddress].filter(Boolean).join(', '),
          sector: selectedSector || '',
          city: customerCity || '',
          state: customerState || '',
          pincode: pincode || '',
          lat: geoCoords?.lat ?? 0,
          lng: geoCoords?.lng ?? 0,
          landmark: landmark || undefined,
        },
        selectedAddons,
        basePrice: Math.max(0, rawSubtotal - addonsTotal),
        addonsPrice: addonsTotal,
        taxesGst,
        convenienceFee,
        discount: discountAmount,
        totalAmount: netTotal,
        appliedCoupon: isCouponApplied ? couponCode : undefined,
        unlockedBumperOffer: unlockedOffer?.headline,
        paymentMethod: 'UPI / Cards / Netbanking',
        paymentStatus: 'PENDING',
        status: 'PAYMENT_PENDING',
        assignedHubId: selectedHub?.id || 'hub-gurugram-cyber',
        assignedHubName: selectedHub?.name || 'Gurugram Hub',
        startOtp: String(Math.floor(1000 + Math.random() * 9000)),
        completionOtp: String(Math.floor(1000 + Math.random() * 9000)),
        createdAt: now,
        updatedAt: now,
      };

      const booking = await createNewBooking(bookingDraft);
      if (!booking?.id) throw new Error('Could not create booking record. Please try again.');

      // The Razorpay order must be created by the server; never rely on a
      // Firestore booking object to magically contain a Razorpay order ID.
      let orderResponse: Response;
      try {
        orderResponse = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ amount: netTotal, currency: 'INR', bookingId: booking.id }),
        });
      } catch {
        throw new Error('Payment server se connect nahi ho paaya. Internet check karke dobara try karein.');
      }
      const orderData = await orderResponse.json().catch(() => null);
      if (!orderResponse.ok) {
        const serverMessage = orderData?.error || orderData?.message;
        if (orderResponse.status === 404) {
          throw new Error('Payment API deploy nahi hui hai. Latest GitHub changes ko deploy karein.');
        }
        if (orderResponse.status >= 500) {
          throw new Error(serverMessage || 'Razorpay server setup error. Vercel Environment Variables mein RAZORPAY_KEY_ID aur RAZORPAY_KEY_SECRET check karein.');
        }
        throw new Error(serverMessage || `Razorpay order create nahi hua (HTTP ${orderResponse.status}).`);
      }
      if (!orderData || typeof orderData.id !== 'string' || !orderData.id.startsWith('order_')) {
        throw new Error('Razorpay server se valid Order ID nahi mila. Vercel Function Logs check karein.');
      }
      const razorpayOrderId: string = orderData.id;
      const checkoutKeyId: string = orderData.keyId || '';
      if (!checkoutKeyId) throw new Error('Razorpay Key ID server response mein missing hai. Vercel Environment Variables check karein.');
      if (!Number.isFinite(Number(orderData.amount)) || Number(orderData.amount) <= 0) {
        throw new Error('Razorpay order amount invalid hai. Checkout open nahi kiya gaya.');
      }

      const options: any = {
        key: checkoutKeyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Bharat Pro Expert',
        description: `${service.name} - ${serviceConfig}`,
        order_id: razorpayOrderId,
        prefill: { name, email, contact: phone },
        notes: { bookingId: booking.id },
        theme: { color: '#0d9488' },
        handler: async (response: any) => {
          try {
            const res = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: booking.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verification = await res.json().catch(() => ({}));
            if (!res.ok || verification.verified !== true) {
              throw new Error(verification.error || 'Payment verification failed on server.');
            }
            const confirmed: Booking = {
              ...booking,
              paymentStatus: 'PAID',
              status: 'SEARCHING_PROFESSIONAL',
              transactionId: response.razorpay_payment_id,
              razorpayDetails: {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                verifiedAt: new Date().toISOString(),
                verificationStatus: 'VERIFIED',
              },
              updatedAt: new Date().toISOString(),
            };
            const savedConfirmed = await createNewBooking(confirmed);
            setConfirmedBookingRecord(savedConfirmed);
            try { confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); } catch {}
            setStep(4);
            onBookingSuccess(savedConfirmed);
            try {
              localStorage.setItem('bharat_pro_last_customer_name', name);
              localStorage.setItem('bharat_pro_last_customer_phone', phone);
            } catch {}
          } catch (err: any) {
            setErrorBanner(err?.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorBanner('Payment cancelled. You can retry anytime.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setErrorBanner(`Payment failed: ${resp?.error?.description || 'Unknown error'}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (!service) return null;

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{service.name}</h2>
            <p className="text-xs text-gray-500">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error banner */}
        {errorBanner && (
          <div className="mx-5 mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1">{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* STEP 1: Add-ons & Schedule */}
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Compass className="w-4 h-4" /> Configuration
                </label>
                <select
                  value={serviceConfig}
                  onChange={e => setServiceConfig(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '1 Bathroom', '2 Bathrooms', '3 Bathrooms', '3 Seater', '5 Seater', 'Standard'].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Gift className="w-4 h-4" /> Add-ons
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {STANDARD_ADDONS.map(a => {
                    const checked = selectedAddons.some(x => x.id === a.id);
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => toggleAddon(a)}
                        className={`text-left p-3 rounded-lg border ${checked ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{a.icon} {a.name}</span>
                          {checked && <Check className="w-4 h-4 text-teal-600" />}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{a.description}</div>
                        <div className="text-sm font-semibold text-teal-700 mt-1">₹{a.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Slot
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={e => setSelectedSlot(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  >
                    {['8 AM - 11 AM', '10 AM - 1 PM', '12 PM - 3 PM', '3 PM - 6 PM', '5 PM - 8 PM'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {unlockedOffer && unlockedOffer.title && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  🎁 Bumper offer unlocked: {unlockedOffer.title}
                </div>
              )}

              <button
                onClick={handleContinueFromStep1}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-teal-700"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* STEP 2: Address & Location */}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                disabled={detectingLocation}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-teal-500 text-teal-700 hover:bg-teal-50 disabled:opacity-60"
              >
                {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                {detectingLocation ? 'Detecting...' : 'Use Live GPS Location'}
              </button>

              {geoStatusMsg && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{geoStatusMsg}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Flat / House No *</label>
                  <input
                    value={flatOrHouseNo}
                    onChange={e => setFlatOrHouseNo(e.target.value)}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${validationErrors.street && !flatOrHouseNo ? 'border-red-400' : ''}`}
                    placeholder="e.g. A-201"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Building / Street *</label>
                  <input
                    value={buildingOrStreet}
                    onChange={e => setBuildingOrStreet(e.target.value)}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${validationErrors.street && !buildingOrStreet ? 'border-red-400' : ''}`}
                    placeholder="e.g. Green Park"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">City</label>
                  <input value={customerCity} onChange={e => setCustomerCity(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">State</label>
                  <input value={customerState} onChange={e => setCustomerState(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Sector / Locality</label>
                  <input value={selectedSector} onChange={e => setSelectedSector(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Pincode</label>
                  <input value={pincode} onChange={e => setPincode(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <User className="w-4 h-4" /> Name *
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${validationErrors.name && !name ? 'border-red-400' : ''}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone *
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    inputMode="tel"
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${validationErrors.phone ? 'border-red-400' : ''}`}
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold">Back</button>
                <button onClick={handleContinueFromStep2} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700">
                  Continue
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Billing & Payment */}
          {step === 3 && (
            <>
              <div className="rounded-xl border p-4 space-y-2 text-sm bg-gray-50">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{rawSubtotal}</span></div>
                <div className="flex justify-between"><span>GST (18%)</span><span>₹{taxesGst}</span></div>
                <div className="flex justify-between"><span>Convenience Fee</span><span>₹{convenienceFee}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({couponCode})</span><span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Payable</span><span>₹{netTotal}</span>
                </div>
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full border rounded-lg pl-9 pr-3 py-2 uppercase"
                    placeholder="Coupon"
                  />
                </div>
                <button type="submit" className="px-4 rounded-lg bg-gray-900 text-white font-semibold">Apply</button>
              </form>
              {couponMessage && <div className="text-xs text-green-700">{couponMessage}</div>}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 border border-teal-200 text-sm text-teal-800">
                <CreditCard className="w-4 h-4" />
                Online Payment (UPI / Cards / Netbanking)
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Payments secured by Razorpay. 100% safe & encrypted.
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} disabled={loading} className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold disabled:opacity-50">Back</button>
                <button
                  onClick={handlePayAndConfirm}
                  disabled={loading}
                  className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {loading ? 'Processing...' : `Pay ₹${netTotal}`}
                </button>
              </div>
            </>
          )}

          {/* STEP 4: Confirmation */}
          {step === 4 && confirmedBookingRecord && (
            <>
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                <h3 className="text-xl font-bold mt-3">Booking Confirmed!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Booking ID: <span className="font-mono font-semibold">{confirmedBookingRecord.id}</span>
                </p>
              </div>

              <div className="rounded-xl border p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Service</span><span>{service.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{selectedDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Slot</span><span>{selectedSlot}</span></div>
                <div className="flex justify-between font-semibold"><span>Paid</span><span>₹{netTotal}</span></div>
              </div>

              <div className="flex gap-2">
                {onTrackBooking && (
                  <button onClick={() => onTrackBooking(confirmedBookingRecord)} className="flex-1 py-3 rounded-xl border border-teal-600 text-teal-700 font-semibold">
                    Track Booking
                  </button>
                )}
                <button onClick={onClose} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700">
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Backward-compatible alias — file ka naam "BookingFlowModel.tsx" hai
// lekin component "BookingFlowModal" export hota hai. Dono naam se import chalega.
export const BookingFlowModel = BookingFlowModal;
export default BookingFlowModal;
