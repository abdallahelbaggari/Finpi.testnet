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
    R.unshift(r); put('rcpts', R.slice(0, 400)); return true;
  }
  function verifyUrl(r) { return r && /^[a-f0-9]{64}$/i.test(r.txid || '') ? location.origin + '/receipt.html#tx=' + r.txid.toLowerCase() + '&net=' + (/Testnet/.test(r.net || '') ? 'test' : 'main') : ''; }
  function rcptTitle(r) { return r.kind === 'refund' ? 'Refund · transfer to ' + r.other : r.kind === 'supporter' ? 'FinPi Supporter' : r.dir === 'in' ? 'From ' + r.other : 'To ' + r.other; }
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
        rows: [['From', wi ? short(r.from || r.addr) : mine], ['To', wi ? mine : short(r.addr)], ['Narration', r.narr || '—'], ['Category', wi ? '' : r.cat], ['Pi rate', rate], ['Paid with', 'Pi Wallet'], ['Reference', r.pid]].concat(when, [['Network', r.net], ['Sender address', r.from, 1], ['Recipient address', wi ? r.to : r.addr, 1], ['Transaction ID', r.txid, 1]]),
        thanks: wi ? 'Received · verified by FinPi' : 'Paid · verified by FinPi', note: 'Paid from Pi Wallet and verified by FinPi on the public Pi blockchain. Scan the code to check it.' });
    }
    var inn = r.dir === 'in', fee = inn ? 0 : (r.fee || 0.01), A = r.tk === 'address';
    return Object.assign(base, { title: inn ? 'Transfer received' : 'Transfer receipt',
      rows: [['From', inn ? r.other : mine], ['To', inn ? mine : (A ? 'Pi wallet address' : r.other)], ['Narration', r.narr || '—'], ['Category', inn ? '' : r.cat], ['Pi rate', rate]].concat(fee ? [['Blockchain fee', fpi(fee) + ' π'], ['Total paid', fpi(r7(Number(r.amount) + fee)) + ' π']] : [], [['Reference', r.pid]], when, [['Network', r.net], [inn ? 'Your address' : 'Recipient address', r.addr, 1], ['Transaction ID', r.txid, 1]]),
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
    api('/pi-price').then(function (d) { if (d && d.ok && d.usd) { S.p = d; S.p.stale = !!d.stale; put('price', d); } else if (S.p) S.p.stale = true; })
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
  function onIncomplete(p) { if (p && p.identifier) api('/recover', { paymentId: p.identifier }).then(function (d) { if (d && d.transfer) setTimeout(sync, 800); }).catch(function () {}); }
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
  function afterSignIn() { register(); loadCfg().then(function () { sync(); }); }

  /* ── transfers: server status, registration, sync ── */
  function loadCfg() {
    return api('/transfer?a=status').then(function (d) {
      if (d && d.ok) { S.cfg = { enabled: !!d.enabled, payments: d.payments !== false, addresses: d.addresses !== false, fee: d.fee || 0.01, max: d.max || 50, daily: d.daily || 200 }; if (!$('.sh-wrap')) render(S.tab); }
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
    var addrOn = true, userOn = !!S.cfg.enabled, kind = !userOn || (pre.u && isG(pre.u)) ? 'addr' : 'user';
    var payees = get('payees', []).filter(function (p) { return addrOn || !isG(p); }).slice(0, 6);
    var w = sheet('Send Pi',
      (userOn ? '<div class="seg" role="tablist" style="margin-bottom:4px"><button type="button" data-k="user">Username</button><button type="button" data-k="addr">Wallet address</button></div>' : '<p class="sh-sub">Fill in the payment, pay it from your own Pi Wallet, and FinPi makes the receipt automatically.</p>') +
      '<div id="k-user"><label class="l" for="s-u">To</label><div class="to"><span>@</span><input id="s-u" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="username" maxlength="60"></div></div>' +
      '<div id="k-addr" hidden><label class="l" for="s-g">Pi wallet address</label><textarea class="in num" id="s-g" rows="2" maxlength="60" autocapitalize="characters" spellcheck="false" placeholder="G…" style="font-size:14px;resize:none"></textarea></div>' +
      '<div class="hint" id="s-uh"></div>' +
      (payees.length && !pre.u ? '<div class="chips" style="margin-top:2px">' + payees.map(function (p) { return '<button type="button" class="chip" data-pu="' + esc(p) + '">' + (isG(p) ? ic('card', 'width:15px;height:15px;vertical-align:-3px') + ' ' : '') + esc(toLabel(p)) + '</button>'; }).join('') + '</div>' : '') +
      '<label class="l" for="s-a">Amount</label><div class="amt"><input id="s-a" type="number" inputmode="decimal" min="0" step="any" placeholder="0.00"><span>π</span></div><div class="hint num" id="s-c"></div>' +
      '<label class="l">Category</label><div class="chips" id="s-cat">' + CATS.map(function (c) { return '<button type="button" class="chip" data-c="' + c + '">' + c + '</button>'; }).join('') + '</div>' +
      '<label class="l" for="s-x">Narration</label><input class="in" id="s-x" maxlength="80" placeholder="What is it for? e.g. Rent, groceries, gift">' +
      '<div class="sum" id="s-sum" hidden></div>' +
      '<button type="button" class="btn" id="s-go">Continue</button>' +
      '<p class="small muted" style="margin-top:12px;text-align:center">' + ic('lock', 'width:14px;height:14px;vertical-align:-2px') + (userOn ? ' You approve in Pi’s own window. Limits in FinPi: ' + S.cfg.max + ' π per transfer, ' + S.cfg.daily + ' π a day.' : ' You approve the payment in your own Pi Wallet. FinPi never holds your Pi.') + '</p>');
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
    warn.push('<div class="note gray">' + ic('info') + '<span>' + (o.wallet ? 'You pay from your own Pi Wallet. FinPi then finds the payment on the Pi blockchain and makes your receipt. Blockchain payments cannot be reversed.' : 'Delivered automatically in seconds. If it cannot be delivered, you are refunded automatically. Delivered transfers cannot be reversed.') + '</span></div>');
    var w = sheet('Check before you send',
      '<div class="big"><div class="v">' + fpi(amt) + ' π</div><div class="c">' + esc(conv(amt)) + '</div><div class="w">To ' + esc(toLabel(to)) + '</div></div>' +
      '<div class="sum">' + (A ? '<div style="display:block"><span>To wallet address</span><b class="num" style="display:block;text-align:left;margin-top:4px;font-size:13px;overflow-wrap:anywhere">' + esc(to) + '</b></div>' : '<div><span>To</span><b class="t">@' + esc(to) + '</b></div>') +
      '<div><span>For</span><b class="t">' + esc(narr) + '</b></div>' + (cat ? '<div><span>Category</span><b class="t">' + esc(cat) + '</b></div>' : '') +
      '<div><span>They receive</span><b>' + fpi(amt) + ' π</b></div><div><span>' + (o.wallet ? 'Network fee (Pi Wallet)' : 'Blockchain fee') + '</span><b>' + S.cfg.fee + ' π</b></div><div class="tot"><span>You pay</span><b>' + fpi(r7(amt + S.cfg.fee)) + ' π</b></div></div>' +
      '<div style="margin-top:12px">' + warn.join('') + '</div>' +
      (A && (o.wallet || !S.cfg.enabled) ? '<button type="button" class="btn" id="rv-w">' + ic('card') + 'Continue in Pi Wallet</button>'
        : '<button type="button" class="btn" id="rv-ok">' + ic('lock') + 'Confirm and pay in FinPi</button>' + (A ? '<button type="button" class="btn soft" id="rv-w">' + ic('card') + 'Pay from my Pi Wallet instead</button>' : '')) +
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
    var refused = false, tries = 0;
    function step(n, m, cls) { for (var i = 1; i <= 3; i++) { var e = $('#st' + i); if (e) e.className = i < n ? 'done' : i === n ? 'on' : ''; } var s = $('#st-m'); if (s) { s.className = 'status' + (cls ? ' ' + cls : ''); s.innerHTML = m; } }
    function finish(row) {
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
    function refunded(row) { saveRefund(row); step(3, '↩ This transfer could not be delivered, so ' + fpi(amt) + ' π was refunded to you automatically on the Pi blockchain.', 'err'); }
    try {
      Pi.createPayment({ amount: r7(amt + S.cfg.fee), memo: ('FinPi transfer to ' + lab).slice(0, 60), metadata: A ? { type: 'transfer', addr: to, amt: amt, narr: narr } : { type: 'transfer', to: to, amt: amt, narr: narr } }, {
        onReadyForServerApproval: function (pid) {
          var pend = get('pend', {}); pend[pid] = { cat: cat }; put('pend', pend);
          api('/approve', { paymentId: pid }).then(function (d) { if (d && d.approved === false) { refused = true; step(1, '✕ ' + esc(d.error || 'This transfer was refused.') + ' You have not been charged.', 'err'); } }).catch(function () {});
        },
        onReadyForServerCompletion: function (pid, txid) {
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
                if (++tries < 40) { step(3, 'Delivering to ' + esc(lab) + '… the Pi blockchain is busy, retrying automatically.'); setTimeout(retry, 8000); }
                else step(3, 'Your payment is safe and recorded on the Pi blockchain. FinPi keeps going automatically: ' + esc(lab) + ' is paid, or you are refunded, and you will be notified.');
              }).catch(function () { if (++tries < 40) setTimeout(retry, 8000); });
            })();
          }).catch(function () { step(2, 'Connection problem. Your payment is recorded; FinPi finishes it automatically when you reopen the app.', 'err'); });
        },
        onCancel: function () { if (!refused) step(1, 'You cancelled. Nothing was paid.', 'err'); },
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

  /* ── receive: your @username and your wallet address ── */
  function receiveSheet() {
    var a = get('addr', ''), sug = get('addrSug', ''), un = S.cfg.enabled && signedIn();
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
  var TIPS = ['FinPi staff will never ask you to send Pi or share your passphrase.', 'Check the @username and amount on the final screen before you approve.', 'A receipt is genuine only if its QR code checks out on the Pi blockchain.', 'Your passphrase and secret key (starting with S) are for you alone. Never type them into any app.'];
  var T = {
    home: function () {
      var R = rcpts();
      return '<div class="hello"><h1>' + hour() + (signedIn() ? ', @' + esc(me()) : '') + '</h1><p>' + (signedIn() ? 'Here is your Pi today.' : 'You are exploring. Sign in to send and receive Pi.') + '</p></div>' +
        '<div class="hero" data-act="price" data-p="hero" role="button" tabindex="0" aria-label="Pi price details">' + heroHTML() + '</div>' +
        '<div class="qa"><button type="button" data-act="send"><i>' + ic('send') + '</i>Send</button><button type="button" data-act="receive"><i class="t">' + ic('req') + '</i>Receive</button><button type="button" data-tab="wallet"><i class="n">' + ic('conv') + '</i>Convert</button><button type="button" data-tab="activity"><i class="a">' + ic('rcpt') + '</i>Receipts</button></div>' +
        '<div class="sec"><h2>Overview</h2></div><div class="card" data-p="month">' + monthHTML() + '</div>' +
        '<div class="sec"><h2>Recent activity</h2>' + (R.length ? '<button type="button" data-tab="activity">See all</button>' : '') + '</div>' +
        (R.length ? '<div class="list">' + R.slice(0, 4).map(txRow).join('') + '</div>' : '<div class="list"><div class="empty">' + ic('act') + '<div>No payments yet. Your receipts appear here.</div></div></div>') +
        '<div class="note" style="margin-top:16px">' + ic('shield') + '<span>' + TIPS[new Date().getDate() % TIPS.length] + '</span></div>';
    },
    pay: function () {
      var on = S.cfg.enabled, pl = get('payees', []);
      return '<div class="ph"><h1>Send &amp; receive</h1><p>Every payment is recorded on the Pi blockchain, with a professional receipt and the Pi rate in your currency.</p></div>' +
        '<div class="tiles" style="margin-top:14px">' +
        '<button type="button" class="tile" data-act="send"><i>' + ic('send') + '</i><b>Send Pi</b><small>' + (on ? 'To a @username or a wallet address' : 'From your Pi Wallet to any address') + '</small></button>' +
        '<button type="button" class="tile" data-act="receive"><i class="t">' + ic('req') + '</i><b>Receive Pi</b><small>' + (on ? 'Your @username and wallet address' : 'Your wallet address and QR code') + '</small></button></div>' +
        (pl.length ? '<div class="sec"><h2>Recent people</h2></div><div class="chips">' + pl.slice(0, 8).map(function (p) { return '<button type="button" class="chip" data-act="send-to" data-u="' + esc(p) + '">' + esc(toLabel(p)) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="sec"><h2>How it works</h2></div><div class="card"><div class="note gray">' + ic('lock') + '<span>' + (on ? 'Pay inside FinPi (approved in Pi’s window, delivered in seconds, refunded automatically if it cannot be delivered), or pay from your own Pi Wallet.' : 'Fill in the payment in FinPi, pay it from your own Pi Wallet, and FinPi finds it on the Pi blockchain and makes your receipt with the Pi rate.') + ' FinPi never holds your Pi.</span></div></div>' +
        '<div class="tiles" style="margin-top:12px"><button type="button" class="tile" data-act="get-rcpt"><i class="n">' + ic('rcpt') + '</i><b>Get a receipt</b><small>For any Pi payment, from its transaction ID</small></button><button type="button" class="tile" data-act="verify"><i class="a">' + ic('check') + '</i><b>Verify a payment</b><small>Check any transaction on the blockchain</small></button></div>';
    },
    wallet: function () {
      var c = curr();
      return '<div class="ph"><h1>Wallet</h1><p>Live Pi rate in any currency, converter and blockchain tools.</p></div>' +
        '<div class="card" data-p="wchart">' + wChartHTML() + '</div>' +
        '<div class="sec"><h2>Converter</h2><button type="button" data-act="currency">' + esc(c) + ' ▾</button></div>' +
        '<div class="card conv"><label><span>π</span><input id="cv-pi" type="number" inputmode="decimal" value="1" aria-label="Pi"></label><label><span>USD</span><input id="cv-usd" type="number" inputmode="decimal" aria-label="US dollars"></label>' + (c !== 'USD' ? '<label><span>' + esc(c) + '</span><input id="cv-loc" type="number" inputmode="decimal" aria-label="' + esc(cname(c)) + '"></label>' : '') + '</div>' +
        '<div class="sec"><h2>Tools</h2></div><div class="tiles"><button type="button" class="tile" data-act="get-rcpt"><i class="n">' + ic('rcpt') + '</i><b>Get a receipt</b><small>For any Pi payment, from its transaction ID</small></button><button type="button" class="tile" data-act="verify"><i>' + ic('check') + '</i><b>Verify a payment</b><small>Check a transaction on the blockchain</small></button><button type="button" class="tile" data-act="check-addr"><i class="t">' + ic('search') + '</i><b>Check an address</b><small>Balance and payments of any Pi address</small></button><button type="button" class="tile" data-act="receive"><i class="a">' + ic('qr') + '</i><b>My QR code</b><small>Your wallet address to get paid</small></button></div>' +
        '<div class="note gray" style="margin-top:14px">' + ic('info') + '<span>FinPi never holds your Pi. Your Pi stays in your own Pi Wallet.</span></div>';
    },
    activity: function () {
      var R = rcpts();
      var head = '<div class="ph"><h1>Activity</h1><p>Your FinPi receipts, all verifiable on the Pi blockchain.</p></div><div class="seg" role="tablist"><button type="button" data-seg="tx" class="' + (S.seg === 'tx' ? 'on' : '') + '">Transactions</button><button type="button" data-seg="ins" class="' + (S.seg === 'ins' ? 'on' : '') + '">Insights</button></div>';
      if (S.seg === 'ins') return head + insightsHTML();
      var f = S.filter, F = R.map(function (r, i) { return [r, i]; }).filter(function (x) { var r = x[0]; return f === 'all' || (f === 'out' && r.dir === 'out') || (f === 'in' && r.dir === 'in' && r.kind !== 'refund') || (f === 'ref' && r.kind === 'refund'); });
      var out = '', day = '';
      F.forEach(function (x) { var d = new Date(x[0].ts).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); if (d !== day) { if (day) out += '</div>'; out += '<div class="day">' + d + '</div><div class="list">'; day = d; } out += txRow(x[0], x[1]); });
      if (day) out += '</div>';
      return head + '<div class="chips" style="margin-top:12px">' + [['all', 'All'], ['out', 'Sent'], ['in', 'Received'], ['ref', 'Refunds']].map(function (x) { return '<button type="button" class="chip' + (f === x[0] ? ' on' : '') + '" data-flt="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (out || '<div class="list" style="margin-top:14px"><div class="empty">' + ic('rcpt') + '<div>Nothing here yet.</div></div></div>') +
        (R.length ? '<button type="button" class="btn ghost" data-act="csv" style="margin-top:16px">' + ic('down') + 'Export CSV</button>' : '');
    },
    profile: function () {
      var sup = get('supporter', false);
      return '<div class="pcard"><div class="avatar">' + esc(signedIn() ? me().charAt(0) : 'G') + '</div><div class="grow"><b>' + (signedIn() ? '@' + esc(me()) : 'Guest') + '</b><small>' + (get('name', '') ? esc(get('name', '')) + ' · ' : '') + NETN + '</small>' + (sup ? '<div class="badge">' + ic('star') + 'FinPi Supporter</div>' : '') + '</div></div>' +
        (!signedIn() ? '<button type="button" class="btn" data-act="signin" style="margin-top:14px"><span class="pi-dot">π</span>Sign in with Pi</button>' : '') +
        '<div class="sec"><h2>Settings</h2></div><div class="list">' +
        row('edit', 'Name on receipts', get('name', '') || 'Not set', 'name') + row('globe', 'Currency', cname(curr()) + ' (' + curr() + ')', 'currency') +
        row('bell', 'Phone notifications', get('push', false) ? 'On' : 'Off', 'push') + row('pie', 'Monthly budget', get('budget', 0) ? fpi(get('budget', 0)) + ' π' : 'Not set', 'budget') + row('card', 'Wallet address', get('addr', '') ? short(get('addr', '')) : 'Not added', 'addr-set') + '</div>' +
        '<div class="sec"><h2>Security &amp; support</h2></div><div class="list">' +
        row('shield', 'Security center', 'Limits, safety and how FinPi works', 'security') + row('heart', sup ? 'You are a Supporter' : 'Become a Supporter', sup ? 'Thank you!' : '1 π · badge only, no reward', 'supporter') +
        row('mail', 'Help & contact', SUPPORT, 'help') + row('act', 'System status', 'Check that payments are working', 'status') + '</div>' +
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

  /* ── actions ── */
  var A = {
    send: function () { sendSheet(); }, receive: function () { receiveSheet(); }, 'get-rcpt': function () { addTxSheet(null); },
    'send-to': function (el) { sendSheet({ u: el.dataset.u }); },
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
    var a = e.target.closest('[data-act]'); if (a && A[a.dataset.act]) { A[a.dataset.act](a, e); }
  });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); } });

  /* ── start ── */
  function start() {
    if (TEST) { $('#ld-net').textContent = 'Pi Testnet'; }
    $('#signin').onclick = function () { signIn(); };
    $('#explore').onclick = function () { S.guest = true; showApp(); };
    loadPrice(true); paintPrice(); initPi(); loadCfg();
    var u = get('user', null);
    if (u && u.username && window.Pi) { $('#signin-t').textContent = 'Signing in as @' + u.username + '…'; signIn(true).then(function (ok) { if (!ok) $('#signin-t').textContent = 'Sign in with Pi'; }); }
    checkPendingWallet();
    setInterval(function () { if (!document.hidden) { loadPrice(); sync(); checkPendingWallet(); } }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { loadPrice(); sync(); checkPendingWallet(); } });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  window.FinPi = { S: S, render: render, sync: sync, showRcpt: showRcpt, sendSheet: sendSheet };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
