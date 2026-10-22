/* Bharat Pro Expert Admin - core: helpers, storage, demo data, selectors.
   All data lives in this browser's localStorage until Firebase is connected. */
(function () {
  'use strict';
  var A = window.A = {};
  var D0 = A.D0 = JSON.parse(JSON.stringify(window.BPE_DATA));

  /* ---------- small helpers ---------- */
  A.$ = function (s, r) { return (r || document).querySelector(s); };
  A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  A.esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  A.inr = function (n) { return '₹' + Math.round(n || 0).toLocaleString('en-IN'); };
  A.num = function (v) { var n = parseFloat(v); return isFinite(n) ? n : 0; };
  A.uid = function (p) { return (p || 'id') + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); };
  A.isoDate = function (d) { d = d instanceof Date ? d : new Date(d); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  A.fmtDate = function (ts) { return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
  A.fmtDateTime = function (ts) { return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); };
  A.fmtDay = function (iso) {
    var p = String(iso).split('-'); if (p.length !== 3) { return A.esc(iso); }
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  A.lines = function (s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
  A.slug = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24); };

  var LS = A.LS = {
    get: function (k, d) { try { var v = window.localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  var KDB = 'bpe_admin_db', KOV = 'bpe_admin_catalog', KAUTH = 'bpe_admin_auth';

  /* ---------- password lock (browser-only) ---------- */
  A.hash = function (s) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
        return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      });
    }
    var h = 5381; for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
    return Promise.resolve('x' + (h >>> 0).toString(16));
  };
  A.auth = {
    exists: function () { return !!LS.get(KAUTH, null); },
    set: function (pw) {
      var salt = A.uid('s');
      return A.hash(salt + pw).then(function (h) { LS.set(KAUTH, { salt: salt, hash: h }); });
    },
    check: function (pw) {
      var a = LS.get(KAUTH, null); if (!a) { return Promise.resolve(false); }
      return A.hash(a.salt + pw).then(function (h) { return h === a.hash; });
    },
    isIn: function () { try { return window.sessionStorage.getItem('bpe_admin_sess') === '1'; } catch (e) { return false; } },
    login: function () { try { window.sessionStorage.setItem('bpe_admin_sess', '1'); } catch (e) { /* ignore */ } },
    logout: function () { try { window.sessionStorage.removeItem('bpe_admin_sess'); } catch (e) { /* ignore */ } },
    wipe: function () { LS.del(KAUTH); LS.del(KDB); A.auth.logout(); _db = null; }
  };

  /* ---------- statuses ---------- */
  A.STATUS = {
    pending: { l: 'Pending', c: 'orange' }, confirmed: { l: 'Confirmed', c: 'blue' }, assigned: { l: 'Expert assigned', c: 'indigo' },
    enroute: { l: 'On the way', c: 'teal' }, inprogress: { l: 'In progress', c: 'purple' }, completed: { l: 'Completed', c: 'green' }, cancelled: { l: 'Cancelled', c: 'red' }
  };
  A.STATUS_ORDER = ['pending', 'confirmed', 'assigned', 'enroute', 'inprogress', 'completed', 'cancelled'];
  A.pill = function (key, map) {
    var m = (map || A.STATUS)[key] || { l: key, c: '' };
    return '<span class="pill pill--' + m.c + '">' + A.esc(m.l) + '</span>';
  };
  A.PSTATUS = { pending: { l: 'Awaiting approval', c: 'orange' }, approved: { l: 'Approved', c: 'green' }, suspended: { l: 'Suspended', c: 'red' }, rejected: { l: 'Rejected', c: '' } };
  A.KYC = [['id', 'Photo ID checked'], ['address', 'Address proof checked'], ['police', 'Police verification done'], ['training', 'Skill training completed'], ['bank', 'Bank / UPI for payouts added']];

  /* ---------- database ---------- */
  var _db = null;
  A.db = function () {
    if (!_db) {
      _db = LS.get(KDB, null);
      if (!_db || _db.v !== 1) { _db = seed(); A.saveDb(); }
      _db.meta = _db.meta || {}; _db.payouts = _db.payouts || []; _db.signups = _db.signups || {};
      _db.settings = _db.settings || { commission: 12 };
    }
    return _db;
  };
  A.saveDb = function () { if (_db) { LS.set(KDB, _db); } };
  A.ov = function () { return LS.get(KOV, {}) || {}; };
  A.saveOv = function (o) { LS.set(KOV, o); };

  /* ---------- demo data ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function seed() {
    var r = rng(20261016), now = Date.now(), DAY = 86400000;
    function pick(a) { return a[Math.floor(r() * a.length)]; }
    function int(a, b) { return a + Math.floor(r() * (b - a + 1)); }
    var cats = D0.categories.map(function (c) { return c.id; });

    var names = [['Ramesh Yadav', 'Gurgaon'], ['Sunil Kumar', 'Gurgaon'], ['Pooja Devi', 'Noida'], ['Mohd Arif', 'Delhi'], ['Anita Kumari', 'Gurgaon'], ['Rajesh Mahto', 'Patna'],
      ['Vikas Singh', 'Gurgaon'], ['Sita Devi', 'Darbhanga'], ['Deepak Chauhan', 'Gurgaon'], ['Imran Ali', 'Delhi'], ['Kavita Sharma', 'Noida'], ['Santosh Paswan', 'Patna']];
    var pst = ['approved', 'approved', 'approved', 'approved', 'approved', 'approved', 'approved', 'approved', 'pending', 'pending', 'suspended', 'rejected'];
    var partners = names.map(function (n, i) {
      var sk = [pick(cats)]; var s2 = pick(cats); if (sk.indexOf(s2) < 0) { sk.push(s2); }
      var ok = pst[i] === 'approved', kyc = {};
      A.KYC.forEach(function (k, j) { kyc[k[0]] = ok || (pst[i] === 'pending' && j < 2 + (i % 2)); });
      return { id: 'P' + (101 + i), name: n[0], phone: '90000' + ('0000' + (100 + i * 7)).slice(-5), city: n[1], skills: sk, exp: String(int(1, 9)),
        status: pst[i], kyc: kyc, rating: ok ? Math.round((4.1 + r() * 0.8) * 10) / 10 : 0, source: 'demo', at: now - int(10, 120) * DAY };
    });
    var approved = partners.filter(function (p) { return p.status === 'approved'; });

    var cn = ['Priya Sharma', 'Rahul Verma', 'Sunita Devi', 'Amit Kumar', 'Neha Gupta', 'Karan Malhotra', 'Anjali Singh', 'Vivek Jha', 'Meera Nair', 'Sandeep Rawat', 'Pallavi Joshi', 'Arjun Reddy', 'Fatima Khan', 'Manoj Tiwari'];
    var areas = ['Sector 45', 'DLF Phase 3', 'Sushant Lok 1', 'Golf Course Road', 'Sector 56', 'South City 2', 'Palam Vihar', 'Sector 82'];
    var statusPool = ['pending', 'confirmed', 'assigned', 'enroute', 'inprogress'];
    var svcs = D0.services, bookings = [];
    for (var i = 0; i < 64; i++) {
      var future = i < 6, dayOff = future ? -int(1, 3) : int(0, 13);
      var created = now - (future ? int(1, 20) * 3600000 : dayOff * DAY + int(1, 20) * 3600000);
      var items = [], n = r() < 0.3 ? 2 : 1, subtotal = 0;
      for (var k = 0; k < n; k++) { var s = pick(svcs); items.push({ id: s.id, name: s.name, emoji: s.emoji, price: s.price, qty: 1 }); subtotal += s.price; }
      var coupon = (r() < 0.2 && subtotal >= 299) ? 'FIRST100' : null, discount = coupon ? 100 : 0, fee = subtotal <= 499 ? 49 : 0;
      var status;
      if (future) { status = pick(['pending', 'confirmed']); }
      else if (dayOff === 0) { status = pick(statusPool); }
      else { var x = r(); status = x < 0.84 ? 'completed' : x < 0.93 ? 'cancelled' : 'completed'; }
      var city = pick(['Gurgaon', 'Gurgaon', 'Gurgaon', 'Noida', 'Delhi']);
      var pool = approved.filter(function (p) { return p.city === city && p.skills.indexOf(items[0].id.split('-')[0]) >= 0; });
      if (!pool.length) { pool = approved.filter(function (p) { return p.skills.indexOf(items[0].id.split('-')[0]) >= 0; }); }
      var partnerId = (['pending', 'confirmed', 'cancelled'].indexOf(status) >= 0 || !pool.length) ? null : pick(pool).id;
      var who = pick(cn), d = new Date(now - dayOff * DAY);
      bookings.push({
        id: 'BPE' + (310000 + i * 97), source: 'demo', created: created, date: A.isoDate(d), slot: pick(D0.slots), pay: r() < 0.65 ? 'cod' : 'upi',
        items: items, pricing: { subtotal: subtotal, discount: discount, fee: fee, total: Math.max(0, subtotal - discount + fee) }, coupon: coupon,
        address: { name: who, phone: '90001' + ('0000' + (200 + i * 13)).slice(-5), house: 'Flat ' + int(101, 1204), area: pick(areas), pincode: '1220' + int(10, 18), landmark: '', city: city },
        status: status, partnerId: partnerId, note: '', refund: 'none'
      });
    }
    bookings.sort(function (a, b) { return b.created - a.created; });

    var done = bookings.filter(function (b) { return b.status === 'completed'; });
    var rt = ['Team was on time and the work was spotless.', 'Good cleaning, a little late but they informed me.', 'Very professional experts. Will book again.', 'Floors and bathroom look brand new.',
      'Corners in the kitchen were missed, the team came back to fix it.', 'Fair price and polite behaviour.', 'Sofa looks fresh and the smell is gone.', 'Great value for money.', 'Experts were careful with the furniture.', 'Cleaning was fine but I expected more shine.'];
    var reviews = done.slice(0, 10).map(function (b, i) {
      return { id: 'R' + (500 + i), bookingId: b.id, customer: b.address.name, service: b.items[0].name, rating: [5, 4, 5, 5, 3, 4, 5, 5, 4, 3][i], text: rt[i], at: b.created + DAY, demo: true };
    });
    var tk = [['Expert arrived 40 minutes late', 'open', 'medium'], ['Please re-clean the kitchen corners', 'inprogress', 'high'], ['Need an invoice for my booking', 'resolved', 'low'],
      ['Charged visit fee twice', 'open', 'high'], ['Want to change the address of booking', 'resolved', 'medium']];
    var tickets = tk.map(function (t, i) {
      var b = bookings[6 + i * 5];
      return { id: 'T' + (700 + i), subject: t[0], customer: b.address.name, phone: b.address.phone, bookingId: b.id, status: t[1], priority: t[2], notes: [], at: now - (i + 1) * 9 * 3600000, demo: true };
    });
    return { v: 1, demo: true, partners: partners, demoBookings: bookings, tickets: tickets, reviews: reviews, meta: {}, payouts: [], signups: {}, settings: { commission: 12 } };
  }

  A.clearDemo = function () {
    var db = A.db();
    db.demo = false; db.demoBookings = [];
    db.partners = db.partners.filter(function (p) { return p.source !== 'demo'; });
    db.tickets = db.tickets.filter(function (t) { return !t.demo; });
    db.reviews = db.reviews.filter(function (t) { return !t.demo; });
    db.payouts = db.payouts.filter(function (p) { return !p.demo; });
    A.saveDb();
  };
  A.restoreDemo = function () {
    var keep = A.db(), fresh = seed();
    keep.demo = true; keep.demoBookings = fresh.demoBookings;
    keep.partners = fresh.partners.concat(keep.partners.filter(function (p) { return p.source !== 'demo'; }));
    keep.tickets = fresh.tickets.concat(keep.tickets.filter(function (t) { return !t.demo; }));
    keep.reviews = fresh.reviews.concat(keep.reviews.filter(function (t) { return !t.demo; }));
    A.saveDb();
  };

  /* ---------- bookings ---------- */
  function normLive(b) {
    var m = A.db().meta[b.id] || {};
    return {
      id: b.id, source: 'live', created: b.created, date: b.date, slot: b.slot, pay: b.pay, items: b.items || [],
      pricing: b.pricing || { subtotal: 0, discount: 0, fee: 0, total: 0 }, coupon: b.coupon || null, address: b.address || {},
      status: b.cancelled ? 'cancelled' : (m.status || 'pending'), partnerId: m.partnerId || null, note: m.note || '', refund: m.refund || 'none'
    };
  }
  A.bookings = function () {
    var live = LS.get('bpe_bookings', []); if (!Array.isArray(live)) { live = []; }
    var all = live.map(normLive).concat(A.db().demoBookings || []);
    all.sort(function (a, b) { return b.created - a.created; });
    return all;
  };
  A.booking = function (id) { var l = A.bookings(); for (var i = 0; i < l.length; i++) { if (l[i].id === id) { return l[i]; } } return null; };
  A.setBooking = function (id, patch) {
    var db = A.db(), i, list = db.demoBookings || [];
    for (i = 0; i < list.length; i++) { if (list[i].id === id) { Object.assign(list[i], patch); A.saveDb(); return; } }
    db.meta[id] = Object.assign(db.meta[id] || {}, patch); A.saveDb();
  };
  A.commissionRate = function () { return Math.max(0, Math.min(50, A.num(A.db().settings.commission))) / 100; };
  A.split = function (b) { var g = b.pricing.total || 0, c = Math.round(g * A.commissionRate()); return { gross: g, commission: c, partner: g - c }; };

  /* ---------- partners ---------- */
  A.importSignups = function () {
    var raw = LS.get('bpe_partners', []); if (!Array.isArray(raw)) { return; }
    var db = A.db(), changed = false;
    raw.forEach(function (p) {
      var key = (p.phone || '') + '-' + (p.at || 0);
      if (db.signups[key]) { return; }
      db.signups[key] = 1; changed = true;
      var kyc = {}; A.KYC.forEach(function (k) { kyc[k[0]] = false; });
      db.partners.push({ id: A.uid('P'), name: p.name || 'Unknown', phone: p.phone || '', city: p.city || '', skills: p.skill ? [p.skill] : [], exp: p.exp || '0',
        status: 'pending', kyc: kyc, rating: 0, source: 'signup', at: p.at || Date.now() });
    });
    if (changed) { A.saveDb(); }
  };
  A.partner = function (id) { var l = A.db().partners; for (var i = 0; i < l.length; i++) { if (l[i].id === id) { return l[i]; } } return null; };
  A.partnerStats = function (p, bks) {
    var jobs = 0, earned = 0;
    (bks || A.bookings()).forEach(function (b) { if (b.partnerId === p.id && b.status === 'completed') { jobs++; earned += A.split(b).partner; } });
    var paid = 0; A.db().payouts.forEach(function (x) { if (x.partnerId === p.id) { paid += x.amount; } });
    return { jobs: jobs, earned: earned, paid: paid, due: Math.max(0, earned - paid) };
  };
  A.catName = function (id) { var c = A.allCategories().filter(function (x) { return x.id === id; })[0]; return c ? c.name : id; };

  /* ---------- catalogue (merged with saved edits) ---------- */
  A.allCategories = function () {
    var ov = A.ov(), o = ov.categories || {};
    return D0.categories.concat(ov.addedCategories || []).map(function (c) {
      var p = o[c.id] || {};
      return Object.assign({}, c, { name: p.name || c.name, nameHi: p.nameHi || c.nameHi, emoji: p.emoji || c.emoji, active: p.active !== false, custom: !!(ov.addedCategories || []).filter(function (x) { return x.id === c.id; }).length });
    });
  };
  A.allServices = function () {
    var ov = A.ov(), o = ov.services || {}, added = (ov.addedServices || []).map(function (s) {
      return Object.assign({ includes: [], excludes: [], faqs: [], rating: 4.5, reviews: 0, duration: 60 }, s);
    });
    return D0.services.concat(added).map(function (s) {
      var p = o[s.id] || {};
      var m = Object.assign({}, s, p); m.active = p.active !== false; m.custom = added.some(function (x) { return x.id === s.id; }); m.edited = !!o[s.id]; m.baseId = !m.custom;
      return m;
    });
  };
  A.coupons = function () { var ov = A.ov(); return ov.coupons || D0.coupons.map(function (c) { return Object.assign({ active: true }, c); }); };
  A.cities = function () { var ov = A.ov(); return (ov.cities && ov.cities.length) ? ov.cities : D0.cities.slice(); };
  A.slides = function () { var ov = A.ov(); return (ov.heroSlides && ov.heroSlides.length) ? ov.heroSlides : D0.heroSlides.map(function (s) { return Object.assign({}, s); }); };
  A.promo = function () { return Object.assign({}, D0.promo, A.ov().promo || {}); };
  A.brand = function () { return Object.assign({}, D0.brand, A.ov().brand || {}); };

  /* ---------- csv / ui helpers ---------- */
  A.csv = function (rows) {
    return rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
  };
  var toastT = null;
  A.toast = function (msg) {
    var old = A.$('.toast'); if (old) { old.remove(); }
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(function () { t.remove(); }, 2600);
  };
  A.copy = function (text, okMsg) {
    var done = function () { A.toast(okMsg || 'Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () { A.toast('Copy blocked. Select the text and copy it.'); }); }
    else { A.toast('Copy is not available here.'); }
  };
  A.download = function (name, text, mime) {
    try {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      A.toast('Download started');
    } catch (e) { A.toast('Download is blocked here. Use Copy instead.'); }
  };
}());
