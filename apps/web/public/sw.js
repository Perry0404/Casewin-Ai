// CaseWin-NG Service Worker for Offline Support
const CACHE_NAME = "casewin-ng-v1";
const STATIC_CACHE_NAME = "casewin-ng-static-v1";
const DYNAMIC_CACHE_NAME = "casewin-ng-dynamic-v1";

const STATIC_ASSETS = ["/", "/marketplace", "/manifest.json", "/offline.html"];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map((key) => { console.log("[SW] Deleting old cache:", key); return caches.delete(key); })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;
  if (url.hostname.includes("supabase")) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      }).catch(() => caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return caches.match("/offline.html");
      }))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request).then((response) => {
          if (response.ok) caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, response));
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      }).catch(() => new Response("", { status: 503, statusText: "Service Unavailable" }));
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "CACHE_LAWYERS") {
    const lawyersData = event.data.payload;
    caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
      const response = new Response(JSON.stringify(lawyersData), { headers: { "Content-Type": "application/json" } });
      cache.put("/api/lawyers-cache", response);
    });
  }
});

console.log("[SW] Service Worker loaded");
