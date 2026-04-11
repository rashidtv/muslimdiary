// ✅ Always bump version when UI changes
const CACHE_VERSION = "muslim-daily-v5.0.0";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ✅ Install — Network-first, skipWaiting
self.addEventListener("install", (event) => {
  console.log("📥 SW Install");

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting(); // IMPORTANT
});

// ✅ Activate — delete ALL old caches
self.addEventListener("activate", (event) => {
  console.log("♻️ SW Activate");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => {
            console.log("🗑️ Removing old cache:", key);
            return caches.delete(key);
          })
      )
    )
  );

  self.clients.claim(); // IMPORTANT
});

// ✅ Fetch — *NETWORK FIRST* for JS/CSS/HTML
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Don’t cache API requests
  if (req.url.includes("/api/")) {
    event.respondWith(fetch(req));
    return;
  }

  // For static resources (JS/CSS/HTML), use network-first
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Cache successful responses
        if (networkRes.ok) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(req, networkRes.clone());
          });
        }
        return networkRes.clone();
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(req).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});

// ✅ Manual SKIP_WAITING trigger (for UI refresh)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
