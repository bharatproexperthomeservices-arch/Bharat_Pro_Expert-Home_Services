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
