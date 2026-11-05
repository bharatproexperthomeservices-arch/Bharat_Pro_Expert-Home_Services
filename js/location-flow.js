/**
 * Location Flow Module - Bharat Pro Expert
 * Realistic 3-step Location Onboarding Flow on Every Refresh:
 * Step 1 (2s): Just a moment... (Progress Bar)
 * Step 2 (2s): Fetching your location... (Animated dropping pin, real GPS call)
 * Step 3 (2s): Capturing your location... (Pulsing radar, real geocoding e.g. Sector 85, Gurugram, Haryana)
 * Responsive across Mobile, Tablet, and Desktop in full screen.
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
  city: 'Gurugram',
  district: 'Gurugram',
  state: 'Haryana',
  postalCode: '122001',
  country: 'India',
  label: 'Current location',
  serviceable: true,
  apartmentName: '',
  flatNo: '',
  landmark: '',
  savedAddressId: null
};

let autocompleteSessionToken = null;
let autoRedirectTimer = null;

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
 * Direct client-side Nominatim reverse geocode fallback
 */
async function clientSideNominatimReverse(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Nominatim HTTP ' + res.status);
  const data = await res.json();
  const addr = data.address || {};
  const sector = addr.suburb || addr.neighbourhood || addr.subdivision || addr.residential || '';
  const locality = addr.residential || addr.neighbourhood || addr.suburb || '';
  const city = addr.city || addr.town || addr.city_district || addr.district || 'Gurugram';
  const district = addr.city_district || addr.district || addr.county || '';
  const state = addr.state || 'Haryana';
  const postalCode = addr.postcode || '';

  const readableParts = [sector || locality, city, state].filter(Boolean);
  const formattedAddress = readableParts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  return {
    latitude: lat,
    longitude: lng,
    formattedAddress,
    houseNumber: addr.house_number || '',
    street: addr.road || '',
    locality,
    sector,
    city,
    district,
    state,
    postalCode,
    country: addr.country || 'India'
  };
}

/**
 * Reverse Geocode via server /api/geocode/reverse with client-side fallback
 */
