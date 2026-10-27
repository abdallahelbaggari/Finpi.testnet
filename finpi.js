/* FinPi — app logic. Pi sign-in, live rates, send by @username, receive by @username or wallet address (automatic, verified on the Pi blockchain),
   receipts, budgets and insights. Icons: Feather (MIT). Everything personal stays on this phone except what transfers need. */
(function () {
  'use strict';
  /* ── basics ── */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var K = 'fp_v1_';
  function get(k, d) { try { var v = localStorage.getItem(K + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) {} }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var TEST = /(^|[.-])testnet[.-]/i.test(location.hostname), NETN = TEST ? 'Pi Testnet' : 'Pi Mainnet', NETQ = TEST ? 'test' : 'main';
  var HORIZON = TEST ? 'https://api.testnet.minepi.com' : 'https://api.mainnet.minepi.com';
  var SANDBOX = (function () { try { var r = document.referrer || '', a = location.ancestorOrigins ? [].slice.call(location.ancestorOrigins).join(' ') : ''; return /sandbox\.minepi\.com/.test(r + ' ' + a); } catch (e) { return false; } })();
  var SUPPORT = 'finpi.app@gmail.com', USER_RE = /^[A-Za-z0-9_.-]{2,40}$/;
  var CATS = ['Food', 'Transport', 'Shopping', 'Bills', 'Family', 'Business', 'Gifts', 'Charity', 'Other'];
  var S = { user: null, token: null, guest: false, tab: 'home', p: null, fx: null, cfg: { enabled: false, payments: null, fee: 0.01, max: 50, daily: 200 }, filter: 'all', seg: 'tx', month: 0, wal: null };
  var r7 = function (n) { return Math.round(Number(n) * 1e7) / 1e7; };
  var me = function () { return S.user && S.user.username || ''; };
  var signedIn = function () { return !!(S.user && S.token); };

  /* ── icons (Feather, MIT) ── */
  var P = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    send: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
    req: '<line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    act: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    rcpt: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    conv: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    biz: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    chev: '<polyline points="9 18 15 12 9 6"/>', chevl: '<polyline points="15 18 9 12 15 6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    warn: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'
  };
  function ic(n, st) { return '<svg class="ic" viewBox="0 0 24 24"' + (st ? ' style="' + st + '"' : '') + ' aria-hidden="true">' + (P[n] || '') + '</svg>'; }

  /* ── numbers & money ── */
  function fpi(n) { return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 7 }); }
  var REG = { NG: 'NGN', PK: 'PKR', IN: 'INR', ID: 'IDR', BD: 'BDT', EG: 'EGP', TR: 'TRY', MY: 'MYR', GB: 'GBP', SA: 'SAR', AE: 'AED', GH: 'GHS', KE: 'KES', PH: 'PHP', VN: 'VND', US: 'USD', CN: 'CNY', KR: 'KRW', JP: 'JPY', TH: 'THB', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BR: 'BRL', MX: 'MXN', ZA: 'ZAR', MA: 'MAD', CM: 'XAF', SN: 'XOF', CI: 'XOF', UG: 'UGX', TZ: 'TZS', ET: 'ETB' };
  function curr() { var c = get('cur', ''); if (c) return c; var m = /[-_]([A-Z]{2})\b/.exec(navigator.language || ''); return (m && REG[m[1]]) || 'USD'; }
  var DN = null; try { DN = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch (e) {}
  function cname(c) { try { return DN ? DN.of(c) : c; } catch (e) { return c; } }
  function money(v, c, dp) {
    if (v == null || isNaN(v)) return '—';
    var d = dp != null ? dp : (Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 1 ? 2 : 4);
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol', minimumFractionDigits: d, maximumFractionDigits: d }).format(v); }
    catch (e) { return c + ' ' + Number(v).toFixed(d); }
  }
  function rateIn(c) {
    var p = S.p; if (!p || !p.usd) return null;
    if (c === 'USD') return p.usd;
    if (S.fx && S.fx[c] && S.fx.USD) return p.usd * S.fx[c] / S.fx.USD;
    if (c === 'SAR') return p.sar; if (c === 'NGN') return p.ngn; return null;
  }
  function conv(a) { var c = curr(), r = rateIn(c), u = rateIn('USD'); if (!(a > 0) || !u) return ''; return '≈ ' + money(a * u, 'USD') + (r && c !== 'USD' ? ' · ' + money(a * r, c) : ''); }
  function ago(t) { var s = Math.max(0, (Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  function short(a) { a = String(a || ''); return a.length > 16 ? a.slice(0, 6) + '…' + a.slice(-6) : a; }
  function spark(arr, w, h, col, area) {
    if (!arr || arr.length < 2) return '';
    var mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr), rg = (mx - mn) || 1;
    var pts = arr.map(function (v, i) { return [(i / (arr.length - 1) * w), (h - 4 - (v - mn) / rg * (h - 10))]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var id = 'g' + Math.random().toString(36).slice(2, 7);
    return '<svg class="sp" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (area || .28) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + line + 'L' + w + ' ' + h + 'L0 ' + h + 'Z" fill="url(#' + id + ')"/><path d="' + line + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ── ui helpers ── */
  var tT = null;
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(function () { t.classList.remove('on'); }, 3200); }
  window.toast = toast;
  function sheet(title, body, o) {
    o = o || {};
    if (!o.stack) closeSheets();
    var w = document.createElement('div'); w.className = 'sh-wrap';
    w.innerHTML = '<div class="sh" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="sh-h"><h2>' + esc(title) + '</h2><button type="button" class="sh-x" aria-label="Close">' + ic('x') + '</button></div>' + body + '</div>';
    w.addEventListener('click', function (e) { if (e.target === w || e.target.closest('.sh-x')) { w.remove(); o.onClose && o.onClose(); } });
    document.body.appendChild(w);
    return w;
  }
  function closeSheets() { $$('.sh-wrap').forEach(function (x) { x.remove(); }); }
  function vv() { var v = window.visualViewport; document.documentElement.style.setProperty('--vvh', (v ? v.height : innerHeight) + 'px'); }
  if (window.visualViewport) { visualViewport.addEventListener('resize', vv); visualViewport.addEventListener('scroll', vv); }
  addEventListener('resize', vv); vv();
  document.addEventListener('focusin', function (e) { var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.closest('.sh')) setTimeout(function () { try { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }, 300); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheets(); });
  function api(path, body) { return fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' }).then(function (r) { return r.json(); }); }
  function copy(t) { try { navigator.clipboard.writeText(t).then(function () { toast('Copied'); }, function () { toast('Press and hold to copy'); }); } catch (e) { toast('Press and hold to copy'); } }
  function shareText(title, text) { if (navigator.share) navigator.share({ title: title, text: text }).catch(function () {}); else copy(text); }

  /* ── notifications ── */
  function notes() { return get('notes', []); }
  function addNote(icn, t, b, tag) {
    var n = notes(); if (tag && n.some(function (x) { return x.tag === tag; })) return;
    n.unshift({ ic: icn, t: t, b: b, ts: Date.now(), read: false, tag: tag || '' }); put('notes', n.slice(0, 60)); bellDot();
    if (get('push', false) && 'Notification' in window && Notification.permission === 'granted') {
      var opt = { body: b, icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: tag || undefined };
      try { navigator.serviceWorker && navigator.serviceWorker.ready.then(function (r) { r.showNotification(t, opt); }).catch(function () { try { new Notification(t, opt); } catch (e) {} }); } catch (e) {}
    }
  }
  function bellDot() { var d = $('#bell-dot'); if (d) d.hidden = !notes().some(function (x) { return !x.read; }); }

  /* ── receipts ── */
  function rcpts() { return get('rcpts', []); }
  function saveRcpt(r) {
    var R = rcpts(); if (r.txid && R.some(function (x) { return x.txid === r.txid; })) return false;
    var c = curr(); r.usd = r.usd || rateIn('USD'); r.lc = c; r.lr = rateIn(c); r.net = r.net || NETN; r.ts = r.ts || Date.now(); r.saved = Date.now();
    R.unshift(r); put('rcpts', R.slice(0, 400)); try { remMatch(r); } catch (e) {} return true;
  }
  function verifyUrl(r) { return r && /^[a-f0-9]{64}$/i.test(r.txid || '') ? location.origin + '/receipt.html#tx=' + r.txid.toLowerCase() + '&net=' + (/Testnet/.test(r.net || '') ? 'test' : 'main') : ''; }
  function rcptTitle(r) { return r.kind === 'refund' ? 'Refund · transfer to ' + r.other : r.kind === 'supporter' ? 'FinPi Supporter' : r.dir === 'in' ? 'From ' + r.other : 'To ' + r.other; }
  function valTxt(r) { return r && r.usd ? (r.lr && r.lc && r.lc !== 'USD' ? money(r.amount * r.lr, r.lc) + ' · ' : '') + money(r.amount * r.usd, 'USD') : ''; }
  function rateTxt(r) { return r && r.usd ? '1 π = ' + money(r.usd, 'USD', 4) + (r.lr && r.lc && r.lc !== 'USD' ? ' · ' + money(r.lr, r.lc, r.lr < 1 ? 4 : 2) : '') : ''; }
  function spec(r) {
    var d = new Date(r.ts), when = [['Date', d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })], ['Time', d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]];
    var sub = r.usd ? '≈ ' + money(r.amount * r.usd, 'USD') + (r.lr && r.lc && r.lc !== 'USD' ? ' · ' + money(r.amount * r.lr, r.lc) : '') + ' at payment time' : '';
    var mine = (get('name', '') || '@' + (r.me || me())) + (get('name', '') && (r.me || me()) ? ' (@' + (r.me || me()) + ')' : '');
    var base = { amount: fpi(r.amount), sub: sub, verify: verifyUrl(r), status: { text: '✓  Verified on the Pi blockchain', ok: true } };
    if (r.kind === 'refund') return Object.assign(base, { title: 'Automatic refund', rows: [['From', 'FinPi app wallet (automatic)'], ['To', mine], ['Reason', 'Your transfer to ' + r.other + ' could not be delivered'], ['Narration', r.narr || '—'], ['Pi rate', rateTxt(r)], ['Reference', r.pid]].concat(when, [['Network', r.net], ['Your address', r.addr, 1], ['Transaction ID', r.txid, 1]]), thanks: 'Refunded by FinPi', note: 'Refunded automatically under FinPi’s published rules, with no manual decision.' });
    if (r.kind === 'supporter') return Object.assign(base, { title: 'Payment receipt', status: { text: '✓  Completed', ok: true }, rows: [['Paid by', mine], ['For', 'FinPi Supporter badge'], ['Pi rate', rateTxt(r)], ['Payment ID', r.pid, 1]].concat(when, [['Network', r.net], ['Transaction ID', r.txid, 1]]), thanks: 'Thank you for supporting FinPi', note: 'The badge supports the app. It gives no reward or financial return.' });
    var rate = rateTxt(r);
    if (r.kind === 'wallet') {
      var wi = r.dir === 'in';
      return Object.assign(base, { title: wi ? 'Payment received' : 'Payment receipt',
        rows: [['From', wi ? short(r.from || r.addr) : mine], ['To', wi ? mine : short(r.addr)], ['Narration', r.narr || '—'], ['Category', wi ? '' : r.cat], ['Value', valTxt(r)], ['Pi rate', rate], ['Paid with', 'Pi Wallet'], ['Reference', r.pid]].concat(when, [['Network', r.net], ['Sender address', r.from, 1], ['Recipient address', wi ? r.to : r.addr, 1], ['Transaction ID', r.txid, 1]]),
        thanks: wi ? 'Received · verified by FinPi' : 'Paid · verified by FinPi', note: 'Paid from Pi Wallet and verified by FinPi on the public Pi blockchain. Scan the code to check it.' });
    }
    var inn = r.dir === 'in', fee = inn ? 0 : (r.fee || 0.01), A = r.tk === 'address';
    return Object.assign(base, { title: inn ? 'Transfer received' : 'Transfer receipt',
      rows: [['From', inn ? r.other : mine], ['To', inn ? mine : (A ? 'Pi wallet address' : r.other)], ['Narration', r.narr || '—'], ['Category', inn ? '' : r.cat], ['Value', valTxt(r)], ['Pi rate', rate]].concat(fee ? [['Blockchain fee', fpi(fee) + ' π'], ['Total paid', fpi(r7(Number(r.amount) + fee)) + ' π']] : [], [['Reference', r.pid]], when, [['Network', r.net], [inn ? 'Your address' : 'Recipient address', r.addr, 1], ['Transaction ID', r.txid, 1]]),
      thanks: inn ? 'Received with FinPi' : 'Sent with FinPi', note: (A ? 'Paid in FinPi and delivered automatically to the wallet address on the Pi blockchain.' : 'Paid in FinPi and delivered automatically through Pi Network’s official payments.') + ' Scan the code to check it on the Pi blockchain.' });
  }
  function fontsReady() { try { return document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve(); } catch (e) { return Promise.resolve(); } }
  function rcName(r) { var d = new Date(r.ts); return 'FinPi-receipt-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + String(r.txid || r.pid || Date.now()).slice(0, 8) + '.jpg'; }
  function rcType(r) { return r.kind === 'refund' ? 'Automatic refund' : r.kind === 'supporter' ? 'Supporter payment' : r.kind === 'wallet' ? (r.dir === 'in' ? 'Payment received' : 'Payment sent · Pi Wallet') : r.dir === 'in' ? 'Transfer received' : 'Transfer sent'; }
  /* Transaction details: every fact about the payment, then share or download the receipt image */
  function showRcpt(r) {
    if (!r) return;
    var inn = r.dir === 'in', v = verifyUrl(r), fee = !inn && r.kind === 'transfer' ? (r.fee || 0.01) : 0, d = new Date(r.ts);
    var mine = (get('name', '') ? get('name', '') + ' · ' : '') + '@' + (r.me || me());
    var rows = [];
    if (r.kind === 'refund') rows.push(['From', 'FinPi app wallet (automatic)'], ['To', mine], ['Reason', 'Your transfer to ' + r.other + ' could not be delivered']);
    else if (r.kind === 'supporter') rows.push(['Paid by', mine], ['For', 'FinPi Supporter badge']);
    else if (r.kind === 'wallet') rows.push(['From', inn ? short(r.from || r.addr) : mine], ['To', inn ? mine : short(r.addr)], ['Paid with', 'Pi Wallet']);
    else rows.push(['From', inn ? r.other : mine], ['To', inn ? mine : (r.tk === 'address' ? 'Pi wallet address' : r.other)]);
    if (r.narr && r.kind !== 'supporter') rows.push(['Narration', r.narr]);
    if (r.cat && !inn) rows.push(['Category', r.cat]);
    if (r.usd) rows.push(['Value at payment time', (r.lr && r.lc && r.lc !== 'USD' ? money(r.amount * r.lr, r.lc) + ' · ' : '') + money(r.amount * r.usd, 'USD')]);
    if (rateTxt(r)) rows.push([Math.abs((r.saved || r.ts) - r.ts) > 3600e3 ? 'Pi rate (when saved)' : 'Pi rate', rateTxt(r)]);
    if (fee) rows.push(['Amount', fpi(r.amount) + ' π'], ['Blockchain fee', fpi(fee) + ' π'], ['Total paid', fpi(r7(Number(r.amount) + fee)) + ' π']);
    rows.push(['Date', d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })], ['Time', d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })], ['Network', r.net || NETN], ['Status', 'Completed']);
    if (r.pid) rows.push([r.kind === 'supporter' ? 'Payment ID' : 'Reference', r.pid, 1]);
    if (r.kind === 'wallet') { if (r.from) rows.push(['Sender address', r.from, 1]); if (inn ? r.to : r.addr) rows.push(['Recipient address', inn ? r.to : r.addr, 1]); }
    else if (r.addr) rows.push([inn || r.kind === 'refund' ? 'Your address' : 'Recipient address', r.addr, 1]);
    if (r.txid) rows.push(['Transaction ID', r.txid, 1]);
    var cls = r.kind === 'refund' ? 'rf' : r.kind === 'supporter' ? 'sp' : inn ? 'in' : '';
    var w = sheet('Transaction details',
      '<div class="txd"><span class="ico ' + cls + '">' + ic(r.kind === 'refund' ? 'undo' : r.kind === 'supporter' ? 'heart' : inn ? 'req' : 'send') + '</span><p class="small">' + esc(rcType(r)) + '</p>' +
      '<div class="txd-v num' + (inn ? ' pos' : '') + '">' + (inn ? '+' : '−') + fpi(r.amount) + ' π</div>' +
      (r.usd ? '<p class="small muted num">≈ ' + money(r.amount * r.usd, 'USD') + (r.lr && r.lc && r.lc !== 'USD' ? ' · ' + money(r.amount * r.lr, r.lc) : '') + ' at payment time</p>' : '') +
      '<span class="txd-ok">' + ic('check', 'width:15px;height:15px') + 'Verified on the Pi blockchain</span></div>' +
      '<div class="list txd-rows">' + rows.map(function (x, i) { return '<div class="txr"><span>' + esc(x[0]) + '</span><b class="' + (x[2] ? 'num mono' : '') + '">' + esc(x[1]) + '</b>' + (x[2] ? '<button type="button" class="cp" data-cp="' + i + '" aria-label="Copy ' + esc(x[0]) + '">' + ic('copy') + '</button>' : '') + '</div>'; }).join('') + '</div>' +
      '<div class="two"><button type="button" class="btn" data-x="share">' + ic('share') + 'Share</button><button type="button" class="btn ghost" data-x="dl">' + ic('down') + 'Download</button></div>' +
      (v ? '<a class="btn soft" href="' + esc(v) + '">' + ic('ext') + 'View on the Pi blockchain</a>' : '') +
      '<div class="sec" style="margin-top:20px"><h2>Receipt</h2></div><div id="rc-prev" class="empty">Preparing receipt…</div>' +
      '<p class="small muted" style="text-align:center;margin-top:8px">Tip: press and hold the receipt image to save it to your gallery.</p>');
    $$('[data-cp]', w).forEach(function (b) { b.onclick = function () { copy(rows[+b.dataset.cp][1]); }; });
    var cvP = fontsReady().then(function () { return window.FPReceipt ? FPReceipt.canvas(spec(r)) : null; });
    cvP.then(function (cv) { var p = $('#rc-prev', w); if (!p) return; if (!cv) { p.textContent = 'Receipt image unavailable.'; return; } p.className = ''; p.innerHTML = '<img class="rc-img" alt="FinPi receipt" src="' + cv.toDataURL('image/png') + '">'; });
    var name = rcName(r), text = 'FinPi receipt · ' + rcType(r) + ' · ' + fpi(r.amount) + ' π · ' + d.toLocaleDateString('en-GB') + (v ? '\nVerify on the Pi blockchain: ' + v : '');
    $('[data-x="share"]', w).onclick = function () {
      cvP.then(function (cv) {
        if (!cv) return shareText('FinPi receipt', text);
        cv.toBlob(function (b) {
          try { var f = new File([b], name, { type: 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'FinPi receipt', text: text }).catch(function () {}); } catch (e) {}
          shareText('FinPi receipt', text);
        }, 'image/jpeg', 0.92);
      });
    };
    $('[data-x="dl"]', w).onclick = function () {
      cvP.then(function (cv) {
        if (!cv) return toast('Receipt image unavailable');
        cv.toBlob(function (b) {
          var u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; a.rel = 'noopener';
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 8000);
          toast('Receipt saved to Downloads. If it does not appear, press and hold the image to save it.');
        }, 'image/jpeg', 0.92);
      });
    };
  }

  /* ── live Pi price ── */
  try { S.p = get('price', null); if (S.p) S.p.stale = true; S.fx = get('fx', null); } catch (e) {}
  var pBusy = false, pLast = 0;
  function loadPrice(force) {
    if (pBusy || (!force && Date.now() - pLast < 20000)) return;
    pBusy = true; pLast = Date.now();
    api('/pi-price').then(function (d) { if (d && d.ok && d.usd) { S.p = d; S.p.stale = !!d.stale; put('price', d); if (!d.stale) checkAlerts(); } else if (S.p) S.p.stale = true; })
      .catch(function () { if (S.p) S.p.stale = true; }).then(function () { pBusy = false; paintPrice(); });
    if (!S.fx || Date.now() - (get('fxT', 0)) > 6 * 3600e3) api('/fx').then(function (d) { if (d && d.ok && d.rates) { S.fx = d.rates; put('fx', d.rates); put('fxT', Date.now()); paintPrice(); } }).catch(function () {});
  }
  function heroHTML() {
    var p = S.p, c = curr(), r = rateIn(c), ch = p && typeof p.change24h === 'number' ? p.change24h : null;
    if (!p || !p.usd) return '<div class="hero-k"><span><span class="live off"></span>Pi price</span></div><div class="hero-v" style="font-family:var(--f);font-size:22px">' + (pBusy ? '<span class="skel"></span>' : 'Rate unavailable right now') + '</div><div class="hero-s">' + (pBusy ? '' : '<button type="button" class="cur-b" data-act="price-retry">' + ic('refresh', 'width:14px;height:14px') + 'Try again</button>') + '</div>';
    return '<div class="hero-k"><span><span class="live"></span>Pi price</span>' + (ch !== null ? '<span class="pill ' + (ch >= 0 ? 'up' : 'dn') + '">' + (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(2) + '%</span>' : '') + '</div>' +
      '<div class="hero-v">1 π = ' + money(p.usd, 'USD', p.usd < 1 ? 4 : 2) + '</div>' +
      '<div class="hero-s">' + (c !== 'USD' && r ? '<span>≈ <span class="num">' + money(r, c, r < 1 ? 4 : 2) + '</span></span>' : '') + '<button type="button" class="cur-b" data-act="currency">' + ic('globe', 'width:14px;height:14px') + esc(c) + '</button></div>' +
      spark(p.spark, 300, 58, '#5EEAD4', .35);
  }
  function paintPrice() {
    var h = $('[data-p="hero"]'); if (h) h.innerHTML = heroHTML();
    var lv = $('#ld-rate-v'); if (lv) { var p = S.p, c = curr(), r = rateIn(c); lv.textContent = p && p.usd ? money(p.usd, 'USD', 4) : 'unavailable'; $('#ld-rate-c').textContent = p && r && c !== 'USD' ? '≈ ' + money(r, c, r < 1 ? 4 : 2) : ''; $('#ld-live').className = 'live' + (p && !p.stale ? '' : ' off'); }
    var wc = $('[data-p="wchart"]'); if (wc) wc.innerHTML = wChartHTML();
    if ($('#cv-pi') && document.activeElement && !/^cv-/.test(document.activeElement.id || '')) cvCalc('pi');
    var ms = $('[data-p="month"]'); if (ms) ms.innerHTML = monthHTML();
    var wb = $('[data-p="wbal"]'); if (wb) wb.innerHTML = walBalHTML();
  }

  /* ── Pi SDK & sign-in ── */
  var piReady = false;
  function initPi() { if (piReady || !window.Pi) return !!window.Pi; try { Pi.init({ version: '2.0', sandbox: SANDBOX }); piReady = true; } catch (e) {} return piReady; }
  function onIncomplete(p) {
    if (!p || !p.identifier) return;
    if (p.metadata && p.metadata.type === 'transfer') { var pd = get('pend', {}); if (!pd[p.identifier]) { pd[p.identifier] = { ts: Date.now() }; put('pend', pd); } }
    api('/recover', { paymentId: p.identifier }).then(function () { setTimeout(function () { sync(); checkPendingInApp(); }, 600); }).catch(function () {});
  }
  function signIn(silent) {
    var btn = $('#signin'), msg = $('#ld-msg');
    if (!window.Pi || !initPi()) { if (!silent) { msg.textContent = 'Open FinPi in the Pi Browser to sign in with Pi.'; toast('Open FinPi in the Pi Browser'); } return Promise.resolve(false); }
    if (btn && !silent) { btn.disabled = true; $('#signin-t').textContent = 'Signing in…'; }
    var done = false;
    return new Promise(function (ok) {
      var t = setTimeout(function () { if (done) return; done = true; if (!silent) msg.textContent = 'Pi did not answer. Check your connection and try again.'; reset(); ok(false); }, 45000);
      Pi.authenticate(['username', 'payments'], onIncomplete).then(function (a) {
        if (done) return; done = true; clearTimeout(t);
        S.user = { username: a.user.username, uid: a.user.uid }; S.token = a.accessToken; S.guest = false;
        put('user', { username: a.user.username }); reset(); showApp(); afterSignIn(); ok(true);
      }).catch(function () { if (done) return; done = true; clearTimeout(t); if (!silent) msg.textContent = 'Sign-in was cancelled or failed. Please try again.'; reset(); ok(false); });
    });
    function reset() { if (btn) { btn.disabled = false; $('#signin-t').textContent = 'Sign in with Pi'; } }
  }
  function needSignIn(why) {
    if (signedIn()) return false;
    sheet('Sign in with Pi', '<p class="sh-sub">' + esc(why || 'Sign in with your Pi account to continue.') + '</p><div class="note">' + ic('lock') + '<span>FinPi only receives your Pi username. It never sees your passphrase or balance.</span></div><button type="button" class="btn" data-x="go"><span class="pi-dot">π</span>Sign in with Pi</button>');
    $('.sh [data-x="go"]').onclick = function () { closeSheets(); signIn(); };
    return true;
  }
  function showApp() {
    $('#landing').hidden = true; $('#app').hidden = false;
    $('#av').textContent = signedIn() ? me().charAt(0) : 'G';
    $('#netb').hidden = !TEST; bellDot(); render(S.tab);
  }
  function afterSignIn() { register(); loadCfg().then(function () { sync(); if (pendingCode) { var c = pendingCode; pendingCode = null; openCode(c); } }); }

  /* ── transfers: server status, registration, sync ── */
  function loadCfg() {
    return api('/transfer?a=status').then(function (d) {
      if (d && d.ok) { S.cfg = { enabled: !!d.enabled, usernames: !!d.usernames, payments: d.payments !== false, addresses: d.addresses !== false, fee: d.fee || 0.01, max: d.max || 50, daily: d.daily || 200 }; if (!$('.sh-wrap')) render(S.tab); }
    }).catch(function () {});
  }
  var registered = false;
  function register() { if (registered || !signedIn()) return; registered = true; api('/users', { accessToken: S.token }).then(function (d) { if (!d || !d.ok) registered = false; }).catch(function () { registered = false; }); }
  function learnAddr(a) { if (a && /^G[A-Z2-7]{55}$/.test(a) && !get('addr', '')) put('addrSug', a); }
  function saveTransfer(t, dir) {
    var pend = get('pend', {}), pd = pend[t.pid] || {};
    var ok = saveRcpt({ kind: 'transfer', dir: dir, tk: dir === 'out' && (t.to_kind === 'address' || !t.to) ? 'address' : 'user', fee: dir === 'out' ? 0.01 : 0, amount: t.amount, other: dir === 'in' ? '@' + t.from : (t.to_kind === 'address' || !t.to ? short(t.to_addr) : '@' + t.to), narr: t.narr, cat: pd.cat || '', pid: t.pid, txid: t.txid, addr: t.to_addr, ts: t.done_ts || Date.now(), me: me() });
    if (dir === 'in') learnAddr(t.to_addr);
    if (pend[t.pid]) { delete pend[t.pid]; put('pend', pend); }
    return ok;
  }
  function saveRefund(t) {
    if (!t.refund_txid) return false; learnAddr(t.refund_addr);
    var tl = t.to_kind === 'address' || !t.to ? short(t.to_addr) : '@' + t.to;
    var ok = saveRcpt({ kind: 'refund', dir: 'in', amount: t.amount, other: tl, narr: t.narr, pid: t.pid, txid: t.refund_txid, addr: t.refund_addr, ts: t.done_ts || Date.now(), me: me() });
    if (ok) addNote('undo', 'Refunded automatically', fpi(t.amount) + ' π returned to you: your transfer to ' + tl + ' could not be delivered.', 'ref-' + t.pid);
    return ok;
  }
  function sync() {
    if (!signedIn() || !S.cfg.enabled) return;
    api('/transfer', { a: 'list', accessToken: S.token }).then(function (d) {
      if (!d || !d.ok) return; var ch = 0;
      (d.items || []).forEach(function (t) {
        if (t.status === 'paid') {
          if (saveTransfer(t, t.dir)) { ch++; if (t.dir === 'in') { var m = fpi(t.amount) + ' π from @' + t.from + (t.narr ? ' · ' + t.narr : ''); addNote('req', 'You received Pi', m, 'in-' + t.pid); toast('You received ' + fpi(t.amount) + ' π'); } }
        } else if (t.status === 'refunded' && t.dir === 'out') { if (saveRefund(t)) ch++; }
        else if (t.dir === 'out' && /^(failed|received|paying|refunding|refund_failed|refund_needed)$/.test(t.status)) {
          api('/transfer', { a: 'payout', paymentId: t.pid }).then(function (x) { if (x && x.ok && x.row) { if (saveTransfer(x.row, 'out')) rerender(); } else if (x && x.refunded && x.row && saveRefund(x.row)) rerender(); }).catch(function () {});
        }
      });
      if (ch) rerender();
    }).catch(function () {});
  }
  function rerender() { if (!$('.sh-wrap') && !$('#app').hidden) render(S.tab); }

  /* ── send flow ── */
  function guardPay() {
    if (needSignIn('Sign in with Pi to send and receive Pi.')) return false;
    if (!S.cfg.enabled) {
      loadCfg();
      sheet('Sending is not available yet', '<div class="note warn">' + ic('info') + '<span>FinPi is finishing its secure payment setup. Sending will open here automatically as soon as it is ready. Nothing has been charged.</span></div>' +
        '<div class="card" style="margin-top:12px"><h3>Meanwhile you can</h3><p>• Receive Pi with your @username or wallet address<br>• Check the live Pi rate and convert<br>• See your wallet balance and receipts</p></div>' +
        '<button type="button" class="btn" data-act="receive">' + ic('req') + 'Receive Pi</button><button type="button" class="btn ghost" data-act="status">' + ic('shield') + 'System status</button>');
      return false;
    }
    if (!window.Pi || !initPi()) { toast('Open FinPi in the Pi Browser to pay'); return false; }
    return true;
  }
  var isG = function (v) { return /^G[A-Z2-7]{55}$/.test(v); };
  function toLabel(t) { return isG(t) ? short(t) : '@' + t; }
  function sendSheet(pre) {
    pre = pre || {};
    var addrOn = true, userOn = !!(S.cfg.enabled && S.cfg.usernames), kind = !userOn || (pre.u && isG(pre.u)) ? 'addr' : 'user';
    var payees = contacts().map(function (c) { return c.to; }).concat(get('payees', [])).filter(function (p, i, L) { return (userOn || isG(p)) && L.map(function (q) { return q.toLowerCase(); }).indexOf(p.toLowerCase()) === i; }).slice(0, 8);
    var w = sheet('Send Pi',
      (pre.link || pre.x && pre.a ? '<div class="note gray" style="margin-bottom:8px">' + ic('qr') + '<span>Payment request from ' + esc(isG(pre.u) ? short(pre.u) : '@' + pre.u) + (pre.a ? ' for <b>' + fpi(pre.a) + ' π</b>' : '') + (pre.x ? ' · “' + esc(pre.x) + '”' : '') + '. Check it is someone you know.</span></div>' : '') +
      (userOn ? '<div class="seg" role="tablist" style="margin-bottom:4px"><button type="button" data-k="user">Username</button><button type="button" data-k="addr">Wallet address</button></div>' : (S.cfg.enabled ? '' : '<p class="sh-sub">Fill in the payment, then pay it from your Pi Wallet. Your receipt appears automatically.</p>')) +
      '<div id="k-user"><label class="l" for="s-u">To</label><div class="to"><span>@</span><input id="s-u" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="username" maxlength="60"></div></div>' +
      '<div id="k-addr" hidden><label class="l" for="s-g">Pi wallet address</label><textarea class="in num" id="s-g" rows="2" maxlength="60" autocapitalize="characters" spellcheck="false" placeholder="G…" style="font-size:14px;resize:none"></textarea></div>' +
      '<div class="hint" id="s-uh"></div>' +
      (payees.length && !pre.u ? '<div class="chips" style="margin-top:2px">' + payees.map(function (p) { return '<button type="button" class="chip" data-pu="' + esc(p) + '">' + (isG(p) ? ic('card', 'width:15px;height:15px;vertical-align:-3px') + ' ' : '') + esc(cName(p) || toLabel(p)) + '</button>'; }).join('') + '</div>' : '') +
      '<label class="l" for="s-a">Amount</label><div class="amt"><input id="s-a" type="number" inputmode="decimal" min="0" step="any" placeholder="0.00"><span>π</span></div><div class="hint num" id="s-c"></div>' +
      '<label class="l">Category</label><div class="chips" id="s-cat">' + CATS.map(function (c) { return '<button type="button" class="chip" data-c="' + c + '">' + c + '</button>'; }).join('') + '</div>' +
      '<label class="l" for="s-x">Narration</label><input class="in" id="s-x" maxlength="80" placeholder="What is it for? e.g. Rent, groceries, gift">' +
      '<div class="sum" id="s-sum" hidden></div>' +
      '<button type="button" class="btn" id="s-go">Continue</button>' +
      '<p class="small muted" style="margin-top:12px;text-align:center">' + ic('lock', 'width:14px;height:14px;vertical-align:-2px') + (S.cfg.enabled ? ' Secured by Pi Network. Up to ' + S.cfg.max + ' π per payment.' : ' Secured by Pi Network.') + '</p>');
    var u = $('#s-u', w), g = $('#s-g', w), a = $('#s-a', w), h = $('#s-uh', w), ok = null, tm = null, cat = pre.cat || '';
    function setKind(k) {
      kind = k; ok = null; h.innerHTML = '';
      $$('[data-k]', w).forEach(function (b) { b.classList.toggle('on', b.dataset.k === k); });
      $('#k-user', w).hidden = k !== 'user'; $('#k-addr', w).hidden = k !== 'addr';
      (k === 'user' ? u : g).oninput();
    }
    function sum() {
      var v = r7(a.value); $('#s-c', w).textContent = conv(v);
      var s = $('#s-sum', w); s.hidden = !(v > 0);
      s.innerHTML = '<div><span>They receive</span><b>' + fpi(v) + ' π</b></div><div><span>Blockchain fee</span><b>' + S.cfg.fee + ' π</b></div><div class="tot"><span>You pay</span><b>' + fpi(r7(v + S.cfg.fee)) + ' π</b></div>';
    }
    function setCat(c) { cat = c; $$('#s-cat .chip', w).forEach(function (b) { b.classList.toggle('on', b.dataset.c === c); }); }
    $$('#s-cat .chip', w).forEach(function (b) { b.onclick = function () { setCat(cat === b.dataset.c ? '' : b.dataset.c); }; });
    $$('[data-k]', w).forEach(function (b) { b.onclick = function () { setKind(b.dataset.k); }; });
    $$('[data-pu]', w).forEach(function (b) { b.onclick = function () { var p = b.dataset.pu; if (isG(p)) { setKind('addr'); g.value = p; g.oninput(); } else { setKind('user'); u.value = p; u.oninput(); } a.focus(); }; });
    a.oninput = sum;
    u.oninput = function () {
      var name = u.value.trim().replace(/^@/, ''); ok = null; clearTimeout(tm);
      if (/^G[A-Z2-7]{40,}$/.test(name.toUpperCase()) && name.length > 40) { if (addrOn) { setKind('addr'); g.value = name.toUpperCase(); g.oninput(); u.value = ''; } else h.innerHTML = '<span class="bad">That is a wallet address. Send to a FinPi @username instead.</span>'; return; }
      if (!USER_RE.test(name)) { h.textContent = ''; return; }
      h.textContent = 'Checking…';
      tm = setTimeout(function () {
        api('/users?u=' + encodeURIComponent(name)).then(function (d) {
          if (kind !== 'user' || u.value.trim().replace(/^@/, '') !== name) return;
          if (!d.ok) { h.innerHTML = '<span class="bad">' + esc(d.error || 'Could not check right now.') + '</span>'; return; }
          if (d.exists && d.username.toLowerCase() === me().toLowerCase()) { h.innerHTML = '<span class="bad">That is you.</span>'; return; }
          if (d.exists) { ok = d.username; h.innerHTML = '<span class="ok">✓ @' + esc(d.username) + ' is on FinPi</span>'; }
          else h.innerHTML = '<span class="bad">@' + esc(name) + ' has not used FinPi yet.' + (addrOn ? ' You can send to their wallet address instead.' : ' Ask them to open FinPi and sign in with Pi once.') + '</span>';
        }).catch(function () { h.textContent = 'No connection. Try again.'; });
      }, 400);
    };
    g.oninput = function () {
      var v = g.value.replace(/\s/g, '').toUpperCase(); ok = null; clearTimeout(tm);
      if (g.value !== v && !/^S/.test(v)) g.value = v;
      if (!v) { h.textContent = ''; return; }
      if (/^S/.test(v)) { g.value = ''; h.innerHTML = '<span class="bad">That looks like a SECRET key. Never share it with anyone. Enter the address that starts with G.</span>'; return; }
      if (v.length < 56) { h.textContent = v.length + ' of 56 characters'; return; }
      if (!validG(v)) { h.innerHTML = '<span class="bad">This address is not valid. Check every character.</span>'; return; }
      if (v === get('addr', '')) { h.innerHTML = '<span class="bad">That is your own wallet address.</span>'; return; }
      h.textContent = 'Checking the Pi blockchain…';
      tm = setTimeout(function () {
        hz('/accounts/' + v).then(function (acc) {
          if (kind !== 'addr' || g.value.replace(/\s/g, '').toUpperCase() !== v) return;
          if (!acc) { h.innerHTML = '<span class="bad">This address has no Pi account on ' + NETN + ' yet. Check it with the person.</span>'; return; }
          ok = v; h.innerHTML = '<span class="ok">✓ Valid Pi wallet address · ' + esc(short(v)) + '</span>';
        }).catch(function () { h.textContent = 'Could not reach the Pi blockchain. Try again.'; });
      }, 300);
    };
    if (pre.u) { if (isG(pre.u)) g.value = pre.u; else u.value = pre.u; }
    if (pre.a > 0) a.value = pre.a;
    if (pre.x) $('#s-x', w).value = pre.x;
    if (cat) setCat(cat);
    setKind(kind);
    sum();
    $('#s-go', w).onclick = function () {
      var v = r7(a.value), x = $('#s-x', w).value.trim(), btn = this, to = ok;
      if (!to) return toast(kind === 'addr' ? 'Enter a valid Pi wallet address' : 'Enter a FinPi user’s @username');
      if (!(v >= 0.01)) return toast('The smallest payment is 0.01 π');
      if (!x) return toast('Add a narration: what is this payment for?');
      if (isG(to) && !S.cfg.enabled) return review(to, v, x, cat, { wallet: true, first: get('payees', []).indexOf(to) < 0 });
      if (!signedIn()) { needSignIn('Sign in with Pi to send inside FinPi.'); return; }
      if (v > S.cfg.max) return toast('The most you can send at once is ' + S.cfg.max + ' π');
      if (!x) return toast('Add a narration: what is this payment for?');
      btn.disabled = true; btn.textContent = 'Checking…';
      api('/transfer', isG(to) ? { a: 'check', accessToken: S.token, addr: to, amt: v } : { a: 'check', accessToken: S.token, to: to, amt: v }).then(function (d) {
        btn.disabled = false; btn.textContent = 'Continue';
        if (!d || !d.ok) return toast((d && d.error) || 'This transfer cannot be sent right now');
        review(d.addr || d.to || to, v, x, cat, { first: d.first });
      }).catch(function () { btn.disabled = false; btn.textContent = 'Continue'; toast('No connection. Check your internet and try again.'); });
    };
    if (!pre.u) setTimeout(function () { (kind === 'addr' ? g : u).focus(); }, 120);
  }
  function review(to, amt, narr, cat, o) {
    var A = isG(to), warn = [];
    if (A) warn.push('<div class="note warn">' + ic('warn') + '<span>You are sending to a <b>wallet address</b>. Check every character with the person. Pi sent to a wrong address cannot be recovered.</span></div>');
    if (o.first) warn.push('<div class="note warn">' + ic('warn') + '<span>First time paying ' + (A ? 'this address' : '<b>@' + esc(to) + '</b>') + '. Only send to people and businesses you know and trust. FinPi staff will never ask you to send Pi.</span></div>');
    warn.push('<div class="note gray">' + ic('info') + '<span>Blockchain payments cannot be reversed.</span></div>');
    var w = sheet('Check before you send',
      '<div class="big"><div class="v">' + fpi(amt) + ' π</div><div class="c">' + esc(conv(amt)) + '</div><div class="w">To ' + esc(toLabel(to)) + '</div></div>' +
      '<div class="sum">' + (A ? '<div style="display:block"><span>To wallet address</span><b class="num" style="display:block;text-align:left;margin-top:4px;font-size:13px;overflow-wrap:anywhere">' + esc(to) + '</b></div>' : '<div><span>To</span><b class="t">@' + esc(to) + '</b></div>') +
      '<div><span>For</span><b class="t">' + esc(narr) + '</b></div>' + (cat ? '<div><span>Category</span><b class="t">' + esc(cat) + '</b></div>' : '') +
      '<div><span>They receive</span><b>' + fpi(amt) + ' π</b></div><div><span>' + (o.wallet ? 'Network fee (Pi Wallet)' : 'Blockchain fee') + '</span><b>' + S.cfg.fee + ' π</b></div><div class="tot"><span>You pay</span><b>' + fpi(r7(amt + S.cfg.fee)) + ' π</b></div></div>' +
      '<div style="margin-top:12px">' + warn.join('') + '</div>' +
      (A && (o.wallet || !S.cfg.enabled) ? '<button type="button" class="btn" id="rv-w">' + ic('card') + 'Continue in Pi Wallet</button>'
        : '<button type="button" class="btn" id="rv-ok">' + ic('lock') + 'Confirm and pay</button>') +
      '<button type="button" class="btn ghost" id="rv-ed">Edit</button>');
    var ok1 = $('#rv-ok', w); if (ok1) ok1.onclick = function () { if (!window.Pi || !initPi()) return toast('Open FinPi in the Pi Browser to pay inside FinPi'); pay(to, amt, narr, cat); };
    var ok2 = $('#rv-w', w); if (ok2) ok2.onclick = function () { walletPay(to, amt, narr, cat); };
    $('#rv-ed', w).onclick = function () { sendSheet({ u: to, a: amt, x: narr, cat: cat }); };
  }
  function pay(to, amt, narr, cat) {
    if (S.cfg.payments === false) { closeSheets(); return toast('Pi payments open soon. Nothing was charged.'); }
    var A = isG(to), lab = toLabel(to);
    var w = sheet('Paying ' + lab,
      '<div class="big"><div class="v">' + fpi(amt) + ' π</div><div class="c">' + esc(conv(amt)) + '</div><div class="w">To ' + esc(lab) + ' · ' + esc(narr) + '</div></div>' +
      '<div class="steps"><div id="st1" class="on">Approve in Pi’s window</div><div id="st2">Confirming your payment</div><div id="st3">Delivering to ' + esc(lab) + '</div></div><div class="status" id="st-m">Waiting for your approval…</div>');
    var refused = false, tries = 0, curPid = '';
    function step(n, m, cls) { for (var i = 1; i <= 3; i++) { var e = $('#st' + i); if (e) e.className = i < n ? 'done' : i === n ? 'on' : ''; } var s = $('#st-m'); if (s) { s.className = 'status' + (cls ? ' ' + cls : ''); s.innerHTML = m; } }
    function finish(row) {
      put('ipend', get('ipend', []).filter(function (x) { return x.pid !== row.pid; }));
      var pend = get('pend', {}); pend[row.pid] = { cat: cat }; put('pend', pend);
      saveTransfer(row, 'out');
      var pl = get('payees', []).filter(function (x) { return x.toLowerCase() !== to.toLowerCase(); }); pl.unshift(to); put('payees', pl.slice(0, 12));
      addNote('send', 'Transfer delivered', fpi(amt) + ' π to ' + lab + ' · ' + narr, 'out-' + row.pid);
      step(4, '✓ Delivered to ' + esc(lab) + ' and recorded on the Pi blockchain.', 'ok');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.innerHTML = ic('rcpt') + 'View receipt';
      b.onclick = function () { var r = rcpts().filter(function (x) { return x.txid === row.txid; })[0]; showRcpt(r); };
      var d2 = document.createElement('button'); d2.type = 'button'; d2.className = 'btn ghost'; d2.textContent = 'Done'; d2.onclick = function () { closeSheets(); render(S.tab); };
      var sh = $('.sh', w); if (sh) { sh.appendChild(b); sh.appendChild(d2); }
    }
    function refunded(row) { put('ipend', get('ipend', []).filter(function (x) { return x.pid !== row.pid; })); saveRefund(row); step(3, '↩ This transfer could not be delivered, so ' + fpi(amt) + ' π was refunded to you automatically on the Pi blockchain.', 'err'); }
    try {
      Pi.createPayment({ amount: r7(amt + S.cfg.fee), memo: ('FinPi transfer to ' + lab).slice(0, 60), metadata: A ? { type: 'transfer', addr: to, amt: amt, narr: narr } : { type: 'transfer', to: to, amt: amt, narr: narr } }, {
        onReadyForServerApproval: function (pid) {
          var pend = get('pend', {}); pend[pid] = { cat: cat, to: to, amt: amt, narr: narr, ts: Date.now() }; put('pend', pend);
          curPid = pid;
          api('/approve', { paymentId: pid }).then(function (d) { if (d && d.approved === false) { refused = true; dropPending(pid); step(1, '✕ ' + esc(d.error || 'This payment could not be sent.') + (/Nothing was charged/.test(d.error || '') ? '' : ' Nothing was charged.'), 'err'); } }).catch(function () {});
        },
        onReadyForServerCompletion: function (pid, txid) {
          var ip = get('ipend', []).filter(function (x) { return x.pid !== pid; }); ip.unshift({ pid: pid, ts: Date.now() }); put('ipend', ip.slice(0, 20));
          step(2, 'Confirming your payment on the Pi blockchain…');
          api('/complete', { paymentId: pid, txid: txid }).then(function (d) {
            step(3, 'Delivering to ' + esc(lab) + '…');
            var t = d && d.transfer;
            if (t && t.ok && t.row) return finish(t.row);
            if (t && t.refunded && t.row) return refunded(t.row);
            (function retry() {
              api('/transfer', { a: 'payout', paymentId: pid }).then(function (x) {
                if (x && x.ok && x.row && x.row.txid) return finish(x.row);
                if (x && x.refunded && x.row) return refunded(x.row);
                if (++tries < 40) { step(3, 'Delivering to ' + esc(lab) + '… You can close this screen: your receipt will appear in Activity.'); setTimeout(retry, 8000); }
                else step(3, 'Your payment is processing. Your receipt will appear in Activity as soon as it is delivered.');
              }).catch(function () { if (++tries < 40) setTimeout(retry, 8000); });
            })();
          }).catch(function () { step(2, 'Connection problem. Your payment is recorded; FinPi finishes it automatically when you reopen the app.', 'err'); });
        },
        onCancel: function (cp) { dropPending(cp || curPid); if (!refused) step(1, 'You cancelled. Nothing was paid.', 'err'); },
        onError: function (e) { if (!refused) step(1, '✕ ' + esc((e && e.message) || 'Payment error') + '. Nothing was paid.', 'err'); }
      });
    } catch (e) { step(1, '✕ ' + esc(e.message || e), 'err'); }
  }

  /* ── pay with Pi Wallet: you send from your own Pi Wallet; FinPi finds the payment on the Pi blockchain and makes the receipt ── */
  function newRef() { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = 'FP-', b = new Uint8Array(6); crypto.getRandomValues(b); for (var i = 0; i < 6; i++) s += A[b[i] % A.length]; return s; }
  function wpend() { return get('wpend', []).filter(function (p) { return Date.now() - p.ts < 2 * 86400e3; }); }
  function findWalletPay(p) {
    return hz('/accounts/' + p.to + '/payments?order=desc&limit=50&join=transactions').then(function (d) {
      var recs = (d && d._embedded && d._embedded.records) || [], hit = null, byAmt = [];
      recs.forEach(function (r) {
        if (r.type !== 'payment' || r.asset_type !== 'native' || r.to !== p.to) return;
        if (Math.abs(Number(r.amount) - p.amt) > 1e-7 || Date.parse(r.created_at) < p.ts - 120000) return;
        var memo = r.transaction && r.transaction.memo;
        if (memo && String(memo).trim().toUpperCase() === p.ref) hit = r; else byAmt.push(r);
      });
      return hit || (byAmt.length === 1 ? byAmt[0] : null);
    });
  }
  function saveWalletPay(p, r) {
    saveRcpt({ kind: 'wallet', dir: 'out', amount: p.amt, other: short(p.to), addr: p.to, from: r.from, narr: p.narr, cat: p.cat, pid: p.ref, txid: r.transaction_hash, ts: Date.parse(r.created_at) || Date.now(), me: me() });
    put('wpend', wpend().filter(function (x) { return x.ref !== p.ref; }));
    var pl = get('payees', []).filter(function (x) { return x !== p.to; }); pl.unshift(p.to); put('payees', pl.slice(0, 12));
    addNote('check', 'Payment confirmed', fpi(p.amt) + ' π to ' + short(p.to) + ' · ' + p.narr, 'wp-' + p.ref);
    return rcpts().filter(function (x) { return x.txid === r.transaction_hash; })[0];
  }
  /* Payments started in FinPi are remembered from approval until their receipt exists, even if Pi's payment page
     closed FinPi meanwhile. On return FinPi asks the server, which checks the Pi blockchain, and opens the receipt. */
  var inAppBusy = {};
  function dropPending(pid) { var pd = get('pend', {}); delete pd[pid]; put('pend', pd); put('ipend', get('ipend', []).filter(function (y) { return y.pid !== pid; })); }
  function checkPendingInApp() {
    var pend = get('pend', {}), ids = Object.keys(pend).concat(get('ipend', []).map(function (x) { return x.pid; }));
    ids = ids.filter(function (v, i) { return ids.indexOf(v) === i && /^[A-Za-z0-9_-]{6,80}$/.test(v); }).slice(0, 20);
    var changed = false;
    ids.forEach(function (pid) { if (pend[pid] && !pend[pid].ts) { pend[pid].ts = Date.now(); changed = true; } });
    if (changed) put('pend', pend);
    ids.forEach(function (pid) {
      if (inAppBusy[pid]) return; var p = pend[pid] || {};
      if (p.ts && Date.now() - p.ts > 7 * 86400e3) { dropPending(pid); return; }
      inAppBusy[pid] = true;
      api('/transfer', { a: 'payout', paymentId: pid }).then(function (x) {
        if (!x) return;
        if (!x.row || !(x.ok || x.refunded)) { if (/not found|Not a transfer/i.test(x.error || '') || (/not completed/i.test(x.error || '') && p.ts && Date.now() - p.ts > 3600e3)) dropPending(pid); return; }
        var r = null;
        if (x.ok) { if (saveTransfer(x.row, 'out')) addNote('send', 'Payment delivered', fpi(x.row.amount) + ' π to ' + (x.row.to ? '@' + x.row.to : short(x.row.to_addr)) + (x.row.narr ? ' · ' + x.row.narr : ''), 'out-' + pid); r = rcpts().filter(function (t) { return t.txid === x.row.txid; })[0]; }
        else { saveRefund(x.row); r = rcpts().filter(function (t) { return t.txid === x.row.refund_txid; })[0]; }
        dropPending(pid);
        if (r) { var pl = get('payees', []), tg = x.row.to || x.row.to_addr; if (tg && x.ok) { pl = pl.filter(function (q) { return q !== tg; }); pl.unshift(tg); put('payees', pl.slice(0, 12)); }
          if (!$('#app').hidden && !$('.sh-wrap')) { render(S.tab); toast(x.ok ? 'Payment delivered · receipt ready' : 'Refunded · receipt ready'); showRcpt(r); } else rerender(); }
      }).catch(function () {}).then(function () { inAppBusy[pid] = false; });
    });
  }
  function checkPendingWallet() {
    wpend().forEach(function (p) {
      findWalletPay(p).then(function (r) { if (r && !rcpts().some(function (x) { return x.txid === r.transaction_hash; })) { saveWalletPay(p, r); toast('Payment confirmed on the Pi blockchain'); rerender(); } }).catch(function () {});
    });
  }
  function txPayments(tx) {
    return Promise.all([hz('/transactions/' + tx), hz('/transactions/' + tx + '/operations?limit=20')]).then(function (res) {
      if (!res[0]) return null;
      var ops = ((res[1] && res[1]._embedded && res[1]._embedded.records) || []).filter(function (o) { return (o.type === 'payment' && o.asset_type === 'native') || o.type === 'create_account'; })
        .map(function (o) { return { from: o.from || o.funder || o.source_account, to: o.to || o.account, amount: Number(o.amount || o.starting_balance) }; });
      return { hash: res[0].hash, at: Date.parse(res[0].created_at), memo: res[0].memo || '', ok: res[0].successful !== false, pays: ops };
    });
  }
  function walletPay(to, amt, narr, cat) {
    var p = { ref: newRef(), to: to, amt: amt, narr: narr, cat: cat, ts: Date.now() };
    var L = wpend(); L.unshift(p); put('wpend', L.slice(0, 20));
    var rows = [['Address', to], ['Amount', fpi(amt)], ['Memo', p.ref]];
    var w = sheet('Pay in Pi Wallet',
      '<div class="big"><div class="v">' + fpi(amt) + ' π</div><div class="c">' + esc(conv(amt)) + '</div><div class="w">To ' + esc(short(to)) + ' · ' + esc(narr) + '</div></div>' +
      '<div class="steps plain"><div>1 · Copy the address, amount and memo</div><div>2 · Open Pi Wallet and tap Send</div><div>3 · Paste them and confirm in Pi Wallet</div><div>4 · Come back: your receipt appears here</div></div>' +
      '<div class="list txd-rows">' + rows.map(function (x, i) { return '<div class="txr"><span>' + x[0] + '</span><b class="' + (i !== 1 ? 'num mono' : 'num') + '">' + esc(x[1]) + (i === 1 ? ' π' : '') + '</b><button type="button" class="cp" data-cp="' + i + '" aria-label="Copy ' + x[0] + '">' + ic('copy') + '</button></div>'; }).join('') + '</div>' +
      '<p class="small muted" style="margin-top:8px">The memo lets FinPi match your payment instantly. Pi Wallet adds its own network fee.</p>' +
      '<div class="status" id="wp-st" style="margin-top:12px">' + ic('refresh', 'width:15px;height:15px;vertical-align:-3px') + ' Waiting for your payment. FinPi checks the Pi blockchain automatically.</div>' +
      '<button type="button" class="btn" data-x="all">' + ic('copy') + 'Copy all details</button><button type="button" class="btn ghost" data-x="tx">Already paid? Add the transaction ID</button>');
    $$('[data-cp]', w).forEach(function (b) { b.onclick = function () { copy(rows[+b.dataset.cp][1]); }; });
    $('[data-x="all"]', w).onclick = function () { copy('Address: ' + to + '\nAmount: ' + fpi(amt) + ' π\nMemo: ' + p.ref); };
    $('[data-x="tx"]', w).onclick = function () { addTxSheet(p); };
    var iv = setInterval(function () {
      if (!document.body.contains(w)) return clearInterval(iv);
      if (document.hidden) return;
      findWalletPay(p).then(function (r) { if (!r || !document.body.contains(w)) return; clearInterval(iv); var rc = saveWalletPay(p, r); closeSheets(); render(S.tab); toast('Payment confirmed on the Pi blockchain'); showRcpt(rc); }).catch(function () {});
    }, 5000);
  }
  /* add a receipt from a transaction ID (a payment made in Pi Wallet) */
  function addTxSheet(p) {
    var w = sheet(p ? 'Add the transaction ID' : 'Get a receipt', '<p class="sh-sub">' + (p ? 'In Pi Wallet, open the payment and copy its transaction ID (64 letters and numbers).' : 'Paste the transaction ID of any Pi payment you sent or received. FinPi reads it from the Pi blockchain and makes a professional receipt.') + '</p>' +
      '<label class="l" for="tx-i">Transaction ID</label><textarea class="in num" id="tx-i" rows="2" maxlength="80" spellcheck="false" style="font-size:14px;resize:none" placeholder="64 letters and numbers"></textarea><div class="hint" id="tx-h"></div>' +
      '<button type="button" class="btn" id="tx-go">' + ic('search') + 'Find payment</button><div id="tx-r"></div>', { stack: true });
    $('#tx-go', w).onclick = function () {
      var v = $('#tx-i', w).value.trim().toLowerCase(), h = $('#tx-h', w), R = $('#tx-r', w);
      if (!/^[a-f0-9]{64}$/.test(v)) { h.innerHTML = '<span class="bad">A transaction ID has 64 letters and numbers.</span>'; return; }
      if (rcpts().some(function (x) { return x.txid === v; })) { h.innerHTML = '<span class="bad">You already have a receipt for this payment.</span>'; return; }
      h.textContent = 'Reading the Pi blockchain…';
      txPayments(v).then(function (t) {
        if (!t) { h.innerHTML = '<span class="bad">Not found on ' + NETN + '. Check the ID.</span>'; return; }
        if (!t.ok || !t.pays.length) { h.innerHTML = '<span class="bad">This transaction moved no Pi.</span>'; return; }
        var pay = t.pays[0];
        if (p) {
          var m = t.pays.filter(function (x) { return x.to === p.to && Math.abs(x.amount - p.amt) < 1e-7; })[0];
          if (!m) { h.innerHTML = '<span class="bad">This payment is not ' + fpi(p.amt) + ' π to ' + esc(short(p.to)) + '.</span>'; return; }
          var rc = saveWalletPay(p, { from: m.from, transaction_hash: t.hash, created_at: new Date(t.at).toISOString() });
          closeSheets(); render(S.tab); toast('Receipt ready'); showRcpt(rc); return;
        }
        h.textContent = '';
        R.innerHTML = '<div class="card" style="margin-top:12px"><p class="small">Found on ' + NETN + '</p><div class="num" style="font-size:26px;font-weight:700">' + fpi(pay.amount) + ' π</div><p class="small num">From ' + esc(short(pay.from)) + '<br>To ' + esc(short(pay.to)) + '<br>' + new Date(t.at).toLocaleString('en-GB') + '</p></div>' +
          '<div class="two"><button type="button" class="btn" data-d="out">' + ic('send') + 'I sent it</button><button type="button" class="btn teal" data-d="in">' + ic('req') + 'I received it</button></div>';
        $$('[data-d]', R).forEach(function (b) { b.onclick = function () {
          var out = b.dataset.d === 'out';
          saveRcpt({ kind: 'wallet', dir: out ? 'out' : 'in', amount: pay.amount, other: short(out ? pay.to : pay.from), addr: out ? pay.to : pay.from, from: pay.from, to: pay.to, narr: t.memo || '', pid: '', txid: t.hash, ts: t.at, me: me() });
          var rc = rcpts().filter(function (x) { return x.txid === t.hash; })[0]; closeSheets(); render(S.tab); toast('Receipt ready'); showRcpt(rc);
        }; });
      }).catch(function () { h.innerHTML = '<span class="bad">Could not reach the Pi blockchain. Try again.</span>'; });
    };
  }

  /* ── request & scan: payment codes (QR) and links that open FinPi with the payment filled in ── */
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(t) { try { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; return JSON.parse(decodeURIComponent(escape(atob(t)))); } catch (e) { return null; } }
  function payLink(o) { return location.origin + '/#pay=' + enc(o); }
  /* what a scanned or opened code asks for: { u: @username or G-address, a: amount, x: reason } */
  function parseCode(t) {
    t = String(t || '').trim(); var m = /#pay=([A-Za-z0-9_-]{4,1200})/.exec(t);
    if (m) { var o = dec(m[1]); if (o && (isG(String(o.u || '')) || USER_RE.test(String(o.u || '')))) { var a = Number(o.a); return { u: String(o.u), a: a > 0 && a <= 1e7 ? r7(a) : 0, x: String(o.x || '').slice(0, 80), link: true }; } return null; }
    var g = /(G[A-Z2-7]{55})/.exec(t.toUpperCase()); if (g && validG(g[1])) { var am = /amount=([0-9.]+)/i.exec(t); return { u: g[1], a: am ? r7(am[1]) : 0, x: '' }; }
    return null;
  }
  function openCode(c) {
    if (!c) return;
    if (!isG(c.u) && !(S.cfg.enabled && S.cfg.usernames)) { toast('This request is for a FinPi @username. Ask for their wallet address to pay from Pi Wallet.'); return; }
    if (!isG(c.u) && needSignIn('Sign in with Pi to pay @' + c.u + '.')) { pendingCode = c; return; }
    go('pay'); setTimeout(function () { sendSheet(c); }, 250);
  }
  var pendingCode = null;
  function readHash() { var c = /#pay=/.test(location.hash) ? parseCode(location.hash) : null; if (/#pay=/.test(location.hash)) { try { history.replaceState(null, '', location.pathname); } catch (e) {} } return c; }
  function requestSheet(isLink) {
    if (needTarget(isLink ? 'Payment links' : 'Request Pi')) return;
    var to = myTarget();
    var w = sheet(isLink ? 'Create payment link' : 'Request Pi', '<p class="sh-sub">' + (isLink ? 'Leave the amount empty to let the payer choose.' : 'Create a payment code. The payer scans it with FinPi, checks the details and pays you.') + '</p>' +
      '<label class="l" for="q-a">Amount' + (isLink ? ' (optional)' : '') + '</label><div class="amt"><input id="q-a" type="number" inputmode="decimal" placeholder="0.00"><span>π</span></div><div class="hint num" id="q-c"></div>' +
      '<label class="l" for="q-x">What is it for?</label><input class="in" id="q-x" maxlength="80" placeholder="e.g. Rent, groceries, shop payment">' +
      '<button type="button" class="btn" id="q-go">' + ic(isLink ? 'link' : 'qr') + (isLink ? 'Create link' : 'Create payment code') + '</button>', { stack: !!isLink });
    var a = $('#q-a', w); a.oninput = function () { $('#q-c', w).textContent = conv(r7(a.value)); }; setTimeout(function () { a.focus(); }, 120);
    $('#q-go', w).onclick = function () {
      var v = r7(a.value) || 0, x = $('#q-x', w).value.trim();
      if (!isLink && !(v >= 0.01)) return toast('Enter the amount in π'); if (v && v < 0.01) return toast('The smallest amount is 0.01 π'); if (!x) return toast('Say what the payment is for');
      var o = { u: to, a: v, x: x }; saveLink(o); showLink(o, isLink ? 'Payment link' : 'Payment request');
    };
  }
  /* QR scanner: camera, or a photo of a QR code from the gallery */
  var jsqrP = null;
  function loadJsQR() { if (window.jsQR) return Promise.resolve(); if (!jsqrP) jsqrP = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'vendor/jsqr.js?v=1'; s.onload = ok; s.onerror = function () { jsqrP = null; no(); }; document.head.appendChild(s); }); return jsqrP; }
  function decodeImageData(d) { try { var q = window.jsQR && jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' }); return q ? q.data : ''; } catch (e) { return ''; } }
  function scanSheet() {
    var stream = null, raf = 0, done = false, cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    var w = sheet('Scan QR code', '<p class="sh-sub">Point the camera at a FinPi payment code or a Pi wallet address QR.</p>' +
      '<div class="scan"><video id="sc-v" playsinline muted></video><div class="scan-f"></div><div class="scan-m" id="sc-m">Starting camera…</div></div>' +
      '<label class="btn ghost" style="cursor:pointer">' + ic('down') + 'Scan a photo from the gallery<input type="file" id="sc-f" accept="image/*" hidden></label>', { onClose: stop });
    function stop() { done = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); }
    function found(t) {
      var c = parseCode(t); if (!c) { $('#sc-m', w) && ($('#sc-m', w).textContent = 'This QR code is not a Pi payment code.'); return false; }
      stop(); w.remove(); if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {} openCode(c); return true;
    }
    var v = $('#sc-v', w), msg = $('#sc-m', w);
    loadJsQR().then(function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = 'Camera is not available here. Scan a photo instead.'; return; }
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false }).then(function (s) {
        if (done) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = s; v.srcObject = s; v.play(); msg.textContent = 'Looking for a QR code…';
        var last = 0;
        (function tick(ts) {
          if (done) return; raf = requestAnimationFrame(tick);
          if (ts - last < 180 || v.readyState < 2) return; last = ts;
          var W = v.videoWidth, H = v.videoHeight, k = Math.min(1, 720 / Math.max(W, H)); cv.width = W * k; cv.height = H * k;
          cx.drawImage(v, 0, 0, cv.width, cv.height); var t = decodeImageData(cx.getImageData(0, 0, cv.width, cv.height)); if (t) found(t);
        })(0);
      });
    }).catch(function () { msg.textContent = 'Camera permission was not given. You can scan a photo instead.'; });
    $('#sc-f', w).onchange = function () {
      var f = this.files && this.files[0]; if (!f) return; msg.textContent = 'Reading photo…';
      loadJsQR().then(function () {
        var img = new Image(), u = URL.createObjectURL(f);
        img.onload = function () { var k = Math.min(1, 1400 / Math.max(img.width, img.height)); cv.width = img.width * k; cv.height = img.height * k; cx.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); var t = decodeImageData(cx.getImageData(0, 0, cv.width, cv.height)); if (!t || !found(t)) msg.textContent = t ? 'This QR code is not a Pi payment code.' : 'No QR code found in this photo. Try a clearer one.'; };
        img.src = u;
      }).catch(function () { msg.textContent = 'Could not load the scanner. Check your connection.'; });
    };
  }

  /* ── receive: your @username and your wallet address ── */
  function receiveSheet() {
    var a = get('addr', ''), sug = get('addrSug', ''), un = S.cfg.enabled && S.cfg.usernames && signedIn();
    var w = sheet('Receive Pi', '<p class="sh-sub">Share your ' + (un ? '@username or ' : '') + 'wallet address. People pay you from Pi Wallet' + (un ? ' or FinPi' : '') + '.</p>' +
      (!un ? '' : '<div class="card" style="margin-top:8px"><p class="small">Your FinPi username</p><div class="row"><div class="grow" style="font-size:24px;font-weight:700;overflow-wrap:anywhere">@' + esc(me()) + '</div><button type="button" class="tbtn" data-x="cu" aria-label="Copy username">' + ic('copy') + '</button></div><p class="small muted" style="margin-top:4px">FinPi users send to this in seconds.</p></div>') +
      '<div class="card"><p class="small">Your Pi wallet address</p>' + (a ? (window.FPQR ? '<div class="qr" style="border:0;padding:6px 0 10px">' + FPQR.svg(a, 200, '#0A1F55') + '</div>' : '') + '<div class="row"><div class="grow num" style="font-size:13.5px;overflow-wrap:anywhere">' + esc(a) + '</div><button type="button" class="tbtn" data-x="ca" aria-label="Copy address">' + ic('copy') + '</button></div><p class="small muted" style="margin-top:4px">Anyone can scan this code or send to the address from Pi Wallet or FinPi.</p>'
        : (sug ? '<button type="button" class="btn soft" data-x="ua">' + ic('check') + 'Use my address ' + esc(short(sug)) + '</button>' : '') + '<button type="button" class="btn ghost" data-x="aa">' + ic('card') + 'Add my wallet address</button>') + '</div>' +
      (a ? '<button type="button" class="btn" data-x="sh">' + ic('share') + 'Share my wallet address</button>' : ''));
    var t = function () { return (un ? 'Send me Pi on FinPi: @' + me() + '\n' : '') + (get('addr', '') ? 'My Pi wallet address: ' + get('addr', '') : ''); };
    var cu = $('[data-x="cu"]', w); if (cu) cu.onclick = function () { copy('@' + me()); };
    var ca = $('[data-x="ca"]', w); if (ca) ca.onclick = function () { copy(a); };
    var ua = $('[data-x="ua"]', w); if (ua) ua.onclick = function () { if (validG(sug)) { put('addr', sug); put('addrSug', ''); receiveSheet(); loadWal(); } };
    var aa = $('[data-x="aa"]', w); if (aa) aa.onclick = function () { addrSheet(true); };
    var shb = $('[data-x="sh"]', w); if (shb) shb.onclick = function () { shareText('FinPi', t()); };
  }
  /* ── wallet address (read-only, from the public Pi blockchain) ── */
  function validG(a) {
    if (!/^G[A-Z2-7]{55}$/.test(a)) return false;
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', bits = 0, val = 0, b = [];
    for (var i = 0; i < a.length; i++) { val = ((val << 5) | A.indexOf(a[i])) & 0xffffff; bits += 5; if (bits >= 8) { b.push((val >>> (bits - 8)) & 255); bits -= 8; } }
    if (b.length !== 35 || b[0] !== 48) return false;
    var crc = 0; for (i = 0; i < 33; i++) { crc ^= b[i] << 8; for (var j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff; }
    return b[33] === (crc & 255) && b[34] === (crc >> 8);
  }
  function hz(path) { return fetch(HORIZON + path, { headers: { Accept: 'application/json' } }).then(function (r) { if (r.status === 404) return null; if (!r.ok) throw new Error('hz'); return r.json(); }); }
  function lookAddr(a) {
    return Promise.all([hz('/accounts/' + a), hz('/accounts/' + a + '/payments?order=desc&limit=12').catch(function () { return null; })]).then(function (res) {
      var acc = res[0], list = (res[1] && res[1]._embedded && res[1]._embedded.records) || [];
      var bal = acc ? Number(((acc.balances || []).filter(function (b) { return b.asset_type === 'native'; })[0] || {}).balance || 0) : null;
      var pays = list.filter(function (p) { return (p.type === 'payment' && p.asset_type === 'native') || p.type === 'create_account'; }).map(function (p) {
        var to = p.to || p.account, from = p.from || p.funder; return { inn: to === a, amt: Number(p.amount || p.starting_balance), other: to === a ? from : to, at: Date.parse(p.created_at), tx: p.transaction_hash };
      });
      return { addr: a, exists: !!acc, bal: bal, pays: pays, t: Date.now() };
    });
  }
  function walBalHTML() {
    var a = get('addr', ''), W = S.wal;
    if (!a) {
      var sug = get('addrSug', '');
      return '<h3>See your Pi balance here</h3><p>Paste your Pi wallet address once, and FinPi shows your balance in ' + esc(curr()) + ' and your payment history from the Pi blockchain.</p>' +
        '<div class="note gray" style="margin-top:10px">' + ic('info') + '<span><b>Where to find it:</b> open Pi Wallet and copy your address (it starts with G). It is public and safe to share. FinPi can only view it: it can never move your Pi.</span></div>' +
        (sug ? '<button type="button" class="btn soft" data-act="addr-use">' + ic('check') + 'Use my address ' + esc(short(sug)) + '</button>' : '') +
        '<button type="button" class="btn" data-act="addr-set">' + ic('card') + 'Paste my wallet address</button>';
    }
    if (!W || W.addr !== a) return '<h3>Your Pi balance</h3><p class="num">' + esc(short(a)) + '</p><p style="margin-top:8px">Loading from the Pi blockchain…</p>';
    if (W.err) return '<h3>Your Pi balance</h3><p>The Pi blockchain could not be reached. <button type="button" class="lnk" data-act="wal-load">Try again</button></p>';
    var c = curr(), r = rateIn(c), u = rateIn('USD');
    return '<div class="row"><div class="grow"><p class="small">Available on ' + NETN + '</p><div class="num" style="font-size:28px;font-weight:700">' + (W.exists ? fpi(W.bal) : '0') + ' π</div>' +
      '<p class="num small">' + (W.exists && u ? '≈ ' + money(W.bal * u, 'USD') + (r && c !== 'USD' ? ' · ' + money(W.bal * r, c) : '') : '') + '</p></div>' +
      '<button type="button" class="tbtn" data-act="wal-load" aria-label="Refresh">' + ic('refresh') + '</button></div>' +
      (W.exists ? '' : '<div class="note warn" style="margin-top:10px">' + ic('info') + '<span>This address has no activity on ' + NETN + ' yet.</span></div>') +
      '<p class="small muted" style="margin-top:8px">' + esc(short(a)) + ' · updated ' + ago(W.t) + ' · <button type="button" class="lnk small" data-act="addr-set">Change</button></p>';
  }
  function loadWal() {
    var a = get('addr', ''); if (!a) return;
    S.wal = { addr: a }; var wb = $('[data-p="wbal"]'); if (wb) wb.innerHTML = walBalHTML();
    lookAddr(a).then(function (W) { S.wal = W; }).catch(function () { S.wal = { addr: a, err: true }; }).then(function () { var e = $('[data-p="wbal"]'); if (e) e.innerHTML = walBalHTML(); var h = $('[data-p="whist"]'); if (h) h.innerHTML = walHistHTML(); });
  }
  function walHistHTML() {
    var W = S.wal; if (!W || !W.pays) return '';
    if (!W.pays.length) return '<div class="list"><div class="empty">No payments on this address yet.</div></div>';
    return '<div class="list">' + W.pays.slice(0, 8).map(function (p) {
      return '<a class="li" href="receipt.html#tx=' + esc(p.tx) + '&net=' + NETQ + '"><span class="ico' + (p.inn ? ' in' : '') + '">' + ic(p.inn ? 'req' : 'send') + '</span><span class="grow"><b>' + (p.inn ? 'Received' : 'Sent') + '</b><small class="num">' + (p.inn ? 'from ' : 'to ') + esc(short(p.other)) + ' · ' + ago(p.at) + '</small></span><span class="amt-r"><b class="' + (p.inn ? 'pos' : '') + '">' + (p.inn ? '+' : '−') + fpi(p.amt) + ' π</b></span></a>';
    }).join('') + '</div>';
  }
  function addrSheet(save) {
    var w = sheet(save ? 'Your Pi wallet address' : 'Check a Pi address', '<p class="sh-sub">' + (save ? 'Copy it from Pi Wallet (it starts with G). It is public and safe to share. FinPi only reads it.' : 'See the balance and recent payments of any Pi address on the public blockchain.') + '</p>' +
      '<label class="l" for="ad-i">Wallet address</label><textarea class="in num" id="ad-i" rows="2" maxlength="56" autocapitalize="characters" spellcheck="false" placeholder="G…" style="font-size:14px;resize:none">' + esc(save ? get('addr', '') : '') + '</textarea><div class="hint" id="ad-h"></div>' +
      '<div class="note warn" style="margin-top:8px">' + ic('lock') + '<span>Never paste your passphrase or secret key anywhere. An address starts with G; a secret key starts with S.</span></div>' +
      '<button type="button" class="btn" id="ad-go">' + (save ? 'Save address' : ic('search') + 'Check address') + '</button>' + (save && get('addr', '') ? '<button type="button" class="btn danger" id="ad-rm">Remove address</button>' : '') + '<div id="ad-r" style="margin-top:12px"></div>');
    var i = $('#ad-i', w);
    i.oninput = function () { var v = i.value.replace(/\s/g, '').toUpperCase(); var h = $('#ad-h', w); if (!v) return; if (/^S/.test(v)) { h.innerHTML = '<span class="bad">This looks like a SECRET key. Do not share it with anyone, ever.</span>'; i.value = ''; return; } h.innerHTML = v.length === 56 ? (validG(v) ? '<span class="ok">✓ Valid Pi address</span>' : '<span class="bad">This address is not valid. Check it and try again.</span>') : ''; };
    $('#ad-go', w).onclick = function () {
      var v = i.value.replace(/\s/g, '').toUpperCase(); if (!validG(v)) return toast('Enter a valid Pi address (G…)');
      if (save) { put('addr', v); put('addrSug', ''); closeSheets(); render(S.tab); loadWal(); toast('Address saved'); return; }
      var R = $('#ad-r', w); R.innerHTML = '<p class="muted">Checking the Pi blockchain…</p>';
      lookAddr(v).then(function (W) { S.wal2 = W; var u = rateIn('USD'), c = curr(), r = rateIn(c);
        R.innerHTML = '<div class="card"><p class="small">Balance on ' + NETN + '</p><div class="num" style="font-size:24px;font-weight:700">' + (W.exists ? fpi(W.bal) : '0') + ' π</div><p class="small num">' + (W.exists && u ? '≈ ' + money(W.bal * u, 'USD') + (r && c !== 'USD' ? ' · ' + money(W.bal * r, c) : '') : 'No activity on this network yet') + '</p></div>' +
          (W.pays.length ? '<div class="day">Recent payments</div>' + (function () { var s = S.wal; S.wal = W; var h = walHistHTML(); S.wal = s; return h; })() : '');
      }).catch(function () { R.innerHTML = '<div class="status err">The Pi blockchain could not be reached. Try again.</div>'; });
    };
    var rm = $('#ad-rm', w); if (rm) rm.onclick = function () { put('addr', ''); S.wal = null; closeSheets(); render(S.tab); toast('Address removed'); };
  }
  function verifySheet() {
    var w = sheet('Verify a payment', '<p class="sh-sub">Paste a transaction ID from a receipt to check it on the public Pi blockchain.</p><label class="l" for="vf-i">Transaction ID</label><textarea class="in num" id="vf-i" rows="2" maxlength="64" spellcheck="false" style="font-size:14px;resize:none" placeholder="64 letters and numbers"></textarea><button type="button" class="btn" id="vf-go">' + ic('check') + 'Verify</button>');
    $('#vf-go', w).onclick = function () { var v = $('#vf-i', w).value.trim().toLowerCase(); if (!/^[a-f0-9]{64}$/.test(v)) return toast('A transaction ID has 64 letters and numbers'); location.href = 'receipt.html#tx=' + v + '&net=' + NETQ; };
  }

  /* ── price & currency sheets ── */
  function wChartHTML() {
    var p = S.p; if (!p || !p.usd) return '<div class="empty">' + ic('act') + '<div>' + (pBusy ? '' : 'Rate unavailable right now.') + '</div></div>';
    var s = p.spark || [], mn = s.length ? Math.min.apply(null, s) : p.usd, mx = s.length ? Math.max.apply(null, s) : p.usd, c = curr(), r = rateIn(c), ch = p.change24h;
    return '<div class="row" style="align-items:flex-end"><div class="grow"><p class="small">1 π in US dollars</p><div class="num" style="font-size:30px;font-weight:700">' + money(p.usd, 'USD', 4) + '</div></div>' + (typeof ch === 'number' ? '<span class="chip" style="color:' + (ch >= 0 ? 'var(--ok)' : 'var(--bad)') + ';font-weight:700">' + (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(2) + '%</span>' : '') + '</div>' +
      '<div class="chart" style="margin-top:8px">' + spark(s, 300, 150, '#1D4ED8', .22) + '</div>' +
      '<div class="stats"><div><small>7-day low</small><b>' + money(mn, 'USD', 4) + '</b></div><div><small>7-day high</small><b>' + money(mx, 'USD', 4) + '</b></div><div><small>In ' + esc(c) + '</small><b>' + (r ? money(r, c, r < 1 ? 4 : 2) : '—') + '</b></div></div>' ;
  }
  function curSheet() {
    var codes = S.fx ? Object.keys(S.fx).filter(function (c) { return /^[A-Z]{3}$/.test(c); }) : ['USD', 'NGN', 'SAR'];
    if (codes.indexOf('USD') < 0) codes.push('USD');
    var list = codes.map(function (c) { return { c: c, n: cname(c) }; }).sort(function (a, b) { return a.n.localeCompare(b.n); });
    var cur = curr();
    var w = sheet('Your currency', '<p class="sh-sub">FinPi shows Pi values in this currency. Payments are always in Pi.</p><div class="to" style="margin-top:6px">' + ic('search', 'color:var(--mute)') + '<input id="cu-q" placeholder="Search currency" autocomplete="off"></div><div class="list cur-list" id="cu-l"></div>');
    function draw() {
      var q = $('#cu-q', w).value.trim().toLowerCase();
      $('#cu-l', w).innerHTML = list.filter(function (x) { return !q || x.c.toLowerCase().indexOf(q) >= 0 || x.n.toLowerCase().indexOf(q) >= 0; }).slice(0, 80).map(function (x) {
        var r = rateIn(x.c); return '<button type="button" class="li' + (x.c === cur ? ' on' : '') + '" data-cu="' + x.c + '"><span class="grow"><b>' + esc(x.n) + '</b><small>' + x.c + '</small></span><span class="amt-r"><b class="num">' + (r ? money(r, x.c, r < 1 ? 4 : 2) : '') + '</b><small>per π</small></span></button>';
      }).join('') || '<div class="empty">No currency found</div>';
      $$('[data-cu]', w).forEach(function (b) { b.onclick = function () { put('cur', b.dataset.cu); closeSheets(); toast('Currency: ' + cname(b.dataset.cu)); render(S.tab); paintPrice(); }; });
    }
    $('#cu-q', w).oninput = draw; draw();
  }
  function cvCalc(from) {
    var p = S.p; if (!p || !p.usd) return; var c = curr(), r = rateIn(c), pi = $('#cv-pi'), us = $('#cv-usd'), lo = $('#cv-loc'); if (!pi) return;
    var v = from === 'pi' ? parseFloat(pi.value) : from === 'usd' ? parseFloat(us.value) / p.usd : (r ? parseFloat(lo.value) / r : NaN);
    if (!(v >= 0)) v = 0;
    if (from !== 'pi') pi.value = v ? +v.toFixed(4) : '';
    if (from !== 'usd') us.value = v ? (v * p.usd).toFixed(2) : '';
    if (lo && from !== 'loc') lo.value = v && r ? (v * r).toFixed(v * r >= 100 ? 0 : 2) : '';
  }

  /* ── month maths ── */
  function monthRange(off) { var d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() + (off || 0)); var e = new Date(d); e.setMonth(e.getMonth() + 1); return [d.getTime(), e.getTime(), d]; }
  function monthStats(off) {
    var m = monthRange(off), o = { out: 0, inn: 0, n: 0, cats: {} };
    rcpts().forEach(function (r) {
      if (r.ts < m[0] || r.ts >= m[1]) return; o.n++;
      if (r.dir === 'in') o.inn += Number(r.amount); else { o.out += Number(r.amount); var c = r.kind === 'supporter' ? 'Other' : (r.cat || 'Other'); o.cats[c] = (o.cats[c] || 0) + Number(r.amount); }
    });
    o.out = r7(o.out); o.inn = r7(o.inn); return o;
  }
  function monthHTML() {
    var s = monthStats(0), b = get('budget', 0), u = rateIn('USD'), pct = b ? Math.min(100, s.out / b * 100) : 0;
    return '<div class="row"><div class="grow"><h3>This month</h3><p>' + new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '</p></div><button type="button" class="lnk" data-tab="activity" data-seg="ins">Insights</button></div>' +
      '<div class="stats"><div><small>Sent</small><b>' + fpi(s.out) + ' π</b></div><div><small>Received</small><b class="pos">' + fpi(s.inn) + ' π</b></div><div><small>Payments</small><b>' + s.n + '</b></div></div>' +
      (b ? '<div style="margin-top:12px" class="row small"><span class="grow muted">Budget ' + fpi(b) + ' π' + (u ? ' (' + money(b * u, 'USD') + ')' : '') + '</span><b class="num">' + Math.round(s.out / b * 100) + '%</b></div><div class="bar"><i class="' + (s.out > b ? 'over' : '') + '" style="width:' + pct + '%"></i></div>' : '<button type="button" class="lnk small" data-act="budget">+ Set a monthly budget</button>');
  }

  /* ── views ── */
  function hour() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  function txRow(r, i) {
    var inn = r.dir === 'in', cls = r.kind === 'refund' ? 'rf' : r.kind === 'supporter' ? 'sp' : inn ? 'in' : '';
    return '<button type="button" class="li" data-rc="' + i + '"><span class="ico ' + cls + '">' + ic(r.kind === 'refund' ? 'undo' : r.kind === 'supporter' ? 'heart' : inn ? 'req' : 'send') + '</span><span class="grow"><b>' + esc(rcptTitle(r)) + '</b><small>' + esc((r.narr ? r.narr + ' · ' : '') + new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) + '</small></span><span class="amt-r"><b class="' + (inn ? 'pos' : '') + '">' + (inn ? '+' : '−') + fpi(r.amount) + ' π</b><small>' + (r.cat && !inn ? esc(r.cat) : 'Verified') + '</small></span></button>';
  }
  function pendingList() {
    var pd = get('pend', {}), R = rcpts();
    return Object.keys(pd).filter(function (k) { var p = pd[k]; return p && p.amt && !R.some(function (r) { return r.pid === k; }); })
      .map(function (k) { var p = pd[k]; return { pid: k, to: p.to, amt: p.amt, narr: p.narr, cat: p.cat, ts: p.ts || Date.now() }; }).sort(function (a, b) { return b.ts - a.ts; });
  }
  function pendRow(p) {
    return '<button type="button" class="li" data-pend="' + esc(p.pid) + '"><span class="ico rf">' + ic('refresh') + '</span><span class="grow"><b>To ' + esc(isG(p.to) ? short(p.to) : '@' + p.to) + '</b><small>' + esc((p.narr ? p.narr + ' · ' : '') + new Date(p.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) + '</small></span><span class="amt-r"><b>−' + fpi(p.amt) + ' π</b><small>Processing</small></span></button>';
  }
  function pendSheet(pid) {
    var p = pendingList().filter(function (x) { return x.pid === pid; })[0]; if (!p) return;
    var w = sheet('Payment processing', '<div class="big"><div class="v">' + fpi(p.amt) + ' π</div><div class="c">' + esc(conv(p.amt)) + '</div><div class="w">To ' + esc(isG(p.to) ? short(p.to) : '@' + p.to) + (p.narr ? ' · ' + esc(p.narr) : '') + '</div></div>' +
      '<div class="note" style="margin-top:12px">' + ic('refresh') + '<span>Your payment is being delivered. The receipt will appear here as soon as it is done.</span></div>' +
      '<button type="button" class="btn" data-x="chk">' + ic('refresh') + 'Check now</button>');
    $('[data-x="chk"]', w).onclick = function () { closeSheets(); toast('Checking…'); checkPendingInApp(); };
  }
  var TIPS = ['FinPi staff will never ask you to send Pi or share your passphrase.', 'Check the @username and amount on the final screen before you approve.', 'A receipt is genuine only if its QR code checks out on the Pi blockchain.', 'Your passphrase and secret key (starting with S) are for you alone. Never type them into any app.'];
  var T = {
    home: function () {
      var R = rcpts();
      return '<div class="hello"><h1>' + hour() + (signedIn() ? ', @' + esc(me()) : '') + '</h1><p>' + (signedIn() ? 'Here is your Pi today.' : 'You are exploring. Sign in to send and receive Pi.') + '</p></div>' +
        '<div class="hero" data-act="price" data-p="hero" role="button" tabindex="0" aria-label="Pi price details">' + heroHTML() + '</div>' +
        '<div class="qa"><button type="button" data-act="send"><i>' + ic('send') + '</i>Send</button><button type="button" data-act="request"><i class="t">' + ic('req') + '</i>Request</button><button type="button" data-act="scan"><i class="n">' + ic('qr') + '</i>Scan</button><button type="button" data-act="receive"><i class="a">' + ic('card') + '</i>Receive</button></div>' +
        dueHTML() + '<div class="sec"><h2>Overview</h2></div><div class="card" data-p="month">' + monthHTML() + '</div>' +
        '<div class="sec"><h2>Recent activity</h2>' + (R.length ? '<button type="button" data-tab="activity">See all</button>' : '') + '</div>' +
        (pendingList().length ? '<div class="list" style="margin-bottom:10px">' + pendingList().slice(0, 3).map(pendRow).join('') + '</div>' : '') +
        (R.length ? '<div class="list">' + R.slice(0, 4).map(txRow).join('') + '</div>' : pendingList().length ? '' : '<div class="list"><div class="empty">' + ic('act') + '<div>No payments yet. Your receipts appear here.</div></div></div>') +
        '<div class="note" style="margin-top:16px">' + ic('shield') + '<span>' + TIPS[new Date().getDate() % TIPS.length] + '</span></div>';
    },
    pay: function () {
      var on = S.cfg.enabled, pl = contacts().map(function (c) { return c.to; }).concat(get('payees', [])).filter(function (p, i, L) { return (isG(p) || userSends()) && L.map(function (q) { return q.toLowerCase(); }).indexOf(p.toLowerCase()) === i; });
      return '<div class="ph"><h1>Send &amp; receive</h1><p>Send, request and receive Pi, with a receipt for every payment.</p></div>' +
        '<div class="tiles" style="margin-top:14px">' +
        '<button type="button" class="tile" data-act="send"><i>' + ic('send') + '</i><b>Send Pi</b><small>' + (on ? (S.cfg.usernames ? 'To a @username or a wallet address' : 'To any Pi wallet address') : 'From your Pi Wallet to any address') + '</small></button>' +
        '<button type="button" class="tile" data-act="request"><i class="t">' + ic('req') + '</i><b>Request Pi</b><small>A payment code with the amount</small></button>' +
        '<button type="button" class="tile" data-act="scan"><i class="n">' + ic('qr') + '</i><b>Scan to pay</b><small>A payment code or wallet QR</small></button>' +
        '<button type="button" class="tile" data-act="receive"><i class="a">' + ic('card') + '</i><b>Receive Pi</b><small>' + (on && S.cfg.usernames ? 'Your @username and wallet address' : 'Your wallet address and QR code') + '</small></button></div>' +
        (pl.length ? '<div class="sec"><h2>Pay again</h2><button type="button" data-act="contacts">Contacts</button></div><div class="chips">' + pl.slice(0, 8).map(function (p) { return '<button type="button" class="chip" data-act="send-to" data-u="' + esc(p) + '">' + esc(cName(p) || toLabel(p)) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="sec"><h2>More ways to pay</h2></div><div class="tiles">' +
        '<button type="button" class="tile" data-act="links"><i>' + ic('link') + '</i><b>Payment links</b><small>Share a link or QR to get paid</small></button>' +
        '<button type="button" class="tile" data-act="split"><i class="t">' + ic('users') + '</i><b>Split a bill</b><small>Share a cost and request each part</small></button>' +
        '<button type="button" class="tile" data-act="contacts"><i class="n">' + ic('user') + '</i><b>Contacts</b><small>People you pay often</small></button>' +
        '<button type="button" class="tile" data-act="rems"><i class="a">' + ic('bell') + '</i><b>Reminders</b><small>Rent, fees and regular payments</small></button></div>' +
        '<div class="sec"><h2>Tools</h2></div>' +
        '<div class="tiles"><button type="button" class="tile" data-act="get-rcpt"><i class="n">' + ic('rcpt') + '</i><b>Get a receipt</b><small>For any Pi payment, from its transaction ID</small></button><button type="button" class="tile" data-act="verify"><i class="a">' + ic('check') + '</i><b>Verify a payment</b><small>Check any transaction on the blockchain</small></button></div>';
    },
    wallet: function () {
      var c = curr();
      return '<div class="ph"><h1>Wallet</h1><p>Live Pi rate in any currency, converter and blockchain tools.</p></div>' +
        '<div class="card" data-p="wchart">' + wChartHTML() + '</div>' +
        '<div class="sec"><h2>Converter</h2><button type="button" data-act="currency">' + esc(c) + ' ▾</button></div>' +
        '<div class="card conv"><label><span>π</span><input id="cv-pi" type="number" inputmode="decimal" value="1" aria-label="Pi"></label><label><span>USD</span><input id="cv-usd" type="number" inputmode="decimal" aria-label="US dollars"></label>' + (c !== 'USD' ? '<label><span>' + esc(c) + '</span><input id="cv-loc" type="number" inputmode="decimal" aria-label="' + esc(cname(c)) + '"></label>' : '') + '</div>' +
        '<div class="sec"><h2>Tools</h2></div><div class="tiles"><button type="button" class="tile" data-act="get-rcpt"><i class="n">' + ic('rcpt') + '</i><b>Get a receipt</b><small>For any Pi payment, from its transaction ID</small></button><button type="button" class="tile" data-act="verify"><i>' + ic('check') + '</i><b>Verify a payment</b><small>Check a transaction on the blockchain</small></button><button type="button" class="tile" data-act="check-addr"><i class="t">' + ic('search') + '</i><b>Check an address</b><small>Balance and payments of any Pi address</small></button><button type="button" class="tile" data-act="receive"><i class="a">' + ic('qr') + '</i><b>My QR code</b><small>Your wallet address to get paid</small></button><button type="button" class="tile" data-act="alerts"><i class="t">' + ic('bell') + '</i><b>Price alerts</b><small>Know when Pi reaches your price</small></button><button type="button" class="tile" data-act="statement"><i>' + ic('rcpt') + '</i><b>Statement</b><small>Monthly PDF of your payments</small></button></div>' +
        '<div class="note gray" style="margin-top:14px">' + ic('info') + '<span>FinPi never holds your Pi. Your Pi stays in your own Pi Wallet.</span></div>';
    },
    activity: function () {
      var R = rcpts();
      var head = '<div class="ph"><h1>Activity</h1><p>All your payments and receipts.</p></div><div class="seg" role="tablist"><button type="button" data-seg="tx" class="' + (S.seg === 'tx' ? 'on' : '') + '">Transactions</button><button type="button" data-seg="ins" class="' + (S.seg === 'ins' ? 'on' : '') + '">Insights</button></div>';
      if (S.seg === 'ins') return head + insightsHTML();
      var f = S.filter, F = R.map(function (r, i) { return [r, i]; }).filter(function (x) { var r = x[0]; return f === 'all' || (f === 'out' && r.dir === 'out') || (f === 'in' && r.dir === 'in' && r.kind !== 'refund') || (f === 'ref' && r.kind === 'refund'); });
      var out = '', day = '';
      F.forEach(function (x) { var d = new Date(x[0].ts).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); if (d !== day) { if (day) out += '</div>'; out += '<div class="day">' + d + '</div><div class="list">'; day = d; } out += txRow(x[0], x[1]); });
      if (day) out += '</div>';
      return head + '<div class="chips" style="margin-top:12px">' + [['all', 'All'], ['out', 'Sent'], ['in', 'Received'], ['ref', 'Refunds']].map(function (x) { return '<button type="button" class="chip' + (f === x[0] ? ' on' : '') + '" data-flt="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (pendingList().length && (f === 'all' || f === 'out') ? '<div class="day">Processing</div><div class="list">' + pendingList().map(pendRow).join('') + '</div>' : '') +
        (out || (pendingList().length && (f === 'all' || f === 'out') ? '' : '<div class="list" style="margin-top:14px"><div class="empty">' + ic('rcpt') + '<div>Nothing here yet.</div></div></div>')) +
        (R.length ? '<div class="two" style="margin-top:4px"><button type="button" class="btn" data-act="statement">' + ic('rcpt') + 'Statement PDF</button><button type="button" class="btn ghost" data-act="csv">' + ic('down') + 'Export CSV</button></div>' : '');
    },
    profile: function () {
      var sup = get('supporter', false);
      return '<div class="pcard"><div class="avatar">' + esc(signedIn() ? me().charAt(0) : 'G') + '</div><div class="grow"><b>' + (signedIn() ? '@' + esc(me()) : 'Guest') + '</b><small>' + (get('name', '') ? esc(get('name', '')) + ' · ' : '') + NETN + '</small>' + (sup ? '<div class="badge">' + ic('star') + 'FinPi Supporter</div>' : '') + '</div></div>' +
        (!signedIn() ? '<button type="button" class="btn" data-act="signin" style="margin-top:14px"><span class="pi-dot">π</span>Sign in with Pi</button>' : '') +
        '<div class="sec"><h2>Settings</h2></div><div class="list">' +
        row('edit', 'Name on receipts', get('name', '') || 'Not set', 'name') + row('globe', 'Currency', cname(curr()) + ' (' + curr() + ')', 'currency') +
        row('bell', 'Phone notifications', get('push', false) ? 'On' : 'Off', 'push') + row('pie', 'Monthly budget', get('budget', 0) ? fpi(get('budget', 0)) + ' π' : 'Not set', 'budget') + row('card', 'Wallet address', get('addr', '') ? short(get('addr', '')) : 'Not added', 'addr-set') + '</div>' +
        '<div class="sec"><h2>Tools</h2></div><div class="list">' + row('users', 'Contacts', contacts().length ? contacts().length + ' saved' : 'People you pay often', 'contacts') + row('bell', 'Payment reminders', rems().length ? rems().length + ' active' : 'Rent, fees and regular payments', 'rems') + row('act', 'Price alerts', alerts().filter(function (a) { return !a.hit; }).length ? alerts().filter(function (a) { return !a.hit; }).length + ' active' : 'Know when Pi reaches your price', 'alerts') + row('rcpt', 'Monthly statement', 'PDF of your payments', 'statement') + row('info', 'Welcome tour', 'See how FinPi works', 'tour') + '</div>' +
        '<div class="sec"><h2>Security &amp; support</h2></div><div class="list">' +
        row('shield', 'Security center', 'Limits, safety and how FinPi works', 'security') + row('heart', sup ? 'You are a Supporter' : 'Become a Supporter', sup ? 'Thank you!' : '1 π · badge only, no reward', 'supporter') +
        row('mail', 'Help & contact', SUPPORT, 'help') + '</div>' +
        '<div class="sec"><h2>Legal</h2></div><div class="list">' + lrow('Terms of Service', 'terms-of-service.html') + lrow('Privacy Policy', 'privacy-policy.html') + lrow('Risk Disclosure', 'risk-disclosure.html') + '</div>' +
        (signedIn() ? '<button type="button" class="btn danger" data-act="signout" style="margin-top:18px">' + ic('out') + 'Sign out</button>' : '') +
        '<p class="small muted" style="text-align:center;margin-top:16px">FinPi 1.0.0 · ' + NETN + ' · finpi.pi<br>Independent app, not operated by Pi Network.</p>';
      function row(i, t, s, a) { return '<button type="button" class="li" data-act="' + a + '"><span class="ico">' + ic(i) + '</span><span class="grow"><b>' + esc(t) + '</b><small>' + esc(s) + '</small></span><span class="go">' + ic('chev') + '</span></button>'; }
      function lrow(t, h) { return '<a class="li" href="' + h + '"><span class="ico">' + ic('rcpt') + '</span><span class="grow"><b>' + t + '</b></span><span class="go">' + ic('chev') + '</span></a>'; }
    }
  };
  function insightsHTML() {
    var s = monthStats(S.month), m = monthRange(S.month)[2], b = get('budget', 0), u = rateIn('USD'), c = curr(), r = rateIn(c);
    var cats = Object.keys(s.cats).map(function (k) { return [k, s.cats[k]]; }).sort(function (a, b2) { return b2[1] - a[1]; }), top = cats.length ? cats[0][1] : 0;
    return '<div class="card" style="margin-top:14px"><div class="row"><button type="button" class="tbtn" data-mon="-1" aria-label="Previous month">' + ic('chevl') + '</button><div class="grow" style="text-align:center"><b>' + m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '</b></div><button type="button" class="tbtn" data-mon="1" aria-label="Next month"' + (S.month >= 0 ? ' disabled style="opacity:.4"' : '') + '>' + ic('chev') + '</button></div>' +
      '<div class="stats"><div><small>Spent</small><b>' + fpi(s.out) + ' π</b></div><div><small>Received</small><b class="pos">' + fpi(s.inn) + ' π</b></div><div><small>Net</small><b>' + (s.inn - s.out >= 0 ? '+' : '−') + fpi(Math.abs(r7(s.inn - s.out))) + ' π</b></div></div>' +
      (u ? '<p class="small muted" style="margin-top:8px">Spent ≈ ' + money(s.out * u, 'USD') + (r && c !== 'USD' ? ' · ' + money(s.out * r, c) : '') + ' at today’s rate</p>' : '') +
      (b && S.month === 0 ? '<div class="row small" style="margin-top:12px"><span class="grow muted">Monthly budget ' + fpi(b) + ' π</span><b class="num">' + Math.round(s.out / b * 100) + '%</b></div><div class="bar"><i class="' + (s.out > b ? 'over' : '') + '" style="width:' + Math.min(100, s.out / b * 100) + '%"></i></div>' + (s.out > b ? '<div class="note warn" style="margin-top:10px">' + ic('warn') + '<span>You are ' + fpi(r7(s.out - b)) + ' π over your budget this month.</span></div>' : '') : '') + '</div>' +
      '<div class="sec"><h2>Where your Pi went</h2><button type="button" data-act="budget">' + (b ? 'Edit budget' : 'Set budget') + '</button></div>' +
      (cats.length ? '<div class="card">' + cats.map(function (x) { return '<div class="cat"><div class="row"><span>' + esc(x[0]) + '</span><b>' + fpi(x[1]) + ' π</b></div><div class="bar"><i style="width:' + Math.max(4, x[1] / top * 100) + '%"></i></div><small>' + Math.round(x[1] / (s.out || 1) * 100) + '% of spending</small></div>'; }).join('') + '</div>'
        : '<div class="list"><div class="empty">' + ic('pie') + '<div>No spending this month. Choose a category when you send Pi to see it here.</div></div></div>');
  }

  function render(tab) {
    S.tab = tab; var v = $('#view'); if (!v) return;
    v.innerHTML = T[tab]();
    $$('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'); });
    if (tab === 'wallet') { cvCalc('pi'); ['pi', 'usd', 'loc'].forEach(function (k) { var e = $('#cv-' + k); if (e) e.oninput = function () { cvCalc(k); }; }); }
  }
  function go(tab) { if (tab === S.tab && $('#view').innerHTML) { scrollTo({ top: 0, behavior: 'smooth' }); } closeSheets(); render(tab); scrollTo(0, 0); }

  /* ── contacts: people and businesses you pay often (stay on this phone) ── */
  function contacts() { return get('contacts', []); }
  function cName(to) { to = String(to || '').toLowerCase(); var c = contacts().filter(function (x) { return x.to.toLowerCase() === to; })[0]; return c ? c.name : ''; }
  function userSends() { return !!(S.cfg.enabled && S.cfg.usernames); }
  function payTo(to, pre) {
    pre = pre || {}; pre.u = to;
    if (!isG(to) && !userSends()) return toast('Paying a @username opens soon. Use their wallet address for now.');
    sendSheet(pre);
  }
  function contactsSheet() {
    var L = contacts();
    var w = sheet('Contacts', '<p class="sh-sub">People and businesses you pay often. Saved on this phone only.</p>' +
      (L.length ? '<div class="list">' + L.map(function (c, i) { return '<div class="li"><span class="ico">' + ic(isG(c.to) ? 'card' : 'user') + '</span><button type="button" class="grow lb" data-cs="' + i + '"><b>' + esc(c.name) + '</b><small class="num">' + esc(toLabel(c.to)) + '</small></button><button type="button" class="tbtn" data-ce="' + i + '" aria-label="Edit ' + esc(c.name) + '">' + ic('edit') + '</button></div>'; }).join('') + '</div>'
        : '<div class="list"><div class="empty">' + ic('users') + '<div>No contacts yet. Add the people you pay often.</div></div></div>') +
      '<button type="button" class="btn" data-x="add">' + ic('users') + 'Add contact</button>');
    $$('[data-cs]', w).forEach(function (b) { b.onclick = function () { payTo(L[+b.dataset.cs].to); }; });
    $$('[data-ce]', w).forEach(function (b) { b.onclick = function () { contactEdit(+b.dataset.ce); }; });
    $('[data-x="add"]', w).onclick = function () { contactEdit(-1); };
  }
  function contactEdit(i, preTo) {
    var L = contacts(), c = i >= 0 ? L[i] : { name: '', to: preTo || '' }, rec = get('payees', []).filter(function (p) { return !L.some(function (x) { return x.to.toLowerCase() === p.toLowerCase(); }); }).slice(0, 6);
    var w = sheet(i >= 0 ? 'Edit contact' : 'Add contact',
      '<label class="l" for="ct-n">Name</label><input class="in" id="ct-n" maxlength="40" placeholder="e.g. Amina, Landlord, Shop" value="' + esc(c.name) + '">' +
      '<label class="l" for="ct-t">' + (userSends() ? '@username or wallet address' : 'Pi wallet address') + '</label><textarea class="in num" id="ct-t" rows="2" maxlength="60" autocapitalize="none" spellcheck="false" style="font-size:14px;resize:none" placeholder="' + (userSends() ? '@username or G…' : 'G…') + '">' + esc(c.to ? (isG(c.to) ? c.to : '@' + c.to) : '') + '</textarea><div class="hint" id="ct-h"></div>' +
      (i < 0 && rec.length ? '<label class="l">From your recent payments</label><div class="chips">' + rec.map(function (p) { return '<button type="button" class="chip" data-rp="' + esc(p) + '">' + esc(toLabel(p)) + '</button>'; }).join('') + '</div>' : '') +
      '<button type="button" class="btn" id="ct-go">Save contact</button>' + (i >= 0 ? '<button type="button" class="btn ghost" id="ct-pay">' + ic('send') + 'Send Pi</button><button type="button" class="btn danger" id="ct-rm">' + ic('trash') + 'Delete contact</button>' : ''), { stack: true });
    var t = $('#ct-t', w), h = $('#ct-h', w);
    function val() {
      var v = t.value.replace(/\s/g, ''); if (/^S[A-Z2-7]{20,}$/.test(v.toUpperCase())) { t.value = ''; h.innerHTML = '<span class="bad">That looks like a SECRET key. Never share it. Use the address that starts with G.</span>'; return ''; }
      if (/^G[A-Za-z2-7]{55}$/.test(v)) { v = v.toUpperCase(); if (validG(v)) { h.innerHTML = '<span class="ok">✓ Valid Pi wallet address</span>'; return v; } h.innerHTML = '<span class="bad">This address is not valid. Check every character.</span>'; return ''; }
      v = v.replace(/^@/, ''); if (userSends() && USER_RE.test(v)) { h.textContent = ''; return v; }
      h.textContent = v ? (userSends() ? 'Enter a @username or an address that starts with G' : 'Enter a Pi wallet address (starts with G, 56 characters)') : ''; return '';
    }
    t.oninput = val;
    $$('[data-rp]', w).forEach(function (b) { b.onclick = function () { t.value = isG(b.dataset.rp) ? b.dataset.rp : '@' + b.dataset.rp; val(); $('#ct-n', w).focus(); }; });
    $('#ct-go', w).onclick = function () {
      var n = $('#ct-n', w).value.trim(), v = val();
      if (!n) return toast('Enter a name'); if (!v) return toast(userSends() ? 'Enter a valid @username or wallet address' : 'Enter a valid wallet address');
      var L2 = contacts().filter(function (x, k) { return k !== i && x.to.toLowerCase() !== v.toLowerCase(); });
      L2.push({ name: n, to: v }); L2.sort(function (a, b) { return a.name.localeCompare(b.name); }); put('contacts', L2.slice(0, 200));
      toast('Contact saved'); contactsSheet(); rerenderUnder();
    };
    var pb = $('#ct-pay', w); if (pb) pb.onclick = function () { payTo(c.to); };
    var rm = $('#ct-rm', w); if (rm) rm.onclick = function () { put('contacts', contacts().filter(function (x, k) { return k !== i; })); toast('Contact deleted'); contactsSheet(); rerenderUnder(); };
    if (i < 0) setTimeout(function () { $('#ct-n', w).focus(); }, 120);
  }
  function rerenderUnder() { var v = $('#view'); if (v && !$('#app').hidden) { S.y = scrollY; v.innerHTML = T[S.tab](); } }

  /* ── payment links: reusable links and QR codes that open FinPi ready to pay you ── */
  function myTarget() { var un = userSends() && signedIn(); return un ? me() : get('addr', ''); }
  function links() { return get('links', []); }
  function linkText(o) { var who = isG(o.u) ? 'I' : '@' + o.u; return who + (o.a ? ' requested ' + fpi(o.a) + ' π' + (conv(o.a) ? ' (' + conv(o.a).replace('≈ ', '≈') + ')' : '') : ' shared a payment link') + (o.x ? ' for “' + o.x + '”' : '') + '. Pay with FinPi:\n' + payLink({ u: o.u, a: o.a || 0, x: o.x || '' }); }
  function showLink(o, title) {
    var link = payLink({ u: o.u, a: o.a || 0, x: o.x || '' }), who = isG(o.u) ? short(o.u) : '@' + o.u;
    var w = sheet(title || 'Payment link', '<div class="big"><div class="v">' + (o.a ? fpi(o.a) + ' π' : 'Any amount') + '</div>' + (o.a ? '<div class="c">' + esc(conv(o.a)) + '</div>' : '') + '<div class="w">To ' + esc(who) + (o.x ? ' · ' + esc(o.x) : '') + '</div></div>' +
      '<div class="qr">' + (window.FPQR ? FPQR.svg(link, 230, '#0A1F55') : '') + '</div><p class="small muted" style="text-align:center;margin-top:6px">Scan with FinPi or the phone camera to pay.</p>' +
      '<div class="two"><button type="button" class="btn" data-x="sh">' + ic('share') + 'Share</button><button type="button" class="btn ghost" data-x="cp">' + ic('copy') + 'Copy link</button></div>', { stack: true });
    $('[data-x="sh"]', w).onclick = function () { shareText('FinPi payment link', linkText(o)); };
    $('[data-x="cp"]', w).onclick = function () { copy(link); };
  }
  function needTarget(what) {
    if (myTarget()) return false;
    var w0 = sheet(what, '<p class="sh-sub">Add your Pi wallet address once. People will pay to it from FinPi or Pi Wallet.</p><button type="button" class="btn" data-x="aa">' + ic('card') + 'Add my wallet address</button>');
    $('[data-x="aa"]', w0).onclick = function () { addrSheet(true); }; return true;
  }
  function linksSheet() {
    if (needTarget('Payment links')) return;
    var L = links();
    var w = sheet('Payment links', '<p class="sh-sub">Share a link or QR code. It opens FinPi with your payment ready to approve.</p>' +
      '<button type="button" class="btn" data-x="new">' + ic('link') + 'Create payment link</button>' +
      (L.length ? '<div class="day">Your links</div><div class="list">' + L.map(function (o, i) { return '<div class="li"><span class="ico">' + ic('link') + '</span><button type="button" class="grow lb" data-lk="' + i + '"><b>' + esc(o.x || 'Payment link') + '</b><small>' + (o.a ? fpi(o.a) + ' π' : 'Any amount') + ' · ' + esc(isG(o.u) ? short(o.u) : '@' + o.u) + ' · ' + ago(o.ts) + '</small></button><button type="button" class="tbtn" data-lr="' + i + '" aria-label="Delete link">' + ic('trash') + '</button></div>'; }).join('') + '</div>' : ''));
    $('[data-x="new"]', w).onclick = function () { requestSheet(true); };
    $$('[data-lk]', w).forEach(function (b) { b.onclick = function () { showLink(L[+b.dataset.lk]); }; });
    $$('[data-lr]', w).forEach(function (b) { b.onclick = function () { put('links', links().filter(function (x, k) { return k !== +b.dataset.lr; })); linksSheet(); }; });
  }
  function saveLink(o) { var L = links().filter(function (x) { return !(x.u === o.u && x.a === o.a && x.x === o.x); }); L.unshift({ u: o.u, a: o.a, x: o.x, ts: Date.now() }); put('links', L.slice(0, 50)); }

  /* ── split a bill: one amount shared between people, each gets a payment request ── */
  function splits() { return get('splits', []); }
  function splitSheet() {
    if (needTarget('Split a bill')) return;
    var w = sheet('Split a bill', '<p class="sh-sub">Share a cost and send everyone their part as a payment request.</p>' +
      '<label class="l" for="sp-a">Total amount</label><div class="amt"><input id="sp-a" type="number" inputmode="decimal" min="0" step="any" placeholder="0.00"><span>π</span></div><div class="hint num" id="sp-c"></div>' +
      '<label class="l" for="sp-x">What is it for?</label><input class="in" id="sp-x" maxlength="60" placeholder="e.g. Dinner, shared taxi, rent">' +
      '<label class="l" for="sp-p">Who is sharing? (names, separated by commas)</label><input class="in" id="sp-p" maxlength="300" placeholder="e.g. Amina, Musa, Fatima">' +
      '<label class="chk"><input type="checkbox" id="sp-me" checked><span>Include my share</span></label>' +
      '<div class="sum" id="sp-sum" hidden></div><button type="button" class="btn" id="sp-go">' + ic('users') + 'Create requests</button>' +
      (splits().length ? '<button type="button" class="btn ghost" id="sp-old">Previous splits</button>' : ''));
    var a = $('#sp-a', w), p = $('#sp-p', w), mi = $('#sp-me', w);
    function names() { return p.value.split(/[,\n]/).map(function (s) { return s.trim().slice(0, 30); }).filter(Boolean).slice(0, 30); }
    function calc() {
      var v = r7(a.value), N = names(), n = N.length + (mi.checked ? 1 : 0), sh = n ? Math.ceil(v / n * 100) / 100 : 0;
      $('#sp-c', w).textContent = conv(v); var s = $('#sp-sum', w); s.hidden = !(v > 0 && N.length);
      s.innerHTML = '<div><span>People</span><b>' + n + '</b></div><div class="tot"><span>Each pays</span><b>' + fpi(sh) + ' π</b></div><div><span>You collect</span><b>' + fpi(r7(sh * N.length)) + ' π</b></div>';
      return { v: v, N: N, sh: sh };
    }
    a.oninput = p.oninput = mi.onchange = calc;
    $('#sp-go', w).onclick = function () {
      var c = calc(), x = $('#sp-x', w).value.trim();
      if (!(c.v >= 0.01)) return toast('Enter the total amount'); if (!x) return toast('Say what the bill is for'); if (!c.N.length) return toast('Add at least one name');
      if (!(c.sh >= 0.01)) return toast('Each share must be at least 0.01 π');
      var s = { id: Date.now().toString(36), u: myTarget(), total: c.v, sh: c.sh, x: x, ppl: c.N.map(function (n) { return { n: n, paid: false }; }), ts: Date.now() };
      var L = splits(); L.unshift(s); put('splits', L.slice(0, 30)); splitView(s.id);
    };
    var old = $('#sp-old', w); if (old) old.onclick = function () {
      var L = splits(), w2 = sheet('Previous splits', '<div class="list">' + L.map(function (s) { var pd = s.ppl.filter(function (q) { return q.paid; }).length; return '<button type="button" class="li" data-sv="' + s.id + '"><span class="ico">' + ic('users') + '</span><span class="grow"><b>' + esc(s.x) + '</b><small>' + fpi(s.total) + ' π · ' + pd + ' of ' + s.ppl.length + ' paid · ' + ago(s.ts) + '</small></span><span class="go">' + ic('chev') + '</span></button>'; }).join('') + '</div>', { stack: true });
      $$('[data-sv]', w2).forEach(function (b) { b.onclick = function () { splitView(b.dataset.sv); }; });
    };
    setTimeout(function () { a.focus(); }, 120);
  }
  function splitView(id) {
    var s = splits().filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var o = { u: s.u, a: s.sh, x: s.x + ' (split)' }, pd = s.ppl.filter(function (q) { return q.paid; }).length;
    var w = sheet('Split · ' + s.x, '<div class="big"><div class="v">' + fpi(s.sh) + ' π each</div><div class="c">' + esc(conv(s.sh)) + '</div><div class="w">Total ' + fpi(s.total) + ' π · ' + pd + ' of ' + s.ppl.length + ' paid</div></div>' +
      '<div class="list" style="margin-top:12px">' + s.ppl.map(function (q, i) { return '<div class="li"><button type="button" class="tick' + (q.paid ? ' on' : '') + '" data-pd="' + i + '" aria-label="Mark ' + esc(q.n) + ' as paid">' + ic('check') + '</button><span class="grow"><b>' + esc(q.n) + '</b><small>' + (q.paid ? 'Paid' : 'Waiting · ' + fpi(s.sh) + ' π') + '</small></span>' + (q.paid ? '' : '<button type="button" class="tbtn" data-ps="' + i + '" aria-label="Send request to ' + esc(q.n) + '">' + ic('share') + '</button>') + '</div>'; }).join('') + '</div>' +
      '<p class="small muted" style="margin-top:8px">Tap ' + ic('share', 'width:14px;height:14px;vertical-align:-2px') + ' to send someone their request. Tick people when they have paid.</p>' +
      '<button type="button" class="btn" data-x="qr">' + ic('qr') + 'Show QR code</button><button type="button" class="btn danger" data-x="rm">' + ic('trash') + 'Delete split</button>', { stack: true });
    function upd(fn) { put('splits', splits().map(function (x) { if (x.id === id) fn(x); return x; })); w.remove(); splitView(id); }
    $$('[data-pd]', w).forEach(function (b) { b.onclick = function () { upd(function (x) { x.ppl[+b.dataset.pd].paid = !x.ppl[+b.dataset.pd].paid; }); }; });
    $$('[data-ps]', w).forEach(function (b) { b.onclick = function () { var n = s.ppl[+b.dataset.ps].n; shareText('FinPi payment request', 'Hi ' + n + ', your share of “' + s.x + '” is ' + fpi(s.sh) + ' π.\n' + linkText(o).split('\n').pop()); }; });
    $('[data-x="qr"]', w).onclick = function () { showLink(o, 'Pay your share'); };
    $('[data-x="rm"]', w).onclick = function () { put('splits', splits().filter(function (x) { return x.id !== id; })); closeSheets(); toast('Split deleted'); };
  }

  /* ── payment reminders: regular payments you approve yourself each time ── */
  var FREQ = { once: 'Once', weekly: 'Every week', monthly: 'Every month' };
  function rems() { return get('rems', []); }
  function nextDate(r) { var d = new Date(r.next); if (r.freq === 'weekly') d.setDate(d.getDate() + 7); else if (r.freq === 'monthly') { var day = r.day || d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); } return d.getTime(); }
  function advanceRem(id) {
    put('rems', rems().map(function (r) { if (r.id !== id) return r; if (r.freq === 'once') { r.done = true; return r; } var n = r.next; while (n <= Date.now()) { r.next = n = nextDate(r); } return r; }).filter(function (r) { return !r.done; }));
  }
  function dueRems() { var now = Date.now(); return rems().filter(function (r) { return r.next <= now; }); }
  function checkRems() { dueRems().forEach(function (r) { addNote('bell', 'Payment due', fpi(r.amt) + ' π to ' + (cName(r.to) || toLabel(r.to)) + ' · ' + r.narr, 'rem-' + r.id + '-' + r.next); }); }
  function remMatch(rc) {
    if (!rc || rc.dir !== 'out') return;
    dueRems().forEach(function (r) {
      var hit = isG(r.to) ? rc.addr === r.to : String(rc.other || '').toLowerCase() === '@' + r.to.toLowerCase();
      if (hit && Math.abs(Number(rc.amount) - r.amt) < 1e-7) advanceRem(r.id);
    });
  }
  function dueHTML() {
    var D = dueRems(); if (!D.length) return '';
    return '<div class="sec"><h2>Payments due</h2><button type="button" data-act="rems">All reminders</button></div><div class="list">' + D.slice(0, 3).map(function (r) {
      return '<div class="li"><span class="ico rf">' + ic('bell') + '</span><span class="grow"><b>' + esc(r.narr) + '</b><small>' + fpi(r.amt) + ' π to ' + esc(cName(r.to) || toLabel(r.to)) + ' · due ' + new Date(r.next).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</small></span><button type="button" class="chip on" data-act="rem-pay" data-id="' + r.id + '">Pay</button></div>';
    }).join('') + '</div>';
  }
  function remsSheet() {
    var L = rems().slice().sort(function (a, b) { return a.next - b.next; });
    var w = sheet('Payment reminders', '<p class="sh-sub">FinPi reminds you when a regular payment is due. You check and approve every payment yourself.</p>' +
      (L.length ? '<div class="list">' + L.map(function (r) { var due = r.next <= Date.now(); return '<div class="li"><span class="ico' + (due ? ' rf' : '') + '">' + ic('bell') + '</span><button type="button" class="grow lb" data-re="' + r.id + '"><b>' + esc(r.narr) + '</b><small>' + fpi(r.amt) + ' π to ' + esc(cName(r.to) || toLabel(r.to)) + ' · ' + FREQ[r.freq] + '</small><small>' + (due ? 'Due now' : 'Next: ' + new Date(r.next).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })) + '</small></button>' + (due ? '<button type="button" class="chip on" data-act="rem-pay" data-id="' + r.id + '">Pay</button>' : '') + '</div>'; }).join('') + '</div>'
        : '<div class="list"><div class="empty">' + ic('bell') + '<div>No reminders yet. Add rent, school fees, dues or any regular payment.</div></div></div>') +
      '<button type="button" class="btn" data-x="add">' + ic('bell') + 'Add reminder</button>');
    $('[data-x="add"]', w).onclick = function () { remEdit(''); };
    $$('[data-re]', w).forEach(function (b) { b.onclick = function () { remEdit(b.dataset.re); }; });
  }
  function remEdit(id) {
    var r = rems().filter(function (x) { return x.id === id; })[0] || { to: '', amt: '', narr: '', cat: '', freq: 'monthly', next: Date.now() + 86400e3 };
    var dd = new Date(r.next), ds = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0'), C = contacts();
    var w = sheet(id ? 'Edit reminder' : 'Add reminder',
      '<label class="l" for="rm-x">What is it for?</label><input class="in" id="rm-x" maxlength="60" placeholder="e.g. Rent, school fees, association dues" value="' + esc(r.narr) + '">' +
      '<label class="l" for="rm-t">Pay to</label><textarea class="in num" id="rm-t" rows="2" maxlength="60" autocapitalize="none" spellcheck="false" style="font-size:14px;resize:none" placeholder="' + (userSends() ? '@username or G…' : 'G…') + '">' + esc(r.to ? (isG(r.to) ? r.to : '@' + r.to) : '') + '</textarea><div class="hint" id="rm-h"></div>' +
      (C.length ? '<div class="chips">' + C.slice(0, 8).map(function (c, i) { return '<button type="button" class="chip" data-rc2="' + i + '">' + esc(c.name) + '</button>'; }).join('') + '</div>' : '') +
      '<label class="l" for="rm-a">Amount</label><div class="amt"><input id="rm-a" type="number" inputmode="decimal" min="0" step="any" placeholder="0.00" value="' + esc(r.amt) + '"><span>π</span></div><div class="hint num" id="rm-c"></div>' +
      '<label class="l">How often</label><div class="chips" id="rm-f">' + Object.keys(FREQ).map(function (k) { return '<button type="button" class="chip' + (r.freq === k ? ' on' : '') + '" data-f="' + k + '">' + FREQ[k] + '</button>'; }).join('') + '</div>' +
      '<label class="l" for="rm-d">' + (id ? 'Next payment date' : 'First payment date') + '</label><input class="in" id="rm-d" type="date" value="' + ds + '">' +
      '<button type="button" class="btn" id="rm-go">Save reminder</button>' + (id ? '<button type="button" class="btn danger" id="rm-rm">' + ic('trash') + 'Delete reminder</button>' : ''), { stack: true });
    var f = r.freq, t = $('#rm-t', w), a = $('#rm-a', w);
    a.oninput = function () { $('#rm-c', w).textContent = conv(r7(a.value)); }; a.oninput();
    function val() {
      var v = t.value.replace(/\s/g, ''), h = $('#rm-h', w); if (/^S/i.test(v) && v.length > 20) { t.value = ''; h.innerHTML = '<span class="bad">That looks like a SECRET key. Never share it.</span>'; return ''; }
      if (/^G[A-Za-z2-7]{55}$/.test(v)) { v = v.toUpperCase(); if (validG(v)) { h.innerHTML = ''; return v; } h.innerHTML = '<span class="bad">This address is not valid.</span>'; return ''; }
      v = v.replace(/^@/, ''); if (userSends() && USER_RE.test(v)) { h.innerHTML = ''; return v; } h.textContent = v ? 'Enter a valid ' + (userSends() ? '@username or ' : '') + 'wallet address' : ''; return '';
    }
    t.oninput = val;
    $$('[data-rc2]', w).forEach(function (b) { b.onclick = function () { var c = C[+b.dataset.rc2]; t.value = isG(c.to) ? c.to : '@' + c.to; val(); }; });
    $$('#rm-f .chip', w).forEach(function (b) { b.onclick = function () { f = b.dataset.f; $$('#rm-f .chip', w).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#rm-go', w).onclick = function () {
      var x = $('#rm-x', w).value.trim(), to = val(), v = r7(a.value), dv = $('#rm-d', w).value, m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dv);
      if (!x) return toast('Say what the payment is for'); if (!to) return toast('Enter who to pay'); if (!(v >= 0.01)) return toast('Enter the amount'); if (!m) return toast('Choose a date');
      var nx = new Date(+m[1], +m[2] - 1, +m[3], 9, 0, 0).getTime();
      var L = rems().filter(function (q) { return q.id !== id; }); L.push({ id: id || Date.now().toString(36), to: to, amt: v, narr: x, cat: r.cat || '', freq: f, next: nx, day: +m[3] }); put('rems', L.slice(0, 60));
      toast('Reminder saved'); remsSheet(); rerenderUnder();
    };
    var rm = $('#rm-rm', w); if (rm) rm.onclick = function () { put('rems', rems().filter(function (q) { return q.id !== id; })); toast('Reminder deleted'); remsSheet(); rerenderUnder(); };
  }
  function remPay(id) {
    var r = rems().filter(function (x) { return x.id === id; })[0]; if (!r) return;
    var w = sheet('Payment due', '<div class="big"><div class="v">' + fpi(r.amt) + ' π</div><div class="c">' + esc(conv(r.amt)) + '</div><div class="w">To ' + esc(cName(r.to) || toLabel(r.to)) + ' · ' + esc(r.narr) + '</div></div>' +
      '<button type="button" class="btn" data-x="pay">' + ic('send') + 'Pay now</button><button type="button" class="btn ghost" data-x="done">Already paid</button><button type="button" class="btn ghost" data-x="skip">Skip this time</button>');
    $('[data-x="pay"]', w).onclick = function () { payTo(r.to, { a: r.amt, x: r.narr, cat: r.cat }); };
    $('[data-x="done"]', w).onclick = function () { advanceRem(id); closeSheets(); rerender(); toast('Marked as paid'); };
    $('[data-x="skip"]', w).onclick = function () { advanceRem(id); closeSheets(); rerender(); toast('Skipped'); };
  }

  /* ── price alerts: a notification when 1 π crosses a price you choose ── */
  function alerts() { return get('alerts', []); }
  function checkAlerts() {
    var L = alerts(), ch = false;
    L.forEach(function (a) {
      if (a.hit) return; var r = rateIn(a.c); if (!r) return;
      if ((a.dir === 'above' && r >= a.v) || (a.dir === 'below' && r <= a.v)) {
        a.hit = Date.now(); ch = true;
        addNote('bell', 'Pi price alert', '1 π is now ' + money(r, a.c, r < 1 ? 4 : 2) + ', ' + (a.dir === 'above' ? 'above' : 'below') + ' your alert of ' + money(a.v, a.c, a.v < 1 ? 4 : 2) + '.', 'pa-' + a.id);
        toast('Price alert: 1 π = ' + money(r, a.c, r < 1 ? 4 : 2));
      }
    });
    if (ch) put('alerts', L);
  }
  function alertsSheet() {
    var L = alerts(), c = curr(), r = rateIn(c), dir = 'above';
    var w = sheet('Price alerts', '<p class="sh-sub">Get notified when 1 π reaches your price. FinPi checks the live rate while it is open.</p>' +
      '<div class="card"><p class="small">1 π now</p><div class="num" style="font-size:24px;font-weight:700">' + (r ? money(r, c, r < 1 ? 4 : 2) : '—') + '</div></div>' +
      '<label class="l">Notify me when 1 π goes</label><div class="seg" id="pa-d"><button type="button" data-d="above" class="on">Above</button><button type="button" data-d="below">Below</button></div>' +
      '<label class="l" for="pa-v">Price in ' + esc(c) + '</label><div class="amt"><input id="pa-v" type="number" inputmode="decimal" min="0" step="any" placeholder="' + (r ? (r * 1.1).toFixed(r < 1 ? 4 : 2) : '0') + '"><span style="font-size:15px">' + esc(c) + '</span></div>' +
      '<button type="button" class="btn" id="pa-go">' + ic('bell') + 'Create alert</button>' +
      (L.length ? '<div class="day">Your alerts</div><div class="list">' + L.map(function (a, i) { return '<div class="li"><span class="ico' + (a.hit ? ' in' : '') + '">' + ic(a.hit ? 'check' : 'bell') + '</span><span class="grow"><b>' + (a.dir === 'above' ? 'Above ' : 'Below ') + money(a.v, a.c, a.v < 1 ? 4 : 2) + '</b><small>' + (a.hit ? 'Reached ' + ago(a.hit) : 'Waiting') + '</small></span><button type="button" class="tbtn" data-pr="' + i + '" aria-label="Delete alert">' + ic('trash') + '</button></div>'; }).join('') + '</div>' : '') +
      (get('push', false) ? '' : '<button type="button" class="btn ghost" data-act="push">' + ic('bell') + 'Turn on phone notifications</button>'));
    $$('#pa-d button', w).forEach(function (b) { b.onclick = function () { dir = b.dataset.d; $$('#pa-d button', w).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#pa-go', w).onclick = function () {
      var v = Number($('#pa-v', w).value); if (!(v > 0)) return toast('Enter a price');
      if (r && ((dir === 'above' && r >= v) || (dir === 'below' && r <= v))) return toast('1 π is already ' + (dir === 'above' ? 'above' : 'below') + ' that price');
      var L2 = alerts(); L2.unshift({ id: Date.now().toString(36), dir: dir, v: v, c: c }); put('alerts', L2.slice(0, 20)); toast('Alert created'); alertsSheet();
    };
    $$('[data-pr]', w).forEach(function (b) { b.onclick = function () { put('alerts', alerts().filter(function (x, k) { return k !== +b.dataset.pr; })); alertsSheet(); }; });
  }

  /* ── monthly statement (PDF) ── */
  function statementSheet() {
    var R = rcpts(), opts = [];
    for (var k = 0; k > -12; k--) { var m = monthRange(k); if (k === 0 || R.some(function (r) { return r.ts >= m[0] && r.ts < m[1]; })) opts.push(k); }
    var sel = 0;
    var w = sheet('Monthly statement', '<p class="sh-sub">A PDF of all your FinPi payments for a month, with values and transaction IDs.</p>' +
      '<label class="l">Month</label><div class="chips" id="st-m">' + opts.map(function (k) { return '<button type="button" class="chip' + (k === 0 ? ' on' : '') + '" data-m="' + k + '">' + monthRange(k)[2].toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) + '</button>'; }).join('') + '</div>' +
      '<div class="card" id="st-s" style="margin-top:12px"></div>' +
      '<div class="two"><button type="button" class="btn" data-x="dl">' + ic('down') + 'Download</button><button type="button" class="btn ghost" data-x="sh">' + ic('share') + 'Share</button></div>');
    function info() { var s = monthStats(sel); $('#st-s', w).innerHTML = '<div class="stats" style="margin-top:0"><div><small>Sent</small><b>' + fpi(s.out) + ' π</b></div><div><small>Received</small><b class="pos">' + fpi(s.inn) + ' π</b></div><div><small>Payments</small><b>' + s.n + '</b></div></div>'; }
    $$('#st-m .chip', w).forEach(function (b) { b.onclick = function () { sel = +b.dataset.m; $$('#st-m .chip', w).forEach(function (x) { x.classList.toggle('on', x === b); }); info(); }; });
    info();
    function make(share) {
      var btns = $$('.two .btn', w); btns.forEach(function (b) { b.disabled = true; }); toast('Preparing your statement…');
      buildStatement(sel).then(function (o) {
        btns.forEach(function (b) { b.disabled = false; });
        var f = null; try { f = new File([o.blob], o.name, { type: 'application/pdf' }); } catch (e) {}
        if (share && f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'FinPi statement' }).catch(function () {});
        var u = URL.createObjectURL(o.blob), a = document.createElement('a'); a.href = u; a.download = o.name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 10000);
        toast(share ? 'Sharing is not available here. Statement saved to Downloads.' : 'Statement saved to Downloads');
      }).catch(function () { btns.forEach(function (b) { b.disabled = false; }); toast('Could not create the statement. Please try again.'); });
    }
    $('[data-x="dl"]', w).onclick = function () { make(false); };
    $('[data-x="sh"]', w).onclick = function () { make(true); };
  }
  function buildStatement(off) {
    var m = monthRange(off), R = rcpts().filter(function (r) { return r.ts >= m[0] && r.ts < m[1]; }).sort(function (a, b) { return a.ts - b.ts; }), s = monthStats(off);
    var F = "Poppins,'Segoe UI',Roboto,Arial,sans-serif", MF = "'JetBrains Mono',Menlo,Consolas,monospace", W = 1240, H = 1754, X = 80;
    var mon = m[2].toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    var uv = function (r) { return r.usd ? Number(r.amount) * r.usd : 0; };
    var outU = 0, inU = 0; R.forEach(function (r) { if (r.dir === 'in') inU += uv(r); else outU += uv(r); });
    var P1 = 11, PN = 15, pages = [], i = 0; pages.push(R.slice(0, P1)); i = P1; while (i < R.length) { pages.push(R.slice(i, i + PN)); i += PN; }
    function txt(x, t, px, py, font, col, al) { x.font = font; x.fillStyle = col; x.textAlign = al || 'left'; x.fillText(t, px, py); }
    function fit(x, t, mw) { t = String(t || ''); if (x.measureText(t).width <= mw) return t; while (t.length > 1 && x.measureText(t + '…').width > mw) t = t.slice(0, -1); return t + '…'; }
    return fontsReady().then(function () { return new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = 'icons/icon-192.png'; }); }).then(function (logo) {
      var jobs = pages.map(function (rows, pi) {
        var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d'); x.textBaseline = 'alphabetic';
        x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
        var y;
        if (pi === 0) {
          var g = x.createLinearGradient(0, 0, W, 300); g.addColorStop(0, '#0A1F55'); g.addColorStop(.75, '#1D4ED8'); g.addColorStop(1, '#0D9488'); x.fillStyle = g; x.fillRect(0, 0, W, 300);
          if (logo) x.drawImage(logo, X, 62, 76, 76);
          txt(x, 'FinPi', X + 96, 116, '700 44px ' + F, '#FFFFFF');
          txt(x, 'MONTHLY STATEMENT', W - X, 92, '600 22px ' + F, 'rgba(255,255,255,.8)', 'right');
          txt(x, mon, W - X, 140, '700 40px ' + F, '#FFFFFF', 'right');
          var who = (get('name', '') ? get('name', '') + ' · ' : '') + (me() ? '@' + me() : 'FinPi user');
          txt(x, who, X, 214, '600 28px ' + F, '#FFFFFF');
          txt(x, NETN + ' · Values at payment time', X, 254, '400 22px ' + F, 'rgba(255,255,255,.82)');
          var bx = [['Sent', fpi(s.out) + ' π', outU ? '≈ ' + money(outU, 'USD') : ''], ['Received', fpi(s.inn) + ' π', inU ? '≈ ' + money(inU, 'USD') : ''], ['Net', (s.inn - s.out >= 0 ? '+' : '−') + fpi(Math.abs(r7(s.inn - s.out))) + ' π', ''], ['Payments', String(s.n), '']];
          var bw = (W - 2 * X - 3 * 20) / 4;
          bx.forEach(function (b, k) {
            var bxX = X + k * (bw + 20); x.fillStyle = '#F2F5FA'; x.fillRect(bxX, 340, bw, 150);
            txt(x, b[0].toUpperCase(), bxX + 22, 382, '600 18px ' + F, '#64748B');
            x.font = '700 32px ' + MF; txt(x, fit(x, b[1], bw - 44), bxX + 22, 434, '700 32px ' + MF, k === 1 ? '#0F766E' : '#0B1B33');
            if (b[2]) txt(x, b[2], bxX + 22, 470, '400 18px ' + F, '#64748B');
          });
          y = 560;
        } else {
          x.fillStyle = '#0A1F55'; x.fillRect(0, 0, W, 130);
          if (logo) x.drawImage(logo, X, 35, 60, 60);
          txt(x, 'FinPi', X + 76, 78, '700 32px ' + F, '#FFFFFF');
          txt(x, 'Statement · ' + mon, W - X, 78, '600 24px ' + F, '#FFFFFF', 'right');
          y = 190;
        }
        /* table header */
        x.fillStyle = '#0B1B33'; x.fillRect(X, y, W - 2 * X, 2);
        txt(x, 'DATE', X, y + 38, '600 17px ' + F, '#64748B'); txt(x, 'DETAILS', X + 170, y + 38, '600 17px ' + F, '#64748B');
        txt(x, 'AMOUNT', W - X - 230, y + 38, '600 17px ' + F, '#64748B', 'right'); txt(x, 'VALUE', W - X, y + 38, '600 17px ' + F, '#64748B', 'right');
        y += 58; x.fillStyle = '#E2E8F0'; x.fillRect(X, y, W - 2 * X, 1);
        if (!rows.length) txt(x, 'No payments this month.', W / 2, y + 90, '400 26px ' + F, '#64748B', 'center');
        rows.forEach(function (r) {
          var d = new Date(r.ts), inn = r.dir === 'in';
          txt(x, d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), X, y + 40, '600 22px ' + F, '#0B1B33');
          txt(x, d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), X, y + 70, '400 18px ' + F, '#64748B');
          x.font = '600 22px ' + F; txt(x, fit(x, rcptTitle(r), 560), X + 170, y + 40, '600 22px ' + F, '#0B1B33');
          var sub = [r.narr, r.cat && !inn ? r.cat : '', r.txid ? 'Tx ' + r.txid.slice(0, 10) + '…' : ''].filter(Boolean).join(' · ');
          x.font = '400 18px ' + F; txt(x, fit(x, sub, 560), X + 170, y + 70, '400 18px ' + F, '#64748B');
          txt(x, (inn ? '+' : '−') + fpi(r.amount) + ' π', W - X - 230, y + 40, '700 22px ' + MF, inn ? '#0F766E' : '#0B1B33', 'right');
          var lv = r.lr && r.lc ? money(Number(r.amount) * r.lr, r.lc) : '', us = r.usd ? money(uv(r), 'USD') : '';
          txt(x, lv || us || '—', W - X, y + 40, '600 20px ' + F, '#0B1B33', 'right');
          if (lv && us && r.lc !== 'USD') txt(x, us, W - X, y + 70, '400 17px ' + F, '#64748B', 'right');
          y += 92; x.fillStyle = '#EEF2F7'; x.fillRect(X, y, W - 2 * X, 1);
        });
        /* footer */
        x.fillStyle = '#E2E8F0'; x.fillRect(X, H - 120, W - 2 * X, 1);
        txt(x, 'Generated by FinPi on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Check any payment on the Pi blockchain with its transaction ID.', X, H - 80, '400 17px ' + F, '#64748B');
        txt(x, 'finpi.pi · Independent app, not operated by Pi Network', X, H - 52, '400 17px ' + F, '#94A3B8');
        txt(x, 'Page ' + (pi + 1) + ' of ' + pages.length, W - X, H - 80, '600 17px ' + F, '#64748B', 'right');
        return new Promise(function (ok, no) { cv.toBlob(function (b) { if (!b) return no(new Error('jpg')); b.arrayBuffer().then(function (ab) { ok({ w: W, h: H, bytes: new Uint8Array(ab) }); }, no); }, 'image/jpeg', 0.9); });
      });
      return Promise.all(jobs);
    }).then(function (imgs) {
      var d = m[2]; return { blob: makePdf(imgs), name: 'FinPi-statement-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '.pdf' };
    });
  }
  /* minimal PDF: one full-page JPEG per A4 page */
  function makePdf(imgs) {
    var te = new TextEncoder(), chunks = [], len = 0, offs = [];
    function add(v) { if (typeof v === 'string') v = te.encode(v); chunks.push(v); len += v.length; }
    function obj(id, body) { offs[id] = len; add(id + ' 0 obj\n' + body + '\nendobj\n'); }
    add('%PDF-1.4\n'); add(new Uint8Array([37, 226, 227, 207, 211, 10]));
    var n = imgs.length, kids = []; for (var k = 0; k < n; k++) kids.push((3 + k * 3) + ' 0 R');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>');
    imgs.forEach(function (im, k) {
      var p = 3 + k * 3, img = p + 1, ct = p + 2, s = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
      obj(p, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ' + img + ' 0 R >> >> /Contents ' + ct + ' 0 R >>');
      offs[img] = len; add(img + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.bytes.length + ' >>\nstream\n'); add(im.bytes); add('\nendstream\nendobj\n');
      obj(ct, '<< /Length ' + s.length + ' >>\nstream\n' + s + '\nendstream');
    });
    var total = 3 + n * 3, xr = len, t = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var id = 1; id < total; id++) t += String(offs[id]).padStart(10, '0') + ' 00000 n \n';
    add(t + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF\n');
    return new Blob(chunks, { type: 'application/pdf' });
  }

  /* ── welcome screens (first open) ── */
  var ONB = [
    { t: 'Send and receive Pi', p: 'Pay anyone by @username, wallet address or QR code. You approve every payment in Pi’s own window.', img: '<svg viewBox="0 0 320 220" aria-hidden="true"><defs><linearGradient id="ob1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1D4ED8"/><stop offset="1" stop-color="#0A1F55"/></linearGradient><linearGradient id="obg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FCD34D"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><circle cx="160" cy="110" r="100" fill="#E8EEFC"/><rect x="40" y="52" width="92" height="140" rx="18" fill="url(#ob1)"/><rect x="50" y="68" width="72" height="54" rx="10" fill="#fff" opacity=".14"/><circle cx="86" cy="95" r="14" fill="#5EEAD4"/><rect x="58" y="134" width="56" height="8" rx="4" fill="#fff" opacity=".5"/><rect x="58" y="150" width="40" height="8" rx="4" fill="#fff" opacity=".3"/><rect x="188" y="52" width="92" height="140" rx="18" fill="#fff" stroke="#C7D5F5" stroke-width="3"/><circle cx="234" cy="95" r="14" fill="#1D4ED8" opacity=".85"/><rect x="206" y="134" width="56" height="8" rx="4" fill="#C7D5F5"/><rect x="206" y="150" width="40" height="8" rx="4" fill="#E2E8F0"/><path d="M136 96 C160 70 168 70 186 92" stroke="#0D9488" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="2 10"/><path d="M178 84 l10 9 -13 4" stroke="#0D9488" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="160" cy="146" r="26" fill="url(#obg)"/><text x="160" y="157" text-anchor="middle" font-family="Georgia,serif" font-size="30" font-weight="700" fill="#7C2D12">π</text></svg>' },
    { t: 'Your Pi in your currency', p: 'See the live value of Pi in your own currency, convert any amount and set price alerts.', img: '<svg viewBox="0 0 320 220" aria-hidden="true"><defs><linearGradient id="ob2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D9488" stop-opacity=".35"/><stop offset="1" stop-color="#0D9488" stop-opacity="0"/></linearGradient></defs><circle cx="160" cy="110" r="100" fill="#E6F7F4"/><rect x="44" y="40" width="232" height="150" rx="22" fill="#fff" stroke="#CFE9E4" stroke-width="3"/><rect x="64" y="58" width="70" height="10" rx="5" fill="#CBD5E1"/><rect x="64" y="76" width="110" height="18" rx="9" fill="#0A1F55"/><path d="M64 160 L100 140 L130 148 L160 118 L190 128 L222 96 L256 104 L256 172 L64 172 Z" fill="url(#ob2)"/><path d="M64 160 L100 140 L130 148 L160 118 L190 128 L222 96 L256 104" stroke="#0D9488" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="222" cy="96" r="8" fill="#fff" stroke="#0D9488" stroke-width="4"/><g font-family="Poppins,Arial,sans-serif" font-weight="700" font-size="20" text-anchor="middle"><circle cx="52" cy="54" r="22" fill="#1D4ED8"/><text x="52" y="61" fill="#fff">$</text><circle cx="272" cy="168" r="22" fill="#0A1F55"/><text x="272" y="175" fill="#fff">₦</text><circle cx="282" cy="48" r="18" fill="#F59E0B"/><text x="282" y="55" fill="#fff" font-size="17">€</text></g></svg>' },
    { t: 'Receipts anyone can verify', p: 'Every payment gets a professional receipt to share or download, checked on the Pi blockchain.', img: '<svg viewBox="0 0 320 220" aria-hidden="true"><circle cx="160" cy="110" r="100" fill="#EEF0FF"/><path d="M98 30 h124 v170 l-15 -10 -15 10 -16 -10 -15 10 -16 -10 -15 10 -16 -10 -16 10z" fill="#fff" stroke="#C7CBF5" stroke-width="3" stroke-linejoin="round"/><rect x="98" y="30" width="124" height="44" fill="#0A1F55"/><rect x="114" y="46" width="50" height="12" rx="6" fill="#fff" opacity=".85"/><rect x="114" y="90" width="92" height="16" rx="8" fill="#0B1B33"/><rect x="114" y="116" width="62" height="8" rx="4" fill="#CBD5E1"/><rect x="114" y="132" width="78" height="8" rx="4" fill="#E2E8F0"/><g fill="#0A1F55"><rect x="168" y="150" width="10" height="10"/><rect x="182" y="150" width="10" height="10"/><rect x="196" y="150" width="10" height="10"/><rect x="168" y="164" width="10" height="10"/><rect x="196" y="164" width="10" height="10"/><rect x="182" y="178" width="10" height="6"/></g><circle cx="236" cy="66" r="30" fill="#0F766E"/><path d="M222 66 l10 10 18 -20" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
  ];
  function onboarding(force) {
    if (!force && get('onb', false)) return;
    var i = 0, o = document.createElement('div'); o.id = 'onb'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Welcome to FinPi');
    function draw() {
      var s = ONB[i], last = i === ONB.length - 1;
      o.innerHTML = '<div class="onb-top"><div class="brand"><img src="icons/icon-192.png" alt="">FinPi</div>' + (last ? '' : '<button type="button" class="onb-skip" data-o="skip">Skip</button>') + '</div>' +
        '<div class="onb-img">' + s.img + '</div><div class="onb-txt"><h2>' + esc(s.t) + '</h2><p>' + esc(s.p) + '</p></div>' +
        '<div class="onb-dots">' + ONB.map(function (x, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="onb-b"><button type="button" class="btn" data-o="next">' + (last ? 'Get started' : 'Next') + '</button></div>';
    }
    function end() { put('onb', true); o.remove(); }
    o.addEventListener('click', function (e) { var b = e.target.closest('[data-o]'); if (!b) return; if (b.dataset.o === 'skip' || i === ONB.length - 1) return end(); i++; draw(); });
    var sx = null; o.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    o.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) < 50) return; if (dx < 0 && i < ONB.length - 1) i++; else if (dx > 0 && i > 0) i--; else return; draw(); });
    draw(); document.body.appendChild(o);
  }

  /* ── actions ── */
  var A = {
    send: function () { sendSheet(); }, receive: function () { receiveSheet(); }, request: function () { requestSheet(); }, scan: function () { scanSheet(); }, 'get-rcpt': function () { addTxSheet(null); },
    'send-to': function (el) { payTo(el.dataset.u); },
    contacts: contactsSheet, links: linksSheet, split: splitSheet, rems: remsSheet, alerts: alertsSheet, statement: statementSheet, tour: function () { onboarding(true); },
    'rem-pay': function (el) { remPay(el.dataset.id); },
    signin: function () { signIn(); },
    price: function () { go('wallet'); }, 'price-retry': function (el, e) { e.stopPropagation(); loadPrice(true); paintPrice(); },
    currency: function (el, e) { e && e.stopPropagation(); curSheet(); },
    'check-addr': function () { addrSheet(false); }, verify: verifySheet,
    'addr-set': function () { addrSheet(true); }, 'addr-use': function () { var s = get('addrSug', ''); if (validG(s)) { put('addr', s); put('addrSug', ''); render(S.tab); loadWal(); toast('Address saved'); } },
    'wal-load': function () { S.wal = null; loadWal(); },
    notifs: function () {
      var N = notes(); N.forEach(function (n) { n.read = true; }); put('notes', N); bellDot();
      sheet('Notifications', N.length ? '<div class="list">' + N.map(function (n) { return '<div class="li"><span class="ico">' + ic(n.ic || 'bell') + '</span><span class="grow"><b>' + esc(n.t) + '</b><small style="white-space:normal">' + esc(n.b) + '</small><small>' + ago(n.ts) + '</small></span></div>'; }).join('') + '</div><button type="button" class="btn ghost" data-act="notes-clear">Clear all</button>' : '<div class="empty">' + ic('bell') + '<div>No notifications yet.</div></div>');
    },
    'notes-clear': function () { put('notes', []); closeSheets(); bellDot(); },
    csv: function () {
      var rows = [['date', 'type', 'direction', 'amount_pi', 'counterparty', 'narration', 'category', 'network', 'transaction_id']].concat(rcpts().map(function (r) { return [new Date(r.ts).toISOString(), r.kind, r.dir, r.amount, r.other || '', r.narr || '', r.cat || '', r.net || '', r.txid || '']; }));
      var csv = rows.map(function (r) { return r.map(function (x) { x = String(x == null ? '' : x); if (/^[=+\-@]/.test(x)) x = "'" + x; return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(','); }).join('\n');
      var blob = new Blob([csv], { type: 'text/csv' }), name = 'FinPi-activity-' + new Date().toISOString().slice(0, 10) + '.csv';
      try { var f = new File([blob], name, { type: 'text/csv' }); if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'FinPi activity' }).catch(function () {}); } catch (e) {}
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('CSV saved');
    },
    name: function () {
      var w = sheet('Name on receipts', '<p class="sh-sub">Shown on your receipts next to your @username. Stays on this phone.</p><input class="in" id="nm-i" maxlength="50" value="' + esc(get('name', '')) + '" placeholder="Your full name"><button type="button" class="btn" id="nm-go">Save</button>');
      $('#nm-go', w).onclick = function () { put('name', $('#nm-i', w).value.trim()); closeSheets(); render(S.tab); toast('Saved'); };
    },
    budget: function () {
      var w = sheet('Monthly budget', '<p class="sh-sub">How much Pi do you plan to spend each month? FinPi shows your progress. Stays on this phone.</p><div class="amt"><input id="bg-i" type="number" inputmode="decimal" placeholder="0" value="' + (get('budget', 0) || '') + '"><span>π</span></div><div class="hint num" id="bg-c"></div><button type="button" class="btn" id="bg-go">Save budget</button>' + (get('budget', 0) ? '<button type="button" class="btn ghost" id="bg-rm">Remove budget</button>' : ''));
      var i = $('#bg-i', w); i.oninput = function () { $('#bg-c', w).textContent = conv(+i.value); }; i.oninput();
      $('#bg-go', w).onclick = function () { var v = r7(i.value); if (!(v > 0)) return toast('Enter an amount'); put('budget', v); closeSheets(); render(S.tab); toast('Budget saved'); };
      var rm = $('#bg-rm', w); if (rm) rm.onclick = function () { put('budget', 0); closeSheets(); render(S.tab); };
    },
    push: function () {
      var sup = 'Notification' in window, perm = sup ? Notification.permission : 'unsupported', on = get('push', false);
      var w = sheet('Phone notifications', '<p class="sh-sub">Get a phone alert when you receive Pi or a transfer is refunded. Alerts always appear inside FinPi too.</p>' +
        '<div class="note ' + (perm === 'granted' ? 'ok' : perm === 'denied' || perm === 'unsupported' ? 'warn' : '') + '">' + ic('bell') + '<span>' + (perm === 'granted' ? 'Allowed on this phone.' : perm === 'denied' ? 'Blocked for FinPi. Allow notifications in your browser settings to turn them on.' : perm === 'unsupported' ? 'This browser does not support phone notifications. You will still see alerts in FinPi.' : 'Not allowed yet.') + '</span></div>' +
        (sup && perm !== 'denied' ? '<button type="button" class="btn" id="ps-on">' + (on && perm === 'granted' ? 'Turn off' : 'Turn on') + '</button>' : '') + (on && perm === 'granted' ? '<button type="button" class="btn ghost" id="ps-t">Send a test</button>' : ''));
      var b = $('#ps-on', w); if (b) b.onclick = function () {
        if (on && perm === 'granted') { put('push', false); closeSheets(); render(S.tab); return; }
        Notification.requestPermission().then(function (p) { if (p === 'granted') { put('push', true); toast('Phone notifications on'); } else toast('Notifications were not allowed'); closeSheets(); render(S.tab); });
      };
      var t = $('#ps-t', w); if (t) t.onclick = function () { addNote('bell', 'FinPi test', 'Notifications are working.', 'test-' + Date.now()); toast('Test sent'); };
    },
    security: function () {
      sheet('Security center', '<div class="note ok">' + ic('shield') + '<span>FinPi never asks for your passphrase, never holds a balance for you and cannot move Pi from your wallet.</span></div>' +
        '<div class="card" style="margin-top:12px"><h3>How transfers work</h3><p>You approve each payment in Pi’s own window. FinPi’s software then delivers it within seconds through Pi Network’s official payments, or refunds you automatically if delivery is impossible. Before any retry it checks the Pi blockchain, so nothing is ever paid twice. No person reviews, holds or reverses transfers.</p></div>' +
        '<div class="card"><h3>Limits for everyone</h3><p>Up to ' + S.cfg.max + ' π per transfer and ' + S.cfg.daily + ' π per person per day, plus a blockchain fee of ' + S.cfg.fee + ' π per transfer.</p></div>' +
        '<div class="card"><h3>Stay safe</h3><p>• Only pay people and businesses you know.<br>• Check the @username and amount on the final screen.<br>• FinPi staff will never ask you to send Pi.<br>• A genuine receipt’s QR code checks out on the Pi blockchain.<br>• Never share your passphrase or secret key (it starts with S).</p></div>' +
        '<p class="small muted" style="margin-top:12px">Found a security problem? Email ' + SUPPORT + '.</p>');
    },
    supporter: function () {
      if (get('supporter', false)) return toast('You are already a Supporter. Thank you!');
      if (needSignIn('Sign in with Pi to become a Supporter.')) return;
      var w = sheet('Become a Supporter', '<div class="big"><div class="v">1 π</div><div class="c">' + esc(conv(1)) + '</div><div class="w">FinPi Supporter badge</div></div><p class="sh-sub" style="margin-top:12px">Support FinPi’s development and get a Supporter badge on your profile. Every feature stays free. The badge gives no reward or financial return.</p><button type="button" class="btn" id="sp-go">' + ic('heart') + 'Support with 1 π</button>');
      $('#sp-go', w).onclick = supporterPay;
    },
    status: function () { location.href = 'setup.html'; },
    help: function () { sheet('Help & contact', '<p class="sh-sub">We reply within 30 days, usually much sooner.</p><a class="btn" href="mailto:' + SUPPORT + '?subject=FinPi%20help">' + ic('mail') + 'Email ' + SUPPORT + '</a><div class="card" style="margin-top:14px"><h3>Common questions</h3><p><b>Where is my Pi?</b> In your own Pi Wallet. FinPi never holds balances.<br><br><b>A transfer did not arrive.</b> FinPi keeps delivering automatically, or refunds you. You will be notified either way.<br><br><b>Can a transfer be reversed?</b> No. Delivered blockchain payments are final.</p></div>'); },
    signout: function () { S.user = null; S.token = null; registered = false; put('user', null); closeSheets(); $('#app').hidden = true; $('#landing').hidden = false; toast('Signed out'); }
  };
  function supporterPay() {
    if (!window.Pi || !initPi()) return toast('Open FinPi in the Pi Browser to pay');
    if (S.cfg.payments === false) { closeSheets(); return toast('Pi payments open soon. Nothing was charged.'); }
    var b = $('#sp-go'); if (b) { b.disabled = true; b.textContent = 'Waiting for Pi…'; }
    var reset = function (m) { if (b) { b.disabled = false; b.innerHTML = ic('heart') + 'Support with 1 π'; } if (m) toast(m); };
    try {
      Pi.createPayment({ amount: 1, memo: 'FinPi Supporter badge', metadata: { type: 'supporter' } }, {
        onReadyForServerApproval: function (pid) { api('/approve', { paymentId: pid }).then(function (d) { if (d && d.approved === false) reset(d.error || 'Payment refused. You were not charged.'); }).catch(function () {}); },
        onReadyForServerCompletion: function (pid, txid) {
          api('/complete', { paymentId: pid, txid: txid }).then(function () {
            put('supporter', true); saveRcpt({ kind: 'supporter', dir: 'out', amount: 1, other: 'FinPi', narr: 'Supporter badge', pid: pid, txid: txid, me: me() });
            addNote('heart', 'Thank you!', 'Your FinPi Supporter badge is on your profile.', 'sup-' + pid); closeSheets(); render(S.tab); toast('Thank you for supporting FinPi!');
          }).catch(function () { reset('Connection problem. FinPi will finish it when you reopen the app.'); });
        },
        onCancel: function () { reset('Payment cancelled'); }, onError: function () { reset('Payment error. Nothing was charged.'); }
      });
    } catch (e) { reset('Payment error'); }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t && !t.closest('.sh-wrap')) { if (t.dataset.seg) S.seg = t.dataset.seg; go(t.dataset.tab); return; }
    var s = e.target.closest('#view [data-seg]'); if (s) { S.seg = s.dataset.seg; render('activity'); return; }
    var f = e.target.closest('[data-flt]'); if (f) { S.filter = f.dataset.flt; render('activity'); return; }
    var mo = e.target.closest('[data-mon]'); if (mo) { S.month = Math.min(0, S.month + Number(mo.dataset.mon)); render('activity'); return; }
    var rc = e.target.closest('[data-rc]'); if (rc) { showRcpt(rcpts()[+rc.dataset.rc]); return; }
    var pe = e.target.closest('[data-pend]'); if (pe) { pendSheet(pe.dataset.pend); return; }
    var a = e.target.closest('[data-act]'); if (a && A[a.dataset.act]) { A[a.dataset.act](a, e); }
  });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); } });

  /* ── start ── */
  function start() {
    if (TEST) { $('#ld-net').textContent = 'Pi Testnet'; }
    $('#signin').onclick = function () { signIn(); };
    $('#explore').onclick = function () { S.guest = true; showApp(); if (pendingCode) { var c = pendingCode; pendingCode = null; openCode(c); } };
    onboarding(); loadPrice(true); paintPrice(); initPi(); loadCfg(); checkRems();
    var u = get('user', null);
    if (u && u.username && window.Pi) { $('#signin-t').textContent = 'Signing in as @' + u.username + '…'; signIn(true).then(function (ok) { if (!ok) $('#signin-t').textContent = 'Sign in with Pi'; }); }
    checkPendingWallet(); checkPendingInApp();
    var hc = readHash(); if (hc) { pendingCode = hc; var lm = $('#ld-msg'); if (lm) { lm.style.color = 'var(--blue)'; lm.textContent = 'You opened a payment request. Sign in with Pi or explore to pay it.'; } }
    addEventListener('hashchange', function () { var c = readHash(); if (c) { if ($('#app').hidden) { pendingCode = c; } else openCode(c); } });
    setInterval(function () { if (!document.hidden) { loadPrice(); sync(); checkPendingWallet(); checkPendingInApp(); checkRems(); } }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { loadPrice(); sync(); checkPendingWallet(); checkPendingInApp(); checkRems(); } });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  window.FinPi = { S: S, render: render, sync: sync, showRcpt: showRcpt, sendSheet: sendSheet };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
