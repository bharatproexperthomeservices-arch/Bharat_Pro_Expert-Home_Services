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
    let data = null;
    let houseNumber = "";
    let road = "";
    let locality = "";
    let sector = "";
    let city = "Gurugram";
    let district = "";
    let state = "Haryana";
    let postalCode = "";
    let country = "India";
    let formattedAddress = "";

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BharatProExpertHomeServices/1.0 (bharatproexperthomeservices@gmail.com)'
        }
      });
      if (response.ok) {
        data = await response.json();
      }
    } catch (e) {
      console.warn("Nominatim reverse geocode error:", e.message);
    }

    if (data && data.address) {
      const addr = data.address;
      houseNumber = addr.house_number || addr.building || addr.house || "";
      road = addr.road || addr.street || "";
      sector = addr.suburb || addr.quarter || addr.subdistrict || "";
      locality = addr.neighbourhood || addr.locality || addr.residential || addr.city_district || "";
      city = addr.city || addr.town || addr.village || addr.city_district || addr.county || "Gurugram";
      district = addr.state_district || addr.district || city;
      state = addr.state || "Haryana";
      postalCode = addr.postcode || "";
      country = addr.country || "India";

      const parts = [houseNumber, road, locality, sector, city, state, postalCode, country].filter(Boolean);
      const uniqueParts = parts.filter((item, index) => parts.indexOf(item) === index);
      formattedAddress = uniqueParts.join(", ");
    }

    // Fallback to BigDataCloud if Nominatim failed or yielded empty formattedAddress
    if (!formattedAddress) {
      try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`;
        const bdcRes = await fetch(bdcUrl);
        if (bdcRes.ok) {
          const bdc = await bdcRes.json();
          city = bdc.city || bdc.locality || "Gurugram";
          state = bdc.principalSubdivision || "Haryana";
          postalCode = bdc.postcode || "";
          country = bdc.countryName || "India";
          locality = bdc.locality || "";
          const parts = [locality, city, state, postalCode, country].filter(Boolean);
          formattedAddress = parts.filter((item, index) => parts.indexOf(item) === index).join(", ");
        }
      } catch (e) {
        console.warn("BigDataCloud reverse geocode error:", e.message);
      }
    }

    if (!formattedAddress) {
      return res.status(500).json({ ok: false, error: "Failed to reverse geocode location" });
    }

    res.json({
      ok: true,
      data: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        formattedAddress,
        houseNumber,
        street: road,
        locality,
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
