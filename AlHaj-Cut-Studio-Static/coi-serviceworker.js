/* Cross-Origin Isolation Service Worker (COEP: credentialless)
 * Enables SharedArrayBuffer for multi-threaded WebAssembly AI on static/shared hosts
 * without blocking external CDN modules or AdSense assets.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') {
    return;
  }
  if (req.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        if (!response || response.status === 0 || response.type === 'opaque') {
          return response;
        }
        const headers = new Headers(response.headers);
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      })
      .catch(() => fetch(req))
  );
});
