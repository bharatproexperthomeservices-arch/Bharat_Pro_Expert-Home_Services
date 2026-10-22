/* Bharat Pro Expert - applies admin-panel changes to the catalogue (ES5).
   Admin saves edits in localStorage key "bpe_admin_catalog"; the customer site
   loads this file between data.js and app.js, so changes show up on the site. */
(function () {
  'use strict';
  function pick(o, keys) { var r = {}; for (var i = 0; i < keys.length; i++) { if (o[keys[i]] !== undefined) { r[keys[i]] = o[keys[i]]; } } return r; }
  function assign(t, s) { for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) { t[k] = s[k]; } } return t; }

  function apply(D, ov) {
    if (!D || !ov || typeof ov !== 'object') { return D; }
    var cOv = ov.categories || {}, sOv = ov.services || {};

    var cats = D.categories.concat(ov.addedCategories || []).map(function (c) {
      var o = cOv[c.id];
      return o ? assign(assign({}, c), pick(o, ['name', 'nameHi', 'emoji'])) : c;
    }).filter(function (c) { return !(cOv[c.id] && cOv[c.id].active === false); });
    var catIds = {}; cats.forEach(function (c) { catIds[c.id] = 1; });
    D.categories = cats;

    var added = (ov.addedServices || []).map(function (s) {
      return assign({ includes: [], excludes: [], faqs: [], rating: 4.5, reviews: 0, duration: 60 }, s);
    });
    D.services = D.services.concat(added).map(function (s) {
      var o = sOv[s.id];
      return o ? assign(assign({}, s), pick(o, ['name', 'nameHi', 'emoji', 'price', 'mrp', 'duration', 'desc', 'tag', 'includes', 'excludes', 'active'])) : s;
    }).filter(function (s) { return s.active !== false && catIds[s.cat]; });

    var secs = D.sections.filter(function (x) { return catIds[x.cat]; });
    (ov.addedCategories || []).forEach(function (c) {
      if (catIds[c.id]) { secs.push({ id: 'sec-' + c.id, title: c.name, titleHi: c.nameHi, cat: c.id }); }
    });
    D.sections = secs;

    if (ov.heroSlides && ov.heroSlides.length) { D.heroSlides = ov.heroSlides; }
    D.heroSlides = D.heroSlides.filter(function (x) { return !x.cat || catIds[x.cat]; });
    if (ov.promo) { D.promo = assign(assign({}, D.promo), ov.promo); }
    if (ov.coupons) { D.coupons = ov.coupons.filter(function (c) { return c.active !== false; }); }
    if (ov.cities && ov.cities.length) { D.cities = ov.cities.slice(); }
    if (ov.brand) { assign(D.brand, pick(ov.brand, ['phone', 'email', 'companyEmail'])); }
    return D;
  }

  window.BPE_applyOverrides = apply;

  /* On the customer site (not the admin panel) apply the saved edits right away. */
  if (!window.BPE_ADMIN && window.BPE_DATA) {
    try {
      var raw = window.localStorage.getItem('bpe_admin_catalog');
      if (raw) { apply(window.BPE_DATA, JSON.parse(raw)); }
    } catch (e) { /* storage unavailable or bad JSON: keep the original catalogue */ }
  }
}());
