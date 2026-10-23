/* Bharat Pro Expert Admin - pages, drawers and actions */
(function () {
  'use strict';
  var A = window.A, esc = A.esc, inr = A.inr, $ = A.$;
  var S = A.S = {
    bk: { status: 'all', q: '', range: 'all', src: 'all' },
    sv: { tab: 'services', cat: 'all', q: '', st: 'all' },
    pt: { tab: 'pending', q: '' }, cu: { q: '' }, pay: { tab: 'payouts' }, sp: { tab: 'tickets' }
  };
  A.pages = {};
  A.act = {}; A.forms = {}; A.chg = {};

  /* ---------- ui helpers ---------- */
  function fld(label, name, val, o) {
    o = o || {}; var id = 'f_' + name, t = o.type || 'text', h = '<div class="field' + (o.span ? ' span2' : '') + '"><label for="' + id + '">' + esc(label) + '</label>';
    if (t === 'select') {
      h += '<select class="input" id="' + id + '" name="' + name + '">' + o.options.map(function (op) {
        return '<option value="' + esc(op[0]) + '"' + (String(op[0]) === String(val) ? ' selected' : '') + '>' + esc(op[1]) + '</option>';
      }).join('') + '</select>';
    } else if (t === 'textarea') {
      h += '<textarea class="input" id="' + id + '" name="' + name + '" rows="' + (o.rows || 3) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + esc(val) + '</textarea>';
    } else {
      h += '<input class="input" id="' + id + '" name="' + name + '" type="' + t + '" value="' + esc(val) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.attrs ? ' ' + o.attrs : '') + (o.disabled ? ' disabled' : '') + '>';
    }
    if (o.hint) { h += '<div class="muted small">' + esc(o.hint) + '</div>'; }
    return h + '<div class="err" data-err="' + name + '"></div></div>';
  }
  function setErr(form, errs) {
    A.$$('[data-err]', form).forEach(function (el) { el.textContent = errs[el.getAttribute('data-err')] || ''; });
    var first = Object.keys(errs)[0]; if (first) { var f = form.elements[first]; if (f && f.focus) { f.focus(); } }
    return Object.keys(errs).length === 0;
  }
  function fd(form) { var o = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name && el.type !== 'checkbox' && el.type !== 'submit') { o[el.name] = el.value; } }); return o; }
  function tbl(head, rows, opt) {
    opt = opt || {};
    return '<div class="tblwrap"><table' + (opt.min ? ' style="min-width:' + opt.min + 'px"' : '') + '><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function empty(t, s) { return '<div class="empty"><b>' + esc(t) + '</b>' + esc(s || '') + '</div>'; }
  function sw(on, chg, id, label) {
    return '<label class="switch" title="' + esc(label || '') + '"><input type="checkbox" data-chg="' + chg + '" data-id="' + esc(id) + '"' + (on ? ' checked' : '') + ' aria-label="' + esc(label || 'Toggle') + '"><i></i></label>';
  }
  function tabs(key, items, cur) {
    return '<div class="tabs" role="tablist">' + items.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (t[0] === cur) + '" class="' + (t[0] === cur ? 'is-active' : '') + '" data-act="set" data-k="' + key + '" data-v="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join('') + '</div>';
  }
  function tile(c) {
    return '<span class="emoji-chip" style="background:linear-gradient(135deg,' + esc(c.g1 || '#5AC8FA') + ',' + esc(c.g2 || '#007AFF') + ')">' + esc(c.emoji || '✨') + '</span>';
  }
  A.drawer = function (o) {
    A.closeDrawer();
    var L = $('#layer'), el = document.createElement('div');
    el.innerHTML = '<div class="scrim" data-act="close-drawer"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '"><div class="drawer__head"><h2>' + o.title + '</h2><button type="button" class="btn btn--sm" data-act="close-drawer" aria-label="Close">Close</button></div><div class="drawer__body">' + o.body + '</div>' + (o.foot ? '<div class="drawer__foot">' + o.foot + '</div>' : '') + '</aside>';
    while (el.firstChild) { L.appendChild(el.firstChild); }
    var f = $('.drawer .input'); if (f && window.innerWidth > 899) { f.focus(); }
  };
  A.closeDrawer = function () { $('#layer').innerHTML = ''; };
  function confirmBox(msg, act, id, label) {
    return '<div class="confirm"><p>' + esc(msg) + '</p><div class="rowwrap"><button type="button" class="btn btn--danger btn--sm" data-act="' + act + '" data-id="' + esc(id) + '">' + esc(label || 'Yes, continue') + '</button><button type="button" class="btn btn--sm" data-act="close-drawer">Keep</button></div></div>';
  }
  function setPath(k, v) { var p = k.split('.'); S[p[0]][p[1]] = v; }
  A.act.set = function (el) { setPath(el.dataset.k, el.dataset.v); A.render(); };
  A.act['close-drawer'] = function () { A.closeDrawer(); };

  /* ---------- charts ---------- */
  function barChart(vals, labels, cls, fmt) {
    var W = 600, H = 180, L = 8, R = 8, T = 16, B = 26, n = vals.length, bw = (W - L - R) / n, max = Math.max.apply(null, vals) || 1, ih = H - T - B;
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bar chart of the last ' + n + ' days">';
    [0, 0.5, 1].forEach(function (g) { var y = T + ih * (1 - g); s += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>'; });
    vals.forEach(function (v, i) {
      var h = Math.round(ih * v / max), x = L + i * bw + bw * 0.18, y = T + ih - h;
      s += '<rect class="bar ' + (cls || '') + '" x="' + x.toFixed(1) + '" y="' + y + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + Math.max(h, v ? 2 : 0) + '" rx="4"><title>' + esc(labels[i]) + ': ' + esc(fmt(v)) + '</title></rect>';
      if (i % 2 === 0) { s += '<text x="' + (x + bw * 0.32).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(labels[i]) + '</text>'; }
    });
    return s + '<text x="' + (W - R) + '" y="' + (T - 4) + '" text-anchor="end">' + esc(fmt(max)) + '</text></svg>';
  }

  /* =========================== DASHBOARD =========================== */
  A.pages.dashboard = {
    title: 'Dashboard',
    render: function () {
      var bks = A.bookings(), db = A.db(), now = Date.now(), DAY = 86400000, today = A.isoDate(new Date());
      var done = bks.filter(function (b) { return b.status === 'completed'; });
      var newToday = bks.filter(function (b) { return A.isoDate(b.created) === today; }).length;
      var rev30 = 0, comm = 0;
      done.forEach(function (b) { if (now - b.created <= 30 * DAY) { rev30 += b.pricing.total; } comm += A.split(b).commission; });
      var approved = db.partners.filter(function (p) { return p.status === 'approved'; }).length;
      var pendingP = db.partners.filter(function (p) { return p.status === 'pending'; }).length;
      var open = db.tickets.filter(function (t) { return t.status !== 'resolved'; }).length;
      var unassigned = bks.filter(function (b) { return b.status === 'pending' || b.status === 'confirmed'; }).length;
      var rs = db.reviews, avg = rs.length ? rs.reduce(function (n, r) { return n + r.rating; }, 0) / rs.length : 0;
      var due = 0; db.partners.forEach(function (p) { due += A.partnerStats(p, bks).due; });

      var days = [], cnt = [], rev = [];
      for (var i = 13; i >= 0; i--) {
        var d = new Date(now - i * DAY), key = A.isoDate(d); days.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
        var c = 0, r = 0; bks.forEach(function (b) { if (A.isoDate(b.created) === key) { c++; if (b.status === 'completed') { r += b.pricing.total; } } });
        cnt.push(c); rev.push(r);
      }
      var byStatus = {}; bks.forEach(function (b) { byStatus[b.status] = (byStatus[b.status] || 0) + 1; });
      var col = { pending: 'orange', confirmed: 'blue', assigned: 'indigo', enroute: 'teal', inprogress: 'purple', completed: 'green', cancelled: 'red' };
      var stack = '<div class="stack" role="img" aria-label="Bookings by status">' + A.STATUS_ORDER.map(function (k) { return byStatus[k] ? '<i class="c-' + col[k] + '" style="width:' + (100 * byStatus[k] / bks.length).toFixed(2) + '%" title="' + A.STATUS[k].l + '"></i>' : ''; }).join('') + '</div>' +
        '<div class="legend">' + A.STATUS_ORDER.map(function (k) { return byStatus[k] ? '<span><i class="dot c-' + col[k] + '"></i>' + A.STATUS[k].l + ' <b>' + byStatus[k] + '</b></span>' : ''; }).join('') + '</div>';

      var top = {}; done.forEach(function (b) { b.items.forEach(function (it) { var t = top[it.name] || (top[it.name] = { n: 0, rev: 0, e: it.emoji }); t.n += it.qty || 1; t.rev += (it.price || 0) * (it.qty || 1); }); });
      var topList = Object.keys(top).map(function (k) { return [k, top[k]]; }).sort(function (a, b) { return b[1].rev - a[1].rev; }).slice(0, 5);
      var maxRev = topList.length ? topList[0][1].rev : 1;

      var kp = function (l, v, s, go) { return '<button type="button" class="kpi kpi--link" data-act="go" data-to="' + go + '"><div class="kpi__label">' + l + '</div><div class="kpi__value">' + v + '</div><div class="kpi__sub">' + s + '</div></button>'; };
      var h = '<div class="kpis">' +
        kp('New bookings today', newToday, bks.length + ' in total', 'bookings') +
        kp('Revenue, last 30 days', inr(rev30), 'From completed jobs', 'payments') +
        kp('Platform commission', inr(comm), A.db().settings.commission + '% of completed jobs', 'payments') +
        kp('Active experts', approved, pendingP + ' waiting for approval', 'partners') +
        kp('Needs an expert', unassigned, 'Pending or confirmed', 'bookings') +
        kp('Open support tickets', open, 'Avg rating ' + (avg ? avg.toFixed(1) + ' / 5' : 'not available'), 'support') +
        '</div>';
      h += '<div class="grid grid--2"><section class="card"><div class="card__head"><h2>Bookings, last 14 days</h2></div>' + barChart(cnt, days, '', function (v) { return String(v); }) + '</section>' +
        '<section class="card"><div class="card__head"><h2>Revenue, last 14 days</h2></div>' + barChart(rev, days, 'bar--alt', function (v) { return inr(v); }) + '</section></div>';
      h += '<div class="grid grid--2"><section class="card"><div class="card__head"><h2>Bookings by status</h2></div>' + (bks.length ? stack : empty('No bookings yet', 'Bookings from the website appear here.')) + '</section>' +
        '<section class="card"><div class="card__head"><h2>Top services by revenue</h2></div>' + (topList.length ? '<div class="list">' + topList.map(function (t) {
          return '<div class="li"><span>' + esc(t[1].e || '') + '</span><div class="grow" style="flex:1;min-width:0"><div class="cell-main">' + esc(t[0]) + '</div><div class="progress" style="margin-top:6px"><i style="width:' + Math.round(100 * t[1].rev / maxRev) + '%"></i></div></div><div class="right"><div class="cell-main mono">' + inr(t[1].rev) + '</div><div class="cell-sub">' + t[1].n + ' jobs</div></div></div>';
        }).join('') + '</div>' : empty('No completed jobs yet')) + '</section></div>';
      h += '<div class="grid grid--2"><section class="card"><div class="card__head"><h2>Needs attention</h2></div><div class="list">' +
        att('📋', unassigned + ' bookings need an expert', 'bookings', 'bk.status', 'pending') +
        att('🧑‍🔧', pendingP + ' expert applications to review', 'partners', 'pt.tab', 'pending') +
        att('💸', inr(due) + ' payouts due to experts', 'payments', 'pay.tab', 'payouts') +
        att('🎧', open + ' open support tickets', 'support', 'sp.tab', 'tickets') + '</div></section>' +
        '<section class="card"><div class="card__head"><h2>Latest bookings</h2><button type="button" class="btn btn--sm" data-act="go" data-to="bookings">View all</button></div>' +
        (bks.length ? tbl(['Booking', 'Customer', 'Amount', 'Status'], bks.slice(0, 6).map(function (b) {
          return '<tr data-act="bk-open" data-id="' + esc(b.id) + '"><td class="cell-main">' + esc(b.id) + '</td><td>' + esc(b.address.name || '-') + '</td><td class="mono">' + inr(b.pricing.total) + '</td><td>' + A.pill(b.status) + '</td></tr>';
        }).join(''), { min: 420 }) : empty('No bookings yet')) + '</section></div>';
      return h;
    }
  };
  function att(ico, text, to, k, v) {
    return '<button type="button" class="li btn--ghost" style="border:0;background:none;text-align:left;width:100%;color:inherit" data-act="go-set" data-to="' + to + '" data-k="' + k + '" data-v="' + v + '"><span>' + ico + '</span><span style="flex:1">' + esc(text) + '</span><span class="muted">›</span></button>';
  }
  A.act.go = function (el) { location.hash = '#/' + el.dataset.to; };
  A.act['go-set'] = function (el) { setPath(el.dataset.k, el.dataset.v); location.hash = '#/' + el.dataset.to; A.render(); };

  /* =========================== BOOKINGS =========================== */
  function filteredBookings() {
    var f = S.bk, q = f.q.trim().toLowerCase(), now = Date.now(), DAY = 86400000, today = A.isoDate(new Date());
    return A.bookings().filter(function (b) {
      if (f.status !== 'all' && b.status !== f.status) { return false; }
      if (f.src !== 'all' && b.source !== f.src) { return false; }
      if (f.range === 'today' && A.isoDate(b.created) !== today) { return false; }
      if (f.range === '7d' && now - b.created > 7 * DAY) { return false; }
      if (f.range === '30d' && now - b.created > 30 * DAY) { return false; }
      if (q && (b.id + ' ' + (b.address.name || '') + ' ' + (b.address.phone || '')).toLowerCase().indexOf(q) < 0) { return false; }
      return true;
    });
  }
  function partnerName(id) { var p = id && A.partner(id); return p ? p.name : null; }
  function bookingsResults() {
    var list = filteredBookings();
    if (!list.length) { return empty('No bookings match', 'Change the filters or search.'); }
    return '<div class="muted small" style="margin-bottom:8px">' + list.length + ' bookings, total value ' + inr(list.reduce(function (n, b) { return n + b.pricing.total; }, 0)) + '</div>' +
      tbl(['Booking', 'Customer', 'Service', 'Visit', 'Amount', 'Expert', 'Status'], list.slice(0, 200).map(function (b) {
        var pn = partnerName(b.partnerId), it = b.items[0] || {};
        return '<tr data-act="bk-open" data-id="' + esc(b.id) + '"><td><div class="cell-main">' + esc(b.id) + (b.source === 'demo' ? ' <span class="tag-demo">Demo</span>' : '') + '</div><div class="cell-sub">' + A.fmtDateTime(b.created) + '</div></td>' +
          '<td><div class="cell-main">' + esc(b.address.name || '-') + '</div><div class="cell-sub">' + esc(b.address.phone || '') + '</div></td>' +
          '<td>' + esc(it.emoji || '') + ' ' + esc(it.name || '-') + (b.items.length > 1 ? ' <span class="muted">+' + (b.items.length - 1) + '</span>' : '') + '</td>' +
          '<td class="nowrap">' + A.fmtDay(b.date) + '<div class="cell-sub">' + esc(b.slot || '') + '</div></td><td class="mono">' + inr(b.pricing.total) + '</td>' +
          '<td>' + (pn ? esc(pn) : '<span class="muted">Unassigned</span>') + '</td><td>' + A.pill(b.status) + '</td></tr>';
      }).join(''), { min: 880 });
  }
  A.pages.bookings = {
    title: 'Bookings', results: bookingsResults,
    render: function () {
      var all = A.bookings(), counts = {}; all.forEach(function (b) { counts[b.status] = (counts[b.status] || 0) + 1; });
      var chips = '<div class="tabs"><button type="button" class="' + (S.bk.status === 'all' ? 'is-active' : '') + '" data-act="set" data-k="bk.status" data-v="all">All ' + all.length + '</button>' +
        A.STATUS_ORDER.map(function (k) { return '<button type="button" class="' + (S.bk.status === k ? 'is-active' : '') + '" data-act="set" data-k="bk.status" data-v="' + k + '">' + A.STATUS[k].l + ' ' + (counts[k] || 0) + '</button>'; }).join('') + '</div>';
      return '<section class="card"><div class="toolbar" style="margin-bottom:12px"><input class="input" type="search" placeholder="Search booking ID, name or phone" aria-label="Search bookings" data-f="bk.q" value="' + esc(S.bk.q) + '">' +
        '<select class="input" data-f="bk.range" aria-label="Date range"><option value="all"' + (S.bk.range === 'all' ? ' selected' : '') + '>Any time</option><option value="today"' + (S.bk.range === 'today' ? ' selected' : '') + '>Today</option><option value="7d"' + (S.bk.range === '7d' ? ' selected' : '') + '>Last 7 days</option><option value="30d"' + (S.bk.range === '30d' ? ' selected' : '') + '>Last 30 days</option></select>' +
        '<select class="input" data-f="bk.src" aria-label="Source"><option value="all"' + (S.bk.src === 'all' ? ' selected' : '') + '>All sources</option><option value="live"' + (S.bk.src === 'live' ? ' selected' : '') + '>Website orders</option><option value="demo"' + (S.bk.src === 'demo' ? ' selected' : '') + '>Demo data</option></select>' +
        '<button type="button" class="btn" data-act="bk-csv">Export CSV</button></div>' + chips + '<div id="results" style="margin-top:12px">' + bookingsResults() + '</div></section>';
    }
  };
  A.act['bk-csv'] = function () {
    var rows = [['Booking', 'Created', 'Visit date', 'Slot', 'Customer', 'Phone', 'City', 'Services', 'Subtotal', 'Discount', 'Visit fee', 'Total', 'Payment', 'Expert', 'Status', 'Source']];
    filteredBookings().forEach(function (b) {
      rows.push([b.id, new Date(b.created).toISOString(), b.date, b.slot, b.address.name, b.address.phone, b.address.city, b.items.map(function (i) { return i.name + ' x' + (i.qty || 1); }).join('; '),
        b.pricing.subtotal, b.pricing.discount, b.pricing.fee, b.pricing.total, b.pay, partnerName(b.partnerId) || '', b.status, b.source]);
    });
    var csv = A.csv(rows);
    $('#layer').innerHTML = '';
    A.drawer({ title: 'Export bookings (' + (rows.length - 1) + ')', body: '<p class="muted">Download the file, or copy the text and paste it into Excel or Google Sheets.</p><textarea class="input" rows="8" readonly id="csvbox">' + esc(csv) + '</textarea>',
      foot: '<button type="button" class="btn btn--primary" data-act="csv-download">Download CSV</button><button type="button" class="btn" data-act="csv-copy">Copy</button>' });
    A._csv = csv;
  };
  A.act['csv-download'] = function () { A.download('bharat-pro-expert-bookings.csv', A._csv, 'text/csv'); };
  A.act['csv-copy'] = function () { A.copy(A._csv, 'CSV copied'); };

  function pay(m) { return m === 'upi' ? 'UPI (paid online)' : 'Pay after service'; }
  A.act['bk-open'] = function (el) { openBooking(el.dataset.id); };
  function openBooking(id) {
    var b = A.booking(id); if (!b) { return; }
    var a = b.address || {}, sp = A.split(b), skill = (b.items[0] && b.items[0].id || '').split('-')[0];
    var ps = A.db().partners.filter(function (p) { return p.status === 'approved'; });
    var rec = ps.filter(function (p) { return p.skills.indexOf(skill) >= 0 && (!a.city || p.city === a.city); }), others = ps.filter(function (p) { return rec.indexOf(p) < 0; });
    var opt = function (p) { return '<option value="' + p.id + '"' + (b.partnerId === p.id ? ' selected' : '') + '>' + esc(p.name) + ' (' + esc(p.city) + ')</option>'; };
    var body = '<div><div class="section-title">Customer</div><dl class="kv"><dt>Name</dt><dd>' + esc(a.name || '-') + '</dd><dt>Phone</dt><dd>' + esc(a.phone || '-') + '</dd><dt>Address</dt><dd>' + esc([a.house, a.area, a.landmark, a.city, a.pincode].filter(Boolean).join(', ')) + '</dd><dt>Visit</dt><dd>' + A.fmtDay(b.date) + ', ' + esc(b.slot || '') + '</dd><dt>Payment</dt><dd>' + pay(b.pay) + '</dd><dt>Booked</dt><dd>' + A.fmtDateTime(b.created) + '</dd></dl></div>' +
      '<div><div class="section-title">Services</div><div class="list">' + b.items.map(function (i) { return '<div class="li"><span>' + esc(i.emoji || '') + '</span><span style="flex:1">' + esc(i.name) + (i.qty > 1 ? ' x' + i.qty : '') + '</span><span class="mono">' + inr((i.price || 0) * (i.qty || 1)) + '</span></div>'; }).join('') + '</div>' +
      '<dl class="kv" style="margin-top:8px"><dt>Subtotal</dt><dd>' + inr(b.pricing.subtotal) + '</dd><dt>Discount</dt><dd>' + (b.pricing.discount ? '-' + inr(b.pricing.discount) + (b.coupon ? ' (' + esc(b.coupon) + ')' : '') : '-') + '</dd><dt>Visit fee</dt><dd>' + (b.pricing.fee ? inr(b.pricing.fee) : 'Free') + '</dd><dt><b>Total</b></dt><dd><b>' + inr(b.pricing.total) + '</b></dd><dt>Commission</dt><dd>' + inr(sp.commission) + ' / expert share ' + inr(sp.partner) + '</dd></dl></div>' +
      '<form id="bkform" class="form" data-form="booking" data-id="' + esc(b.id) + '" novalidate><div class="section-title">Manage</div>' +
      fld('Status', 'status', b.status, { type: 'select', options: A.STATUS_ORDER.map(function (k) { return [k, A.STATUS[k].l]; }) }) +
      '<div class="field"><label for="f_partnerId">Assign expert</label><select class="input" id="f_partnerId" name="partnerId"><option value="">Unassigned</option>' +
      (rec.length ? '<optgroup label="Recommended (same city and skill)">' + rec.map(opt).join('') + '</optgroup>' : '') + (others.length ? '<optgroup label="Other approved experts">' + others.map(opt).join('') + '</optgroup>' : '') + '</select><div class="err" data-err="partnerId"></div></div>' +
      fld('Internal note', 'note', b.note || '', { type: 'textarea', rows: 3, ph: 'Only visible to the admin team' }) +
      (b.source === 'live' ? '<p class="note">This is a website order. Status changes are saved here in the admin panel. The customer tracking page keeps its own timeline until the backend is connected.</p>' : '') + '</form>';
    A.drawer({ title: esc(b.id) + ' ' + A.pill(b.status), body: body, foot: '<button type="submit" form="bkform" class="btn btn--primary">Save changes</button>' });
  }
  A.forms.booking = function (form) {
    var id = form.dataset.id, v = fd(form), b = A.booking(id), errs = {};
    var status = v.status, partnerId = v.partnerId || null;
    if ((status === 'completed' || status === 'inprogress' || status === 'enroute') && !partnerId) { errs.partnerId = 'Assign an expert before moving to this status.'; }
    if (!setErr(form, errs)) { return; }
    if (partnerId && (status === 'pending' || status === 'confirmed')) { status = 'assigned'; }
    var patch = { status: status, partnerId: partnerId, note: v.note.trim() };
    if (status === 'cancelled' && b.pay === 'upi' && b.refund === 'none') { patch.refund = 'due'; }
    A.setBooking(id, patch); A.closeDrawer(); A.toast('Booking ' + id + ' updated'); A.render();
  };

  /* =========================== SERVICES =========================== */
  function servicesResults() {
    var f = S.sv, q = f.q.trim().toLowerCase(), cats = A.allCategories(), cmap = {}; cats.forEach(function (c) { cmap[c.id] = c; });
    if (f.tab === 'categories') {
      var all = A.allServices();
      return tbl(['Category', 'Hindi name', 'Services', 'Live on website', ''], cats.map(function (c) {
        var n = all.filter(function (s) { return s.cat === c.id; }), act = n.filter(function (s) { return s.active; }).length;
        return '<tr><td><div class="row">' + tile(c) + '<div><div class="cell-main">' + esc(c.name) + '</div><div class="cell-sub">' + esc(c.blurb || '') + '</div></div></div></td><td>' + esc(c.nameHi || '') + '</td><td>' + act + ' active of ' + n.length + '</td><td>' + sw(c.active, 'cat-active', c.id, 'Show category on website') + '</td><td class="right"><button type="button" class="btn btn--sm" data-act="cat-edit" data-id="' + esc(c.id) + '">Edit</button></td></tr>';
      }).join(''), { min: 720 });
    }
    var list = A.allServices().filter(function (s) {
      if (f.cat !== 'all' && s.cat !== f.cat) { return false; }
      if (f.st === 'active' && !s.active) { return false; }
      if (f.st === 'hidden' && s.active) { return false; }
      return !q || (s.name + ' ' + (s.nameHi || '')).toLowerCase().indexOf(q) >= 0;
    });
    if (!list.length) { return empty('No services match', 'Change the filters or add a new service.'); }
    return '<div class="muted small" style="margin-bottom:8px">' + list.length + ' services</div>' + tbl(['Service', 'Category', 'Price', 'Time', 'Rating', 'On website', ''], list.map(function (s) {
      var c = cmap[s.cat] || { name: s.cat };
      return '<tr><td><div class="row">' + tile(c) + '<div><div class="cell-main">' + esc(s.name) + (s.custom ? ' <span class="tag-demo">New</span>' : '') + (s.edited ? ' <span class="tag-demo">Edited</span>' : '') + '</div><div class="cell-sub">' + esc(s.nameHi || '') + '</div></div></div></td><td>' + esc(c.name) + '</td>' +
        '<td class="mono"><b>' + inr(s.price) + '</b> <span class="muted" style="text-decoration:line-through">' + inr(s.mrp) + '</span></td><td>' + s.duration + ' min</td><td>' + (s.rating || '-') + ' <span class="muted small">(' + (s.reviews || 0) + ')</span></td>' +
        '<td>' + sw(s.active, 'svc-active', s.id, 'Show service on website') + '</td><td class="right"><button type="button" class="btn btn--sm" data-act="svc-edit" data-id="' + esc(s.id) + '">Edit</button></td></tr>';
    }).join(''), { min: 860 });
  }
  A.pages.services = {
    title: 'Services & categories', results: servicesResults,
    render: function () {
      var cats = A.allCategories();
      var tb = '<div class="toolbar" style="margin-bottom:12px">' + tabs('sv.tab', [['services', 'Services'], ['categories', 'Categories']], S.sv.tab);
      if (S.sv.tab === 'services') {
        tb += '<input class="input" type="search" placeholder="Search services" aria-label="Search services" data-f="sv.q" value="' + esc(S.sv.q) + '"><select class="input" data-f="sv.cat" aria-label="Category"><option value="all">All categories</option>' +
          cats.map(function (c) { return '<option value="' + esc(c.id) + '"' + (S.sv.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select><select class="input" data-f="sv.st" aria-label="Visibility"><option value="all">All</option><option value="active"' + (S.sv.st === 'active' ? ' selected' : '') + '>On website</option><option value="hidden"' + (S.sv.st === 'hidden' ? ' selected' : '') + '>Hidden</option></select><button type="button" class="btn btn--primary" data-act="svc-edit" data-id="">Add service</button>';
      } else { tb += '<button type="button" class="btn btn--primary" data-act="cat-edit" data-id="">Add category</button>'; }
      return '<section class="card">' + tb + '</div><p class="note" style="margin-bottom:12px">Changes here show on the customer website straight away, in this browser, until the backend is connected.</p><div id="results">' + servicesResults() + '</div></section>';
    }
  };
  function saveSvcPatch(id, patch) { var ov = A.ov(); ov.services = ov.services || {}; ov.services[id] = Object.assign(ov.services[id] || {}, patch); A.saveOv(ov); }
  A.chg['svc-active'] = function (el) { saveSvcPatch(el.dataset.id, { active: el.checked }); A.toast(el.checked ? 'Service is on the website' : 'Service hidden from the website'); A.render(); };
  A.chg['cat-active'] = function (el) {
    var ov = A.ov(); ov.categories = ov.categories || {}; ov.categories[el.dataset.id] = Object.assign(ov.categories[el.dataset.id] || {}, { active: el.checked }); A.saveOv(ov);
    A.toast(el.checked ? 'Category is on the website' : 'Category hidden from the website'); A.render();
  };
  A.act['svc-edit'] = function (el) {
    var id = el.dataset.id, s = id ? A.allServices().filter(function (x) { return x.id === id; })[0] : null, isNew = !s, cats = A.allCategories();
    s = s || { name: '', nameHi: '', emoji: '🧹', cat: cats[0].id, price: '', mrp: '', duration: 60, tag: '', desc: '', includes: [], excludes: [] };
    var body = '<form id="svcform" class="form form--2" data-form="service" data-id="' + esc(id) + '" novalidate>' +
      fld('Service name', 'name', s.name, { span: true }) + fld('Hindi name', 'nameHi', s.nameHi || '', { span: true }) +
      fld('Category', 'cat', s.cat, { type: 'select', options: cats.map(function (c) { return [c.id, c.name]; }), disabled: !isNew && !s.custom }) +
      fld('Emoji', 'emoji', s.emoji || '', { attrs: 'maxlength="4"' }) +
      fld('Selling price (₹)', 'price', s.price, { type: 'number', attrs: 'min="1" step="1" inputmode="numeric"' }) + fld('MRP / original price (₹)', 'mrp', s.mrp, { type: 'number', attrs: 'min="1" step="1" inputmode="numeric"' }) +
      fld('Duration (minutes)', 'duration', s.duration, { type: 'number', attrs: 'min="10" step="5" inputmode="numeric"' }) +
      fld('Badge', 'tag', s.tag || '', { type: 'select', options: [['', 'None'], ['Bestseller', 'Bestseller'], ['Popular', 'Popular'], ['New', 'New']] }) +
      fld('Description', 'desc', s.desc || '', { type: 'textarea', span: true, rows: 3 }) +
      fld("What's included (one per line)", 'includes', (s.includes || []).join('\n'), { type: 'textarea', span: true, rows: 4 }) +
      fld('Not included (one per line)', 'excludes', (s.excludes || []).join('\n'), { type: 'textarea', span: true, rows: 3 }) + '</form>';
    var foot = '<button type="submit" form="svcform" class="btn btn--primary">' + (isNew ? 'Add service' : 'Save service') + '</button>';
    if (!isNew && s.edited && !s.custom) { foot += '<button type="button" class="btn" data-act="svc-reset" data-id="' + esc(id) + '">Restore original</button>'; }
    if (s.custom) { foot += '<button type="button" class="btn btn--danger" data-act="svc-del" data-id="' + esc(id) + '">Delete</button>'; }
    A.drawer({ title: isNew ? 'Add service' : esc(s.name), body: body, foot: foot });
  };
  A.forms.service = function (form) {
    var id = form.dataset.id, v = fd(form), errs = {}, price = A.num(v.price), mrp = A.num(v.mrp), dur = A.num(v.duration);
    if (!v.name.trim()) { errs.name = 'Enter the service name.'; }
    if (price <= 0) { errs.price = 'Enter a price above 0.'; }
    if (mrp < price) { errs.mrp = 'MRP must be the same as or higher than the price.'; }
    if (dur < 10) { errs.duration = 'Duration must be at least 10 minutes.'; }
    if (!setErr(form, errs)) { return; }
    var patch = { name: v.name.trim(), nameHi: v.nameHi.trim(), emoji: v.emoji.trim() || '🧹', price: Math.round(price), mrp: Math.round(mrp), duration: Math.round(dur), tag: v.tag, desc: v.desc.trim(), includes: A.lines(v.includes), excludes: A.lines(v.excludes) };
    var ov = A.ov();
    if (!id) {
      ov.addedServices = ov.addedServices || [];
      var nid = v.cat + '-' + (A.slug(patch.name) || 'service') + '-' + Date.now().toString(36).slice(-3);
      ov.addedServices.push(Object.assign({ id: nid, cat: v.cat, nameHi: patch.nameHi, rating: 4.5, reviews: 0, faqs: [] }, patch));
      A.saveOv(ov); A.toast('Service added to the website');
    } else if ((ov.addedServices || []).some(function (s) { return s.id === id; })) {
      ov.addedServices = ov.addedServices.map(function (s) { return s.id === id ? Object.assign({}, s, patch, { cat: v.cat }) : s; }); A.saveOv(ov); A.toast('Service saved');
    } else { saveSvcPatch(id, patch); A.toast('Service saved'); }
    A.closeDrawer(); A.render();
  };
  A.act['svc-reset'] = function (el) { var ov = A.ov(); if (ov.services) { delete ov.services[el.dataset.id]; } A.saveOv(ov); A.closeDrawer(); A.toast('Original service restored'); A.render(); };
  A.act['svc-del'] = function (el) {
    var ov = A.ov(); ov.addedServices = (ov.addedServices || []).filter(function (s) { return s.id !== el.dataset.id; }); A.saveOv(ov); A.closeDrawer(); A.toast('Service deleted'); A.render();
  };
  A.act['cat-edit'] = function (el) {
    var id = el.dataset.id, c = id ? A.allCategories().filter(function (x) { return x.id === id; })[0] : null, isNew = !c;
    c = c || { name: '', nameHi: '', emoji: '🧹', g1: '#34C759', g2: '#30B0C7', blurb: '' };
    var body = '<form id="catform" class="form form--2" data-form="category" data-id="' + esc(id) + '" novalidate>' + fld('Category name', 'name', c.name, { span: true }) + fld('Hindi name', 'nameHi', c.nameHi || '', { span: true }) + fld('Emoji', 'emoji', c.emoji || '', { attrs: 'maxlength="4"' }) +
      (isNew || c.custom ? fld('Short description', 'blurb', c.blurb || '', {}) + fld('Colour 1', 'g1', c.g1, { type: 'color' }) + fld('Colour 2', 'g2', c.g2, { type: 'color' }) : '') + '</form>';
    var foot = '<button type="submit" form="catform" class="btn btn--primary">' + (isNew ? 'Add category' : 'Save category') + '</button>';
    if (c.custom) { foot += '<button type="button" class="btn btn--danger" data-act="cat-del" data-id="' + esc(id) + '">Delete</button>'; }
    A.drawer({ title: isNew ? 'Add category' : esc(c.name), body: body, foot: foot });
  };
  A.forms.category = function (form) {
    var id = form.dataset.id, v = fd(form), errs = {};
    if (!v.name.trim()) { errs.name = 'Enter the category name.'; }
    if (!setErr(form, errs)) { return; }
    var ov = A.ov();
    if (!id) {
      var nid = A.slug(v.name) || A.uid('c'); if (A.allCategories().some(function (c) { return c.id === nid; })) { nid += '-' + Date.now().toString(36).slice(-3); }
      ov.addedCategories = (ov.addedCategories || []).concat([{ id: nid, name: v.name.trim(), nameHi: v.nameHi.trim(), emoji: v.emoji.trim() || '🧹', g1: v.g1, g2: v.g2, blurb: v.blurb.trim() }]);
      A.toast('Category added. Add services to show it on the website.');
    } else if ((ov.addedCategories || []).some(function (c) { return c.id === id; })) {
      ov.addedCategories = ov.addedCategories.map(function (c) { return c.id === id ? Object.assign({}, c, { name: v.name.trim(), nameHi: v.nameHi.trim(), emoji: v.emoji.trim() || c.emoji, g1: v.g1, g2: v.g2, blurb: v.blurb.trim() }) : c; }); A.toast('Category saved');
    } else { ov.categories = ov.categories || {}; ov.categories[id] = Object.assign(ov.categories[id] || {}, { name: v.name.trim(), nameHi: v.nameHi.trim(), emoji: v.emoji.trim() }); A.toast('Category saved'); }
    A.saveOv(ov); A.closeDrawer(); A.render();
  };
  A.act['cat-del'] = function (el) {
    var ov = A.ov(), id = el.dataset.id; ov.addedCategories = (ov.addedCategories || []).filter(function (c) { return c.id !== id; });
    ov.addedServices = (ov.addedServices || []).filter(function (s) { return s.cat !== id; }); A.saveOv(ov); A.closeDrawer(); A.toast('Category deleted'); A.render();
  };

  /* =========================== PARTNERS =========================== */
  function partnerList() {
    var bks = A.bookings(), q = S.pt.q.trim().toLowerCase(), t = S.pt.tab;
    return A.db().partners.filter(function (p) {
      if (t === 'pending' && p.status !== 'pending') { return false; }
      if (t === 'approved' && p.status !== 'approved') { return false; }
      if (t === 'other' && p.status !== 'suspended' && p.status !== 'rejected') { return false; }
      return !q || (p.name + ' ' + p.phone + ' ' + p.city).toLowerCase().indexOf(q) >= 0;
    }).map(function (p) { return [p, A.partnerStats(p, bks)]; });
  }
  function partnersResults() {
    var list = partnerList();
    if (!list.length) { return empty(S.pt.tab === 'pending' ? 'No applications waiting' : 'No experts here', S.pt.tab === 'pending' ? 'Experts who sign up on the website appear here for review.' : 'Change the tab or search.'); }
    return tbl(['Expert', 'City', 'Skills', 'Experience', 'Rating', 'Jobs', 'Earned', 'Status'], list.map(function (x) {
      var p = x[0], st = x[1], kyc = A.KYC.filter(function (k) { return p.kyc && p.kyc[k[0]]; }).length;
      return '<tr data-act="pt-open" data-id="' + esc(p.id) + '"><td><div class="cell-main">' + esc(p.name) + (p.source === 'demo' ? ' <span class="tag-demo">Demo</span>' : '') + (p.source === 'signup' ? ' <span class="tag-demo">Website</span>' : '') + '</div><div class="cell-sub">' + esc(p.phone) + '</div></td><td>' + esc(p.city) + '</td>' +
        '<td>' + esc(p.skills.map(A.catName).join(', ') || '-') + '</td><td>' + esc(p.exp) + ' yrs</td><td>' + (p.rating ? p.rating.toFixed(1) : '-') + '</td><td>' + st.jobs + '</td><td class="mono">' + inr(st.earned) + '</td>' +
        '<td>' + A.pill(p.status, A.PSTATUS) + (p.status === 'pending' ? '<div class="cell-sub">KYC ' + kyc + '/' + A.KYC.length + '</div>' : '') + '</td></tr>';
    }).join(''), { min: 900 });
  }
  A.pages.partners = {
    title: 'Experts', results: partnersResults,
    render: function () {
      var ps = A.db().partners, c = function (s) { return ps.filter(function (p) { return p.status === s; }).length; };
      return '<section class="card"><div class="toolbar" style="margin-bottom:12px">' + tabs('pt.tab', [['pending', 'Applications ' + c('pending')], ['approved', 'Approved ' + c('approved')], ['other', 'Suspended / rejected ' + (c('suspended') + c('rejected'))], ['all', 'All ' + ps.length]], S.pt.tab) +
        '<input class="input" type="search" placeholder="Search name, phone or city" aria-label="Search experts" data-f="pt.q" value="' + esc(S.pt.q) + '"><button type="button" class="btn btn--primary" data-act="pt-add">Add expert</button></div><div id="results">' + partnersResults() + '</div></section>';
    }
  };
  A.act['pt-open'] = function (el) { openPartner(el.dataset.id); };
  function openPartner(id) {
    var p = A.partner(id); if (!p) { return; }
    var st = A.partnerStats(p), done = A.KYC.filter(function (k) { return p.kyc[k[0]]; }).length, ready = done === A.KYC.length;
    var body = '<dl class="kv"><dt>Phone</dt><dd>' + esc(p.phone) + '</dd><dt>City</dt><dd>' + esc(p.city) + '</dd><dt>Skills</dt><dd>' + esc(p.skills.map(A.catName).join(', ') || '-') + '</dd><dt>Experience</dt><dd>' + esc(p.exp) + ' years</dd><dt>Applied</dt><dd>' + A.fmtDate(p.at) + '</dd><dt>Rating</dt><dd>' + (p.rating ? p.rating.toFixed(1) + ' / 5' : 'No ratings yet') + '</dd><dt>Jobs done</dt><dd>' + st.jobs + '</dd><dt>Earned</dt><dd>' + inr(st.earned) + ' (paid ' + inr(st.paid) + ', due ' + inr(st.due) + ')</dd></dl>' +
      '<div><div class="section-title">Verification checklist (' + done + ' of ' + A.KYC.length + ')</div><div class="checklist">' + A.KYC.map(function (k) { return '<label><input type="checkbox" data-chg="kyc" data-id="' + esc(p.id) + '" data-k="' + k[0] + '"' + (p.kyc[k[0]] ? ' checked' : '') + '> ' + esc(k[1]) + '</label>'; }).join('') + '</div><p class="note" style="margin-top:8px">Only the check status is stored here. Do not type ID numbers into this panel.</p></div>';
    var foot = '';
    if (p.status === 'pending' || p.status === 'rejected') { foot += '<button type="button" class="btn btn--primary" data-act="pt-status" data-id="' + esc(p.id) + '" data-v="approved"' + (ready ? '' : ' disabled title="Complete all checks first"') + '>Approve expert</button>'; }
    if (p.status === 'pending') { foot += '<button type="button" class="btn btn--danger" data-act="pt-status" data-id="' + esc(p.id) + '" data-v="rejected">Reject</button>'; }
    if (p.status === 'approved') { foot += '<button type="button" class="btn btn--danger" data-act="pt-status" data-id="' + esc(p.id) + '" data-v="suspended">Suspend</button>'; }
    if (p.status === 'suspended') { foot += '<button type="button" class="btn btn--ok" data-act="pt-status" data-id="' + esc(p.id) + '" data-v="approved">Reactivate</button>'; }
    if (!ready && (p.status === 'pending' || p.status === 'rejected')) { body += '<p class="muted small">Approve is available after all verification checks are ticked.</p>'; }
    A.drawer({ title: esc(p.name) + ' ' + A.pill(p.status, A.PSTATUS), body: body, foot: foot });
  }
  A.chg.kyc = function (el) { var p = A.partner(el.dataset.id); p.kyc[el.dataset.k] = el.checked; A.saveDb(); openPartner(p.id); A.render(); };
  A.act['pt-status'] = function (el) {
    var p = A.partner(el.dataset.id); p.status = el.dataset.v; if (p.status === 'approved' && !p.rating) { p.rating = 0; } A.saveDb();
    A.toast(p.name + ': ' + A.PSTATUS[p.status].l); openPartner(p.id); A.render();
  };
  A.act['pt-add'] = function () {
    var cats = A.allCategories();
    A.drawer({ title: 'Add expert', body: '<form id="ptform" class="form form--2" data-form="partner" novalidate>' + fld('Full name', 'name', '', { span: true }) + fld('Mobile number', 'phone', '', { attrs: 'inputmode="numeric" maxlength="10"' }) +
      fld('City', 'city', A.cities()[0], { type: 'select', options: A.cities().map(function (c) { return [c, c]; }) }) + fld('Experience (years)', 'exp', '1', { type: 'number', attrs: 'min="0" max="50"' }) +
      '<div class="field span2"><label>Skills</label><div class="checklist">' + cats.map(function (c) { return '<label><input type="checkbox" name="skills" value="' + esc(c.id) + '"> ' + esc(c.emoji) + ' ' + esc(c.name) + '</label>'; }).join('') + '</div><div class="err" data-err="skills"></div></div></form>',
      foot: '<button type="submit" form="ptform" class="btn btn--primary">Add expert</button>' });
  };
  A.forms.partner = function (form) {
    var v = fd(form), errs = {}, skills = A.$$('input[name="skills"]:checked', form).map(function (x) { return x.value; });
    if (!v.name.trim()) { errs.name = 'Enter the name.'; }
    if (!/^[6-9]\d{9}$/.test(v.phone.trim())) { errs.phone = 'Enter a valid 10 digit mobile number.'; }
    if (!skills.length) { errs.skills = 'Pick at least one skill.'; }
    if (!setErr(form, errs)) { return; }
    var kyc = {}; A.KYC.forEach(function (k) { kyc[k[0]] = false; });
    A.db().partners.push({ id: A.uid('P'), name: v.name.trim(), phone: v.phone.trim(), city: v.city, skills: skills, exp: v.exp || '0', status: 'pending', kyc: kyc, rating: 0, source: 'manual', at: Date.now() });
    A.saveDb(); S.pt.tab = 'pending'; A.closeDrawer(); A.toast('Expert added to applications'); A.render();
  };

  /* =========================== CUSTOMERS =========================== */
  function customerList() {
    var map = {}, q = S.cu.q.trim().toLowerCase();
    A.bookings().forEach(function (b) {
      var k = b.address.phone || b.address.name || b.id, c = map[k] || (map[k] = { phone: b.address.phone || '', name: b.address.name || '-', city: b.address.city || '', orders: [], spend: 0, last: 0, demo: b.source === 'demo' });
      c.orders.push(b); c.last = Math.max(c.last, b.created); if (b.status === 'completed') { c.spend += b.pricing.total; }
    });
    return Object.keys(map).map(function (k) { return map[k]; }).filter(function (c) { return !q || (c.name + ' ' + c.phone + ' ' + c.city).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return b.last - a.last; });
  }
  function customersResults() {
    var l = customerList(); if (!l.length) { return empty('No customers yet', 'Customers appear after their first booking.'); }
    return tbl(['Customer', 'City', 'Bookings', 'Completed spend', 'Last booking'], l.map(function (c) {
      return '<tr data-act="cu-open" data-id="' + esc(c.phone || c.name) + '"><td><div class="cell-main">' + esc(c.name) + (c.demo ? ' <span class="tag-demo">Demo</span>' : '') + '</div><div class="cell-sub">' + esc(c.phone) + '</div></td><td>' + esc(c.city) + '</td><td>' + c.orders.length + '</td><td class="mono">' + inr(c.spend) + '</td><td>' + A.fmtDate(c.last) + '</td></tr>';
    }).join(''), { min: 640 });
  }
  A.pages.customers = {
    title: 'Customers', results: customersResults,
    render: function () { return '<section class="card"><div class="toolbar" style="margin-bottom:12px"><input class="input" type="search" placeholder="Search name, phone or city" aria-label="Search customers" data-f="cu.q" value="' + esc(S.cu.q) + '"></div><div id="results">' + customersResults() + '</div></section>'; }
  };
  A.act['cu-open'] = function (el) {
    var c = customerList().filter(function (x) { return (x.phone || x.name) === el.dataset.id; })[0]; if (!c) { return; }
    A.drawer({ title: esc(c.name), body: '<dl class="kv"><dt>Phone</dt><dd>' + esc(c.phone) + '</dd><dt>City</dt><dd>' + esc(c.city) + '</dd><dt>Bookings</dt><dd>' + c.orders.length + '</dd><dt>Spend</dt><dd>' + inr(c.spend) + '</dd></dl><div><div class="section-title">Booking history</div><div class="list">' +
      c.orders.map(function (b) { return '<div class="li"><div style="flex:1;min-width:0"><div class="cell-main">' + esc(b.id) + '</div><div class="cell-sub">' + esc(b.items.map(function (i) { return i.name; }).join(', ')) + '</div></div><div class="right"><div class="mono">' + inr(b.pricing.total) + '</div>' + A.pill(b.status) + '</div></div>'; }).join('') + '</div></div>' });
  };

  /* =========================== PAYMENTS =========================== */
  A.pages.payments = {
    title: 'Payments & payouts',
    results: function () { return payResults(); },
    render: function () {
      var bks = A.bookings(), done = bks.filter(function (b) { return b.status === 'completed'; }), g = 0, c = 0, e = 0;
      done.forEach(function (b) { var s = A.split(b); g += s.gross; c += s.commission; e += s.partner; });
      var paid = A.db().payouts.reduce(function (n, p) { return n + p.amount; }, 0), due = Math.max(0, e - paid);
      var k = function (l, v, s) { return '<div class="kpi"><div class="kpi__label">' + l + '</div><div class="kpi__value">' + v + '</div><div class="kpi__sub">' + s + '</div></div>'; };
      return '<div class="kpis">' + k('Gross value', inr(g), done.length + ' completed jobs') + k('Commission', inr(c), A.db().settings.commission + '% platform share') + k('Expert earnings', inr(e), 'After commission') + k('Paid out', inr(paid), A.db().payouts.length + ' payouts') + k('Payouts due', inr(due), 'Owed to experts') + '</div>' +
        '<section class="card"><div class="toolbar" style="margin-bottom:12px">' + tabs('pay.tab', [['payouts', 'Expert payouts'], ['transactions', 'Transactions'], ['refunds', 'Refunds']], S.pay.tab) + '</div><div id="results">' + payResults() + '</div></section>';
    }
  };
  function payResults() {
    var bks = A.bookings(), t = S.pay.tab;
    if (t === 'payouts') {
      var rows = A.db().partners.filter(function (p) { return p.status === 'approved' || A.partnerStats(p, bks).earned > 0; }).map(function (p) { return [p, A.partnerStats(p, bks)]; });
      if (!rows.length) { return empty('No experts to pay yet'); }
      return tbl(['Expert', 'Jobs', 'Earned', 'Paid', 'Due', ''], rows.map(function (x) {
        return '<tr><td><div class="cell-main">' + esc(x[0].name) + '</div><div class="cell-sub">' + esc(x[0].city) + '</div></td><td>' + x[1].jobs + '</td><td class="mono">' + inr(x[1].earned) + '</td><td class="mono">' + inr(x[1].paid) + '</td><td class="mono"><b>' + inr(x[1].due) + '</b></td><td class="right"><button type="button" class="btn btn--sm btn--primary" data-act="payout" data-id="' + esc(x[0].id) + '"' + (x[1].due ? '' : ' disabled') + '>Record payout</button></td></tr>';
      }).join(''), { min: 720 }) + payoutHistory();
    }
    if (t === 'transactions') {
      var d = bks.filter(function (b) { return b.status === 'completed'; });
      if (!d.length) { return empty('No completed jobs yet'); }
      return tbl(['Booking', 'Date', 'Customer', 'Payment', 'Gross', 'Commission', 'Expert share'], d.slice(0, 150).map(function (b) {
        var s = A.split(b); return '<tr data-act="bk-open" data-id="' + esc(b.id) + '"><td class="cell-main">' + esc(b.id) + '</td><td>' + A.fmtDate(b.created) + '</td><td>' + esc(b.address.name || '-') + '</td><td>' + pay(b.pay) + '</td><td class="mono">' + inr(s.gross) + '</td><td class="mono">' + inr(s.commission) + '</td><td class="mono">' + inr(s.partner) + '</td></tr>';
      }).join(''), { min: 800 });
    }
    var r = bks.filter(function (b) { return b.status === 'cancelled' && b.pay === 'upi'; });
    if (!r.length) { return empty('No refunds to process', 'Cancelled bookings paid online appear here.'); }
    return tbl(['Booking', 'Customer', 'Amount', 'Refund', ''], r.map(function (b) {
      var done = b.refund === 'done';
      return '<tr><td class="cell-main">' + esc(b.id) + '</td><td>' + esc(b.address.name || '-') + '</td><td class="mono">' + inr(b.pricing.total) + '</td><td>' + A.pill(done ? 'done' : 'due', { done: { l: 'Refunded', c: 'green' }, due: { l: 'Refund due', c: 'orange' } }) + '</td><td class="right">' + (done ? '' : '<button type="button" class="btn btn--sm btn--primary" data-act="refund" data-id="' + esc(b.id) + '">Mark refunded</button>') + '</td></tr>';
    }).join(''), { min: 640 });
  }
  function payoutHistory() {
    var l = A.db().payouts.slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 8); if (!l.length) { return ''; }
    return '<div class="section-title" style="margin-top:18px">Recent payouts</div><div class="list">' + l.map(function (p) {
      var pp = A.partner(p.partnerId); return '<div class="li"><div style="flex:1"><div class="cell-main">' + esc(pp ? pp.name : 'Expert') + '</div><div class="cell-sub">' + A.fmtDateTime(p.at) + (p.ref ? ' · Ref ' + esc(p.ref) : '') + '</div></div><div class="mono"><b>' + inr(p.amount) + '</b></div></div>';
    }).join('') + '</div>';
  }
  A.act.payout = function (el) {
    var p = A.partner(el.dataset.id), st = A.partnerStats(p);
    A.drawer({ title: 'Payout to ' + esc(p.name), body: '<p class="muted">Due now: <b>' + inr(st.due) + '</b>. Pay the expert from your bank or UPI, then record it here.</p><form id="poform" class="form" data-form="payout" data-id="' + esc(p.id) + '" novalidate>' +
      fld('Amount paid (₹)', 'amount', st.due, { type: 'number', attrs: 'min="1" max="' + st.due + '" step="1" inputmode="numeric"' }) + fld('Payment reference (UTR / UPI ID)', 'ref', '', { ph: 'Optional' }) + '</form>',
      foot: '<button type="submit" form="poform" class="btn btn--primary">Record payout</button>' });
  };
  A.forms.payout = function (form) {
    var p = A.partner(form.dataset.id), st = A.partnerStats(p), v = fd(form), amt = Math.round(A.num(v.amount)), errs = {};
    if (amt <= 0) { errs.amount = 'Enter an amount above 0.'; } else if (amt > st.due) { errs.amount = 'This is more than the ' + inr(st.due) + ' due.'; }
    if (!setErr(form, errs)) { return; }
    A.db().payouts.push({ id: A.uid('PO'), partnerId: p.id, amount: amt, ref: v.ref.trim(), at: Date.now(), demo: p.source === 'demo' }); A.saveDb();
    A.closeDrawer(); A.toast('Payout of ' + inr(amt) + ' recorded'); A.render();
  };
  A.act.refund = function (el) { A.setBooking(el.dataset.id, { refund: 'done' }); A.toast('Marked as refunded'); A.render(); };

  /* =========================== OFFERS =========================== */
  A.pages.offers = {
    title: 'Offers & coupons',
    render: function () {
      var l = A.coupons();
      return '<section class="card"><div class="card__head"><h2>Coupons</h2><button type="button" class="btn btn--primary" data-act="cp-edit" data-id="">Add coupon</button></div><p class="note" style="margin-bottom:12px">Percentage coupons are capped at ₹150 off by the website. Changes show on the website straight away, in this browser.</p>' +
        (l.length ? tbl(['Code', 'Offer', 'Minimum order', 'Active', ''], l.map(function (c) {
          return '<tr><td class="cell-main">' + esc(c.code) + '</td><td>' + (c.type === 'flat' ? 'Flat ' + inr(c.value) + ' off' : c.value + '% off (up to ₹150)') + '<div class="cell-sub">' + esc(c.label || '') + '</div></td><td class="mono">' + inr(c.min) + '</td><td>' + sw(c.active !== false, 'cp-active', c.code, 'Coupon active') + '</td><td class="right"><button type="button" class="btn btn--sm" data-act="cp-edit" data-id="' + esc(c.code) + '">Edit</button></td></tr>';
        }).join(''), { min: 640 }) : empty('No coupons', 'Add a coupon to give customers a discount.')) + '</section>';
    }
  };
  function saveCoupons(l) { var ov = A.ov(); ov.coupons = l; A.saveOv(ov); }
  A.chg['cp-active'] = function (el) { saveCoupons(A.coupons().map(function (c) { return c.code === el.dataset.id ? Object.assign({}, c, { active: el.checked }) : c; })); A.toast(el.checked ? 'Coupon is active' : 'Coupon switched off'); A.render(); };
  A.act['cp-edit'] = function (el) {
    var code = el.dataset.id, c = code ? A.coupons().filter(function (x) { return x.code === code; })[0] : null, isNew = !c;
    c = c || { code: '', label: '', type: 'flat', value: '', min: 0 };
    A.drawer({ title: isNew ? 'Add coupon' : esc(c.code), body: '<form id="cpform" class="form form--2" data-form="coupon" data-id="' + esc(code) + '" novalidate>' + fld('Coupon code', 'code', c.code, { attrs: 'maxlength="12" style="text-transform:uppercase"', hint: 'Letters and numbers only, 3 to 12 characters.' }) +
      fld('Type', 'type', c.type, { type: 'select', options: [['flat', 'Flat amount off'], ['pct', 'Percentage off']] }) + fld('Value (₹ or %)', 'value', c.value, { type: 'number', attrs: 'min="1" step="1" inputmode="numeric"' }) + fld('Minimum order (₹)', 'min', c.min, { type: 'number', attrs: 'min="0" step="1" inputmode="numeric"' }) +
      fld('Description shown to customers', 'label', c.label || '', { span: true }) + '</form>',
      foot: '<button type="submit" form="cpform" class="btn btn--primary">' + (isNew ? 'Add coupon' : 'Save coupon') + '</button>' + (isNew ? '' : '<button type="button" class="btn btn--danger" data-act="cp-del" data-id="' + esc(code) + '">Delete</button>') });
  };
  A.forms.coupon = function (form) {
    var old = form.dataset.id, v = fd(form), code = v.code.trim().toUpperCase(), val = A.num(v.value), errs = {}, l = A.coupons();
    if (!/^[A-Z0-9]{3,12}$/.test(code)) { errs.code = 'Use 3 to 12 letters or numbers.'; } else if (code !== old && l.some(function (c) { return c.code === code; })) { errs.code = 'This code already exists.'; }
    if (val <= 0) { errs.value = 'Enter a value above 0.'; } else if (v.type === 'pct' && val > 100) { errs.value = 'A percentage cannot be above 100.'; }
    if (!setErr(form, errs)) { return; }
    var item = { code: code, label: v.label.trim() || (v.type === 'flat' ? 'Flat ₹' + val + ' off' : val + '% off'), type: v.type, value: val, min: Math.max(0, Math.round(A.num(v.min))), active: true };
    if (old) { l = l.map(function (c) { return c.code === old ? Object.assign({}, c, item, { active: c.active !== false }) : c; }); } else { l.push(item); }
    saveCoupons(l); A.closeDrawer(); A.toast('Coupon saved'); A.render();
  };
  A.act['cp-del'] = function (el) { saveCoupons(A.coupons().filter(function (c) { return c.code !== el.dataset.id; })); A.closeDrawer(); A.toast('Coupon deleted'); A.render(); };

  /* =========================== CONTENT (home banners) =========================== */
  A.pages.content = {
    title: 'Home banners',
    render: function () {
      var sl = A.slides(), pr = A.promo(), cats = A.allCategories();
      return '<section class="card"><div class="card__head"><h2>Hero slides</h2><button type="button" class="btn btn--primary" data-act="sl-edit" data-i="-1">Add slide</button></div><div class="list">' +
        sl.map(function (s, i) {
          return '<div class="li" style="align-items:flex-start;flex-wrap:wrap"><div style="flex:1 1 280px;min-width:0"><div class="slide-prev" style="background:linear-gradient(135deg,' + esc(s.g1) + ',' + esc(s.g2) + ')"><div><b>' + esc(s.title) + '</b><span style="opacity:.9;font-size:12px">' + esc(s.sub) + '</span></div><span class="e">' + esc(s.emoji) + '</span></div></div>' +
            '<div class="rowwrap"><button type="button" class="btn btn--sm" data-act="sl-move" data-i="' + i + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">↑</button><button type="button" class="btn btn--sm" data-act="sl-move" data-i="' + i + '" data-d="1"' + (i === sl.length - 1 ? ' disabled' : '') + ' aria-label="Move down">↓</button><button type="button" class="btn btn--sm" data-act="sl-edit" data-i="' + i + '">Edit</button></div></div>';
        }).join('') + '</div><div class="rowwrap" style="margin-top:12px"><button type="button" class="btn btn--sm" data-act="sl-reset">Restore original slides</button></div></section>' +
        '<section class="card"><div class="card__head"><h2>Promo banner</h2></div><form id="prform" class="form form--2" data-form="promo" novalidate>' + fld('Title', 'title', pr.title, { span: true }) + fld('Subtitle', 'sub', pr.sub, { span: true }) + fld('Button text', 'cta', pr.cta) +
        fld('Coupon code', 'code', pr.code, { type: 'select', options: A.coupons().map(function (c) { return [c.code, c.code]; }) }) + '<div class="span2"><button class="btn btn--primary" type="submit">Save promo banner</button></div></form></section>';
    }
  };
  function saveSlides(l) { var ov = A.ov(); ov.heroSlides = l; A.saveOv(ov); }
  A.act['sl-move'] = function (el) { var l = A.slides(), i = +el.dataset.i, j = i + +el.dataset.d, t = l[i]; l[i] = l[j]; l[j] = t; saveSlides(l); A.render(); };
  A.act['sl-reset'] = function () { var ov = A.ov(); delete ov.heroSlides; A.saveOv(ov); A.toast('Original slides restored'); A.render(); };
  A.act['sl-edit'] = function (el) {
    var i = +el.dataset.i, l = A.slides(), s = i >= 0 ? l[i] : { title: '', sub: '', cta: 'Book now', cat: A.allCategories()[0].id, emoji: '🧹', g1: '#34C759', g2: '#30B0C7' };
    A.drawer({ title: i >= 0 ? 'Edit slide' : 'Add slide', body: '<form id="slform" class="form form--2" data-form="slide" data-i="' + i + '" novalidate>' + fld('Headline', 'title', s.title, { span: true }) + fld('Subtitle', 'sub', s.sub, { span: true }) + fld('Button text', 'cta', s.cta) +
      fld('Opens category', 'cat', s.cat, { type: 'select', options: A.allCategories().map(function (c) { return [c.id, c.name]; }) }) + fld('Emoji', 'emoji', s.emoji, { attrs: 'maxlength="4"' }) + '<div></div>' + fld('Colour 1', 'g1', s.g1, { type: 'color' }) + fld('Colour 2', 'g2', s.g2, { type: 'color' }) + '</form>',
      foot: '<button type="submit" form="slform" class="btn btn--primary">Save slide</button>' + (i >= 0 && l.length > 1 ? '<button type="button" class="btn btn--danger" data-act="sl-del" data-i="' + i + '">Delete</button>' : '') });
  };
  A.forms.slide = function (form) {
    var i = +form.dataset.i, v = fd(form), errs = {}, l = A.slides();
    if (!v.title.trim()) { errs.title = 'Enter a headline.'; }
    if (!setErr(form, errs)) { return; }
    var item = { id: i >= 0 ? l[i].id : A.uid('h'), title: v.title.trim(), sub: v.sub.trim(), cta: v.cta.trim() || 'Book now', cat: v.cat, emoji: v.emoji.trim() || '🧹', g1: v.g1, g2: v.g2 };
    if (i >= 0) { l[i] = item; } else { l.push(item); }
    saveSlides(l); A.closeDrawer(); A.toast('Slide saved'); A.render();
  };
  A.act['sl-del'] = function (el) { var l = A.slides(); l.splice(+el.dataset.i, 1); saveSlides(l); A.closeDrawer(); A.toast('Slide deleted'); A.render(); };
  A.forms.promo = function (form) {
    var v = fd(form), errs = {}; if (!v.title.trim()) { errs.title = 'Enter a title.'; } if (!setErr(form, errs)) { return; }
    var ov = A.ov(); ov.promo = { title: v.title.trim(), sub: v.sub.trim(), cta: v.cta.trim() || 'Claim Offer', code: v.code }; A.saveOv(ov); A.toast('Promo banner saved'); A.render();
  };

  /* =========================== CITIES =========================== */
  A.pages.cities = {
    title: 'Cities',
    render: function () {
      var l = A.cities(), bks = A.bookings(), cnt = {}; bks.forEach(function (b) { var c = b.address.city; if (c) { cnt[c] = (cnt[c] || 0) + 1; } });
      return '<section class="card"><div class="card__head"><h2>Service cities</h2></div><p class="note" style="margin-bottom:12px">These cities appear in the website city picker and in the expert signup form.</p>' +
        '<form class="toolbar" data-form="city" style="margin-bottom:12px" novalidate><input class="input" id="f_city" name="city" placeholder="Add a city, for example Muzaffarpur" aria-label="New city" maxlength="40"><button class="btn btn--primary" type="submit">Add city</button><span class="err" data-err="city" style="color:var(--red);font-size:12px"></span></form>' +
        '<div class="list">' + l.map(function (c, i) {
          return '<div class="li"><span>📍</span><div style="flex:1"><div class="cell-main">' + esc(c) + '</div><div class="cell-sub">' + (cnt[c] || 0) + ' bookings</div></div><button type="button" class="btn btn--sm btn--danger" data-act="city-del" data-i="' + i + '"' + (l.length < 2 ? ' disabled' : '') + '>Remove</button></div>';
        }).join('') + '</div><div class="rowwrap" style="margin-top:12px"><button type="button" class="btn btn--sm" data-act="city-reset">Restore original cities</button></div></section>';
    }
  };
  function saveCities(l) { var ov = A.ov(); ov.cities = l; A.saveOv(ov); }
  A.forms.city = function (form) {
    var v = fd(form), c = v.city.trim(), l = A.cities(), errs = {};
    if (!c) { errs.city = 'Enter a city name.'; } else if (l.some(function (x) { return x.toLowerCase() === c.toLowerCase(); })) { errs.city = 'This city is already in the list.'; }
    if (!setErr(form, errs)) { return; } l.push(c); saveCities(l); A.toast('City added'); A.render();
  };
  A.act['city-del'] = function (el) { var l = A.cities(); l.splice(+el.dataset.i, 1); saveCities(l); A.toast('City removed'); A.render(); };
  A.act['city-reset'] = function () { var ov = A.ov(); delete ov.cities; A.saveOv(ov); A.toast('Original cities restored'); A.render(); };

  /* =========================== SUPPORT =========================== */
  var TS = { open: { l: 'Open', c: 'orange' }, inprogress: { l: 'In progress', c: 'blue' }, resolved: { l: 'Resolved', c: 'green' } };
  A.pages.support = {
    title: 'Support & reviews',
    render: function () {
      var db = A.db(), body;
      if (S.sp.tab === 'tickets') {
        body = '<div class="card__head"><h2>Tickets</h2><button type="button" class="btn btn--primary" data-act="tk-edit" data-id="">New ticket</button></div>' + (db.tickets.length ? tbl(['Ticket', 'Customer', 'Booking', 'Priority', 'Status'], db.tickets.slice().sort(function (a, b) { return b.at - a.at; }).map(function (t) {
          return '<tr data-act="tk-edit" data-id="' + esc(t.id) + '"><td><div class="cell-main">' + esc(t.subject) + (t.demo ? ' <span class="tag-demo">Demo</span>' : '') + '</div><div class="cell-sub">' + A.fmtDateTime(t.at) + '</div></td><td>' + esc(t.customer) + '<div class="cell-sub">' + esc(t.phone) + '</div></td><td>' + esc(t.bookingId || '-') + '</td><td>' + esc(t.priority) + '</td><td>' + A.pill(t.status, TS) + '</td></tr>';
        }).join(''), { min: 760 }) : empty('No tickets', 'Customer complaints and requests are listed here.'));
      } else {
        var rs = db.reviews, avg = rs.length ? rs.reduce(function (n, r) { return n + r.rating; }, 0) / rs.length : 0;
        body = '<div class="card__head"><h2>Reviews</h2><span class="muted">' + (rs.length ? 'Average ' + avg.toFixed(1) + ' / 5 from ' + rs.length + ' reviews' : '') + '</span></div>' + (rs.length ? '<div class="list">' + rs.map(function (r) {
          return '<div class="li" style="align-items:flex-start"><div style="flex:1;min-width:0"><div class="cell-main">' + esc(r.customer) + ' <span style="color:var(--orange)">' + '★'.repeat(r.rating) + '</span><span class="muted">' + '★'.repeat(5 - r.rating) + '</span>' + (r.demo ? ' <span class="tag-demo">Demo</span>' : '') + '</div><div>' + esc(r.text) + '</div><div class="cell-sub">' + esc(r.service) + ' · ' + esc(r.bookingId) + ' · ' + A.fmtDate(r.at) + '</div></div></div>';
        }).join('') + '</div>' : empty('No reviews yet', 'Reviews will appear after customers can rate completed jobs.'));
      }
      return '<section class="card"><div class="toolbar" style="margin-bottom:12px">' + tabs('sp.tab', [['tickets', 'Tickets'], ['reviews', 'Reviews']], S.sp.tab) + '</div>' + body + '</section>';
    }
  };
  A.act['tk-edit'] = function (el) {
    var id = el.dataset.id, t = id ? A.db().tickets.filter(function (x) { return x.id === id; })[0] : null, isNew = !t;
    t = t || { subject: '', customer: '', phone: '', bookingId: '', status: 'open', priority: 'medium', notes: [] };
    A.drawer({ title: isNew ? 'New ticket' : esc(t.subject), body: '<form id="tkform" class="form form--2" data-form="ticket" data-id="' + esc(id) + '" novalidate>' + fld('Subject', 'subject', t.subject, { span: true }) + fld('Customer name', 'customer', t.customer) + fld('Phone', 'phone', t.phone) + fld('Booking ID', 'bookingId', t.bookingId || '') +
      fld('Priority', 'priority', t.priority, { type: 'select', options: [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']] }) + fld('Status', 'status', t.status, { type: 'select', options: [['open', 'Open'], ['inprogress', 'In progress'], ['resolved', 'Resolved']] }) +
      fld(isNew ? 'Details' : 'Add a note', 'note', '', { type: 'textarea', span: true, rows: 3 }) + '</form>' + (t.notes.length ? '<div><div class="section-title">Notes</div><div class="list">' + t.notes.map(function (n) { return '<div class="li"><div><div>' + esc(n.text) + '</div><div class="cell-sub">' + A.fmtDateTime(n.at) + '</div></div></div>'; }).join('') + '</div></div>' : ''),
      foot: '<button type="submit" form="tkform" class="btn btn--primary">' + (isNew ? 'Create ticket' : 'Save ticket') + '</button>' });
  };
  A.forms.ticket = function (form) {
    var id = form.dataset.id, v = fd(form), errs = {}, db = A.db();
    if (!v.subject.trim()) { errs.subject = 'Enter a subject.'; }
    if (!setErr(form, errs)) { return; }
    var t = id ? db.tickets.filter(function (x) { return x.id === id; })[0] : null;
    if (!t) { t = { id: A.uid('T'), notes: [], at: Date.now() }; db.tickets.push(t); }
    Object.assign(t, { subject: v.subject.trim(), customer: v.customer.trim(), phone: v.phone.trim(), bookingId: v.bookingId.trim(), priority: v.priority, status: v.status });
    if (v.note.trim()) { t.notes.push({ at: Date.now(), text: v.note.trim() }); }
    A.saveDb(); A.closeDrawer(); A.toast('Ticket saved'); A.render();
  };

  /* =========================== SETTINGS =========================== */
  A.pages.settings = {
    title: 'Settings',
    render: function () {
      var br = A.brand(), db = A.db();
      return '<div class="grid grid--2"><section class="card"><div class="card__head"><h2>Business details</h2></div><form class="form" data-form="brand" novalidate>' + fld('Support phone', 'phone', br.phone) + fld('Support email', 'email', br.email) + fld('Company email', 'companyEmail', br.companyEmail) +
        '<p class="muted small">These show on the customer website help page and footer.</p><div><button class="btn btn--primary" type="submit">Save details</button></div></form></section>' +
        '<section class="card"><div class="card__head"><h2>Commission</h2></div><form class="form" data-form="commission" novalidate>' + fld('Platform commission (%)', 'commission', db.settings.commission, { type: 'number', attrs: 'min="0" max="50" step="0.5" inputmode="decimal"', hint: 'Used for payouts and revenue reports. Maximum 50%.' }) + '<div><button class="btn btn--primary" type="submit">Save commission</button></div></form></section></div>' +
        '<div class="grid grid--2"><section class="card"><div class="card__head"><h2>Admin password</h2></div><form class="form" data-form="password" novalidate>' + fld('Current password', 'cur', '', { type: 'password', attrs: 'autocomplete="current-password"' }) + fld('New password', 'pw', '', { type: 'password', attrs: 'autocomplete="new-password"', hint: 'At least 8 characters.' }) + fld('Repeat new password', 'pw2', '', { type: 'password', attrs: 'autocomplete="new-password"' }) +
        '<div><button class="btn btn--primary" type="submit">Change password</button></div></form></section>' +
        '<section class="card"><div class="card__head"><h2>Data</h2></div><div class="form"><p class="muted">All admin data is stored in this browser. Export a backup before clearing browser data.</p><div class="rowwrap"><button type="button" class="btn" data-act="export-json">Export backup</button><button type="button" class="btn" data-act="import-open">Import backup</button></div>' +
        '<div class="section-title" style="margin:6px 0 0">Demo data</div><div class="rowwrap">' + (db.demo ? '<button type="button" class="btn btn--danger" data-act="demo-clear">Remove demo data</button>' : '<button type="button" class="btn" data-act="demo-restore">Load demo data</button>') + '</div>' +
        '<div class="section-title" style="margin:6px 0 0">Website content</div><div class="rowwrap"><button type="button" class="btn" data-act="catalog-reset">Restore original website catalogue</button></div></div></section></div>' +
        '<section class="card"><div class="card__head"><h2>Going live with real data</h2></div><p class="muted">Bookings, experts and settings are saved only in this browser, so they are not shared between devices or admins. To run the business from this panel, connect Firebase Authentication and Firestore, then add security rules so only admins can read and write this data. A password set here only locks this browser and does not protect a public website.</p></section>';
    }
  };
  A.forms.brand = function (form) {
    var v = fd(form), errs = {}; if (!/^[+\d][\d\s-]{7,16}$/.test(v.phone.trim())) { errs.phone = 'Enter a valid phone number.'; }
    ['email', 'companyEmail'].forEach(function (k) { if (!/^\S+@\S+\.\S+$/.test(v[k].trim())) { errs[k] = 'Enter a valid email.'; } });
    if (!setErr(form, errs)) { return; }
    var ov = A.ov(); ov.brand = { phone: v.phone.trim(), email: v.email.trim(), companyEmail: v.companyEmail.trim() }; A.saveOv(ov); A.toast('Business details saved'); A.render();
  };
  A.forms.commission = function (form) {
    var v = fd(form), n = A.num(v.commission), errs = {}; if (n < 0 || n > 50) { errs.commission = 'Enter a value from 0 to 50.'; } if (!setErr(form, errs)) { return; }
    A.db().settings.commission = n; A.saveDb(); A.toast('Commission saved'); A.render();
  };
  A.forms.password = function (form) {
    var v = fd(form), errs = {};
    if (v.pw.length < 8) { errs.pw = 'Use at least 8 characters.'; } if (v.pw !== v.pw2) { errs.pw2 = 'The passwords do not match.'; }
    A.auth.check(v.cur).then(function (ok) {
      if (!ok) { errs.cur = 'Current password is not correct.'; }
      if (!setErr(form, errs)) { return; }
      A.auth.set(v.pw).then(function () { form.reset(); A.toast('Password changed'); });
    });
  };
  A.act['export-json'] = function () {
    var data = JSON.stringify({ exportedAt: new Date().toISOString(), db: A.db(), catalog: A.ov(), websiteBookings: A.LS.get('bpe_bookings', []) }, null, 2); A._json = data;
    A.drawer({ title: 'Export backup', body: '<p class="muted">Download the file or copy the text and keep it safe.</p><textarea class="input" rows="8" readonly>' + esc(data) + '</textarea>', foot: '<button type="button" class="btn btn--primary" data-act="json-download">Download</button><button type="button" class="btn" data-act="json-copy">Copy</button>' });
  };
  A.act['json-download'] = function () { A.download('bharat-pro-expert-admin-backup.json', A._json, 'application/json'); };
  A.act['json-copy'] = function () { A.copy(A._json, 'Backup copied'); };
  A.act['import-open'] = function () {
    A.drawer({ title: 'Import backup', body: '<form id="imform" class="form" data-form="import" novalidate>' + fld('Paste the backup text', 'json', '', { type: 'textarea', rows: 8 }) + '<p class="note">Importing replaces the current admin data and catalogue edits in this browser.</p></form>', foot: '<button type="submit" form="imform" class="btn btn--primary">Import</button>' });
  };
  A.forms.import = function (form) {
    var v = fd(form), data; try { data = JSON.parse(v.json); } catch (e) { return setErr(form, { json: 'This is not valid backup text.' }); }
    if (!data || !data.db || data.db.v !== 1 || !Array.isArray(data.db.partners)) { return setErr(form, { json: 'This file is not an admin backup.' }); }
    A.LS.set('bpe_admin_db', data.db); A.saveOv(data.catalog || {}); location.reload();
  };
  A.act['demo-clear'] = function () { A.drawer({ title: 'Remove demo data', body: confirmBox('This removes all demo bookings, experts, tickets and reviews. Website orders and experts that signed up on the website stay.', 'demo-clear-yes', '', 'Remove demo data') }); };
  A.act['demo-clear-yes'] = function () { A.clearDemo(); A.closeDrawer(); A.toast('Demo data removed'); A.render(); };
  A.act['demo-restore'] = function () { A.restoreDemo(); A.toast('Demo data loaded'); A.render(); };
  A.act['catalog-reset'] = function () { A.drawer({ title: 'Restore original catalogue', body: confirmBox('This removes every service, category, coupon, banner, city and business detail change made here, and the website goes back to the original catalogue.', 'catalog-reset-yes', '', 'Restore original') }); };
  A.act['catalog-reset-yes'] = function () { A.saveOv({}); A.closeDrawer(); A.toast('Original catalogue restored'); A.render(); };
}());
