/* FinPi — branded receipt images (PNG). FPReceipt.canvas(spec) → Promise<canvas>; FPReceipt.share(canvas, filename, text). */
(function () {
  'use strict';
  if (window.FPReceipt) return;
  var F = "Poppins,'Segoe UI',Roboto,Arial,sans-serif", M = "'JetBrains Mono',Menlo,Consolas,monospace";
  function loadImg(src) { return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }
  function rr(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
  function wrap(x, v, maxW) {
    v = String(v); if (x.measureText(v).width <= maxW) return [v];
    var words = v.split(' '); if (words.length > 1) {
      var lines = [], cur = '';
      words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
      if (cur) lines.push(cur); if (lines.every(function (l) { return x.measureText(l).width <= maxW; })) return lines.slice(0, 3);
    }
    var out = [], s = '';
    for (var i = 0; i < v.length; i++) { if (x.measureText(s + v[i]).width > maxW) { out.push(s); s = ''; } s += v[i]; }
    if (s) out.push(s); return out.slice(0, 3);
  }
  /* QR code for "scan to verify" — works with either QR library the page has loaded */
  function qrImg(text) { return Promise.resolve(text && window.FPQR ? FPQR.canvas(text, 240, '#0B2A6F', '#FFFFFF') : null); }
  function canvas(r) {
    return Promise.all([loadImg((r.base || '') + 'icons/icon-512.png'), qrImg(r.verify)]).then(function (res) {
      var logo = res[0], qr = res[1];
      var W = 1080, maxW = W - 120 - 400;
      var mx = document.createElement('canvas').getContext('2d');
      var rows = (r.rows || []).filter(function (x) { return x && x[1] != null && x[1] !== ''; }).map(function (row) {
        mx.font = row[2] ? '600 26px ' + M : '700 31px ' + F; return { k: row[0], lines: wrap(mx, row[1], maxW), mono: !!row[2] };
      });
      var rowsH = rows.reduce(function (a, b) { return a + 86 + (b.lines.length - 1) * 38; }, 0);
      var QH = r.verify ? 270 : 0;
      var H = 860 + rowsH + QH + 270, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
      x.fillStyle = '#EEF2F8'; x.fillRect(0, 0, W, H);
      x.save(); rr(x, 60, 60, W - 120, H - 120, 44); x.fillStyle = '#FFFFFF'; x.shadowColor = 'rgba(11,27,51,.14)'; x.shadowBlur = 40; x.fill(); x.restore();
      x.save(); rr(x, 60, 60, W - 120, 360, 44); x.clip(); var g = x.createLinearGradient(60, 60, W - 60, 420); g.addColorStop(0, '#0B2A6F'); g.addColorStop(.65, '#1D4ED8'); g.addColorStop(1, '#0D9488'); x.fillStyle = g; x.fillRect(60, 60, W - 120, 380);
      x.globalAlpha = .08; x.fillStyle = '#5EEAD4'; for (var i = 0; i < 9; i++) { x.beginPath(); x.arc(W - 120, 60, 80 + i * 46, 0, Math.PI * 2); x.lineWidth = 2; x.strokeStyle = '#5EEAD4'; x.stroke(); } x.globalAlpha = 1; x.restore();
      if (logo) x.drawImage(logo, W / 2 - 75, 104, 150, 150);
      x.textAlign = 'center'; x.fillStyle = '#FFFFFF'; x.font = '700 72px ' + F; x.fillText('FinPi', W / 2, 334);
      x.fillStyle = '#5EEAD4'; x.font = '700 32px ' + F; x.fillText('finpi.pi', W / 2, 388);
      x.fillStyle = '#0B1B33'; x.font = '800 44px ' + F; x.fillText(r.title || 'Payment receipt', W / 2, 516);
      var st = r.status || { text: '✓  Completed', ok: true }; x.font = '800 29px ' + F; var sw = Math.max(300, x.measureText(st.text).width + 70);
      x.fillStyle = st.ok ? '#E6F7F4' : '#FFF4E0'; rr(x, W / 2 - sw / 2, 544, sw, 58, 29); x.fill();
      x.fillStyle = st.ok ? '#0F766E' : '#B26B00'; x.fillText(st.text, W / 2, 584);
      x.fillStyle = '#0B1B33'; x.font = '800 116px ' + F; x.fillText(r.amount + ' π', W / 2, 732);
      if (r.sub) { x.fillStyle = '#64748B'; x.font = '600 31px ' + F; x.fillText(r.sub, W / 2, 784); }
      var y = 864; x.textAlign = 'left';
      rows.forEach(function (row) {
        x.fillStyle = '#64748B'; x.font = '600 29px ' + F; x.fillText(row.k, 120, y);
        x.fillStyle = '#0B1B33'; x.font = row.mono ? '600 26px ' + M : '700 31px ' + F; x.textAlign = 'right';
        row.lines.forEach(function (l, j) { x.fillText(l, W - 120, y + j * 38); });
        x.textAlign = 'left'; y += (row.lines.length - 1) * 38 + 34;
        x.strokeStyle = '#E2E8F0'; x.lineWidth = 2; x.beginPath(); x.moveTo(120, y); x.lineTo(W - 120, y); x.stroke(); y += 52;
      });
      if (r.verify) {
        var by = y - 10;
        x.fillStyle = '#F0F7FF'; rr(x, 120, by, W - 240, 230, 24); x.fill(); x.strokeStyle = 'rgba(29,78,216,.22)'; x.lineWidth = 2; x.stroke();
        if (qr) { x.fillStyle = '#FFFFFF'; rr(x, 140, by + 20, 190, 190, 14); x.fill(); x.drawImage(qr, 148, by + 28, 174, 174); }
        var tx0 = qr ? 360 : 150; x.textAlign = 'left';
        x.fillStyle = '#1D4ED8'; x.font = '800 32px ' + F; x.fillText('Scan to verify', tx0, by + 78);
        x.fillStyle = '#475569'; x.font = '500 25px ' + F;
        wrap(x, 'Checks this payment on the public Pi blockchain. An edited receipt will not match.', W - 140 - tx0).slice(0, 3).forEach(function (l, j) { x.fillText(l, tx0, by + 118 + j * 32); });
        x.textAlign = 'center';
      }
      x.textAlign = 'center'; x.fillStyle = '#1D4ED8'; x.font = '800 33px ' + F; x.fillText(r.thanks || 'Thank you for using FinPi', W / 2, H - 214);
      x.fillStyle = '#64748B'; x.font = '500 25px ' + F;
      wrap(x, r.note || 'Check this payment on the Pi blockchain explorer with the Transaction ID.', W - 240).slice(0, 2).forEach(function (l, j) { x.fillText(l, W / 2, H - 164 + j * 32); });
      x.fillText('© FinPi ' + new Date().getFullYear() + ' · finpi.pi', W / 2, H - 92);
      return cv;
    });
  }
  function share(cv, fname, text) {
    cv.toBlob(function (blob) {
      try { var f = new File([blob], fname, { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'FinPi receipt', text: 'FinPi receipt' }).catch(function () {}); return; } } catch (e) {}
      if (navigator.share) navigator.share({ title: 'FinPi receipt', text: text }).catch(function () {}); else window.open('https://wa.me/?text=' + encodeURIComponent(text));
    }, 'image/png');
  }
  window.FPReceipt = { canvas: canvas, share: share };
})();
