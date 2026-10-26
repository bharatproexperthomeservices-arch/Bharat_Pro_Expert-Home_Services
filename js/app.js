/* Bharat Pro Expert — hash-router SPA.
 * Structure: helpers -> state/storage -> i18n -> pricing -> view fns -> sheets -> actions -> router/boot.
 * All dynamic strings pass through esc() before hitting innerHTML. */
import { loginWithGoogle, checkGoogleRedirectResult, sendPhoneOtp, verifyPhoneOtp, firebaseLogout } from './firebase-config.js';

(function () {
  'use strict';

  var CURRENT_CACHE_VERSION = 'v4.0.0-clean-admin';
  try {
    var storedVer = localStorage.getItem('bpe_cache_version');
    if (storedVer !== CURRENT_CACHE_VERSION) {
      var legacyKeys = ['uc_partner_session', 'uc_mode', 'bpe_gold_theme', 'admin_token', 'bpe_admin_auth', 'bpe_admin_user', 'bpe_legacy_theme', 'bpe_old_catalog', 'bpe_partners', 'bpe_admin_catalog'];
      legacyKeys.forEach(function (k) { localStorage.removeItem(k); });
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (r) { r.unregister(); });
        });
      }
      if ('caches' in window) {
        caches.keys().then(function (names) {
          names.forEach(function (name) { caches.delete(name); });
        });
      }
      localStorage.setItem('bpe_cache_version', CURRENT_CACHE_VERSION);
    }
  } catch (e) { /* storage or cache error */ }

  var isGoogleLoginInProgress = false;
  var D = window.BPE_DATA;
  if (!D || !Array.isArray(D.categories) || D.categories.length === 0 || !Array.isArray(D.services) || D.services.length === 0) {
    if (window.BPE_DATA) {
      D = window.BPE_DATA;
    }
  }
  var root = document.getElementById('app');
  if (!D || !Array.isArray(D.categories) || D.categories.length === 0) {
    root.innerHTML = '<p style="padding:24px;font-family:sans-serif">Data failed to load. Please refresh.</p>';
    return;
  }

  /* ---------- tiny helpers ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"'`]/g, function (c) { return ESC[c]; }); }
  function inr(n) { return '₹' + Math.round(n || 0).toLocaleString('en-IN'); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function load(k, def) {
    try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  function enc(s) { return encodeURIComponent(s); }
  function safeDecode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

  /* ---------- state ---------- */
  var S = {
    cart: load('bpe_cart', []),            // [{id, qty}]
    bookings: load('bpe_bookings', []),
    user: load('bpe_user', null),          // {phone, name}
    city: load('bpe_city', D.brand.city),
    lang: load('bpe_lang', 'en'),
    theme: load('bpe_theme', null),        // 'dark' | 'light' | null (system)
    coupon: load('bpe_coupon', null),      // code string
    sort: 'popular',
    sheet: null                            // {kind, data}
  };
  if (!Array.isArray(S.cart)) S.cart = [];
  if (!Array.isArray(S.bookings)) S.bookings = [];
  // Form drafts live outside the DOM so re-renders never lose typed values.
  var drafts = { co: {}, login: {}, partner: {}, errs: {} };
  var heroIdx = 0, heroTimer = null, tickTimer = null, tickSig, searchTimer = null, suppressGate = false;

  /* ---------- lookups ---------- */
  var svcMap = {}, catMap = {};
  D.services.forEach(function (s) { svcMap[s.id] = s; });
  D.categories.forEach(function (c) { catMap[c.id] = c; });
  function svc(id) { return svcMap[id]; }
  function cat(id) { return catMap[id] || { id: id, name: id, nameHi: id, emoji: '✨', g1: '#007AFF', g2: '#5AC8FA' }; }

  /* ---------- i18n ---------- */
  var TR = {
    en: {
      home: 'Home', services: 'Services', bookings: 'Bookings', cart: 'Cart', account: 'Account', login: 'Login', logout: 'Logout',
      search: 'Search services', seeAll: 'See all', add: 'Add', added: 'Added to cart', viewCart: 'View cart', items: 'items', item: 'item',
      howItWorks: 'How it works', whyUs: 'Why Bharat Pro Expert', loved: 'Loved by customers', allServices: 'All services',
      subtotal: 'Subtotal', discount: 'Coupon discount', fee: 'Visit & convenience fee', free: 'FREE', total: 'Total to pay',
      feeNote: 'Visit fee of ₹49 is waived on orders above ₹499. No GST.', checkout: 'Proceed to checkout',
      emptyCart: 'Your cart is empty', emptyCartSub: 'Add a service to get started.', browse: 'Browse services',
      coupon: 'Coupon code', apply: 'Apply', remove: 'Remove', couponOn: 'Coupon applied', couponBad: 'Invalid coupon code',
      couponMin: 'Add more services to use this coupon', lang: 'Language', dark: 'Dark mode', city: 'City', chooseCity: 'Choose your city',
      placeOrder: 'Confirm booking', address: 'Service address', name: 'Full name', phone: 'Mobile number', house: 'House / flat no.',
      area: 'Area / locality', pincode: 'Pincode', landmark: 'Landmark (optional)', pickDate: 'Pick a date', pickSlot: 'Pick a time slot',
      payment: 'Payment', cod: 'Pay after service', upi: 'UPI (pay on confirmation)', today: 'Today', tomorrow: 'Tomorrow',
      status: ['Confirmed', 'Expert assigned', 'On the way', 'Done'], cancelled: 'Cancelled', cancel: 'Cancel booking',
      reschedule: 'Reschedule', save: 'Save', close: 'Close', details: 'View details', noBookings: 'No bookings yet',
      noBookingsSub: 'Your booked services will appear here.', sendOtp: 'Send OTP', verify: 'Verify & login', otp: 'Enter 6-digit OTP',
      otpHint: 'Enter 6-digit code sent to your mobile', loginTitle: 'Welcome to Bharat Pro Expert', loginSub: 'Sign in to book trusted home services in seconds.',
      loginReq: 'Please login to complete your booking.', welcome: 'Welcome', help: 'Help & FAQs', partner: 'Become a partner',
      googleLogin: 'Continue with Google', orDivider: 'OR CONTINUING WITH MOBILE', enterName: 'Full name (optional)', resendOtp: 'Resend OTP',
      resendIn: 'Resend OTP in', otpSent: 'OTP sent successfully!', googleSuccess: 'Logged in with Google!',
      contact: 'Contact us', call: 'Call support', email: 'Email us', includes: 'What’s included', excludes: 'Not included',
      faqs: 'Frequently asked questions', goCart: 'Go to cart', sort: 'Sort', popular: 'Popular', priceLow: 'Price: low to high',
      topRated: 'Top rated', noResults: 'No services found', noResultsSub: 'Try another word, like "sofa", "bathroom" or "fan".',
      notFound: 'Page not found', notFoundSub: 'The page you are looking for does not exist.', goHome: 'Go home', min: 'min',
      bookingId: 'Booking ID', thanks: 'Booking confirmed!', thanksSub: 'Our expert will reach you at the chosen slot.',
      partnerTitle: 'Become a Bharat Pro Expert partner', partnerSub: 'Earn more with steady local jobs. Tell us about yourself.',
      experience: 'Experience (years)', skill: 'Your skill', submit: 'Submit application', partnerDone: 'Application received!',
      partnerDoneSub: 'Our team will call you within 2 working days.', confirmCancel: 'Cancel this booking?',
      keep: 'Keep booking', yesCancel: 'Yes, cancel', cancelledToast: 'Booking cancelled', reschedToast: 'Booking rescheduled',
      orderPlaced: 'Booking placed', fixErrors: 'Please fix the highlighted fields', menu: 'Menu', for: 'for', reviews: 'reviews',
      contactUs: 'Contact', quickLinks: 'Quick links', copied: 'Code applied. Use it in your cart.', rights: 'All rights reserved.',
      errName: 'Enter your name', errPhone: 'Enter a valid 10-digit mobile number', errHouse: 'Enter house / flat number',
      errArea: 'Enter your area', errPin: 'Enter a valid 6-digit pincode', errSlot: 'Pick a date and time slot', errOtp: 'Enter 6 digits',
      loggedOut: 'Logged out', loggedIn: 'Logged in', suggestions: 'Suggestions', searchFor: 'Search for', results: 'Results for',
      hello: 'Hello', guest: 'Guest', myBookings: 'My bookings', pastSlot: 'Slot passed', editPhone: 'Change mobile number'
    },
    hi: {
      home: 'होम', services: 'सेवाएँ', bookings: 'बुकिंग', cart: 'कार्ट', account: 'खाता', login: 'लॉगिन', logout: 'लॉगआउट',
      search: 'सेवा खोजें', seeAll: 'सभी देखें', add: 'जोड़ें', added: 'कार्ट में जोड़ा गया', viewCart: 'कार्ट देखें', items: 'आइटम', item: 'आइटम',
      howItWorks: 'यह कैसे काम करता है', whyUs: 'भारत प्रो एक्सपर्ट क्यों', loved: 'ग्राहकों की पसंद', allServices: 'सभी सेवाएँ',
      subtotal: 'उप-योग', discount: 'कूपन छूट', fee: 'विज़िट और कन्वीनियंस शुल्क', free: 'मुफ्त', total: 'कुल देय',
      feeNote: '₹499 से अधिक के ऑर्डर पर ₹49 शुल्क माफ़। कोई GST नहीं।', checkout: 'चेकआउट करें',
      emptyCart: 'आपका कार्ट खाली है', emptyCartSub: 'शुरू करने के लिए कोई सेवा जोड़ें।', browse: 'सेवाएँ देखें',
      coupon: 'कूपन कोड', apply: 'लागू करें', remove: 'हटाएँ', couponOn: 'कूपन लग गया', couponBad: 'गलत कूपन कोड',
      couponMin: 'इस कूपन के लिए और सेवाएँ जोड़ें', lang: 'भाषा', dark: 'डार्क मोड', city: 'शहर', chooseCity: 'अपना शहर चुनें',
      placeOrder: 'बुकिंग पक्की करें', address: 'सेवा का पता', name: 'पूरा नाम', phone: 'मोबाइल नंबर', house: 'मकान / फ्लैट नंबर',
      area: 'इलाका / मोहल्ला', pincode: 'पिनकोड', landmark: 'लैंडमार्क (वैकल्पिक)', pickDate: 'तारीख चुनें', pickSlot: 'समय चुनें',
      payment: 'भुगतान', cod: 'सेवा के बाद भुगतान', upi: 'UPI (पुष्टि पर भुगतान)', today: 'आज', tomorrow: 'कल',
      status: ['पक्की', 'एक्सपर्ट तय', 'रास्ते में', 'पूरा'], cancelled: 'रद्द', cancel: 'बुकिंग रद्द करें',
      reschedule: 'समय बदलें', save: 'सेव करें', close: 'बंद करें', details: 'विवरण देखें', noBookings: 'अभी कोई बुकिंग नहीं',
      noBookingsSub: 'आपकी बुक की गई सेवाएँ यहाँ दिखेंगी।', sendOtp: 'OTP भेजें', verify: 'सत्यापित करें', otp: '6 अंकों का OTP डालें',
      otpHint: 'अपने मोबाइल पर भेजा गया 6 अंकों का कोड डालें', loginTitle: 'भारत प्रो एक्सपर्ट में आपका स्वागत है', loginSub: 'विश्वसनीय होम सर्विस बुक करने के लिए लॉगिन करें।',
      loginReq: 'बुकिंग पूरी करने के लिए लॉगिन करें।', welcome: 'स्वागत', help: 'मदद और सवाल', partner: 'पार्टनर बनें',
      googleLogin: 'गूगल से लॉगिन करें', orDivider: 'या मोबाइल नंबर से जारी रखें', enterName: 'पूरा नाम (वैकल्पिक)', resendOtp: 'OTP फिर भेजें',
      resendIn: 'OTP फिर भेजें', otpSent: 'OTP सफलतापूर्वक भेजा गया!', googleSuccess: 'गूगल से लॉगिन सफल!',
      contact: 'संपर्क करें', call: 'सपोर्ट को कॉल करें', email: 'ईमेल करें', includes: 'क्या शामिल है', excludes: 'शामिल नहीं',
      faqs: 'अक्सर पूछे जाने वाले सवाल', goCart: 'कार्ट पर जाएँ', sort: 'क्रम', popular: 'लोकप्रिय', priceLow: 'कीमत: कम से ज़्यादा',
      topRated: 'सर्वश्रेष्ठ रेटिंग', noResults: 'कोई सेवा नहीं मिली', noResultsSub: 'दूसरा शब्द आज़माएँ, जैसे "AC", "सफाई" या "सैलून"।',
      notFound: 'पेज नहीं मिला', notFoundSub: 'आप जिस पेज को ढूँढ रहे हैं वह मौजूद नहीं है।', goHome: 'होम पर जाएँ', min: 'मिनट',
      bookingId: 'बुकिंग आईडी', thanks: 'बुकिंग पक्की!', thanksSub: 'हमारा एक्सपर्ट चुने गए समय पर पहुँचेगा।',
      partnerTitle: 'भारत प्रो एक्सपर्ट पार्टनर बनें', partnerSub: 'अपने इलाके में नियमित काम से ज़्यादा कमाएँ। अपने बारे में बताएँ।',
      experience: 'अनुभव (वर्ष)', skill: 'आपका हुनर', submit: 'आवेदन भेजें', partnerDone: 'आवेदन मिल गया!',
      partnerDoneSub: 'हमारी टीम 2 कार्यदिवस में कॉल करेगी।', confirmCancel: 'क्या यह बुकिंग रद्द करें?',
      keep: 'बुकिंग रखें', yesCancel: 'हाँ, रद्द करें', cancelledToast: 'बुकिंग रद्द हो गई', reschedToast: 'समय बदल दिया गया',
      orderPlaced: 'बुकिंग हो गई', fixErrors: 'कृपया लाल फील्ड ठीक करें', menu: 'मेनू', 'for': 'के लिए', reviews: 'रिव्यू',
      contactUs: 'संपर्क', quickLinks: 'त्वरित लिंक', copied: 'कोड लग गया। कार्ट में इस्तेमाल करें।', rights: 'सर्वाधिकार सुरक्षित।',
      errName: 'अपना नाम लिखें', errPhone: 'सही 10 अंकों का मोबाइल नंबर लिखें', errHouse: 'मकान / फ्लैट नंबर लिखें',
      errArea: 'अपना इलाका लिखें', errPin: 'सही 6 अंकों का पिनकोड लिखें', errSlot: 'तारीख और समय चुनें', errOtp: '6 अंक डालें',
      loggedOut: 'लॉगआउट हो गए', loggedIn: 'लॉगिन सफल', suggestions: 'सुझाव', searchFor: 'खोजें', results: 'इनके नतीजे',
      hello: 'नमस्ते', guest: 'अतिथि', myBookings: 'मेरी बुकिंग', pastSlot: 'समय निकल गया', editPhone: 'नंबर बदलें'
    }
  };
  function t(k) { var v = (TR[S.lang] || {})[k]; return v != null ? v : (TR.en[k] != null ? TR.en[k] : k); }
  function isHi() { return S.lang === 'hi'; }
  function nm(o) { return isHi() && o.nameHi ? o.nameHi : o.name; }
  function ttl(o) { return isHi() && o.titleHi ? o.titleHi : o.title; }

  /* ---------- pricing ---------- */
  function qtyOf(id) { for (var i = 0; i < S.cart.length; i++) if (S.cart[i].id === id) return S.cart[i].qty; return 0; }
  function cartCount() { return S.cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function findCoupon(code) {
    code = String(code || '').trim().toUpperCase();
    var list = D.coupons || [];
    for (var i = 0; i < list.length; i++) if (list[i].code === code) return list[i];
    return null;
  }
  // Returns {subtotal, discount, fee, total, couponErr}
  function calc() {
    var subtotal = S.cart.reduce(function (n, l) { var s = svc(l.id); return n + (s ? s.price * l.qty : 0); }, 0);
    var discount = 0, couponErr = '';
    var c = S.coupon ? findCoupon(S.coupon) : null;
    if (c) {
      if (subtotal < (c.min || 0)) couponErr = 'couponMin';
      else if (c.type === 'flat') discount = Math.min(c.value, subtotal);
      else discount = Math.min(Math.round(subtotal * c.value / 100), 150); // BPE10 cap
    }
    var fee = subtotal > 0 && subtotal <= 499 ? 49 : 0; // waived above 499
    return { subtotal: subtotal, discount: discount, fee: fee, total: Math.max(0, subtotal - discount + fee), couponErr: couponErr };
  }
  function persistCart() { save('bpe_cart', S.cart); }
  function setQty(id, q) {
    var line = null;
    S.cart.forEach(function (l) { if (l.id === id) line = l; });
    if (q <= 0) S.cart = S.cart.filter(function (l) { return l.id !== id; });
    else if (line) line.qty = Math.min(q, 10);
    else S.cart.push({ id: id, qty: q });
    if (!S.cart.length) { S.coupon = null; save('bpe_coupon', null); }
    persistCart();
  }

  /* ---------- dates & slots ---------- */
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dateChips() {
    var out = [], base = new Date();
    for (var i = 0; i < 7; i++) {
      var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var loc = isHi() ? 'hi-IN' : 'en-IN';
      var lbl = i === 0 ? t('today') : i === 1 ? t('tomorrow') : d.toLocaleDateString(loc, { weekday: 'short' });
      out.push({ iso: iso(d), label: lbl, sub: d.toLocaleDateString(loc, { day: 'numeric', month: 'short' }) });
    }
    return out;
  }
  function fmtDate(isoStr) {
    var p = String(isoStr).split('-'); if (p.length !== 3) return esc(isoStr);
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(isHi() ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function slotPast(slot, dateIso) {
    if (dateIso !== iso(new Date())) return false;
    var m = /(\d+):(\d+)\s*(AM|PM)/i.exec(slot); if (!m) return false;
    var h = +m[1] % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0);
    return h <= new Date().getHours();
  }
  function chipsHtml(selDate, selSlot, actDate, actSlot) {
    return '<div class="chips" role="group" aria-label="' + esc(t('pickDate')) + '">' + dateChips().map(function (d) {
      return '<button type="button" class="chip' + (d.iso === selDate ? ' is-active' : '') + '" data-act="' + actDate + '" data-v="' + d.iso + '" aria-pressed="' + (d.iso === selDate) + '">' + esc(d.label) + ' <small>' + esc(d.sub) + '</small></button>';
    }).join('') + '</div>' +
    '<div class="chips" role="group" aria-label="' + esc(t('pickSlot')) + '">' + D.slots.map(function (s) {
      var past = slotPast(s, selDate);
      return '<button type="button" class="chip' + (s === selSlot ? ' is-active' : '') + '" data-act="' + actSlot + '" data-v="' + esc(s) + '"' + (past ? ' disabled title="' + esc(t('pastSlot')) + '"' : '') + ' aria-pressed="' + (s === selSlot) + '">' + esc(s) + '</button>';
    }).join('') + '</div>';
  }

  /* ---------- bookings ---------- */
  var STEP_MS = 15000; // simulated: each status step takes 15s
  function stageOf(b) {
    if (b.cancelled) return -1;
    return Math.min(3, Math.floor((Date.now() - b.created) / STEP_MS));
  }
  function persistBookings() { save('bpe_bookings', S.bookings); }
  function getBooking(id) { for (var i = 0; i < S.bookings.length; i++) if (S.bookings[i].id === id) return S.bookings[i]; return null; }

  /* ---------- UI atoms ---------- */
  function stars(r) {
    return '<span class="stars" aria-label="' + esc(r) + ' out of 5">★ ' + esc(Number(r).toFixed(1)) + '</span>';
  }
  function gradient(c) { return 'background:linear-gradient(135deg,' + esc(c.g1) + ',' + esc(c.g2) + ')'; }
  function addControl(s) {
    var q = qtyOf(s.id);
    if (!q) return '<button type="button" class="card__add btn btn--sm" data-act="add" data-id="' + esc(s.id) + '" aria-label="' + esc(t('add') + ' ' + s.name) + '">' + esc(t('add')) + '</button>';
    return stepper(s.id, q, 'card__qty');
  }
  function stepper(id, q, cls) {
    return '<div class="' + (cls || 'card__qty') + '" role="group" aria-label="Quantity"><button type="button" data-act="dec" data-id="' + esc(id) + '" aria-label="Decrease quantity">−</button><span aria-live="polite">' + q + '</span><button type="button" data-act="inc" data-id="' + esc(id) + '" aria-label="Increase quantity">+</button></div>';
  }
  function card(s) {
    var c = cat(s.cat);
    return '<article class="card" data-go="#/s/' + esc(s.id) + '" tabindex="0" role="link" aria-label="' + esc(nm(s)) + '">' +
      '<div class="card__img" style="' + gradient(c) + '"><span aria-hidden="true" style="font-size:44px">' + esc(s.emoji || c.emoji) + '</span>' + (s.tag ? '<span class="card__tag">' + esc(s.tag) + '</span>' : '') + '</div>' +
      '<h3 class="card__name">' + esc(nm(s)) + '</h3>' +
      '<div class="card__meta"><span class="card__rating">★ ' + esc(Number(s.rating).toFixed(1)) + '</span> (' + esc(s.reviews) + ') · ' + esc(s.duration) + ' ' + esc(t('min')) + '</div>' +
      '<div class="card__meta"><span class="card__price">' + inr(s.price) + '</span> ' + (s.mrp > s.price ? '<s class="card__mrp">' + inr(s.mrp) + '</s>' : '') + addControl(s) + '</div>' +
      '</article>';
  }
  function sectionHead(title, more) {
    return '<div class="section__head"><h2 class="section__title">' + esc(title) + '</h2>' + (more ? '<a class="section__more" href="' + more + '">' + esc(t('seeAll')) + ' ›</a>' : '') + '</div>';
  }
  function emptyState(emoji, title, sub, ctaHref, ctaLabel) {
    return '<div class="empty"><div aria-hidden="true" style="font-size:48px">' + emoji + '</div><h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p>' +
      (ctaHref ? '<a class="btn btn--primary" href="' + ctaHref + '">' + esc(ctaLabel) + '</a>' : '') + '</div>';
  }
  function backBar(title, href) {
    return '<div class="section__head"><a class="btn btn--ghost btn--sm" href="' + (href || '#/') + '" aria-label="Back">‹ ' + esc(t('home')) + '</a><h1 class="section__title">' + esc(title) + '</h1></div>';
  }
  function toast(msg) {
    var box = $('#toast-root'); if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    box.innerHTML = ''; box.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2400);
  }

  /* ---------- shell: topbar, tabbar, cart bar ---------- */
  function topbar(route) {
    if (route.name === 'admin') return '';
    var q = route.name === 'search' ? route.q : '';
    var u = S.user;
    var userLabel = u ? esc((u.name || u.phone || u.email || '').split(' ')[0]) : '';
    return '<header class="topbar">' +
      '<a class="topnav__brand" href="#/" aria-label="Bharat Pro Expert home"><img src="icons/logo.png" alt="Logo" class="topnav__logo-img">' + esc(D.brand.name) + '</a>' +
      '<button type="button" class="topbar__loc" data-act="city" aria-label="' + esc(t('chooseCity')) + '">📍 ' + esc(S.city) + ' ▾</button>' +
      '<form class="topbar__search" data-form="search" role="search" style="position:relative" autocomplete="off">' +
        '<input class="input" type="search" name="q" id="q" value="' + esc(q) + '" placeholder="' + esc(t('search')) + '" aria-label="' + esc(t('search')) + '" autocomplete="off">' +
        '<div id="sugg" hidden></div>' +
      '</form>' +
      '<nav class="topnav" aria-label="Main">' +
        [['#/', 'home'], ['#/services', 'services'], ['#/bookings', 'bookings'], ['#/cart', 'cart'], ['#/help', 'help']].map(function (l) {
          return '<a href="' + l[0] + '"' + (route.nav === l[1] || (l[1] === 'help' && route.name === 'help') ? ' class="is-active" aria-current="page"' : '') + '>' + esc(t(l[1])) + (l[1] === 'cart' && cartCount() ? ' (' + cartCount() + ')' : '') + '</a>';
        }).join('') +
      '</nav>' +
      '<button type="button" class="btn btn--ghost btn--sm" data-act="lang" aria-label="' + esc(t('lang')) + '">' + (isHi() ? 'EN' : 'हिं') + '</button>' +
      '<button type="button" class="btn btn--ghost btn--sm" data-act="theme" aria-label="' + esc(t('dark')) + '">' + (isDark() ? '☀️' : '🌙') + '</button>' +
      (u ? '<a class="topbar__login btn btn--sm" href="#/account" aria-label="' + esc(t('account')) + '">👤 ' + userLabel + '</a>'
         : '<a class="topbar__login btn btn--primary btn--sm" href="#/login">' + esc(t('login')) + '</a>') +
    '</header>';
  }
  function tabbar(route) {
    if (route.name === 'admin') return '';
    var n = cartCount();
    var items = [['#/', 'home', '🏠'], ['#/services', 'services', '🛠️'], ['#/bookings', 'bookings', '📋'], ['#/cart', 'cart', '🛒'], ['#/account', 'account', '👤']];
    return '<nav class="tabbar" aria-label="Primary">' + items.map(function (it) {
      var on = route.nav === it[1];
      return '<a class="tabbar__item' + (on ? ' is-active' : '') + '" href="' + it[0] + '"' + (on ? ' aria-current="page"' : '') + ' aria-label="' + esc(t(it[1])) + '"><span aria-hidden="true">' + it[2] + '</span><span>' + esc(t(it[1])) + '</span>' +
        (it[1] === 'cart' && n ? '<span class="tabbar__badge">' + n + '</span>' : '') + '</a>';
    }).join('') + '</nav>';
  }
  function cartBar(route) {
    if (route.name === 'admin') return '';
    var n = cartCount();
    if (!n || ['cart', 'checkout', 'detail', 'booking'].indexOf(route.name) >= 0) return '';
    return '<div class="detail__bar cartbar"><div><strong>' + n + ' ' + esc(t(n === 1 ? 'item' : 'items')) + '</strong> · ' + inr(calc().total) + '</div><a class="btn btn--primary btn--sm" href="#/cart">' + esc(t('viewCart')) + '</a></div>';
  }

  /* ---------- pages ---------- */
  function viewHome() {
    var slides = D.heroSlides || [];
    var h = '<section class="hero" aria-roledescription="carousel" aria-label="Offers" style="overflow:hidden;position:relative">' +
      '<div class="hero__track" style="display:flex;transition:transform .5s cubic-bezier(.2,.8,.2,1);transform:translateX(-' + (heroIdx * 100) + '%)">' + slides.map(function (s, i) {
        return '<div class="hero__slide" style="flex:0 0 100%;' + gradient(s) + '" role="group" aria-label="' + (i + 1) + ' / ' + slides.length + '">' +
          '<div><h2>' + esc(s.title) + '</h2><p>' + esc(s.sub) + '</p><a class="btn btn--sm" href="#/c/' + esc(s.cat) + '">' + esc(s.cta) + '</a></div>' +
          '<span aria-hidden="true" style="font-size:64px">' + esc(s.emoji) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="hero__dots">' + slides.map(function (s, i) {
        return '<button type="button" class="hero__dot' + (i === heroIdx ? ' is-active' : '') + '" data-act="slide" data-i="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>';
      }).join('') + '</div></section>';

    h += '<nav class="catrow" aria-label="Categories">' + D.categories.map(function (c) {
      return '<a class="catrow__item" href="#/c/' + esc(c.id) + '"><span class="catrow__icon" style="' + gradient(c) + '" aria-hidden="true">' + esc(c.emoji) + '</span><span class="catrow__label">' + esc(nm(c)) + '</span></a>';
    }).join('') + '</nav>';

    var p = D.promo || {};
    h += '<section class="promo"><div><h2 class="promo__title">' + esc(p.title) + '</h2><p class="promo__sub">' + esc(p.sub) + '</p></div>' +
      '<button type="button" class="promo__btn" data-act="promo" data-code="' + esc(p.code) + '">' + esc(p.cta) + '</button></section>';

    D.sections.forEach(function (sec) {
      var list = D.services.filter(function (s) { return s.cat === sec.cat; }).slice(0, 6);
      if (!list.length) return;
      h += '<section class="section">' + sectionHead(ttl(sec), '#/c/' + sec.cat) + '<div class="grid">' + list.map(card).join('') + '</div></section>';
    });

    function rows(arr) {
      return '<div class="list">' + arr.map(function (x) {
        return '<div class="list__row"><span aria-hidden="true" style="font-size:28px">' + esc(x.emoji) + '</span><div><strong>' + esc(x.title) + '</strong><div class="card__meta">' + esc(x.sub) + '</div></div></div>';
      }).join('') + '</div>';
    }
    h += '<section class="section">' + sectionHead(t('howItWorks')) + rows(D.howItWorks || []) + '</section>';
    h += '<section class="section">' + sectionHead(t('whyUs')) + rows(D.trust || []) + '</section>';
    h += '<section class="section">' + sectionHead(t('loved')) + '<div class="list">' + (D.testimonials || []).map(function (x) {
      return '<div class="list__row"><div>' + stars(x.rating) + '<p>“' + esc(x.text) + '”</p><div class="card__meta"><strong>' + esc(x.name) + '</strong> · ' + esc(x.city) + '</div></div></div>';
    }).join('') + '</div></section>';
    return h + footer();
  }

  function footer() {
    return '<footer class="site-footer">' +
      '<div class="footer-brand">' +
        '<div class="brand-logo"><img src="icons/logo.png" alt="Bharat Pro Expert Logo" class="brand-logo__img"></div>' +
        '<div class="brand-text-container">' +
          '<span class="brand-title">Bharat Pro Expert Home services</span>' +
          '<span class="brand-subtitle">Expert Home services</span>' +
        '</div>' +
      '</div>' +
      '<div class="footer-grid">' +
        '<div class="footer-column">' +
          '<h4 class="footer-heading">Company</h4>' +
          '<ul class="footer-links">' +
            '<li><a href="#">About us</a></li>' +
            '<li><a href="#">Investor Relations</a></li>' +
            '<li><a href="#">Terms &amp; conditions</a></li>' +
            '<li><a href="#">Privacy policy</a></li>' +
            '<li><a href="#">Anti-discrimination policy</a></li>' +
            '<li><a href="#">Careers</a></li>' +
            '<li><a href="#/admin">🔒 Admin Panel</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="footer-column">' +
          '<h4 class="footer-heading">For customers</h4>' +
          '<ul class="footer-links">' +
            '<li><a href="#">Bharat Pro Expert reviews</a></li>' +
            '<li><a href="#">Categories near you</a></li>' +
            '<li><a href="#">Contact us</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="footer-column">' +
          '<h4 class="footer-heading">For professionals</h4>' +
          '<ul class="footer-links">' +
            '<li><a href="#">Register as a professional</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="footer-column">' +
          '<h4 class="footer-heading">Social links</h4>' +
          '<div class="social-icons">' +
            '<a href="#" class="social-icon" aria-label="X / Twitter"><span style="font-size:14px;font-weight:700">✕</span></a>' +
            '<a href="#" class="social-icon" aria-label="Facebook"><span style="font-size:14px;font-weight:700">f</span></a>' +
            '<a href="#" class="social-icon" aria-label="Instagram"><span style="font-size:14px;font-weight:700">📷</span></a>' +
            '<a href="#" class="social-icon" aria-label="LinkedIn"><span style="font-size:14px;font-weight:700">in</span></a>' +
          '</div>' +
          '<div class="app-buttons">' +
            '<a href="#" class="app-btn">' +
              '<span style="font-size:20px;line-height:1"></span>' +
              '<div class="app-btn-text">' +
                '<span class="app-btn-sub">Download on the</span>' +
                '<span class="app-btn-main">App Store</span>' +
              '</div>' +
            '</a>' +
            '<a href="#" class="app-btn">' +
              '<span style="font-size:18px;line-height:1">▶</span>' +
              '<div class="app-btn-text">' +
                '<span class="app-btn-sub">GET IT ON</span>' +
                '<span class="app-btn-main">Google Play</span>' +
              '</div>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<hr class="footer-divider">' +
      '<p class="footer-bottom-text disclaimer">* As on December 31, 2021</p>' +
      '<p class="footer-bottom-text">' +
        '© Copyright 2021 Bharat Pro Expert Home Services Limited (formerly known as Bharat Pro Expert Technologies India Limited) All rights reserved. | CIN: L74140DL2014PLC274413' +
      '</p>' +
    '</footer>';
  }

  function viewServices() {
    return backBar(t('allServices')) + '<div class="grid">' + D.categories.map(function (c) {
      var n = D.services.filter(function (s) { return s.cat === c.id; }).length;
      return '<article class="card" data-go="#/c/' + esc(c.id) + '" tabindex="0" role="link" aria-label="' + esc(nm(c)) + '"><div class="card__img" style="' + gradient(c) + '"><span aria-hidden="true" style="font-size:44px">' + esc(c.emoji) + '</span></div><h3 class="card__name">' + esc(nm(c)) + '</h3><div class="card__meta">' + esc(c.blurb) + ' · ' + n + '</div></article>';
    }).join('') + '</div>';
  }

  function viewCategory(id) {
    var c = catMap[id]; if (!c) return viewNotFound();
    var list = D.services.filter(function (s) { return s.cat === id; });
    if (S.sort === 'price') list.sort(function (a, b) { return a.price - b.price; });
    else if (S.sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating; });
    var sorts = [['popular', 'popular'], ['price', 'priceLow'], ['rating', 'topRated']];
    return backBar(nm(c), '#/services') +
      '<div class="detail__hero" style="' + gradient(c) + '"><span aria-hidden="true" style="font-size:56px">' + esc(c.emoji) + '</span><p>' + esc(c.blurb) + '</p></div>' +
      '<div class="chips" role="group" aria-label="' + esc(t('sort')) + '">' + sorts.map(function (s) {
        return '<button type="button" class="chip' + (S.sort === s[0] ? ' is-active' : '') + '" data-act="sort" data-v="' + s[0] + '" aria-pressed="' + (S.sort === s[0]) + '">' + esc(t(s[1])) + '</button>';
      }).join('') + '</div><div class="grid">' + list.map(card).join('') + '</div>';
  }

  function viewDetail(id) {
    var s = svc(id); if (!s) return viewNotFound();
    var c = cat(s.cat), q = qtyOf(id);
    var off = s.mrp > s.price ? Math.round((1 - s.price / s.mrp) * 100) : 0;
    return backBar(nm(c), '#/c/' + s.cat) +
      '<div class="detail__hero" style="' + gradient(c) + '"><span aria-hidden="true" style="font-size:72px">' + esc(s.emoji) + '</span>' + (s.tag ? '<span class="card__tag">' + esc(s.tag) + '</span>' : '') + '</div>' +
      '<h1 class="detail__title">' + esc(nm(s)) + '</h1>' +
      '<div class="card__meta">' + stars(s.rating) + ' (' + esc(s.reviews) + ' ' + esc(t('reviews')) + ') · ' + esc(s.duration) + ' ' + esc(t('min')) + '</div>' +
      '<div class="detail__price"><span class="card__price">' + inr(s.price) + '</span> ' + (off ? '<s class="card__mrp">' + inr(s.mrp) + '</s> <span class="badge">' + off + '% OFF</span>' : '') + '</div>' +
      '<div class="detail__block"><p>' + esc(s.desc) + '</p></div>' +
      ((s.includes || []).length ? '<div class="detail__block"><h2>' + esc(t('includes')) + '</h2><ul class="checklist">' + s.includes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') +
      ((s.excludes || []).length ? '<div class="detail__block"><h2>' + esc(t('excludes')) + '</h2><ul class="checklist checklist--no">' + s.excludes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') +
      ((s.faqs || []).length ? '<div class="detail__block"><h2>' + esc(t('faqs')) + '</h2>' + faqList(s.faqs, 'sf') + '</div>' : '') +
      '<div class="detail__bar"><div><strong>' + inr(s.price) + '</strong></div>' +
      (q ? stepper(id, q, 'card__qty') + '<a class="btn btn--primary" href="#/cart">' + esc(t('goCart')) + '</a>'
         : '<button type="button" class="btn btn--primary" data-act="add" data-id="' + esc(id) + '">' + esc(t('add')) + '</button>') + '</div>';
  }

  function faqList(list, pfx) {
    return list.map(function (f, i) {
      var id = pfx + i;
      return '<div class="faq"><button type="button" class="faq__q" data-act="faq" aria-expanded="false" aria-controls="' + id + '">' + esc(f.q) + '</button><div class="faq__a" id="' + id + '" hidden>' + esc(f.a) + '</div></div>';
    }).join('');
  }

  function viewSearch(q) {
    var res = searchServices(q, 60), n = String(q || '').trim();
    return backBar(n ? t('results') + ' “' + n + '”' : t('search')) +
      (res.length ? '<div class="grid">' + res.map(card).join('') + '</div>'
        : emptyState('🔍', t('noResults'), t('noResultsSub'), '#/services', t('browse')));
  }
  // Match on name, Hindi name and category (en/hi), plus description as a weak signal.
  function searchServices(q, limit) {
    q = String(q || '').trim().toLowerCase(); if (!q) return [];
    var out = D.services.filter(function (s) {
      var c = cat(s.cat);
      return [s.name, s.nameHi, c.name, c.nameHi].some(function (x) { return x && String(x).toLowerCase().indexOf(q) >= 0; });
    });
    return out.slice(0, limit || 8);
  }
  function renderSuggestions(q) {
    var box = $('#sugg'); if (!box) return;
    q = String(q || '').trim();
    if (!q) { box.hidden = true; box.innerHTML = ''; return; }
    var svcs = searchServices(q, 5);
    var cats = D.categories.filter(function (c) { return (c.name + ' ' + (c.nameHi || '')).toLowerCase().indexOf(q.toLowerCase()) >= 0; }).slice(0, 2);
    var h = cats.map(function (c) {
      return '<button type="button" class="list__row" data-go="#/c/' + esc(c.id) + '" role="option">' + esc(c.emoji) + ' ' + esc(nm(c)) + ' <small>' + esc(t('services')) + '</small></button>';
    }).join('') + svcs.map(function (s) {
      return '<button type="button" class="list__row" data-go="#/s/' + esc(s.id) + '" role="option">' + esc(s.emoji) + ' ' + esc(nm(s)) + ' <small>' + inr(s.price) + '</small></button>';
    }).join('') + '<button type="button" class="list__row" data-go="#/search?q=' + enc(q) + '" role="option">🔍 ' + esc(t('searchFor')) + ' “' + esc(q) + '”</button>';
    box.className = 'list';
    box.setAttribute('role', 'listbox');
    box.style.cssText = 'position:absolute;left:0;right:0;top:100%;z-index:80;max-height:60vh;overflow:auto;background:var(--card);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.2);margin-top:6px';
    box.innerHTML = h; box.hidden = false;
  }

  function viewCart() {
    if (!S.cart.length) return backBar(t('cart')) + emptyState('🛒', t('emptyCart'), t('emptyCartSub'), '#/services', t('browse'));
    var c = calc();
    var h = backBar(t('cart')) + '<div class="list">' + S.cart.map(function (l) {
      var s = svc(l.id); if (!s) return '';
      return '<div class="list__row"><span aria-hidden="true" style="font-size:28px">' + esc(s.emoji) + '</span><div><a href="#/s/' + esc(s.id) + '"><strong>' + esc(nm(s)) + '</strong></a><div class="card__meta">' + inr(s.price) + ' × ' + l.qty + ' = ' + inr(s.price * l.qty) + '</div></div>' + stepper(s.id, l.qty, 'card__qty') + '</div>';
    }).join('') + '</div>';
    // coupon block
    h += '<div class="detail__block"><h2>' + esc(t('coupon')) + '</h2>';
    if (S.coupon) {
      h += '<div class="list__row"><span class="badge">' + esc(S.coupon) + '</span><span>' + esc(c.couponErr ? t(c.couponErr) : t('couponOn') + ' −' + inr(c.discount)) + '</span><button type="button" class="btn btn--ghost btn--sm" data-act="coupon-remove">' + esc(t('remove')) + '</button></div>';
    } else {
      h += '<form class="field" data-form="coupon"><label class="field__label" for="cpn">' + esc(t('coupon')) + '</label><div style="display:flex;gap:8px"><input class="input" id="cpn" name="code" autocapitalize="characters" placeholder="FIRST100" autocomplete="off"><button class="btn btn--primary" type="submit">' + esc(t('apply')) + '</button></div></form>' +
        '<div class="chips">' + (D.coupons || []).map(function (cp) {
          return '<button type="button" class="chip" data-act="coupon-pick" data-code="' + esc(cp.code) + '">' + esc(cp.code) + (cp.label ? ' · ' + esc(cp.label) : '') + '</button>';
        }).join('') + '</div>';
    }
    h += '</div>' + summary(c) +
      '<div class="detail__bar"><div><strong>' + inr(c.total) + '</strong></div><a class="btn btn--primary" href="#/checkout">' + esc(t('checkout')) + '</a></div>';
    return h;
  }
  function summary(c) {
    return '<div class="summary"><div class="summary__row"><span>' + esc(t('subtotal')) + '</span><span>' + inr(c.subtotal) + '</span></div>' +
      (c.discount ? '<div class="summary__row"><span>' + esc(t('discount')) + '</span><span>−' + inr(c.discount) + '</span></div>' : '') +
      '<div class="summary__row"><span>' + esc(t('fee')) + '</span><span>' + (c.fee ? inr(c.fee) : '<strong>' + esc(t('free')) + '</strong>') + '</span></div>' +
      '<div class="summary__row summary__total"><span>' + esc(t('total')) + '</span><span>' + inr(c.total) + '</span></div>' +
      '<small>' + esc(t('feeNote')) + '</small></div>';
  }

  /* form field builder bound to a draft model path like "co.name" */
  function getModel(path) { var p = path.split('.'); return (drafts[p[0]] || {})[p[1]] || ''; }
  function field(label, model, o) {
    o = o || {};
    var id = 'f-' + model.replace('.', '-'), err = drafts.errs[model];
    var ctrl;
    if (o.options) {
      ctrl = '<select class="input" id="' + id + '" data-model="' + model + '"' + (err ? ' aria-invalid="true"' : '') + '>' + o.options.map(function (op) {
        return '<option value="' + esc(op.v) + '"' + (getModel(model) === op.v ? ' selected' : '') + '>' + esc(op.l) + '</option>';
      }).join('') + '</select>';
    } else {
      ctrl = '<input class="input" id="' + id + '" data-model="' + model + '" type="' + (o.type || 'text') + '" value="' + esc(getModel(model)) + '"' +
        (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') +
        (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (err ? ' aria-invalid="true" aria-describedby="' + id + '-err"' : '') + (o.auto ? ' data-autofocus' : '') + '>';
    }
    return '<div class="field"><label class="field__label" for="' + id + '">' + esc(label) + '</label>' + ctrl +
      (err ? '<div class="field__err" id="' + id + '-err" role="alert">' + esc(err) + '</div>' : '') + '</div>';
  }

  function viewCheckout() {
    if (!S.cart.length) return backBar(t('checkout'), '#/cart') + emptyState('🛒', t('emptyCart'), t('emptyCartSub'), '#/services', t('browse'));
    // Login gating happens here only.
    if (!S.user) {
      return backBar(t('checkout'), '#/cart') + '<div class="empty"><div aria-hidden="true" style="font-size:48px">🔒</div><h2>' + esc(t('loginTitle')) + '</h2><p>' + esc(t('loginReq')) + '</p><button type="button" class="btn btn--primary" data-act="login">' + esc(t('login')) + '</button></div>';
    }
    var co = drafts.co;
    if (co.name == null) co.name = S.user.name || '';
    if (co.phone == null) co.phone = S.user.phone || '';
    if (!co.date) co.date = dateChips()[0].iso;
    if (!co.pay) co.pay = 'cod';
    var c = calc();
    return backBar(t('checkout'), '#/cart') +
      '<form class="detail__block" data-form="checkout" novalidate><h2>' + esc(t('address')) + '</h2>' +
      field(t('name'), 'co.name', { ac: 'name' }) + field(t('phone'), 'co.phone', { type: 'tel', inputmode: 'numeric', max: 10, ac: 'tel-national' }) +
      field(t('house'), 'co.house', { ac: 'address-line1' }) + field(t('area'), 'co.area', { ac: 'address-line2' }) +
      field(t('pincode'), 'co.pincode', { inputmode: 'numeric', max: 6, ac: 'postal-code' }) + field(t('landmark'), 'co.landmark') +
      '<h2>' + esc(t('pickDate')) + ' / ' + esc(t('pickSlot')) + '</h2>' + chipsHtml(co.date, co.slot, 'co-date', 'co-slot') +
      (drafts.errs['co.slot'] ? '<div class="field__err" role="alert">' + esc(drafts.errs['co.slot']) + '</div>' : '') +
      '<h2>' + esc(t('payment')) + '</h2><div class="chips" role="radiogroup" aria-label="' + esc(t('payment')) + '">' +
      [['cod', t('cod')], ['upi', t('upi')]].map(function (p) {
        return '<button type="button" class="chip' + (co.pay === p[0] ? ' is-active' : '') + '" role="radio" aria-checked="' + (co.pay === p[0]) + '" data-act="co-pay" data-v="' + p[0] + '">' + esc(p[1]) + '</button>';
      }).join('') + '</div>' + summary(c) +
      '<button type="submit" class="btn btn--primary btn--block">' + esc(t('placeOrder')) + ' · ' + inr(c.total) + '</button></form>';
  }

  function validateCheckout() {
    var co = drafts.co, e = {};
    if (!String(co.name || '').trim()) e['co.name'] = t('errName');
    if (!/^[6-9]\d{9}$/.test(String(co.phone || '').trim())) e['co.phone'] = t('errPhone');
    if (!String(co.house || '').trim()) e['co.house'] = t('errHouse');
    if (!String(co.area || '').trim()) e['co.area'] = t('errArea');
    if (!/^\d{6}$/.test(String(co.pincode || '').trim())) e['co.pincode'] = t('errPin');
    if (!co.date || !co.slot || slotPast(co.slot, co.date)) e['co.slot'] = t('errSlot');
    drafts.errs = e;
    return Object.keys(e).length === 0;
  }
  function placeOrder() {
    var co = drafts.co, c = calc();
    var id;
    do { id = 'BPE' + ('' + Math.floor(Math.random() * 1000000)).padStart(6, '0'); } while (getBooking(id));
    var b = {
      id: id, created: Date.now(), cancelled: false, date: co.date, slot: co.slot, pay: co.pay,
      items: S.cart.map(function (l) { var s = svc(l.id) || {}; return { id: l.id, name: s.name || l.id, nameHi: s.nameHi, emoji: s.emoji, price: s.price || 0, qty: l.qty }; }),
      pricing: c, coupon: S.coupon && !c.couponErr ? S.coupon : null,
      address: { name: co.name.trim(), phone: co.phone.trim(), house: co.house.trim(), area: co.area.trim(), pincode: co.pincode.trim(), landmark: (co.landmark || '').trim(), city: S.city }
    };
    S.bookings.unshift(b); persistBookings();
    S.cart = []; S.coupon = null; persistCart(); save('bpe_coupon', null);
    if (S.user && !S.user.name) { S.user.name = b.address.name; save('bpe_user', S.user); }
    drafts.co = {}; drafts.errs = {};
    toast(t('orderPlaced'));
    location.hash = '#/booking/' + id;
  }

  function timeline(b) {
    var st = stageOf(b);
    if (st < 0) return '<div class="badge" role="status">' + esc(t('cancelled')) + '</div>';
    return '<ol class="timeline" aria-label="Status">' + t('status').map(function (lbl, i) {
      return '<li class="timeline__step' + (i <= st ? ' is-done' : '') + '"' + (i === st ? ' aria-current="step"' : '') + '>' + esc(lbl) + '</li>';
    }).join('') + '</ol>';
  }
  function bookingItems(b) {
    return '<div class="list">' + b.items.map(function (i) {
      return '<div class="list__row"><span aria-hidden="true">' + esc(i.emoji || '') + '</span><div>' + esc(isHi() && i.nameHi ? i.nameHi : i.name) + ' × ' + esc(i.qty) + '</div><strong>' + inr(i.price * i.qty) + '</strong></div>';
    }).join('') + '</div>';
  }
  function bookingActions(b) {
    var st = stageOf(b); if (st < 0 || st >= 3) return '';
    return '<div class="chips"><button type="button" class="btn btn--sm" data-act="resched" data-id="' + esc(b.id) + '">' + esc(t('reschedule')) + '</button>' +
      (st < 2 ? '<button type="button" class="btn btn--ghost btn--sm" data-act="cancel" data-id="' + esc(b.id) + '">' + esc(t('cancel')) + '</button>' : '') + '</div>';
  }
  function viewBookingPage(id) {
    var b = getBooking(id); if (!b) return viewNotFound();
    var a = b.address;
    return '<div class="empty"><div aria-hidden="true" style="font-size:48px">' + (b.cancelled ? '❌' : '🎉') + '</div><h1>' + esc(b.cancelled ? t('cancelled') : t('thanks')) + '</h1><p>' + esc(t('thanksSub')) + '</p></div>' +
      '<div class="detail__block"><p>' + esc(t('bookingId')) + ': <strong>' + esc(b.id) + '</strong></p><p>📅 ' + fmtDate(b.date) + ', ' + esc(b.slot) + '</p>' +
      '<p>📍 ' + esc(a.house + ', ' + a.area + (a.landmark ? ' (' + a.landmark + ')' : '') + ', ' + a.city + ' ' + a.pincode) + '</p><p>📞 ' + esc(a.name) + ', ' + esc(a.phone) + '</p></div>' +
      timeline(b) + bookingItems(b) + summary(b.pricing) + bookingActions(b) +
      '<a class="btn btn--ghost btn--block" href="#/bookings">' + esc(t('myBookings')) + '</a>';
  }
  function viewBookings() {
    if (!S.bookings.length) return backBar(t('bookings')) + emptyState('📋', t('noBookings'), t('noBookingsSub'), '#/services', t('browse'));
    return backBar(t('bookings')) + S.bookings.map(function (b) {
      var st = stageOf(b);
      return '<article class="detail__block"><div class="section__head"><strong>' + esc(b.id) + '</strong><span class="badge">' + esc(st < 0 ? t('cancelled') : t('status')[st]) + '</span></div>' +
        '<p>📅 ' + fmtDate(b.date) + ', ' + esc(b.slot) + ' · ' + inr(b.pricing.total) + '</p>' + bookingItems(b) +
        '<div class="chips"><a class="btn btn--ghost btn--sm" href="#/booking/' + esc(b.id) + '">' + esc(t('details')) + '</a></div>' + bookingActions(b) + '</article>';
    }).join('');
  }

  function viewLoginPage() {
    if (S.user) {
      location.hash = '#/account';
      return '';
    }
    return backBar(t('loginTitle'), '#/') +
      '<div class="login-card-wrapper">' +
        renderLoginCardBody() +
      '</div>';
  }

  function renderGoogleSvg() {
    return '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>';
  }

  function renderLoginCardBody() {
    var L = drafts.login;
    var step = L.step || 'phone';
    var nameVal = L.name || '';

    var h = '<div class="auth-card">' +
      '<div class="auth-card__header">' +
        '<div class="auth-card__logo-badge"><img src="icons/logo.png" alt="Bharat Pro Expert Logo" class="auth-card__logo-img"></div>' +
        '<h2>' + esc(t('loginTitle')) + '</h2>' +
        '<p>' + esc(t('loginSub')) + '</p>' +
      '</div>';

    if (drafts.loginNotice) {
      h += '<div class="notice notice--warning" style="margin-bottom:14px;padding:10px 12px;background:#FFF3CD;color:#664D03;border:1px solid #FFECB5;border-radius:8px;font-size:13px;line-height:1.4">' +
        '⚠️ <span>' + esc(drafts.loginNotice) + '</span>' +
      '</div>';
    }

    // Google Sign-In Button
    h += '<button type="button" class="btn-google' + (isGoogleLoginInProgress ? ' is-loading' : '') + '" data-act="google-login"' + (isGoogleLoginInProgress ? ' disabled' : '') + '>' +
      renderGoogleSvg() +
      '<span>' + esc(isGoogleLoginInProgress ? 'Connecting Google...' : t('googleLogin')) + '</span>' +
    '</button>';

    h += '<div class="auth-divider"><span>' + esc(t('orDivider')) + '</span></div>';

    if (step === 'otp') {
      h += '<form data-form="login-otp" novalidate class="auth-form-animated">' +
        '<div class="phone-display-badge">' +
          '<span>📱 +91 ' + esc(L.phone) + '</span>' +
          '<button type="button" class="btn-link" data-act="edit-phone">' + esc(t('editPhone')) + '</button>' +
        '</div>' +
        field(t('otp'), 'login.otp', { inputmode: 'numeric', max: 6, ac: 'one-time-code', auto: true, ph: '• • • • • •' }) +
        '<p class="card__meta" style="margin-bottom:12px;text-align:center">' + esc(t('otpHint')) + '</p>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
          '<button type="button" class="btn btn--ghost btn--sm" data-act="resend-otp">' + esc(t('resendOtp')) + '</button>' +
        '</div>' +
        '<button type="submit" class="btn btn--primary btn--block btn--animated">' + esc(t('verify')) + '</button>' +
      '</form>';
    } else {
      h += '<form data-form="login-phone" novalidate class="auth-form-animated">' +
        field(t('enterName'), 'login.name', { ac: 'name', ph: 'e.g. Rahul Sharma', value: nameVal }) +
        field(t('phone'), 'login.phone', { type: 'tel', inputmode: 'numeric', max: 10, ac: 'tel-national', auto: true, ph: '9876543210' }) +
        '<button type="submit" class="btn btn--primary btn--block btn--animated" style="margin-top:12px">' + esc(t('sendOtp')) + '</button>' +
      '</form>';
    }

    h += '</div>';
    return h;
  }

  function viewAccount() {
    var u = S.user;
    var userAvatar = u && u.email ? '🌐' : '👤';
    var userSub = u ? (u.phone ? '+91 ' + u.phone : (u.email || '')) : t('loginSub');
    var h = backBar(t('account')) + '<div class="list"><div class="list__row"><span aria-hidden="true" style="font-size:32px">' + userAvatar + '</span><div><strong>' + esc(u ? (u.name || t('welcome')) : t('guest')) + '</strong><div class="card__meta">' + esc(userSub) + '</div></div>' +
      (u ? '<button type="button" class="btn btn--ghost btn--sm" data-act="logout">' + esc(t('logout')) + '</button>' : '<a class="btn btn--primary btn--sm" href="#/login">' + esc(t('login')) + '</a>') + '</div>' +
      '<div class="list__row"><span>' + esc(t('lang')) + '</span><div class="chips"><button type="button" class="chip' + (!isHi() ? ' is-active' : '') + '" data-act="setlang" data-v="en" aria-pressed="' + (!isHi()) + '">English</button><button type="button" class="chip' + (isHi() ? ' is-active' : '') + '" data-act="setlang" data-v="hi" aria-pressed="' + isHi() + '">हिन्दी</button></div></div>' +
      '<div class="list__row"><span>' + esc(t('dark')) + '</span><button type="button" class="chip' + (isDark() ? ' is-active' : '') + '" role="switch" aria-checked="' + isDark() + '" data-act="theme">' + (isDark() ? 'ON' : 'OFF') + '</button></div>' +
      '<div class="list__row"><span>' + esc(t('city')) + ': ' + esc(S.city) + '</span><button type="button" class="btn btn--ghost btn--sm" data-act="city">' + esc(t('chooseCity')) + '</button></div>' +
      '<a class="list__row" href="#/bookings">📋 ' + esc(t('myBookings')) + '</a><a class="list__row" href="#/help">❓ ' + esc(t('help')) + '</a><a class="list__row" href="#/partner">🤝 ' + esc(t('partner')) + '</a></div>';
    return h + footer();
  }

  function viewHelp() {
    var tel = String(D.brand.phone).replace(/[^\d+]/g, '');
    return backBar(t('help')) + '<div class="detail__block"><h2>' + esc(t('contact')) + '</h2><div class="chips">' +
      '<a class="btn btn--primary" href="tel:' + esc(tel) + '">📞 ' + esc(t('call')) + '</a>' +
      '<a class="btn" href="mailto:' + esc(D.brand.email) + '">✉️ ' + esc(t('email')) + '</a></div></div>' +
      '<div class="detail__block"><h2>' + esc(t('faqs')) + '</h2>' + faqList(D.faqs || [], 'hf') + '</div>' + footer();
  }

  function viewPartner() {
    var done = load('bpe_partner_done', null);
    if (drafts.partner.sent) {
      return backBar(t('partner'), '#/account') + emptyState('🤝', t('partnerDone'), t('partnerDoneSub'), '#/', t('goHome'));
    }
    if (done == null) done = null;
    return backBar(t('partner'), '#/account') + '<form class="detail__block" data-form="partner" novalidate><h2>' + esc(t('partnerTitle')) + '</h2><p>' + esc(t('partnerSub')) + '</p>' +
      field(t('name'), 'partner.name', { ac: 'name' }) + field(t('phone'), 'partner.phone', { type: 'tel', inputmode: 'numeric', max: 10, ac: 'tel-national' }) +
      field(t('city'), 'partner.city', { options: D.cities.map(function (c) { return { v: c, l: c }; }) }) +
      field(t('skill'), 'partner.skill', { options: D.categories.map(function (c) { return { v: c.id, l: nm(c) }; }) }) +
      field(t('experience'), 'partner.exp', { type: 'number', inputmode: 'numeric', max: 2 }) +
      '<button type="submit" class="btn btn--primary btn--block">' + esc(t('submit')) + '</button></form>';
  }

  /* ---------- SUPER ADMIN PANEL STATE & FUNCTIONS ---------- */
  var ADMIN_PASS = 'bharatproexperthomeservices@9319953137';
  var LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout on 1 failed attempt
  var adminCaptchaCode = '';

  function generateCaptcha() {
    var chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    var code = '';
    for (var i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    adminCaptchaCode = code;
    return code;
  }

  function isAdminLoggedIn() {
    return load('bpe_admin_auth', false) === true;
  }

  function getAdminLockoutUntil() {
    var until = load('bpe_admin_lockout', 0);
    return typeof until === 'number' ? until : 0;
  }

  function viewAdminLogin() {
    if (isAdminLoggedIn()) {
      location.hash = '#/admin';
      return '';
    }
    if (!adminCaptchaCode) {
      generateCaptcha();
    }
    var lockoutUntil = getAdminLockoutUntil();
    var now = Date.now();
    var isLocked = lockoutUntil > now;
    var remainingMinutes = isLocked ? Math.ceil((lockoutUntil - now) / 60000) : 0;

    return backBar('Super Admin Login', '#/') +
      '<div class="detail__block" style="max-width:440px;margin:24px auto">' +
        '<h2>🔒 Super Admin Authentication</h2>' +
        '<p style="color:var(--text-sub);margin-bottom:16px">Enter Super Admin Password and Security Capture Code to access system settings.</p>' +
        (isLocked
          ? '<div style="background:#FF3B301A;border:1px solid #FF3B30;border-radius:8px;padding:12px;margin-bottom:16px;color:#FF3B30;font-size:14px;font-weight:600">' +
              '⛔ High Security Lockout Active! 1 failed login attempt detected. Login is locked for 15 minutes. Please try again in ' + remainingMinutes + ' minute(s).' +
            '</div>'
          : '') +
        '<form data-form="admin-login" novalidate>' +
          field('Admin Password', 'admin.pass', { type: 'password', ph: 'Enter Admin Password', auto: true, ac: 'current-password' }) +
          '<div style="margin-bottom:16px">' +
            '<label class="field__label">Security Capture Code</label>' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
              '<div style="background:var(--bg-sub, #f0f0f0);border:2px dashed var(--primary, #007AFF);padding:10px 18px;font-family:monospace;font-size:22px;font-weight:bold;letter-spacing:6px;user-select:none;border-radius:8px;color:var(--text, #000)">' + esc(adminCaptchaCode) + '</div>' +
              '<button type="button" class="btn btn--ghost btn--sm" data-act="refresh-captcha" title="Refresh CAPTCHA">🔄 Refresh</button>' +
            '</div>' +
          '</div>' +
          field('Enter Capture Code', 'admin.captcha', { ph: 'Enter CAPTCHA Code', ac: 'off' }) +
          '<button type="submit" class="btn btn--primary btn--block"' + (isLocked ? ' disabled style="opacity:0.6;cursor:not-allowed"' : '') + '>Login to Super Admin Panel</button>' +
        '</form>' +
      '</div>';
  }

  function viewAdminDashboard() {
    if (!isAdminLoggedIn()) {
      location.hash = '#/admin';
      return '';
    }

    var h = '<div class="admin-shell">' +
      '<header class="admin-header">' +
        '<h1 class="admin-title">👑 Bharat Pro Expert — Super Admin Panel</h1>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-act="admin-logout">Logout Admin</button>' +
      '</header>' +
      '<div class="admin-body">' +
        '<aside class="admin-sidebar" aria-label="Admin Navigation">' +
          '<nav class="admin-nav">' +
            '<a href="#/admin" class="admin-nav__item is-active">📊 Dashboard</a>' +
          '</nav>' +
        '</aside>' +
        '<main class="admin-content">' +
          '<div class="empty" style="padding:40px 20px">' +
            '<div aria-hidden="true" style="font-size:48px;margin-bottom:12px">📦</div>' +
            '<h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Admin Panel is empty. No modules active.</h2>' +
            '<p style="color:var(--text-sub);max-width:400px;margin:0 auto">Currently no administrative modules are active or loaded.</p>' +
          '</div>' +
        '</main>' +
      '</div>' +
    '</div>';

    return h;
  }

  function viewAdminRouter() {
    if (!isAdminLoggedIn()) {
      return viewAdminLogin();
    }
    return viewAdminDashboard();
  }

  function viewNotFound() {
    return emptyState('🧭', t('notFound'), t('notFoundSub'), '#/', t('goHome'));
  }

  /* ---------- sheets ---------- */
  function openSheet(kind, data) { S.sheet = { kind: kind, data: data || {} }; renderSheet(); }
  function closeSheet() { S.sheet = null; renderSheet(); }
  function renderSheet() {
    var box = $('#sheet-root'), sh = S.sheet;
    if (!sh) { box.innerHTML = ''; return; }
    var d = sh.data, body = '', label = '';
    if (sh.kind === 'city') {
      label = t('chooseCity');
      body = '<h2>' + esc(label) + '</h2><div class="list">' + D.cities.map(function (c) {
        return '<button type="button" class="list__row" data-act="setcity" data-v="' + esc(c) + '">' + (c === S.city ? '✅ ' : '📍 ') + esc(c) + '</button>';
      }).join('') + '</div>';
    } else if (sh.kind === 'login') {
      label = t('loginTitle');
      body = renderLoginCardBody();
    } else if (sh.kind === 'resched') {
      label = t('reschedule');
      body = '<h2>' + esc(label) + '</h2>' + chipsHtml(d.date, d.slot, 'rs-date', 'rs-slot') + '<button type="button" class="btn btn--primary btn--block" data-act="rs-save">' + esc(t('save')) + '</button>';
    } else if (sh.kind === 'cancel') {
      label = t('confirmCancel');
      body = '<h2>' + esc(label) + '</h2><div class="chips"><button type="button" class="btn btn--ghost" data-act="close">' + esc(t('keep')) + '</button><button type="button" class="btn btn--primary" data-act="cancel-yes">' + esc(t('yesCancel')) + '</button></div>';
    }
    box.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(label) + '"><div class="sheet__backdrop" data-act="close"></div><div class="sheet__panel"><div class="sheet__grab"></div>' + body +
      '<button type="button" class="btn btn--ghost btn--block" data-act="close">' + esc(t('close')) + '</button></div></div>';
    var af = $('[data-autofocus]', box) || $('.sheet__panel button', box);
    if (af) af.focus();
  }

  /* ---------- theme ---------- */
  function isDark() {
    if (S.theme) return S.theme === 'dark';
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  function applyTheme() {
    var el = document.documentElement;
    if (S.theme) el.setAttribute('data-theme', S.theme); else el.removeAttribute('data-theme');
    var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', isDark() ? '#000000' : '#007AFF');
    el.lang = S.lang === 'hi' ? 'hi' : 'en';
  }

  /* ---------- router + render ---------- */
  function parseRoute() {
    var raw = (location.hash || '#/').slice(1) || '/';
    var qi = raw.indexOf('?'), path = qi >= 0 ? raw.slice(0, qi) : raw;
    var qs = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : '');
    var p = path.split('/').filter(Boolean).map(safeDecode), a = p[0] || '';
    switch (a) {
      case '': return { name: 'home', nav: 'home', title: D.brand.name + ' — Home Services at your doorstep', view: viewHome };
      case 'services': return { name: 'services', nav: 'services', title: t('allServices'), view: viewServices };
      case 'c': return { name: 'category', nav: 'services', title: cat(p[1]).name, view: function () { return viewCategory(p[1]); } };
      case 's': return { name: 'detail', nav: 'services', title: svc(p[1]) ? svc(p[1]).name : '', view: function () { return viewDetail(p[1]); } };
      case 'search': return { name: 'search', nav: 'services', q: qs.get('q') || '', title: t('search'), view: function () { return viewSearch(qs.get('q') || ''); } };
      case 'cart': return { name: 'cart', nav: 'cart', title: t('cart'), view: viewCart };
      case 'checkout': return { name: 'checkout', nav: 'cart', title: t('checkout'), view: viewCheckout };
      case 'bookings': return { name: 'bookings', nav: 'bookings', title: t('bookings'), view: viewBookings };
      case 'booking': return { name: 'booking', nav: 'bookings', title: t('bookingId'), view: function () { return viewBookingPage(p[1]); } };
      case 'account': return { name: 'account', nav: 'account', title: t('account'), view: viewAccount };
      case 'login': return { name: 'login', nav: 'account', title: t('loginTitle'), view: viewLoginPage };
      case 'help': return { name: 'help', nav: 'account', title: t('help'), view: viewHelp };
      case 'partner': return { name: 'partner', nav: 'account', title: t('partner'), view: viewPartner };
      case 'admin': return { name: 'admin', nav: 'account', subRoute: p[1] || 'login', param: p[2] || '', title: 'Super Admin Panel', view: function () { return viewAdminRouter(p[1], p[2], p[3]); } };
      default: return { name: '404', nav: '', title: t('notFound'), view: viewNotFound };
    }
  }

  var current = null;
  function render(keepScroll) {
    var y = window.scrollY, active = document.activeElement, activeModel = active && active.dataset ? active.dataset.model : null;
    current = parseRoute();
    var bodyHtml;
    try { bodyHtml = current.view(); } catch (err) { bodyHtml = viewNotFound(); }
    root.innerHTML = '<div class="app">' + topbar(current) + '<main class="page" id="main"><div class="container">' + bodyHtml + '</div></main>' + cartBar(current) + tabbar(current) + '</div>';
    document.title = (current.name === 'home' ? '' : (current.title ? current.title + ' — ' : '')) + (current.name === 'home' ? current.title : D.brand.name);
    applyTheme();
    window.scrollTo(0, keepScroll ? y : 0);
    if (keepScroll && activeModel) { var again = $('[data-model="' + activeModel + '"]'); if (again) again.focus(); }
    startHero(); startTicker();
    if (current.name === 'checkout' && !S.user && !S.sheet && !suppressGate) { suppressGate = true; openSheet('login', { step: 'phone' }); }
    if (current.name !== 'checkout') suppressGate = false;
  }
  function refresh() { render(true); }

  /* hero carousel: 4s auto-slide, paused while touching */
  function goSlide(i) {
    var n = (D.heroSlides || []).length; if (!n) return;
    heroIdx = (i + n) % n;
    var tr = $('.hero__track'); if (tr) tr.style.transform = 'translateX(-' + heroIdx * 100 + '%)';
    $$('.hero__dot').forEach(function (d, k) { d.classList.toggle('is-active', k === heroIdx); });
  }
  function stopHero() { if (heroTimer) { clearInterval(heroTimer); heroTimer = null; } }
  function startHero() {
    stopHero();
    var tr = $('.hero__track'); if (!tr) return;
    var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
    if (!reduce) heroTimer = setInterval(function () { goSlide(heroIdx + 1); }, 4000);
    var x0 = null;
    tr.addEventListener('touchstart', function (e) { stopHero(); x0 = e.touches[0].clientX; }, { passive: true });
    tr.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) goSlide(heroIdx + (dx < 0 ? 1 : -1));
      startHero();
    }, { passive: true });
  }
  /* simulated status progress: re-render the booking views while a booking is in progress */
  function startTicker() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    if (current.name !== 'booking' && current.name !== 'bookings') return;
    tickTimer = setInterval(function () {
      var live = S.bookings.some(function (b) { var s = stageOf(b); return s >= 0 && s < 3; });
      if (!live || S.sheet) return;
      var sig = S.bookings.map(stageOf).join();
      if (sig !== tickSig) { if (tickSig !== undefined) refresh(); tickSig = sig; }
    }, 3000);
    tickSig = undefined;
  }

  /* ---------- actions (click delegation) ---------- */
  var ACTIONS = {
    add: function (el) { setQty(el.dataset.id, qtyOf(el.dataset.id) + 1); toast(t('added')); refresh(); },
    inc: function (el) { setQty(el.dataset.id, qtyOf(el.dataset.id) + 1); refresh(); },
    dec: function (el) { setQty(el.dataset.id, qtyOf(el.dataset.id) - 1); refresh(); },
    slide: function (el) { stopHero(); goSlide(+el.dataset.i); startHero(); },
    promo: function (el) {
      var c = findCoupon(el.dataset.code);
      if (c) { S.coupon = c.code; save('bpe_coupon', S.coupon); toast(t('copied')); }
      location.hash = '#/services';
    },
    sort: function (el) { S.sort = el.dataset.v; refresh(); },
    faq: function (el) {
      var open = el.getAttribute('aria-expanded') === 'true', a = document.getElementById(el.getAttribute('aria-controls'));
      el.setAttribute('aria-expanded', String(!open)); if (a) a.hidden = open;
      el.parentNode.classList.toggle('is-open', !open);
    },
    'coupon-pick': function (el) { applyCoupon(el.dataset.code); },
    'coupon-remove': function () { S.coupon = null; save('bpe_coupon', null); refresh(); },
    city: function () { openSheet('city'); },
    setcity: function (el) { S.city = el.dataset.v; save('bpe_city', S.city); closeSheet(); refresh(); },
    lang: function () { setLang(isHi() ? 'en' : 'hi'); },
    setlang: function (el) { setLang(el.dataset.v); },
    theme: function () { S.theme = isDark() ? 'light' : 'dark'; save('bpe_theme', S.theme); applyTheme(); refresh(); },
    login: function () { drafts.login = {}; drafts.errs = {}; delete drafts.loginNotice; location.hash = '#/login'; },
    logout: function () {
      firebaseLogout().catch(function () {});
      S.user = null;
      delete drafts.loginNotice;
      save('bpe_user', null);
      toast(t('loggedOut'));
      refresh();
    },
    'google-login': function (btnEl) {
      if (isGoogleLoginInProgress) return;
      isGoogleLoginInProgress = true;
      delete drafts.loginNotice;

      if (btnEl && btnEl.setAttribute) {
        btnEl.setAttribute('disabled', 'disabled');
        btnEl.classList.add('is-loading');
      }
      if (S.sheet) renderSheet(); else refresh();
      toast('Connecting to Google...');

      loginWithGoogle().then(function (res) {
        if (res.success && res.user) {
          isGoogleLoginInProgress = false;
          S.user = res.user;
          save('bpe_user', S.user);
          toast(t('welcome') + ', ' + S.user.name + '!');
          if (S.sheet) closeSheet();
          if (location.hash === '#/login') {
            location.hash = '#/';
          } else {
            refresh();
          }
        } else if (!res.success) {
          isGoogleLoginInProgress = false;
          if (res.error) {
            drafts.loginNotice = res.error;
          }
          toast(res.error || 'Google sign-in failed');
          if (S.sheet) renderSheet(); else refresh();
        }
      }).catch(function (err) {
        isGoogleLoginInProgress = false;
        toast('Google sign-in failed: ' + (err.message || err));
        if (S.sheet) renderSheet(); else refresh();
      });
    },
    'edit-phone': function () {
      drafts.login.step = 'phone';
      if (S.sheet) renderSheet(); else refresh();
    },
    'resend-otp': function () {
      if (!drafts.login || !drafts.login.phone) return;
      toast('Resending OTP...');
      sendPhoneOtp(drafts.login.phone).then(function (res) {
        if (res.success) {
          toast(t('otpSent'));
        } else {
          toast(res.error || 'Failed to resend OTP');
        }
      }).catch(function (err) {
        toast('OTP resend failed: ' + (err.message || err));
      });
    },
    close: function () { closeSheet(); },
    'co-date': function (el) { drafts.co.date = el.dataset.v; if (slotPast(drafts.co.slot, drafts.co.date)) drafts.co.slot = ''; refresh(); },
    'co-slot': function (el) { drafts.co.slot = el.dataset.v; delete drafts.errs['co.slot']; refresh(); },
    'co-pay': function (el) { drafts.co.pay = el.dataset.v; refresh(); },
    resched: function (el) {
      var b = getBooking(el.dataset.id); if (!b) return;
      openSheet('resched', { id: b.id, date: b.date, slot: b.slot });
    },
    'rs-date': function (el) { var d = S.sheet.data; d.date = el.dataset.v; if (slotPast(d.slot, d.date)) d.slot = ''; renderSheet(); },
    'rs-slot': function (el) { S.sheet.data.slot = el.dataset.v; renderSheet(); },
    'rs-save': function () {
      var d = S.sheet.data, b = getBooking(d.id);
      if (!d.date || !d.slot) { toast(t('errSlot')); return; }
      if (b) { b.date = d.date; b.slot = d.slot; persistBookings(); }
      closeSheet(); toast(t('reschedToast')); refresh();
    },
    cancel: function (el) { openSheet('cancel', { id: el.dataset.id }); },
    'cancel-yes': function () {
      var b = getBooking(S.sheet.data.id);
      if (b) { b.cancelled = true; persistBookings(); }
      closeSheet(); toast(t('cancelledToast')); refresh();
    },
    'admin-logout': function () {
      save('bpe_admin_auth', false);
      toast('Logged out of Super Admin Panel');
      location.hash = '#/admin';
    },
    'refresh-captcha': function () {
      generateCaptcha();
      refresh();
    }
  };
  function setLang(l) { S.lang = l; save('bpe_lang', l); applyTheme(); renderSheet(); refresh(); }
  function applyCoupon(code) {
    var c = findCoupon(code);
    if (!c) { toast(t('couponBad')); return; }
    S.coupon = c.code; save('bpe_coupon', S.coupon);
    if (calc().couponErr) toast(t('couponMin')); else toast(t('couponOn'));
    refresh();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a && ACTIONS[a.dataset.act]) { e.preventDefault(); e.stopPropagation(); ACTIONS[a.dataset.act](a); return; }
    var g = e.target.closest('[data-go]');
    if (g) {
      e.preventDefault();
      var sg = $('#sugg'); if (sg) sg.hidden = true;
      if (location.hash === g.dataset.go) refresh(); else location.hash = g.dataset.go;
      return;
    }
    if (!e.target.closest('.topbar__search')) { var s2 = $('#sugg'); if (s2) s2.hidden = true; }
  });
  // Cards are role=link with tabindex: make Enter/Space activate them.
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('article[data-go]')) {
      e.preventDefault(); location.hash = e.target.dataset.go;
    } else if (e.key === 'Escape') {
      if (S.sheet) closeSheet(); else { var sg = $('#sugg'); if (sg) sg.hidden = true; }
    }
  });
  // Draft binding: typed values are stored without re-rendering (keeps focus).
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.model) {
      var p = el.dataset.model.split('.');
      var v = el.value;
      if (/phone|pincode|otp|exp/.test(p[1])) { v = v.replace(/\D/g, ''); if (v !== el.value) el.value = v; }
      if (!drafts[p[0]]) drafts[p[0]] = {};
      drafts[p[0]][p[1]] = v;
      if (drafts.errs[el.dataset.model]) { delete drafts.errs[el.dataset.model]; var er = el.parentNode.querySelector('.field__err'); if (er) er.remove(); el.removeAttribute('aria-invalid'); }
    } else if (el.id === 'q') {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { renderSuggestions(el.value); }, 180); // debounce
    }
  });
  document.addEventListener('focusin', function (e) {
    if (e.target.id === 'q' && e.target.value) renderSuggestions(e.target.value);
  });

  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault();
    var kind = f.dataset.form;
    if (kind === 'search') {
      var q = f.elements.q.value.trim(); if (!q) return;
      var sg = $('#sugg'); if (sg) sg.hidden = true;
      location.hash = '#/search?q=' + enc(q);
    } else if (kind === 'coupon') {
      applyCoupon(f.elements.code.value);
    } else if (kind === 'login-phone') {
      if (!/^[6-9]\d{9}$/.test(drafts.login.phone || '')) {
        drafts.errs['login.phone'] = t('errPhone');
        if (S.sheet) renderSheet(); else refresh();
        return;
      }
      delete drafts.errs['login.phone'];
      toast('Sending OTP via Firebase...');
      sendPhoneOtp(drafts.login.phone).then(function (res) {
        if (res.success) {
          drafts.login.otp = '';
          drafts.login.step = 'otp';
          if (S.sheet) renderSheet(); else refresh();
          toast(t('otpSent'));
        } else {
          toast(res.error || 'Failed to send OTP');
        }
      }).catch(function (err) {
        toast('OTP sending failed: ' + (err.message || err));
      });
    } else if (kind === 'login-otp') {
      if (!/^\d{6}$|^\d{4}$/.test(drafts.login.otp || '')) {
        drafts.errs['login.otp'] = t('errOtp');
        if (S.sheet) renderSheet(); else refresh();
        return;
      }
      toast('Verifying OTP...');
      verifyPhoneOtp(drafts.login.otp).then(function (res) {
        if (res.success) {
          var enteredName = (drafts.login.name || '').trim();
          var prevName = S.user && S.user.phone === drafts.login.phone ? S.user.name : '';
          S.user = Object.assign({}, res.user, {
            name: enteredName || res.user.name || prevName || 'Bharat Pro Customer',
            phone: drafts.login.phone
          });
          save('bpe_user', S.user);
          drafts.login = {}; drafts.errs = {}; drafts.co = {};
          if (S.sheet) closeSheet();
          toast(t('loggedIn'));
          if (current && current.name === 'checkout') refresh();
          else location.hash = '#/account';
        } else {
          drafts.errs['login.otp'] = res.error || t('errOtp');
          if (S.sheet) renderSheet(); else refresh();
          toast(res.error || 'OTP Verification failed');
        }
      }).catch(function (err) {
        toast('Verification error: ' + (err.message || err));
      });
    } else if (kind === 'checkout') {
      if (!S.user) { openSheet('login', { step: 'phone' }); return; }
      if (validateCheckout()) { placeOrder(); return; }
      toast(t('fixErrors')); refresh();
      var bad = $('[aria-invalid="true"]'); if (bad) bad.focus();
    } else if (kind === 'partner') {
      var p = drafts.partner, er = {};
      if (!String(p.name || '').trim()) er['partner.name'] = t('errName');
      if (!/^[6-9]\d{9}$/.test(p.phone || '')) er['partner.phone'] = t('errPhone');
      drafts.errs = er;
      if (Object.keys(er).length) { toast(t('fixErrors')); refresh(); var b2 = $('[aria-invalid="true"]'); if (b2) b2.focus(); return; }
      var all = load('bpe_partners', []); if (!Array.isArray(all)) all = [];
      all.push({ name: p.name.trim(), phone: p.phone, city: p.city || D.cities[0], skill: p.skill || D.categories[0].id, exp: p.exp || '0', at: Date.now() });
      save('bpe_partners', all);
      drafts.partner = { sent: true }; drafts.errs = {}; refresh();
    } else if (kind === 'admin-login') {
      var lockoutUntil = getAdminLockoutUntil();
      var now = Date.now();
      if (lockoutUntil > now) {
        var mins = Math.ceil((lockoutUntil - now) / 60000);
        toast('Login locked due to failed attempt. Try again in ' + mins + ' min');
        refresh();
        return;
      }

      var pass = ((drafts.admin || {}).pass || '').trim();
      var captchaInput = ((drafts.admin || {}).captcha || '').trim().toUpperCase();

      if (!captchaInput || captchaInput !== adminCaptchaCode) {
        generateCaptcha();
        toast('Invalid Security Capture Code! Please try again');
        refresh();
        return;
      }

      if (pass === ADMIN_PASS) {
        save('bpe_admin_auth', true);
        save('bpe_admin_lockout', 0);
        drafts.admin = {};
        toast('Welcome Super Admin');
        refresh();
      } else {
        var newLockout = Date.now() + LOCKOUT_DURATION_MS;
        save('bpe_admin_lockout', newLockout);
        toast('Invalid Admin credentials! Access locked for 15 minutes');
        refresh();
      }
    }
  });

  window.addEventListener('hashchange', function () {
    if (S.sheet && S.sheet.kind !== 'login') S.sheet = null;
    if (S.sheet && current && parseRoute().name !== 'checkout') S.sheet = null;
    renderSheet(); render(false);
    var m = $('#main'); if (m) m.setAttribute('tabindex', '-1');
  });
  // Keep follow-up state (system theme change) consistent.
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (!S.theme) { applyTheme(); refresh(); } }); } catch (e) { /* old browsers */ }
  // Drop a stale partner "sent" flag when the user leaves the page.
  window.addEventListener('hashchange', function () { if (parseRoute().name !== 'partner') drafts.partner = {}; });

  applyTheme();
  render(false);

  checkGoogleRedirectResult().then(function (res) {
    if (res.success && res.user) {
      S.user = res.user;
      save('bpe_user', S.user);
      drafts.login = {};
      delete drafts.loginNotice;
      if (S.sheet) closeSheet();
      toast(t('googleSuccess'));
      if (parseRoute().name === 'checkout') refresh();
      else location.hash = '#/account';
    } else if (!res.success && !res.noResult) {
      if (res.error) {
        drafts.loginNotice = res.error;
      }
      toast(res.error || 'Google sign-in failed');
      refresh();
    }
  }).catch(function (err) {
    console.error('Check redirect result error:', err);
  });
})();
