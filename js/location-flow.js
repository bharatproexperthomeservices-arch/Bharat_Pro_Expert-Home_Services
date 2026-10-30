/**
 * Location Flow Module - Bharat Pro Expert
 * Production-grade location detection, reverse geocoding, serviceability check,
 * address persistence, and interactive location management.
 */

import { supabase } from './supabase-config.js';

// Global state
let currentAddressState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  formattedAddress: '',
  houseNumber: '',
  street: '',
  locality: '',
  sector: '',
  city: '',
  district: '',
  state: '',
  postalCode: '',
  country: 'India',
  label: 'Current location',
  serviceable: true,
  apartmentName: '',
  flatNo: '',
  landmark: '',
  savedAddressId: null
};

let activeWatchId = null;
let currentAbortController = null;
let autocompleteSessionToken = null;
let googleMapInstance = null;
let googleMarkerInstance = null;

/**
 * Utility: Distance calculation in meters (Haversine formula)
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Log Analytics Event
 */
function logAnalyticsEvent(eventName, payload = {}) {
  console.log(`[Analytics] ${eventName}:`, payload);
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }
}

/**
 * Safe text sanitization to prevent XSS
 */
function sanitizeText(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Update UI Status Announcer
 */
function updateStatusAnnouncement(message) {
  const statusEl = document.getElementById('bpe-status-announcer');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

/**
 * Show screen by ID
 */
function showScreen(screenId) {
  const screens = document.querySelectorAll('.onboarding-screen');
  screens.forEach(s => {
    const isTarget = s.id === screenId;
    s.classList.toggle('on', isTarget);
    s.setAttribute('aria-hidden', !isTarget);
  });
}

/**
 * Initialize overlay DOM elements
 */
function initOverlayDOM() {
  if (document.getElementById('bpe-location-flow-container')) return;

  const container = document.createElement('div');
  container.id = 'bpe-location-flow-container';
  container.innerHTML = `
    <!-- ARIA Live Status Announcer -->
    <div id="bpe-status-announcer" aria-live="polite" class="sr-only" style="position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip:rect(0,0,0,0); border:0;"></div>

    <!-- SCREEN 1: SPLASH SCREEN -->
    <section class="onboarding-screen on" id="ob-screen-1" aria-label="Welcome Splash">
      <div class="onboarding-stack">
        <div class="ob-logo">
          <img src="assets/bharat-pro-logo.png" alt="Bharat Pro Expert Logo">
        </div>
        <h1 class="ob-title-navy">Bharat Pro Expert</h1>
        <div class="ob-divider-rule">
          <span>Home Services</span>
        </div>
        <p class="ob-tagline">Expert Hands For Your Perfect Home</p>
        <div class="tricolor-loader">
          <div class="tricolor-track"><div class="tricolor-fill"></div></div>
          <p class="tricolor-text">JUST A MOMENT...</p>
        </div>
      </div>
    </section>

    <!-- SCREEN 2: FETCHING LOCATION STATE -->
    <section class="onboarding-screen" id="ob-screen-2" aria-label="Fetching Location">
      <div class="onboarding-stack">
        <div class="radar-container">
          <div class="radar-ring"></div>
          <div class="radar-ring"></div>
          <div class="radar-ring"></div>
          <div class="gold-pin-circle">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        </div>
        <h2 class="heading-serif-navy">Fetching your location...</h2>
        <div class="ob-divider-rule">
          <span>PLEASE WAIT</span>
        </div>
        <div class="tricolor-loader" style="margin-top: 24px;">
          <div class="tricolor-track"><div class="tricolor-fill"></div></div>
          <p class="tricolor-text" id="gps-status-text">CONNECTING TO GPS...</p>
        </div>
      </div>
    </section>

    <!-- SCREEN 3: SUCCESS LOCATION STATE -->
    <section class="onboarding-screen" id="ob-screen-3" aria-label="Location Details">
      <div class="onboarding-stack">
        <div class="green-success-pin" id="ob-pin-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5L9.5 17L19 7.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="delivering-small-text" id="ob-delivering-tag">Delivering Services At</p>
        <h1 class="home-gold-heading" id="ob-address-label">Current location</h1>

        <div class="address-white-card">
          <p class="address-text-grey" id="ob-fetched-address">Fetching address details...</p>
        </div>

        <!-- Serviceability alert card if unserviceable -->
        <div id="ob-serviceability-alert" class="serviceability-alert-card" style="display:none; margin-bottom:16px; background:#FEF2F2; border:1px solid #FCA5A5; padding:12px; border-radius:12px; color:#991B1B; font-size:13px; text-align:center;">
          <strong>We don't serve this area yet.</strong>
          <p style="margin-top:4px; font-size:12px; color:#B91C1C;">We are expanding rapidly across India!</p>
        </div>

        <button type="button" class="btn-onboarding-primary" id="ob-btn-continue" style="min-height: 44px;">Continue</button>
        <button type="button" class="btn-change-location-link" id="ob-btn-change-location" style="min-height: 44px;">Change location</button>
      </div>
    </section>

    <!-- ERROR STATE OVERLAY CARD -->
    <section class="onboarding-screen" id="ob-screen-error" aria-label="Location Error">
      <div class="onboarding-stack">
        <div class="error-pin-circle" style="width: 60px; height: 60px; border-radius: 50%; background: #FEE2E2; border: 2px solid #EF4444; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#DC2626"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <h2 class="heading-serif-navy" id="ob-error-title">Location Error</h2>
        <p class="address-text-grey" id="ob-error-desc" style="margin-top: 8px; margin-bottom: 24px;">Could not retrieve location.</p>
        <button type="button" class="btn-onboarding-primary" id="ob-btn-error-retry" style="min-height: 44px; margin-bottom: 12px;">Retry</button>
        <button type="button" class="btn-change-location-link" id="ob-btn-error-manual" style="min-height: 44px;">Search location manually</button>
      </div>
    </section>

    <!-- MAP CONFIRMATION OVERLAY FOR LOW ACCURACY (>500m) -->
    <section class="onboarding-screen" id="ob-screen-map" aria-label="Confirm Location on Map">
      <div class="onboarding-stack" style="max-width: 500px; width: 100%;">
        <h2 class="heading-serif-navy" style="font-size: 20px;">Confirm your location</h2>
        <p class="address-text-grey" style="font-size: 13px; margin-bottom: 12px;">GPS accuracy is low. Drag the pin to adjust your exact position.</p>
        <div id="ob-google-map-container" style="width: 100%; height: 260px; border-radius: 16px; border: 1.5px solid var(--gold-light); margin-bottom: 16px;"></div>
        <button type="button" class="btn-onboarding-primary" id="ob-btn-confirm-map" style="min-height: 44px;">Confirm Location</button>
      </div>
    </section>

    <!-- COMPLETE ADDRESS & CHANGE LOCATION BOTTOM SHEET -->
    <div class="address-modal-overlay" id="ob-address-modal">
      <div class="address-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="ob-sheet-title">
        <div class="sheet-drag-handle"></div>
        <div class="address-modal-header">
          <h3 class="address-modal-title" id="ob-sheet-title">Select Location</h3>
          <p class="address-modal-sub">Search city, area or choose saved address</p>
        </div>

        <!-- AUTOCOMPLETE SEARCH INPUT -->
        <div class="address-form-group" style="position: relative;">
          <label class="address-form-label" for="ob-input-search">Search Area / Society / City</label>
          <input type="text" class="address-input" id="ob-input-search" placeholder="Type location in India..." autocomplete="off">
          <div id="ob-autocomplete-results" class="autocomplete-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #E2C893; border-radius:12px; z-index:100; max-height:200px; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.12); margin-top:4px;"></div>
        </div>

        <!-- SAVED ADDRESSES LIST -->
        <div id="ob-saved-addresses-section" style="margin-bottom: 20px; display:none;">
          <label class="address-form-label">Saved Addresses</label>
          <div id="ob-saved-addresses-list" style="display:flex; flex-direction:column; gap:8px;"></div>
        </div>

        <!-- ADDRESS FORM FIELDS -->
        <div class="address-form-group">
          <label class="address-form-label" for="ob-input-gps-area">Area / Sector / City / Pincode</label>
          <input type="text" class="address-input address-input-readonly" id="ob-input-gps-area" readonly placeholder="Selected location">
        </div>

        <div class="address-form-group">
          <label class="address-form-label" for="ob-input-apartment">Apartment / Building / Society Name <span class="req-star">*</span></label>
          <input type="text" class="address-input" id="ob-input-apartment" placeholder="e.g. XYZ Apartments">
          <div class="address-field-error" id="ob-err-apartment" hidden>Please enter apartment or building name</div>
        </div>

        <div class="address-form-group">
          <label class="address-form-label" for="ob-input-flat">Flat / House No. / Floor <span class="req-star">*</span></label>
          <input type="text" class="address-input" id="ob-input-flat" placeholder="e.g. Tower B, Flat 402">
          <div class="address-field-error" id="ob-err-flat" hidden>Please enter flat or house number</div>
        </div>

        <div class="address-form-group">
          <label class="address-form-label" for="ob-input-landmark">Landmark <span class="opt-tag">(Optional)</span></label>
          <input type="text" class="address-input" id="ob-input-landmark" placeholder="e.g. Near City Mall">
        </div>

        <div class="address-form-group">
          <label class="address-form-label">Save As</label>
          <div style="display:flex; gap:12px;">
            <button type="button" class="btn-address-label active" data-label="Home" style="flex:1; padding:10px; border-radius:8px; border:1.5px solid var(--gold-dark); background:var(--navy); color:#fff; font-weight:600; min-height:44px;">Home</button>
            <button type="button" class="btn-address-label" data-label="Work" style="flex:1; padding:10px; border-radius:8px; border:1.5px solid rgba(197,160,89,0.4); background:#fff; color:var(--navy); font-weight:600; min-height:44px;">Work</button>
            <button type="button" class="btn-address-label" data-label="Other" style="flex:1; padding:10px; border-radius:8px; border:1.5px solid rgba(197,160,89,0.4); background:#fff; color:var(--navy); font-weight:600; min-height:44px;">Other</button>
          </div>
        </div>

        <button type="button" class="btn-onboarding-primary" id="ob-btn-save-address" style="min-height: 44px;">Save Address & Continue</button>
        <button type="button" class="btn-change-location-link" id="ob-btn-cancel-modal" style="width:100%; min-height: 44px;">Cancel</button>
      </div>
    </div>

    <!-- NOTIFY ME MODAL (When area unserviceable) -->
    <div class="pincode-modal-overlay" id="ob-notify-modal">
      <div class="pincode-modal-card">
        <h3 class="pincode-modal-title">Notify Me</h3>
        <p class="pincode-modal-sub">We don't serve your pincode (<span id="ob-notify-pincode"></span>) yet. Enter phone/email to get notified when we launch!</p>
        <input type="text" class="pincode-input" id="ob-notify-input" placeholder="Phone number or Email address">
        <div id="ob-notify-err" style="color:#EF4444; font-size:12px; margin-bottom:12px;" hidden>Please enter a valid phone number or email</div>
        <button type="button" class="btn-onboarding-primary" id="ob-btn-submit-notify" style="min-height: 44px;">Submit Request</button>
        <button type="button" class="btn-change-location-link" id="ob-btn-close-notify" style="width:100%; margin-top:12px;">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  bindOverlayEvents();
}

/**
 * Fetch user saved addresses from Supabase for logged-in users
 */
async function loadSavedAddressesForUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return [];

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to load user saved addresses:', err);
    return [];
  }
}

/**
 * Render saved addresses list in the bottom sheet
 */
async function renderSavedAddressesInSheet() {
  const container = document.getElementById('ob-saved-addresses-list');
  const section = document.getElementById('ob-saved-addresses-section');
  if (!container || !section) return;

  const addresses = await loadSavedAddressesForUser();
  if (addresses.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = addresses.map(addr => `
    <div class="saved-address-item" data-id="${addr.id}" style="padding:10px 14px; border:1px solid rgba(197,160,89,0.3); border-radius:10px; cursor:pointer; background:#FAF8F5; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-weight:700; font-size:12px; text-transform:uppercase; color:var(--navy); background:#E2C893; padding:2px 6px; border-radius:4px; margin-right:6px;">${sanitizeText(addr.label)}</span>
        <span style="font-size:13px; color:var(--navy); font-weight:600;">${sanitizeText(addr.flat_no ? addr.flat_no + ', ' + addr.apartment_name : addr.formatted_address)}</span>
        <p style="font-size:12px; color:var(--grey-text); margin-top:2px;">${sanitizeText(addr.formatted_address)}</p>
      </div>
      <button type="button" class="btn-select-saved" style="background:var(--navy); color:#fff; border:none; border-radius:6px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer;">Select</button>
    </div>
  `).join('');

  container.querySelectorAll('.saved-address-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      const selected = addresses.find(a => a.id === id);
      if (selected) {
        selectSavedAddress(selected);
      }
    });
  });
}

/**
 * Handle selection of a saved address
 */
async function selectSavedAddress(addr) {
  currentAddressState.latitude = addr.latitude;
  currentAddressState.longitude = addr.longitude;
  currentAddressState.formattedAddress = addr.formatted_address;
  currentAddressState.apartmentName = addr.apartment_name || '';
  currentAddressState.flatNo = addr.flat_no || '';
  currentAddressState.landmark = addr.landmark || '';
  currentAddressState.postalCode = addr.pincode || '';
  currentAddressState.city = addr.city || '';
  currentAddressState.label = addr.label || 'Saved Address';
  currentAddressState.savedAddressId = addr.id;

  // Check serviceability
  await checkServiceabilityForCurrentLocation();

  document.getElementById('ob-address-modal').classList.remove('open');
  showScreen('ob-screen-3');
  updateScreen3UI();
  logAnalyticsEvent('location_changed', { source: 'saved_address', label: addr.label });
}

/**
 * Handle Reverse Geocoding API call
 */
async function performReverseGeocode(lat, lng) {
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  updateStatusAnnouncement('Resolving address details from coordinates...');
  const res = await fetch('/api/geocode/reverse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
    signal: currentAbortController.signal
  });

  const json = await res.json();
  if (!json.ok || !json.data) {
    throw new Error(json.error || 'Reverse geocoding failed');
  }

  const d = json.data;
  currentAddressState.latitude = d.latitude;
  currentAddressState.longitude = d.longitude;
  currentAddressState.formattedAddress = d.formattedAddress;
  currentAddressState.houseNumber = d.houseNumber || '';
  currentAddressState.street = d.street || '';
  currentAddressState.locality = d.locality || '';
  currentAddressState.sector = d.sector || '';
  currentAddressState.city = d.city || 'Gurugram';
  currentAddressState.district = d.district || '';
  currentAddressState.state = d.state || 'Haryana';
  currentAddressState.postalCode = d.postalCode || '';
  currentAddressState.country = d.country || 'India';

  // Check if matched within 100m of user saved addresses
  const savedAddresses = await loadSavedAddressesForUser();
  const matched = savedAddresses.find(sa => getDistanceMeters(lat, lng, sa.latitude, sa.longitude) <= 100);
  if (matched) {
    currentAddressState.label = matched.label;
    currentAddressState.apartmentName = matched.apartment_name || '';
    currentAddressState.flatNo = matched.flat_no || '';
    currentAddressState.landmark = matched.landmark || '';
    currentAddressState.savedAddressId = matched.id;
  } else {
    currentAddressState.label = 'Current location';
    currentAddressState.savedAddressId = null;
  }

  logAnalyticsEvent('location_resolved', { lat, lng, pincode: d.postalCode, city: d.city });
  return d;
}

/**
 * Check Serviceability Endpoint
 */
async function checkServiceabilityForCurrentLocation() {
  try {
    const res = await fetch('/api/serviceability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: currentAddressState.latitude,
        lng: currentAddressState.longitude,
        pincode: currentAddressState.postalCode,
        city: currentAddressState.city
      })
    });

    const json = await res.json();
    currentAddressState.serviceable = json.ok ? Boolean(json.serviceable) : false;
    if (json.city) currentAddressState.city = json.city;
  } catch (err) {
    console.warn('Serviceability check network error:', err);
    currentAddressState.serviceable = false;
  }
}

/**
 * Load Google Maps JS API for Confirm-on-map feature
 */
function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      return resolve(window.google.maps);
    }
    const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY_BROWSER || '';
    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY_BROWSER is not set');
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Render Interactive Map for confirming low accuracy location
 */
async function showConfirmOnMapScreen(lat, lng) {
  showScreen('ob-screen-map');
  updateStatusAnnouncement('Map loaded. Drag the marker to adjust your exact location.');

  try {
    await loadGoogleMapsScript();
    const mapContainer = document.getElementById('ob-google-map-container');
    const pos = { lat, lng };

    googleMapInstance = new window.google.maps.Map(mapContainer, {
      center: pos,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true
    });

    googleMarkerInstance = new window.google.maps.Marker({
      position: pos,
      map: googleMapInstance,
      draggable: true,
      title: 'Drag to adjust location'
    });

    googleMarkerInstance.addListener('dragend', async (evt) => {
      const newLat = evt.latLng.lat();
      const newLng = evt.latLng.lng();
      updateStatusAnnouncement('Updating coordinates from dragged marker...');
      try {
        await performReverseGeocode(newLat, newLng);
        await checkServiceabilityForCurrentLocation();
      } catch (err) {
        console.error('Failed to geocode dragged pin:', err);
      }
    });
  } catch (err) {
    console.warn('Google Maps JS API failed to load, proceeding to standard screen:', err);
    showScreen('ob-screen-3');
    updateScreen3UI();
  }
}

/**
 * Start Real GPS Location Fetching
 */
async function startRealLocationFetch() {
  showScreen('ob-screen-2');
  const statusEl = document.getElementById('gps-status-text');
  if (statusEl) statusEl.textContent = 'CHECKING PERMISSIONS...';
  updateStatusAnnouncement('Checking location permissions...');

  logAnalyticsEvent('location_requested');

  // 1. Check HTTPS / secure context
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    showErrorState('Insecure Context', 'Geolocation requires HTTPS or localhost connection.');
    logAnalyticsEvent('location_failed', { reason: 'insecure_context' });
    return;
  }

  // 2. Check Permissions API if supported
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied') {
        logAnalyticsEvent('location_denied');
        showErrorState(
          'Permission Denied',
          'Location access is blocked in your browser settings. Please enable location permissions or search manually.'
        );
        return;
      }
    } catch (e) {
      // Permission query not supported for geolocation in some browsers (e.g. Safari)
    }
  }

  if (!navigator.geolocation) {
    showErrorState('Not Supported', 'Geolocation is not supported by your device or browser.');
    logAnalyticsEvent('location_failed', { reason: 'not_supported' });
    return;
  }

  if (statusEl) statusEl.textContent = 'CONNECTING TO GPS...';
  updateStatusAnnouncement('Connecting to device GPS...');

  let bestReading = null;
  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  };

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      logAnalyticsEvent('location_granted');
      const { latitude, longitude, accuracy } = pos.coords;
      bestReading = { latitude, longitude, accuracy };

      // If accuracy > 100m, fallback to watchPosition up to 8s to get a tighter fix
      if (accuracy > 100) {
        if (statusEl) statusEl.textContent = 'REFINING GPS ACCURACY...';
        updateStatusAnnouncement('Refining high accuracy GPS fix...');

        await new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            if (activeWatchId !== null) {
              navigator.geolocation.clearWatch(activeWatchId);
              activeWatchId = null;
            }
            resolve();
          }, 8000);

          activeWatchId = navigator.geolocation.watchPosition(
            (watchPos) => {
              if (watchPos.coords.accuracy < bestReading.accuracy) {
                bestReading = {
                  latitude: watchPos.coords.latitude,
                  longitude: watchPos.coords.longitude,
                  accuracy: watchPos.coords.accuracy
                };
              }
              if (bestReading.accuracy <= 100) {
                clearTimeout(timeoutId);
                if (activeWatchId !== null) {
                  navigator.geolocation.clearWatch(activeWatchId);
                  activeWatchId = null;
                }
                resolve();
              }
            },
            (err) => {
              console.warn('WatchPosition error:', err);
            },
            options
          );
        });
      }

      currentAddressState.accuracy = bestReading.accuracy;

      try {
        await performReverseGeocode(bestReading.latitude, bestReading.longitude);
        await checkServiceabilityForCurrentLocation();

        // If low accuracy > 500m, ask user to confirm on map
        if (bestReading.accuracy > 500) {
          await showConfirmOnMapScreen(bestReading.latitude, bestReading.longitude);
        } else {
          showScreen('ob-screen-3');
          updateScreen3UI();
        }
      } catch (geocodeErr) {
        console.error('Reverse Geocode failed:', geocodeErr);
        showErrorState('Geocoding Failed', 'Could not resolve physical address for your GPS coordinates.');
        logAnalyticsEvent('location_failed', { reason: 'geocoding_failure', message: geocodeErr.message });
      }
    },
    (err) => {
      console.warn('getCurrentPosition error:', err);
      logAnalyticsEvent('location_failed', { code: err.code, message: err.message });
      if (err.code === err.PERMISSION_DENIED) {
        showErrorState('Permission Denied', 'Location permission was denied. Please allow location access or search manually.');
      } else if (err.code === err.TIMEOUT) {
        showErrorState('GPS Timeout', 'Timed out waiting for GPS signal. Please retry or search manually.');
      } else {
        showErrorState('Position Unavailable', 'GPS signal unavailable. Please ensure location services are enabled.');
      }
    },
    options
  );
}

/**
 * Display Error State UI with Retry and Manual Search buttons
 */
function showErrorState(title, description) {
  const tEl = document.getElementById('ob-error-title');
  const dEl = document.getElementById('ob-error-desc');
  if (tEl) tEl.textContent = title;
  if (dEl) dEl.textContent = description;
  showScreen('ob-screen-error');
  updateStatusAnnouncement(`Error: ${title}. ${description}`);
}

/**
 * Update UI on Screen 3
 */
function updateScreen3UI() {
  const fetchedAddrEl = document.getElementById('ob-fetched-address');
  const labelEl = document.getElementById('ob-address-label');
  const continueBtn = document.getElementById('ob-btn-continue');
  const alertCard = document.getElementById('ob-serviceability-alert');

  if (fetchedAddrEl) {
    fetchedAddrEl.textContent = currentAddressState.formattedAddress || 'Selected Address';
  }

  if (labelEl) {
    labelEl.textContent = currentAddressState.label || 'Current location';
  }

  if (currentAddressState.serviceable) {
    if (alertCard) alertCard.style.display = 'none';
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.style.opacity = '1';
      continueBtn.style.cursor = 'pointer';
      continueBtn.textContent = 'Continue';
    }
    updateStatusAnnouncement(`Delivering service at ${currentAddressState.label}: ${currentAddressState.formattedAddress}`);
  } else {
    if (alertCard) alertCard.style.display = 'block';
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.style.opacity = '0.5';
      continueBtn.style.cursor = 'not-allowed';
      continueBtn.textContent = 'Area Not Serviceable';
    }
    updateStatusAnnouncement(`Notice: Service is not available yet at ${currentAddressState.formattedAddress}`);
  }
}

/**
 * Open Address Bottom Sheet Modal
 */
async function openAddressModal() {
  const modal = document.getElementById('ob-address-modal');
  if (!modal) return;

  const gpsAreaInput = document.getElementById('ob-input-gps-area');
  if (gpsAreaInput) {
    gpsAreaInput.value = currentAddressState.formattedAddress || '';
  }

  const aptInput = document.getElementById('ob-input-apartment');
  const flatInput = document.getElementById('ob-input-flat');
  const lmkInput = document.getElementById('ob-input-landmark');

  if (aptInput) aptInput.value = currentAddressState.apartmentName || '';
  if (flatInput) flatInput.value = currentAddressState.flatNo || '';
  if (lmkInput) lmkInput.value = currentAddressState.landmark || '';

  // Render saved addresses list
  await renderSavedAddressesInSheet();

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('ob-input-search')?.focus();
}

/**
 * Close Address Modal
 */
function closeAddressModal() {
  const modal = document.getElementById('ob-address-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Handle Places Autocomplete Search with 300ms Debounce
 */
let autocompleteTimeout = null;
function handlePlacesAutocompleteSearch(query) {
  clearTimeout(autocompleteTimeout);
  const dropdown = document.getElementById('ob-autocomplete-results');
  if (!dropdown) return;

  if (!query || query.trim().length < 3) {
    dropdown.style.display = 'none';
    return;
  }

  autocompleteTimeout = setTimeout(async () => {
    if (!autocompleteSessionToken) {
      autocompleteSessionToken = 'session_' + Math.random().toString(36).substring(2, 11);
    }

    try {
      const res = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: query.trim(),
          sessionToken: autocompleteSessionToken
        })
      });

      const json = await res.json();
      if (!json.ok || !json.predictions || json.predictions.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      dropdown.innerHTML = json.predictions.map(p => `
        <div class="autocomplete-item" data-place-id="${p.placeId}" style="padding:10px 14px; border-bottom:1px solid #FAF8F5; cursor:pointer;">
          <strong style="font-size:13px; color:var(--navy); display:block;">${sanitizeText(p.structuredFormat.mainText)}</strong>
          <span style="font-size:12px; color:var(--grey-text);">${sanitizeText(p.structuredFormat.secondaryText)}</span>
        </div>
      `).join('');

      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', async () => {
          const placeId = item.getAttribute('data-place-id');
          dropdown.style.display = 'none';
          await selectPlaceDetails(placeId);
        });
      });
    } catch (err) {
      console.warn('Places autocomplete fetch error:', err);
      dropdown.style.display = 'none';
    }
  }, 300);
}

/**
 * Fetch Place Details upon selection from Autocomplete
 */
async function selectPlaceDetails(placeId) {
  try {
    const res = await fetch('/api/places/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId,
        sessionToken: autocompleteSessionToken
      })
    });

    // Reset session token after place selection
    autocompleteSessionToken = null;

    const json = await res.json();
    if (!json.ok || !json.place) {
      throw new Error('Place details error');
    }

    const p = json.place;
    currentAddressState.latitude = p.latitude;
    currentAddressState.longitude = p.longitude;
    currentAddressState.formattedAddress = p.formattedAddress;
    currentAddressState.houseNumber = p.houseNumber || '';
    currentAddressState.street = p.street || '';
    currentAddressState.locality = p.locality || '';
    currentAddressState.sector = p.sector || '';
    currentAddressState.city = p.city || 'Gurugram';
    currentAddressState.district = p.district || '';
    currentAddressState.state = p.state || '';
    currentAddressState.postalCode = p.postalCode || '';
    currentAddressState.country = p.country || 'India';
    currentAddressState.label = 'Selected location';

    const gpsAreaInput = document.getElementById('ob-input-gps-area');
    if (gpsAreaInput) gpsAreaInput.value = p.formattedAddress;

    await checkServiceabilityForCurrentLocation();
    logAnalyticsEvent('location_changed', { source: 'autocomplete', placeId, pincode: p.postalCode });
  } catch (err) {
    console.error('Failed to get place details:', err);
  }
}

/**
 * Complete Address Form Validation & Save
 */
async function saveAddressAndComplete() {
  const aptInput = document.getElementById('ob-input-apartment');
  const flatInput = document.getElementById('ob-input-flat');
  const lmkInput = document.getElementById('ob-input-landmark');
  const errApt = document.getElementById('ob-err-apartment');
  const errFlat = document.getElementById('ob-err-flat');

  const apartment = aptInput ? aptInput.value.trim() : '';
  const flat = flatInput ? flatInput.value.trim() : '';
  const landmark = lmkInput ? lmkInput.value.trim() : '';

  let isValid = true;
  if (!apartment) {
    if (errApt) errApt.hidden = false;
    isValid = false;
  } else {
    if (errApt) errApt.hidden = true;
  }

  if (!flat) {
    if (errFlat) errFlat.hidden = false;
    isValid = false;
  } else {
    if (errFlat) errFlat.hidden = true;
  }

  if (!isValid) return;

  currentAddressState.apartmentName = apartment;
  currentAddressState.flatNo = flat;
  currentAddressState.landmark = landmark;

  // Build full address string
  const addressParts = [];
  if (flat) addressParts.push(flat);
  if (apartment) addressParts.push(apartment);
  if (landmark) addressParts.push(landmark);
  if (currentAddressState.formattedAddress) addressParts.push(currentAddressState.formattedAddress);

  const fullAddressStr = addressParts.join(', ');

  // Save/Upsert to Supabase if logged in
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userId = session.user.id;
      const savedList = await loadSavedAddressesForUser();

      // Check if coordinates match within 100m of existing saved address
      const existing = savedList.find(a =>
        getDistanceMeters(currentAddressState.latitude, currentAddressState.longitude, a.latitude, a.longitude) <= 100
      );

      if (existing) {
        // Update existing address
        await supabase
          .from('user_addresses')
          .update({
            label: currentAddressState.label,
            latitude: currentAddressState.latitude,
            longitude: currentAddressState.longitude,
            formatted_address: currentAddressState.formattedAddress,
            apartment_name: apartment,
            flat_no: flat,
            landmark: landmark,
            pincode: currentAddressState.postalCode,
            city: currentAddressState.city,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new address
        await supabase
          .from('user_addresses')
          .insert([{
            user_id: userId,
            label: currentAddressState.label,
            latitude: currentAddressState.latitude,
            longitude: currentAddressState.longitude,
            formatted_address: currentAddressState.formattedAddress,
            apartment_name: apartment,
            flat_no: flat,
            landmark: landmark,
            pincode: currentAddressState.postalCode,
            city: currentAddressState.city,
            is_default: savedList.length === 0
          }]);
      }
    }
  } catch (err) {
    console.warn('Failed to upsert user address to Supabase:', err);
  }

  // Persist to localStorage
  const storagePayload = {
    latitude: currentAddressState.latitude,
    longitude: currentAddressState.longitude,
    formattedAddress: currentAddressState.formattedAddress,
    apartmentName: apartment,
    flatNo: flat,
    landmark: landmark,
    fullAddress: fullAddressStr,
    city: currentAddressState.city,
    pincode: currentAddressState.postalCode,
    label: currentAddressState.label,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('bpe_location', JSON.stringify(storagePayload));
    localStorage.setItem('bpe_city', JSON.stringify(currentAddressState.city || 'Gurugram'));
  } catch (e) {}

  window.BPE_GPS_LOCATION = storagePayload;

  // Emit custom event
  const continueEvent = new CustomEvent('bpe:continue', { detail: storagePayload });
  window.dispatchEvent(continueEvent);

  closeAddressModal();

  // Hide overlay and reveal app
  const container = document.getElementById('bpe-location-flow-container');
  if (container) container.style.display = 'none';
  document.body.classList.remove('onboarding-active');

  if (window.location.hash !== '#/' && window.location.hash !== '') {
    window.location.hash = '#/';
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}

/**
 * Handle Unserviceable Area Notify Request Submission
 */
async function submitNotifyRequest() {
  const pincodeEl = document.getElementById('ob-notify-pincode');
  const inputEl = document.getElementById('ob-notify-input');
  const errEl = document.getElementById('ob-notify-err');

  const contact = inputEl ? inputEl.value.trim() : '';
  const pincode = currentAddressState.postalCode || '122001';

  if (!contact) {
    if (errEl) errEl.hidden = false;
    return;
  }
  if (errEl) errEl.hidden = true;

  try {
    const res = await fetch('/api/notify-serviceability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pincode,
        emailOrPhone: contact,
        lat: currentAddressState.latitude,
        lng: currentAddressState.longitude
      })
    });

    const json = await res.json();
    if (json.ok) {
      alert('Thank you! We will notify you as soon as services launch in your area.');
      document.getElementById('ob-notify-modal').classList.remove('open');
    } else {
      alert(json.error || 'Submission failed. Please try again.');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}

/**
 * Bind DOM Event Listeners
 */
function bindOverlayEvents() {
  // Screen 3 Continue
  document.getElementById('ob-btn-continue')?.addEventListener('click', () => {
    if (!currentAddressState.serviceable) return;
    openAddressModal();
  });

  // Screen 3 Change Location
  document.getElementById('ob-btn-change-location')?.addEventListener('click', () => {
    openAddressModal();
  });

  // Confirm on map screen
  document.getElementById('ob-btn-confirm-map')?.addEventListener('click', () => {
    showScreen('ob-screen-3');
    updateScreen3UI();
  });

  // Error screen retry
  document.getElementById('ob-btn-error-retry')?.addEventListener('click', () => {
    startRealLocationFetch();
  });

  // Error screen manual search
  document.getElementById('ob-btn-error-manual')?.addEventListener('click', () => {
    openAddressModal();
  });

  // Autocomplete search input
  document.getElementById('ob-input-search')?.addEventListener('input', (e) => {
    handlePlacesAutocompleteSearch(e.target.value);
  });

  // Address Save Button
  document.getElementById('ob-btn-save-address')?.addEventListener('click', () => {
    saveAddressAndComplete();
  });

  // Modal Cancel
  document.getElementById('ob-btn-cancel-modal')?.addEventListener('click', () => {
    closeAddressModal();
  });

  // Notify Me Modal trigger (if unserviceable link clicked)
  document.getElementById('ob-serviceability-alert')?.addEventListener('click', () => {
    const notifyModal = document.getElementById('ob-notify-modal');
    const pCodeEl = document.getElementById('ob-notify-pincode');
    if (pCodeEl) pCodeEl.textContent = currentAddressState.postalCode || 'your area';
    if (notifyModal) notifyModal.classList.add('open');
  });

  document.getElementById('ob-btn-submit-notify')?.addEventListener('click', () => {
    submitNotifyRequest();
  });

  document.getElementById('ob-btn-close-notify')?.addEventListener('click', () => {
    document.getElementById('ob-notify-modal').classList.remove('open');
  });

  // Address label selector buttons (Home/Work/Other)
  document.querySelectorAll('.btn-address-label').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-address-label').forEach(b => {
        b.style.background = '#fff';
        b.style.color = 'var(--navy)';
        b.classList.remove('active');
      });
      btn.style.background = 'var(--navy)';
      btn.style.color = '#fff';
      btn.classList.add('active');
      currentAddressState.label = btn.getAttribute('data-label') || 'Home';
    });
  });

  // Network Offline / Online events
  window.addEventListener('offline', () => {
    showErrorState('Offline Mode', 'You are currently offline. Please check your internet connection.');
  });

  window.addEventListener('online', () => {
    updateStatusAnnouncement('Connection restored. Retrying location fetch...');
    startRealLocationFetch();
  });
}

/**
 * Header Location Selector Hook
 */
export function attachHeaderLocationSelectorHook() {
  const headerLocationBtn = document.querySelector('.header-location-selector, #header-location-btn, .location-trigger');
  if (headerLocationBtn) {
    headerLocationBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAddressModal();
    });
  }
}

/**
 * Main Initialization Flow
 */
export async function initLocationFlow() {
  initOverlayDOM();
  attachHeaderLocationSelectorHook();

  const minSplashPromise = new Promise(resolve => setTimeout(resolve, 1200));

  // Check cached location in localStorage
  let cached = null;
  try {
    const raw = localStorage.getItem('bpe_location');
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  await minSplashPromise;

  if (cached && cached.latitude && cached.longitude) {
    // Returning visit: skip overlay, use cached location instantly
    window.BPE_GPS_LOCATION = cached;
    currentAddressState = { ...currentAddressState, ...cached };

    const container = document.getElementById('bpe-location-flow-container');
    if (container) container.style.display = 'none';
    document.body.classList.remove('onboarding-active');

    // Refresh location silently in background
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const dist = getDistanceMeters(cached.latitude, cached.longitude, pos.coords.latitude, pos.coords.longitude);
          if (dist > 200) {
            console.log(`Background location update: moved ${Math.round(dist)}m > 200m`);
            await performReverseGeocode(pos.coords.latitude, pos.coords.longitude);
            await checkServiceabilityForCurrentLocation();

            const updatedPayload = {
              latitude: currentAddressState.latitude,
              longitude: currentAddressState.longitude,
              formattedAddress: currentAddressState.formattedAddress,
              city: currentAddressState.city,
              pincode: currentAddressState.postalCode,
              label: currentAddressState.label,
              timestamp: Date.now()
            };

            try {
              localStorage.setItem('bpe_location', JSON.stringify(updatedPayload));
            } catch (e) {}

            window.BPE_GPS_LOCATION = updatedPayload;
            window.dispatchEvent(new CustomEvent('bpe:continue', { detail: updatedPayload }));
          }
        },
        (err) => console.warn('Background location refresh error:', err),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  } else {
    // First visit: start full 3-screen location detection
    startRealLocationFetch();
  }
}

// Auto-run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLocationFlow);
} else {
  initLocationFlow();
}
