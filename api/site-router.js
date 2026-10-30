import express from "express";

const router = express.Router();

// Mock in-memory state or database fallback for site settings & content
const siteContentState = {
  home: {
    heroSlides: [
      { id: 'h1', title: 'Apartment deep cleaning from ₹2,199', sub: 'Machines and eco-safe chemicals by trained experts', emoji: '🏠', g1: '#34C759', g2: '#30B0C7', cta: 'Book Deep Cleaning', cat: 'deep' },
      { id: 'h2', title: 'Bathroom cleaning from ₹499', sub: 'Spotless tiles, taps and fittings in 45 minutes', emoji: '🚿', g1: '#5AC8FA', g2: '#007AFF', cta: 'Book Bathroom Cleaning', cat: 'bath' },
      { id: 'h3', title: 'Kitchen cleaning from ₹1,299', sub: 'Degreasing of counters, hob, tiles and cabinets', emoji: '🍳', g1: '#FF9F0A', g2: '#FF6B35', cta: 'Book Kitchen Cleaning', cat: 'kitchen' },
      { id: 'h4', title: 'Sofa cleaning from ₹249 per seat', sub: 'Shampoo cleaning that removes dust, mites and stains', emoji: '🛋️', g1: '#BF5AF2', g2: '#5E5CE6', cta: 'Book Sofa Cleaning', cat: 'sofa' }
    ],
    promo: {
      title: 'Flat ₹100 off on your first cleaning',
      sub: 'New to Bharat Pro Expert? Use the code at checkout on orders above ₹299.',
      cta: 'Claim Offer',
      code: 'FIRST100'
    }
  },
  globalSettings: {
    brandName: "Bharat Pro Expert",
    phone: "+91 89202 52647",
    email: "bharatproexpert@gmail.com",
    companyEmail: "bharatproexperthomeservices@gmail.com",
    primaryColor: "#007AFF"
  }
};

router.get("/content/:pageKey", (req, res) => {
  const { pageKey } = req.params;
  const content = siteContentState[pageKey] || siteContentState.home;
  res.json({ ok: true, pageKey, content });
});

router.get("/global-settings", (req, res) => {
  res.json({ ok: true, settings: siteContentState.globalSettings });
});

router.get("/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ ok: false, error: "Latitude and Longitude required" });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BharatProExpertHomeServices/1.0 (bharatproexperthomeservices@gmail.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding HTTP error ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const formattedAddress = data.display_name || "";
    const houseNumber = addr.house_number || addr.building || addr.house || "";
    const road = addr.road || addr.street || "";
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.locality || "";
    const sector = addr.subdistrict || addr.quarter || "";
    const city = addr.city || addr.town || addr.village || addr.county || "Gurugram";
    const district = addr.state_district || addr.district || city;
    const state = addr.state || "Haryana";
    const postalCode = addr.postcode || "";
    const country = addr.country || "India";

    res.json({
      ok: true,
      data: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        formattedAddress,
        houseNumber,
        street: road,
        locality: neighbourhood,
        sector,
        city,
        district,
        state,
        postalCode,
        country
      }
    });
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    res.status(500).json({ ok: false, error: "Failed to reverse geocode location" });
  }
});

router.get("/nav", (req, res) => {
  res.json({
    ok: true,
    nav: [
      { label: "Home", href: "#/" },
      { label: "Services", href: "#/services" },
      { label: "Bookings", href: "#/bookings" },
      { label: "Cart", href: "#/cart" },
      { label: "Help", href: "#/help" }
    ]
  });
});

export default router;
