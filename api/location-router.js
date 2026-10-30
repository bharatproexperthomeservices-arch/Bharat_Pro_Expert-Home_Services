import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Simple in-memory rate limiting map for notify endpoints
const rateLimitMap = new Map();

function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 mins
  const maxRequests = 10;

  const userRecord = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > userRecord.resetTime) {
    userRecord.count = 1;
    userRecord.resetTime = now + windowMs;
  } else {
    userRecord.count++;
  }

  rateLimitMap.set(ip, userRecord);

  if (userRecord.count > maxRequests) {
    return res.status(429).json({ ok: false, error: 'Too many requests, please try again later.' });
  }

  next();
}

// In-memory cache for reverse geocode results: key -> { data, expiresAt }
const geocodeCache = new Map();

// Lazy initialization of Supabase Admin Client
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      supabaseAdmin = createClient(url, key);
    }
  }
  return supabaseAdmin;
}

/**
 * Helper to parse Google Geocoding API components
 */
function parseGoogleAddressComponents(components) {
  let houseNumber = '';
  let street = '';
  let locality = '';
  let sector = '';
  let city = '';
  let district = '';
  let state = '';
  let postalCode = '';
  let country = '';

  components.forEach(comp => {
    const types = comp.types || [];
    if (types.includes('street_number')) houseNumber = comp.long_name;
    if (types.includes('route')) street = comp.long_name;
    if (types.includes('sublocality_level_1') || types.includes('sublocality')) locality = comp.long_name;
    if (types.includes('sublocality_level_2') || types.includes('neighborhood')) sector = comp.long_name;
    if (types.includes('locality')) city = comp.long_name;
    if (types.includes('administrative_area_level_3') || types.includes('administrative_area_level_2')) district = comp.long_name;
    if (types.includes('administrative_area_level_1')) state = comp.long_name;
    if (types.includes('postal_code')) postalCode = comp.long_name;
    if (types.includes('country')) country = comp.long_name;
  });

  if (!city && district) city = district;

  return { houseNumber, street, locality, sector, city, district, state, postalCode, country };
}

/**
 * 1. POST /api/geocode/reverse
 * Input: { lat, lng }
 * Output: { ok: true, data: { formattedAddress, houseNumber, street, locality, sector, city, district, state, postalCode, country, lat, lng } }
 */
