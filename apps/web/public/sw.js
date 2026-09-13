// NE-ROUTE Service Worker - Offline Caching & Background Sync
const CACHE_NAME = "neroute-v1-cache";
const STATIC_ASSETS = [
  "/",
  "/reports",
  "/manifest.json",
  "/globals.css"
];

// 1. Install event: pre-cache critical static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Pre-caching non-fatal warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate event: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event: Network-first with cache fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET or cross-origin requests
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls: Network first, no offline cache for live dynamic mutations
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match("/reports");
          }
          return new Response("Offline - Cached asset unavailable", {
            status: 503,
            statusText: "Offline"
          });
        });
      })
  );
});
