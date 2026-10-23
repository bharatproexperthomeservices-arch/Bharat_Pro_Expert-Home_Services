/* Bharat Pro Expert Admin - auth screens, shell, router, event delegation */
(function () {
  'use strict';
  var A = window.A, esc = A.esc, $ = A.$, root = $('#root');
  var NAV = [['dashboard', '📊', 'Dashboard'], ['bookings', '📋', 'Bookings'], ['services', '🧹', 'Services'], ['partners', '🧑‍🔧', 'Experts'], ['customers', '👥', 'Customers'],
    ['payments', '💸', 'Payments'], ['offers', '🏷️', 'Offers'], ['content', '🖼️', 'Home banners'], ['cities', '📍', 'Cities'], ['support', '🎧', 'Support'], ['settings', '⚙️', 'Settings']];
  var navOpen = false;

  function route() { var h = (location.hash || '').replace(/^#\/?/, '').split('?')[0]; return A.pages[h] ? h : 'dashboard'; }

  /* ---------- theme ---------- */
  function applyTheme() { var t = A.LS.get('bpe_admin_theme', null); if (t) { document.documentElement.setAttribute('data-theme', t); } }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var nxt = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', nxt); A.LS.set('bpe_admin_theme', nxt);
  }

  /* ---------- auth screens ---------- */
  function authScreen(mode) {
    var first = mode === 'setup';
    root.innerHTML = '<div class="auth"><div class="auth__card card"><div class="brand"><span class="emoji-chip" style="background:linear-gradient(135deg,#5AC8FA,#007AFF)">🏠</span><div>Bharat Pro Expert<small>Admin panel</small></div></div>' +
      '<h1 style="text-align:center;margin:6px 0 2px">' + (first ? 'Set an admin password' : 'Sign in') + '</h1>' +
      '<p class="muted" style="text-align:center">' + (first ? 'Choose a password for this browser. You will use it every time you open the admin panel.' : 'Enter your admin password to continue.') + '</p>' +
      '<form class="form" id="authform" data-mode="' + mode + '" novalidate><div class="field"><label for="a_pw">Password</label><input class="input" id="a_pw" name="pw" type="password" autocomplete="' + (first ? 'new-password' : 'current-password') + '"><div class="err" data-err="pw"></div></div>' +
      (first ? '<div class="field"><label for="a_pw2">Repeat password</label><input class="input" id="a_pw2" name="pw2" type="password" autocomplete="new-password"><div class="err" data-err="pw2"></div></div>' : '') +
      '<button class="btn btn--primary btn--block" type="submit">' + (first ? 'Create password' : 'Sign in') + '</button></form>' +
      (first ? '' : '<div id="forgot" style="text-align:center;margin-top:12px"><button type="button" class="btn btn--ghost btn--sm" data-act="forgot">Forgot password?</button></div>') +
      '<p class="note" style="margin-top:14px">This password only locks the panel in this browser. Real protection needs Firebase sign-in, which is covered in the README.</p></div></div>';
    var f = $('#a_pw'); if (f) { f.focus(); }
  }
  function authSubmit(form) {
    var mode = form.dataset.mode, pw = form.elements.pw.value, errs = {};
    var show = function () { A.$$('[data-err]', form).forEach(function (e) { e.textContent = errs[e.dataset.err] || ''; }); };
    if (mode === 'setup') {
      if (pw.length < 8) { errs.pw = 'Use at least 8 characters.'; }
      if (pw !== form.elements.pw2.value) { errs.pw2 = 'The passwords do not match.'; }
      show(); if (Object.keys(errs).length) { return; }
      A.auth.set(pw).then(function () { A.auth.login(); boot(); });
    } else {
      A.auth.check(pw).then(function (ok) { if (!ok) { errs.pw = 'This password is not correct.'; show(); return; } A.auth.login(); boot(); });
    }
  }

  /* ---------- shell ---------- */
  function counts() {
    var db = A.db(), bks = A.bookings();
    return { bookings: bks.filter(function (b) { return b.status === 'pending'; }).length, partners: db.partners.filter(function (p) { return p.status === 'pending'; }).length, support: db.tickets.filter(function (t) { return t.status === 'open'; }).length };
  }
  A.render = function () {
    if (!A.auth.isIn()) { return; }
    var r = route(), pg = A.pages[r], c = counts(), db = A.db();
    var sy = window.scrollY;
    root.innerHTML = '<div class="shell' + (navOpen ? ' nav-open' : '') + '"><aside class="side" aria-label="Main menu"><div class="brand"><span class="emoji-chip" style="background:linear-gradient(135deg,#5AC8FA,#007AFF)">🏠</span><div>Bharat Pro Expert<small>Admin panel</small></div></div>' +
      '<nav class="nav" aria-label="Sections">' + NAV.map(function (n) {
        var b = c[n[0]]; return '<a href="#/' + n[0] + '" class="' + (n[0] === r ? 'is-active' : '') + '"' + (n[0] === r ? ' aria-current="page"' : '') + '><span class="ico">' + n[1] + '</span>' + esc(n[2]) + (b ? '<span class="badge">' + b + '</span>' : '') + '</a>';
      }).join('') + '</nav><div style="margin-top:auto;padding-top:16px;display:grid;gap:8px"><a class="btn btn--sm" href="../index.html" target="_blank" rel="noopener">Open website</a><button type="button" class="btn btn--sm" data-act="logout">Sign out</button></div></aside>' +
      (navOpen ? '<div class="nav-scrim" data-act="nav-close"></div>' : '') +
      '<div class="main" style="min-width:0"><header class="top"><button type="button" class="btn btn--sm menu-btn" data-act="nav-open" aria-label="Open menu">Menu</button><h1>' + esc(pg.title) + '</h1><button type="button" class="btn btn--sm" data-act="theme">Theme</button></header>' +
      '<main class="page" id="main">' + (db.demo ? '<div class="demo-bar"><p><b>Demo data is on.</b> The bookings, experts, tickets and reviews marked Demo are samples so you can try the panel. Remove them in Settings when you are ready.</p><button type="button" class="btn btn--sm" data-act="go" data-to="settings">Settings</button></div>' : '') + pg.render() + '</main></div></div>';
    window.scrollTo(0, sy);
  };

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el || el.disabled) { return; }
    var a = el.dataset.act;
    if (e.target.closest('a[href]') && el.tagName === 'TR') { return; }
    if (a === 'logout') { A.auth.logout(); boot(); return; }
    if (a === 'theme') { toggleTheme(); return; }
    if (a === 'nav-open') { navOpen = true; A.render(); return; }
    if (a === 'nav-close') { navOpen = false; A.render(); return; }
    if (a === 'forgot') {
      $('#forgot').innerHTML = '<div class="confirm"><p>Resetting the password also clears all admin data saved in this browser (bookings status changes, experts, tickets, payouts). Website catalogue edits stay. Continue?</p><div class="rowwrap" style="justify-content:center"><button type="button" class="btn btn--danger btn--sm" data-act="forgot-yes">Reset everything</button><button type="button" class="btn btn--sm" data-act="forgot-no">Cancel</button></div></div>'; return;
    }
    if (a === 'forgot-no') { authScreen('login'); return; }
    if (a === 'forgot-yes') { A.auth.wipe(); boot(); return; }
    var fn = A.act[a]; if (fn) { fn(el, e); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset.chg && A.chg[el.dataset.chg]) { A.chg[el.dataset.chg](el); return; }
    if (el.dataset.f) { A.S[el.dataset.f.split('.')[0]][el.dataset.f.split('.')[1]] = el.value; liveResults(); }
  });
  document.addEventListener('input', function (e) {
    var el = e.target; if (el.dataset && el.dataset.f && el.type === 'search') { A.S[el.dataset.f.split('.')[0]][el.dataset.f.split('.')[1]] = el.value; liveResults(); }
  });
  function liveResults() { var pg = A.pages[route()], box = $('#results'); if (pg && pg.results && box) { box.innerHTML = pg.results(); } else { A.render(); } }
  document.addEventListener('submit', function (e) {
    var form = e.target; e.preventDefault();
    if (form.id === 'authform') { authSubmit(form); return; }
    var h = A.forms[form.dataset.form]; if (h) { h(form); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if ($('.drawer')) { A.closeDrawer(); } else if (navOpen) { navOpen = false; A.render(); } }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'TR' && e.target.dataset.act) { e.preventDefault(); e.target.click(); }
  });
  window.addEventListener('hashchange', function () { navOpen = false; A.closeDrawer(); A.render(); window.scrollTo(0, 0); });

  /* ---------- boot ---------- */
  function boot() {
    applyTheme(); A.closeDrawer();
    if (!A.auth.exists()) { authScreen('setup'); return; }
    if (!A.auth.isIn()) { authScreen('login'); return; }
    try { A.importSignups(); } catch (err) { /* ignore */ }
    A.render();
  }
  boot();
}());