async function performReverseGeocode(lat, lng) {
  updateStatusAnnouncement('Resolving physical address details...');
  try {
    const res = await fetch('/api/geocode/reverse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });
    const json = await res.json();
    if (json.ok && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Server reverse geocode failed, using client Nominatim:', err);
  }

  // Fallback direct call
  try {
    return await clientSideNominatimReverse(lat, lng);
  } catch (err2) {
    console.warn('Client Nominatim also failed:', err2);
    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      houseNumber: '',
      street: '',
      locality: 'Current Location',
      sector: '',
      city: 'Gurugram',
      district: 'Gurugram',
      state: 'Haryana',
      postalCode: '',
      country: 'India'
    };
  }
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

    <!-- STEP 1: LOADING BAR (2 SECONDS) -->
    <section class="onboarding-screen on" id="ob-screen-1" aria-label="Step 1 - Just a moment">
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
          <div class="tricolor-track">
            <div class="tricolor-fill anim-step1" id="step1-bar-fill"></div>
          </div>
          <p class="tricolor-text" id="step1-status-text">JUST A MOMENT...</p>
        </div>
      </div>
    </section>

    <!-- STEP 2: FETCHING LOCATION (2 SECONDS - PIN DROPPING ANIMATION) -->
    <section class="onboarding-screen" id="ob-screen-2" aria-label="Step 2 - Fetching your location">
      <div class="onboarding-stack">
        <div class="pin-drop-container">
          <div class="pin-drop-stick"></div>
          <div class="pin-shadow"></div>
        </div>
        <h2 class="heading-serif-navy">Fetching your location...</h2>
        <div class="ob-divider-rule">
          <span>PLEASE WAIT</span>
        </div>
        <div class="tricolor-loader" style="margin-top: 24px;">
          <div class="tricolor-track">
            <div class="tricolor-fill anim-step2" id="step2-bar-fill"></div>
          </div>
          <p class="tricolor-text" id="gps-status-text">CONNECTING TO GPS...</p>
        </div>
      </div>
    </section>

    <!-- STEP 3: CAPTURING LOCATION & AREA DETAILS (2 SECONDS - PULSING RADAR) -->
    <section class="onboarding-screen" id="ob-screen-3" aria-label="Step 3 - Capturing Location">
      <div class="onboarding-stack">
        <div class="radar-container">
          <div class="radar-ring"></div>
          <div class="radar-ring"></div>
          <div class="radar-ring"></div>
          <div class="green-success-pin" style="margin-bottom: 0; z-index: 2;">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12.5L9.5 17L19 7.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <p class="delivering-small-text" id="ob-delivering-tag">CAPTURING YOUR LOCATION...</p>
        <h1 class="home-gold-heading" id="ob-address-label" style="font-size: clamp(22px, 5vw, 28px); margin-bottom: 12px;">Delivering Services At</h1>

        <div class="address-white-card" style="margin-bottom: 16px;">
          <p class="address-text-grey" id="ob-fetched-address" style="font-size: 16px; font-weight: 600; color: var(--navy);">Capturing your real area...</p>
        </div>

        <div class="tricolor-loader" id="step3-loader" style="margin-bottom: 20px;">
          <div class="tricolor-track">
            <div class="tricolor-fill anim-step3" id="step3-bar-fill"></div>
          </div>
        </div>

        <div id="ob-step3-action-buttons" style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
          <button type="button" class="btn-onboarding-primary" id="ob-btn-continue" style="min-height: 44px;">Continue</button>
          <button type="button" class="btn-change-location-link" id="ob-btn-change-location" style="min-height: 44px; margin-top: 4px;">Change location</button>
        </div>
      </div>
    </section>

    <!-- ERROR STATE OVERLAY CARD (Polite fallback when denied/unavailable) -->
    <section class="onboarding-screen" id="ob-screen-error" aria-label="Location Permission / Availability">
      <div class="onboarding-stack">
        <div class="error-pin-circle" style="width: 64px; height: 64px; border-radius: 50%; background: #FEE2E2; border: 2px solid #EF4444; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="#DC2626"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <h2 class="heading-serif-navy" id="ob-error-title">Location not available</h2>
        <p class="address-text-grey" id="ob-error-desc" style="margin-top: 8px; margin-bottom: 20px;">Please allow location access to deliver services to your doorstep.</p>
        <button type="button" class="btn-onboarding-primary" id="ob-btn-error-continue" style="min-height: 44px; margin-bottom: 10px;">Continue with Default Location (Gurugram)</button>
        <button type="button" class="btn-change-location-link" id="ob-btn-error-retry" style="min-height: 44px;">Retry GPS Location</button>
        <button type="button" class="btn-change-location-link" id="ob-btn-error-manual" style="min-height: 44px;">Search location manually</button>
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
  `;

  document.body.appendChild(container);
  bindOverlayEvents();
}

/**
 * Update UI for Screen 3 with resolved location
 */
function updateScreen3UI() {
  const fetchedAddrEl = document.getElementById('ob-fetched-address');
  const labelEl = document.getElementById('ob-address-label');
  const deliveringTag = document.getElementById('ob-delivering-tag');

  if (deliveringTag) deliveringTag.textContent = 'DELIVERING SERVICE AT';
  if (labelEl) labelEl.textContent = currentAddressState.label || 'Current location';
  if (fetchedAddrEl) {
    fetchedAddrEl.textContent = currentAddressState.formattedAddress || 'Sector 85, Gurugram, Haryana';
  }

  updateStatusAnnouncement(`Delivering service at ${currentAddressState.formattedAddress}`);
}

/**
 * Finalize location selection and transition into the website
 */
function completeLocationFlowAndEnterSite() {
  clearTimeout(autoRedirectTimer);

  const storagePayload = {
    latitude: currentAddressState.latitude,
    longitude: currentAddressState.longitude,
    formattedAddress: currentAddressState.formattedAddress,
    apartmentName: currentAddressState.apartmentName || '',
    flatNo: currentAddressState.flatNo || '',
    landmark: currentAddressState.landmark || '',
    fullAddress: currentAddressState.formattedAddress,
    city: currentAddressState.city || 'Gurugram',
    pincode: currentAddressState.postalCode || '122001',
    label: currentAddressState.label || 'Current location',
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('bpe_location', JSON.stringify(storagePayload));
    localStorage.setItem('bpe_city', JSON.stringify(currentAddressState.city || 'Gurugram'));
  } catch (e) {}

  window.BPE_GPS_LOCATION = storagePayload;
  window.dispatchEvent(new CustomEvent('bpe:continue', { detail: storagePayload }));

  // Remove overlay smoothly
  const container = document.getElementById('bpe-location-flow-container');
  if (container) {
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      container.style.display = 'none';
      document.body.classList.remove('onboarding-active');
    }, 400);
  } else {
    document.body.classList.remove('onboarding-active');
  }

  if (window.location.hash !== '#/' && window.location.hash !== '') {
    window.location.hash = '#/';
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}

/**
 * Display Fallback / Error State
 */
function showErrorState(title, description) {
  clearTimeout(autoRedirectTimer);
  const tEl = document.getElementById('ob-error-title');
  const dEl = document.getElementById('ob-error-desc');
  if (tEl) tEl.textContent = title;
  if (dEl) dEl.textContent = description;
  showScreen('ob-screen-error');
  updateStatusAnnouncement(`Notice: ${title}. ${description}`);
}

/**
 * Acquire GPS coordinates with browser geolocation API
 */
function captureCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ success: false, reason: 'not_supported' });
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          success: true,
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }
        });
      },
      (err) => {
        resolve({
          success: false,
          code: err.code,
          message: err.message
        });
      },
      options
    );
  });
}

/**
 * Execute the 3-step realistic sequence (2 seconds each, total ~6 seconds)
 */
async function runThreeStepLocationSequence() {
  document.body.classList.add('onboarding-active');

  // STEP 1: Just a moment... (2 seconds)
  showScreen('ob-screen-1');
  const step1Fill = document.getElementById('step1-bar-fill');
  if (step1Fill) {
    step1Fill.classList.remove('anim-step1');
    void step1Fill.offsetWidth;
    step1Fill.classList.add('anim-step1');
  }
  updateStatusAnnouncement('Step 1: Just a moment...');
  await new Promise(r => setTimeout(r, 2000));

  // STEP 2: Fetching your location... (2 seconds)
  // Dropping pin animation + concurrent real GPS call
  showScreen('ob-screen-2');
  const step2Fill = document.getElementById('step2-bar-fill');
  if (step2Fill) {
    step2Fill.classList.remove('anim-step2');
    void step2Fill.offsetWidth;
    step2Fill.classList.add('anim-step2');
  }
  const statusEl = document.getElementById('gps-status-text');
  if (statusEl) statusEl.textContent = 'CONNECTING TO GPS...';
  updateStatusAnnouncement('Step 2: Fetching your location...');

  const step2Start = Date.now();
  const geoPromise = captureCoordinates();

  // Wait for at least 2 seconds for visual animation of dropping pin
  const [geoResult] = await Promise.all([
    geoPromise,
    new Promise(r => setTimeout(r, 2000))
  ]);

  if (!geoResult.success) {
    // Permission denied or unavailable -> polite fallback
    logAnalyticsEvent('location_failed', geoResult);
    showErrorState(
      'Location not available',
      'Please allow location access so we can deliver services directly to your doorstep.'
    );
    return;
  }

  // STEP 3: Capturing location... (2 seconds)
  // Pulsing radar animation + reverse geocoding to sector/area name
  showScreen('ob-screen-3');
  const step3Fill = document.getElementById('step3-bar-fill');
  if (step3Fill) {
    step3Fill.classList.remove('anim-step3');
    void step3Fill.offsetWidth;
    step3Fill.classList.add('anim-step3');
  }
  updateStatusAnnouncement('Step 3: Capturing your location...');

  const lat = geoResult.coords.latitude;
  const lng = geoResult.coords.longitude;
  currentAddressState.latitude = lat;
  currentAddressState.longitude = lng;
  currentAddressState.accuracy = geoResult.coords.accuracy;

  const geocodePromise = performReverseGeocode(lat, lng);
  const [geoData] = await Promise.all([
    geocodePromise,
    new Promise(r => setTimeout(r, 2000))
  ]);

  currentAddressState = {
    ...currentAddressState,
    ...geoData,
    label: geoData.sector || geoData.locality || 'Current location'
  };

  updateScreen3UI();
  logAnalyticsEvent('location_resolved', { lat, lng, formattedAddress: currentAddressState.formattedAddress });

  // After Step 3 completes, allow user to click Continue OR automatically enter after 1 second
  autoRedirectTimer = setTimeout(() => {
    completeLocationFlowAndEnterSite();
  }, 1000);
}

/**
 * Open Address Bottom Sheet Modal
 */
function openAddressModal() {
  clearTimeout(autoRedirectTimer);
  const modal = document.getElementById('ob-address-modal');
  if (!modal) return;

  const gpsAreaInput = document.getElementById('ob-input-gps-area');
  if (gpsAreaInput) {
    gpsAreaInput.value = currentAddressState.formattedAddress || 'Gurugram, Haryana';
  }

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
 * Handle Places Autocomplete Search
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

    autocompleteSessionToken = null;
    const json = await res.json();
    if (json.ok && json.place) {
      const p = json.place;
      currentAddressState.latitude = p.latitude;
      currentAddressState.longitude = p.longitude;
      currentAddressState.formattedAddress = p.formattedAddress;
      currentAddressState.city = p.city || 'Gurugram';
      currentAddressState.postalCode = p.postalCode || '';
      currentAddressState.label = p.sector || p.locality || 'Selected location';

      const gpsAreaInput = document.getElementById('ob-input-gps-area');
      if (gpsAreaInput) gpsAreaInput.value = p.formattedAddress;
    }
  } catch (err) {
    console.error('Failed to get place details:', err);
  }
}

/**
 * Save manual address and complete
 */
function saveAddressAndComplete() {
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

  const addressParts = [];
  if (flat) addressParts.push(flat);
  if (apartment) addressParts.push(apartment);
  if (landmark) addressParts.push(landmark);
  if (currentAddressState.formattedAddress) addressParts.push(currentAddressState.formattedAddress);

  currentAddressState.fullAddress = addressParts.join(', ');

  closeAddressModal();
  completeLocationFlowAndEnterSite();
}

/**
 * Bind DOM Event Listeners
 */
function bindOverlayEvents() {
  // Screen 3 Continue button
  document.getElementById('ob-btn-continue')?.addEventListener('click', () => {
    completeLocationFlowAndEnterSite();
  });

  // Screen 3 Change Location
  document.getElementById('ob-btn-change-location')?.addEventListener('click', () => {
    openAddressModal();
  });

  // Error screen continue with default Gurugram location
  document.getElementById('ob-btn-error-continue')?.addEventListener('click', () => {
    currentAddressState = {
      ...currentAddressState,
      latitude: 28.4035,
      longitude: 76.9712,
      formattedAddress: 'Sector 85, Gurugram, Haryana',
      sector: 'Sector 85',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122004',
      label: 'Sector 85, Gurugram'
    };
    completeLocationFlowAndEnterSite();
  });

  // Error screen retry GPS
  document.getElementById('ob-btn-error-retry')?.addEventListener('click', () => {
    runThreeStepLocationSequence();
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
 * Main Initialization Flow - Runs on EVERY refresh/load as requested
 */
export async function initLocationFlow() {
  initOverlayDOM();
  attachHeaderLocationSelectorHook();
  runThreeStepLocationSequence();
}

// Auto-run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLocationFlow);
} else {
  initLocationFlow();
}
