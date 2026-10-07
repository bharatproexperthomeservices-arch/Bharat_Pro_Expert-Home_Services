import React, { useState, useEffect } from 'react';
import { CleaningService, ServiceAddon, Booking, HubLocation } from '../types';
import { BUMPER_OFFERS, INITIAL_HUBS } from '../data';
import { useAuth } from '../context/AuthContext';
import { createNewBooking, getAllHubs } from '../services/dbService';
import { getRazorpayKeyId, loadRazorpayScript } from '../services/razorpayService';
import { BookingPayload } from '../hooks/useRazorpayBooking';
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
  Banknote,
  X,
  Phone,
  User,
  CheckCircle2,
  Tag,
  Compass,
  Navigation,
  Loader2,
  AlertCircle,
  Copy,
  Activity,
  Building,
  Home
} from 'lucide-react';

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
  const { user, profile } = useAuth();
  
  // Available Hubs (Dynamic from Database & LocalStorage)
  const [availableHubs, setAvailableHubs] = useState<HubLocation[]>(INITIAL_HUBS);

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
          let closest = INITIAL_HUBS[0];
          let minDist = 999999;
          for (const h of INITIAL_HUBS) {
            if (h.lat && h.lng) {
              const d = calculateHaversineKm(parsed.latitude, parsed.longitude, h.lat, h.lng);
              if (d < minDist) {
                minDist = d;
                closest = h;
              }
            }
          }
          if (minDist <= 50) return closest;

          // If more than 50km from existing hub, create dynamic hub for real city
          if (parsed.city) {
            return {
              id: `hub-${parsed.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              code: `BPE-${parsed.city.toUpperCase().slice(0, 3)}-01`,
              name: `${parsed.city} Express Hub`,
              state: parsed.state || 'India',
              city: parsed.city,
              district: parsed.district || parsed.city,
              address: `${parsed.locality || parsed.city}, ${parsed.state || ''}`,
              coveredSectors: [parsed.locality, parsed.sector, 'City Central'].filter(Boolean) as string[],
              pincodes: [parsed.pincode].filter(Boolean) as string[],
              lat: parsed.latitude,
              lng: parsed.longitude,
              serviceRadiusKm: 30,
              contactPhone: '+91 92660 23301',
              managerName: 'Field Operations Specialist',
              operatingHours: '07:30 - 21:00',
              status: 'ACTIVE',
              active: true,
              capacity: { maxJobsPerHour: 15, maxJobsPerDay: 100, partnerCapacity: 30, peakCapacity: 120, bookingBufferMinutes: 20, travelBufferMinutes: 20, emergencyCapacity: 15 },
              dispatchPriority: 'PRIMARY'
            };
          }
        }
      }
    } catch {}

    // 2. Try matching selectedCity
    if (selectedCity) {
      const clean = selectedCity.toLowerCase().split(',')[0].trim();
      const match = INITIAL_HUBS.find(h => 
        h.city.toLowerCase() === clean ||
        h.city.toLowerCase().includes(clean) ||
        clean.includes(h.city.toLowerCase()) ||
        (clean.includes('gurgaon') && h.city.toLowerCase().includes('gurugram')) ||
        (clean.includes('gurugram') && h.city.toLowerCase().includes('gurgaon'))
      );
      if (match) return match;
    }

    return INITIAL_HUBS[0];
  });

  const [selectedSector, setSelectedSector] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.locality || parsed.sector) return parsed.locality || parsed.sector;
      }
    } catch {}
    return selectedHub.coveredSectors?.[0] || '';
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
    return profile?.phone || user?.phoneNumber || localStorage.getItem('bharat_pro_last_customer_phone') || '';
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
      const match = availableHubs.find(h => h.city.toLowerCase() === selectedCity.toLowerCase());
      if (match) {
        setSelectedHub(match);
        if (match.coveredSectors?.length > 0) {
          setSelectedSector(match.coveredSectors[0]);
        }
      }
    }
  }, [selectedCity, availableHubs]);

  // Load latest hubs from DB / Storage
  useEffect(() => {
    const fetchHubs = async () => {
      const hubsList = await getAllHubs();
      if (hubsList && hubsList.length > 0) {
        setAvailableHubs(hubsList);
        if (selectedCity) {
          const match = hubsList.find(h => h.city.toLowerCase() === selectedCity.toLowerCase());
          if (match) {
            setSelectedHub(match);
            if (match.coveredSectors?.length > 0) setSelectedSector(match.coveredSectors[0]);
            return;
          }
        }
        setSelectedHub(hubsList[0]);
        if (hubsList[0].coveredSectors?.length > 0) {
          setSelectedSector(hubsList[0].coveredSectors[0]);
        }
      }
    };
    fetchHubs();

    const handleHubsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAvailableHubs(e.detail);
      }
    };
    window.addEventListener('bharatpro_hubs_updated', handleHubsUpdated);
    return () => window.removeEventListener('bharatpro_hubs_updated', handleHubsUpdated);
  }, [selectedCity]);

  // Sync service changes & cart add-ons
  useEffect(() => {
    if (service) {
      if (service.addons && service.addons.length > 0) {
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
    if (profile?.phone && !phone) setPhone(profile.phone);
    if (profile?.name && !name) setName(profile.name);
    if (profile?.email && !email) setEmail(profile.email);
    else if (user?.email && !email) setEmail(user.email);
  }, [profile, user]);

  // Calculate Subtotal & Math
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const rawSubtotal = (service?.basePrice || 0) + addonsTotal;
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

  // Auto detect Bumper Offer
  const unlockedOffer = [...BUMPER_OFFERS]
    .reverse()
    .find(offer => rawSubtotal >= offer.tierMinAmount);

  if (!service) return null;

  // Toggle add-on
  const toggleAddon = (addon: ServiceAddon) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Live Geolocation Auto-Detection using real GPS & Reverse Geocoding
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setErrorBanner('Geolocation is not supported by your browser. Please enter your address manually.');
      return;
    }

    setDetectingLocation(true);
    setGeoStatusMsg('Detecting precise GPS coordinates from device...');
    setErrorBanner(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGeoCoords({ lat: latitude, lng: longitude, accuracy });

        try {
          const resolved = await reverseGeocodeCoordinates(latitude, longitude, accuracy);
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
            let closestHub = availableHubs[0];
            let minDistance = 999999;
            for (const h of availableHubs) {
              if (h.lat && h.lng) {
                const dist = calculateHaversineKm(latitude, longitude, h.lat, h.lng);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestHub = h;
                }
              }
            }

            if (minDistance <= 45 && closestHub) {
              setSelectedHub(closestHub);
            } else {
              // Create dynamic hub for customer's actual city & state
              const dynamicHub: HubLocation = {
                id: `hub-${resolved.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                code: `BPE-${resolved.city.toUpperCase().slice(0, 3)}-01`,
                name: `${resolved.city} Direct Express Hub`,
                state: resolved.state,
                city: resolved.city,
                district: resolved.district || resolved.city,
                address: `${resolved.locality || resolved.city}, ${resolved.state} ${resolved.pincode || ''}`,
                coveredSectors: [resolved.locality, resolved.sector, 'City Central'].filter(Boolean) as string[],
                pincodes: [resolved.pincode].filter(Boolean) as string[],
                lat: latitude,
                lng: longitude,
                serviceRadiusKm: 30,
                contactPhone: '+91 92660 23301',
                managerName: 'Field Operations Specialist',
                operatingHours: '07:30 - 21:00',
                status: 'ACTIVE',
                active: true,
                capacity: { maxJobsPerHour: 15, maxJobsPerDay: 100, partnerCapacity: 30, peakCapacity: 120, bookingBufferMinutes: 20, travelBufferMinutes: 20, emergencyCapacity: 15 },
                dispatchPriority: 'PRIMARY'
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
          console.warn('Reverse geocoding notice:', e);
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
  };

  // Auto-detect location when reaching Step 2 if not yet locked
  useEffect(() => {
    if (step === 2 && !geoCoords && !detectingLocation) {
      handleDetectLiveLocation();
    }
  }, [step]);

  // Coupon handler (Strictly 10% Discount)
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'BHARAT10' || clean === 'PRO10' || clean === 'FIRST10' || clean === 'CLEAN10' || clean === 'SAVE10' || clean.includes('10')) {
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
    const cleanPhone = phone.trim().replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
    if (!cleanPhone || cleanPhone.length !== 10) errs.phone = true;
    
    const combinedStreet = [
      flatOrHouseNo.trim(),
      buildingOrStreet.trim() || streetAddress.trim()
    ].filter(Boolean).join(', ');
    
    if (!combinedStreet.trim() && !streetAddress.trim()) errs.street = true;

    setValidationErrors(errs);

    if (errs.name) {
      setErrorBanner('Please enter your full name.');
      return;
    }
    if (errs.phone) {
      setErrorBanner('Please enter a valid 10-digit mobile number for technician dispatch.');
      return;
    }
    if (errs.street) {
      setErrorBanner('Please enter your flat/tower number, building, and street address.');
      return;
    }

    if (combinedStreet) {
      setStreetAddress(combinedStreet);
    }

    // Save to local storage for subsequent bookings
    try {
      localStorage.setItem('bharat_pro_last_customer_name', name.trim());
      localStorage.setItem('bharat_pro_last_customer_phone', cleanPhone);
    } catch {}

    setErrorBanner(null);
    setStep(3);
  };

  // Final Confirmation Execution
  const handleConfirmBooking = async () => {
    setErrorBanner(null);
    if (!user && !profile) {
      setErrorBanner('🔒 Login required: Please sign in or register before completing your booking.');
      setLoading(false);
      onRequireAuth();
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorBanner('Please provide a valid 10-digit phone number.');
      setStep(2);
      return;
    }
    
    const combinedStreet = [
      flatOrHouseNo.trim(),
      buildingOrStreet.trim() || streetAddress.trim()
    ].filter(Boolean).join(', ');

    if (!combinedStreet.trim() && !streetAddress.trim()) {
      setErrorBanner('Please provide your complete tower/flat/street address.');
      setStep(2);
      return;
    }

    setLoading(true);

    const bookingId = 'bpe_bk_' + Math.random().toString(36).substring(2, 9);
    const bookingNumber = 'BPE-' + Math.floor(100000 + Math.random() * 900000);
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const finalLat = geoCoords?.lat ?? selectedHub.lat;
    const finalLng = geoCoords?.lng ?? selectedHub.lng;

    const bookingPayload: BookingPayload = {
      bookingId,
      bookingNumber,
      customerId: (user?.uid || profile?.uid)!,
      customerName: name.trim(),
      customerPhone: cleanPhone,
      customerEmail: user?.email || profile?.email || email.trim() || 'customer@bharatproexpert.com',
      serviceId: service.id,
      serviceName: `${service.name}${serviceConfig ? ` (${serviceConfig})` : ''}`,
      categoryName: service.categoryName || 'Deep Cleaning',
      date: selectedDate,
      timeSlot: selectedSlot,
      assignedHubId: selectedHub.id,
      address: {
        street: combinedStreet || streetAddress.trim(),
        sector: selectedSector || 'Central Area',
        city: customerCity || selectedHub.city,
        state: customerState || selectedHub.state,
        pincode: pincode || selectedHub.pincodes?.[0] || '',
        lat: finalLat,
        lng: finalLng
      },
      selectedAddons,
      basePrice: service.basePrice,
      addonsPrice: addonsTotal,
      taxesGst,
      convenienceFee,
      discount: discountAmount,
      totalAmount: netTotal,
      appliedCoupon: discountAmount > 0 ? couponCode : undefined,
      unlockedBumperOffer: unlockedOffer ? unlockedOffer.freeItemDescription : undefined,
      priceSnapshot: {
        basePrice: service.basePrice,
        referencePrice: service.referencePrice || Math.round(service.basePrice / 0.85),
        customerSavings: (service.referencePrice || Math.round(service.basePrice / 0.85)) - service.basePrice,
        discountPct: 10,
        pricingMode: 'REFERENCE_PERCENT',
        priceVersion: 'v1.0.0',
        addonsPrice: addonsTotal,
        taxesGst,
        convenienceFee,
        discount: discountAmount,
        totalAmount: netTotal,
        capturedAt: new Date().toISOString()
      },
      startOtp,
      completionOtp
    };

    // Strictly Pay Online with Razorpay (No COD allowed)
    try {
      const keyId = getRazorpayKeyId();
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded || !(window as any).Razorpay) {
        setErrorBanner('Could not load secure payment gateway. Please check your internet connection and retry.');
        setLoading(false);
        return;
      }

      const rzpOptions = {
        key: keyId,
        amount: Math.round(netTotal * 100), // in paise
        currency: 'INR',
        name: 'Bharat Pro Expert',
        description: `${service.name} (${bookingNumber})`,
        image: '/assets/images/BharatProExpert.png',
        prefill: {
          name: name.trim(),
          email: email.trim() || 'customer@bharatproexpert.com',
          contact: cleanPhone
        },
        notes: {
          bookingNumber,
          serviceName: service.name,
          hubId: selectedHub.id
        },
        theme: {
          color: '#08213F'
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            const paidBookingRecord: Booking = {
              ...bookingPayload,
              id: bookingId,
              categoryName: bookingPayload.categoryName || service.categoryName || 'Deep Cleaning',
              selectedAddons: selectedAddons || [],
              paymentMethod: 'UPI / Cards / Netbanking',
              paymentStatus: 'PAID',
              transactionId: response.razorpay_payment_id,
              razorpayDetails: {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id || '',
                signature: response.razorpay_signature || '',
                verifiedAt: new Date().toISOString(),
                verificationStatus: 'SUCCESS_VERIFIED'
              },
              status: 'SEARCHING_PROFESSIONAL',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const created = await createNewBooking(paidBookingRecord);
            setConfirmedBookingRecord(created);
            setStep(4);
            onBookingSuccess(created);
            setLoading(false);

            try {
              confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.6 }
              });
            } catch {}
          } catch (err: any) {
            console.error('Firestore booking creation error:', err);
            setErrorBanner('Payment received (ID: ' + response.razorpay_payment_id + '). Booking sync in progress...');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorBanner('⚠️ Online payment was not completed. As per policy, bookings are confirmed only after online payment.');
          }
        }
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on('payment.failed', (failResp: any) => {
        setLoading(false);
        setErrorBanner(`Payment failed: ${failResp.error?.description || 'Declined'}. Please retry with UPI, Google Pay, PhonePe, or Card.`);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay invocation error:', err);
      setLoading(false);
      setErrorBanner('Could not launch payment gateway. Please check your internet connection and retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md overflow-y-auto font-['Inter',sans-serif]">
      <div 
        id="booking-flow-card"
        className="w-full max-w-2xl rounded-3xl bg-white shadow-[0_25px_60px_-15px_rgba(8,33,63,0.3)] border border-slate-200 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#08213F] text-white flex items-center justify-center font-black text-sm shadow-md">
              {step <= 3 ? `${step}/3` : '✓'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#08213F]">
                {step === 1 && '1. Schedule & Configuration'}
                {step === 2 && '2. Contact Details & Address'}
                {step === 3 && '3. Order Summary & Payment'}
                {step === 4 && '4. Booking Confirmed!'}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md font-medium">
                {service.name} {serviceConfig && `• ${serviceConfig}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Step Indicator Tabs */}
        {step <= 3 && (
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => { setErrorBanner(null); setStep(1); }}
              className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                step === 1
                  ? 'border-[#08213F] text-[#08213F] bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span className="truncate">1. Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (step >= 2) { setErrorBanner(null); setStep(2); }
                else { handleContinueFromStep1(); }
              }}
              className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                step === 2
                  ? 'border-[#08213F] text-[#08213F] bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span className="truncate">2. Address</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (step >= 3) { setErrorBanner(null); setStep(3); }
                else if (step === 2) { handleContinueFromStep2(); }
                else {
                  handleContinueFromStep1();
                }
              }}
              className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                step === 3
                  ? 'border-[#08213F] text-[#08213F] bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${step === 3 ? 'bg-[#08213F] text-white' : 'bg-slate-200 text-slate-700'}`}>
                3
              </span>
              <span className="truncate">3. Payment</span>
            </button>
          </div>
        )}

        {/* Global Error Banner (No window.alert) */}
        {errorBanner && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start justify-between gap-3 text-xs text-red-800 animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorBanner}</span>
            </div>
            <button 
              onClick={() => setErrorBanner(null)} 
              className="text-red-500 hover:text-red-800 font-bold text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Unauthenticated User Login Required Banner */}
        {!user && !profile && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <span className="text-base shrink-0">🔒</span>
              <div>
                <p className="font-bold">Customer Login Required</p>
                <p className="text-[11px] text-amber-800">Please sign in or register with your mobile number to book services.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onRequireAuth} 
              className="px-3.5 py-1.5 rounded-xl bg-[#08213F] hover:bg-[#04162C] text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm transition-all active:scale-95"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* ================= STEP 1: SERVICE CONFIG, ADD-ONS & SCHEDULE ================= */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Contextual Configuration Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isFullHome ? 'Property Size / Configuration' : isBathroom ? 'Bathroom Count' : isSofa ? 'Seating Capacity' : 'Service Scope'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(isFullHome 
                    ? ['1 BHK', '2 BHK', '3 BHK', '4 BHK / Villa']
                    : isBathroom
                    ? ['1 Bathroom', '2 Bathrooms', '3 Bathrooms', '4+ Bathrooms']
                    : isSofa
                    ? ['3 Seater', '4 Seater', '5-6 Seater', '7+ Seater / Luxury']
                    : ['Standard', 'Deluxe', 'Deep Clean', 'Full Area']
                  ).map((cfg) => (
                    <button
                      key={cfg}
                      type="button"
                      onClick={() => setServiceConfig(cfg)}
                      className={`py-2.5 px-3 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        serviceConfig === cfg 
                          ? 'bg-[#08213F] text-white border-[#08213F] shadow-sm' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {cfg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-Ons */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Popular Add-ons (Optional)
                  </label>
                  <span className="text-[11px] text-slate-400">Select to add</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STANDARD_ADDONS.map((addon) => {
                    const isSelected = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border text-[11px] ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-50'
                          }`}>
                            {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : addon.icon}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {addon.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                              {addon.description}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#08213F]">
                          +₹{addon.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date & Slot Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Preferred Date</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Preferred Time Slot</span>
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm outline-none font-medium text-slate-800"
                  >
                    <option value="8 AM - 10 AM">8 AM - 10 AM (Morning Early)</option>
                    <option value="10 AM - 1 PM">10 AM - 1 PM (Prime Slot)</option>
                    <option value="1 PM - 4 PM">1 PM - 4 PM (Afternoon)</option>
                    <option value="4 PM - 7 PM">4 PM - 7 PM (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Unlocked Offer Badge */}
              {unlockedOffer && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-[#E07B1A] tracking-wider block">
                      🎉 {unlockedOffer.badge} UNLOCKED!
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {unlockedOffer.freeItemDescription} (₹{unlockedOffer.freeItemValue} value) complimentary with this booking!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: CONTACT DETAILS & REAL LOCATION ================= */}
          {step === 2 && (
            <div className="space-y-4">
              
              {/* GPS Auto-Detect Button */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      Live GPS Geographic Auto-Detect
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Instantly detect your real location, society, locality &amp; nearest service hub.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectLiveLocation}
                    disabled={detectingLocation}
                    className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting Real GPS...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        <span>Detect My Location</span>
                      </>
                    )}
                  </button>
                </div>

                {geoStatusMsg && (
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 py-1.5 px-3 rounded-lg flex items-center gap-1.5 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{geoStatusMsg}</span>
                  </div>
                )}
              </div>

              {/* Name & Phone (Required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (validationErrors.name) setValidationErrors({ ...validationErrors, name: false });
                      }}
                      placeholder="e.g. Ramesh Kumar"
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border text-sm outline-none font-medium text-slate-800 ${
                        validationErrors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {validationErrors.name && (
                    <span className="text-[11px] text-red-600 font-semibold mt-1 block">Full name is required.</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp &amp; Contact Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        if (validationErrors.phone) setValidationErrors({ ...validationErrors, phone: false });
                      }}
                      placeholder="e.g. 9876543210 (10 digits)"
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border text-sm outline-none font-medium text-slate-800 ${
                        validationErrors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {validationErrors.phone && (
                    <span className="text-[11px] text-red-600 font-semibold mt-1 block">Valid 10-digit mobile number required.</span>
                  )}
                </div>
              </div>

              {/* Tower / Flat / House No. & Building / Society */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Flat / House / Tower / Floor No. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Home className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={flatOrHouseNo}
                      onChange={(e) => {
                        setFlatOrHouseNo(e.target.value);
                        if (validationErrors.street) setValidationErrors({ ...validationErrors, street: false });
                      }}
                      placeholder="e.g. Tower B, Flat 402, 4th Floor / House 24"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm outline-none font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Society / Building / Apartment / Street Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Building className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={buildingOrStreet}
                      onChange={(e) => {
                        setBuildingOrStreet(e.target.value);
                        if (validationErrors.street) setValidationErrors({ ...validationErrors, street: false });
                      }}
                      placeholder="e.g. Godrej Frontier, Sector 85 / Main Road"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm outline-none font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Operating City & Hub + Sector / Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Operating City &amp; Assigned Hub
                  </label>
                  <select
                    value={selectedHub.id}
                    onChange={(e) => {
                      const h = availableHubs.find(x => x.id === e.target.value) || availableHubs[0];
                      setSelectedHub(h);
                      setCustomerCity(h.city);
                      setCustomerState(h.state);
                      if (h.coveredSectors?.length > 0) {
                        setSelectedSector(h.coveredSectors[0]);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs sm:text-sm outline-none font-medium text-slate-800"
                  >
                    {availableHubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.city}, {h.state} ({h.name} • {h.serviceRadiusKm}km)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Sector / Colony / Locality Area
                  </label>
                  <input
                    type="text"
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    placeholder="e.g. Sector 85, IMT Manesar, DLF Phase 2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs sm:text-sm outline-none font-medium text-slate-800"
                  />
                  {selectedHub.coveredSectors && selectedHub.coveredSectors.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</span>
                      {selectedHub.coveredSectors.slice(0, 4).map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSelectedSector(sec)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            selectedSector === sec
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Landmark, Email & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Sapphire Mall / Club House"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 122050"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {validationErrors.street && (
                <span className="text-[11px] text-red-600 font-semibold block">
                  Please enter your flat/tower number and society/building address.
                </span>
              )}

              {/* Service Hub Coverage Card */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">Verified Bharat Pro Service Coverage: </span>
                  <span>{selectedHub.name} ({customerCity || selectedHub.city}, {customerState || selectedHub.state})</span>
                  <span className="block text-[11px] text-emerald-700 font-normal">
                    Assigned technicians dispatched with hospital-grade equipment &amp; Diversey chemicals.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: BILLING & PAYMENT ================= */}
          {step === 3 && (
            <div className="space-y-5">
              
              {/* Order Summary Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-base text-[#08213F]">
                      {service.name} <span className="text-slate-500 font-semibold text-xs">({serviceConfig})</span>
                    </h4>
                    <span className="text-xs text-slate-600 font-medium">
                      📅 {selectedDate} • {selectedSlot}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      📍 {flatOrHouseNo ? flatOrHouseNo + ', ' : ''}{buildingOrStreet || streetAddress} {landmark && `(Near ${landmark})`}, {selectedSector}, {customerCity || selectedHub.city}, {customerState || selectedHub.state} - {pincode}
                    </p>
                  </div>
                  <span className="font-black text-base text-[#08213F]">
                    ₹{service.basePrice}
                  </span>
                </div>

                {selectedAddons.map(addon => (
                  <div key={addon.id} className="flex justify-between text-xs text-slate-600">
                    <span>+ {addon.name}</span>
                    <span>₹{addon.price}</span>
                  </div>
                ))}

                {/* 10% Discount Promo Code Form */}
                <form onSubmit={handleApplyCoupon} className="pt-2 border-t border-slate-200 flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon Code (e.g. BHARAT10)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono uppercase font-bold outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#08213F] text-white text-xs font-bold hover:bg-[#04162C] cursor-pointer"
                  >
                    Apply
                  </button>
                </form>

                <div className="flex items-center gap-2 text-[11px] text-amber-800">
                  <span className="font-semibold">Special Coupon:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponCode('BHARAT10');
                      setIsCouponApplied(true);
                      const disc = Math.round(rawSubtotal * 0.10);
                      setDiscountAmount(disc);
                      setCouponMessage(`🎉 BHARAT10 applied! 10% discount unlocked (Saved ₹${disc})`);
                      setErrorBanner(null);
                    }}
                    className="px-2.5 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 font-mono font-bold text-amber-950 cursor-pointer"
                  >
                    BHARAT10 (10% OFF)
                  </button>
                </div>

                {couponMessage && (
                  <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {couponMessage}
                  </p>
                )}

                {/* Financial Breakdown */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Service Price</span>
                    <span>₹{service.basePrice}</span>
                  </div>
                  {addonsTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Add-ons ({selectedAddons.length})</span>
                      <span>+₹{addonsTotal}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span>₹{taxesGst}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience &amp; Safety Hub Fee</span>
                    <span>₹{convenienceFee}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>10% Instant Discount Coupon</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-[#08213F] pt-2 border-t border-slate-300">
                    <span>Total Amount Payable</span>
                    <span className="text-blue-700 text-lg">₹{netTotal}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method: Strictly 100% Online Payment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Payment Method
                </label>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border-2 border-blue-600 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#08213F]">
                            100% Secure Online Payment
                          </span>
                          <span className="bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                            Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          UPI (GPay, PhonePe, Paytm), Debit/Credit Cards &amp; Netbanking via Razorpay
                        </p>
                      </div>
                    </div>
                    <span className="text-blue-700 font-black text-xs sm:text-sm bg-blue-100/80 px-2.5 py-1 rounded-lg">
                      ✓ Selected
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-blue-200/80 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-700">Supported:</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 text-[10px]">Google Pay</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 text-[10px]">PhonePe</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 text-[10px]">Paytm</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 text-[10px]">Cards</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 text-[10px]">Netbanking</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>256-Bit SSL Encrypted</span>
                    </div>
                  </div>
                </div>

                {/* COD Disabled Policy Notice */}
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                  <span className="text-sm shrink-0">🛡️</span>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Pre-Paid Booking Only:</strong> Cash on Delivery (COD) is disabled across all service hubs to ensure guaranteed technician allocation and eliminate fake bookings. 100% Free Re-clean or Money-Back Guarantee.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: BOOKING CONFIRMED SCREEN ================= */}
          {step === 4 && confirmedBookingRecord && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
                  🎉 Booking Confirmed!
                </span>
                <h3 className="text-2xl font-black text-[#08213F] mt-1">
                  Thank You, {confirmedBookingRecord.customerName}!
                </h3>
                <div className="inline-block mt-2 px-3.5 py-1 rounded-full bg-slate-100 font-mono text-xs font-bold text-[#08213F] border border-slate-200">
                  Booking ID: #{confirmedBookingRecord.bookingNumber}
                </div>
              </div>

              {/* Confirmation Details Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 text-left text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between pb-1.5 border-b border-blue-100">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-bold text-[#08213F]">{confirmedBookingRecord.serviceName}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-blue-100">
                  <span className="text-slate-500">Date &amp; Slot:</span>
                  <span className="font-bold text-[#08213F]">{confirmedBookingRecord.date} at {confirmedBookingRecord.timeSlot}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-blue-100">
                  <span className="text-slate-500">Service Address:</span>
                  <span className="font-bold text-[#08213F] text-right truncate max-w-[210px]">
                    {confirmedBookingRecord.address.street}, {confirmedBookingRecord.address.city}
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-blue-100">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>₹{confirmedBookingRecord.totalAmount} (PAID &amp; VERIFIED ONLINE)</span>
                  </span>
                </div>
                
                {confirmedBookingRecord.paymentStatus === 'PAID' && confirmedBookingRecord.transactionId && (
                  <div className="flex justify-between pb-1.5 border-b border-blue-100">
                    <span className="text-slate-500">Razorpay TXN:</span>
                    <span className="font-mono text-[11px] font-bold text-[#08213F]">{confirmedBookingRecord.transactionId}</span>
                  </div>
                )}

                {/* Start OTP */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-slate-500 block">Job Start OTP:</span>
                    <span className="text-[10px] text-slate-400">Share with technician upon arrival</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-lg">
                      {confirmedBookingRecord.startOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(confirmedBookingRecord.startOtp || '');
                      }}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      title="Copy OTP"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="max-w-md mx-auto pt-2 space-y-2">
                {onTrackBooking && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTrackBooking(confirmedBookingRecord);
                    }}
                    className="w-full py-3 px-6 rounded-2xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Track Booking Status Live</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-2xl bg-[#08213F] hover:bg-[#04162C] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Done • Return to Home
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setErrorBanner(null);
                  setStep((step - 1) as any);
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleContinueFromStep1}
                className="px-6 py-2.5 rounded-xl bg-[#08213F] hover:bg-[#04162C] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Address</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleContinueFromStep2}
                className="px-6 py-2.5 rounded-xl bg-[#08213F] hover:bg-[#04162C] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmBooking}
                className="px-6 py-3 rounded-xl bg-[#08213F] hover:bg-[#04162C] text-white text-xs sm:text-sm font-extrabold shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Booking...</span>
                  </>
                ) : (
                  <>
                    <span>🔒 Pay Online (₹{netTotal}) &amp; Confirm Booking</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlowModal;
