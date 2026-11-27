/* Cross-Origin Isolation Service Worker (COEP: credentialless)
 * Enables SharedArrayBuffer for multi-threaded WebAssembly AI on static/shared hosts
 * by attaching COEP/CORP headers to same-origin documents, module workers, and WASM assets.
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

  let reqUrl;
  try {
    reqUrl = new URL(req.url);
  } catch {
    return;
  }

  // Only add isolation headers to same-origin responses (HTML, Workers, MJS, WASM);
  // let external CDN/model downloads bypass the service worker untouched.
  if (reqUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        if (
          !response ||
          response.status === 0 ||
          response.type === 'opaque' ||
          response.status === 204 ||
          response.status === 205 ||
          response.status === 304
        ) {
          return response;
        }
        const headers = new Headers(response.headers);
        headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
        headers.set('Cross-Origin-Resource-Policy', 'same-origin');
        if (
          req.mode === 'navigate' ||
          req.destination === 'document' ||
          req.destination === 'iframe' ||
          req.destination === 'worker' ||
          req.destination === 'sharedworker'
        ) {
          headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        }
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      })
      .catch(() => fetch(req))
  );
});
