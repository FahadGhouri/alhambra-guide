const CACHE = "alhambra-guide-v1";

const CORE_ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "data/stops.json",
  "data/plan.json",
  "data/tips.json",
  "data/map.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE_ASSETS);
      try {
        const res = await fetch("data/stops.json");
        const stops = await res.json();
        const photoUrls = [];
        stops.forEach((s) => (s.photos || []).forEach((p) => p.src && photoUrls.push(p.src)));
        await cache.addAll(photoUrls);
      } catch (e) {
        // best effort
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.status === 200 && res.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        if (req.mode === "navigate") {
          return caches.match("index.html");
        }
        throw e;
      }
    })()
  );
});
