self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Normalize URLs with ?source=pwa etc. to cached index.html
    if (url.pathname === "/sipsoberleaflet/" || url.pathname === "/sipsoberleaflet/index.html") {
      event.respondWith(
        fetch(request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put("/sipsoberleaflet/index.html", copy));
            return resp;
          })
          .catch(() => caches.match("/sipsoberleaflet/index.html"))
      );
      return;
    }

    // Other same-origin requests: cache-first
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return resp;
          })
      )
    );
  } else {
    // Cross-origin (tiles/CDNs): stale-while-revalidate
    event.respondWith(
      caches.open("runtime-xo").then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((resp) => {
            cache.put(request, resp.clone());
            return resp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
