/* FinPi Service Worker v7
   - skipWaiting + clients.claim = auto-replaces old SW immediately
   - /legal/ paths: never intercepted, always fetched fresh from server
   - index.html: network-first (always fresh from Cloudflare)
   - Static assets: cache-first for performance
*/
const CACHE = 'finpi-v7';
const STATIC = ['/index.html', '/manifest.json', '/finpi-logo.svg'];

self.addEventListener('install', e => {
  /* Skip waiting immediately — replace old SW right away, no user action needed */
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      /* Delete ALL previous caches (finpi-v1 through finpi-v6) */
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => {
          console.log('[FinPi SW v7] Deleting old cache:', k);
          return caches.delete(k);
        }))
      ),
      /* Claim all clients immediately without waiting for reload */
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  let path;
  try { path = new URL(url).pathname; } catch(err) { return; }

  /* ── NEVER intercept — pass straight through to server ── */
  if (
    path.startsWith('/legal/') ||        /* legal pages — serve from server always */
    path.startsWith('/approve') ||
    path.startsWith('/complete') ||
    path.startsWith('/payment-recovery') ||
    path.includes('.well-known') ||
    url.includes('coingecko') ||
    url.includes('okx.com') ||
    url.includes('gateio') ||
    url.includes('anthropic') ||
    url.includes('qrserver') ||
    e.request.method !== 'GET'
  ) return;

  /* ── index.html — network first, cache fallback ── */
  if (path === '/' || path === '/index.html') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  /* ── Static assets — cache first, network fallback ── */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => null)
  );
});
