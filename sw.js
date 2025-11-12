// ===== Sip Sober PWA service worker =====
const BASE = "/sipsoberleaflet/";   // correct for osandss.github.io/sipsoberleaflet/
const VERSION = "v1.0.0";
const CACHE = `sipsober-${VERSION}`;

// Files to cache for offline support
const ASSETS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}debug-map.html`,
  `${BASE}manifest.json`,
  `${BASE}data.json`
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  const isTile =
    url.hostname.startsWith("tile.") ||
    /(\btiles?\b|{z}\/{x}\/{y})/.test(url.pathname);

  const isData =
    url.pathname.endsWith(".json") ||
    url.searchParams.get("format") === "json";

  if (isTile || isData) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});