router.post('/geocode/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.body || {};
    if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ ok: false, error: 'Valid latitude and longitude are required' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    // Cache key rounded to 4 decimals (~11m precision)
    const roundedLat = numLat.toFixed(4);
    const roundedLng = numLng.toFixed(4);
    const cacheKey = `${roundedLat},${roundedLng}`;

    const now = Date.now();
    if (geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey);
      if (cached.expiresAt > now) {
        return res.json({ ok: true, data: cached.data, cached: true });
      }
      geocodeCache.delete(cacheKey);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY_SERVER;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Google Maps Server API key is not configured' });
    }

    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${numLat},${numLng}&key=${apiKey}`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (googleData.status !== 'OK' || !googleData.results || googleData.results.length === 0) {
      return res.status(422).json({
        ok: false,
        error: googleData.error_message || `Geocoding failed with status: ${googleData.status}`
      });
    }

    const firstResult = googleData.results[0];
    const parsed = parseGoogleAddressComponents(firstResult.address_components || []);
    const formattedAddress = firstResult.formatted_address || `${numLat}, ${numLng}`;

    const resultPayload = {
      formattedAddress,
      ...parsed,
      latitude: numLat,
      longitude: numLng
    };

    // Cache for 24 hours
    geocodeCache.set(cacheKey, {
      data: resultPayload,
      expiresAt: now + 24 * 60 * 60 * 1000
    });

    return res.json({ ok: true, data: resultPayload });
  } catch (error) {
    console.error('Reverse Geocode API error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error during geocoding' });
  }
});

/**
 * 2. POST /api/places/autocomplete
 * Input: { input, sessionToken }
 * Output: { ok: true, predictions: [...] }
 */
router.post('/places/autocomplete', async (req, res) => {
  try {
    const { input, sessionToken } = req.body || {};
    if (!input || typeof input !== 'string' || !input.trim()) {
      return res.json({ ok: true, predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY_SERVER;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Google Maps Server API key is not configured' });
    }

    // Google Places API (New) Autocomplete endpoint
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const payload = {
      input: input.trim(),
      includedRegionCodes: ['in'],
      sessionToken: sessionToken || undefined
    };

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await apiRes.json();

    if (data.suggestions) {
      const predictions = data.suggestions.map(s => {
        const place = s.placePrediction || {};
        return {
          placeId: place.placeId || place.place,
          text: place.text?.text || '',
          structuredFormat: {
            mainText: place.structuredFormat?.mainText?.text || place.text?.text || '',
            secondaryText: place.structuredFormat?.secondaryText?.text || ''
          }
        };
      });
      return res.json({ ok: true, predictions });
    }

    return res.json({ ok: true, predictions: [] });
  } catch (error) {
    console.error('Places Autocomplete error:', error);
    return res.status(500).json({ ok: false, error: 'Places autocomplete failed' });
  }
});

/**
 * 3. POST /api/places/details
 * Input: { placeId, sessionToken }
 * Output: { ok: true, place: { formattedAddress, lat, lng, pincode, city } }
 */
router.post('/places/details', async (req, res) => {
  try {
    const { placeId, sessionToken } = req.body || {};
    if (!placeId) {
      return res.status(400).json({ ok: false, error: 'placeId is required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY_SERVER;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Google Maps Server API key is not configured' });
    }

    const url = `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken || ''}`;
    const apiRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,formattedAddress,location,addressComponents'
      }
    });

    const data = await apiRes.json();

    if (!data.location) {
      return res.status(422).json({ ok: false, error: 'Could not fetch details for placeId' });
    }

    const parsed = parseGoogleAddressComponents(data.addressComponents || []);

    return res.json({
      ok: true,
      place: {
        formattedAddress: data.formattedAddress || '',
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        ...parsed
      }
    });
  } catch (error) {
    console.error('Place Details error:', error);
    return res.status(500).json({ ok: false, error: 'Place details fetch failed' });
  }
});

/**
 * 4. POST /api/serviceability
 * Input: { lat, lng, pincode }
 * Output: { ok: true, serviceable: boolean, city: string }
 */
router.post('/serviceability', async (req, res) => {
  try {
    const { pincode, city } = req.body || {};
    const cleanPincode = String(pincode || '').trim();

    if (!cleanPincode) {
      return res.json({ ok: true, serviceable: false, city: city || 'Gurugram', reason: 'Pincode not provided' });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      // Fallback check if Supabase is not configured
      const defaultServiceable = ['122001', '122002', '122003', '122018', '122505', '110001', '110020'];
      const serviceable = defaultServiceable.includes(cleanPincode);
      return res.json({ ok: true, serviceable, city: city || (serviceable ? 'Gurugram' : '') });
    }

    const { data, error } = await adminClient
      .from('service_pincodes')
      .select('pincode, city, active')
      .eq('pincode', cleanPincode)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('Supabase serviceability lookup error:', error);
      return res.status(500).json({ ok: false, error: 'Database check failed' });
    }

    if (data) {
      return res.json({ ok: true, serviceable: true, city: data.city });
    }

    return res.json({ ok: true, serviceable: false, city: city || '' });
  } catch (error) {
    console.error('Serviceability check error:', error);
    return res.status(500).json({ ok: false, error: 'Serviceability check failed' });
  }
});

/**
 * 5. POST /api/notify-serviceability
 * Input: { pincode, emailOrPhone, lat, lng }
 */
router.post('/notify-serviceability', rateLimiter, async (req, res) => {
  try {
    const { pincode, emailOrPhone, lat, lng } = req.body || {};
    const cleanPincode = String(pincode || '').trim();
    const cleanContact = String(emailOrPhone || '').trim();

    if (!cleanPincode || !cleanContact) {
      return res.status(400).json({ ok: false, error: 'Pincode and contact info are required' });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return res.json({ ok: true, message: 'Notification request saved' });
    }

    const { error } = await adminClient
      .from('notify_requests')
      .insert([{
        pincode: cleanPincode,
        email_or_phone: cleanContact,
        latitude: lat != null ? Number(lat) : null,
        longitude: lng != null ? Number(lng) : null
      }]);

    if (error) {
      console.error('Insert notify_requests error:', error);
      return res.status(500).json({ ok: false, error: 'Failed to record notify request' });
    }

    return res.json({ ok: true, message: 'Notification request submitted successfully' });
  } catch (error) {
    console.error('Notify serviceability error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

export default router;
