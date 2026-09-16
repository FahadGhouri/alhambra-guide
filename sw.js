const CACHE = "alhambra-guide-v2";

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

// Requests under these paths rarely change once fetched — safe to serve
// cache-first so offline browsing doesn't refetch large photo files.
const STABLE_PATH_PREFIXES = ["photos/", "icons/"];

function isStable(url) {
  const path = new URL(url).pathname.replace(/^\//, "");
  return STABLE_PATH_PREFIXES.some((p) => path.includes(p));
}

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

  // Stable assets (photos, icons): cache-first, so we don't re-download
  // large files every visit once they're cached for offline use.
  if (isStable(req.url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res && res.status === 200) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      })()
    );
    return;
  }

  // App shell + data (html/js/css/json): network-first, so a redeploy is
  // picked up immediately when online, falling back to cache offline.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res && res.status === 200) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const fallback = await caches.match("index.html");
          if (fallback) return fallback;
        }
        throw e;
      }
    })()
  );
});
